import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json",
};

export async function GET(req: NextRequest) {
  try {
    const data = await prisma.product.findMany();
    console.log(data);
    if (!data) {
      return new NextResponse(JSON.stringify({ message: "No data found" }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    return NextResponse.json(data, {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error(error);
    return new NextResponse(
      JSON.stringify({
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}
