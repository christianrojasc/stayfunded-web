"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";

interface CursorProps { size?: number; }

export const Cursor: React.FC<CursorProps> = ({ size = 60 }) => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>();
  const previousPos = useRef({ x: -size, y: -size });
  const targetPos = useRef({ x: -size, y: -size });
  const [visible, setVisible] = useState(false);

  const animate = useCallback(() => {
    if (!cursorRef.current) return;
    const curr = previousPos.current;
    const tgt = targetPos.current;
    const newX = curr.x + (tgt.x - curr.x) * 0.15;
    const newY = curr.y + (tgt.y - curr.y) * 0.15;
    previousPos.current = { x: newX, y: newY };
    cursorRef.current.style.transform = `translate(${newX}px, ${newY}px)`;
    requestRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setVisible(true);
      targetPos.current = { x: e.clientX - size / 2, y: e.clientY - size / 2 };
    };
    const handleMouseLeave = () => setVisible(false);
    const handleMouseEnter = () => setVisible(true);

    document.addEventListener("mousemove", handleMouseMove);
    document.documentElement.addEventListener("mouseenter", handleMouseEnter);
    document.documentElement.addEventListener("mouseleave", handleMouseLeave);
    document.body.style.cursor = "none";
    requestRef.current = requestAnimationFrame(animate);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.documentElement.removeEventListener("mouseenter", handleMouseEnter);
      document.documentElement.removeEventListener("mouseleave", handleMouseLeave);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      document.body.style.cursor = "auto";
    };
  }, [animate, size]);

  return (
    <div
      ref={cursorRef}
      className="fixed pointer-events-none rounded-full bg-white mix-blend-difference z-[9999] transition-opacity duration-300"
      style={{ width: size, height: size, opacity: visible ? 1 : 0 }}
      aria-hidden="true"
    />
  );
};

export default Cursor;
