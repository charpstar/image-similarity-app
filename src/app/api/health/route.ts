import { NextRequest, NextResponse } from "next/server";

const PYTHON_SERVICE_URL =
  process.env.PYTHON_SERVICE_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  try {
    // Check Python service health
    const pythonHealthResponse = await fetch(`${PYTHON_SERVICE_URL}/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const pythonHealth = await pythonHealthResponse.json();

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        nextjs: {
          status: "healthy",
          version: process.env.npm_package_version || "1.0.0",
        },
        python: {
          status: pythonHealthResponse.ok ? "healthy" : "unhealthy",
          url: PYTHON_SERVICE_URL,
          details: pythonHealth,
        },
      },
    });
  } catch (error) {
    console.error("Health check error:", error);

    return NextResponse.json(
      {
        status: "degraded",
        timestamp: new Date().toISOString(),
        services: {
          nextjs: {
            status: "healthy",
            version: process.env.npm_package_version || "1.0.0",
          },
          python: {
            status: "unhealthy",
            url: PYTHON_SERVICE_URL,
            error: error instanceof Error ? error.message : "Connection failed",
          },
        },
      },
      { status: 503 }
    );
  }
}
