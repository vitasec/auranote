import { ColorPalette } from "../App";

/**
 * Deterministically generates an eye-safe, harmonized Material Design 3 and Color Hunt scheme
 * based on a unique string seed.
 */
export function generatePaletteFromSeed(seed: string): ColorPalette {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Choose beautiful harmonious Hues using golden ratio spacer
  const baseHue = Math.abs(hash) % 360;
  const secondaryHue = (baseHue + 30) % 360; 
  const tertiaryHue = (baseHue + 150) % 360; 

  const hslToHex = (h: number, s: number, l: number) => {
    l /= 100;
    const a = (s * Math.min(l, 1 - l)) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, "0");
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  // Safe contrast constraints for study ergonomics
  const hexBg = hslToHex(baseHue, 18, 7);
  const hexSurface = hslToHex(baseHue, 16, 11);
  const hexSfCont = hslToHex(baseHue, 14, 15);
  const hexSfLow = hslToHex(baseHue, 16, 9);
  const hexSfHigh = hslToHex(baseHue, 12, 19);
  const hexSfHighest = hslToHex(baseHue, 10, 23);
  
  const hexPrimary = hslToHex(baseHue, 85, 78);
  const hexSecondary = hslToHex(secondaryHue, 45, 82);
  const hexTertiary = hslToHex(tertiaryHue, 95, 74);

  return {
    id: `seed-${seed.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}`,
    name: `Seed: ${seed}`,
    creator: "You // Custom Seed Generator",
    colors: {
      background: hexBg,
      surface: hexSurface,
      surfaceContainer: hexSfCont,
      surfaceContainerLow: hexSfLow,
      surfaceContainerHigh: hexSfHigh,
      surfaceContainerHighest: hexSfHighest,
      primary: hexPrimary,
      secondary: hexSecondary,
      tertiary: hexTertiary,
    }
  };
}
