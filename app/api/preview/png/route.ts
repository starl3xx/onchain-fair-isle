import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import {
  renderFairIslePattern,
  renderStitchTileSVG,
  GRID_COLS,
  GRID_ROWS,
} from "@/lib/fairisle-renderer";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DEFAULT_SIZE = 800;
const MAX_SIZE = 2000;
const CHANNELS = 4;

// A stitch tile is a pure function of (colour, pixel size), and a pattern uses
// at most five colours. Instances stay warm between requests, so this turns
// most renders into pure memory work.
const tileCache = new Map<string, Buffer>();
const TILE_CACHE_MAX = 256;

async function stitchTile(color: string, px: number): Promise<Buffer> {
  const key = `${color}@${px}`;
  const hit = tileCache.get(key);
  if (hit) return hit;

  const { data } = await sharp(Buffer.from(renderStitchTileSVG(color, px)))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  if (tileCache.size >= TILE_CACHE_MAX) {
    tileCache.clear(); // colours are few; a plain reset beats LRU bookkeeping
  }
  tileCache.set(key, data);
  return data;
}

/**
 * Rasterize by blitting one tile per colour instead of handing librsvg the
 * full 60,000-element SVG. Every stitch is an opaque cell whose ink stays
 * inside its own bounds, so tiling is pixel-identical to rendering the whole
 * document — but costs milliseconds rather than seconds.
 */
async function renderPng(seed: number, size: number): Promise<Buffer> {
  const { grid, palette } = renderFairIslePattern(seed);

  // Cells must land on whole pixels, so render at the nearest exact multiple
  // and resize only when the caller asked for something else.
  const tilePx = Math.max(1, Math.round(size / GRID_COLS));
  const exact = tilePx * GRID_COLS;

  const used = new Set<number>();
  for (const row of grid) for (const idx of row) used.add(idx);
  const tiles = new Map<number, Buffer>();
  await Promise.all(
    Array.from(used).map(async (idx) => {
      tiles.set(idx, await stitchTile(palette.colors[idx], tilePx));
    })
  );

  const stride = exact * CHANNELS;
  const tileStride = tilePx * CHANNELS;
  const canvas = Buffer.allocUnsafe(stride * exact);

  for (let row = 0; row < GRID_ROWS; row++) {
    const top = row * tilePx;
    for (let col = 0; col < GRID_COLS; col++) {
      const tile = tiles.get(grid[row][col])!;
      const left = col * tileStride;
      for (let y = 0; y < tilePx; y++) {
        tile.copy(canvas, (top + y) * stride + left, y * tileStride, (y + 1) * tileStride);
      }
    }
  }

  const image = sharp(canvas, {
    raw: { width: exact, height: exact, channels: CHANNELS },
  });
  // No withMetadata(): it would attach an ICC profile and grow every file by
  // ~523 bytes. Output is pixel-identical to the old librsvg path; the only
  // difference is the pHYs DPI stamp, which no web client reads.
  return (exact === size ? image : image.resize(size, size)).png().toBuffer();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const seedParam = searchParams.get("seed");
    const sizeParam = searchParams.get("size");

    // Use provided seed or generate random. A non-numeric seed would render as
    // NaN and throw deep inside the renderer, so treat it as absent.
    const parsedSeed = seedParam !== null ? parseInt(seedParam, 10) : NaN;
    const seed = Number.isFinite(parsedSeed)
      ? parsedSeed
      : Math.floor(Math.random() * 2147483647);

    const parsedSize = sizeParam !== null ? parseInt(sizeParam, 10) : NaN;
    const size = Number.isFinite(parsedSize)
      ? Math.min(Math.max(parsedSize, GRID_COLS), MAX_SIZE)
      : DEFAULT_SIZE;

    const pngBuffer = await renderPng(seed, size);

    return new NextResponse(new Uint8Array(pngBuffer), {
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
