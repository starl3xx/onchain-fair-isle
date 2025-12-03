import { NextRequest, NextResponse } from "next/server";
// @ts-ignore - JS module
import { renderFairIsle } from "@/lib/fairisle-renderer";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const seedParam = searchParams.get("seed");
    const isSuccess = searchParams.get("success") === "true";

    // Use provided seed or generate random
    const seed = seedParam
      ? parseInt(seedParam, 10)
      : Math.floor(Math.random() * 2147483647);

    const { svg, palette, isRare } = renderFairIsle(seed);

    // If success, add a success overlay
    let finalSvg = svg;
    if (isSuccess) {
      // Add a success badge overlay to the SVG
      finalSvg = svg.replace(
        "</svg>",
        `
        <rect x="250" y="350" width="300" height="100" rx="16" fill="#111" fill-opacity="0.95"/>
        <text x="400" y="395" font-family="sans-serif" font-size="24" font-weight="bold" fill="#4ade80" text-anchor="middle">Minted!</text>
        <text x="400" y="425" font-family="sans-serif" font-size="14" fill="#888" text-anchor="middle">${palette.name}${isRare ? " (Rare)" : ""}</text>
        </svg>`
      );
    }

    return new NextResponse(finalSvg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": isSuccess
          ? "no-cache"
          : "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error generating preview:", error);
    return NextResponse.json(
      { error: "Failed to generate preview" },
      { status: 500 }
    );
  }
}
