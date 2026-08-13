import { NextRequest, NextResponse } from "next/server";
import { renderFairIslePattern } from "@/lib/fairisle-renderer";
import { readTotalSupplyLive } from "@/lib/chain";

// Read the chain on request, so the collection page can reconcile itself
// against reality without the page having to be dynamic.
export const dynamic = "force-dynamic";

/**
 * Tokens minted since `from`. The page ships a cached grid for instant paint
 * and then asks this for whatever appeared afterwards, so a fresh mint shows
 * up in seconds rather than waiting out the page's revalidate window.
 *
 * Only the delta is computed: traits are a pure function of the token ID, but
 * deriving them means generating the pattern, and there is no reason to redo
 * that for tokens the page already rendered.
 */
export async function GET(request: NextRequest) {
  try {
    const fromParam = request.nextUrl.searchParams.get("from");
    const parsed = fromParam !== null ? parseInt(fromParam, 10) : 0;
    const from = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;

    const totalSupply = await readTotalSupplyLive();

    const tokens = [];
    for (let id = from; id < totalSupply; id++) {
      const { palette, isRare, hasGiantSnowflake } = renderFairIslePattern(id);
      tokens.push({ id, palette: palette.name, isRare, hasGiantSnowflake });
    }

    return NextResponse.json(
      { totalSupply, tokens },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Error reading collection supply:", error);
    return NextResponse.json({ error: "Failed to read supply" }, { status: 500 });
  }
}
