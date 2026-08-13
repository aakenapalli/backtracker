import { createServer } from "node:http";
import { ItineraryController } from "./controllers/itinerary.controller.ts";
import { SiteController } from "./controllers/site.controller.ts";
import { closePool, pool } from "./db/pool.ts";
import type { GenerateItineraryRequestDto } from "./types/api.ts";

const itineraryController = new ItineraryController();
const siteController = new SiteController();
const PORT = 8787;
const HOST = "127.0.0.1";

function sendJson(response: import("node:http").ServerResponse, statusCode: number, payload: unknown) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  });
  response.end(JSON.stringify(payload));
}

const server = createServer(async (request, response) => {
  if (!request.url || !request.method) {
    sendJson(response, 400, { error: "Invalid request." });
    return;
  }

  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    });
    response.end();
    return;
  }

  if (request.method === "GET" && request.url === "/api/health") {
    try {
      await pool.query("SELECT 1");
      sendJson(response, 200, { ok: true, database: "up" });
    } catch (error) {
      console.error("Health check failed:", error);
      sendJson(response, 503, { ok: false, database: "down" });
    }
    return;
  }

  if (request.method === "GET" && request.url === "/api/sites") {
    try {
      sendJson(response, 200, await siteController.listSites());
    } catch (error) {
      console.error("Failed to load sites:", error);
      sendJson(response, 500, { error: "Failed to load sites." });
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
      sendJson(response, 400, { error: "Invalid itinerary request payload." });
      return;
    }

    try {
      const itinerary = await itineraryController.generate(payload);
      sendJson(response, 200, itinerary);
    } catch (error) {
      console.error("Failed to generate itinerary:", error);
      sendJson(response, 500, { error: "Failed to generate itinerary." });
    }

    return;
  }

  sendJson(response, 404, { error: "Route not found." });
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
