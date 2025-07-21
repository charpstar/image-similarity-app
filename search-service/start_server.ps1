# Start Image Similarity Search Service
Write-Host "Starting Image Similarity Search Service..." -ForegroundColor Green
Write-Host ""

# Activate virtual environment
& ".\venv\Scripts\Activate.ps1"

# Start the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000 