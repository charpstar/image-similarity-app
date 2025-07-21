from pydantic import BaseModel, Field
from typing import List, Optional
import base64

class ImageEmbedRequest(BaseModel):
    """Request model for image embedding"""
    image_data: str = Field(..., description="Base64 encoded image data")
    
    class Config:
        schema_extra = {
            "example": {
                "image_data": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
            }
        }

class TextEmbedRequest(BaseModel):
    """Request model for text embedding"""
    text: str = Field(..., min_length=1, max_length=1000, description="Text to embed")
    
    class Config:
        schema_extra = {
            "example": {
                "text": "a photo of a cat"
            }
        }

class EmbedResponse(BaseModel):
    """Response model for embeddings"""
    embedding: List[float] = Field(..., description="512-dimensional embedding vector")
    embedding_norm: float = Field(..., description="L2 norm of the embedding vector")
    
    class Config:
        schema_extra = {
            "example": {
                "embedding": [0.1, 0.2, 0.3, ...],
                "embedding_norm": 1.0
            }
        }

class ErrorResponse(BaseModel):
    """Error response model"""
    error: str = Field(..., description="Error message")
    detail: Optional[str] = Field(None, description="Additional error details") 