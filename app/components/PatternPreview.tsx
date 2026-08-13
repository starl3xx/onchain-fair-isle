"use client";

import { useEffect, useState, useMemo } from "react";
import { renderFairIslePattern } from "@/lib/fairisle-renderer";

interface PatternPreviewProps {
  seed: number;
  size?: number;
  showPalette?: boolean;
}

export function PatternPreview({
  seed,
  size = 300,
  showPalette = true,
}: PatternPreviewProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Only the traits are computed here. Building the SVG meant an 8 MB string
  // and 60,000 DOM nodes for a 300px box — on every shuffle, on a phone. The
  // picture now comes from the PNG route, which renders in milliseconds and is
  // cached at the edge; renderFairIslePattern skips the markup entirely.
  const { palette, isRare } = useMemo(() => {
    if (!mounted) return { palette: { name: "", colors: [] }, isRare: false };
    return renderFairIslePattern(seed);
  }, [seed, mounted]);

  if (!mounted) {
    return (
      <div
        style={{
          width: size,
          height: size,
          background: "#111",
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div className="pulse" style={{ color: "#666" }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div
        style={{
          width: size,
          height: size,
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        }}
      >
        <img
          src={`/fairisle/api/preview/png?seed=${seed}&size=${size * 2}`}
          alt={`Fair Isle pattern preview in the ${palette.name} palette`}
          width={size}
          height={size}
          fetchPriority="high"
          style={{ width: "100%", height: "100%", display: "block" }}
        />
      </div>
      {showPalette && (
        <div
          style={{
            marginTop: "0.75rem",
            padding: "0.75rem 1rem",
            background: "#111",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontSize: "0.875rem",
              color: "#888",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            {palette.name}
            {isRare && (
              <span
                style={{
                  background: "linear-gradient(135deg, #ffd700, #ff6b00)",
                  color: "#000",
                  padding: "2px 6px",
                  borderRadius: 4,
                  fontSize: "0.75rem",
                  fontWeight: "bold",
                }}
              >
                RARE
              </span>
            )}
          </span>
          <div style={{ display: "flex", gap: 4 }}>
            {palette.colors.map((color: string, i: number) => (
              <div
                key={i}
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  backgroundColor: color,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
