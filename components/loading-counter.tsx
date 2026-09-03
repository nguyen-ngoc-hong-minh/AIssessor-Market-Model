"use client";

import { useEffect, useState } from "react";

export function LoadingCounter({ label }: { label?: string }) {
  const [percent, setPercent] = useState(1);

  useEffect(() => {
    setPercent(1);
    const start = Date.now();
    const duration = 3600; // ~3.6s smooth easing to 99%

    const interval = window.setInterval(() => {
      const elapsed = Date.now() - start;
      const fraction = Math.min(1, elapsed / duration);
      // Ease-out curve
      const current = Math.min(99, Math.max(1, Math.floor(1 + 98 * Math.sin((fraction * Math.PI) / 2))));
      setPercent(current);
    }, 30);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="trial-loading-wrap">
      <div className="trial-loading-percentage">{percent}%</div>
      {label && <h1 className="trial-loading-title">{label}</h1>}
    </div>
  );
}
