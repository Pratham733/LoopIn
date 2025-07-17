"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";

const Particles = dynamic(() => import("./magicui/particles"), { ssr: false });

export default function ParticlesPortal() {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (
    !mounted ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup")
  ) {
    return null;
  }

  return typeof window !== "undefined"
    ? createPortal(
        <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
          <Particles 
            particleCount={300}
            particleSpread={10}
            speed={0.1}
            particleColors={['#ffffff', '#ffffff']}
            moveParticlesOnHover={true}
            particleHoverFactor={1}
            alphaParticles={false}
            particleBaseSize={100}
            sizeRandomness={1}
            cameraDistance={20}
            disableRotation={false}
          />
        </div>,
        document.body
      )
    : null;
} 