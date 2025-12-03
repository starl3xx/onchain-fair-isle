import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { renderFairIsle } from "@/lib/fairisle-renderer";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const seedParam = searchParams.get("seed");
    const sizeParam = searchParams.get("size");

    // Use provided seed or generate random
    const seed = seedParam
      ? parseInt(seedParam, 10)
      : Math.floor(Math.random() * 2147483647);

    // Default size 800, max 2000
    const size = Math.min(parseInt(sizeParam || "800", 10), 2000);

    const { svg } = renderFairIsle(seed);

    // Convert SVG to PNG using sharp
    const pngBuffer = await sharp(Buffer.from(svg))
      .resize(size, size)
      .png()
      .toBuffer();

    return new NextResponse(pngBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error generating PNG preview:", error);
    return NextResponse.json(
      { error: "Failed to generate PNG preview" },
      { status: 500 }
    );
  }
}
