import base64
import io
import logging
from typing import Tuple, Optional
import torch
import numpy as np
from PIL import Image
from transformers import CLIPProcessor, CLIPModel

logger = logging.getLogger(__name__)

def decode_base64_image(image_data: str) -> Optional[Image.Image]:
    """
    Decode base64 image data to PIL Image
    
    Args:
        image_data: Base64 encoded image string (with or without data URL prefix)
    
    Returns:
        PIL Image object or None if decoding fails
    """
    try:
        # Remove data URL prefix if present
        if image_data.startswith('data:'):
            image_data = image_data.split(',')[1]
        
        # Decode base64
        image_bytes = base64.b64decode(image_data)
        
        # Convert to PIL Image
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        return image
        
    except Exception as e:
        logger.error(f"Failed to decode base64 image: {str(e)}")
        return None

def preprocess_image(image: Image.Image, processor: CLIPProcessor) -> torch.Tensor:
    """
    Preprocess image for CLIP model
    
    Args:
        image: PIL Image object
        processor: CLIP processor
    
    Returns:
        Preprocessed image tensor
    """
    try:
        # Process image with CLIP processor
        inputs = processor(images=image, return_tensors="pt")
        return inputs['pixel_values']
        
    except Exception as e:
        logger.error(f"Failed to preprocess image: {str(e)}")
        raise e

def generate_image_embedding(image_tensor: torch.Tensor, model: CLIPModel) -> Tuple[np.ndarray, float]:
    """
    Generate image embedding using CLIP model
    
    Args:
        image_tensor: Preprocessed image tensor
        model: CLIP model
    
    Returns:
        Tuple of (embedding_array, embedding_norm)
    """
    try:
        with torch.no_grad():
            # Generate image features
            image_features = model.get_image_features(image_tensor)
            
            # Normalize the features
            image_features = torch.nn.functional.normalize(image_features, p=2, dim=1)
            
            # Convert to numpy array
            embedding = image_features.cpu().numpy().flatten()
            
            # Calculate L2 norm
            embedding_norm = np.linalg.norm(embedding)
            
            return embedding, embedding_norm
            
    except Exception as e:
        logger.error(f"Failed to generate image embedding: {str(e)}")
        raise e

def generate_text_embedding(text: str, processor: CLIPProcessor, model: CLIPModel) -> Tuple[np.ndarray, float]:
    """
    Generate text embedding using CLIP model
    
    Args:
        text: Input text string
        processor: CLIP processor
        model: CLIP model
    
    Returns:
        Tuple of (embedding_array, embedding_norm)
    """
    try:
        with torch.no_grad():
            # Process text with CLIP processor
            inputs = processor(text=text, return_tensors="pt", padding=True, truncation=True)
            
            # Generate text features
            text_features = model.get_text_features(**inputs)
            
            # Normalize the features
            text_features = torch.nn.functional.normalize(text_features, p=2, dim=1)
            
            # Convert to numpy array
            embedding = text_features.cpu().numpy().flatten()
            
            # Calculate L2 norm
            embedding_norm = np.linalg.norm(embedding)
            
            return embedding, embedding_norm
            
    except Exception as e:
        logger.error(f"Failed to generate text embedding: {str(e)}")
        raise e

def validate_embedding(embedding: np.ndarray, expected_dim: int = 512) -> bool:
    """
    Validate embedding vector
    
    Args:
        embedding: Embedding vector
        expected_dim: Expected dimension
    
    Returns:
        True if valid, False otherwise
    """
    if embedding.shape[0] != expected_dim:
        return False
    
    if np.isnan(embedding).any() or np.isinf(embedding).any():
        return False
    
    return True 