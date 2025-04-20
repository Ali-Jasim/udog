"use client";

import React from "react";
import Image from "next/image";

interface SummonerData {
  name: string;
  profileIconUrl: string;
  level: number;
}

interface SummonerCardProps {
  name: string;
  votingDisabled: boolean;
  data: SummonerData;
  downvotes: number;
  onDownvote: () => void;
}

export default function SummonerCard({
  name,
  votingDisabled,
  data,
  downvotes,
  onDownvote,
}: SummonerCardProps) {
  return (
    <div className="flex flex-col items-center gap-2 p-4 bg-neutral-800 rounded-lg border border-gray-700">
      <Image
        src={data.profileIconUrl}
        alt={`${data.name} profile icon`}
        width={80}
        height={80}
        className="rounded-full border-2 border-neutral-500"
      />
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-semibold text-white">{name}</h2>
        <p className="text-gray-300">Level {data.level}</p>
      </div>

      <div>
        <span className="text-white font-semibold flex justify-center items-center ">
          <Image
            src="/udog-logo.png"
            alt="Dog icon"
            width={50}
            height={50}
            className="inline-block mr-1"
          ></Image>
          {downvotes}
        </span>
      </div>

      <div className="flex items-center justify-center gap-4 w-full">
        <p className="text-gray-300 text-md">Is this player a dog? </p>
        <button
          onClick={onDownvote}
          disabled={votingDisabled}
          className="flex items-center gap-1 px-4 py-2 bg-white text-black rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white transition-colors duration-150 disabled:opacity-50"
        >
          <Image
            src="/udog-logo.png"
            alt="Dog icon"
            width={20}
            height={20}
            className="inline-block mr-1"
          ></Image>
          {votingDisabled ? "Voted" : "Vote"}
        </button>
      </div>
    </div>
  );
}
