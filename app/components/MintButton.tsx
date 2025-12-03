"use client";

import { useCallback, useEffect, useState } from "react";
import {
  useAccount,
  useConnect,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSwitchChain,
  useChainId,
} from "wagmi";
import { parseEther } from "viem";
import { base } from "wagmi/chains";
import sdk from "@farcaster/frame-sdk";
import { useNeynarUser } from "@/app/hooks/useNeynarUser";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
const MINT_PRICE = "0.002";

const CONTRACT_ABI = [
  {
    name: "mint",
    type: "function",
    stateMutability: "payable",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "totalSupply",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

interface MintButtonProps {
  onMintStart?: () => void;
  onMintSuccess?: (tokenId: bigint, txHash: string) => void;
  onMintError?: (error: Error) => void;
}

export function MintButton({
  onMintStart,
  onMintSuccess,
  onMintError,
}: MintButtonProps) {
  const [isFarcasterContext, setIsFarcasterContext] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { user: neynarUser, isLoading: isLoadingUser } = useNeynarUser();

  const {
    data: hash,
    writeContract,
    isPending: isWritePending,
    error: writeError,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    data: receipt,
  } = useWaitForTransactionReceipt({
    hash,
  });

  // Check if running in Farcaster Frame context
  useEffect(() => {
    const initFrame = async () => {
      try {
        const context = await sdk.context;
        setIsFarcasterContext(!!context);
        if (context) {
          sdk.actions.ready();
        }
      } catch {
        setIsFarcasterContext(false);
      }
      setIsReady(true);
    };
    initFrame();
  }, []);

  // Handle successful mint
  useEffect(() => {
    if (isConfirmed && receipt && hash) {
      // Extract tokenId from Transfer event
      const transferLog = receipt.logs.find(
        (log) =>
          log.topics[0] ===
          "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
      );
      const tokenId = transferLog
        ? BigInt(transferLog.topics[3] || "0")
        : BigInt(0);
      onMintSuccess?.(tokenId, hash);
    }
  }, [isConfirmed, receipt, hash, onMintSuccess]);

  // Handle errors
  useEffect(() => {
    if (writeError) {
      onMintError?.(writeError);
    }
  }, [writeError, onMintError]);

  const handleConnect = useCallback(async () => {
    // Try Farcaster Frame connector first
    const frameConnector = connectors.find(
      (c) => c.id === "farcasterFrame"
    );
    if (frameConnector) {
      connect({ connector: frameConnector });
    } else if (connectors.length > 0) {
      connect({ connector: connectors[0] });
    }
  }, [connect, connectors]);

  const handleOpenProfile = useCallback(async () => {
    if (!neynarUser?.username) return;

    const profileUrl = `https://warpcast.com/${neynarUser.username}`;
    try {
      await sdk.actions.openUrl(profileUrl);
    } catch {
      window.open(profileUrl, "_blank");
    }
  }, [neynarUser?.username]);

  const handleMint = useCallback(async () => {
    if (!isConnected) {
      await handleConnect();
      return;
    }

    // Switch to Base if needed
    if (chainId !== base.id) {
      try {
        await switchChain({ chainId: base.id });
      } catch (e) {
        onMintError?.(new Error("Please switch to Base network"));
        return;
      }
    }

    onMintStart?.();

    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "mint",
        value: parseEther(MINT_PRICE),
      });
    } catch (e) {
      onMintError?.(e as Error);
    }
  }, [
    isConnected,
    chainId,
    handleConnect,
    switchChain,
    writeContract,
    onMintStart,
    onMintError,
  ]);

  const isLoading = isWritePending || isConfirming;

  const buttonText = !isReady
    ? "Loading..."
    : !isConnected
    ? "Connect Wallet"
    : isWritePending
    ? "Confirm in Wallet..."
    : isConfirming
    ? "Knitting..."
    : `Knit for ${MINT_PRICE} ETH`;

  return (
    <div style={{ width: "100%" }}>
      {/* User Profile Section */}
      {neynarUser && (
        <button
          onClick={handleOpenProfile}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0.75rem",
            marginBottom: "0.75rem",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: 12,
            cursor: "pointer",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
          }}
        >
          <img
            src={neynarUser.pfpUrl}
            alt={neynarUser.displayName}
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              objectFit: "cover",
            }}
          />
          <div style={{ flex: 1, textAlign: "left" }}>
            <div
              style={{
                fontWeight: 600,
                fontSize: "0.9375rem",
                color: "white",
              }}
            >
              {neynarUser.displayName}
            </div>
            <div
              style={{
                fontSize: "0.8125rem",
                color: "#888",
              }}
            >
              @{neynarUser.username}
            </div>
          </div>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#888"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </button>
      )}

      {/* Mint Button */}
      <button
        onClick={handleMint}
        disabled={isLoading || !isReady}
        style={{
          width: "100%",
          padding: "1rem",
          fontSize: "1.125rem",
          fontWeight: 600,
          border: "none",
          borderRadius: 12,
          background: isLoading
            ? "#333"
            : "linear-gradient(135deg, #5b9bd5, #2d5a8b)",
          color: "white",
          cursor: isLoading ? "not-allowed" : "pointer",
          transition: "transform 0.1s, opacity 0.1s",
          opacity: isLoading ? 0.7 : 1,
        }}
      >
        {isLoading && (
          <span
            style={{
              display: "inline-block",
              marginRight: "0.5rem",
            }}
            className="spin"
          >
            &#9696;
          </span>
        )}
        {buttonText}
      </button>
    </div>
  );
}
