export interface SearchResult {
  id: string;
  imageUrl: string;
  similarity: number;
  metadata?: {
    filename: string;
    size: number;
    uploadedAt: string;
  };
}

export interface SearchResponse {
  success: boolean;
  results: SearchResult[];
  totalResults: number;
  searchTime: number;
  error?: string;
  queryType: "image" | "text";
}

export interface UploadResponse {
  success: boolean;
  imageId?: string;
  error?: string;
}

export interface ImageUpload {
  file: File;
  preview?: string;
  uploading: boolean;
  error?: string;
}

export interface ServiceHealth {
  status: string;
  pythonService: boolean;
  error?: string;
}
