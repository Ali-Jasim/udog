import SearchBar from "./components/SearchBar";
import Image from "next/image";
import { Suspense } from "react";

export default function Home() {
  return (
    <div className="grid grid-rows-[auto_1fr_auto] items-center justify-items-center min-h-screen font-[family-name:var(--font-geist-sans)]">
      {/* Adjusted grid-rows for better flexibility */}
      <main className="flex flex-col gap-2 row-start-2 items-center w-full">
        <Image
          className=""
          src="/udog-logo.png"
          alt="Udog logo"
          width={250}
          height={250}
        />
        {/* Optional Title */}
        <Suspense fallback={<div>Loading search bar...</div>}>
          <SearchBar />
        </Suspense>{" "}
        {/* Wrapped in Suspense for useSearchParams hook */}
        {/* You can remove the 'hello' text or place it elsewhere */}
      </main>
      {/* Optional Footer or other elements can go in row 3 */}
    </div>
  );
}
