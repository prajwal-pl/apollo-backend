import { createGraph } from "@/lib/graph";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { message } = (await req.json()) as { message: string };
  try {
    const graph = await createGraph();

    const result = await graph.invoke({
      message: {
        text: message,
        role: "human",
      },
    });

    console.log("result: ", result);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error(error);
  }
}
