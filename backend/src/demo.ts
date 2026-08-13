import { ItineraryController } from "./controllers/itinerary.controller.ts";
import { closePool } from "./db/pool.ts";
import type { GenerateItineraryRequestDto } from "./types/api.ts";

const controller = new ItineraryController();

const request: GenerateItineraryRequestDto = {
  preferences: {
    city: "istanbul",
    days: 2,
    hoursPerDay: 8,
    walkingTolerance: "medium",
    budgetSensitivity: "medium",
    familiarity: "beginner",
    themes: ["byzantine", "architecture", "religious-history"],
    mustSeeSlugs: ["hagia-sophia", "blue-mosque"],
  },
};

const response = await controller.generate(request);

console.log(JSON.stringify(response, null, 2));

await closePool();
