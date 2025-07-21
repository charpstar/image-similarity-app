#!/bin/bash

# 🚀 Minimal Vultr Deployment Script
# This script deploys the app without sample images to save disk space

set -e

echo "🚀 Starting Minimal Vultr Deployment..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check disk space
DISK_AVAIL=$(df / | awk 'NR==2 {print $4}')
if [ "$DISK_AVAIL" -lt 1000000 ]; then
    print_error "Less than 1GB available. Cleaning up first..."
    
    # Clean up
    apt clean
    apt autoremove -y
    rm -rf /tmp/*
    rm -rf /var/cache/apt/archives/*
    
    print_status "Cleanup completed"
fi

# Update system
print_status "Updating system packages..."
apt update && apt upgrade -y

# Install minimal packages
print_status "Installing minimal packages..."
apt install -y curl git docker.io

# Install Docker Compose
print_status "Installing Docker Compose..."
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Start Docker
print_status "Starting Docker..."
systemctl start docker
systemctl enable docker

# Clone repository
print_status "Cloning repository..."
if [ -d "image-similarity-app" ]; then
    rm -rf image-similarity-app
fi
git clone https://github.com/charpstar/image-similarity-app.git
cd image-similarity-app

# Remove large directories
print_status "Removing large directories to save space..."
rm -rf sample-images/
rm -rf images/

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

# Deploy with Docker
print_status "Deploying with Docker..."
docker-compose up -d

# Wait for services
print_status "Waiting for services to start..."
sleep 30

# Check status
print_status "Checking deployment status..."
if docker-compose ps | grep -q "Up"; then
    print_status "Deployment successful!"
else
    print_error "Deployment failed. Check logs:"
    docker-compose logs
    exit 1
fi

# Test services
print_status "Testing services..."
if curl -s http://localhost:8001/health > /dev/null; then
    print_status "Backend is healthy!"
else
    print_warning "Backend health check failed"
fi

if curl -s http://localhost:3000 > /dev/null; then
    print_status "Frontend is accessible!"
else
    print_warning "Frontend test failed"
fi

# Display info
echo ""
print_status "Minimal deployment completed!"
echo ""
echo "Your application is accessible at:"
echo "  Frontend: http://$(curl -s ifconfig.me):3000"
echo "  Backend: http://$(curl -s ifconfig.me):8001"
echo ""
echo "Useful commands:"
echo "  View logs: docker-compose logs -f"
echo "  Restart: docker-compose restart"
echo "  Stop: docker-compose down"
echo ""
print_status "Images are served from CDN - no local storage needed!" 