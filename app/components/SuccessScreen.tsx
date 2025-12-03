"use client";

import { useCallback, useState } from "react";
import sdk from "@farcaster/frame-sdk";
import { PatternPreview } from "./PatternPreview";
import { renderFairIsle } from "@/lib/fairisle-renderer";

async function svgToPngBlob(svgString: string, width = 2000, height = 2000): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error("Could not get canvas context"));
      return;
    }

    const img = new Image();
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to create blob"));
        }
      }, "image/png");
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load SVG"));
    };

    img.src = url;
  });
}

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
  const { svg, palette, isRare } = renderFairIsle(seed);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const pngBlob = await svgToPngBlob(svg);
      const file = new File([pngBlob], `fair-isle-${tokenId}.png`, { type: "image/png" });

      // Try native share (works on mobile)
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Fair Isle #${tokenId}`,
        });
      } else {
        // Fallback: trigger download
        const url = URL.createObjectURL(pngBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `fair-isle-${tokenId}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Failed to save image:", error);
    } finally {
      setIsSaving(false);
    }
  }, [svg, tokenId]);

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
        ❄️
      </div>

      <h2
        style={{
          fontSize: "1.5rem",
          fontWeight: 600,
          marginBottom: "0.5rem",
        }}
      >
        Unique NFT knitted!
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
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 1000 1000" fill="currentColor">
            <path d="M257.778 155.556h484.444v688.889h-71.111V528.889c0-39.111-31.667-70.778-70.778-70.778h-200c-39.111 0-70.778 31.667-70.778 70.778v315.556h-71.778V155.556z" />
            <path d="M128.889 253.333l84.444-97.778h573.334l84.444 97.778h-742.222z" />
            <path d="M244.444 844.444h71.111v71.111h-71.111v-71.111zM684.444 844.444h71.111v71.111h-71.111v-71.111z" />
          </svg>
          Share on Farcaster
        </button>

        <button
          onClick={handleSave}
          disabled={isSaving}
          style={{
            width: "100%",
            padding: "0.875rem",
            fontSize: "1rem",
            fontWeight: 600,
            border: "none",
            borderRadius: 12,
            background: "linear-gradient(135deg, #10b981, #059669)",
            color: "white",
            cursor: isSaving ? "wait" : "pointer",
            opacity: isSaving ? 0.7 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
          {isSaving ? "Saving sweater..." : "Save sweater"}
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
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
          }}
        >
          <span>✨</span>
          Knit another NFT
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
