"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

export interface TokenCard {
  id: number;
  palette: string;
  isRare: boolean;
  hasGiantSnowflake: boolean;
}

type Filter = "all" | "rainbow" | "snowflake";

const FILTERS: { key: Filter; label: (counts: Record<Filter, number>) => string }[] = [
  { key: "all", label: (c) => `All ${c.all}` },
  { key: "rainbow", label: (c) => `🌈 Nordic Rainbow ${c.rainbow}` },
  { key: "snowflake", label: (c) => `❄️ Giant snowflake ${c.snowflake}` },
];

export function CollectionGrid({ tokens: initialTokens }: { tokens: TokenCard[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [tokens, setTokens] = useState<TokenCard[]>(initialTokens);

  // The page's HTML is cached, so it can be a minute or two behind the chain.
  // Ask for anything minted since it was generated — on mount, and again when
  // the tab regains focus, which is exactly the moment someone comes back from
  // minting. Failures are silent: the cached grid is still correct, just older.
  const knownCount = useRef(initialTokens.length);

  const syncWithChain = useCallback(async () => {
    try {
      const res = await fetch(`/fairisle/api/collection?from=${knownCount.current}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data: { tokens: TokenCard[] } = await res.json();
      if (data.tokens?.length) {
        knownCount.current += data.tokens.length;
        setTokens((prev) => [...prev, ...data.tokens]);
      }
    } catch {
      // Offline or rate-limited — keep showing what we have.
    }
  }, []);

  useEffect(() => {
    syncWithChain();
    const onVisible = () => {
      if (document.visibilityState === "visible") syncWithChain();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [syncWithChain]);

  const counts = useMemo<Record<Filter, number>>(
    () => ({
      all: tokens.length,
      rainbow: tokens.filter((t) => t.isRare).length,
      snowflake: tokens.filter((t) => t.hasGiantSnowflake).length,
    }),
    [tokens]
  );

  const visible = useMemo(() => {
    if (filter === "rainbow") return tokens.filter((t) => t.isRare);
    if (filter === "snowflake") return tokens.filter((t) => t.hasGiantSnowflake);
    return tokens;
  }, [tokens, filter]);

  return (
    <div className="fade-in">
      <p style={{ color: "var(--muted)", fontSize: "0.95rem", textAlign: "center", marginBottom: "2rem" }}>
        {tokens.length} sweaters knitted so far, each one a pure function of its token ID.
      </p>
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          justifyContent: "center",
          flexWrap: "wrap",
          marginBottom: "1.5rem",
        }}
      >
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            style={{
              padding: "0.5rem 0.9rem",
              fontSize: "0.85rem",
              fontWeight: 600,
              borderRadius: 999,
              cursor: "pointer",
              border: `1px solid ${filter === key ? "var(--accent)" : "var(--border)"}`,
              background: filter === key ? "rgba(91,155,213,.15)" : "var(--card)",
              color: filter === key ? "var(--accent)" : "var(--foreground)",
            }}
          >
            {label(counts)}
          </button>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
          gap: "0.9rem",
        }}
      >
        {visible.map((t, i) => (
          <Link
            key={t.id}
            href={`/token/${t.id}`}
            style={{
              display: "block",
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              overflow: "hidden",
              color: "var(--foreground)",
            }}
          >
            {/* Raw img on purpose: the PNG route is already sized + immutable-cached.
                The first row is above the fold and holds the LCP element, so it
                loads eagerly — lazy-loading your own LCP image just delays it. */}
            <img
              src={`/fairisle/api/preview/png?seed=${t.id}&size=400`}
              alt={`Onchain Fair Isle #${t.id}: ${t.palette}${t.hasGiantSnowflake ? ", giant snowflake" : ""}`}
              width={400}
              height={400}
              loading={i < 6 ? undefined : "lazy"}
              fetchPriority={i < 3 ? "high" : undefined}
              decoding="async"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
            <div style={{ padding: "0.55rem 0.7rem" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                #{t.id}
                <span style={{ float: "right", fontSize: "0.8rem" }}>
                  {t.isRare ? "🌈" : ""}
                  {t.hasGiantSnowflake ? "❄️" : ""}
                </span>
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{t.palette}</div>
            </div>
          </Link>
        ))}
      </div>

      {visible.length === 0 && (
        <p style={{ textAlign: "center", color: "var(--muted)", marginTop: "2rem" }}>
          {filter === "snowflake"
            ? "None knitted yet; the giant snowflake lands on roughly one pattern in a hundred. Still out there."
            : "None knitted yet."}
        </p>
      )}
    </div>
  );
}
