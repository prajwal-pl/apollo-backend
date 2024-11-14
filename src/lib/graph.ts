import { Annotation, StateGraph } from "@langchain/langgraph";
import {
  Feedback,
  InputClassifier,
  Message,
  Order,
  RecommendationType,
  Support,
} from "../../types/graph-types";
import { processMessageEdge } from "./edges";
import { processMessageNode } from "./nodes";

const GraphState = Annotation.Root({
  message: Annotation<Message>(),
  messageType: Annotation<InputClassifier>(),
  recommendationType: Annotation<RecommendationType>(),
  feedback: Annotation<Feedback>(),
  support: Annotation<Support>(),
  order: Annotation<Order>(),
});

export type State = typeof GraphState.State;
export type Update = typeof GraphState.Update;

export const createGraph = () => {
  const workflow = new StateGraph(GraphState)
    .addNode("processMessage", processMessageNode)
    .addNode("processFeedback", {})
    .addNode("processSupport", {})
    .addNode("processOrder", {})
    .addNode("processRecommendation", {})

    .addEdge("__start__", "processMessage")
    .addConditionalEdges("processMessage", processMessageEdge);

  const graph = workflow.compile();

  return graph;
};
