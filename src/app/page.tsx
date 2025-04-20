"use client";
import SearchBar from "./components/SearchBar";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense } from "react";

export default function Home() {
  const router = useRouter();
  function clearSearch() {
    router.push("/");
  }
  return (
    <div className="grid grid-rows-[auto_1fr_auto] items-center justify-items-center min-h-screen font-[family-name:var(--font-geist-sans)]">
      {/* Adjusted grid-rows for better flexibility */}
      <main className="flex flex-col gap-2 row-start-2 items-center w-full">
        <Link href="/" onClick={clearSearch}>
          {" "}
          <Image
            className=""
            src="/udog-logo.png"
            alt="Udog logo"
            width={250}
            height={250}
          />
        </Link>
        {/* Optional Title */}
        <Suspense fallback={<div>Loading search bar...</div>}>
          <SearchBar onClear={clearSearch} />
        </Suspense>{" "}
        {/* Wrapped in Suspense for useSearchParams hook */}
      </main>
      {/* Optional Footer or other elements can go in row 3 */}
    </div>
  );
}
