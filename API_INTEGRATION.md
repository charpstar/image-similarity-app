# Next.js API Integration Layer

This document describes the API integration layer that orchestrates communication between the Next.js frontend and the Python search service.

## API Endpoints

### `/api/search` (POST)

Main search endpoint that handles both image uploads and text queries.

**Request Types:**

- `multipart/form-data` with `image` field for image search
- `application/json` with `text` field for text search

**Response Format:**

```json
{
  "success": true,
  "results": [
    {
      "id": "0",
      "imageUrl": "/api/images/cat.jpg",
      "similarity": 0.95,
      "metadata": {
        "filename": "cat.jpg",
        "size": 0,
        "uploadedAt": "2024-01-01T00:00:00.000Z"
      }
    }
  ],
  "totalResults": 10,
  "searchTime": 150,
  "queryType": "image"
}
```

### `/api/health` (GET)

Health check endpoint that verifies both Next.js and Python service status.

**Response Format:**

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "nextjs": {
      "status": "healthy",
      "version": "1.0.0"
    },
    "python": {
      "status": "healthy",
      "url": "http://localhost:8000",
      "details": {
        "status": "healthy",
        "model_loaded": true
      }
    }
  }
}
```

### `/api/images/[filename]` (GET)

Serves sample images from the search service directory.

## Features

### ✅ **Request Handling**

- Accepts both image uploads and text queries
- Determines search type based on request content
- Handles image-to-base64 conversion for uploads

### ✅ **Error Handling**

- Timeout management for Python service calls
- Proper error codes when Python service is unavailable
- File size and format validation
- Request validation for text queries

### ✅ **Response Formatting**

- Consistent JSON structure regardless of input type
- Search results with product info
- Processing time metadata
- Error messages with appropriate HTTP status codes

### ✅ **Security**

- File size limits (10MB max)
- Supported format validation (JPEG, PNG, WebP)
- Directory traversal prevention for image serving
- Input sanitization

## Configuration

### Environment Variables

```bash
# Python Service Configuration
PYTHON_SERVICE_URL=http://localhost:8000

# Next.js Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# API Configuration
API_TIMEOUT=30000  # 30 seconds
MAX_IMAGE_SIZE=10485760  # 10MB in bytes
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp

# Search Configuration
MAX_TEXT_LENGTH=1000  # Maximum text query length
SEARCH_RESULTS_LIMIT=10  # Maximum search results to return
```

## Testing

### Manual Testing

```bash
# Test health check
curl http://localhost:3000/api/health

# Test text search
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"text": "a photo of a cat"}'

# Test image search (using base64)
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"image_data": "data:image/jpeg;base64,..."}'
```

### Automated Testing

```bash
# Run the integration test script
node test_api_integration.js
```

## Error Handling

### Common Error Scenarios

1. **Python Service Unavailable**: Returns 503 with error details
2. **Invalid File Format**: Returns 400 with validation error
3. **File Too Large**: Returns 400 with size limit error
4. **Empty Text Query**: Returns 400 with validation error
5. **Request Timeout**: Returns 500 with timeout error

### Error Response Format

```json
{
  "success": false,
  "results": [],
  "totalResults": 0,
  "searchTime": 0,
  "error": "Error message here",
  "queryType": "image"
}
```

## Integration Flow

1. **Image Search Flow:**

   - Client uploads image via multipart/form-data
   - Next.js validates file size and format
   - Image converted to base64
   - Request forwarded to Python service `/embed/image`
   - Embedding used to search via Python service `/search`
   - Results transformed and returned to client

2. **Text Search Flow:**
   - Client sends text query via JSON
   - Next.js validates text length and content
   - Request forwarded to Python service `/embed/text`
   - Embedding used to search via Python service `/search`
   - Results transformed and returned to client

## Performance Considerations

- **Timeout Management**: 30-second timeout for Python service calls
- **Image Processing**: Base64 conversion handled efficiently
- **Caching**: Images served with 1-hour cache headers
- **Error Recovery**: Graceful degradation when Python service is unavailable

## Security Considerations

- **File Validation**: Strict file type and size validation
- **Path Traversal**: Prevention of directory traversal attacks
- **Input Sanitization**: Text query length and content validation
- **Error Information**: Limited error details exposed to clients
