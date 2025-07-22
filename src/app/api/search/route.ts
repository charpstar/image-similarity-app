import { NextRequest, NextResponse } from "next/server";
import { SearchResult } from "@/types";

// Python service configuration
const PYTHON_SERVICE_URL =
  process.env.PYTHON_SERVICE_URL || "https://your-python-backend.vercel.app";
const API_TIMEOUT = parseInt(process.env.API_TIMEOUT || "30000");
const MAX_FILE_SIZE = parseInt(process.env.MAX_IMAGE_SIZE || "10485760"); // 10MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface SearchResponse {
  success: boolean;
  results: SearchResult[];
  totalResults: number;
  searchTime: number;
  error?: string;
  queryType: "image" | "text" | "embedding";
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

async function searchWithImage(imageData: string): Promise<SearchResponse> {
  const startTime = Date.now();

  try {
    // Generate embedding from image
    const embedResponse = await callPythonService("/embed/image", {
      image_data: imageData,
    });

    if (!embedResponse.embedding) {
      throw new Error("Failed to generate image embedding");
    }

    // Search for similar images
    const searchResponse = await callPythonService("/search", {
      embedding: embedResponse.embedding,
    });

    const searchTime = Date.now() - startTime;

    // Debug: Log the response structure
    console.log("Search response:", JSON.stringify(searchResponse, null, 2));

    // Transform results to match our interface
    const results: SearchResult[] = (searchResponse.results || []).map(
      (result: any) => ({
        id: result.index.toString(),
        imageUrl: `https://drive.charpstar.net/indexing-test/images/${result.filename}`, // Use CDN URLs
        similarity: result.similarity,
        metadata: {
          filename: result.filename,
          size: 0, // We don't have this info from Python service
          uploadedAt: new Date().toISOString(),
        },
      })
    );

    return {
      success: true,
      results,
      totalResults: searchResponse.total_results,
      searchTime,
      queryType: "image",
    };
  } catch (error) {
    const searchTime = Date.now() - startTime;
    return {
      success: false,
      results: [],
      totalResults: 0,
      searchTime,
      error: error instanceof Error ? error.message : "Unknown error",
      queryType: "image",
    };
  }
}

async function searchWithText(text: string): Promise<SearchResponse> {
  const startTime = Date.now();

  try {
    // Generate embedding from text
    const embedResponse = await callPythonService("/embed/text", {
      text: text,
    });

    if (!embedResponse.embedding) {
      throw new Error("Failed to generate text embedding");
    }

    // Search for similar images
    const searchResponse = await callPythonService("/search", {
      embedding: embedResponse.embedding,
    });

    const searchTime = Date.now() - startTime;

    // Debug: Log the response structure
    console.log(
      "Text search response:",
      JSON.stringify(searchResponse, null, 2)
    );

    // Transform results to match our interface
    const results: SearchResult[] = (searchResponse.results || []).map(
      (result: any) => ({
        id: result.index.toString(),
        imageUrl: `/api/images/${result.filename}`,
        similarity: result.similarity,
        metadata: {
          filename: result.filename,
          size: 0,
          uploadedAt: new Date().toISOString(),
        },
      })
    );

    return {
      success: true,
      results,
      totalResults: searchResponse.total_results,
      searchTime,
      queryType: "text",
    };
  } catch (error) {
    const searchTime = Date.now() - startTime;
    return {
      success: false,
      results: [],
      totalResults: 0,
      searchTime,
      error: error instanceof Error ? error.message : "Unknown error",
      queryType: "text",
    };
  }
}

async function searchWithEmbedding(
  embedding: number[]
): Promise<SearchResponse> {
  const startTime = Date.now();

  try {
    // Search for similar images using the provided embedding
    const searchResponse = await callPythonService("/search", {
      embedding: embedding,
    });

    const searchTime = Date.now() - startTime;

    // Debug: Log the response structure
    console.log(
      "Embedding search response:",
      JSON.stringify(searchResponse, null, 2)
    );

    // Transform results to match our interface
    const results: SearchResult[] = (searchResponse.results || []).map(
      (result: any) => ({
        id: result.index.toString(),
        imageUrl: `https://drive.charpstar.net/indexing-test/images/${result.filename}`, // Use CDN URLs
        similarity: result.similarity,
        metadata: {
          filename: result.filename,
          size: 0,
          uploadedAt: new Date().toISOString(),
        },
      })
    );

    return {
      success: true,
      results,
      totalResults: searchResponse.total_results,
      searchTime,
      queryType: "embedding",
    };
  } catch (error) {
    const searchTime = Date.now() - startTime;
    return {
      success: false,
      results: [],
      totalResults: 0,
      searchTime,
      error: error instanceof Error ? error.message : "Unknown error",
      queryType: "embedding",
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

      // Search with image
      const result = await searchWithImage(imageData);

      if (result.success) {
        return NextResponse.json(result);
      } else {
        return NextResponse.json(result, { status: 500 });
      }
    }

    // Handle JSON data (text query or image data)
    else if (contentType.includes("application/json")) {
      const body = await request.json();

      // Check if it's a text query
      if (body.text) {
        const text = body.text;

        if (!text || typeof text !== "string" || text.trim().length === 0) {
          return NextResponse.json(
            { success: false, error: "Text query is required" },
            { status: 400 }
          );
        }

        if (text.length > 1000) {
          return NextResponse.json(
            {
              success: false,
              error: "Text query too long (max 1000 characters)",
            },
            { status: 400 }
          );
        }

        // Search with text
        const result = await searchWithText(text.trim());

        if (result.success) {
          return NextResponse.json(result);
        } else {
          return NextResponse.json(result, { status: 500 });
        }
      }

      // Check if it's image data (for testing purposes)
      else if (body.image_data) {
        const imageData = body.image_data;

        if (!imageData || typeof imageData !== "string") {
          return NextResponse.json(
            { success: false, error: "Image data is required" },
            { status: 400 }
          );
        }

        // Search with image
        const result = await searchWithImage(imageData);

        if (result.success) {
          return NextResponse.json(result);
        } else {
          return NextResponse.json(result, { status: 500 });
        }
      }

      // Check if it's embedding data (for multi-image search)
      else if (body.embedding) {
        const embedding = body.embedding;

        if (!embedding || !Array.isArray(embedding)) {
          return NextResponse.json(
            { success: false, error: "Valid embedding array is required" },
            { status: 400 }
          );
        }

        // Search with embedding
        const result = await searchWithEmbedding(embedding);

        if (result.success) {
          return NextResponse.json(result);
        } else {
          return NextResponse.json(result, { status: 500 });
        }
      }

      // Neither text, image_data, nor embedding provided
      else {
        return NextResponse.json(
          {
            success: false,
            error: "Either text, image_data, or embedding is required",
          },
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
            "Unsupported content type. Use multipart/form-data for images or application/json for text queries.",
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Search API error:", error);

    return NextResponse.json(
      {
        success: false,
        results: [],
        totalResults: 0,
        searchTime: 0,
        error: error instanceof Error ? error.message : "Internal server error",
        queryType: "unknown",
      },
      { status: 500 }
    );
  }
}
