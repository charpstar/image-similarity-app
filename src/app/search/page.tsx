"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";

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

export default function SearchPage() {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [searchType, setSearchType] = useState<"image" | "text">("image");
  const [textQuery, setTextQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      setSelectedImages(files);
      setError(null);
    },
    []
  );

  const handleTextQueryChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setTextQuery(event.target.value);
      setError(null);
    },
    []
  );

  const clearSelection = useCallback(() => {
    setSelectedImages([]);
    setTextQuery("");
    setSearchResults([]);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const searchWithImage = useCallback(async (imageFile: File) => {
    const formData = new FormData();
    formData.append("image", imageFile);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: SearchResponse = await response.json();

      if (data.success && data.results) {
        setSearchResults(data.results);
        setError(null);
      } else {
        setError(data.error || "Search failed");
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      setError(error instanceof Error ? error.message : "Search failed");
      setSearchResults([]);
    }
  }, []);

  const searchWithText = useCallback(async (text: string) => {
    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text,
          queryType: "text",
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: SearchResponse = await response.json();

      if (data.success && data.results) {
        setSearchResults(data.results);
        setError(null);
      } else {
        setError(data.error || "Search failed");
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      setError(error instanceof Error ? error.message : "Search failed");
      setSearchResults([]);
    }
  }, []);

  const handleSearch = useCallback(async () => {
    if (searchType === "image" && selectedImages.length === 0) {
      setError("Please select an image to search");
      return;
    }

    if (searchType === "text" && !textQuery.trim()) {
      setError("Please enter a text query");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (searchType === "image") {
        await searchWithImage(selectedImages[0]);
      } else {
        await searchWithText(textQuery.trim());
      }
    } finally {
      setIsLoading(false);
    }
  }, [searchType, selectedImages, textQuery, searchWithImage, searchWithText]);

  const handleMultiImageSearch = useCallback(async () => {
    if (selectedImages.length < 2) {
      setError("Please select at least 2 images for multi-image search");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // For multi-image search, we'll average the embeddings
      const embeddings: number[][] = [];

      for (const imageFile of selectedImages) {
        const formData = new FormData();
        formData.append("image", imageFile);

        const response = await fetch("/api/embed", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to generate embedding for ${imageFile.name}`);
        }

        const data = await response.json();
        if (data.embedding) {
          embeddings.push(data.embedding);
        }
      }

      if (embeddings.length === 0) {
        throw new Error("Failed to generate embeddings for any image");
      }

      // Average the embeddings
      const avgEmbedding = embeddings[0].map(
        (_, i) =>
          embeddings.reduce((sum, emb) => sum + emb[i], 0) / embeddings.length
      );

      // Search with averaged embedding
      const searchResponse = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          embedding: avgEmbedding,
          queryType: "embedding",
        }),
      });

      if (!searchResponse.ok) {
        throw new Error(`HTTP error! status: ${searchResponse.status}`);
      }

      const data: SearchResponse = await searchResponse.json();

      if (data.success && data.results) {
        setSearchResults(data.results);
        setError(null);
      } else {
        setError(data.error || "Multi-image search failed");
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Multi-image search error:", error);
      setError(
        error instanceof Error ? error.message : "Multi-image search failed"
      );
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedImages]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI Image Similarity Search
          </h1>
          <p className="text-lg text-gray-600">
            Upload an image or enter text to find similar images
          </p>
        </div>

        {/* Search Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-wrap gap-4 items-center mb-6">
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="image"
                  checked={searchType === "image"}
                  onChange={(e) =>
                    setSearchType(e.target.value as "image" | "text")
                  }
                  className="mr-2"
                />
                Image Search
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="text"
                  checked={searchType === "text"}
                  onChange={(e) =>
                    setSearchType(e.target.value as "image" | "text")
                  }
                  className="mr-2"
                />
                Text Search
              </label>
            </div>
          </div>

          {searchType === "image" ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Image(s)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              {selectedImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {selectedImages.map((file, index) => (
                    <div key={index} className="relative">
                      <Image
                        src={URL.createObjectURL(file)}
                        alt={`Selected ${index + 1}`}
                        width={200}
                        height={200}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <div
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm cursor-pointer"
                        onClick={() =>
                          setSelectedImages((prev) =>
                            prev.filter((_, i) => i !== index)
                          )
                        }
                      >
                        ×
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={handleSearch}
                  disabled={isLoading || selectedImages.length === 0}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Searching..." : "Search"}
                </button>

                {selectedImages.length >= 2 && (
                  <button
                    onClick={handleMultiImageSearch}
                    disabled={isLoading}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Searching..." : "Multi-Image Search"}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Text Query
                </label>
                <input
                  type="text"
                  value={textQuery}
                  onChange={handleTextQueryChange}
                  placeholder="Enter a description of the image you're looking for..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={handleSearch}
                disabled={isLoading || !textQuery.trim()}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Searching..." : "Search"}
              </button>
            </div>
          )}

          <button
            onClick={clearSelection}
            className="mt-4 text-gray-600 hover:text-gray-800 underline"
          >
            Clear Selection
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Results */}
        {searchResults.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Search Results ({searchResults.length})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {searchResults.map((result) => (
                <div key={result.id} className="group relative">
                  <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
                    <Image
                      src={result.imageUrl}
                      alt={result.metadata.filename}
                      width={200}
                      height={200}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    <p className="font-medium truncate">
                      {result.metadata.filename}
                    </p>
                    <p className="text-xs text-gray-500">
                      Similarity: {(result.similarity * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
