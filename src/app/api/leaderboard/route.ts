import { NextResponse } from "next/server";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not configured.");
}

// Reuse connection caching pattern
let cachedPromise: Promise<typeof mongoose> | null = null;
async function connectToDB() {
  if (!cachedPromise) {
    cachedPromise = mongoose.connect(MONGODB_URI!);
  }
  return cachedPromise;
}

// Define Summoner schema matching the one in summoner route
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

export async function GET() {
  // Connect to the database
  await connectToDB();

  // Fetch top 20 summoners sorted by dogPoints descending
  const entries = await SummonerModel.find(
    {},
    { puuid: 1, name: 1, dogPoints: 1, profileIconUrl: 1, _id: 0 }
  )
    .sort({ dogPoints: -1 })
    .limit(20)
    .lean();

  return NextResponse.json(entries);
}
