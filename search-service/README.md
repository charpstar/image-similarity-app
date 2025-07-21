# Image Similarity Search Service

A FastAPI service for image similarity search using CLIP and FAISS.

## Setup

1. **Activate the virtual environment:**

   ```bash
   # Windows
   .\venv\Scripts\Activate.ps1

   # Linux/Mac
   source venv/bin/activate
   ```

2. **Install dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

3. **Test the setup:**
   ```bash
   python test_setup.py
   ```

## Creating the FAISS Index

Before using the search functionality, you need to create a FAISS index from your sample images:

1. **Place your images in the sample-images folder:**

   ```bash
   # Copy your images to the sample-images directory
   cp /path/to/your/images/* ../sample-images/
   ```

2. **Create the FAISS index:**
   ```bash
   python create_index.py --images-dir ../sample-images
   ```

This will create:

- `sample_index.faiss` - The FAISS index file
- `sample_metadata.json` - Metadata mapping indices to image files

## Running the Service

Start the FastAPI server:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

### Core Endpoints

- `GET /` - Root endpoint with service info
- `GET /health` - Health check with model status
- `GET /model-info` - Model information and statistics
- `GET /index-info` - FAISS index information

### Embedding Endpoints

- `POST /embed/image` - Generate embedding for base64-encoded image
- `POST /embed/text` - Generate embedding for text string

### Search Endpoints

- `POST /search` - Search for similar images using embedding

### Request/Response Examples

#### Image Embedding

```bash
curl -X POST "http://localhost:8000/embed/image" \
  -H "Content-Type: application/json" \
  -d '{
    "image_data": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
  }'
```

Response:

```json
{
  "embedding": [0.1, 0.2, 0.3, ...],
  "embedding_norm": 1.0
}
```

#### Text Embedding

```bash
curl -X POST "http://localhost:8000/embed/text" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "a photo of a cat"
  }'
```

Response:

```json
{
  "embedding": [0.1, 0.2, 0.3, ...],
  "embedding_norm": 1.0
}
```

#### Search

```bash
curl -X POST "http://localhost:8000/search" \
  -H "Content-Type: application/json" \
  -d '{
    "embedding": [0.1, 0.2, 0.3, ...]
  }'
```

Response:

```json
{
  "query_embedding_norm": 1.0,
  "total_results": 10,
  "results": [
    {
      "rank": 1,
      "index": 0,
      "filename": "cat.jpg",
      "filepath": "/path/to/cat.jpg",
      "similarity": 0.95,
      "distance": 0.05
    }
  ]
}
```

## Testing

### Test Setup

```bash
python test_setup.py
```

### Test Embedding Endpoints

```bash
python test_embeddings.py
```

### Test Search Functionality

```bash
python test_search.py
```

## Features

- ✅ FastAPI web service
- ✅ CORS middleware for Next.js integration
- ✅ CLIP model loading on startup
- ✅ Health check endpoint
- ✅ Model information endpoint
- ✅ Image embedding generation
- ✅ Text embedding generation
- ✅ FAISS index creation and loading
- ✅ Similarity search functionality
- ✅ Proper error handling and validation
- ✅ Normalized embeddings (L2 norm ≈ 1.0)
- ✅ Metadata mapping for search results

## Next Steps

- Add image upload and storage
- Add batch processing capabilities
- Implement advanced FAISS index types
- Connect with Next.js frontend

## Environment Variables

Create a `.env` file in the search-service directory:

```
# Service Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=true

# Model Configuration
MODEL_NAME=openai/clip-vit-base-patch32
DEVICE=auto
```
