import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";
import { IAIEnrichment } from "../models/Festival";

// Load environment variables
dotenv.config();

// Define interfaces for the JSON structure to ensure type safety in your website
export interface GameEventData {
  entity: string;
  type: string;
  status: string;
  overview: {
    description: string;
    primary_platform: string;
    organizers: string[];
    objective: string;
    banner_image_url: string | null;
  };
  event_details: {
    current_edition: string;
    typical_duration: string;
    offerings: string[];
  };
  key_participants: {
    notable_studios: string[];
    featured_games: {
      title: string;
      developer: string;
      genre: string;
      image_url: string | null;
      steam_url: string | null;
    }[];
  };
  industry_context: {
    location: string;
    significance: string;
  };
}

/**
 * Converts GameEventData from API format to IAIEnrichment format for MongoDB
 */
export function convertToAIEnrichment(data: GameEventData): Omit<IAIEnrichment, 'enrichedAt' | 'enrichmentStatus' | 'version'> {
  return {
    entity: data.entity || null,
    type: data.type || null,
    status: data.status || null,
    overview: {
      description: data.overview?.description || null,
      primaryPlatform: data.overview?.primary_platform || null,
      organizers: data.overview?.organizers || [],
      objective: data.overview?.objective || null,
      bannerImageUrl: data.overview?.banner_image_url || null,
    },
    eventDetails: {
      currentEdition: data.event_details?.current_edition || null,
      typicalDuration: data.event_details?.typical_duration || null,
      offerings: data.event_details?.offerings || [],
    },
    keyParticipants: {
      notableStudios: data.key_participants?.notable_studios || [],
      featuredGames: (data.key_participants?.featured_games || []).map(game => ({
        title: game.title || '',
        developer: game.developer || '',
        genre: game.genre || '',
        imageUrl: game.image_url || null,
        steamUrl: game.steam_url || null,
      })),
    },
    industryContext: {
      location: data.industry_context?.location || null,
      significance: data.industry_context?.significance || null,
    },
  };
}

/**
 * Generates a structured JSON object with details about a game event using Google Search Grounding.
 * @param eventName The name of the event to search for (e.g., "Games From Vancouver").
 * @param apiKey Your Google Gemini API Key.
 * @returns A Promise resolving to the GameEventData object.
 */
export async function getGameEventDetails(
  eventName: string, 
  apiKey: string = process.env.GEMINI_API_KEY || ""
): Promise<GameEventData | null> {
  
  if (!apiKey) {
    throw new Error("API Key is missing. Please provide it as an argument or set GEMINI_API_KEY in .env");
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  // Use the gemini-2.0-flash model with Google Search tool enabled
  // Using type assertion as the SDK types may not be up to date with the API
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    tools: [{
        googleSearch: {} 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }] as any
  });

  const jsonStructureExample = `
  {
    "entity": "Event Name",
    "type": "Type of event (e.g., Sale, Expo, Tournament)",
    "status": "Current status",
    "overview": {
      "description": "Brief summary",
      "primary_platform": "Platform",
      "organizers": ["List of organizers"],
      "objective": "Goal",
      "banner_image_url": "URL to a logo or banner image if found in search results, else null"
    },
    "event_details": {
      "current_edition": "Date or Year",
      "typical_duration": "Duration",
      "offerings": ["List of offerings"]
    },
    "key_participants": {
      "notable_studios": ["List of studios"],
      "featured_games": [
        {
          "title": "Game Title", 
          "developer": "Dev Name", 
          "genre": "Genre",
          "image_url": "URL to game cover/header if found, else null",
          "steam_url": "Steam store page URL (e.g., https://store.steampowered.com/app/12345) if available, else null"
        }
      ]
    },
    "industry_context": {
      "location": "City/Region",
      "significance": "Why this matters"
    }
  }
  `;

  const prompt = `
  Find details about the video game event or sale named "${eventName}". 
  Use Google Search to find trusted, up-to-date sources.
  
  Extract the information and format it EXACTLY as a valid JSON object.
  Follow this structure example:
  ${jsonStructureExample}
  
  1. If specific text details are not found, use "N/A".
  2. For "banner_image_url" and "image_url", try to find a valid URL from the search result snippets or metadata if available. If no URL is explicitly clear, set it to null.
  3. Ensure "featured_games" contains real games associated with this specific event.
  4. For "steam_url", search for the game's Steam store page URL. Only include if you find a valid store.steampowered.com/app/ URL.
  5. Return ONLY the raw JSON string.
  `;

  try {
    console.log(`🔍 Searching details for: "${eventName}"...`);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean up markdown formatting if present
    text = text.replace(/^```json/g, "").replace(/```$/g, "").trim();

    const data: GameEventData = JSON.parse(text);
    
    console.log("✅ Data generated successfully.");
    return data;

  } catch (error) {
    console.error("❌ Error generating event data:", error);
    return null;
  }
}