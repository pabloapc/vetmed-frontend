import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import adminService from "../services/adminService";
import {
    ArrowLeftIcon,
    ArrowPathIcon,
    BuildingLibraryIcon,
    GlobeAltIcon,
    PhoneIcon,
    ExclamationCircleIcon,
    MagnifyingGlassIcon,
    ClipboardDocumentListIcon,
    SparklesIcon,
} from "@heroicons/react/24/outline";

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

const readField = (obj: any, keys: string[]) => {
    for (const key of keys) {
        const value = obj?.[key];
        if (typeof value === "string" && value.trim()) {
            return value.trim();
        }
    }
    return "";
};

const normalizeOfferText = (value: any): string => {
    if (typeof value === "string") return value;
    if (typeof value === "number") return String(value);
    if (!value || typeof value !== "object") return "";
    return (
        readField(value, ["name", "title", "label", "description", "text"]) ||
        JSON.stringify(value)
    );
};

const extractPlanOffers = (plan: any): string[] => {
    const rawCollections = [
        plan?.offers,
        plan?.benefits,
        plan?.connections,
        plan?.coverages,
        plan?.planCoverages,
        plan?.highlights,
    ];

    const offerSet = new Set<string>();

    for (const collection of rawCollections) {
        if (!collection) continue;

        if (Array.isArray(collection)) {
            collection
                .map((item) => normalizeOfferText(item))
                .filter(Boolean)
                .forEach((text) => offerSet.add(text));
            continue;
        }

        const value = normalizeOfferText(collection);
        if (value) {
            offerSet.add(value);
        }
    }

    return Array.from(offerSet);
};

export const InsurerDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [insurer, setInsurer] = useState<any | null>(null);
    const [plans, setPlans] = useState<any[]>([]);
    const [planCoverages, setPlanCoverages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [q, setQ] = useState("");

    useEffect(() => {
        if (!id) return;

        const load = async () => {
            setLoading(true);
            setError("");

            try {
                const [insurerRes, plansRes, coveragesRes] = await Promise.allSettled([
                    adminService.getInsurer(id),
                    adminService.listPlans({ insurerId: id, page: 1, limit: 200 }),
                    adminService.listPlanCoverages({
                        insurerId: id,
                        page: 1,
                        limit: 500,
                    }),
                ]);

                if (insurerRes.status !== "fulfilled") {
                    throw insurerRes.reason;
                }

                if (plansRes.status !== "fulfilled") {
                    throw plansRes.reason;
                }

                const resolvedInsurer =
                    insurerRes.value?.data?.insurer ??
                    insurerRes.value?.insurer ??
                    insurerRes.value?.data ??
                    insurerRes.value;

                setInsurer(resolvedInsurer ?? null);
                setPlans(normalizeList(plansRes.value, "plans"));

                if (coveragesRes.status === "fulfilled") {
                    setPlanCoverages(normalizeList(coveragesRes.value, "coverages"));
                } else {
                    // Optional endpoint: keep page working with plan-embedded offers.
                    setPlanCoverages([]);
                }
            } catch (err: any) {
                setError(
                    err?.response?.data?.message ||
                        err?.message ||
                        "No se pudo cargar la institución"
                );
                setInsurer(null);
                setPlans([]);
                setPlanCoverages([]);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [id]);

    const getEntityId = (value: any): string => {
        if (!value) return "";
        if (typeof value === "string") return value;
        if (typeof value === "object") {
            return String(value?._id ?? value?.id ?? "");
        }
        return String(value);
    };

    const formatCoverageOffer = (coverage: any): string => {
        const prestation =
            readField(coverage?.prestationId, ["name", "title", "label"]) ||
            readField(coverage, ["prestationName", "name"]);

        const mode = String(coverage?.coverageMode ?? "covered");
        const modeLabel =
            mode === "covered"
                ? "Cobertura"
                : mode === "excluded"
                  ? "Excluida"
                  : mode === "partial"
                    ? "Parcial"
                    : mode;

        const coveragePercent =
            coverage?.coveragePercent != null
                ? `${Number(coverage.coveragePercent)}%`
                : "";

        const copay =
            coverage?.copayAmount != null
                ? `Copago ${Number(coverage.copayAmount)} ${coverage?.currency ?? "ARS"}`
                : "";

        const auth = coverage?.requiresAuthorization
            ? "Requiere autorización"
            : "";

        return [
            prestation || "Prestación",
            [modeLabel, coveragePercent].filter(Boolean).join(" "),
            copay,
            auth,
        ]
            .filter(Boolean)
            .join(" · ");
    };

    const linkedOffersByPlanId = useMemo(() => {
        const map = new Map<string, string[]>();

        for (const coverage of planCoverages) {
            if (coverage?.isActive === false) continue;

            const planId = getEntityId(coverage?.planId);
            if (!planId) continue;

            const current = map.get(planId) ?? [];
            const offer = formatCoverageOffer(coverage);
            if (offer && !current.includes(offer)) {
                current.push(offer);
            }
            map.set(planId, current);
        }

        return map;
    }, [planCoverages]);

    const filteredPlans = useMemo(() => {
        const query = q.trim().toLowerCase();
        if (!query) return plans;

        return plans.filter((plan) => {
            const planId = getEntityId(plan?._id ?? plan?.id ?? plan);
            const linkedOffers = planId ? linkedOffersByPlanId.get(planId) ?? [] : [];
            const offers = [
                ...linkedOffers,
                ...extractPlanOffers(plan),
            ];
            const haystack = [
                plan?.name,
                plan?.code,
                plan?.tier,
                plan?.description,
                ...offers,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return haystack.includes(query);
        });
    }, [plans, q, linkedOffersByPlanId]);

    const websiteUrlRaw = readField(insurer, ["website", "url", "web", "site"]);
    const websiteUrl = websiteUrlRaw
        ? websiteUrlRaw.startsWith("http")
            ? websiteUrlRaw
            : `https://${websiteUrlRaw}`
        : "";

    if (loading) {
        return (
            <div className="flex justify-center items-center py-24">
                <ArrowPathIcon className="w-8 h-8 animate-spin text-brand-500" />
            </div>
        );
    }

    if (error || !insurer) {
        return (
            <div className="container mx-auto px-4 py-12 text-center max-w-2xl">
                <ExclamationCircleIcon className="w-12 h-12 text-red-400 mx-auto mb-3" />
                <h1 className="text-xl font-semibold text-gray-900 mb-2">
                    Institución no disponible
                </h1>
                <p className="text-gray-600 mb-6">
                    {error || "No encontramos la información de esta institución."}
                </p>
                <button
                    onClick={() => navigate(-1)}
                    className="px-5 py-2.5 rounded-lg bg-brand-600 text-white hover:bg-brand-700"
                >
                    Volver
                </button>
            </div>
        );
    }

    const insurerName = readField(insurer, ["name", "title"]) || "Institución";
    const insurerDescription = readField(insurer, ["description", "summary"]);
    const insurerKind = readField(insurer, ["kind", "category", "type"]);
    const insurerPhone = readField(insurer, ["phone", "telephone", "contactPhone"]);

    return (
        <div className="container mx-auto px-4 py-10 max-w-5xl">
            <style>
                {`
                    .insurer-plan-grid > article:nth-child(3n + 1) {
                        background: linear-gradient(180deg, #f0fdf4 0%, #ffffff 36%);
                        border-color: #bbf7d0;
                    }

                    .insurer-plan-grid > article:nth-child(3n + 1) .plan-accent {
                        background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%);
                    }

                    .insurer-plan-grid > article:nth-child(3n + 1) .plan-chip {
                        background: #ecfdf5;
                        color: #047857;
                    }

                    .insurer-plan-grid > article:nth-child(3n + 2) {
                        background: linear-gradient(180deg, #eff6ff 0%, #ffffff 36%);
                        border-color: #bfdbfe;
                    }

                    .insurer-plan-grid > article:nth-child(3n + 2) .plan-accent {
                        background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
                    }

                    .insurer-plan-grid > article:nth-child(3n + 2) .plan-chip {
                        background: #eff6ff;
                        color: #1d4ed8;
                    }

                    .insurer-plan-grid > article:nth-child(3n + 3) {
                        background: linear-gradient(180deg, #fff7ed 0%, #ffffff 36%);
                        border-color: #fed7aa;
                    }

                    .insurer-plan-grid > article:nth-child(3n + 3) .plan-accent {
                        background: linear-gradient(135deg, #f97316 0%, #fb7185 100%);
                    }

                    .insurer-plan-grid > article:nth-child(3n + 3) .plan-chip {
                        background: #fff7ed;
                        color: #c2410c;
                    }
                `}
            </style>

            <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6"
            >
                <ArrowLeftIcon className="w-4 h-4" />
                Volver
            </button>

            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 mb-8">
                <div className="flex flex-col md:flex-row md:items-start gap-5">
                    <div className="p-3 rounded-xl bg-brand-50 text-brand-600 w-fit">
                        <BuildingLibraryIcon className="w-8 h-8" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                                {insurerName}
                            </h1>
                            {insurerKind ? (
                                <span className="text-xs bg-brand-50 text-brand-700 px-2.5 py-1 rounded-full font-medium">
                                    {insurerKind}
                                </span>
                            ) : null}
                        </div>

                        <p className="text-gray-600 text-sm md:text-base">
                            {insurerDescription ||
                                "Conocé su red de planes y las ofertas disponibles dentro de Vetfind."}
                        </p>

                        <div className="mt-4 flex flex-wrap items-center gap-3">
                            {insurerPhone ? (
                                <a
                                    href={`tel:${insurerPhone}`}
                                    className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-brand-700"
                                >
                                    <PhoneIcon className="w-4 h-4" />
                                    {insurerPhone}
                                </a>
                            ) : null}

                            {websiteUrl ? (
                                <a
                                    href={websiteUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-sm text-brand-700 hover:text-brand-900 font-medium"
                                >
                                    <GlobeAltIcon className="w-4 h-4" />
                                    Sitio oficial
                                </a>
                            ) : null}
                        </div>
                    </div>
                </div>
            </section>

            <section>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                            Planes y Ofertas
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Revisá las opciones activas y sus beneficios asociados.
                        </p>
                    </div>

                    <div className="relative w-full md:w-80">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Buscar plan u oferta..."
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                        />
                    </div>
                </div>

                {filteredPlans.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-500">
                        No hay planes cargados para esta institución.
                    </div>
                ) : (
                    <div className="insurer-plan-grid grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {filteredPlans.map((plan) => {
                            const planId = getEntityId(plan?._id ?? plan?.id ?? plan);
                            const linkedOffers = planId
                                ? linkedOffersByPlanId.get(planId) ?? []
                                : [];
                            const planOffers = linkedOffers.length > 0
                                ? linkedOffers
                                : extractPlanOffers(plan);
                            return (
                                <article
                                    key={String(plan?._id ?? plan?.id ?? plan?.code ?? plan?.name)}
                                    className="relative overflow-hidden rounded-[24px] border shadow-sm p-5 flex flex-col min-h-[320px] transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg"
                                >
                                    <div className="plan-accent absolute inset-x-0 top-0 h-1.5" />
                                    <div className="absolute -top-10 -right-8 w-24 h-24 rounded-full bg-white/60 blur-2xl pointer-events-none" />

                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full bg-white/80 border border-white/70 shadow-sm">
                                                <SparklesIcon className="w-3.5 h-3.5 text-gray-500" />
                                                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                                                    Plan destacado
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {readField(plan, ["name", "title"]) || "Plan"}
                                            </h3>
                                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                                                {plan?.code ? (
                                                    <span className="plan-chip px-2 py-1 rounded-full font-medium">
                                                        Cod. {plan.code}
                                                    </span>
                                                ) : null}
                                                {plan?.tier ? (
                                                    <span className="plan-chip px-2 py-1 rounded-full font-medium">
                                                        {plan.tier}
                                                    </span>
                                                ) : null}
                                                <span
                                                    className={`px-2 py-1 rounded-full font-medium ${
                                                        plan?.isActive === false
                                                            ? "bg-gray-100 text-gray-600"
                                                            : "bg-green-50 text-green-700"
                                                    }`}
                                                >
                                                    {plan?.isActive === false ? "Inactivo" : "Activo"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {plan?.description ? (
                                        <p className="text-sm text-gray-600 mt-3">{plan.description}</p>
                                    ) : null}

                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <h4 className="text-sm font-semibold text-gray-800 inline-flex items-center gap-2 mb-2">
                                            <ClipboardDocumentListIcon className="w-4 h-4 text-brand-600" />
                                            Ofertas vinculadas
                                        </h4>
                                        {planOffers.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {planOffers.map((offer) => (
                                                    <span
                                                        key={offer}
                                                        className="plan-chip text-xs px-2.5 py-1 rounded-full font-medium"
                                                    >
                                                        {offer}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-gray-500">
                                                Sin ofertas específicas cargadas por ahora.
                                            </p>
                                        )}
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>

            <div className="mt-8 text-sm text-gray-500">
                ¿Sos parte de esta institución y querés sumar o actualizar planes? Visitá
                <Link to="/organizaciones" className="text-brand-700 hover:underline ml-1">
                    organizaciones
                </Link>
                .
            </div>
        </div>
    );
};

export default InsurerDetail;
