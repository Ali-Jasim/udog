"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SummonerCard from "./SummonerCard";

// Define a type for the summoner data we expect
interface SummonerData {
  puuid: string;
  summonerId: string;
  name: string;
  profileIconUrl: string;
  level: number;
  gameName: string;
  tagLine: string;
  dogPoints: number;
}

interface SearchBarProps {
  onClear?: () => void;
}

export default function SearchBar({ onClear }: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  // Clear form and notify parent
  const handleClear = () => {
    setSearchTerm("");
    setSummonerData(null);
    setError(null);
    setHasVoted(false);
    onClear?.();
  };
  const [summonerData, setSummonerData] = useState<SummonerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dogPoints, setDogPoints] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);

  // Sync searchTerm and data with URL
  useEffect(() => {
    const nameParam = searchParams.get("name");
    if (nameParam) {
      setSearchTerm(nameParam);
      fetchSummoner(nameParam);
    } else {
      handleClear();
    }
  }, [searchParams]);

  // Extracted fetch logic to reuse
  async function fetchSummoner(name: string) {
    setLoading(true);
    setError(null);
    setSummonerData(null);
    setHasVoted(false);
    try {
      const res = await fetch(`/api/summoner?name=${encodeURIComponent(name)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error: ${res.status}`);
      setSummonerData(data);
      setDogPoints(data.dogPoints);
    } catch (err: unknown) {
      console.error("Fetch failed:", err);
      const message =
        err instanceof Error ? err.message : "Failed to fetch summoner data.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!searchTerm.trim()) return; // Don't search if input is empty

    // Update URL so search is shareable
    router.push(`?name=${encodeURIComponent(searchTerm)}`);
    // Perform fetch
    fetchSummoner(searchTerm);
  };

  return (
    <div className="w-full max-w-md flex flex-col items-center gap-4">
      <form
        onSubmit={handleSearch}
        className="flex flex-col items-center gap-4 w-full"
      >
        <input
          type="text"
          placeholder="Enter Summoner Name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          // Updated styles for dark mode: dark bg, light text, rounded corners
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
          disabled={loading} // Disable input while loading
        />
        <div className="flex gap-4">
          <button
            type="submit"
            // Updated styles: white bg, black text, rounded corners, hover effect
            className="px-6 py-2 bg-white text-black rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 cursor-pointer transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading} // Disable button while loading
          >
            {loading ? "Searching..." : "Search"}
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="px-6 py-2 bg-white text-black rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 cursor-pointer transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            Clear
          </button>
        </div>
      </form>

      {/* Display Results, Loading, or Error */}
      <div className="mt-6 w-full text-center">
        {loading && <p className="text-gray-400">Loading...</p>}
        {error && <p className="text-red-500">Error: {error}</p>}
        {summonerData && (
          <SummonerCard
            name={summonerData.name}
            votingDisabled={hasVoted}
            data={summonerData}
            downvotes={dogPoints}
            onDownvote={async () => {
              // update server and refresh points
              const res = await fetch("/api/summoner", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  puuid: summonerData.puuid,
                  increment: 1,
                }),
              });
              const json = await res.json();
              setDogPoints(json.dogPoints);
              setHasVoted(true);
            }}
          />
        )}
      </div>
    </div>
  );
}
