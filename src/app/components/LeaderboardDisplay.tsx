"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Image from "next/image";

interface SummonerEntry {
  puuid: string;
  name: string;
  dogPoints: number;
  profileIconUrl: string;
}

export default function LeaderboardDisplay() {
  const [summoners, setSummoners] = useState<SummonerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/leaderboard`, { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`Failed to fetch leaderboard: ${res.statusText}`);
        }
        const data = await res.json();
        setSummoners(data);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "An unknown error occurred.";
        setError(message);
        console.error("Failed to fetch leaderboard:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, []);

  if (loading) {
    return <p className="text-gray-400">Loading leaderboard...</p>;
  }

  if (error) {
    return <p className="text-red-500">Error: {error}</p>;
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left">#</th>
                  <th className="px-4 py-2 text-left">Summoner</th>
                  <th className="py-2 text-left">Dog Points</th>
                </tr>
              </thead>
              <tbody>
                {summoners.slice(0, 5).map((s, index) => (
                  <tr key={s.puuid} className="border-t last:border-b-0">
                    <td className="px-4 py-2">{index + 1}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center">
                        <Image
                          src={s.profileIconUrl}
                          alt=""
                          width={20}
                          height={20}
                          className="rounded-full mr-2"
                        />
                        <span>{s.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <Image
                        src="/udog-logo.png"
                        alt="udog logo"
                        width={20}
                        height={20}
                        className="inline mr-1"
                      />
                      {s.dogPoints}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
