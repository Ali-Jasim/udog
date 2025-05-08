"use client";

import { useState, useEffect, useCallback, useMemo } from "react"; // Added useMemo
import { useRouter, useSearchParams } from "next/navigation";
import SummonerCard from "./SummonerCard";
import LeaderboardDisplay from "./LeaderboardDisplay";
import { Button } from "@/components/ui/button";

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

// Define a type for suggestion data
interface Suggestion {
  name: string;
  // Potentially other fields like puuid if needed for direct linking/fetching
}

interface SearchBarProps {
  onClear?: () => void;
}

export default function SearchBar({ onClear }: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]); // State for suggestions
  const [showSuggestions, setShowSuggestions] = useState(false); // Control suggestion visibility
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [summonerData, setSummonerData] = useState<SummonerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dogPoints, setDogPoints] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);

  // Debounce function
  // Type TArgs for arguments array, ensuring it's an array of unknown types
  const debounce = <TArgs extends unknown[]>(
    func: (...args: TArgs) => void,
    delay: number
  ): ((...args: TArgs) => void) => {
    let timeoutId: ReturnType<typeof setTimeout>;
    return (...args: TArgs): void => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  // Renamed to fetchSuggestionsHandler and using useCallback for memoization
  // It now closes over setSuggestions and setShowSuggestions from the component state
  const fetchSuggestionsHandler = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      try {
        const res = await fetch(
          `/api/summoner-suggestions?query=${encodeURIComponent(query)}`
        );
        if (!res.ok) {
          console.error("Failed to fetch suggestions");
          setSuggestions([]);
          setShowSuggestions(false);
          return;
        }
        const data: Suggestion[] = await res.json();
        setSuggestions(data);
        setShowSuggestions(data.length > 0);
      } catch (err) {
        console.error("Error fetching suggestions:", err);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    },
    [setSuggestions, setShowSuggestions]
  ); // Dependencies are stable state setters

  // Debounced version of fetchSuggestionsHandler using useMemo for memoization
  const debouncedFetchSuggestions = useMemo(
    () => debounce(fetchSuggestionsHandler, 300),
    [fetchSuggestionsHandler] // Dependency is the memoized fetchSuggestionsHandler
  );

  useEffect(() => {
    // Only fetch suggestions if searchTerm is not empty AND
    // (no summonerData is loaded OR the loaded summonerData's name doesn't match the current searchTerm)
    const shouldFetch =
      searchTerm.trim() !== "" &&
      (!summonerData || summonerData.name !== searchTerm);

    if (shouldFetch) {
      debouncedFetchSuggestions(searchTerm);
    } else {
      // If not fetching (e.g., searchTerm is empty or matches loaded summonerData),
      // clear and hide suggestions.
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [
    searchTerm,
    debouncedFetchSuggestions,
    summonerData, // Added summonerData to dependencies
    setSuggestions,
    setShowSuggestions,
  ]);

  // Clear form and notify parent
  const handleClear = () => {
    setSearchTerm("");
    setSuggestions([]);
    setShowSuggestions(false);
    setSummonerData(null);
    setError(null);
    setHasVoted(false);
    setShowLeaderboard(false); // Explicitly hide leaderboard
    onClear?.();
    router.push(`/`); // Clear URL params
  };

  // Sync searchTerm and data with URL
  useEffect(() => {
    const nameParam = searchParams.get("name");
    const leaderboardParam = searchParams.get("leaderboard");

    if (nameParam) {
      setSearchTerm(nameParam);
      fetchSummoner(nameParam); // This will set showLeaderboard to false internally
      setShowSuggestions(false); // Hide suggestions when loading from URL
    } else if (leaderboardParam === "true") {
      // Clear any summoner specific state but ensure leaderboard is shown
      setSearchTerm("");
      setSummonerData(null);
      setError(null);
      setHasVoted(false);
      setShowLeaderboard(true);
      setShowSuggestions(false); // Hide suggestions when showing leaderboard from URL
    } else {
      // Default state, neither summoner search nor leaderboard explicitly requested via URL
      handleClear();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]); // Removed onClear from dependencies as it's a prop function

  // Extracted fetch logic to reuse
  async function fetchSummoner(name: string) {
    setLoading(true);
    setError(null);
    setSummonerData(null);
    setHasVoted(false);
    setShowLeaderboard(false); // Hide leaderboard when fetching summoner
    setShowSuggestions(false); // Hide suggestions when fetching summoner
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
    setShowLeaderboard(false); // Hide leaderboard on new search
    setShowSuggestions(false); // Hide suggestions on new search

    // Update URL so search is shareable
    router.push(`?name=${encodeURIComponent(searchTerm)}`);
    // Perform fetch
    fetchSummoner(searchTerm);
  };

  const handleSuggestionClick = (suggestionName: string) => {
    setSearchTerm(suggestionName);
    setSuggestions([]);
    setShowSuggestions(false);
    router.push(`?name=${encodeURIComponent(suggestionName)}`);
    fetchSummoner(suggestionName);
  };

  return (
    <div className="w-full max-w-md flex flex-col items-center gap-4">
      <form
        onSubmit={handleSearch}
        className="flex flex-col items-center gap-4 w-full" // Removed relative, as the new div will handle it
      >
        {/* Wrap input and suggestions in a div for relative positioning */}
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Enter Summoner Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() =>
              setShowSuggestions(suggestions.length > 0 && !!searchTerm)
            }
            // onBlur={() => setTimeout(() => setShowSuggestions(false), 100)} // Hide suggestions on blur with a small delay
            className="w-full px-4 py-2 bg-white border border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:border-transparent text-black placeholder-gray-400"
            disabled={loading}
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute top-full left-0 right-0 bg-white border border-neutral-600 rounded-md mt-1 z-10 max-h-60 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <li
                  key={index}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-black"
                  onClick={() => handleSuggestionClick(suggestion.name)}
                >
                  {suggestion.name}
                </li>
              ))}
            </ul>
          )}
        </div>
        {/* End of wrapper for input and suggestions */}

        <div className="flex gap-4">
          <Button
            type="submit"
            // Updated styles: white bg, black text, rounded corners, hover effect
            className="px-6 py-2 bg-white text-black rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 cursor-pointer transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading} // Disable button while loading
          >
            {loading ? "Searching..." : "Search"}
          </Button>
          <Button
            type="button"
            onClick={handleClear}
            className="px-6 py-2 bg-white text-black rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 cursor-pointer transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            Clear
          </Button>
        </div>
        <div>
          <Button
            className="px-6 py-2 bg-white text-black rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 cursor-pointer transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => {
              // Directly set states for showing leaderboard
              setSearchTerm("");
              setSuggestions([]);
              setShowSuggestions(false);
              setSummonerData(null);
              setError(null);
              setHasVoted(false);
              setShowLeaderboard(true);
              router.push("/?leaderboard=true");
            }}
          >
            Leaderboard
          </Button>
        </div>
      </form>

      {/* Display Results, Loading, or Error */}
      <div className="mt-6 w-full text-center">
        {loading && <p className="text-gray-400">Loading...</p>}
        {error && <p className="text-red-500">Error: {error}</p>}
        {summonerData && !showLeaderboard && (
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
        {showLeaderboard && <LeaderboardDisplay />}
      </div>
    </div>
  );
}
