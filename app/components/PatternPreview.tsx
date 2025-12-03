"use client";

import { useEffect, useState, useMemo } from "react";
import { renderFairIsle, type RenderResult } from "@/lib/fairisle-renderer";

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

  const { svg, palette, isRare } = useMemo(() => {
    if (!mounted) return { svg: "", palette: { name: "", colors: [] }, isRare: false };
    return renderFairIsle(seed);
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
        dangerouslySetInnerHTML={{ __html: svg }}
      />
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
