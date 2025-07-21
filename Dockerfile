# Multi-stage build for the complete application
FROM python:3.11-slim as backend

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy Python requirements and install
COPY search-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY search-service/ .

# Download and prepare models
RUN python -c "from transformers import CLIPProcessor, CLIPModel; CLIPProcessor.from_pretrained('openai/clip-vit-base-patch32'); CLIPModel.from_pretrained('openai/clip-vit-base-patch32')"

# Frontend stage
FROM node:18-alpine as frontend

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy frontend source
COPY src/ ./src/
COPY public/ ./public/
COPY next.config.ts ./
COPY tsconfig.json ./

# Build frontend
RUN npm run build

# Final stage
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy Python environment from backend stage
COPY --from=backend /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=backend /usr/local/bin /usr/local/bin

# Copy backend code
COPY search-service/ ./search-service/

# Copy frontend build
COPY --from=frontend /app/.next ./.next
COPY --from=frontend /app/public ./public
COPY --from=frontend /app/package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Set environment variables
ENV KMP_DUPLICATE_LIB_OK=true
ENV PYTHONPATH=/app/search-service
ENV NODE_ENV=production

# Expose ports
EXPOSE 3000 8001

# Copy startup script
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

CMD ["/app/start.sh"] 