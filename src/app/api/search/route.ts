import { NextRequest, NextResponse } from "next/server";

// Python service configuration
const PYTHON_SERVICE_URL =
  process.env.PYTHON_SERVICE_URL || "https://your-python-backend.vercel.app";
const API_TIMEOUT = parseInt(process.env.API_TIMEOUT || "30000");
const MAX_FILE_SIZE = parseInt(process.env.MAX_IMAGE_SIZE || "10485760"); // 10MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface SearchResult {
  id: string;
  imageUrl: string;
  similarity: number;
  metadata: {
    filename: string;
    size: number;
    uploadedAt: string;
  };
}

interface SearchResponse {
  success: boolean;
  results?: SearchResult[];
  total_results?: number;
  error?: string;
}

interface PythonSearchResult {
  index: number;
  filename: string;
  similarity: number;
  distance: number;
}

interface PythonSearchResponse {
  success: boolean;
  results?: PythonSearchResult[];
  total_results?: number;
  error?: string;
}

async function callPythonService(
  endpoint: string,
  data: Record<string, unknown>,
  timeout: number = API_TIMEOUT
): Promise<PythonSearchResponse> {
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
  try {
    // Search with image embedding
    const searchResponse = await callPythonService("/search", {
      embedding: imageData,
    });

    if (!searchResponse.success || !searchResponse.results) {
      throw new Error(searchResponse.error || "Search failed");
    }

    // Transform results to match our interface
    const results: SearchResult[] = (searchResponse.results || []).map(
      (result: PythonSearchResult) => ({
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
      total_results: results.length,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function searchWithText(text: string): Promise<SearchResponse> {
  try {
    // Search with text query
    const searchResponse = await callPythonService("/search", {
      text: text,
    });

    if (!searchResponse.success || !searchResponse.results) {
      throw new Error(searchResponse.error || "Search failed");
    }

    // Transform results to match our interface
    const results: SearchResult[] = (searchResponse.results || []).map(
      (result: PythonSearchResult) => ({
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
      total_results: results.length,
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
      const queryType = formData.get("queryType") as string;

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

    // Handle JSON data
    else if (contentType.includes("application/json")) {
      const body = await request.json();
      const { text, embedding, queryType } = body;

      // Handle text search
      if (text && queryType === "text") {
        const result = await searchWithText(text);
        if (result.success) {
          return NextResponse.json(result);
        } else {
          return NextResponse.json(result, { status: 500 });
        }
      }

      // Handle embedding search
      else if (embedding && queryType === "embedding") {
        const result = await searchWithImage(embedding);
        if (result.success) {
          return NextResponse.json(result);
        } else {
          return NextResponse.json(result, { status: 500 });
        }
      }

      // No valid search parameters
      else {
        return NextResponse.json(
          { success: false, error: "Either text or image_data is required" },
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
            "Unsupported content type. Use multipart/form-data for images or application/json for text/embedding.",
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Search API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
