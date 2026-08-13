import type { GeneratedItineraryView, PlannerPreferences } from "../types/planner";

export const defaultPreferences: PlannerPreferences = {
  city: "istanbul",
  days: 2,
  hoursPerDay: 8,
  walkingTolerance: "medium",
  budgetSensitivity: "medium",
  familiarity: "beginner",
  themes: ["byzantine", "architecture", "religious-history"],
  mustSeeSlugs: ["hagia-sophia", "blue-mosque"],
};

export const mockItinerary: GeneratedItineraryView = {
  city: "istanbul",
  tripSummary:
    "A 2-day Istanbul itinerary focused on Byzantine, architecture, and religious history, balanced around your time, walking, and must-see priorities.",
  warnings: [],
  optionalSiteSlugs: ["chora-church"],
  omittedMustSeeSlugs: [],
  days: [
    {
      dayNumber: 1,
      totalVisitMinutes: 365,
      totalTravelMinutes: 68,
      totalPlannedMinutes: 433,
      stops: [
        {
          siteSlug: "hagia-sophia",
          name: "Hagia Sophia",
          neighborhood: "Sultanahmet",
          latitude: 41.0086,
          longitude: 28.9802,
          required: true,
          visitMinutes: 75,
          waitMinutes: 20,
          totalStopMinutes: 95,
          walkFromPreviousMinutes: 0,
          distanceFromPreviousKm: 0,
          historicalSignificance:
            "Hagia Sophia captures the layered transformation of Istanbul from Byzantine capital to Ottoman imperial city through religion, architecture, and political symbolism.",
          reasonIncluded:
            "Included as one of your must-see sites with strong Byzantine and religious history relevance.",
          advanceTicketRequired: false,
          mustBookAhead: false,
          openingHoursNote: "Expect heavier security lines during peak daytime hours.",
          themes: ["byzantine", "religious-history", "architecture", "ottoman"],
          nearbyRelatedSiteSlugs: ["blue-mosque", "basilica-cistern", "topkapi-palace"],
        },
        {
          siteSlug: "basilica-cistern",
          name: "Basilica Cistern",
          neighborhood: "Sultanahmet",
          latitude: 41.0084,
          longitude: 28.9779,
          required: true,
          visitMinutes: 45,
          waitMinutes: 25,
          totalStopMinutes: 70,
          walkFromPreviousMinutes: 5,
          distanceFromPreviousKm: 0.19,
          historicalSignificance:
            "The Basilica Cistern shows the infrastructural sophistication of Byzantine Constantinople and adds a material layer to understanding how the capital sustained itself.",
          reasonIncluded:
            "Included as a core stop because it strengthens your Byzantine and architecture route in Sultanahmet.",
          advanceTicketRequired: true,
          mustBookAhead: true,
          recommendedBookingNotes: "Advance tickets are recommended during peak season.",
          themes: ["byzantine", "architecture"],
          nearbyRelatedSiteSlugs: ["hagia-sophia"],
        },
        {
          siteSlug: "blue-mosque",
          name: "Blue Mosque",
          neighborhood: "Sultanahmet",
          latitude: 41.0054,
          longitude: 28.9768,
          required: true,
          visitMinutes: 45,
          waitMinutes: 15,
          totalStopMinutes: 60,
          walkFromPreviousMinutes: 5,
          distanceFromPreviousKm: 0.35,
          historicalSignificance:
            "The Blue Mosque represents Ottoman imperial ambition, religious patronage, and the visual dialogue between Ottoman and Byzantine monumental architecture.",
          reasonIncluded:
            "Included as one of your must-see sites with strong religious history and architecture relevance.",
          advanceTicketRequired: false,
          mustBookAhead: false,
          openingHoursNote: "Tourist access is limited around prayer times.",
          themes: ["ottoman", "religious-history", "architecture"],
          nearbyRelatedSiteSlugs: ["hagia-sophia", "hippodrome-of-constantinople"],
        },
      ],
    },
    {
      dayNumber: 2,
      totalVisitMinutes: 150,
      totalTravelMinutes: 28,
      totalPlannedMinutes: 178,
      stops: [
        {
          siteSlug: "suleymaniye-mosque",
          name: "Suleymaniye Mosque",
          neighborhood: "Eminonu",
          latitude: 41.0162,
          longitude: 28.9637,
          required: true,
          visitMinutes: 60,
          waitMinutes: 5,
          totalStopMinutes: 65,
          walkFromPreviousMinutes: 0,
          distanceFromPreviousKm: 0,
          historicalSignificance:
            "The Suleymaniye Mosque is one of the clearest architectural statements of Ottoman imperial confidence and an essential site for understanding religious, political, and urban history together.",
          reasonIncluded:
            "Included as a core stop because it strengthens your religious history and architecture route in Eminonu.",
          advanceTicketRequired: false,
          mustBookAhead: false,
          themes: ["ottoman", "religious-history", "architecture"],
          nearbyRelatedSiteSlugs: ["grand-bazaar", "hagia-sophia"],
        },
        {
          siteSlug: "chora-church",
          name: "Chora Church",
          neighborhood: "Edirnekapi",
          latitude: 41.0317,
          longitude: 28.9392,
          required: false,
          visitMinutes: 60,
          waitMinutes: 15,
          totalStopMinutes: 75,
          walkFromPreviousMinutes: 28,
          distanceFromPreviousKm: 2.1,
          historicalSignificance:
            "Chora Church is one of the strongest sites for understanding late Byzantine artistic achievement and provides important depth beyond Hagia Sophia in the Byzantine story.",
          reasonIncluded:
            "Added as a flexible supporting stop near your other Byzantine and religious history visits.",
          advanceTicketRequired: false,
          mustBookAhead: false,
          themes: ["byzantine", "religious-history", "architecture"],
          nearbyRelatedSiteSlugs: ["hagia-sophia", "fener-walking-area"],
        },
      ],
    },
  ],
};

