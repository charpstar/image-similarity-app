# 🔍 AI Image Similarity Search

> Upload images to find similar products instantly using AI-powered search

[![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)](https://hub.docker.com/)
[![Next.js](https://img.shields.io/badge/Next.js-15.4.1-black?logo=next.js)](https://nextjs.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-blue?logo=python)](https://python.org/)
[![CDN](https://img.shields.io/badge/CDN-Bunny-green)](https://bunny.net/)

## ✨ Features

- 🖼️ **Smart Image Search**: Upload any image to find similar products
- 🔄 **Multi-Image Support**: Combine multiple images for better results
- 🌍 **Global CDN**: Fast image delivery worldwide via Bunny CDN
- 🐳 **Docker Ready**: One-command deployment to Vultr
- ⚡ **Real-time Search**: Instant results with OpenAI CLIP AI
- 📱 **Responsive UI**: Works on desktop and mobile
- 🔍 **Advanced Search**: Text queries and image similarity combined

## 🚀 Quick Deploy

### Local Development

```bash
# Clone the repository
git clone https://github.com/charpstar/image-similarity-app.git
cd image-similarity-app

# Install dependencies
npm install
cd search-service && pip install -r requirements.txt

# Start development servers
npm run dev          # Frontend (Next.js)
cd search-service && python main.py  # Backend (Python)
```

### Production Deployment (Vultr)

```bash
# Clone and deploy to Vultr
git clone https://github.com/charpstar/image-similarity-app.git
cd image-similarity-app
chmod +x deploy.sh
./deploy.sh
```

## 🛠️ Tech Stack

### Frontend

- **Next.js 15.4.1** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **React Hook Form** - Form handling
- **Lucide React** - Beautiful icons

### Backend

- **Python FastAPI** - High-performance API framework
- **OpenAI CLIP** - State-of-the-art image understanding
- **FAISS** - Fast similarity search with vector database
- **Pillow** - Image processing
- **Torch** - Deep learning framework

### Infrastructure

- **Docker** - Containerization
- **Bunny CDN** - Global content delivery
- **Vultr** - Cloud hosting
- **Nginx** - Reverse proxy (optional)

## 📁 Project Structure

```
image-similarity-app/
├── src/                    # Next.js frontend
│   ├── app/               # App Router pages
│   ├── components/        # React components
│   ├── lib/              # Utility functions
│   └── types/            # TypeScript definitions
├── search-service/        # Python FastAPI backend
│   ├── main.py           # FastAPI application
│   ├── models.py         # Data models
│   └── requirements.txt  # Python dependencies
├── config/               # Configuration files
├── docker-compose.yml    # Docker orchestration
├── Dockerfile           # Multi-stage Docker build
├── deploy.sh            # Automated deployment script
└── deployment-guide.md  # Complete deployment guide
```

## 🔧 Configuration

### Environment Variables

```bash
# CDN Configuration
CDN_BASE_URL=https://drive.charpstar.net/indexing-test

# Python Backend Configuration
PYTHON_SERVICE_URL=http://localhost:8001
API_TIMEOUT=30000
MAX_IMAGE_SIZE=10485760

# Production Settings
NODE_ENV=production
```

## 🌐 CDN Integration

The application uses Bunny CDN for:

- **Images**: Global image delivery
- **FAISS Index**: Distributed vector database
- **Metadata**: JSON configuration files

CDN URLs:

- Images: `https://drive.charpstar.net/indexing-test/images/`
- Index: `https://drive.charpstar.net/indexing-test/sample_index.faiss`
- Metadata: `https://drive.charpstar.net/indexing-test/sample_metadata.json`

## 🐳 Docker Deployment

### Local Development

```bash
docker-compose up -d
```

### Production (Vultr)

```bash
# Automated deployment
./deploy.sh

# Manual deployment
docker-compose -f docker-compose.yml up -d --build
```

## 📊 API Endpoints

### Frontend (Next.js)

- `GET /` - Main application page
- `GET /search` - Search interface
- `POST /api/search` - Image similarity search
- `POST /api/embed` - Generate image embeddings
- `GET /api/health` - Health check

### Backend (Python FastAPI)

- `GET /health` - Service health check
- `POST /search` - Similarity search
- `POST /embed` - Generate embeddings
- `GET /model-info` - Model information
- `GET /index-info` - FAISS index details

## 🔍 Search Features

### Single Image Search

Upload one image to find similar products in the database.

### Multi-Image Search

Upload multiple images of the same product for better accuracy:

1. Each image generates embeddings
2. Embeddings are averaged
3. Search with combined embedding

### Text Search

Search products using natural language descriptions.

## 🚀 Performance

- **Search Speed**: < 100ms average response time
- **Image Processing**: CLIP model for accurate embeddings
- **Global Delivery**: CDN-powered image serving
- **Scalability**: Docker containers for easy scaling

## 🛡️ Security

- **Input Validation**: File type and size checks
- **CORS Configuration**: Proper cross-origin settings
- **Firewall Rules**: UFW configuration for production
- **SSL/TLS**: HTTPS support with Let's Encrypt

## 📈 Monitoring

### Health Checks

```bash
# Backend health
curl http://localhost:8001/health

# Frontend health
curl http://localhost:3000
```

### Logs

```bash
# View all logs
docker-compose logs -f

# View specific service
docker-compose logs search-service
```

## 🔧 Troubleshooting

### Common Issues

**Container won't start:**

```bash
docker-compose logs
df -h  # Check disk space
free -h  # Check memory
```

**CDN connectivity issues:**

```bash
curl -I https://drive.charpstar.net/indexing-test/sample_metadata.json
```

**Memory issues:**

- Upgrade Vultr plan to 8GB RAM
- Monitor with `docker stats`

### Performance Optimization

1. **Increase Resources**: Upgrade Vultr plan if needed
2. **CDN Caching**: Optimize image sizes
3. **Database Indexing**: Consider Redis for caching
4. **Load Balancing**: Add multiple instances

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI CLIP** - State-of-the-art image understanding
- **FAISS** - Fast similarity search
- **Next.js** - React framework
- **FastAPI** - Python web framework
- **Bunny CDN** - Global content delivery

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/charpstar/image-similarity-app/issues)
- **Documentation**: [Deployment Guide](deployment-guide.md)
- **Deployment**: [Vultr Guide](deployment-guide.md#step-1-create-vultr-server)

---

**Made with ❤️ by [Charpstar](https://github.com/charpstar)**

_Perfect for e-commerce, fashion discovery, and product recommendation systems!_
