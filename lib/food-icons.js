/**
 * Food category icon mapping using Lucide React icons.
 * Replaces native emojis which render inconsistently across devices.
 */
import {
  Drumstick,
  Bean,
  Wheat,
  Salad,
  Apple,
  UtensilsCrossed,
  Cookie,
  Flame,
  Egg,
  Fish,
  Beef,
  Milk,
  Carrot,
  Cherry,
  Grape,
  Banana,
  Sandwich,
  Pizza,
  Soup,
} from "lucide-react";

/**
 * Category → icon component + color
 */
export const CATEGORY_ICONS = {
  protein_hewani: { icon: Drumstick, color: "#E67E22", bg: "#FDF2E9" },
  protein_nabati: { icon: Bean, color: "#8B6914", bg: "#FEF9E7" },
  karbohidrat: { icon: Wheat, color: "#D4A017", bg: "#FFFBEB" },
  sayur: { icon: Salad, color: "#27AE60", bg: "#EAFAF1" },
  buah: { icon: Apple, color: "#E74C3C", bg: "#FDEDEC" },
  lainnya: { icon: UtensilsCrossed, color: "#7F8C8D", bg: "#F2F4F4" },
};

/**
 * Specific food → icon mapping for more precise icons
 */
const FOOD_ICONS = {
  ayam: Drumstick,
  ikan: Fish,
  telur: Egg,
  daging: Beef,
  sapi: Beef,
  rendang: Beef,
  susu: Milk,
  tempe: Bean,
  tahu: Bean,
  nasi: Wheat,
  mie: Sandwich,
  roti: Sandwich,
  kentang: Cookie,
  sayur: Salad,
  bayam: Salad,
  kangkung: Salad,
  capcay: Salad,
  sop: Soup,
  wortel: Carrot,
  buncis: Salad,
  pisang: Banana,
  jeruk: Cherry,
  semangka: Cherry,
  melon: Cherry,
  anggur: Grape,
  apel: Apple,
  kerupuk: Cookie,
  sambal: Flame,
  nugget: Drumstick,
  sosis: Drumstick,
  pizza: Pizza,
  bakso: Soup,
};

/**
 * Get the best icon for a food item based on its name and category
 */
export function getFoodIcon(foodName, kategori) {
  const nameLower = (foodName || "").toLowerCase();

  // Try specific food name match
  for (const [keyword, IconComp] of Object.entries(FOOD_ICONS)) {
    if (nameLower.includes(keyword)) {
      const catInfo = CATEGORY_ICONS[kategori] || CATEGORY_ICONS.lainnya;
      return { icon: IconComp, color: catInfo.color, bg: catInfo.bg };
    }
  }

  // Fallback to category
  return CATEGORY_ICONS[kategori] || CATEGORY_ICONS.lainnya;
}

/**
 * Render a food icon component with consistent styling
 */
export function FoodIconBadge({ foodName, kategori, size = "md" }) {
  const { icon: IconComp, color, bg } = getFoodIcon(foodName, kategori);
  const sizes = {
    sm: { wrapper: "h-7 w-7 rounded-lg", icon: "h-3.5 w-3.5" },
    md: { wrapper: "h-9 w-9 rounded-xl", icon: "h-4.5 w-4.5" },
    lg: { wrapper: "h-11 w-11 rounded-2xl", icon: "h-5 w-5" },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div
      className={`${s.wrapper} flex items-center justify-center shrink-0`}
      style={{ backgroundColor: bg }}
    >
      <IconComp className={s.icon} style={{ color }} />
    </div>
  );
}
