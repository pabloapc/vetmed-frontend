import api from "./api";
import type { InsuranceProduct, InsuranceProductsResult } from "../types/insurance";

const FALLBACK_INSURANCE_PRODUCTS: InsuranceProduct[] = [
    {
        id: "sepelio",
        badge: "Mas solicitado",
        label: "Seguro",
        title: "Seguro de Sepelio",
        description:
            "Cobertura integral para acompanar a tu familia en los momentos mas dificiles.",
        infoPath: "/insurance/sepelio",
        features: [
            "Traslados nacionales incluidos",
            "Gestion administrativa completa",
            "Atencion telefonica 24hs",
            "Sin limite de edad de ingreso",
        ],
        isActive: true,
    },
    {
        id: "vida",
        badge: "Popular",
        label: "Seguro",
        title: "Seguro de Vida",
        description:
            "Garantiza el futuro economico de tus seres queridos con una indemnizacion segura.",
        infoPath: "/insurance/vida",
        features: [
            "Respaldo economico inmediato",
            "Beneficiarios multiples",
            "Cobertura por invalidez total",
            "Sin carencia inicial",
        ],
        isActive: true,
    },
    {
        id: "salud",
        badge: "Nuevo",
        label: "Seguro",
        title: "Seguro de Salud",
        description:
            "Complementos medicos esenciales para cuidar tu bienestar y el de tu familia.",
        infoPath: "/insurance/salud",
        features: [
            "Descuentos en veterinarias (40%)",
            "Reintegros en consultas medicas",
            "Telemedicina gratuita",
            "Protesis y ortopedia",
        ],
        isActive: true,
    },
];

const normalizeList = (res: any, key: string) => {
    const candidates = [
        res?.data?.[key],
        res?.[key],
        res?.data?.items,
        res?.items,
        res?.data,
        res,
    ];
    const list = candidates.find((c) => Array.isArray(c));
    return Array.isArray(list) ? list : [];
};

const mapProduct = (item: any): InsuranceProduct => ({
    id: String(item?._id ?? item?.id ?? item?.slug ?? item?.code ?? "").trim() ||
        String(item?.title ?? item?.name ?? "plan").toLowerCase().replace(/\s+/g, "-"),
    title: String(item?.title ?? item?.name ?? "Seguro"),
    description: String(item?.description ?? ""),
    features: Array.isArray(item?.features)
        ? item.features.map((f: any) => String(f))
        : [],
    badge: item?.badge ? String(item.badge) : undefined,
    label: item?.label ? String(item.label) : "Seguro",
    infoPath: item?.infoPath ? String(item.infoPath) : undefined,
    isActive: typeof item?.isActive === "boolean" ? item.isActive : true,
});

const filterByQuery = (items: InsuranceProduct[], q?: string) => {
    const query = (q ?? "").trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) => {
        const haystack = [item.title, item.description, ...(item.features ?? [])]
            .join(" ")
            .toLowerCase();
        return haystack.includes(query);
    });
};

const paginateItems = (
    items: InsuranceProduct[],
    page?: number,
    limit?: number
) => {
    const safePage = Math.max(1, Number(page ?? 1));
    const safeLimit = Math.max(1, Number(limit ?? 6));
    const start = (safePage - 1) * safeLimit;
    const end = start + safeLimit;

    return {
        pageItems: items.slice(start, end),
        meta: {
            total: items.length,
            page: safePage,
            limit: safeLimit,
        },
    };
};

const insuranceService = {
    async listProducts(params?: { q?: string; page?: number; limit?: number }): Promise<InsuranceProductsResult> {
        try {
            const res = await api.get("/insurance/products", { params });
            const list = normalizeList(res.data, "products");
            const fallbackList = list.length > 0 ? list : normalizeList(res.data, "plans");
            const products = fallbackList
                .map(mapProduct)
                .filter((item) => item.isActive !== false);
            const filtered = filterByQuery(products, params?.q);

            const serverMeta = res.data?.meta ?? null;
            if (serverMeta) {
                return {
                    products: filtered,
                    meta: serverMeta,
                    source: "api",
                };
            }

            const { pageItems, meta } = paginateItems(
                filtered,
                params?.page,
                params?.limit
            );

            return {
                products: pageItems,
                meta,
                source: "api",
            };
        } catch (_err) {
            // Silently fallback until backend endpoint is available.
        }

        const filteredFallback = filterByQuery(
            FALLBACK_INSURANCE_PRODUCTS,
            params?.q
        );
        const { pageItems, meta } = paginateItems(
            filteredFallback,
            params?.page,
            params?.limit
        );

        return {
            products: pageItems,
            meta,
            source: "fallback",
        };
    },
};

export default insuranceService;
