# 🚀 Vercel Deployment Guide

## Quick Deploy to Vercel

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Deploy Frontend

```bash
# Go to your project directory
cd image-similarity-app

# Deploy to Vercel
vercel

# Follow the prompts:
# - Link to existing project? No
# - Project name: image-similarity-app
# - Directory: ./
# - Override settings? No
```

### Step 3: Deploy Python Backend

```bash
# Create new directory for Python backend
mkdir image-similarity-backend
cd image-similarity-backend

# Copy Python files
cp ../image-similarity-app/api/index.py .
cp ../image-similarity-app/api/requirements.txt .

# Create vercel.json for Python
cat > vercel.json << EOF
{
  "version": 2,
  "builds": [
    {
      "src": "index.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.py"
    }
  ]
}
EOF

# Deploy Python backend
vercel
```

### Step 4: Set Environment Variables

After deployment, go to your Vercel dashboard and set these environment variables:

**Frontend Environment Variables:**

```
CDN_BASE_URL=https://drive.charpstar.net/indexing-test
PYTHON_SERVICE_URL=https://your-python-backend.vercel.app
API_TIMEOUT=30000
MAX_IMAGE_SIZE=10485760
NODE_ENV=production
```

### Step 5: Update Frontend URL

After getting your Python backend URL, update the frontend environment variable:

```
PYTHON_SERVICE_URL=https://your-actual-python-backend.vercel.app
```

## ✅ Benefits of Vercel:

- ✅ **No Docker issues**
- ✅ **Automatic deployments**
- ✅ **Global CDN**
- ✅ **Free tier available**
- ✅ **Easy environment variables**
- ✅ **Automatic HTTPS**

## 🌐 Your App Will Be Live At:

- **Frontend**: `https://image-similarity-app.vercel.app`
- **Backend**: `https://image-similarity-backend.vercel.app`

## 📝 Notes:

- Images are served from CDN: `https://drive.charpstar.net/indexing-test/images/`
- FAISS index and metadata are loaded from CDN on startup
- No local storage needed - everything is cloud-based!

## 🔧 Troubleshooting:

1. **If Python backend fails**: Check the Vercel logs for dependency issues
2. **If frontend can't connect**: Verify the `PYTHON_SERVICE_URL` environment variable
3. **If images don't load**: Check that CDN URLs are accessible

## 🚀 Ready to Deploy!

Your app is now optimized for Vercel deployment with:

- ✅ Removed large image directories
- ✅ CDN integration
- ✅ Python backend API
- ✅ Next.js frontend
- ✅ Environment variables configured

**Much simpler than Vultr!** 🎉
