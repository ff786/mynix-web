import {
  Diamond,
  Flashlight,
  Grab,
  LampDesk,
  LayoutGrid,
  Microscope,
  Package,
  Ruler,
  Scale,
  ShoppingBag,
  ZoomIn,
} from "lucide-react";

type CategoryIconProps = { categoryName: string; className?: string; strokeWidth?: number };

/** Icon picked from the POS category name, so new categories get a sensible one too. */
export default function CategoryIcon({ categoryName: name, className, strokeWidth = 1.25 }: CategoryIconProps) {
  const props = { className, strokeWidth, "aria-hidden": true };
  if (/lamp|camera light/i.test(name)) return <LampDesk {...props} />;
  if (/torch|light|uv/i.test(name)) return <Flashlight {...props} />;
  if (/magnif|loupe|optivisor|lens/i.test(name)) return <ZoomIn {...props} />;
  if (/inspect|optic|scope|refracto|polari|test/i.test(name)) return <Microscope {...props} />;
  if (/scale|weigh/i.test(name)) return <Scale {...props} />;
  if (/measur|gauge|caliper/i.test(name)) return <Ruler {...props} />;
  if (/cut|polish|lapidary|lap|grind|wheel/i.test(name)) return <Diamond {...props} />;
  if (/hold|tweezer|scoop|shovel/i.test(name)) return <Grab {...props} />;
  if (/packet|bag|pouch/i.test(name)) return <ShoppingBag {...props} />;
  if (/box|tray|display/i.test(name)) return <LayoutGrid {...props} />;
  return <Package {...props} />;
}
