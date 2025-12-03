"use client";

import { useState, useCallback, useEffect } from "react";
import { PatternPreview } from "./components/PatternPreview";
import { MintButton } from "./components/MintButton";
import { SuccessScreen } from "./components/SuccessScreen";
import { Snowfall } from "./components/Snowfall";

type AppState = "preview" | "minting" | "success" | "error";

interface MintResult {
  tokenId: bigint;
  txHash: string;
}

export default function Home() {
  const [state, setState] = useState<AppState>("preview");
  const [previewSeed, setPreviewSeed] = useState<number>(0);
  const [mintResult, setMintResult] = useState<MintResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [totalSupply, setTotalSupply] = useState<number | null>(null);

  // Initialize with random seed on client
  useEffect(() => {
    setPreviewSeed(Math.floor(Math.random() * 2147483647));
  }, []);

  // Shuffle preview
  const handleShuffle = useCallback(() => {
    setPreviewSeed(Math.floor(Math.random() * 2147483647));
  }, []);

  // Mint callbacks
  const handleMintStart = useCallback(() => {
    setState("minting");
    setError(null);
  }, []);

  const handleMintSuccess = useCallback((tokenId: bigint, txHash: string) => {
    setMintResult({ tokenId, txHash });
    setState("success");
    // Update total supply
    setTotalSupply((prev) => (prev !== null ? prev + 1 : 1));
  }, []);

  const handleMintError = useCallback((err: Error) => {
    setError(err.message || "Knit failed. Please try again.");
    setState("error");
  }, []);

  // Reset to preview state
  const handleMintAnother = useCallback(() => {
    setPreviewSeed(Math.floor(Math.random() * 2147483647));
    setMintResult(null);
    setError(null);
    setState("preview");
  }, []);

  // Retry after error
  const handleRetry = useCallback(() => {
    setError(null);
    setState("preview");
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      {/* Snow Effect */}
      <Snowfall />

      {/* Header */}
      <header
        style={{
          textAlign: "center",
          padding: "2rem 1rem",
          borderBottom: "1px solid #222",
          position: "relative",
          zIndex: 1,
        }}
      >
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: 700,
            background: "linear-gradient(135deg, #5b9bd5, #c8e0d4)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            margin: 0,
          }}
        >
          Onchain Fair Isle
        </h1>
        <p
          style={{
            color: "#888",
            marginTop: "0.5rem",
            fontSize: "0.875rem",
          }}
        >
          Fair Isle-inspired generative NFT collection on Base
        </p>
      </header>

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          maxWidth: 400,
          margin: "0 auto",
          padding: "2rem 1rem",
          width: "100%",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Success State */}
        {state === "success" && mintResult && (
          <SuccessScreen
            tokenId={mintResult.tokenId}
            txHash={mintResult.txHash}
            onMintAnother={handleMintAnother}
          />
        )}

        {/* Error State */}
        {state === "error" && (
          <div className="fade-in" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>
              &#128533;
            </div>
            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: 600,
                marginBottom: "0.5rem",
              }}
            >
              Something went wrong
            </h2>
            <p
              style={{
                color: "#f87171",
                marginBottom: "1.5rem",
                fontSize: "0.875rem",
              }}
            >
              {error}
            </p>
            <button
              onClick={handleRetry}
              style={{
                width: "100%",
                padding: "1rem",
                fontSize: "1rem",
                fontWeight: 600,
                border: "none",
                borderRadius: 12,
                background: "linear-gradient(135deg, #5b9bd5, #2d5a8b)",
                color: "white",
                cursor: "pointer",
              }}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Preview / Minting State */}
        {(state === "preview" || state === "minting") && (
          <div className="fade-in">
            {/* Preview Section */}
            <section style={{ textAlign: "center", marginBottom: "2rem" }}>
              <p
                style={{
                  color: "#666",
                  fontSize: "0.875rem",
                  marginBottom: "1rem",
                }}
              >
                {state === "minting" ? (
                  "Your pattern is being knitted..."
                ) : (
                  <>
                    <strong style={{ color: "#888" }}>Preview only</strong>{" "}
                    <span style={{ color: "#5b9bd5" }}>✦</span> Each mint generates a unique pattern
                  </>
                )}
              </p>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  opacity: state === "minting" ? 0.7 : 1,
                  transition: "opacity 0.3s",
                }}
              >
                <PatternPreview seed={previewSeed} size={300} showPalette />
              </div>

              {state === "preview" && (
                <button
                  onClick={handleShuffle}
                  style={{
                    marginTop: "1rem",
                    padding: "0.5rem 1rem",
                    fontSize: "0.875rem",
                    border: "1px solid #333",
                    borderRadius: 8,
                    background: "transparent",
                    color: "#888",
                    cursor: "pointer",
                  }}
                >
                  Shuffle preview
                </button>
              )}
            </section>

            {/* Mint Section */}
            <section
              style={{
                background: "#111",
                borderRadius: 16,
                padding: "1.5rem",
              }}
            >
              {/* Stats */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-around",
                  marginBottom: "1.5rem",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <span
                    style={{
                      display: "block",
                      color: "#666",
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Knitted
                  </span>
                  <span
                    style={{
                      display: "block",
                      fontSize: "1.5rem",
                      fontWeight: 600,
                      marginTop: "0.25rem",
                    }}
                  >
                    {totalSupply !== null ? totalSupply : "..."}
                  </span>
                </div>
                <div style={{ textAlign: "center" }}>
                  <span
                    style={{
                      display: "block",
                      color: "#666",
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Price
                  </span>
                  <span
                    style={{
                      display: "block",
                      fontSize: "1.5rem",
                      fontWeight: 600,
                      marginTop: "0.25rem",
                    }}
                  >
                    0.002 ETH
                  </span>
                </div>
              </div>

              {/* Mint Button */}
              <MintButton
                onMintStart={handleMintStart}
                onMintSuccess={handleMintSuccess}
                onMintError={handleMintError}
              />

              {state === "minting" && (
                <p
                  style={{
                    textAlign: "center",
                    color: "#666",
                    fontSize: "0.875rem",
                    marginTop: "1rem",
                  }}
                  className="pulse"
                >
                  Waiting for confirmation...
                </p>
              )}
            </section>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer
        style={{
          textAlign: "center",
          padding: "1.5rem",
          borderTop: "1px solid #222",
          color: "#666",
          fontSize: "0.875rem",
          position: "relative",
          zIndex: 1,
        }}
      >
        <p>
          Made with 🌠 by{" "}
          <a
            href="https://warpcast.com/starl3xx"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#5b9bd5" }}
          >
            @starl3xx
          </a>
        </p>
      </footer>
    </main>
  );
}
