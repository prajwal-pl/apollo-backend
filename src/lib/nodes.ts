import { ChatGroq } from "@langchain/groq";
import { State, Update } from "./graph";
import { z } from "zod";

export const processMessageNode = async (state: State): Promise<Update> => {
  const llm = new ChatGroq({
    temperature: 0,
    model: "llama-3.2-90b-vision-preview",
    apiKey: process.env.GROQ_API_KEY!,
  });

  const structuredLlm = llm.withStructuredOutput(
    z.object({
      type: z
        .enum(["Order", "Feedback", "Recommendation", "Question", "Support"])
        .describe(
          "The type of the email it can be either 'Support', 'Feedback', 'Spam' or 'Other'"
        ),
      run: z.function(),
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

  return {
    message: {
      text: res.reason,
      role: "system",
    },
  };
};
