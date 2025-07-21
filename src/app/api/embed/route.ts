import { NextRequest, NextResponse } from "next/server";

// Python service configuration
const PYTHON_SERVICE_URL =
  process.env.PYTHON_SERVICE_URL || "http://localhost:8001";
const API_TIMEOUT = parseInt(process.env.API_TIMEOUT || "30000");
const MAX_FILE_SIZE = parseInt(process.env.MAX_IMAGE_SIZE || "10485760"); // 10MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface EmbedResponse {
  success: boolean;
  embedding?: number[];
  embedding_norm?: number;
  error?: string;
}

async function callPythonService(
  endpoint: string,
  data: any,
  timeout: number = API_TIMEOUT
): Promise<any> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${PYTHON_SERVICE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Python service error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timeout");
    }
    throw error;
  }
}

function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: "Only JPEG, PNG, and WebP images are allowed",
    };
  }

  return { valid: true };
}

async function imageToBase64(file: File): Promise<string> {
  // Convert File to ArrayBuffer first
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  // Convert to base64
  let binary = "";
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  const base64 = btoa(binary);

  // Return data URL
  return `data:${file.type};base64,${base64}`;
}

async function generateEmbedding(imageData: string): Promise<EmbedResponse> {
  try {
    // Generate embedding from image
    const embedResponse = await callPythonService("/embed/image", {
      image_data: imageData,
    });

    if (!embedResponse.embedding) {
      throw new Error("Failed to generate image embedding");
    }

    return {
      success: true,
      embedding: embedResponse.embedding,
      embedding_norm: embedResponse.embedding_norm,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";

    // Handle multipart form data (image upload)
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("image") as File;

      if (!file) {
        return NextResponse.json(
          { success: false, error: "No image file provided" },
          { status: 400 }
        );
      }

      // Validate file
      const validation = validateImageFile(file);
      if (!validation.valid) {
        return NextResponse.json(
          { success: false, error: validation.error },
          { status: 400 }
        );
      }

      // Convert image to base64
      const imageData = await imageToBase64(file);

      // Generate embedding
      const result = await generateEmbedding(imageData);

      if (result.success) {
        return NextResponse.json(result);
      } else {
        return NextResponse.json(result, { status: 500 });
      }
    }

    // Handle JSON data (for testing purposes)
    else if (contentType.includes("application/json")) {
      const body = await request.json();

      if (body.image_data) {
        const imageData = body.image_data;

        if (!imageData || typeof imageData !== "string") {
          return NextResponse.json(
            { success: false, error: "Image data is required" },
            { status: 400 }
          );
        }

        // Generate embedding
        const result = await generateEmbedding(imageData);

        if (result.success) {
          return NextResponse.json(result);
        } else {
          return NextResponse.json(result, { status: 500 });
        }
      }

      // No image data provided
      else {
        return NextResponse.json(
          { success: false, error: "Image data is required" },
          { status: 400 }
        );
      }
    }

    // Unsupported content type
    else {
      return NextResponse.json(
        {
          success: false,
          error:
            "Unsupported content type. Use multipart/form-data for images or application/json for image data.",
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Embed API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
