import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get("image") as File;

    if (!imageFile) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      );
    }

    // Convert image to base64
    const arrayBuffer = await imageFile.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    // Call Python service for embedding
    const pythonServiceUrl =
      process.env.PYTHON_SERVICE_URL || "http://localhost:8001";

    const response = await fetch(`${pythonServiceUrl}/embed`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_data: base64,
      }),
    });

    if (!response.ok) {
      const errorData = (await response.json()) as { error: string };
      return NextResponse.json(
        { error: errorData.error || "Failed to generate embedding" },
        { status: response.status }
      );
    }

    const data = (await response.json()) as { embedding: number[] };
    return NextResponse.json(data);
  } catch (error) {
    console.error("Embedding generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
