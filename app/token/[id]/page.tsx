import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { renderFairIsle } from "@/lib/fairisle-renderer";
import { CONTRACT_ADDRESS, readOwnerOf } from "@/lib/chain";
import { CANONICAL_ORIGIN } from "@/lib/urls";
import { Snowfall } from "../../components/Snowfall";

// Owners change on transfer; re-read every five minutes.
export const revalidate = 300;

function parseId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const id = parseInt(raw, 10);
  return Number.isSafeInteger(id) ? id : null;
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const id = parseId(params.id);
  if (id === null) return { title: "Onchain Fair Isle" };
  const { palette } = renderFairIsle(id);
  const title = `Onchain Fair Isle #${id} — ${palette.name}`;
  return {
    title,
    description: `A generative fair isle knitting pattern in ${palette.name}, drawn deterministically from token ID ${id}.`,
    openGraph: {
      title,
      images: [`${CANONICAL_ORIGIN}/api/preview/png?seed=${id}`],
    },
  };
}

// Farcaster identity for the owner, when one exists. Best-effort — the page
// must not fail because Neynar is slow or the key is absent.
async function lookupFarcaster(address: string): Promise<{ username: string } | null> {
  const key = process.env.NEYNAR_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(
      `https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=${address}`,
      { headers: { "x-api-key": key }, next: { revalidate: 3600 }, signal: AbortSignal.timeout(3000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const users = data[address.toLowerCase()];
    return users?.[0]?.username ? { username: users[0].username } : null;
  } catch {
    return null;
  }
}

export default async function TokenPage({ params }: { params: { id: string } }) {
  const id = parseId(params.id);
  if (id === null) notFound();

  const owner = await readOwnerOf(id);
  if (!owner) notFound(); // not minted (ownerOf reverts)

  const { palette, isRare, hasGiantSnowflake } = renderFairIsle(id);
  const fc = await lookupFarcaster(owner);
  const shortOwner = `${owner.slice(0, 6)}…${owner.slice(-4)}`;

  const trait = (label: string, value: string) => (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "0.6rem 0.9rem",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "0.7rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </div>
      <div style={{ fontSize: "0.9rem", fontWeight: 600, marginTop: "0.15rem" }}>{value}</div>
    </div>
  );

  return (
    <main
      style={{
        maxWidth: 560,
        margin: "0 auto",
        padding: "2rem 1rem 4rem",
        position: "relative",
        zIndex: 1,
      }}
    >
      <Snowfall />
      {/* Positioned above the fixed zIndex:0 snow — without this, positioned-
          at-zero paints over non-positioned content and flakes cross the art. */}
      <div className="fade-in" style={{ position: "relative", zIndex: 1 }}>
        <p style={{ marginBottom: "1rem", fontSize: "0.85rem" }}>
          <Link href="/collection" style={{ color: "var(--muted)" }}>
            ← The Collection
          </Link>
        </p>

        <img
          src={`/fairisle/api/preview/png?seed=${id}`}
          alt={`Onchain Fair Isle #${id} — a fair isle knitting pattern in the ${palette.name} palette${hasGiantSnowflake ? " with a giant snowflake" : ""}.`}
          width={800}
          height={800}
          style={{
            width: "100%",
            height: "auto",
            display: "block",
            borderRadius: 12,
            border: "1px solid var(--border)",
          }}
        />

        <h1 style={{ fontSize: "1.4rem", fontWeight: 700, margin: "1.2rem 0 0.3rem" }}>
          Onchain Fair Isle #{id}
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginBottom: "1.2rem" }}>
          Knitted by{" "}
          {fc ? (
            <a href={`https://farcaster.xyz/${fc.username}`}>@{fc.username}</a>
          ) : (
            <a href={`https://basescan.org/address/${owner}`}>{shortOwner}</a>
          )}
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            gap: "0.6rem",
            marginBottom: "1.5rem",
          }}
        >
          {trait("Palette", `${isRare ? "🌈 " : ""}${palette.name}`)}
          {trait("Palette type", isRare ? "Rare" : "Standard")}
          {trait("Giant snowflake", hasGiantSnowflake ? "❄️ Yes" : "No")}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          <a
            href={`https://basescan.org/nft/${CONTRACT_ADDRESS}/${id}`}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "block",
              textAlign: "center",
              padding: "0.85rem",
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "var(--card)",
              color: "var(--foreground)",
              fontWeight: 600,
              fontSize: "0.9rem",
            }}
          >
            View on BaseScan
          </a>
          <a
            href={`https://opensea.io/assets/base/${CONTRACT_ADDRESS}/${id}`}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "block",
              textAlign: "center",
              padding: "0.85rem",
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "var(--card)",
              color: "var(--foreground)",
              fontWeight: 600,
              fontSize: "0.9rem",
            }}
          >
            View on OpenSea
          </a>
          <Link
            href="/"
            style={{
              display: "block",
              textAlign: "center",
              padding: "1rem",
              borderRadius: 12,
              border: "none",
              background: "linear-gradient(135deg, #5b9bd5, #2d5a8b)",
              color: "white",
              fontWeight: 600,
              fontSize: "1rem",
            }}
          >
            Knit your own →
          </Link>
        </div>
      </div>
    </main>
  );
}
