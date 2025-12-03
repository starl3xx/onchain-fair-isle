# Fair Isle NFT

Generative fair isle knit pattern NFTs on Base L2. Each NFT is deterministically generated from its token ID at mint time.

## Features

- Generative fair isle knitting patterns with 12 unique color palettes
- 5% chance for rare "Nordic Rainbow" multicolor palette
- 20% chance for giant intricate snowflake patterns
- Deterministic generation from token ID (fully reproducible)
- Farcaster Mini App with Frame support
- ERC-721 NFT contract on Base L2

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Test the Renderer

Open `renderer/test.html` in a browser to preview the pattern generator.

### 3. Configure Environment

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

### 4. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000 to see the mint page.

## Deployment

### Deploy Smart Contract

1. Set `PRIVATE_KEY` and `TREASURY_WALLET` in your environment
2. Deploy to Base mainnet:

```bash
npm run deploy
```

3. Verify on BaseScan:

```bash
npx hardhat verify --network base <CONTRACT_ADDRESS> "<TREASURY>" "<BASE_URI>" <MAX_SUPPLY>
```

### Deploy Frontend

1. Deploy to Vercel:

```bash
vercel
```

2. Set environment variables in Vercel dashboard
3. Update contract's `baseTokenURI` to point to your deployed metadata endpoint

## Project Structure

```
fair-isle-nft/
├── app/                      # Next.js app
│   ├── api/                  # API routes
│   │   ├── frame/            # Farcaster Frame endpoints
│   │   ├── metadata/         # NFT metadata endpoint
│   │   └── preview/          # SVG preview endpoint
│   ├── components/           # React components
│   │   ├── MintButton.tsx
│   │   ├── PatternPreview.tsx
│   │   └── SuccessScreen.tsx
│   ├── page.tsx              # Main mint page
│   └── layout.tsx            # Root layout
├── contracts/                # Solidity contracts
│   └── FairIsleNFT.sol
├── lib/                      # Shared libraries
│   └── fairisle-renderer.js  # Core pattern renderer
├── renderer/                 # Standalone renderer test
│   └── test.html
└── scripts/                  # Deployment scripts
    └── deploy.ts
```

## Palettes

| Index | Name | Rarity |
|-------|------|--------|
| 0 | North Sea | Common |
| 1 | Highland | Common |
| 2 | Heather | Common |
| 3 | Peat | Common |
| 4 | Berry | Common |
| 5 | Slate | Common |
| 6 | Reserve Blue | Common |
| 7 | Rust | Common |
| 8 | Nordic Night | Common |
| 9 | Moss | Common |
| 10 | Crimson | Common |
| 11 | Nordic Rainbow | Rare (5%) |

## Special Pattern Rules

- **Circle # pattern**: Only appears with "Reserve Blue" palette (index 6)
- **Giant snowflake**: 20% chance, 1.25x size of normal snowflakes
- **Required patterns**: Every output has at least one snowflake or pine tree
- **No duplicate plus shapes**: Only one type of plus/cross pattern per output

## Contract Details

- **Network**: Base L2 (Chain ID: 8453)
- **Standard**: ERC-721
- **Mint Price**: 0.002 ETH
- **Max Supply**: Unlimited (configurable)

## License

MIT
