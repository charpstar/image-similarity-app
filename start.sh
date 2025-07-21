#!/bin/bash

# Set environment variables
export KMP_DUPLICATE_LIB_OK=true
export NODE_ENV=production
export PYTHONPATH=/app/search-service

echo "Starting Image Similarity Search Application..."

# Start the Python backend
echo "Starting Python backend..."
cd /app/search-service
python start_production.py &

# Wait a moment for backend to start
sleep 10

# Start the Next.js frontend
echo "Starting Next.js frontend..."
cd /app
npm start &

# Wait for all background processes
wait 