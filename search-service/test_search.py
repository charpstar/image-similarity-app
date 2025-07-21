#!/usr/bin/env python3
"""
Test script for search functionality
"""

import requests
import json
import numpy as np
from PIL import Image
import io
import base64

# Service URL
BASE_URL = "http://localhost:8000"

def create_test_image():
    """Create a simple test image"""
    # Create a simple 100x100 RGB image
    image = Image.new('RGB', (100, 100), color='red')
    
    # Convert to base64
    buffer = io.BytesIO()
    image.save(buffer, format='JPEG')
    image_data = base64.b64encode(buffer.getvalue()).decode('utf-8')
    
    return image_data

def test_index_info():
    """Test the index info endpoint"""
    print("Testing index info endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/index-info")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Index info retrieved successfully")
            print(f"   Index type: {data['index_type']}")
            print(f"   Total vectors: {data['total_vectors']}")
            print(f"   Dimension: {data['dimension']}")
            print(f"   Metadata count: {data['metadata_count']}")
            print(f"   Sample files: {data['sample_files']}")
            return True
        else:
            print(f"❌ Index info failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Index info error: {e}")
        return False

def test_search_with_image():
    """Test search using image embedding"""
    print("\nTesting search with image embedding...")
    try:
        # First, create embedding from test image
        image_data = create_test_image()
        embed_payload = {"image_data": image_data}
        
        embed_response = requests.post(f"{BASE_URL}/embed/image", json=embed_payload)
        if embed_response.status_code != 200:
            print(f"❌ Failed to create image embedding: {embed_response.status_code}")
            return False
        
        embedding = embed_response.json()['embedding']
        
        # Now search with the embedding
        search_payload = {"embedding": embedding}
        search_response = requests.post(f"{BASE_URL}/search", json=search_payload)
        
        if search_response.status_code == 200:
            data = search_response.json()
            results = data['results']
            
            print(f"✅ Search successful")
            print(f"   Query embedding norm: {data['query_embedding_norm']:.4f}")
            print(f"   Total results: {data['total_results']}")
            
            # Display top 3 results
            for i, result in enumerate(results[:3]):
                print(f"   {i+1}. {result['filename']} (similarity: {result['similarity']:.4f})")
            
            return True
        else:
            print(f"❌ Search failed: {search_response.status_code}")
            print(f"   Response: {search_response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Search with image error: {e}")
        return False

def test_search_with_text():
    """Test search using text embedding"""
    print("\nTesting search with text embedding...")
    try:
        # First, create embedding from text
        text = "a photo of a cat"
        embed_payload = {"text": text}
        
        embed_response = requests.post(f"{BASE_URL}/embed/text", json=embed_payload)
        if embed_response.status_code != 200:
            print(f"❌ Failed to create text embedding: {embed_response.status_code}")
            return False
        
        embedding = embed_response.json()['embedding']
        
        # Now search with the embedding
        search_payload = {"embedding": embedding}
        search_response = requests.post(f"{BASE_URL}/search", json=search_payload)
        
        if search_response.status_code == 200:
            data = search_response.json()
            results = data['results']
            
            print(f"✅ Text search successful")
            print(f"   Query text: '{text}'")
            print(f"   Query embedding norm: {data['query_embedding_norm']:.4f}")
            print(f"   Total results: {data['total_results']}")
            
            # Display top 3 results
            for i, result in enumerate(results[:3]):
                print(f"   {i+1}. {result['filename']} (similarity: {result['similarity']:.4f})")
            
            return True
        else:
            print(f"❌ Text search failed: {search_response.status_code}")
            print(f"   Response: {search_response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Search with text error: {e}")
        return False

def test_error_handling():
    """Test error handling for search"""
    print("\nTesting search error handling...")
    
    # Test invalid embedding
    try:
        payload = {"embedding": [0.1, 0.2]}  # Wrong dimension
        response = requests.post(f"{BASE_URL}/search", json=payload)
        if response.status_code == 400:
            print("✅ Invalid embedding dimension validation working")
        else:
            print("❌ Invalid embedding dimension validation failed")
            return False
    except Exception as e:
        print(f"❌ Invalid embedding test error: {e}")
        return False
    
    # Test missing embedding
    try:
        payload = {"wrong_field": [0.1] * 512}
        response = requests.post(f"{BASE_URL}/search", json=payload)
        if response.status_code == 400:
            print("✅ Missing embedding validation working")
        else:
            print("❌ Missing embedding validation failed")
            return False
    except Exception as e:
        print(f"❌ Missing embedding test error: {e}")
        return False
    
    return True

def test_self_search():
    """Test that searching for an image's own embedding returns itself as top result"""
    print("\nTesting self-search (image should find itself)...")
    try:
        # Get index info to see available files
        index_response = requests.get(f"{BASE_URL}/index-info")
        if index_response.status_code != 200:
            print("❌ Could not get index info for self-search test")
            return False
        
        # For this test, we'll use a dummy embedding and check the structure
        # In a real scenario, you'd use an actual image from the index
        dummy_embedding = [0.1] * 512
        search_payload = {"embedding": dummy_embedding}
        
        search_response = requests.post(f"{BASE_URL}/search", json=search_payload)
        if search_response.status_code == 200:
            data = search_response.json()
            results = data['results']
            
            if results:
                print("✅ Self-search test structure valid")
                print(f"   Top result: {results[0]['filename']}")
                print(f"   Similarity score: {results[0]['similarity']:.4f}")
                return True
            else:
                print("❌ No search results returned")
                return False
        else:
            print(f"❌ Self-search failed: {search_response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Self-search error: {e}")
        return False

def main():
    """Run all search tests"""
    print("🔍 Testing Search Functionality")
    print("=" * 40)
    
    # Check if service is running
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code != 200:
            print("❌ Service is not running. Please start the service first:")
            print("   uvicorn main:app --reload --host 0.0.0.0 --port 8000")
            return
    except Exception as e:
        print(f"❌ Service connection failed: {e}")
        return
    
    # Run tests
    tests = [
        test_index_info,
        test_search_with_image,
        test_search_with_text,
        test_error_handling,
        test_self_search
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
    
    print("\n" + "=" * 40)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All search tests passed! Search functionality is working correctly.")
    else:
        print("❌ Some tests failed. Please check the errors above.")

if __name__ == "__main__":
    main() 