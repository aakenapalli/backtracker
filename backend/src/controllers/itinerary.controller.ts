import type { GenerateItineraryRequestDto, GenerateItineraryResponseDto } from "../types/api.ts";
import { ItineraryService } from "../services/itinerary.service.ts";

export class ItineraryController {
  private readonly itineraryService: ItineraryService;

  constructor(itineraryService = new ItineraryService()) {
    this.itineraryService = itineraryService;
  }

  async generate(payload: GenerateItineraryRequestDto): Promise<GenerateItineraryResponseDto> {
    return {
      itinerary: await this.itineraryService.generateItinerary(payload.preferences),
    };
  }
}
