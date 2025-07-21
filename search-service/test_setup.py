#!/usr/bin/env python3
"""
Test script to verify the Python service setup
"""

def test_imports():
    """Test if all required packages can be imported"""
    try:
        import fastapi
        print("✓ FastAPI imported successfully")
        
        import uvicorn
        print("✓ Uvicorn imported successfully")
        
        import torch
        print(f"✓ PyTorch imported successfully (version: {torch.__version__})")
        
        import transformers
        print(f"✓ Transformers imported successfully (version: {transformers.__version__})")
        
        import faiss
        print("✓ FAISS imported successfully")
        
        from PIL import Image
        print("✓ Pillow imported successfully")
        
        import numpy as np
        print(f"✓ NumPy imported successfully (version: {np.__version__})")
        
        print("\n🎉 All dependencies are installed correctly!")
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False

def test_clip_loading():
    """Test if CLIP model can be loaded"""
    try:
        from transformers import CLIPProcessor, CLIPModel
        
        print("\nLoading CLIP model...")
        model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
        processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
        
        print("✓ CLIP model loaded successfully")
        print(f"✓ Model device: {next(model.parameters()).device}")
        
        return True
        
    except Exception as e:
        print(f"❌ CLIP loading error: {e}")
        return False

if __name__ == "__main__":
    print("Testing Python service setup...\n")
    
    imports_ok = test_imports()
    clip_ok = test_clip_loading()
    
    if imports_ok and clip_ok:
        print("\n✅ Setup is ready! You can now run:")
        print("   uvicorn main:app --reload --host 0.0.0.0 --port 8000")
    else:
        print("\n❌ Setup has issues. Please check the error messages above.") 