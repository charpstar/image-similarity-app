#!/bin/bash

# Test script for search endpoints using curl
BASE_URL="http://localhost:8000"

echo "🔍 Testing Search Endpoints with curl"
echo "===================================="

# Test index info
echo "1. Testing index info endpoint..."
curl -s "$BASE_URL/index-info" | jq '.'

# Test search with dummy embedding
echo -e "\n2. Testing search with dummy embedding..."
DUMMY_EMBEDDING=$(python -c "import json; print(json.dumps([0.1] * 512))")

curl -X POST "$BASE_URL/search" \
  -H "Content-Type: application/json" \
  -d "{\"embedding\": $DUMMY_EMBEDDING}" | jq '.'

# Test search with image embedding
echo -e "\n3. Testing search with image embedding..."
# First create image embedding
IMAGE_DATA="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="

# Get embedding
EMBED_RESPONSE=$(curl -s -X POST "$BASE_URL/embed/image" \
  -H "Content-Type: application/json" \
  -d "{\"image_data\": \"$IMAGE_DATA\"}")

echo "Image embedding response:"
echo "$EMBED_RESPONSE" | jq '.'

# Extract embedding and search
EMBEDDING=$(echo "$EMBED_RESPONSE" | jq -r '.embedding')

if [ "$EMBEDDING" != "null" ]; then
    echo -e "\nSearching with image embedding..."
    curl -X POST "$BASE_URL/search" \
      -H "Content-Type: application/json" \
      -d "{\"embedding\": $EMBEDDING}" | jq '.'
else
    echo "❌ Failed to get image embedding"
fi

# Test error handling
echo -e "\n4. Testing error handling (invalid embedding)..."
curl -X POST "$BASE_URL/search" \
  -H "Content-Type: application/json" \
  -d '{"embedding": [0.1, 0.2]}' | jq '.'

echo -e "\n5. Testing error handling (missing embedding)..."
curl -X POST "$BASE_URL/search" \
  -H "Content-Type: application/json" \
  -d '{"wrong_field": [0.1]}' | jq '.'

echo -e "\n✅ All search tests completed!" 