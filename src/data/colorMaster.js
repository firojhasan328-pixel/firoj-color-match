// ========================================
// Color Master Data
// ========================================
// প্রতিটি কালারের নাম + HEX Color + Code List
// ========================================

export const COLOR_MASTER = [
  {
    name: "Yellow",
    hex: "#FCD34D",
    codes: ["P6G", "P4G", "M8G", "FG"],
  },
  {
    name: "Golden",
    hex: "#D4A017",
    codes: ["HR", "P3R"],
  },
  {
    name: "Orange",
    hex: "#F97316",
    codes: ["P2R", "H2R"],
  },
  {
    name: "Red",
    hex: "#DC2626",
    codes: ["PB", "P8B", "P2B"],
  },
  {
    name: "Blue",
    hex: "#2563EB",
    codes: ["P3R", "P5R"],
  },
  {
    name: "Violet",
    hex: "#7C3AED",
    codes: ["H3R", "P3R"],
  },
  {
    name: "Magenta",
    hex: "#D946EF",
    codes: ["HB", "PB"],
  },
  {
    name: "TBlue",
    hex: "#06B6D4",
    codes: ["G", "PGL"],
  },
  {
    name: "Black",
    hex: "#1F2937",
    codes: ["HN", "B"],
  },
];

// ========================================
// Set Type Options
// ========================================
export const SET_TYPES = ["250 gm", "500 gm", "1 kg"];

// ========================================
// Helper: কালার নাম দিয়ে Code List বের করা
// ========================================
export function getCodesByColorName(name) {
  const color = COLOR_MASTER.find((c) => c.name === name);
  return color ? color.codes : [];
}

// ========================================
// Helper: কালার নাম দিয়ে HEX বের করা
// ========================================
export function getHexByColorName(name) {
  const color = COLOR_MASTER.find((c) => c.name === name);
  return color ? color.hex : "#CCCCCC";
}

// ========================================
// Helper: পরিমাণ Range
// ========================================
export const WEIGHT_MIN = 0;
export const WEIGHT_MAX = 200;
export const WEIGHT_STEP = 5;
