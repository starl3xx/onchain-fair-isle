"use client";

import { useEffect, useState } from "react";

interface Snowflake {
  id: number;
  x: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

// Deterministic so the server and the client generate the same snow: with
// Math.random the flakes only existed after mount, costing a 50-node render
// immediately after hydration. Nobody can tell the difference in falling snow.
function makeSnowflakes(): Snowflake[] {
  let state = 20261225;
  const rand = () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
  return Array.from({ length: 50 }, (_, id) => ({
    id,
    x: rand() * 100,
    size: rand() * 3 + 2,
    duration: rand() * 10 + 10,
    delay: rand() * 10,
    opacity: rand() * 0.4 + 0.1,
  }));
}

export function Snowfall() {
  const [snowflakes] = useState<Snowflake[]>(makeSnowflakes);

  return (
    <>
      <style jsx global>{`
        @keyframes snowfall {
          0% {
            transform: translateY(-10px) rotate(0deg);
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
          }
        }
        /* transform, not margin-left: animating a layout property re-ran
           style and layout every frame, forever, on every page. */
        @keyframes sway {
          0%, 100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(20px);
          }
        }
      `}</style>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          overflow: "hidden",
          zIndex: 0,
        }}
        aria-hidden="true"
      >
        {/* Two nested elements so both motions can be transforms: one element
            can only hold one transform, and the sway and the fall run at
            different speeds. Nested, they compose on the compositor. */}
        {snowflakes.map((flake) => (
          <div
            key={flake.id}
            style={{
              position: "absolute",
              left: `${flake.x}%`,
              top: "-10px",
              willChange: "transform",
              animation: `sway ${flake.duration / 2}s ease-in-out ${flake.delay}s infinite`,
            }}
          >
            <div
              style={{
                width: flake.size,
                height: flake.size,
                background: "white",
                borderRadius: "50%",
                opacity: flake.opacity,
                willChange: "transform",
                animation: `snowfall ${flake.duration}s linear ${flake.delay}s infinite`,
              }}
            />
          </div>
        ))}
      </div>
    </>
  );
}
