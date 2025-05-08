import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

// MongoDB URI and Connection
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  // Log the error on the server, but don't expose details to the client.
  console.error("MONGODB_URI is not configured.");
  // Consider throwing an error here if the application cannot start without DB,
  // or handle it gracefully in connectToDB.
}

let cachedPromise: Promise<typeof mongoose> | null = null;
async function connectToDB() {
  if (!MONGODB_URI) {
    // This check is important to prevent attempts to connect with an undefined URI.
    console.error("MongoDB URI is not defined. Cannot connect to database.");
    throw new Error("Server configuration error: Database URI not set.");
  }
  if (!cachedPromise) {
    cachedPromise = mongoose
      .connect(MONGODB_URI)
      .then((mongooseInstance) => {
        console.log("MongoDB connected successfully.");
        return mongooseInstance;
      })
      .catch((err) => {
        console.error("MongoDB connection error:", err);
        cachedPromise = null; // Reset cache on connection error
        throw err; // Re-throw to be caught by calling function
      });
  }
  return cachedPromise;
}

// Summoner schema and model (consistent with your summoner route)
interface ISummonerDoc extends mongoose.Document {
  puuid: string;
  summonerId: string;
  name: string; // This is the Riot ID (gameName#tagLine)
  profileIconUrl: string;
  level: number;
  dogPoints: number;
}

const SummonerSchema = new mongoose.Schema<ISummonerDoc>(
  {
    puuid: { type: String, required: true, unique: true },
    summonerId: { type: String, required: true },
    name: { type: String, required: true, index: true }, // Added index for better query performance
    profileIconUrl: { type: String, required: true },
    level: { type: Number, required: true },
    dogPoints: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Avoid recompiling the model if it already exists
const SummonerModel =
  mongoose.models.Summoner ||
  mongoose.model<ISummonerDoc>("Summoner", SummonerSchema);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (!query) {
    return NextResponse.json(
      { error: "Query parameter is required" },
      { status: 400 }
    );
  }

  try {
    await connectToDB();

    // Find summoners whose name contains the query string (case-insensitive)
    // The 'name' field stores the Riot ID (gameName#tagLine)
    const summoners = await SummonerModel.find({
      name: { $regex: query, $options: "i" }, // 'i' for case-insensitive
    })
      .select("name") // Only select the name field
      .limit(10) // Limit the number of suggestions
      .lean(); // Use .lean() for faster queries when you don't need Mongoose documents

    return NextResponse.json(summoners);
  } catch (error) {
    console.error("Error fetching summoner suggestions:", error);
    // Determine if it's a connection error or other server error
    const errorMessage =
      error instanceof Error &&
      error.message.includes("Server configuration error")
        ? error.message
        : "Failed to fetch summoner suggestions due to a server error.";
    const status =
      error instanceof Error &&
      error.message.includes("Server configuration error")
        ? 503
        : 500;

    return NextResponse.json({ error: errorMessage }, { status });
  }
}
