import { NextRequest, NextResponse } from "next/server";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000";
const MINT_PRICE = "0x71afd498d0000"; // 0.002 ETH in hex (2000000000000000 wei)

// ABI-encoded mint() function selector
const MINT_SELECTOR = "0x1249c58b";

export async function POST(request: NextRequest) {
  try {
    // Return transaction calldata for minting
    const txData = {
      chainId: "eip155:8453", // Base mainnet
      method: "eth_sendTransaction",
      params: {
        abi: [
          {
            name: "mint",
            type: "function",
            stateMutability: "payable",
            inputs: [],
            outputs: [{ name: "", type: "uint256" }],
          },
        ],
        to: CONTRACT_ADDRESS,
        data: MINT_SELECTOR,
        value: MINT_PRICE,
      },
    };

    return NextResponse.json(txData);
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}
