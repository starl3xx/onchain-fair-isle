"use client";

import { useState, useCallback } from "react";
import { SuccessScreen } from "../components/SuccessScreen";

export default function SuccessPreviewPage() {
  const [seed, setSeed] = useState<number>(() => Math.floor(Math.random() * 2147483647));
  const [inputValue, setInputValue] = useState<string>("");

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

  const handleMintAnother = useCallback(() => {
    const newSeed = Math.floor(Math.random() * 2147483647);
    setSeed(newSeed);
    setInputValue(String(newSeed));
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0a",
      color: "#fff",
      fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      {/* Controls bar */}
      <div style={{
        position: "sticky",
        top: 0,
        background: "#111",
        borderBottom: "1px solid #333",
        padding: "1rem",
        zIndex: 100,
      }}>
        <div style={{
          maxWidth: 600,
          margin: "0 auto",
          display: "flex",
          gap: "0.75rem",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
        }}>
          <span style={{ color: "#888", fontSize: "0.875rem" }}>
            Token ID / Seed:
          </span>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={String(seed)}
            style={{
              width: 140,
              padding: "0.5rem 0.75rem",
              fontSize: "0.875rem",
              border: "1px solid #333",
              borderRadius: 6,
              background: "#0a0a0a",
              color: "#fff",
            }}
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
          />
          <button
            onClick={handleGenerate}
            style={{
              padding: "0.5rem 1rem",
              fontSize: "0.875rem",
              border: "none",
              borderRadius: 6,
              background: "#5b9bd5",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Set
          </button>
          <button
            onClick={handleRandom}
            style={{
              padding: "0.5rem 1rem",
              fontSize: "0.875rem",
              border: "none",
              borderRadius: 6,
              background: "#4a8b6f",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Random
          </button>
        </div>
      </div>

      {/* Success Screen Preview */}
      <div style={{
        maxWidth: 420,
        margin: "0 auto",
        padding: "2rem 1rem",
      }}>
        <SuccessScreen
          tokenId={BigInt(seed)}
          txHash="0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
          onMintAnother={handleMintAnother}
        />
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
