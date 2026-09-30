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

/**
 * Landing-page sections that have their own clean URL (/products, /about,
 * /contact). Each of those routes renders the landing page scrolled to that
 * section, so they all count as "the landing page".
 */
export const LANDING_SECTIONS = ["products", "about", "contact"] as const;
export type LandingSection = (typeof LANDING_SECTIONS)[number];

export const isLandingPath = (pathname: string) =>
  pathname === "/" || LANDING_SECTIONS.some((section) => pathname === `/${section}`);

/** A section's own URL, e.g. /about. */
export const sectionHref = (id: string) => `/${id}`;

export const navHref = (item: NavItem) =>
  item.route ?? (item.section === "top" ? "/" : sectionHref(item.section));

/**
 * Logo / Home on the landing page: a smooth scroll to the very top (resetting
 * the address to /). Elsewhere the link simply goes home.
 */
export function scrollToTopOnHome(event: { preventDefault: () => void }, onHome: boolean) {
  if (!onHome) return;
  event.preventDefault();
  window.history.replaceState(window.history.state, "", "/");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/**
 * A landing-page section link (e.g. About Us): already on the landing page,
 * glide to the section and swap the address to its clean URL, instead of
 * reloading the page. Elsewhere the link navigates to that URL as usual.
 */
export function scrollToSectionOnHome(event: { preventDefault: () => void }, id: string, onHome: boolean) {
  const section = onHome ? document.getElementById(id) : null;
  if (!section) return;
  event.preventDefault();
  window.history.replaceState(window.history.state, "", sectionHref(id));
  section.scrollIntoView({ behavior: "smooth" });
}

/** Click handler for a nav item: Home scrolls to the top, sections scroll into view. */
export function navClick(item: NavItem, onHome: boolean) {
  if (!item.section) return undefined;
  return (event: { preventDefault: () => void }) =>
    item.section === "top" ? scrollToTopOnHome(event, onHome) : scrollToSectionOnHome(event, item.section!, onHome);
}
