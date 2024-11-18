import { ChatGroq } from "@langchain/groq";
import { State, Update } from "./graph";
import { z } from "zod";
import { prisma } from "./db";
import { placeOrder } from "./utils";

const llm = new ChatGroq({
  temperature: 0,
  model: "llama-3.2-90b-vision-preview",
  apiKey: process.env.GROQ_API_KEY!,
});
export const processMessageNode = async (state: State): Promise<Update> => {
  const structuredLlm = llm.withStructuredOutput(
    z.object({
      type: z
        .enum(["Order", "Feedback", "Recommendation", "Question", "Support"])
        .describe(
          "The type of the email it can be either 'Support', 'Feedback', 'Spam' or 'Other'"
        ),
      reason: z.string().describe("The reason why you selected the type"),
    })
  );

  const res = await structuredLlm.invoke([
    [
      "system",
      `You are an expert message classifier AI. 
            You are given a message and you give them one of the avaliable labels.
            You answer with a json of this structure: {
              type: 'Order' | 'Feedback' | 'Recommendation' | 'Question' | 'Support',
              reason: string
            }`,
    ],
    ["human", state.message.text],
  ]);

  console.log("Message control hit", res);

  return {
    messageType: res.type,
    message: {
      text: res.reason,
      role: "system",
    },
  };
};

export const processFeedbackNode = async (state: State): Promise<Update> => {
  const structuredLlm = llm.withStructuredOutput(
    z.object({
      isPositive: z.boolean(),
      text: z.string(),
      reason: z.string().describe("The reason why you selected the type"),
    })
  );

  const res = await structuredLlm.invoke([
    [
      "system",
      `You are an expert feedback classifier AI. 
            You are given a feedback message and you classify it as positive or negative.
            And you give a reason for your classification.
            You answer with a json of this structure: {
              isPositive: boolean,
              text: string,
              reason: string
            }`,
    ],
    ["human", state.message.text],
  ]);

  console.log("Feedback control hit", res);

  return {
    feedback: {
      isPositive: res.isPositive,
      text: state.message,
    },
  };
};

export const processSupportNode = async (state: State): Promise<Update> => {
  const structuredLlm = llm.withStructuredOutput(
    z.object({
      supportType: z.enum(["Bug", "TechnicalQuestion"]),
      bug: z.object({
        description: z.string(),
        severity: z.string(),
      }),
      technicalQuestion: z.object({
        question: z.string(),
        answer: z.string(),
        links: z.array(z.string()),
        answerFound: z.boolean(),
      }),
      reason: z.string().describe("The reason why you selected the type"),
    })
  );

  const res = await structuredLlm.invoke([
    [
      "system",
      `You are an expert support classifier AI. 
                You are given a support message and you classify it as a bug or technical question.
                And you give a reason for your classification.
                You answer with a json of this structure: {
                supportType: 'Bug' | 'TechnicalQuestion',
                bug: {
                    description: string,
                    severity: string
                },
                technicalQuestion: {
                    question: string,
                    answer: string,
                    links: string[],
                    answerFound: boolean
                },
                reason: string
                }`,
    ],
    ["human", state.message.text],
  ]);

  console.log("Support control hit", res);

  return {
    support: res,
  };
};

export const processRecommendationNode = async (
  state: State
): Promise<Update> => {
  const structuredLlm = llm.withStructuredOutput(
    z.object({
      type: z.enum(["Light", "Medium", "Heavy"]),
      reply: z.string(),
      reason: z.string().describe("The reason why you selected the type"),
    })
  );

  const data = await prisma.product.findMany();

  const res = await structuredLlm.invoke([
    [
      "system",
      `You are an expert recommendation classifier AI. 
                You have the following data: ${JSON.stringify(data)}.
                Even when user asks what to buy, you should recommend a product from the data.
                You are given a message and you give them one of the avaliable labels.
                In the recommendation property, you should recommend a product from the data.
                Reply in a friendly and responsive manner, where you are eager to help the user.
                You answer with a json of this structure: {
                    type: 'Light' | 'Medium' | 'Heavy',
                    reply: string,
                    reason: string
                }`,
    ],
    ["human", state.message.text],
  ]);

  console.log("Recommendation control hit", res);

  return {
    recommendationType: res.type,
    message: {
      text: res.reply,
      role: "system",
    },
  };
};

const orderFunctions = {
  placeOrder: {
    name: "placeOrder",
    description: "Place a new order in the system",
    parameters: {
      type: "object",
      required: ["productId", "quantity"],
      properties: {
        productId: { type: "string", description: "ID of the product" },
        quantity: { type: "number", description: "Quantity to order" },
      },
    },
  },
};

export const processOrderNode = async (state: State): Promise<Update> => {
  try {
    const structuredLlm = llm.withStructuredOutput(
      z.object({
        function: z.enum(["placeOrder"]),
        parameters: z.object({
          productId: z.string(),
          quantity: z.number(),
        }),
        reply: z.string().describe("Your reply to the user"),
        reason: z.string().describe("The reason why you selected the type"),
      })
    );

    const res = await structuredLlm.invoke([
      [
        "system",
        `You are an expert order classifier AI. 
                You are given a message and you classify it as an order.
                You should place the order in the system.

                You have access to product data: ${JSON.stringify(
                  await prisma.product.findMany()
                )}

                utilise the product data to match the productId and quantity to place the order.

                Do not ask further questions to the user, just place the order.

                You answer with a json of this structure: {
                    function: 'placeOrder',
                    parameters: {
                        productId: string,
                        quantity: number
                    },
                    reply:string,
                    reason: string
                }`,
      ],
      ["human", state.message.text],
    ]);

    try {
      if (res.function === "placeOrder") {
        const order = await placeOrder(
          res.parameters.productId,
          res.parameters.quantity
        );

        return {
          order: {
            product: order?.productId || "",
            quantity: order?.quantity || 0,
            status: `Order placed successfully! Order ID: ${order?.id}`,
            total: order?.total || 0,
          },
          message: {
            text: res.reply,
            role: "system",
          },
        };
      }
    } catch (orderError) {
      return {
        order: {
          product: res.parameters.productId,
          quantity: res.parameters.quantity,
          status: `Failed to place order: ${orderError}`,
          total: 0,
        },
        message: {
          text: `${res.reply}\nError: ${orderError}`,
          role: "system",
        },
      };
    }

    return {
      message: {
        text: res.reply,
        role: "system",
      },
    };
  } catch (error) {
    console.error("Order processing error:", error);
    return {
      message: {
        text: "Sorry, there was an error processing your order.",
        role: "system",
      },
    };
  }
};
