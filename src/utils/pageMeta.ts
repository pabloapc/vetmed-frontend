// Shared helpers to set document head tags (title/description/canonical/JSON-LD)
// from client-rendered pages. Used by any indexable page that needs per-URL SEO tags.

export const setMetaTag = (attr: "name" | "property", key: string, content: string) => {
    let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
    if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute(attr, key);
        document.head.appendChild(tag);
    }
    tag.setAttribute("content", content);
};

export const setCanonical = (href: string) => {
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        document.head.appendChild(link);
    }
    link.setAttribute("href", href);
};

export const setJsonLd = (id: string, data: Record<string, unknown> | null) => {
    let script = document.getElementById(id) as HTMLScriptElement | null;
    if (!data) {
        script?.remove();
        return;
    }
    if (!script) {
        script = document.createElement("script");
        script.id = id;
        script.type = "application/ld+json";
        document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(data);
};
