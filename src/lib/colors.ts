/**
 * Color utilities for dynamic contrast
 */

type Rgb = { r: number; g: number; b: number };

function parseColor(value: string): Rgb | null {
  const color = value.trim().toLowerCase();

  if (color.startsWith("#")) {
    const clean = color.replace("#", "");
    const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
    if (!/^[0-9a-f]{6}$/i.test(full)) return null;
    const bigint = parseInt(full, 16);
    return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
  }

  const rgbMatch = color.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgbMatch) {
    return {
      r: Number(rgbMatch[1]),
      g: Number(rgbMatch[2]),
      b: Number(rgbMatch[3]),
    };
  }

  const named: Record<string, string> = {
    black: "#000000",
    white: "#ffffff",
    red: "#ff0000",
    green: "#008000",
    blue: "#0000ff",
    yellow: "#ffff00",
    orange: "#ffa500",
    purple: "#800080",
    gray: "#808080",
    grey: "#808080",
    navy: "#000080",
  };

  return named[color] ? parseColor(named[color]) : null;
}

export function hexToRgb(hex: string) {
  return parseColor(hex) || { r: 0, g: 0, b: 0 };
}

function luminance({ r, g, b }: Rgb) {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

export function isDark(hex: string) {
  const rgb = parseColor(hex);
  return rgb ? luminance(rgb) < 0.4 : true;
}

export function getContrastText(hex: string, light = "#F5F3EE", dark = "#111111") {
  return isDark(hex) ? light : dark;
}
