import { State } from "./graph";

export const processMessageEdge = (
  state: State
):
  | "__end__"
  | "processRecommendation"
  | "processFeedback"
  | "processSupport"
  | "processOrder"
  | "processQuestion" => {
  switch (state.messageType) {
    case "Recommendation":
      return "processRecommendation";
    case "Feedback":
      return "processFeedback";
    case "Support":
      return "processSupport";
    case "Order":
      return "processOrder";
    case "Question":
      return "processQuestion";
    default:
      return "__end__";
  }
};
