import type { Metadata } from "next";
import { renderFairIsle } from "@/lib/fairisle-renderer";
import { readTotalSupply } from "@/lib/chain";
import { CANONICAL_ORIGIN, MINIAPP_ORIGIN } from "@/lib/urls";
import { CollectionGrid, type TokenCard } from "./CollectionGrid";
import { Snowfall } from "../components/Snowfall";
import { MiniAppReady } from "../components/MiniAppReady";
import Link from "next/link";

// Supply grows as people knit, and this is the page people check straight
// after minting — so it re-reads every minute rather than every five.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "The Collection | Onchain Fair Isle",
  description:
    "Every Fair Isle knitted so far: palettes, rare Nordic Rainbows, and giant snowflakes.",
  openGraph: {
    title: "The Collection | Onchain Fair Isle",
    description:
      "Every Fair Isle knitted so far: palettes, rare Nordic Rainbows, and giant snowflakes.",
    images: [`${CANONICAL_ORIGIN}/hero.png`],
  },
  other: {
    // Launches into the collection rather than the mint page, so a shared
    // grid opens where the reader expected to land.
    "fc:miniapp": JSON.stringify({
      version: "1",
      imageUrl: `${MINIAPP_ORIGIN}/image.png`,
      button: {
        title: "Browse the collection",
        action: {
          type: "launch_miniapp",
          name: "Onchain Fair Isle",
          url: `${MINIAPP_ORIGIN}/collection`,
          splashImageUrl: `${MINIAPP_ORIGIN}/splash-200.png`,
          splashBackgroundColor: "#0a0a0a",
        },
      },
    }),
  },
};

export default async function CollectionPage() {
  const totalSupply = await readTotalSupply();

  // Traits are a pure function of the tokenId — the same renderer the art
  // uses, so the grid can never disagree with what a token actually looks
  // like. 50k-stitch SVGs stay out of it; cells use the cached PNG route.
  const tokens: TokenCard[] = Array.from({ length: totalSupply }, (_, id) => {
    const { palette, isRare, hasGiantSnowflake } = renderFairIsle(id);
    return { id, palette: palette.name, isRare, hasGiantSnowflake };
  });

  return (
    <main
      style={{
        maxWidth: 1000,
        margin: "0 auto",
        padding: "2rem 1rem 4rem",
        position: "relative",
        zIndex: 1,
      }}
    >
      <Snowfall />
      <MiniAppReady />
      {/* Positioned above the fixed zIndex:0 snow — without this, positioned-
          at-zero paints over non-positioned content and flakes cross the art. */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <p style={{ marginBottom: "1rem", fontSize: "0.85rem" }}>
          <Link href="/" style={{ color: "var(--muted)" }}>
            ← Knit your own
          </Link>
        </p>
        <header style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            The Collection
          </h1>
        </header>
        <CollectionGrid tokens={tokens} />
      </div>
    </main>
  );
}
