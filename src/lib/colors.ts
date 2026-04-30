/**
 * Color utilities for dynamic contrast
 */

export function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}

function luminance({ r, g, b }: { r: number; g: number; b: number }) {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

export function isDark(hex: string) {
  return luminance(hexToRgb(hex)) < 0.4;
}

export function getContrastText(hex: string, light = "#F5F3EE", dark = "#111111") {
  return isDark(hex) ? light : dark;
}
