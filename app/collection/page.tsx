import type { Metadata } from "next";
import { renderFairIsle } from "@/lib/fairisle-renderer";
import { readTotalSupply } from "@/lib/chain";
import { CANONICAL_ORIGIN } from "@/lib/urls";
import { CollectionGrid, type TokenCard } from "./CollectionGrid";
import { Snowfall } from "../components/Snowfall";

// Supply grows as people knit; re-read it every five minutes.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "The Collection — Onchain Fair Isle",
  description:
    "Every Fair Isle knitted so far — palettes, rare Nordic Rainbows, and giant snowflakes.",
  openGraph: {
    title: "The Collection — Onchain Fair Isle",
    description:
      "Every Fair Isle knitted so far — palettes, rare Nordic Rainbows, and giant snowflakes.",
    images: [`${CANONICAL_ORIGIN}/hero.png`],
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
      <header style={{ textAlign: "center", marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          The Collection
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "0.95rem" }}>
          {totalSupply} sweaters knitted so far &mdash; each one a pure function of its
          token ID.
        </p>
      </header>
      <CollectionGrid tokens={tokens} />
    </main>
  );
}
