export type Message = {
  text: string;
  role: string;
  memory?: any;
};

export type InputClassifier =
  | "Recommendation"
  | "Feedback"
  | "Support"
  | "Question"
  | "Order";

export type RecommendationType = "Light" | "Medium" | "Heavy";

export type Feedback = {
  text: Message;
  isPositive: boolean;
};

type SupportType = "Bug" | "TechnicalQuestion";

export type Support = {
  userId?: string;
  supportType: SupportType;
  bug?: {
    description: string;
    severity: string;
  };
  technicalQuestion?: {
    question: string;
    answer?: string;
    links: string[];
    answerFound: boolean;
  };
};

export type Order = {
  product: string;
  quantity: number;
  total: number;
  status: string;
};
