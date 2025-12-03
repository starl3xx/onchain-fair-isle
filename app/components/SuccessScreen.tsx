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

    // Embed both the NFT image and the mini app
    const nftImageUrl = `${baseUrl}/api/preview?seed=${tokenId}`;
    const miniAppUrl = baseUrl;

    const shareUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(castText)}&embeds[]=${encodeURIComponent(nftImageUrl)}&embeds[]=${encodeURIComponent(miniAppUrl)}`;

    try {
      // Try Farcaster SDK first
      await sdk.actions.openUrl(shareUrl);
    } catch {
      // Fallback to opening in new window
      window.open(shareUrl, "_blank");
    }
  }, [tokenId, palette.name]);

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
          <img src="/FC.png" alt="" width={18} height={18} style={{ objectFit: "contain" }} />
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
          <img src="/download.png" alt="" width={18} height={18} style={{ objectFit: "contain" }} />
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
          <img src="/sparkle.png" alt="" width={18} height={18} style={{ objectFit: "contain" }} />
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
