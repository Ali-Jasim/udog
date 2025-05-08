"use client";

import React from "react";
import Image from "next/image";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
    <Card className="flex flex-col  justify-center items-center p-4 bg-neutral-950 border-neutral-700">
      <CardHeader className="flex flex-col items-center  p-0">
        <Image
          src={data.profileIconUrl}
          alt=""
          width={80}
          height={80}
          className="rounded-full border-2 border-neutral-500"
        />
        <CardTitle className="text-white">{name}</CardTitle>
        <CardDescription>Level {data.level}</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex justify-center items-center text-white font-semibold pt-5">
          <Image
            src="/udog-logo.png"
            alt="Dog icon"
            width={50}
            height={50}
            className="inline-block mr-1"
          />
          {downvotes}
        </div>
      </CardContent>

      <CardFooter className="flex flex-col items-center w-full gap-2">
        <p className="text-gray-300">Is this player a dog?</p>
        <Button
          onClick={onDownvote}
          disabled={votingDisabled}
          className="flex items-center gap-1 px-4  bg-white text-black rounded-md hover:bg-gray-200 cursor-pointer disabled:opacity-50 transition"
        >
          <Image
            src="/udog-logo.png"
            alt="Dog icon"
            width={20}
            height={20}
            className="inline-block mr-1"
          />
          {votingDisabled ? "Voted" : "Vote"}
        </Button>
      </CardFooter>
    </Card>
  );
}
