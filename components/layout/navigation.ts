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
  item.route ?? (item.section === "top" && !onHome ? "/" : sectionHref(item.section, onHome));

/**
 * Logo / Home on the landing page: a smooth scroll to the very top (clearing
 * any #section from the address). Elsewhere the link simply goes home.
 */
export function scrollToTopOnHome(event: { preventDefault: () => void }, onHome: boolean) {
  if (!onHome) return;
  event.preventDefault();
  window.history.replaceState(window.history.state, "", "/");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/**
 * A landing-page section link (e.g. Products): on the landing page, scroll to
 * it explicitly, since the router skips a hash it thinks is already current.
 */
export function scrollToSectionOnHome(event: { preventDefault: () => void }, id: string, onHome: boolean) {
  const section = onHome ? document.getElementById(id) : null;
  if (!section) return;
  event.preventDefault();
  window.history.replaceState(window.history.state, "", `/#${id}`);
  section.scrollIntoView({ behavior: "smooth" });
}

/** Click handler for a nav item: Home scrolls to the top, sections scroll into view. */
export function navClick(item: NavItem, onHome: boolean) {
  if (!item.section) return undefined;
  return (event: { preventDefault: () => void }) =>
    item.section === "top" ? scrollToTopOnHome(event, onHome) : scrollToSectionOnHome(event, item.section!, onHome);
}
