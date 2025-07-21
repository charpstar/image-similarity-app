#!/usr/bin/env python3
"""
Setup script to help create FAISS index from images
"""

import os
import sys
import glob
from pathlib import Path

def check_images_directory():
    """Check if sample-images directory exists and has images"""
    sample_dir = Path("../sample-images")
    
    if not sample_dir.exists():
        print("❌ sample-images directory not found!")
        print("Please create the directory and add your images:")
        print("   mkdir ../sample-images")
        print("   # Then copy your images to ../sample-images/")
        return False
    
    # Check for image files
    image_extensions = ['*.jpg', '*.jpeg', '*.png', '*.webp']
    image_files = []
    for ext in image_extensions:
        image_files.extend(glob.glob(str(sample_dir / ext)))
        image_files.extend(glob.glob(str(sample_dir / ext.upper())))
    
    if not image_files:
        print("❌ No image files found in ../sample-images/")
        print("Please add some images (JPG, PNG, WebP) to the directory.")
        return False
    
    print(f"✅ Found {len(image_files)} images in ../sample-images/")
    for i, file in enumerate(image_files[:5]):  # Show first 5
        print(f"   {i+1}. {os.path.basename(file)}")
    
    if len(image_files) > 5:
        print(f"   ... and {len(image_files) - 5} more")
    
    return True

def create_index():
    """Create the FAISS index"""
    print("\n🔧 Creating FAISS index...")
    
    try:
        from create_index import IndexCreator
        
        creator = IndexCreator()
        success = creator.create_index_from_images("../sample-images", ".")
        
        if success:
            print("✅ Index creation completed successfully!")
            print("   - sample_index.faiss")
            print("   - sample_metadata.json")
            return True
        else:
            print("❌ Index creation failed!")
            return False
            
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("Please make sure all dependencies are installed:")
        print("   pip install -r requirements.txt")
        return False
    except Exception as e:
        print(f"❌ Error creating index: {e}")
        return False

def test_service():
    """Test if the service can load the index"""
    print("\n🧪 Testing service with new index...")
    
    try:
        import requests
        import time
        
        # Wait a moment for service to start
        time.sleep(2)
        
        response = requests.get("http://localhost:8000/index-info")
        if response.status_code == 200:
            data = response.json()
            print("✅ Service loaded index successfully!")
            print(f"   Index type: {data['index_type']}")
            print(f"   Total vectors: {data['total_vectors']}")
            print(f"   Sample files: {data['sample_files']}")
            return True
        else:
            print(f"❌ Service test failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Service test error: {e}")
        print("Make sure the service is running:")
        print("   uvicorn main:app --reload --host 0.0.0.0 --port 8000")
        return False

def main():
    """Main setup function"""
    print("🚀 FAISS Index Setup")
    print("=" * 30)
    
    # Step 1: Check images directory
    if not check_images_directory():
        return
    
    # Step 2: Create index
    if not create_index():
        return
    
    # Step 3: Test service
    print("\n💡 To test the service, run:")
    print("   uvicorn main:app --reload --host 0.0.0.0 --port 8000")
    print("\nThen in another terminal:")
    print("   python test_search.py")
    
    print("\n🎉 Setup completed successfully!")

if __name__ == "__main__":
    main() 