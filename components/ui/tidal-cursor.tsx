"use client";
import { useEffect, useRef } from "react";

export function TidalCursor() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ripples = useRef<{ x: number; y: number; radius: number; alpha: number }[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const handleMove = (e: MouseEvent) => {
      ripples.current.push({ x: e.clientX, y: e.clientY, radius: 0, alpha: 0.8 });
    };
    window.addEventListener("mousemove", handleMove);

    let rafId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ripples.current.forEach(r => {
        r.radius += 1.5;
        r.alpha -= 0.01;
        if (r.alpha > 0) {
          ctx.beginPath();
          ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(74, 222, 128, ${r.alpha})`; // StayFunded green
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      });
      ripples.current = ripples.current.filter(r => r.alpha > 0);
      rafId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-50"
    />
  );
}
