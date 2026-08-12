import { NextRequest, NextResponse } from "next/server";
import { renderFairIsle } from "@/lib/fairisle-renderer";
import { CANONICAL_ORIGIN } from "@/lib/urls";

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
    const { palette, isRare, hasGiantSnowflake } = renderFairIsle(tokenId);

    // All URLs are canonical (starl3xx.fun/fairisle), never the vercel.app
    // host — vercel.app links in this JSON are what got the collection
    // delisted from OpenSea.
    //
    // Point at the rasterized PNG, not the raw SVG. The SVG is ~8.3 MB of
    // 50k elements (one per stitch), which marketplace image pipelines choke
    // on — the same art as a PNG is ~35 KB. Cached immutably at the edge, so
    // only the first request per token pays the rasterize cost.
    const imageUrl = `${CANONICAL_ORIGIN}/api/preview/png?seed=${tokenId}`;

    // Build attributes. Has Giant Snowflake comes from the renderer itself —
    // the old closed-form check here disagreed with the actual art, because
    // the real draw happens mid-sequence after many RNG advances.
    const attributes = [
      {
        trait_type: "Palette",
        value: palette.name,
      },
      {
        trait_type: "Palette Type",
        value: isRare ? "Rare" : "Standard",
      },
      {
        trait_type: "Has Giant Snowflake",
        value: hasGiantSnowflake ? "Yes" : "No",
      },
    ];

    const metadata = {
      name: `Onchain Fair Isle #${tokenId}`,
      description:
        "A generative fair isle knitting pattern, deterministically created on-chain.",
      image: imageUrl,
      external_url: `${CANONICAL_ORIGIN}/token/${tokenId}`,
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
