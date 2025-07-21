#!/usr/bin/env node

/**
 * Test script for Next.js API integration
 * Run with: node test_api_integration.js
 */

// Configuration
const NEXTJS_URL = "http://localhost:3001";
const PYTHON_URL = "http://localhost:8000";

// Test utilities
async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    return { status: 0, error: error.message };
  }
}

async function testHealthCheck() {
  console.log("🔍 Testing health check...");

  const result = await makeRequest(`${NEXTJS_URL}/api/health`);

  if (result.status === 200) {
    console.log("✅ Health check passed");
    console.log(`   Status: ${result.data.status}`);
    console.log(`   Python Service: ${result.data.services?.python?.status}`);
    return true;
  } else {
    console.log("❌ Health check failed:", result.error || result.status);
    return false;
  }
}

async function testTextSearch() {
  console.log("\n🔍 Testing text search...");

  const result = await makeRequest(`${NEXTJS_URL}/api/search`, {
    method: "POST",
    body: JSON.stringify({ text: "a photo of a cat" }),
  });

  if (result.status === 200 && result.data.success) {
    console.log("✅ Text search successful");
    console.log(`   Results: ${result.data.totalResults}`);
    console.log(`   Search time: ${result.data.searchTime}ms`);
    console.log(`   Query type: ${result.data.queryType}`);

    if (result.data.results.length > 0) {
      console.log(
        "   Top result:",
        result.data.results[0].metadata?.filename || "Unknown"
      );
    }
    return true;
  } else {
    console.log("❌ Text search failed:", result.data?.error || result.error);
    return false;
  }
}

async function testImageSearch() {
  console.log("\n🔍 Testing image search...");

  // Create a simple test image (1x1 red pixel)
  const testImageData =
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=";

  // For this test, we'll use the JSON approach with base64 data
  // In a real scenario, this would be a multipart form upload
  const result = await makeRequest(`${NEXTJS_URL}/api/search`, {
    method: "POST",
    body: JSON.stringify({
      image_data: testImageData,
    }),
  });

  if (result.status === 200 && result.data.success) {
    console.log("✅ Image search successful");
    console.log(`   Results: ${result.data.totalResults}`);
    console.log(`   Search time: ${result.data.searchTime}ms`);
    console.log(`   Query type: ${result.data.queryType}`);

    if (result.data.results.length > 0) {
      console.log(
        "   Top result:",
        result.data.results[0].metadata?.filename || "Unknown"
      );
    }
    return true;
  } else {
    console.log("❌ Image search failed:", result.data?.error || result.error);
    console.log(
      "   Note: This test uses base64 data. Real uploads use multipart/form-data."
    );
    return false;
  }
}

async function testErrorHandling() {
  console.log("\n🔍 Testing error handling...");

  // Test invalid text
  const invalidTextResult = await makeRequest(`${NEXTJS_URL}/api/search`, {
    method: "POST",
    body: JSON.stringify({ text: "" }),
  });

  if (invalidTextResult.status === 400) {
    console.log("✅ Invalid text validation working");
  } else {
    console.log("❌ Invalid text validation failed");
    return false;
  }

  // Test invalid content type
  const invalidContentResult = await makeRequest(`${NEXTJS_URL}/api/search`, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: "invalid data",
  });

  if (invalidContentResult.status === 400) {
    console.log("✅ Invalid content type validation working");
  } else {
    console.log("❌ Invalid content type validation failed");
    return false;
  }

  return true;
}

async function testPythonServiceDirect() {
  console.log("\n🔍 Testing Python service directly...");

  const result = await makeRequest(`${PYTHON_URL}/health`);

  if (result.status === 200) {
    console.log("✅ Python service is running");
    console.log(`   Status: ${result.data.status}`);
    console.log(`   Model loaded: ${result.data.model_loaded}`);
    return true;
  } else {
    console.log("❌ Python service is not running");
    console.log("   Make sure to start the Python service:");
    console.log(
      "   cd search-service && uvicorn main:app --reload --host 0.0.0.0 --port 8000"
    );
    return false;
  }
}

async function testIndexInfo() {
  console.log("\n🔍 Testing index info...");

  const result = await makeRequest(`${PYTHON_URL}/index-info`);

  if (result.status === 200) {
    console.log("✅ Index info retrieved");
    console.log(`   Index type: ${result.data.index_type}`);
    console.log(`   Total vectors: ${result.data.total_vectors}`);
    console.log(
      `   Sample files: ${result.data.sample_files?.join(", ") || "None"}`
    );
    return true;
  } else {
    console.log("❌ Index info failed:", result.data?.error || result.error);
    console.log("   Make sure to create the FAISS index:");
    console.log("   cd search-service && python setup_index.py");
    return false;
  }
}

async function testEmbeddingEndpoints() {
  console.log("\n🔍 Testing embedding endpoints directly...");

  // Test text embedding
  const textEmbedResult = await makeRequest(`${PYTHON_URL}/embed/text`, {
    method: "POST",
    body: JSON.stringify({ text: "a photo of a cat" }),
  });

  if (textEmbedResult.status === 200) {
    console.log("✅ Text embedding successful");
    console.log(
      `   Embedding length: ${textEmbedResult.data.embedding?.length || 0}`
    );
    console.log(
      `   Embedding norm: ${textEmbedResult.data.embedding_norm || 0}`
    );
  } else {
    console.log(
      "❌ Text embedding failed:",
      textEmbedResult.data?.error || textEmbedResult.error
    );
    return false;
  }

  // Test image embedding
  const testImageData =
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=";

  const imageEmbedResult = await makeRequest(`${PYTHON_URL}/embed/image`, {
    method: "POST",
    body: JSON.stringify({ image_data: testImageData }),
  });

  if (imageEmbedResult.status === 200) {
    console.log("✅ Image embedding successful");
    console.log(
      `   Embedding length: ${imageEmbedResult.data.embedding?.length || 0}`
    );
    console.log(
      `   Embedding norm: ${imageEmbedResult.data.embedding_norm || 0}`
    );
    return true;
  } else {
    console.log(
      "❌ Image embedding failed:",
      imageEmbedResult.data?.error || imageEmbedResult.error
    );
    return false;
  }
}

async function main() {
  console.log("🧪 Testing Next.js API Integration");
  console.log("==================================");

  // Check if Next.js is running
  const nextjsHealth = await makeRequest(`${NEXTJS_URL}/api/health`);
  if (nextjsHealth.status === 0) {
    console.log("❌ Next.js is not running");
    console.log("   Make sure to start Next.js: npm run dev");
    return;
  }

  // Run tests
  const tests = [
    testPythonServiceDirect,
    testEmbeddingEndpoints,
    testIndexInfo,
    testHealthCheck,
    testTextSearch,
    testImageSearch,
    testErrorHandling,
  ];

  let passed = 0;
  const total = tests.length;

  for (const test of tests) {
    if (await test()) {
      passed++;
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log(`📊 Test Results: ${passed}/${total} tests passed`);

  if (passed === total) {
    console.log("🎉 All tests passed! API integration is working correctly.");
  } else {
    console.log("❌ Some tests failed. Please check the errors above.");
  }

  console.log("\n💡 Next steps:");
  console.log("   1. Add sample images to search-service/sample-images/");
  console.log("   2. Run: cd search-service && python setup_index.py");
  console.log("   3. Test the search functionality in the browser");
}

// Run the tests
main().catch(console.error);
