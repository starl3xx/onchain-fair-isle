"use client";

import { useCallback } from "react";
import sdk from "@farcaster/frame-sdk";
import { PatternPreview } from "./PatternPreview";
import { renderFairIsle } from "@/lib/fairisle-renderer";

interface SuccessScreenProps {
  tokenId: bigint;
  txHash: string;
  onMintAnother: () => void;
}

export function SuccessScreen({
  tokenId,
  txHash,
  onMintAnother,
}: SuccessScreenProps) {
  const seed = Number(tokenId);
  const { palette, isRare } = renderFairIsle(seed);

  const handleShare = useCallback(async () => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
    const castText = `Just m̶i̶n̶t̶e̶d̶ knitted Onchain Fair Isle #${tokenId} in ${palette.name} ❄️ Each one is unique and generated at mint... Knit yours now! 🧤`;

    try {
      // Try Farcaster SDK first
      await sdk.actions.openUrl(
        `https://warpcast.com/~/compose?text=${encodeURIComponent(castText)}&embeds[]=${encodeURIComponent(`${baseUrl}?tokenId=${tokenId}`)}`
      );
    } catch {
      // Fallback to opening in new window
      window.open(
        `https://warpcast.com/~/compose?text=${encodeURIComponent(castText)}&embeds[]=${encodeURIComponent(`${baseUrl}?tokenId=${tokenId}`)}`,
        "_blank"
      );
    }
  }, [tokenId, palette.name, isRare]);

  return (
    <div className="fade-in" style={{ textAlign: "center" }}>
      <div
        style={{
          fontSize: "3rem",
          marginBottom: "1rem",
        }}
      >
        &#10024;
      </div>

      <h2
        style={{
          fontSize: "1.5rem",
          fontWeight: 600,
          marginBottom: "0.5rem",
        }}
      >
        Knitted!
      </h2>

      <p
        style={{
          color: "#888",
          marginBottom: "1.5rem",
        }}
      >
        Fair Isle #{tokenId.toString()}
      </p>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "1.5rem",
        }}
      >
        <PatternPreview seed={seed} size={300} showPalette={true} />
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
        }}
      >
        <button
          onClick={handleShare}
          style={{
            width: "100%",
            padding: "0.875rem",
            fontSize: "1rem",
            fontWeight: 600,
            border: "none",
            borderRadius: 12,
            background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
            color: "white",
            cursor: "pointer",
          }}
        >
          Share on Warpcast
        </button>

        <button
          onClick={onMintAnother}
          style={{
            width: "100%",
            padding: "0.875rem",
            fontSize: "1rem",
            fontWeight: 600,
            border: "none",
            borderRadius: 12,
            background: "linear-gradient(135deg, #5b9bd5, #2d5a8b)",
            color: "white",
            cursor: "pointer",
          }}
        >
          Knit another
        </button>

        <a
          href={`https://opensea.io/assets/base/${process.env.NEXT_PUBLIC_CONTRACT_ADDRESS}/${tokenId}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "block",
            width: "100%",
            padding: "0.875rem",
            fontSize: "1rem",
            fontWeight: 600,
            border: "1px solid #333",
            borderRadius: 12,
            background: "transparent",
            color: "#888",
            textAlign: "center",
            textDecoration: "none",
          }}
        >
          View on OpenSea
        </a>

        <a
          href={`https://basescan.org/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: "0.875rem",
            color: "#666",
            marginTop: "0.5rem",
          }}
        >
          View transaction on BaseScan
        </a>
      </div>
    </div>
  );
}
