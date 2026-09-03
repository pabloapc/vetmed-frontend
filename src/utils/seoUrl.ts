// Mirrors the backend's slugify (src/utils/slugify.js) so city segments match.
export const slugify = (text: string): string =>
    String(text || "")
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80);

/**
 * Builds the SEO-friendly detail URL for a veterinaria, e.g.
 * /veterinarias/cordoba/clinica-veterinaria-vottero. Falls back to the
 * legacy /veterinarias/:id route when no slug is available yet.
 */
export const veterinariaDetailPath = (v: {
    id: string;
    slug?: string;
    city?: string;
    ciudad?: string;
}): string => {
    if (!v.slug) return `/veterinarias/${v.id}`;
    const citySlug = slugify(v.city || v.ciudad || "cordoba") || "cordoba";
    return `/veterinarias/${citySlug}/${v.slug}`;
};
