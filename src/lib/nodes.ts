import { ChatGroq } from "@langchain/groq";
import { State, Update } from "./graph";
import { z } from "zod";
import { prisma } from "./db";

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
                You have the following data: ${JSON.stringify(data)}
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
