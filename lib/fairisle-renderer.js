/**
 * Fair Isle Pattern Renderer
 * Generates deterministic fair isle SVG patterns from a seed
 *
 * This is the core renderer - can be used in:
 * - React/Next.js app
 * - Farcaster Frame
 * - Node.js API endpoint
 */

// ============ CONFIGURATION ============

const SIZE = 800;
const STITCH_W = 8;
const STITCH_H = 8;
const COLS = SIZE / STITCH_W;  // 100
const ROWS = SIZE / STITCH_H;  // 100

// ============ SEEDED RANDOM ============

class SeededRandom {
  constructor(seed) {
    this.seed = seed % 2147483647;
    if (this.seed <= 0) this.seed += 2147483646;
  }

  next() {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }

  nextInt(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  choice(array) {
    return array[Math.floor(this.next() * array.length)];
  }
}

// ============ COLOR PALETTES ============

// Standard palettes (0-10)
const STANDARD_PALETTES = [
  { name: "North Sea", colors: ["#1a2a3a", "#2d4a5e", "#4a7c9b", "#89b4c8", "#d4e5ed"] },
  { name: "Highland", colors: ["#1e3a2f", "#2d5a4a", "#4a8b6f", "#7eb89d", "#c8e0d4"] },
  { name: "Heather", colors: ["#3d2a4a", "#5c4a6e", "#8b6f9b", "#b89dbd", "#e0d4e5"] },
  { name: "Peat", colors: ["#2a1f1a", "#4a3d2d", "#7b6b4a", "#a89d7b", "#d4ccb8"] },
  { name: "Berry", colors: ["#3a1a2a", "#6b2d4a", "#9b4a6f", "#c87b9d", "#edd4e0"] },
  { name: "Slate", colors: ["#1a1f2a", "#3d4a5c", "#6b7b8b", "#9dadb8", "#d4dce0"] },
  { name: "Reserve Blue", colors: ["#1a3a5a", "#2d5a8b", "#5b9bd5", "#9dc5e8", "#d4e8f5"] },
  { name: "Rust", colors: ["#3a1f1a", "#6b3d2d", "#9b634a", "#c8947b", "#edd4c8"] },
  { name: "Nordic Night", colors: ["#0f1419", "#1e2832", "#3d5a6b", "#7b9bab", "#c8dce5"] },
  { name: "Moss", colors: ["#1a2a1a", "#3d5a2d", "#6b8b4a", "#9db87b", "#d4e5c8"] },
  { name: "Crimson", colors: ["#2a0a0a", "#5c1a1a", "#9b2d2d", "#c85a5a", "#edc8c8"] },
];

// Rare multicolor palette (~2.5% chance)
const MULTICOLOR_PALETTE = {
  name: "Nordic Rainbow",
  colors: ["#1e3a5c", "#2d6b4a", "#c8a02d", "#b84a2d", "#e8d4c8"],
  rare: true
};

// Combined for export
const PALETTES = [...STANDARD_PALETTES, MULTICOLOR_PALETTE];

// ============ COLOR UTILITIES ============

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => {
    const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

function adjustBrightness(hex, factor) {
  const rgb = hexToRgb(hex);
  return rgbToHex(rgb.r * factor, rgb.g * factor, rgb.b * factor);
}

// ============ PATTERN FUNCTIONS ============

const patterns = {
  solid: (x, y, w, h, params) => params.color ?? 2,

  thinLine: (x, y, w, h, params) => {
    if (y === Math.floor(h / 2)) return 4;
    return params.bg ?? 0;
  },

  doubleLine: (x, y, w, h, params) => {
    if (h >= 3 && (y === 0 || y === h - 1)) return 4;
    return params.bg ?? 0;
  },

  zigzagLarge: (x, y, w, h, params) => {
    const period = params.period ?? 24;
    const phase = (x % period) / period;
    const amplitude = Math.floor(h / 4);  // Half the oscillation range
    const centerY = Math.floor(h / 2);

    let targetY;
    if (phase < 0.5) {
      // Going up from center to top
      targetY = centerY - Math.floor(amplitude * (phase * 2));
    } else {
      // Going down from top back to center, then to bottom, then back
      targetY = centerY - Math.floor(amplitude * (2 - phase * 2));
    }

    const diff = Math.abs(y - targetY);
    if (diff <= 1) return 4;
    if (diff <= 2) return 3;
    return params.bg ?? 0;
  },

  chevron: (x, y, w, h, params) => {
    const period = params.period ?? 18;
    const cx = x % period;
    const center = Math.floor(period / 2);

    const dist = Math.abs(cx - center);
    const targetY = Math.floor((dist * (h - 2)) / Math.max(1, center)) + 1;

    if (Math.abs(y - targetY) <= 1) return 4;
    return params.bg ?? 0;
  },

  diamondsSmall: (x, y, w, h, params) => {
    const size = params.size ?? 10;
    const cx = x % size;
    const cy = y % h;

    const dist = Math.abs(cx - Math.floor(size / 2)) + Math.abs(cy - Math.floor(h / 2));

    if (dist <= Math.min(Math.floor(size / 3), Math.floor(h / 3))) return 4;
    return params.bg ?? 0;
  },

  diamondsOutline: (x, y, w, h, params) => {
    const size = params.size ?? 12;
    const cx = x % size;
    const cy = y % h;

    const dist = Math.abs(cx - Math.floor(size / 2)) + Math.abs(cy - Math.floor(h / 2));
    const outer = Math.min(Math.floor(size / 2) - 1, Math.floor(h / 2) - 1);
    const inner = outer - 2;

    if (dist >= inner && dist <= outer) return 4;
    return params.bg ?? 0;
  },

  diamondsNested: (x, y, w, h, params) => {
    const size = params.size ?? 16;
    const cx = x % size;
    const cy = y % h;

    const dist = Math.abs(cx - Math.floor(size / 2)) + Math.abs(cy - Math.floor(h / 2));
    const outer = Math.min(Math.floor(size / 2) - 1, Math.floor(h / 2) - 1);
    const mid = outer - 2;
    const inner = mid - 2;

    if (Math.abs(dist - outer) <= 1) return 4;
    if (Math.abs(dist - mid) <= 1) return 3;
    if (dist <= Math.max(0, inner)) return 4;
    return params.bg ?? 0;
  },

  xLarge: (x, y, w, h, params) => {
    const size = params.size ?? 14;
    const cx = x % size;
    const cy = y % h;

    const dx = cx - Math.floor(size / 2);
    const dy = cy - Math.floor(h / 2);
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);

    const maxDist = Math.min(Math.floor(size / 2) - 1, Math.floor(h / 2) - 1);

    // Main X diagonals
    if (Math.abs(adx - ady) <= 1 && adx <= maxDist) {
      return 4;
    }

    // Small perpendicular branches on the diagonals
    const branchPos = Math.floor(maxDist * 0.6);
    // Branches pointing outward from the X arms
    if (adx === branchPos && ady >= branchPos - 1 && ady <= branchPos + 1) return 3;
    if (ady === branchPos && adx >= branchPos - 1 && adx <= branchPos + 1) return 3;

    return params.bg ?? 0;
  },

  snowflake6pt: (x, y, w, h, params) => {
    const size = params.size ?? 16;
    const cx = x % size;
    const cy = y % h;

    const dx = cx - Math.floor(size / 2);
    const dy = cy - Math.floor(h / 2);
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);

    const armLen = Math.min(Math.floor(size / 2) - 1, Math.floor(h / 2) - 1);

    // Center
    if (adx <= 1 && ady <= 1) return 4;
    // Cross
    if ((adx <= 1 && ady <= armLen) || (ady <= 1 && adx <= armLen)) return 4;
    // Diagonals
    if (Math.abs(adx - ady) <= 1 && adx <= armLen - 1 && adx >= 2) return 4;
    // Branches
    const branchPos = Math.floor(armLen * 2 / 3);
    if (Math.abs(ady - branchPos) <= 1 && adx > 1 && adx <= 3) return 3;
    if (Math.abs(adx - branchPos) <= 1 && ady > 1 && ady <= 3) return 3;

    return params.bg ?? 0;
  },

  snowflake8pt: (x, y, w, h, params) => {
    const size = params.size ?? 18;
    const cx = x % size;
    const cy = y % h;

    const dx = cx - Math.floor(size / 2);
    const dy = cy - Math.floor(h / 2);
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);

    const armLen = Math.min(Math.floor(size / 2) - 1, Math.floor(h / 2) - 1);

    if (adx <= 1 && ady <= 1) return 4;
    if ((adx <= 1 && ady <= armLen) || (ady <= 1 && adx <= armLen)) return 4;
    if (Math.abs(adx - ady) <= 1 && adx <= armLen - 1 && adx >= 2) return 4;

    for (const pos of [Math.floor(armLen / 2), armLen - 1]) {
      if (Math.abs(ady - pos) <= 1 && adx > 1 && adx <= 2) return 3;
      if (Math.abs(adx - pos) <= 1 && ady > 1 && ady <= 2) return 3;
    }

    return params.bg ?? 0;
  },

  pineTree: (x, y, w, h, params) => {
    const size = params.size ?? 14;
    const cx = x % size;
    const center = Math.floor(size / 2);

    const trunkH = 2;
    const treeTop = 0;
    const treeBot = h - trunkH - 1;

    // Trunk
    if (y > treeBot && y < h && Math.abs(cx - center) <= 1) return 3;

    // Triangle body
    if (y >= treeTop && y <= treeBot) {
      const progress = (y - treeTop) / Math.max(1, treeBot - treeTop);
      const halfW = Math.floor(progress * (Math.floor(size / 2) - 1)) + 1;

      if (Math.abs(cx - center) <= halfW) return 4;
    }

    return params.bg ?? 0;
  },

  pineLayered: (x, y, w, h, params) => {
    const size = params.size ?? 16;
    const cx = x % size;
    const center = Math.floor(size / 2);

    const trunkH = 2;
    const treeH = h - trunkH;
    const tierH = Math.floor(treeH / 3);

    // Three tiers
    for (let tier = 0; tier < 3; tier++) {
      const tTop = tier * tierH;
      const tBot = tTop + tierH - 1;

      if (y >= tTop && y <= tBot) {
        const progress = (y - tTop) / Math.max(1, tierH - 1);
        const baseWidth = 1 + tier;
        const maxWidth = Math.floor((Math.floor(size / 2) - 1) * (tier + 1) / 3) + baseWidth;
        const halfW = Math.floor(progress * maxWidth) + 1;

        if (Math.abs(cx - center) <= halfW) return 4;
      }
    }

    // Trunk
    if (y >= treeH && y < h && Math.abs(cx - center) <= 1) return 3;

    return params.bg ?? 0;
  },

  dots: (x, y, w, h, params) => {
    const spacing = params.spacing ?? 8;
    const cx = x % spacing;
    const cy = y % h;

    const distSq = Math.pow(cx - Math.floor(spacing / 2), 2) + Math.pow(cy - Math.floor(h / 2), 2);
    if (distSq <= 3) return 4;
    return params.bg ?? 0;
  },

  stars: (x, y, w, h, params) => {
    const spacing = params.spacing ?? 10;
    const cx = x % spacing;
    const cy = y % h;

    const dx = Math.abs(cx - Math.floor(spacing / 2));
    const dy = Math.abs(cy - Math.floor(h / 2));

    if (dx <= 1 && dy <= 1) return 4;
    if ((dx <= 1 && dy <= 3) || (dy <= 1 && dx <= 3)) return 4;
    return params.bg ?? 0;
  },

  peerie: (x, y, w, h, params) => {
    if ((x + y) % 4 < 2) return 4;
    return params.bg ?? 1;
  },

  // NEW: More peerie-style patterns (low height, close repeating)
  checkerboard: (x, y, w, h, params) => {
    // Single pixel alternating
    if ((x + y) % 2 === 0) return 4;
    return params.bg ?? 0;
  },

  seedStitch: (x, y, w, h, params) => {
    // Offset dots pattern - like scattered seeds
    const offsetX = (y % 2) * 2;
    if ((x + offsetX) % 4 === 0) return 4;
    return params.bg ?? 0;
  },

  dashLine: (x, y, w, h, params) => {
    // Horizontal dashes
    const midY = Math.floor(h / 2);
    if (y === midY && (x % 4) < 2) return 4;
    return params.bg ?? 0;
  },

  zigzagTiny: (x, y, w, h, params) => {
    // Small tight zigzag
    const period = 4;
    const phase = x % period;
    const targetY = phase < 2 ? 0 : h - 1;
    if (y === targetY) return 4;
    return params.bg ?? 0;
  },

  houndstooth: (x, y, w, h, params) => {
    // Classic houndstooth check pattern
    const size = 4;
    const cx = x % size;
    const cy = y % size;
    // Create the distinctive houndstooth shape
    if ((cx < 2 && cy < 2) || (cx >= 2 && cy >= 2)) return 4;
    if (cx === 2 && cy === 1) return 4;
    if (cx === 1 && cy === 2) return 4;
    return params.bg ?? 0;
  },

  // NEW: More snowflake variations
  snowflakeCrystal: (x, y, w, h, params) => {
    // Classic snowflake with small branch details
    const size = params.size ?? 18;
    const cx = x % size;
    const cy = y % h;

    const dx = cx - Math.floor(size / 2);
    const dy = cy - Math.floor(h / 2);
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);

    const armLen = Math.min(Math.floor(size / 2) - 1, Math.floor(h / 2) - 1);

    // Center
    if (adx <= 1 && ady <= 1) return 4;
    // Main cross arms
    if (adx === 0 && ady <= armLen) return 4;
    if (ady === 0 && adx <= armLen) return 4;
    // Small V branches near tips of vertical arms
    const branchPos = armLen - 2;
    if (ady >= branchPos && ady <= armLen && adx === ady - branchPos + 1) return 3;
    // Small V branches near tips of horizontal arms
    if (adx >= branchPos && adx <= armLen && ady === adx - branchPos + 1) return 3;

    return params.bg ?? 0;
  },

  snowflakeDouble: (x, y, w, h, params) => {
    // Snowflake with doubled/thicker arms
    const size = params.size ?? 18;
    const cx = x % size;
    const cy = y % h;

    const dx = cx - Math.floor(size / 2);
    const dy = cy - Math.floor(h / 2);
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);

    const armLen = Math.min(Math.floor(size / 2) - 1, Math.floor(h / 2) - 1);

    // Thick center
    if (adx <= 1 && ady <= 1) return 4;
    // Double-wide vertical arm
    if (adx <= 1 && ady <= armLen) return 4;
    // Double-wide horizontal arm
    if (ady <= 1 && adx <= armLen) return 4;
    // Small dots at arm ends
    if ((adx === 0 && ady === armLen) || (ady === 0 && adx === armLen)) return 3;

    return params.bg ?? 0;
  },

  snowflakeStar: (x, y, w, h, params) => {
    // Six-pointed star snowflake (cross + diagonals)
    const size = params.size ?? 16;
    const cx = x % size;
    const cy = y % h;

    const dx = cx - Math.floor(size / 2);
    const dy = cy - Math.floor(h / 2);
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);

    const armLen = Math.min(Math.floor(size / 2) - 1, Math.floor(h / 2) - 1);

    // Center
    if (adx <= 1 && ady <= 1) return 4;
    // Vertical/horizontal arms
    if (adx === 0 && ady <= armLen) return 4;
    if (ady === 0 && adx <= armLen) return 4;
    // Diagonal arms (shorter)
    if (adx === ady && adx <= armLen - 2 && adx >= 2) return 4;

    return params.bg ?? 0;
  },

  snowflakeTiny: (x, y, w, h, params) => {
    // Small simple snowflake - just cross with center dot
    const size = params.size ?? 12;
    const cx = x % size;
    const cy = y % h;

    const dx = cx - Math.floor(size / 2);
    const dy = cy - Math.floor(h / 2);
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);

    const armLen = Math.min(Math.floor(size / 2) - 1, Math.floor(h / 2) - 1);

    // Center dot
    if (adx === 0 && ady === 0) return 4;
    // Thin cross arms
    if (adx === 0 && ady <= armLen) return 4;
    if (ady === 0 && adx <= armLen) return 4;

    return params.bg ?? 0;
  },

  // Circle with hash/pound sign negative space (Reserve style)
  circleHash: (x, y, w, h, params) => {
    const size = params.size ?? 10;
    const cx = x % size;
    const cy = y % h;

    const centerX = Math.floor(size / 2);
    const centerY = Math.floor(h / 2);
    const dx = cx - centerX;
    const dy = cy - centerY;

    const radius = Math.min(Math.floor(size / 2) - 1, Math.floor(h / 2) - 1);
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Check if inside circle
    if (dist <= radius) {
      // # shape: two vertical bars and two horizontal bars (1px thick each)
      const isLeftVertBar = (dx === -1);
      const isRightVertBar = (dx === 1);
      const isTopHorizBar = (dy === -1);
      const isBottomHorizBar = (dy === 1);

      // Both bars extend ±2 from center
      const barExtent = 2;

      // Draw vertical bars
      if ((isLeftVertBar || isRightVertBar) && Math.abs(dy) <= barExtent) {
        return params.bg ?? 0;
      }

      // Draw horizontal bars
      if ((isTopHorizBar || isBottomHorizBar) && Math.abs(dx) <= barExtent) {
        return params.bg ?? 0;
      }

      // Inside circle but not hash = circle color
      return 4;
    }

    return params.bg ?? 0;
  },

  // NEW: Snowfall pattern
  snowfall: (x, y, w, h, params) => {
    // Scattered falling snowflakes/dots at various sizes
    const size = params.size ?? 16;

    // Use deterministic pseudo-random placement based on position
    const cellX = Math.floor(x / size);
    const cellY = Math.floor(y / h);
    const localX = x % size;
    const localY = y % h;

    // Seed based on cell position for consistent randomness
    const seed = (cellX * 7 + cellY * 13) % 17;

    // Offset the flake position within each cell
    const flakeX = (seed * 3 + 2) % size;
    const flakeY = (seed * 5 + 1) % h;

    const dx = Math.abs(localX - flakeX);
    const dy = Math.abs(localY - flakeY);

    // Different flake sizes based on seed
    const flakeType = seed % 3;

    if (flakeType === 0) {
      // Tiny dot
      if (dx === 0 && dy === 0) return 4;
    } else if (flakeType === 1) {
      // Small cross
      if (dx + dy <= 1) return 4;
    } else {
      // Tiny star
      if (dx <= 1 && dy <= 1) {
        if (dx === 0 || dy === 0) return 4;
        return 3;
      }
    }

    // Light scatter of extra dots
    const hash1 = (x * 31 + y * 37) % 100;
    if (hash1 < 4) return 4;

    const hash2 = (x * 17 + y * 23 + 7) % 100;
    if (hash2 < 2) return 3;

    return params.bg ?? 0;
  },

  // Multi-shade diamond with hash center
  diamondHash: (x, y, w, h, params) => {
    const size = params.size ?? 16;
    const cx = x % size;
    const cy = y % h;

    const centerX = Math.floor(size / 2);
    const centerY = Math.floor(h / 2);
    const dx = cx - centerX;
    const dy = cy - centerY;
    const dist = Math.abs(dx) + Math.abs(dy);

    const maxDist = Math.min(Math.floor(size / 2) - 1, Math.floor(h / 2) - 1);

    // Hash in center (small cross)
    if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
      if (dx === 0 || dy === 0) return 0; // Dark cross
    }

    // Gradient diamond layers outward
    if (dist <= 2) return 4;      // Lightest center ring
    if (dist <= 4) return 3;      // Mid-light
    if (dist <= maxDist) return 2; // Mid tone

    return params.bg ?? 0;
  },

  // Stepped zigzag with gradient shading (centered)
  zigzagShaded: (x, y, w, h, params) => {
    const period = params.period ?? 16;
    const amplitude = Math.floor(h / 3);
    const centerY = Math.floor(h / 2);

    // Create stepped zigzag
    const phase = x % period;
    const halfPeriod = period / 2;

    let targetY;
    if (phase < halfPeriod) {
      // Going up - stepped
      const progress = phase / halfPeriod;
      targetY = centerY - Math.floor(progress * amplitude);
    } else {
      // Going down - stepped
      const progress = (phase - halfPeriod) / halfPeriod;
      targetY = centerY - amplitude + Math.floor(progress * amplitude);
    }

    const dy = Math.abs(y - targetY);

    // Multi-shade based on distance from zigzag line (symmetric above and below)
    if (dy === 0) return 4;           // Lightest - on the line
    if (dy === 1) return 3;           // Light
    if (dy === 2) return 2;           // Mid
    if (dy <= 4) return 1;            // Darker

    return params.bg ?? 0;
  },

  // Large nested diamond with full gradient
  diamondGradient: (x, y, w, h, params) => {
    const size = params.size ?? 18;
    const cx = x % size;
    const cy = y % h;

    const centerX = Math.floor(size / 2);
    const centerY = Math.floor(h / 2);
    const dx = cx - centerX;
    const dy = cy - centerY;
    const dist = Math.abs(dx) + Math.abs(dy);

    const maxDist = Math.min(Math.floor(size / 2), Math.floor(h / 2));

    // Gradient from center outward using all 5 colors
    if (dist <= 1) return 0;           // Darkest center
    if (dist <= 3) return 1;           // Dark
    if (dist <= 5) return 2;           // Mid
    if (dist <= 7) return 3;           // Light
    if (dist <= maxDist) return 4;     // Lightest edge

    return params.bg ?? 0;
  },

  // Chevron with gradient fill
  chevronShaded: (x, y, w, h, params) => {
    const period = params.period ?? 20;
    const centerY = Math.floor(h / 2);

    const phase = x % period;
    const halfPeriod = period / 2;

    // V-shape pointing down
    let peakDist;
    if (phase < halfPeriod) {
      peakDist = phase;
    } else {
      peakDist = period - phase;
    }

    // Scale to fit height
    const scaledPeak = Math.floor((peakDist / halfPeriod) * (h / 2));
    const targetY = centerY + scaledPeak;

    const dy = Math.abs(y - targetY);

    // Gradient shading from chevron line
    if (dy === 0) return 4;           // Lightest - on line
    if (dy === 1) return 3;           // Light
    if (dy === 2) return 2;           // Mid
    if (dy <= 4) return 1;            // Dark

    return params.bg ?? 0;
  },

  // GIANT intricate snowflake - 3 tones, very detailed
  snowflakeGiant: (x, y, w, h, params) => {
    const size = params.size ?? 28;
    const cx = x % size;
    const cy = y % h;

    const centerX = Math.floor(size / 2);
    const centerY = Math.floor(h / 2);
    const dx = cx - centerX;
    const dy = cy - centerY;
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);

    const armLen = Math.min(Math.floor(size / 2) - 1, Math.floor(h / 2) - 1);

    // Large center jewel (diamond shape)
    if (adx + ady <= 3) return 4;
    if (adx + ady === 4) return 3;

    // Main 8 arms - cross + diagonals
    // Vertical and horizontal arms (thick, 2px)
    if (adx <= 1 && ady <= armLen) {
      if (adx === 0) return 4;  // Center line brightest
      return 3;  // Edge of arm slightly dimmer
    }
    if (ady <= 1 && adx <= armLen) {
      if (ady === 0) return 4;
      return 3;
    }

    // Diagonal arms (thinner)
    if (Math.abs(adx - ady) <= 1 && adx <= armLen - 2 && adx >= 3) {
      if (adx === ady) return 4;
      return 3;
    }

    // Branch details on cardinal arms
    // Inner branches (closer to center)
    const innerBranch = Math.floor(armLen * 0.4);
    if (ady === innerBranch && adx >= 1 && adx <= 3) return 3;
    if (adx === innerBranch && ady >= 1 && ady <= 3) return 3;

    // Outer branches (further out)
    const outerBranch = Math.floor(armLen * 0.7);
    if (ady === outerBranch && adx >= 1 && adx <= 4) return 4;
    if (adx === outerBranch && ady >= 1 && ady <= 4) return 4;

    // Small V-tips at the end of cardinal arms
    if (ady >= armLen - 2 && adx === ady - armLen + 3 && adx <= 2) return 3;
    if (adx >= armLen - 2 && ady === adx - armLen + 3 && ady <= 2) return 3;

    // Accent dots between main arms (at 45 degrees, halfway out)
    const accentDist = Math.floor(armLen * 0.55);
    if (Math.abs(adx - accentDist) <= 1 && Math.abs(ady - accentDist) <= 1) {
      if (adx === accentDist && ady === accentDist) return 4;
      return 2;
    }

    // Small diamond accents on diagonal arms
    const diagAccent = Math.floor(armLen * 0.5);
    if (adx === ady && adx >= diagAccent - 1 && adx <= diagAccent + 1) {
      if (adx + ady === diagAccent * 2) return 4;
    }

    // Tiny dots at arm tips
    if ((adx === 0 && ady === armLen) || (ady === 0 && adx === armLen)) return 3;
    if (adx === ady && adx === armLen - 1) return 2;

    return params.bg ?? 0;
  }
};

// ============ BAND DEFINITIONS ============

const ACCENT_BANDS = [
  { name: "solid_dark", pattern: "solid", minH: 1, maxH: 2, params: { color: 0 } },
  { name: "solid_mid", pattern: "solid", minH: 1, maxH: 2, params: { color: 1 } },
  { name: "solid_light", pattern: "solid", minH: 1, maxH: 2, params: { color: 3 } },
  { name: "thin_line", pattern: "thinLine", minH: 3, maxH: 3, params: { bg: 0 } },
  { name: "double_line", pattern: "doubleLine", minH: 3, maxH: 3, params: { bg: 0 } },
  { name: "dash_line", pattern: "dashLine", minH: 3, maxH: 3, params: { bg: 0 } },
  { name: "zigzag_tiny", pattern: "zigzagTiny", minH: 2, maxH: 3, params: { bg: 0 } },
];

const SMALL_BANDS = [
  { name: "dots", pattern: "dots", minH: 6, maxH: 8, params: { spacing: 8, bg: 0 } },
  { name: "stars", pattern: "stars", minH: 8, maxH: 10, params: { spacing: 10, bg: 0 } },
  { name: "diamonds_small", pattern: "diamondsSmall", minH: 8, maxH: 10, params: { size: 10, bg: 0 } },
  { name: "peerie", pattern: "peerie", minH: 4, maxH: 6, params: { bg: 1 } },
  { name: "checkerboard", pattern: "checkerboard", minH: 3, maxH: 5, params: { bg: 0 } },
  { name: "seed_stitch", pattern: "seedStitch", minH: 3, maxH: 5, params: { bg: 0 } },
  { name: "houndstooth", pattern: "houndstooth", minH: 4, maxH: 6, params: { bg: 1 } },
];

const MEDIUM_BANDS = [
  { name: "zigzag_large", pattern: "zigzagLarge", minH: 12, maxH: 16, params: { period: 24, bg: 0 } },
  { name: "chevron", pattern: "chevron", minH: 10, maxH: 14, params: { period: 18, bg: 0 } },
  { name: "diamonds_outline", pattern: "diamondsOutline", minH: 10, maxH: 14, params: { size: 12, bg: 0 } },
  { name: "diamonds_nested", pattern: "diamondsNested", minH: 14, maxH: 18, params: { size: 16, bg: 1 } },
  { name: "x_large", pattern: "xLarge", minH: 12, maxH: 16, params: { size: 14, bg: 0 } },
  { name: "zigzag_shaded", pattern: "zigzagShaded", minH: 12, maxH: 16, params: { period: 16, bg: 0 } },
  { name: "chevron_shaded", pattern: "chevronShaded", minH: 12, maxH: 16, params: { period: 20, bg: 0 } },
];

const FEATURE_BANDS = [
  { name: "snowflake_6pt", pattern: "snowflake6pt", minH: 16, maxH: 20, params: { size: 16, bg: 0 } },
  { name: "snowflake_8pt", pattern: "snowflake8pt", minH: 18, maxH: 22, params: { size: 18, bg: 1 } },
  { name: "snowflake_crystal", pattern: "snowflakeCrystal", minH: 16, maxH: 20, params: { size: 18, bg: 0 } },
  { name: "snowflake_double", pattern: "snowflakeDouble", minH: 16, maxH: 20, params: { size: 18, bg: 1 } },
  { name: "snowflake_star", pattern: "snowflakeStar", minH: 14, maxH: 18, params: { size: 16, bg: 0 } },
  { name: "snowflake_tiny", pattern: "snowflakeTiny", minH: 12, maxH: 16, params: { size: 12, bg: 1 } },
  { name: "pine_tree", pattern: "pineTree", minH: 14, maxH: 18, params: { size: 14, bg: 0 } },
  { name: "pine_layered", pattern: "pineLayered", minH: 16, maxH: 20, params: { size: 16, bg: 1 } },
  { name: "snowfall", pattern: "snowfall", minH: 14, maxH: 18, params: { size: 16, bg: 0 } },
  { name: "circle_hash", pattern: "circleHash", minH: 10, maxH: 12, params: { size: 10, bg: 0 } },
  { name: "diamond_hash", pattern: "diamondHash", minH: 14, maxH: 18, params: { size: 16, bg: 0 } },
  { name: "diamond_gradient", pattern: "diamondGradient", minH: 16, maxH: 20, params: { size: 18, bg: 0 } },
];

// Giant snowflake - special 20% chance, 1.25x largest size
const GIANT_SNOWFLAKE = { name: "snowflake_giant", pattern: "snowflakeGiant", minH: 26, maxH: 28, params: { size: 28, bg: 0 } };

// Required patterns - every output must have at least one snowflake or pine tree
const REQUIRED_BANDS = [
  { name: "snowflake_6pt", pattern: "snowflake6pt", minH: 16, maxH: 20, params: { size: 16, bg: 0 } },
  { name: "snowflake_8pt", pattern: "snowflake8pt", minH: 18, maxH: 22, params: { size: 18, bg: 1 } },
  { name: "snowflake_crystal", pattern: "snowflakeCrystal", minH: 16, maxH: 20, params: { size: 18, bg: 0 } },
  { name: "snowflake_double", pattern: "snowflakeDouble", minH: 16, maxH: 20, params: { size: 18, bg: 1 } },
  { name: "snowflake_star", pattern: "snowflakeStar", minH: 14, maxH: 18, params: { size: 16, bg: 0 } },
  { name: "snowflake_tiny", pattern: "snowflakeTiny", minH: 12, maxH: 16, params: { size: 12, bg: 1 } },
  { name: "pine_tree", pattern: "pineTree", minH: 14, maxH: 18, params: { size: 14, bg: 0 } },
  { name: "pine_layered", pattern: "pineLayered", minH: 16, maxH: 20, params: { size: 16, bg: 1 } },
];

// ============ BAND SEQUENCE GENERATION ============

const RESERVE_BLUE_INDEX = 6; // circle_hash only appears with Reserve Blue palette

// Patterns that look like plus/cross shapes - only one type per output
const PLUS_LIKE_PATTERNS = ['stars', 'circleHash', 'snowflakeTiny', 'snowflakeDouble'];

function generateSymmetricSequence(targetRows, rng, paletteIndex = -1) {
  const half = Math.floor(targetRows / 2);
  const topSeq = [];
  let current = 0;

  // Filter feature bands - circle_hash only for Reserve Blue
  let availableFeatureBands = FEATURE_BANDS.filter(b =>
    b.name !== 'circle_hash' || paletteIndex === RESERVE_BLUE_INDEX
  );

  // Track if we've used a plus-like pattern
  let usedPlusPattern = null;

  // Filter small bands based on plus pattern usage
  const getAvailableSmallBands = () => {
    if (usedPlusPattern) {
      return SMALL_BANDS.filter(b => !PLUS_LIKE_PATTERNS.includes(b.pattern) || b.pattern === usedPlusPattern);
    }
    return SMALL_BANDS;
  };

  // Start with accent
  let acc = rng.choice(ACCENT_BANDS);
  let h = rng.nextInt(acc.minH, acc.maxH);
  topSeq.push({ band: acc, height: h });
  current += h;

  const usedFeatures = new Set();
  let hasRequiredBand = false; // Track if we've added a snowflake or pine tree

  while (current < half - 12) {
    const remaining = half - current;
    const phase = topSeq.length % 4;

    let band;
    if (phase === 0) {
      band = rng.choice(getAvailableSmallBands());
      // Track if this is a plus-like pattern
      if (PLUS_LIKE_PATTERNS.includes(band.pattern) && !usedPlusPattern) {
        usedPlusPattern = band.pattern;
      }
    } else if (phase === 1 || phase === 3) {
      band = rng.choice(ACCENT_BANDS);
    } else {
      if (remaining > 20 && rng.next() < 0.5) {
        // Filter out plus-like patterns if we've already used one (different type)
        let available = availableFeatureBands.filter(b => !usedFeatures.has(b.name));
        if (usedPlusPattern) {
          available = available.filter(b => !PLUS_LIKE_PATTERNS.includes(b.pattern) || b.pattern === usedPlusPattern);
        }

        if (available.length > 0) {
          band = rng.choice(available);
          usedFeatures.add(band.name);
          // Track plus-like patterns
          if (PLUS_LIKE_PATTERNS.includes(band.pattern) && !usedPlusPattern) {
            usedPlusPattern = band.pattern;
          }
          // Check if this is a required band (snowflake or pine)
          if (REQUIRED_BANDS.some(r => r.name === band.name)) {
            hasRequiredBand = true;
          }
        } else {
          band = rng.choice(MEDIUM_BANDS);
        }
      } else {
        band = rng.choice(MEDIUM_BANDS);
      }
    }

    const maxH = Math.min(band.maxH, remaining - 4);
    if (maxH < band.minH) break;

    h = rng.nextInt(band.minH, maxH);
    topSeq.push({ band, height: h });
    current += h;
  }

  // Fill remainder
  if (current < half) {
    const rem = half - current;
    if (rem > 0) {
      topSeq.push({ band: rng.choice(ACCENT_BANDS), height: Math.min(rem, 2) });
    }
  }

  // Center band selection
  let centerBand;

  // 20% chance for giant snowflake (only if it fits)
  const used = topSeq.reduce((sum, item) => sum + item.height, 0) * 2;
  const availableForCenter = targetRows - used;

  if (rng.next() < 0.20 && availableForCenter >= GIANT_SNOWFLAKE.minH) {
    // Use giant snowflake - this counts as having a required band
    centerBand = GIANT_SNOWFLAKE;
    hasRequiredBand = true;
  } else if (!hasRequiredBand) {
    // Must pick from required bands (snowflakes and pines), respecting plus-like restrictions
    let availableRequired = REQUIRED_BANDS.filter(b => !usedFeatures.has(b.name));
    if (usedPlusPattern) {
      availableRequired = availableRequired.filter(b => !PLUS_LIKE_PATTERNS.includes(b.pattern) || b.pattern === usedPlusPattern);
    }
    centerBand = availableRequired.length > 0 ? rng.choice(availableRequired) : rng.choice(REQUIRED_BANDS);
  } else {
    // Can pick any unused feature band (respecting palette and plus-like restrictions)
    let centerOpts = availableFeatureBands.filter(b => !usedFeatures.has(b.name));
    if (usedPlusPattern) {
      centerOpts = centerOpts.filter(b => !PLUS_LIKE_PATTERNS.includes(b.pattern) || b.pattern === usedPlusPattern);
    }
    centerBand = centerOpts.length > 0 ? rng.choice(centerOpts) : rng.choice(MEDIUM_BANDS);
  }

  const centerH = Math.max(centerBand.minH, Math.min(centerBand.maxH, availableForCenter));

  // Build full sequence: top + center + reversed top
  const full = [...topSeq];
  full.push({ band: centerBand, height: centerH });
  full.push(...[...topSeq].reverse());

  return full;
}

// ============ GRID RENDERING ============

function renderToColorGrid(bands, cols, rows) {
  const grid = Array(rows).fill(null).map(() => Array(cols).fill(2));

  let yPos = 0;
  for (const { band, height } of bands) {
    if (yPos >= rows) break;

    const patternFn = patterns[band.pattern];
    const params = { ...band.params };

    for (let y = 0; y < height; y++) {
      if (yPos + y >= rows) break;
      for (let x = 0; x < cols; x++) {
        let idx = patternFn(x, y, cols, height, params);
        idx = Math.max(0, Math.min(4, idx));
        grid[yPos + y][x] = idx;
      }
    }

    yPos += height;
  }

  return grid;
}

// ============ STITCH RENDERING ============

function renderStitch(x, y, baseColor, w, h) {
  const highlight = adjustBrightness(baseColor, 1.28);
  const shadow = adjustBrightness(baseColor, 0.70);
  const deepShadow = adjustBrightness(baseColor, 0.52);
  const brightHighlight = adjustBrightness(highlight, 1.12);

  const cx = x + w / 2;

  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${baseColor}"/>
    <path d="
      M ${x + w * 0.06} ${y + h * 0.04}
      C ${x + w * 0.06} ${y + h * 0.38},
        ${cx - w * 0.12} ${y + h * 0.68},
        ${cx} ${y + h * 0.94}
      L ${cx} ${y + h * 0.94}
      C ${cx - w * 0.18} ${y + h * 0.58},
        ${x + w * 0.20} ${y + h * 0.32},
        ${x + w * 0.30} ${y + h * 0.04}
      Z
    " fill="${highlight}"/>
    <path d="
      M ${x + w * 0.94} ${y + h * 0.04}
      C ${x + w * 0.94} ${y + h * 0.38},
        ${cx + w * 0.12} ${y + h * 0.68},
        ${cx} ${y + h * 0.94}
      L ${cx} ${y + h * 0.94}
      C ${cx + w * 0.18} ${y + h * 0.58},
        ${x + w * 0.80} ${y + h * 0.32},
        ${x + w * 0.70} ${y + h * 0.04}
      Z
    " fill="${shadow}"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h * 0.12}" fill="${deepShadow}" opacity="0.45"/>
    <ellipse cx="${cx}" cy="${y + h * 0.88}" rx="${w * 0.14}" ry="${h * 0.08}" fill="${deepShadow}" opacity="0.4"/>
    <path d="
      M ${x + w * 0.12} ${y + h * 0.16}
      Q ${x + w * 0.16} ${y + h * 0.42},
        ${cx - w * 0.10} ${y + h * 0.70}
    " stroke="${brightHighlight}" stroke-width="1" fill="none" opacity="0.5" stroke-linecap="round"/>
  `;
}

// ============ MAIN RENDER FUNCTION ============

/**
 * Generate a Fair Isle SVG from a seed
 * @param {bigint|number|string} seed - The seed value
 * @returns {{ svg: string, palette: object, paletteIndex: number }}
 */
function renderFairIsle(seed) {
  // Convert seed to number for RNG
  const seedNum = typeof seed === 'bigint' ? Number(seed % BigInt(2147483647)) : Number(seed);

  // Determine if rare (2.5% chance) - use LCG to distribute evenly across all seeds
  // Grandfather tokens 0-3 as Nordic Rainbow (minted before fix)
  const rarityCheck = ((Math.abs(seedNum) + 1) * 16807) % 1000;
  const isRare = seedNum <= 3 || rarityCheck < 25;

  // Palette selection
  let palette, paletteIndex;
  if (isRare) {
    palette = MULTICOLOR_PALETTE;
    paletteIndex = STANDARD_PALETTES.length; // Index 11
  } else {
    // Pick from standard palettes (0-10)
    paletteIndex = Math.abs(seedNum) % STANDARD_PALETTES.length;
    palette = STANDARD_PALETTES[paletteIndex];
  }

  // Use seed + 1000 for pattern generation (matches Python)
  const rng = new SeededRandom(Math.abs(seedNum) + 1000);

  // Generate band sequence (pass paletteIndex to control circle_hash availability)
  const bands = generateSymmetricSequence(ROWS, rng, paletteIndex);

  // Render to color grid
  const grid = renderToColorGrid(bands, COLS, ROWS);

  // Build SVG
  let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}">`;

  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      const colorIdx = grid[row][col];
      const color = palette.colors[colorIdx];
      const x = col * STITCH_W;
      const y = row * STITCH_H;
      svgContent += renderStitch(x, y, color, STITCH_W, STITCH_H);
    }
  }

  svgContent += '</svg>';

  return {
    svg: svgContent,
    palette,
    paletteIndex,
    isRare: palette.rare || false
  };
}

/**
 * Render to data URI for direct embedding
 */
function renderFairIsleDataURI(seed) {
  const { svg } = renderFairIsle(seed);
  const base64 = typeof btoa !== 'undefined'
    ? btoa(unescape(encodeURIComponent(svg)))
    : Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { renderFairIsle, renderFairIsleDataURI, PALETTES };
}

if (typeof window !== 'undefined') {
  window.FairIsleRenderer = { renderFairIsle, renderFairIsleDataURI, PALETTES };
}

export { renderFairIsle, renderFairIsleDataURI, PALETTES };
