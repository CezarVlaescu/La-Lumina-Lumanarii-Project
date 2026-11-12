import type { CSSProperties } from "react";
import type {
  ThemeEffect,
  ThemeEffectIntensity,
} from "../lib/hero-settings";

type SeasonalEffectProps = {
  effect: ThemeEffect;
  intensity: ThemeEffectIntensity;
  preview?: boolean;
};

const particleCount: Record<ThemeEffectIntensity, number> = {
  subtle: 22,
  balanced: 34,
  festive: 48,
};

const particles = Array.from({ length: 48 }, (_, index) => ({
  delay: (index * 1.73 + 0.8) % 15,
  drift: ((index * 19) % 29) - 14,
  duration: 8 + ((index * 13) % 9),
  left: (index * 37 + 11) % 100,
  opacity: 0.28 + ((index * 7) % 6) * 0.1,
  rotation: 160 + ((index * 23) % 260),
  size: 3 + ((index * 11) % 7),
}));

const effectSymbol: Record<ThemeEffect, string> = {
  none: "",
  snow: "",
  hearts: "♥",
  petals: "",
  leaves: "",
  sparkles: "✦",
};

export function SeasonalEffect({
  effect,
  intensity,
  preview = false,
}: SeasonalEffectProps) {
  if (effect === "none") return null;

  const count = preview
    ? Math.min(particleCount[intensity], 28)
    : particleCount[intensity];

  return (
    <div
      aria-hidden="true"
      className={`seasonal-effect seasonal-effect--${effect}${preview ? " seasonal-effect--preview" : ""}`}
      data-effect={effect}
      data-effect-intensity={intensity}
    >
      {particles.slice(0, count).map((particle, index) => (
        <span
          className="seasonal-effect__particle"
          data-symbol={effectSymbol[effect]}
          key={index}
          style={
            {
              "--effect-delay": `-${particle.delay}s`,
              "--effect-drift": `${particle.drift}vw`,
              "--effect-duration": `${particle.duration}s`,
              "--effect-left": `${particle.left}%`,
              "--effect-opacity": particle.opacity,
              "--effect-rotation": `${particle.rotation}deg`,
              "--effect-size": `${particle.size}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
