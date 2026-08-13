import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { ItineraryController } from "./controllers/itinerary.controller.ts";
import { SiteController } from "./controllers/site.controller.ts";
import { closePool, pool } from "./db/pool.ts";
import type { GenerateItineraryRequestDto } from "./types/api.ts";

const itineraryController = new ItineraryController();
const siteController = new SiteController();
const PORT = Number(process.env.PORT ?? 8787);
const HOST = process.env.HOST ?? "0.0.0.0";

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

function corsHeaders(requestOrigin: string | undefined): Record<string, string> {
  const allowOrigin =
    allowedOrigins.length === 0
      ? "*"
      : requestOrigin && allowedOrigins.includes(requestOrigin)
        ? requestOrigin
        : allowedOrigins[0];

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    Vary: "Origin",
  };
}

function sendJson(request: IncomingMessage, response: ServerResponse, statusCode: number, payload: unknown) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json",
    ...corsHeaders(request.headers.origin),
  });
  response.end(JSON.stringify(payload));
}

const server = createServer(async (request, response) => {
  if (!request.url || !request.method) {
    sendJson(request, response, 400, { error: "Invalid request." });
    return;
  }

  if (request.method === "OPTIONS") {
    response.writeHead(204, corsHeaders(request.headers.origin));
    response.end();
    return;
  }

  if (request.method === "GET" && request.url === "/api/ping") {
    sendJson(request, response, 200, { ok: true });
    return;
  }

  if (request.method === "GET" && request.url === "/api/health") {
    try {
      await pool.query("SELECT 1");
      sendJson(request, response, 200, { ok: true, database: "up" });
    } catch (error) {
      console.error("Health check failed:", error);
      sendJson(request, response, 503, { ok: false, database: "down" });
    }
    return;
  }

  if (request.method === "GET" && request.url === "/api/sites") {
    try {
      sendJson(request, response, 200, await siteController.listSites());
    } catch (error) {
      console.error("Failed to load sites:", error);
      sendJson(request, response, 500, { error: "Failed to load sites." });
    }
    return;
  }

  if (request.method === "POST" && request.url === "/api/itinerary/generate") {
    let rawBody = "";

    for await (const chunk of request) {
      rawBody += chunk;
    }

    let payload: GenerateItineraryRequestDto;

    try {
      payload = JSON.parse(rawBody) as GenerateItineraryRequestDto;
    } catch {
      sendJson(request, response, 400, { error: "Invalid itinerary request payload." });
      return;
    }

    try {
      const itinerary = await itineraryController.generate(payload);
      sendJson(request, response, 200, itinerary);
    } catch (error) {
      console.error("Failed to generate itinerary:", error);
      sendJson(request, response, 500, { error: "Failed to generate itinerary." });
    }

    return;
  }

  sendJson(request, response, 404, { error: "Route not found." });
});

server.listen(PORT, HOST, () => {
  console.log(`Planner API server listening at http://${HOST}:${PORT}`);
});

async function shutdown(signal: string): Promise<void> {
  console.log(`Received ${signal}, shutting down...`);
  server.close(() => {
    console.log("HTTP server closed.");
  });
  await closePool();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
