"use client";

import { useState, useCallback } from "react";
import { renderFairIsle } from "@/lib/fairisle-renderer";

export default function TestPage() {
  const [seed, setSeed] = useState<number>(() => Math.floor(Math.random() * 2147483647));
  const [inputValue, setInputValue] = useState<string>("");

  const { svg, palette, paletteIndex, isRare } = renderFairIsle(seed);

  // Scale SVG to fit container
  const scaledSvg = svg.replace(/width="800" height="800"/, 'width="100%" height="100%"');

  const handleGenerate = useCallback(() => {
    const newSeed = inputValue.trim()
      ? parseInt(inputValue) || Math.abs(hashString(inputValue))
      : Math.floor(Math.random() * 2147483647);
    setSeed(newSeed);
    setInputValue(String(newSeed));
  }, [inputValue]);

  const handleRandom = useCallback(() => {
    const newSeed = Math.floor(Math.random() * 2147483647);
    setSeed(newSeed);
    setInputValue(String(newSeed));
  }, []);

  const handleFindRare = useCallback(() => {
    let newSeed: number;
    let attempts = 0;
    do {
      newSeed = Math.floor(Math.random() * 2147483647);
      const rarityCheck = (Math.abs(newSeed) >> 8) % 100;
      if (rarityCheck < 5) break;
      attempts++;
    } while (attempts < 1000);
    setSeed(newSeed);
    setInputValue(String(newSeed));
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0a",
      color: "#fff",
      fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
      padding: "2rem",
    }}>
      <h1 style={{
        textAlign: "center",
        fontSize: "2rem",
        background: "linear-gradient(135deg, #5b9bd5, #c8e0d4)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        marginBottom: "2rem",
      }}>
        Fair Isle Renderer Test
      </h1>

      {/* Controls */}
      <div style={{
        maxWidth: 600,
        margin: "0 auto 2rem",
        display: "flex",
        gap: "1rem",
        flexWrap: "wrap",
        justifyContent: "center",
      }}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter seed (or leave blank for random)"
          style={{
            flex: 1,
            minWidth: 200,
            padding: "0.75rem 1rem",
            fontSize: "1rem",
            border: "1px solid #333",
            borderRadius: 8,
            background: "#111",
            color: "#fff",
          }}
          onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
        />
        <button
          onClick={handleGenerate}
          style={{
            padding: "0.75rem 1.5rem",
            fontSize: "1rem",
            border: "none",
            borderRadius: 8,
            background: "#5b9bd5",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Generate
        </button>
        <button
          onClick={handleRandom}
          style={{
            padding: "0.75rem 1.5rem",
            fontSize: "1rem",
            border: "none",
            borderRadius: 8,
            background: "#4a8b6f",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Random
        </button>
        <button
          onClick={handleFindRare}
          style={{
            padding: "0.75rem 1.5rem",
            fontSize: "1rem",
            border: "none",
            borderRadius: 8,
            background: "linear-gradient(135deg, #ffd700, #ff6b00)",
            color: "#000",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Find Rare ✨
        </button>
      </div>

      {/* Preview */}
      <div style={{
        maxWidth: 500,
        margin: "0 auto",
        textAlign: "center",
      }}>
        <div
          style={{
            width: "100%",
            aspectRatio: "1",
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
          dangerouslySetInnerHTML={{ __html: scaledSvg }}
        />

        {/* Info */}
        <div style={{
          marginTop: "1rem",
          padding: "1rem",
          background: "#111",
          borderRadius: 8,
        }}>
          <div style={{ marginBottom: "0.5rem" }}>
            <strong>{palette.name}</strong>
            <span style={{ color: "#888", marginLeft: "0.5rem" }}>
              (Palette {paletteIndex})
            </span>
            {isRare && (
              <span style={{
                background: "linear-gradient(135deg, #ffd700, #ff6b00)",
                color: "#000",
                padding: "2px 8px",
                borderRadius: 4,
                fontWeight: "bold",
                marginLeft: "0.5rem",
                fontSize: "0.75rem",
              }}>
                RARE
              </span>
            )}
          </div>
          <div style={{ color: "#888", fontSize: "0.875rem" }}>
            Seed: {seed}
          </div>
          <div style={{
            display: "flex",
            gap: 8,
            justifyContent: "center",
            marginTop: "0.75rem",
          }}>
            {palette.colors.map((color: string, i: number) => (
              <div
                key={i}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  background: color,
                }}
                title={color}
              />
            ))}
          </div>
        </div>

        {/* Links */}
        <div style={{
          marginTop: "1.5rem",
          display: "flex",
          gap: "1rem",
          justifyContent: "center",
        }}>
          <a
            href={`/api/metadata/${seed}`}
            target="_blank"
            style={{ color: "#5b9bd5" }}
          >
            View Metadata JSON
          </a>
          <a
            href={`/api/preview?seed=${seed}`}
            target="_blank"
            style={{ color: "#5b9bd5" }}
          >
            View Raw SVG
          </a>
        </div>
      </div>
    </div>
  );
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
