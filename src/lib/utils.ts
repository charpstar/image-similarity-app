import axios from "axios";
import { SearchResponse, UploadResponse } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const PYTHON_SERVICE_URL =
  process.env.PYTHON_SERVICE_URL || "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

export const pythonServiceClient = axios.create({
  baseURL: PYTHON_SERVICE_URL,
  timeout: 30000,
});

export async function uploadImage(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("image", file);

  try {
    const response = await apiClient.post("/api/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Upload error:", error);
    return {
      success: false,
      error: "Failed to upload image",
    };
  }
}

export async function searchSimilarImages(
  imageFile: File
): Promise<SearchResponse> {
  const formData = new FormData();
  formData.append("image", imageFile);

  try {
    const response = await apiClient.post("/api/search", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Image search error:", error);
    return {
      success: false,
      results: [],
      totalResults: 0,
      searchTime: 0,
      error: "Failed to search similar images",
      queryType: "image",
    };
  }
}

export async function searchWithText(text: string): Promise<SearchResponse> {
  try {
    const response = await apiClient.post(
      "/api/search",
      {
        text: text,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Text search error:", error);
    return {
      success: false,
      results: [],
      totalResults: 0,
      searchTime: 0,
      error: "Failed to search with text",
      queryType: "text",
    };
  }
}

export async function checkServiceHealth(): Promise<{
  status: string;
  pythonService: boolean;
  error?: string;
}> {
  try {
    const response = await apiClient.get("/api/health");
    const data = response.data;

    return {
      status: data.status,
      pythonService: data.services?.python?.status === "healthy",
      error: data.services?.python?.error,
    };
  } catch (error) {
    console.error("Health check error:", error);
    return {
      status: "unhealthy",
      pythonService: false,
      error: "Failed to check service health",
    };
  }
}

export function validateImageFile(file: File): {
  valid: boolean;
  error?: string;
} {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  if (file.size > maxSize) {
    return { valid: false, error: "File size must be less than 10MB" };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Only JPEG, PNG, and WebP images are allowed",
    };
  }

  return { valid: true };
}

export function createImagePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error("Failed to create preview"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export function formatSearchTime(time: number): string {
  if (time < 1000) {
    return `${time}ms`;
  } else {
    return `${(time / 1000).toFixed(2)}s`;
  }
}

export function getSimilarityColor(similarity: number): string {
  if (similarity >= 0.8) return "text-green-600";
  if (similarity >= 0.6) return "text-yellow-600";
  return "text-red-600";
}

export function getSimilarityText(similarity: number): string {
  if (similarity >= 0.8) return "Very Similar";
  if (similarity >= 0.6) return "Similar";
  if (similarity >= 0.4) return "Somewhat Similar";
  return "Not Similar";
}
