// Fetches every active veterinaria and writes public/sitemap.xml.
// Run manually before a deploy (or wire into CI) with:
//   node scripts/generate-sitemap.js [apiUrl]
// apiUrl defaults to the production API; pass a local one to test against dev data.
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const SITE_ORIGIN = "https://www.vetfind.com.ar";
const API_URL = process.argv[2] || "https://vetmed-backend-9eqc.onrender.com/api";

const STATIC_PATHS = [
    { path: "/", changefreq: "weekly", priority: "1.0" },
    { path: "/veterinarias", changefreq: "daily", priority: "0.9" },
    // One entry per literal per-city listing route added in App.tsx (e.g. /veterinarias/cordoba).
    { path: "/veterinarias/cordoba", changefreq: "daily", priority: "0.9" },
    { path: "/organizaciones", changefreq: "monthly", priority: "0.5" },
    { path: "/login", changefreq: "yearly", priority: "0.2" },
    { path: "/register", changefreq: "yearly", priority: "0.2" },
];

const slugify = (text) =>
    String(text || "")
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80);

const escapeXml = (s) =>
    String(s).replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]));

async function main() {
    console.log(`Fetching veterinarias from ${API_URL}/veterinarias ...`);
    const res = await fetch(`${API_URL}/veterinarias`);
    if (!res.ok) {
        throw new Error(`API respondió ${res.status}`);
    }
    const body = await res.json();
    const veterinarias = body?.data?.veterinarias ?? [];

    const urls = [
        ...STATIC_PATHS.map((p) => `${SITE_ORIGIN}${p.path}`),
        ...veterinarias
            .filter((v) => v.slug)
            .map((v) => {
                const citySlug = slugify(v.city) || "cordoba";
                return `${SITE_ORIGIN}/veterinarias/${citySlug}/${v.slug}`;
            }),
    ];

    const staticEntries = STATIC_PATHS.map(
        (p) => `  <url>
    <loc>${escapeXml(SITE_ORIGIN + p.path)}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
    );

    const vetEntries = veterinarias
        .filter((v) => v.slug)
        .map((v) => {
            const citySlug = slugify(v.city) || "cordoba";
            const loc = `${SITE_ORIGIN}/veterinarias/${citySlug}/${v.slug}`;
            return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
        });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticEntries, ...vetEntries].join("\n")}
</urlset>
`;

    const outPath = join(__dirname, "../public/sitemap.xml");
    writeFileSync(outPath, xml, "utf-8");
    console.log(`sitemap.xml escrito con ${urls.length} URLs -> ${outPath}`);
}

main().catch((err) => {
    console.error("No se pudo generar el sitemap:", err.message);
    process.exit(1);
});
