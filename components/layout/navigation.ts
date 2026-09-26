/** A landing-page section (`section`) or a standalone route (`route`). */
export type NavItem =
  | { key: string; label: string; section: string; route?: undefined }
  | { key: string; label: string; route: string; section?: undefined };

/** Main navigation, in display order. */
export const NAV_ITEMS: NavItem[] = [
  { key: "home", label: "Home", section: "top" },
  { key: "products", label: "Products", section: "products" },
  { key: "catalog", label: "Catalog", route: "/catalog" },
  { key: "about", label: "About Us", section: "about" },
  { key: "contact", label: "Contact", section: "contact" },
];

/** Anchor on the landing page itself, or a link back to it from other routes. */
export const sectionHref = (id: string, onHome: boolean) => (onHome ? `#${id}` : `/#${id}`);

export const navHref = (item: NavItem, onHome: boolean) =>
  item.route ?? sectionHref(item.section, onHome);
