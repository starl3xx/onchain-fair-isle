import { NextRequest, NextResponse } from "next/server";
import { renderFairIsle } from "@/lib/fairisle-renderer";

export async function GET(
  request: NextRequest,
  { params }: { params: { tokenId: string } }
) {
  try {
    const tokenId = parseInt(params.tokenId, 10);

    if (isNaN(tokenId) || tokenId < 0) {
      return NextResponse.json(
        { error: "Invalid token ID" },
        { status: 400 }
      );
    }

    // Generate the pattern data from the tokenId
    const { palette, isRare } = renderFairIsle(tokenId);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://onchain-fair-isle.vercel.app";

    // Use URL for image instead of data URI (better OpenSea compatibility)
    const imageUrl = `${baseUrl}/api/preview?seed=${tokenId}`;

    // Build attributes
    const attributes = [
      {
        trait_type: "Palette",
        value: palette.name,
      },
      {
        trait_type: "Palette Type",
        value: isRare ? "Rare" : "Standard",
      },
    ];

    // Check for giant snowflake (20% chance based on seed)
    const hasGiantSnowflake = ((tokenId + 1000) * 16807) % 100 < 20;
    attributes.push({
      trait_type: "Has Giant Snowflake",
      value: hasGiantSnowflake ? "Yes" : "No",
    });

    const metadata = {
      name: `Onchain Fair Isle #${tokenId}`,
      description:
        "A generative fair isle knitting pattern, deterministically created on-chain.",
      image: imageUrl,
      external_url: `${baseUrl}?tokenId=${tokenId}`,
      attributes,
    };

    return NextResponse.json(metadata, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error generating metadata:", error);
    return NextResponse.json(
      { error: "Failed to generate metadata" },
      { status: 500 }
    );
  }
}
