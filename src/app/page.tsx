import SearchBar from "./components/SearchBar"; // Import the SearchBar component
import Image from "next/image";

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
        <SearchBar /> {/* Use the SearchBar component */}
        {/* You can remove the 'hello' text or place it elsewhere */}
      </main>
      {/* Optional Footer or other elements can go in row 3 */}
    </div>
  );
}
