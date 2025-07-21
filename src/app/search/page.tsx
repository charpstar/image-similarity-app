"use client";

import React, { useState, useRef } from "react";
import { SearchResult } from "@/types";

export default function SearchPage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTime, setSearchTime] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles: File[] = [];
    const validUrls: string[] = [];

    files.forEach((file) => {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please select valid image files");
        return;
      }

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB");
        return;
      }

      validFiles.push(file);
      const url = URL.createObjectURL(file);
      validUrls.push(url);
    });

    setSelectedFiles(validFiles);
    setPreviewUrls(validUrls);
    setError(null);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    const validFiles: File[] = [];
    const validUrls: string[] = [];

    files.forEach((file) => {
      if (file.type.startsWith("image/")) {
        if (file.size > 10 * 1024 * 1024) {
          setError("File size must be less than 10MB");
          return;
        }
        validFiles.push(file);
        const url = URL.createObjectURL(file);
        validUrls.push(url);
      } else {
        setError("Please select valid image files");
      }
    });

    setSelectedFiles(validFiles);
    setPreviewUrls(validUrls);
    setError(null);
  };

  const handleSearch = async () => {
    if (selectedFiles.length === 0) return;

    setIsSearching(true);
    setError(null);
    setSearchResults([]);

    try {
      // If multiple images, combine their embeddings
      if (selectedFiles.length > 1) {
        await handleMultiImageSearch();
      } else {
        await handleSingleImageSearch();
      }
    } catch (error) {
      setError("Failed to perform search. Please try again.");
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSingleImageSearch = async () => {
    const formData = new FormData();
    formData.append("image", selectedFiles[0]);

    const startTime = Date.now();
    const response = await fetch("/api/search", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      setSearchResults(data.results);
      setSearchTime(data.searchTime);
    } else {
      setError(data.error || "Search failed");
    }
  };

  const handleMultiImageSearch = async () => {
    // Create embeddings for all images
    const embeddings: number[][] = [];

    for (const file of selectedFiles) {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/embed", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to create embedding");
      }

      const data = await response.json();
      embeddings.push(data.embedding);
    }

    // Average the embeddings to create a combined representation
    const combinedEmbedding = embeddings[0].map(
      (_, index) =>
        embeddings.reduce((sum, emb) => sum + emb[index], 0) / embeddings.length
    );

    // Search with combined embedding
    const startTime = Date.now();
    const searchResponse = await fetch("/api/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ embedding: combinedEmbedding }),
    });

    const data = await searchResponse.json();

    if (data.success) {
      setSearchResults(data.results);
      setSearchTime(data.searchTime);
    } else {
      setError(data.error || "Search failed");
    }
  };

  const handleTextSearch = async (text: string) => {
    setIsSearching(true);
    setError(null);
    setSearchResults([]);

    try {
      const startTime = Date.now();
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      if (data.success) {
        setSearchResults(data.results);
        setSearchTime(data.searchTime);
      } else {
        setError(data.error || "Search failed");
      }
    } catch (error) {
      setError("Failed to perform search. Please try again.");
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSelection = () => {
    setSelectedFiles([]);
    setPreviewUrls([]);
    setError(null);
    setSearchResults([]);
    setSearchTime(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newUrls = previewUrls.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    setPreviewUrls(newUrls);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Image Similarity Search
          </h1>
          <p className="text-lg text-gray-600">
            Upload one or multiple images to find similar products in our
            database
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              selectedFiles.length > 0
                ? "border-green-300 bg-green-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {previewUrls.length === 0 ? (
              <>
                <div className="mb-4">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="text-sm text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                  >
                    <span>Upload images</span>
                    <input
                      ref={fileInputRef}
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      multiple
                      onChange={handleFileSelect}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">
                  PNG, JPG, WEBP up to 10MB each. Upload multiple images for
                  better results.
                </p>
              </>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative">
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg shadow-md"
                      />
                      <button
                        onClick={() => removeFile(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        ×
                      </button>
                      <div className="text-xs text-gray-600 mt-1">
                        {selectedFiles[index]?.name}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-sm text-gray-600">
                  <p className="font-medium">
                    {selectedFiles.length} image
                    {selectedFiles.length !== 1 ? "s" : ""} selected
                  </p>
                  <p className="text-xs text-gray-500">
                    Total size:{" "}
                    {(
                      selectedFiles.reduce((sum, file) => sum + file.size, 0) /
                      1024 /
                      1024
                    ).toFixed(2)}{" "}
                    MB
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Search Buttons */}
          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={handleSearch}
              disabled={selectedFiles.length === 0 || isSearching}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSearching ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Searching...
                </span>
              ) : (
                `Search Similar Images${
                  selectedFiles.length > 1
                    ? ` (${selectedFiles.length} images)`
                    : ""
                }`
              )}
            </button>

            {/* Text Search Option */}
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Or search by text description..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                onKeyPress={(e) => {
                  if (e.key === "Enter" && e.currentTarget.value.trim()) {
                    handleTextSearch(e.currentTarget.value.trim());
                  }
                }}
              />
              <button
                onClick={() => {
                  const input = document.querySelector(
                    'input[type="text"]'
                  ) as HTMLInputElement;
                  if (input?.value.trim()) {
                    handleTextSearch(input.value.trim());
                  }
                }}
                disabled={isSearching}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Search
              </button>
            </div>
          </div>
        </div>

        {/* Search Results */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              Search Results
            </h2>
            {searchTime && (
              <span className="text-sm text-gray-500">
                Found {searchResults.length} results in {searchTime}ms
              </span>
            )}
          </div>

          {searchResults.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map((result, index) => (
                <div
                  key={result.id}
                  className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="relative">
                    <img
                      src={result.imageUrl}
                      alt={`Result ${index + 1}`}
                      className="w-full h-48 object-cover"
                      onLoad={() =>
                        console.log(`Image loaded: ${result.imageUrl}`)
                      }
                      onError={(e) => {
                        console.error(
                          `Image failed to load: ${result.imageUrl}`
                        );
                        e.currentTarget.src =
                          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBub3QgZm91bmQ8L3RleHQ+PC9zdmc+";
                      }}
                    />
                    <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                      {(result.similarity * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {result.metadata?.filename || "Unknown"}
                    </p>
                    <p className="text-xs text-gray-500">
                      Similarity: {(result.similarity * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              {isSearching ? (
                <div className="flex items-center justify-center space-x-2">
                  <svg
                    className="animate-spin h-5 w-5 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Searching...</span>
                </div>
              ) : (
                <p>Upload one or more images to see similar results here</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
