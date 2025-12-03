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
  }

  export function renderFairIsle(seed: number | bigint | string): RenderResult;
  export function renderFairIsleDataURI(seed: number | bigint | string): string;
  export const PALETTES: Palette[];
}
