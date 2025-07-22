from http.server import BaseHTTPRequestHandler
import json
import requests
from PIL import Image
import io
import base64
import numpy as np
import faiss
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# CDN URLs
CDN_BASE_URL = "https://drive.charpstar.net/indexing-test"
FAISS_INDEX_URL = f"{CDN_BASE_URL}/sample_index.faiss"
METADATA_URL = f"{CDN_BASE_URL}/sample_metadata.json"

# Global variables for index and metadata
index = None
metadata = None

def load_index():
    """Load FAISS index and metadata from CDN"""
    global index, metadata
    
    try:
        # Download FAISS index from CDN
        logger.info("Downloading FAISS index from CDN...")
        index_response = requests.get(FAISS_INDEX_URL, timeout=300)
        index_response.raise_for_status()
        
        # Save index temporarily and load it
        with open("/tmp/temp_index.faiss", "wb") as f:
            f.write(index_response.content)
        index = faiss.read_index("/tmp/temp_index.faiss")
        os.remove("/tmp/temp_index.faiss")  # Clean up
        logger.info(f"FAISS index loaded successfully with {index.ntotal} vectors")
        
        # Download metadata from CDN
        logger.info("Downloading metadata from CDN...")
        metadata_response = requests.get(METADATA_URL, timeout=60)
        metadata_response.raise_for_status()
        metadata = metadata_response.json()
        logger.info(f"Metadata loaded successfully with {len(metadata)} entries")
        
        return True
        
    except Exception as e:
        logger.error(f"Failed to load index from CDN: {str(e)}")
        return False

def search_similar_images(query_embedding, top_k=10):
    """Search for similar images using FAISS"""
    global index, metadata
    
    if index is None or metadata is None:
        if not load_index():
            return []
    
    try:
        # Convert query embedding to numpy array
        query_vector = np.array([query_embedding], dtype=np.float32)
        
        # Search in FAISS index
        distances, indices = index.search(query_vector, top_k)
        
        # Format results
        results = []
        for i, (distance, idx) in enumerate(zip(distances[0], indices[0])):
            if idx < len(metadata):
                similarity = 1.0 - distance  # Convert distance to similarity
                filename = metadata[idx].get('filename', f'image_{idx}.jpg')
                
                results.append({
                    'index': int(idx),
                    'filename': filename,
                    'similarity': float(similarity),
                    'distance': float(distance)
                })
        
        return results
        
    except Exception as e:
        logger.error(f"Search failed: {str(e)}")
        return []

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        """Handle POST requests for search"""
        try:
            # Get content length
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            # Parse JSON data
            data = json.loads(post_data.decode('utf-8'))
            
            # Handle different request types
            if 'embedding' in data:
                # Search with embedding
                query_embedding = data['embedding']
                results = search_similar_images(query_embedding)
                
                response = {
                    'success': True,
                    'results': results,
                    'total_results': len(results)
                }
                
            elif 'text' in data:
                # Text search (placeholder)
                response = {
                    'success': True,
                    'results': [],
                    'total_results': 0,
                    'message': 'Text search not implemented yet'
                }
                
            else:
                response = {
                    'success': False,
                    'error': 'Invalid request format'
                }
            
            # Send response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode())
            
        except Exception as e:
            # Send error response
            error_response = {
                'success': False,
                'error': str(e)
            }
            
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(error_response).encode())
    
    def do_GET(self):
        """Handle GET requests for health check"""
        if self.path == '/health':
            response = {
                'status': 'healthy',
                'service': 'image-similarity-backend',
                'index_loaded': index is not None,
                'metadata_loaded': metadata is not None
            }
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers() 