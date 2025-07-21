# 🚀 Vultr Deployment Guide

## Step-by-Step Instructions

### Step 1: Create Vultr Server

1. Go to https://my.vultr.com/
2. Click "Deploy New Server"
3. Choose:
   - Server Type: Cloud Compute
   - Location: Closest to your users
   - Server Type: Ubuntu 22.04 LTS
   - Server Size: 4GB RAM, 2 vCPU (minimum)
   - Storage: 80GB SSD
4. Add SSH Key (recommended)
5. Set Server Label: `image-similarity-app`
6. Click "Deploy Now"

### Step 2: Connect to Server

```bash
ssh root@YOUR_SERVER_IP
```

### Step 3: Install Docker

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again
exit
ssh root@YOUR_SERVER_IP
```

### Step 4: Clone Project

```bash
# Install Git
sudo apt install git -y

# Clone repository
git clone https://github.com/YOUR_USERNAME/image-similarity-app.git
cd image-similarity-app

# Verify files
ls -la
```

### Step 5: Configure Environment

```bash
# Create environment file
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
```

### Step 6: Deploy with Docker

```bash
# Build and start containers
docker-compose up -d --build

# Check logs
docker-compose logs -f

# Check container status
docker-compose ps
```

### Step 7: Configure Firewall

```bash
# Install UFW
sudo apt install ufw -y

# Allow SSH
sudo ufw allow ssh

# Allow HTTP and HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### Step 8: Test Application

```bash
# Check if containers are running
docker-compose ps

# Test backend health
curl http://localhost:8001/health

# Test frontend
curl http://localhost:3000
```

### Step 9: Set Up Domain (Optional)

1. Point your domain to server IP
2. Install Nginx for reverse proxy:

```bash
# Install Nginx
sudo apt install nginx -y

# Create Nginx config
sudo nano /etc/nginx/sites-available/image-similarity-app
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/image-similarity-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 10: SSL Certificate (Optional)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Monitoring and Maintenance

### Check Application Status

```bash
# View logs
docker-compose logs -f

# Check resource usage
docker stats

# Restart services
docker-compose restart

# Update application
git pull
docker-compose up -d --build
```

### Backup Strategy

```bash
# Backup Docker volumes (if any)
docker run --rm -v image-similarity-app_data:/data -v $(pwd):/backup alpine tar czf /backup/backup.tar.gz -C /data .

# Backup configuration
cp .env .env.backup
```

### Troubleshooting

#### Container Won't Start

```bash
# Check logs
docker-compose logs

# Check disk space
df -h

# Check memory
free -h

# Restart Docker
sudo systemctl restart docker
```

#### Application Not Responding

```bash
# Check if containers are running
docker-compose ps

# Check ports
netstat -tlnp

# Test backend
curl http://localhost:8001/health

# Test frontend
curl http://localhost:3000
```

#### CDN Issues

```bash
# Test CDN connectivity
curl -I https://drive.charpstar.net/indexing-test/sample_metadata.json

# Check Python service logs
docker-compose logs search-service
```

## Performance Optimization

### Increase Resources

- Upgrade Vultr plan if needed
- Add more RAM for larger FAISS index
- Use SSD storage for better I/O

### Caching

- Consider Redis for session storage
- Implement CDN caching headers
- Use browser caching for static assets

### Monitoring

```bash
# Install monitoring tools
sudo apt install htop iotop -y

# Monitor system resources
htop
iotop
```

## Security Best Practices

1. **Regular Updates**

   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Firewall Rules**

   ```bash
   sudo ufw status
   ```

3. **Docker Security**

   ```bash
   # Run containers as non-root
   # Use specific user in Dockerfile
   ```

4. **SSL/TLS**
   - Always use HTTPS in production
   - Regular certificate renewal

## Cost Optimization

1. **Right-size your server**

   - Start with 4GB RAM
   - Monitor usage and scale up/down

2. **CDN Usage**

   - Monitor CDN bandwidth
   - Optimize image sizes

3. **Backup Strategy**
   - Regular backups
   - Store backups off-server

## Support and Maintenance

### Regular Tasks

- [ ] Weekly: Check logs for errors
- [ ] Monthly: Update system packages
- [ ] Quarterly: Review performance metrics
- [ ] Annually: Security audit

### Emergency Contacts

- Vultr Support: https://www.vultr.com/support/
- Docker Documentation: https://docs.docker.com/
- Application Logs: `docker-compose logs`
