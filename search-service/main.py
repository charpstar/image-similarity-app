#!/usr/bin/env python3
"""
FastAPI service for image similarity search using CLIP and FAISS
"""

import os
import json
import logging
from typing import List, Dict, Any, Optional
import numpy as np
import faiss
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import torch
from transformers import CLIPProcessor, CLIPModel

from models import (
    ImageEmbedRequest, 
    TextEmbedRequest, 
    EmbedResponse, 
    ErrorResponse
)
from utils import (
    decode_base64_image,
    preprocess_image,
    generate_image_embedding,
    generate_text_embedding,
    validate_embedding
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Image Similarity Search API",
    description="AI-powered image similarity search using CLIP and FAISS",
    version="1.0.0"
)

# Add CORS middleware for Next.js integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for model and index
model: Optional[CLIPModel] = None
processor: Optional[CLIPProcessor] = None
index: Optional[faiss.Index] = None
metadata: Optional[Dict[str, Any]] = None

def load_model():
    """Load CLIP model and processor"""
    global model, processor
    
    try:
        logger.info("Loading CLIP model...")
        model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
        processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
        
        # Set device
        device = "cuda" if torch.cuda.is_available() else "cpu"
        model = model.to(device)
        
        logger.info(f"CLIP model loaded successfully on {device}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to load CLIP model: {str(e)}")
        return False

def load_index():
    """Load FAISS index and metadata from CDN"""
    global index, metadata
    
    try:
        # CDN URLs from environment or defaults
        cdn_base = os.environ.get("CDN_BASE_URL", "https://drive.charpstar.net/indexing-test")
        index_url = f"{cdn_base}/sample_index.faiss"
        metadata_url = f"{cdn_base}/sample_metadata.json"
        
        # Download FAISS index from CDN
        logger.info("Downloading FAISS index from CDN...")
        import requests
        index_response = requests.get(index_url, timeout=300)  # 5 minute timeout
        index_response.raise_for_status()
        
        # Save index temporarily and load it
        with open("temp_index.faiss", "wb") as f:
            f.write(index_response.content)
        index = faiss.read_index("temp_index.faiss")
        os.remove("temp_index.faiss")  # Clean up
        logger.info(f"FAISS index loaded successfully with {index.ntotal} vectors")
        
        # Download metadata from CDN
        logger.info("Downloading metadata from CDN...")
        metadata_response = requests.get(metadata_url, timeout=60)
        metadata_response.raise_for_status()
        metadata = metadata_response.json()
        logger.info(f"Metadata loaded successfully with {len(metadata)} entries")
        
        return True
        
    except Exception as e:
        logger.error(f"Failed to load index from CDN: {str(e)}")
        return False

@app.on_event("startup")
async def startup_event():
    """Initialize model and index on startup"""
    logger.info("Starting up Image Similarity Search service...")
    
    # Load model
    if not load_model():
        logger.error("Failed to load CLIP model")
        return
    
    # Load index
    if not load_index():
        logger.warning("Failed to load FAISS index - service will work but search will fail")
    
    logger.info("Service startup complete")

@app.get("/")
async def root():
    """Root endpoint with service information"""
    return {
        "service": "Image Similarity Search API",
        "version": "1.0.0",
        "status": "running",
        "model_loaded": model is not None,
        "index_loaded": index is not None
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    model_status = "loaded" if model is not None else "not_loaded"
    index_status = "loaded" if index is not None else "not_loaded"
    
    return {
        "status": "healthy",
        "model": model_status,
        "index": index_status,
        "total_images": index.ntotal if index else 0
    }

@app.get("/model-info")
async def model_info():
    """Get model information"""
    if not model:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    device = next(model.parameters()).device
    total_params = sum(p.numel() for p in model.parameters())
    
    return {
        "model_name": "openai/clip-vit-base-patch32",
        "device": str(device),
        "total_parameters": total_params,
        "embedding_dimension": 512
    }

@app.get("/index-info")
async def index_info():
    """Get FAISS index information"""
    if not index:
        raise HTTPException(status_code=503, detail="Index not loaded")
    
    return {
        "total_vectors": index.ntotal,
        "vector_dimension": index.d,
        "index_type": type(index).__name__,
        "metadata_entries": len(metadata) if metadata else 0
    }

@app.post("/embed/image", response_model=EmbedResponse)
async def embed_image(request: ImageEmbedRequest):
    """Generate embedding for an image"""
    if not model or not processor:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        # Decode base64 image
        image = decode_base64_image(request.image_data)
        if not image:
            raise HTTPException(status_code=400, detail="Invalid image data")
        
        # Preprocess image
        image_tensor = preprocess_image(image, processor)
        
        # Generate embedding
        embedding, embedding_norm = generate_image_embedding(image_tensor, model)
        
        # Validate embedding
        if not validate_embedding(embedding):
            raise HTTPException(status_code=500, detail="Invalid embedding generated")
        
        return EmbedResponse(
            embedding=embedding.tolist(),
            embedding_norm=float(embedding_norm)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Image embedding error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Embedding generation failed: {str(e)}")

@app.post("/embed/text", response_model=EmbedResponse)
async def embed_text(request: TextEmbedRequest):
    """Generate embedding for text"""
    if not model or not processor:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        # Generate embedding
        embedding, embedding_norm = generate_text_embedding(request.text, processor, model)
        
        # Validate embedding
        if not validate_embedding(embedding):
            raise HTTPException(status_code=500, detail="Invalid embedding generated")
        
        return EmbedResponse(
            embedding=embedding.tolist(),
            embedding_norm=float(embedding_norm)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Text embedding error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Embedding generation failed: {str(e)}")

@app.post("/search")
async def search_similar_images(request: Request):
    """Search for similar images using embedding"""
    if not index or not metadata:
        raise HTTPException(status_code=503, detail="Index not loaded")
    
    try:
        # Parse request body
        body = await request.json()
        embedding = body.get("embedding")
        
        if not embedding:
            raise HTTPException(status_code=400, detail="Embedding is required")
        
        # Convert to numpy array
        query_embedding = np.array(embedding, dtype=np.float32)
        
        # Validate embedding
        if not validate_embedding(query_embedding):
            raise HTTPException(status_code=400, detail="Invalid embedding")
        
        # Normalize query embedding
        query_norm = np.linalg.norm(query_embedding)
        if query_norm > 0:
            query_embedding = query_embedding / query_norm
        
        # Search in FAISS index
        k = min(20, index.ntotal)  # Return top 20 results or all if less
        distances, indices = index.search(query_embedding.reshape(1, -1), k)
        
        # Format results
        results = []
        for i, (distance, idx) in enumerate(zip(distances[0], indices[0])):
            if idx < len(metadata):
                metadata_item = metadata[idx]  # Get the metadata item
                
                # Extract filename - handle both string and object formats
                if isinstance(metadata_item, dict):
                    filename = metadata_item.get('filename', str(idx))
                else:
                    filename = str(metadata_item)
                
                similarity = 1.0 - distance  # Convert distance to similarity
                
                results.append({
                    "rank": i + 1,
                    "index": int(idx),
                    "filename": filename,  # Now it's always a string
                    "filepath": f"/sample-images/{filename}",
                    "similarity": float(similarity),
                    "distance": float(distance)
                })
        
        return {
            "query_embedding_norm": float(query_norm),
            "total_results": len(results),
            "results": results
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Search error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001) 