import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

// Custom error class to carry HTTP status
class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error("MONGODB_URI is not configured.");

// Use a cached connection promise to avoid multiple connections in development
let cachedPromise: Promise<typeof mongoose> | null = null;
async function connectToDB() {
  if (!cachedPromise) {
    cachedPromise = mongoose.connect(MONGODB_URI!);
  }
  return cachedPromise;
}

// Summoner schema and model
interface ISummonerDoc extends mongoose.Document {
  puuid: string;
  summonerId: string;
  name: string;
  profileIconUrl: string;
  level: number;
  dogPoints: number;
}
const SummonerSchema = new mongoose.Schema<ISummonerDoc>(
  {
    puuid: { type: String, required: true, unique: true },
    summonerId: { type: String, required: true },
    name: { type: String, required: true },
    profileIconUrl: { type: String, required: true },
    level: { type: Number, required: true },
    dogPoints: { type: Number, default: 0 },
  },
  { timestamps: true }
);
const SummonerModel =
  mongoose.models.Summoner ||
  mongoose.model<ISummonerDoc>("Summoner", SummonerSchema);

const RIOT_API_KEY = process.env.RIOT_API_KEY;
// Platform routing values (e.g., na1, euw1) for Summoner API
const RIOT_PLATFORM_BASE_URL = "https://na1.api.riotgames.com"; // Adjust platform region if needed (e.g., euw1, kr)
// Regional routing values (e.g., americas, europe, asia) for Account API
const RIOT_REGIONAL_BASE_URL = "https://americas.api.riotgames.com"; // Adjust regional route if needed (e.g., europe, asia)
const DDRAGON_VERSION = "14.7.1"; // Use a recent Data Dragon version (Update periodically)

// Helper function to make Riot API calls and handle errors
async function fetchRiotApi(url: string) {
  if (!RIOT_API_KEY) {
    throw new ApiError("API key is not configured.", 500);
  }
  const response = await fetch(url, {
    headers: { "X-Riot-Token": RIOT_API_KEY },
  });

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ message: "Failed to parse error JSON" }));
    console.error(
      `Riot API Error (${response.status}) calling ${url}:`,
      errorData
    );
    const message =
      errorData?.status?.message || `Riot API Error: ${response.status}`;
    throw new ApiError(message, response.status);
  }
  return response.json();
}

export async function GET(request: NextRequest) {
  if (!RIOT_API_KEY) {
    return NextResponse.json(
      { error: "Server configuration error: API key missing." },
      { status: 500 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const riotIdQuery = searchParams.get("name"); // Expecting gameName#tagLine

  if (!riotIdQuery || !riotIdQuery.includes("#")) {
    return NextResponse.json(
      {
        error: "Invalid format. Please enter Riot ID (e.g., gameName#tagLine)",
      },
      { status: 400 }
    );
  }

  const [gameName, tagLine] = riotIdQuery.split("#");

  if (!gameName || !tagLine) {
    return NextResponse.json(
      {
        error:
          "Invalid Riot ID format. Both gameName and tagLine are required.",
      },
      { status: 400 }
    );
  }

  try {
    // --- Step 1: Get PUUID from Riot ID using Account API ---
    // Docs: https://developer.riotgames.com/apis#account-v1/GET_getByRiotId
    const accountUrl = `${RIOT_REGIONAL_BASE_URL}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(
      gameName
    )}/${encodeURIComponent(tagLine)}`;
    console.log(`Fetching PUUID from: ${accountUrl}`); // Log the URL being called
    const accountData = await fetchRiotApi(accountUrl);

    const puuid = accountData.puuid;
    if (!puuid) {
      // This case should ideally be covered by fetchRiotApi's error handling, but double-check
      console.error("PUUID not found in account data:", accountData);
      throw new Error("PUUID could not be retrieved for the given Riot ID.");
    }
    console.log(`Received PUUID: ${puuid}`);

    // --- Step 2: Get Summoner Data from PUUID using LoL Summoner API ---
    // Docs: https://developer.riotgames.com/apis#summoner-v4/GET_getByPUUID
    const summonerUrl = `${RIOT_PLATFORM_BASE_URL}/lol/summoner/v4/summoners/by-puuid/${puuid}`;
    console.log(`Fetching Summoner data from: ${summonerUrl}`); // Log the URL being called
    const summonerData = await fetchRiotApi(summonerUrl);
    console.log("Received Summoner data:", summonerData);

    // --- Step 3.5: Get correct Riot ID (gameName and tagLine) by PUUID ---
    const accountByPuuidUrl = `${RIOT_REGIONAL_BASE_URL}/riot/account/v1/accounts/by-puuid/${puuid}`;
    console.log(`Fetching account info by PUUID from: ${accountByPuuidUrl}`);
    const accountInfoByPuuid = await fetchRiotApi(accountByPuuidUrl);
    const riotTag = `${accountInfoByPuuid.gameName}#${accountInfoByPuuid.tagLine}`;

    // --- Step 3: Construct Profile Icon URL ---
    // Docs: https://developer.riotgames.com/docs/lol#data-dragon_profile-icons
    const profileIconUrl = `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/${summonerData.profileIconId}.png`;

    // --- Step 4: Save/update Summoner in MongoDB and get dogPoints ---
    await connectToDB();
    const dbEntry = await SummonerModel.findOneAndUpdate(
      { puuid },
      {
        summonerId: summonerData.id,
        name: riotTag,
        profileIconUrl,
        level: summonerData.summonerLevel,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // --- Step 5: Return the combined data including dogPoints ---
    return NextResponse.json({
      puuid,
      summonerId: summonerData.id,
      name: riotTag,
      profileIconUrl,
      level: summonerData.summonerLevel,
      gameName: accountInfoByPuuid.gameName,
      tagLine: accountInfoByPuuid.tagLine,
      dogPoints: dbEntry!.dogPoints,
    });
  } catch (error) {
    console.error("API route error:", error);
    const status = error instanceof ApiError ? error.status : 500;
    let errorMessage =
      error instanceof Error
        ? error.message
        : "An internal server error occurred.";

    // Provide more specific feedback based on status
    if (status === 403) {
      errorMessage =
        "Forbidden - Check Riot API Key (valid, not expired, correct permissions) and ensure it matches the region/platform being queried.";
    } else if (status === 404) {
      errorMessage =
        "Riot ID or associated Summoner data not found. Check spelling, tagLine, and region.";
    } else if (status === 400) {
      errorMessage = "Bad Request - Check the format of the Riot ID.";
    } else if (status === 429) {
      errorMessage = "Rate limit exceeded. Please wait before trying again.";
    }

    return NextResponse.json({ error: errorMessage }, { status: status });
  }
}

// Handle vote updates
export async function POST(request: NextRequest) {
  const { puuid, increment } = await request.json();
  await connectToDB();
  const updated = await SummonerModel.findOneAndUpdate(
    { puuid },
    { $inc: { dogPoints: increment } },
    { new: true }
  );
  if (!updated) {
    return NextResponse.json({ error: "Summoner not found" }, { status: 404 });
  }
  return NextResponse.json({ dogPoints: updated.dogPoints });
}
