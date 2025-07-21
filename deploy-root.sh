#!/bin/bash

# 🚀 Vultr Deployment Script (Root Version)
# This script automates the deployment of the image similarity app to Vultr

set -e  # Exit on any error

echo "🚀 Starting Vultr Deployment (Root Mode)..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root"
   exit 1
fi

print_status "Running as root - proceeding with deployment..."

# Update system
print_status "Updating system packages..."
apt update && apt upgrade -y

# Install required packages
print_status "Installing required packages..."
apt install -y curl git htop ufw wget

# Install Docker
print_status "Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    print_status "Docker installed successfully"
else
    print_status "Docker is already installed"
fi

# Install Docker Compose
print_status "Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    print_status "Docker Compose installed successfully"
else
    print_status "Docker Compose is already installed"
fi

# Create environment file
print_status "Creating environment configuration..."
cat > .env << EOF
# CDN Configuration
CDN_BASE_URL=https://drive.charpstar.net/indexing-test

# Python Backend Configuration
PYTHON_SERVICE_URL=http://localhost:8001
API_TIMEOUT=30000
MAX_IMAGE_SIZE=10485760

# Production Settings
NODE_ENV=production
EOF

# Configure firewall
print_status "Configuring firewall..."
ufw allow ssh
ufw allow 80
ufw allow 443
ufw --force enable

# Build and start containers
print_status "Building and starting Docker containers..."
docker-compose up -d --build

# Wait for services to start
print_status "Waiting for services to start..."
sleep 30

# Check if containers are running
print_status "Checking container status..."
if docker-compose ps | grep -q "Up"; then
    print_status "Containers are running successfully!"
else
    print_error "Some containers failed to start. Check logs with: docker-compose logs"
    exit 1
fi

# Test backend health
print_status "Testing backend health..."
if curl -s http://localhost:8001/health > /dev/null; then
    print_status "Backend is healthy!"
else
    print_warning "Backend health check failed. Check logs with: docker-compose logs search-service"
fi

# Test frontend
print_status "Testing frontend..."
if curl -s http://localhost:3000 > /dev/null; then
    print_status "Frontend is accessible!"
else
    print_warning "Frontend test failed. Check logs with: docker-compose logs frontend"
fi

# Display useful commands
echo ""
print_status "Deployment completed successfully!"
echo ""
echo "Useful commands:"
echo "  View logs: docker-compose logs -f"
echo "  Restart services: docker-compose restart"
echo "  Stop services: docker-compose down"
echo "  Update application: git pull && docker-compose up -d --build"
echo ""
echo "Your application should be accessible at:"
echo "  Frontend: http://$(curl -s ifconfig.me):3000"
echo "  Backend: http://$(curl -s ifconfig.me):8001"
echo ""
print_status "Deployment script completed!" 