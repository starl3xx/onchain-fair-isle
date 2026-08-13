declare module "@/lib/fairisle-renderer" {
  export interface Palette {
    name: string;
    colors: string[];
    rare?: boolean;
  }

  export interface RenderResult {
    svg: string;
    palette: Palette;
    paletteIndex: number;
    isRare: boolean;
    /** Whether the band sequence actually landed the giant snowflake center. */
    hasGiantSnowflake: boolean;
  }

  export interface PatternResult {
    /** ROWS x COLS grid of palette colour indices. */
    grid: number[][];
    palette: Palette;
    paletteIndex: number;
    isRare: boolean;
    /** Whether the band sequence actually landed the giant snowflake center. */
    hasGiantSnowflake: boolean;
  }

  export function renderFairIsle(seed: number | bigint | string): RenderResult;
  /** The colour grid and traits without building the SVG — for rasterizers. */
  export function renderFairIslePattern(seed: number | bigint | string): PatternResult;
  /** One stitch as a standalone SVG document, scaled to `px` pixels square. */
  export function renderStitchTileSVG(color: string, px: number): string;
  export function renderFairIsleDataURI(seed: number | bigint | string): string;
  export const PALETTES: Palette[];
  export const GRID_COLS: number;
  export const GRID_ROWS: number;
}
