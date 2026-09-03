"use client";
import React, { useEffect, useRef } from "react";

export function PixelCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const cellSize = 40;
    let cols = 0;
    let rows = 0;
    let cells: number[] = []; // Stores the "alpha" value of each pixel cell
    
    // Audio Context for sound effect (initialize on first click)
    let audioCtx: AudioContext | null = null;
    
    const playClickSound = () => {
      try {
        if (!audioCtx) {
          audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioCtx.state === "suspended") {
          audioCtx.resume();
        }
        
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        // A crisp tech click
        osc.type = "square";
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
      } catch (e) {
        console.error("Audio playback failed", e);
      }
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      cols = Math.ceil(canvas.width / cellSize);
      rows = Math.ceil(canvas.height / cellSize);
      const newCells = new Array(cols * rows).fill(0);
      
      // Copy over old cells if resizing
      if (cells.length > 0) {
         // rough copy to avoid losing entirely
      }
      cells = newCells;
    };
    
    resize();
    window.addEventListener("resize", resize);

    // Mouse tracking
    let mouse = { x: -1000, y: -1000, active: false };
    const handleMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
      
      const c = Math.floor(mouse.x / cellSize);
      const r = Math.floor(mouse.y / cellSize);
      const idx = r * cols + c;
      if (idx >= 0 && idx < cells.length) {
         cells[idx] = 1.0;
         
         // Random splatter around the cursor (Tighter area)
         for (let dy = -1; dy <= 1; dy++) {
           for (let dx = -1; dx <= 1; dx++) {
             if (dx === 0 && dy === 0) continue;
             
             const nx = c + dx;
             const ny = r + dy;
             if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
               // Only draw immediately adjacent pixels occasionally
               if (Math.random() > 0.6) {
                 const nidx = ny * cols + nx;
                 cells[nidx] = Math.max(cells[nidx], 0.3 + Math.random() * 0.5);
               }
             }
           }
         }
      }
    };
    
    const handleLeave = () => { mouse.active = false; };
    
    // Click Effect
    let ripples: {x: number, y: number, radius: number, alpha: number}[] = [];
    
    const handleClick = (e: MouseEvent) => {
      playClickSound();
      ripples.push({
        x: e.clientX,
        y: e.clientY,
        radius: 0,
        alpha: 1.0
      });
      
      // Instantly activate a random cluster of pixels on click
      const c = Math.floor(e.clientX / cellSize);
      const r = Math.floor(e.clientY / cellSize);
      
      for(let dy=-3; dy<=3; dy++){
        for(let dx=-3; dx<=3; dx++){
           const nx = c + dx;
           const ny = r + dy;
           if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
             const dist = Math.sqrt(dx*dx + dy*dy);
             if (dist <= 3 && Math.random() > 0.3) {
               cells[ny * cols + nx] = 1.0;
             }
           }
        }
      }
    };
    
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseleave", handleLeave);
    window.addEventListener("mousedown", handleClick);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const isDark = document.documentElement.getAttribute("data-theme") === "dark";
      const themeColor = isDark ? "#FFFFF1" : "#0213B0";

      // Draw Grid Cells
      ctx.fillStyle = themeColor;
      
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          if (cells[idx] > 0.01) {
             ctx.globalAlpha = cells[idx];
             ctx.fillRect(c * cellSize, r * cellSize, cellSize - 1, cellSize - 1);
             // Decay
             cells[idx] *= 0.90; // slightly faster fade out
          }
        }
      }
      
      // Draw Ripples
      ripples.forEach((rip, i) => {
        ctx.globalAlpha = rip.alpha;
        ctx.strokeStyle = themeColor;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        rip.radius += 18; // expand faster
        rip.alpha *= 0.88; // fade faster
        
        // Interaction with grid from ripple (randomized)
        const rc = Math.floor(rip.x / cellSize);
        const rr = Math.floor(rip.y / cellSize);
        const waveRadiusCells = Math.floor(rip.radius / cellSize);
        
        for (let dr = -waveRadiusCells; dr <= waveRadiusCells; dr++) {
          for (let dc = -waveRadiusCells; dc <= waveRadiusCells; dc++) {
            const dist = Math.sqrt(dr*dr + dc*dc);
            if (Math.abs(dist - waveRadiusCells) < 1.5 && Math.random() > 0.5) {
              const nx = rc + dc;
              const ny = rr + dr;
              if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
                 const nidx = ny * cols + nx;
                 cells[nidx] = Math.max(cells[nidx], rip.alpha);
              }
            }
          }
        }
      });
      
      ripples = ripples.filter(r => r.alpha > 0.01);
      
      ctx.globalAlpha = 1.0;
      animId = requestAnimationFrame(render);
    };

    render();
    
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseleave", handleLeave);
      window.removeEventListener("mousedown", handleClick);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[1] pointer-events-none"
      aria-hidden="true"
    />
  );
}
