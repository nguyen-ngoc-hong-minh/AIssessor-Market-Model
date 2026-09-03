"use client";

import { Info } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";

export function InfoTip({ label, children }: { label: string; children: React.ReactNode }) {
  const [style, setStyle] = useState<React.CSSProperties>({
    left: "50%",
    transform: "translateX(-50%)",
    maxWidth: "min(300px, calc(100vw - 56px))",
    width: "max-content",
  });
  const tipRef = useRef<HTMLSpanElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    if (!tipRef.current) return;
    const triggerRect = tipRef.current.getBoundingClientRect();
    const padding = 28; // 28px padding for page margins as requested
    const viewportWidth = window.innerWidth;
    const maxAvailableWidth = Math.min(300, Math.max(200, viewportWidth - padding * 2));

    // Desired popover width
    const popoverWidth = popoverRef.current ? Math.min(popoverRef.current.offsetWidth || maxAvailableWidth, maxAvailableWidth) : maxAvailableWidth;

    // Trigger center relative to viewport
    const triggerCenterX = triggerRect.left + triggerRect.width / 2;

    // Center popover on trigger center:
    let idealViewportLeft = triggerCenterX - popoverWidth / 2;

    // Clamp within [padding, viewportWidth - padding - popoverWidth]:
    if (idealViewportLeft < padding) {
      idealViewportLeft = padding;
    } else if (idealViewportLeft + popoverWidth > viewportWidth - padding) {
      idealViewportLeft = Math.max(padding, viewportWidth - padding - popoverWidth);
    }

    // Convert to trigger-relative left offset
    const relativeLeft = idealViewportLeft - triggerRect.left;

    setStyle({
      left: `${relativeLeft}px`,
      maxWidth: `${maxAvailableWidth}px`,
      width: "max-content",
      transform: "none",
    });
  }, []);

  useEffect(() => {
    window.addEventListener("resize", updatePosition, { passive: true });
    window.addEventListener("scroll", updatePosition, { passive: true });
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [updatePosition]);

  return (
    <span
      ref={tipRef}
      className="info-tip"
      tabIndex={0}
      aria-label={`About ${label}`}
      role="note"
      onMouseEnter={updatePosition}
      onFocus={updatePosition}
      onTouchStart={updatePosition}
    >
      <span className="info-tip-trigger" aria-hidden="true">
        <Info />
      </span>
      <div
        ref={popoverRef}
        role="tooltip"
        className="info-tip-content"
        style={style}
      >
        <strong>{label}</strong>
        <p>{children}</p>
      </div>
    </span>
  );
}
