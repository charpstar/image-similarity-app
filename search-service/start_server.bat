@echo off
echo Starting Image Similarity Search Service...
echo.

REM Activate virtual environment
call venv\Scripts\Activate.ps1

REM Start the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000

pause 