// CDN Configuration
export const CDN_CONFIG = {
  // Base URL for the CDN
  BASE_URL: "https://drive.charpstar.net/indexing-test",

  // Image URLs
  IMAGES_URL: "https://drive.charpstar.net/indexing-test/images",

  // Data files
  METADATA_URL:
    "https://drive.charpstar.net/indexing-test/sample_metadata.json",
  FAISS_INDEX_URL:
    "https://drive.charpstar.net/indexing-test/sample_index.faiss",

  // Timeout settings (in seconds)
  DOWNLOAD_TIMEOUT: 300, // 5 minutes for large files
  METADATA_TIMEOUT: 60, // 1 minute for JSON files
};

// Helper function to get image URL
export function getImageUrl(filename: string): string {
  return `${CDN_CONFIG.IMAGES_URL}/${filename}`;
}

// Helper function to get metadata URL
export function getMetadataUrl(): string {
  return CDN_CONFIG.METADATA_URL;
}

// Helper function to get FAISS index URL
export function getFaissIndexUrl(): string {
  return CDN_CONFIG.FAISS_INDEX_URL;
}
