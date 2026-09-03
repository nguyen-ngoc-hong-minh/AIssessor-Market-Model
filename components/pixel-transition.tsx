"use client";
import React, { useEffect, useState } from "react";

export function PixelTransition() {
  const [active, setActive] = useState(true);
  
  useEffect(() => {
    // 1.8s timeout allows the 1.2s max animation to fully complete and rest before unmounting
    const t = setTimeout(() => setActive(false), 1800);
    return () => clearTimeout(t);
  }, []);

  if (!active) return null;

  // 8 wide transition bars with distinctly uneven speeds and delays
  const bars = Array.from({ length: 8 });

  // Deterministic uneven delay pattern (0s to 0.38s)
  const delays = [0.08, 0.32, 0.02, 0.24, 0.14, 0.38, 0.06, 0.20];
  
  // Distinctly varied speeds / durations (0.7s to 1.25s)
  const durations = [0.75, 1.20, 0.85, 1.25, 0.70, 1.05, 1.15, 0.80];

  return (
    <div 
      className="fixed inset-0 z-[999] pointer-events-none flex w-full h-full overflow-hidden"
      style={{ borderRadius: 0, border: "none" }}
    >
      {bars.map((_, i) => (
        <div
          key={i}
          className="h-full pixel-transition-bar"
          style={{
            flex: 1,
            borderRadius: 0,
            border: "none",
            '--delay': `${delays[i]}s`,
            '--duration': `${durations[i]}s`,
            willChange: "transform",
            transformOrigin: "bottom"
          } as React.CSSProperties}
        />
      ))}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pixelSlideUp {
          0% { transform: translateY(0); }
          100% { transform: translateY(-101%); }
        }
      `}} />
    </div>
  );
}
