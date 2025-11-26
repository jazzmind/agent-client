import { NextResponse } from "next/server";

export async function GET() {
  const startTime = Date.now();
  const health = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      api: {
        status: "healthy",
        message: "API is responsive",
      },
      agent_server: {
        status: "unknown",
        message: "Not checked",
      },
    },
  };

  // Check agent server connectivity
  const agentServerUrl = process.env.MASTRA_API_URL;
  if (!agentServerUrl) {
    health.checks.agent_server = {
      status: "not_configured",
      message: "MASTRA_API_URL not set",
    };
    health.status = "degraded";
  } else {
    try {
      // Agent server health endpoint is at /auth/health (not /api/health)
      const response = await fetch(`${agentServerUrl}/auth/health`, {
        method: "GET",
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      
      if (response.ok) {
        health.checks.agent_server = {
          status: "healthy",
          message: "Agent server connection successful",
        };
      } else {
        health.checks.agent_server = {
          status: "unhealthy",
          message: `Agent server returned status ${response.status}`,
        };
        health.status = "unhealthy";
      }
    } catch (error) {
      health.checks.agent_server = {
        status: "unhealthy",
        message: error instanceof Error ? error.message : "Agent server connection failed",
      };
      health.status = "unhealthy";
    }
  }

  const responseTime = Date.now() - startTime;
  const statusCode = health.status === "unhealthy" ? 503 : 200;

  return NextResponse.json(
    {
      ...health,
      responseTime: `${responseTime}ms`,
    },
    { status: statusCode }
  );
}

