"use client";

import { useMemo, useState } from "react";
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

export function CollectionGrid({ tokens }: { tokens: TokenCard[] }) {
  const [filter, setFilter] = useState<Filter>("all");

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
        {visible.map((t) => (
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
            {/* Raw img on purpose: the PNG route is already sized + immutable-cached. */}
            <img
              src={`/fairisle/api/preview/png?seed=${t.id}&size=400`}
              alt={`Onchain Fair Isle #${t.id} — ${t.palette}${t.hasGiantSnowflake ? ", giant snowflake" : ""}`}
              width={400}
              height={400}
              loading="lazy"
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
            ? "None knitted yet — the giant snowflake lands on roughly one pattern in a hundred. Still out there."
            : "None knitted yet."}
        </p>
      )}
    </div>
  );
}
