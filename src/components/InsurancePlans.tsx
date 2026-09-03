import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
    UserCircleIcon,
    SparklesIcon,
    BuildingStorefrontIcon,
    ArrowPathIcon,
    MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import insuranceService from "../services/insuranceService";
import type {
    InsuranceProduct,
    InsuranceProductsResponseMeta,
} from "../types/insurance";

type InsurancePlansProps = {
    onQuote: (planTitle: string) => void;
    onMoreInfo: (path: string) => void;
};

const getIcon = (id: string, className: string) => {
    if (id === "sepelio") {
        return <UserCircleIcon className={className} />;
    }
    if (id === "vida") {
        return <SparklesIcon className={className} />;
    }
    return <BuildingStorefrontIcon className={className} />;
};

export const InsurancePlans: React.FC<InsurancePlansProps> = ({
    onQuote,
    onMoreInfo,
}) => {
    const [plans, setPlans] = useState<InsuranceProduct[]>([]);
    const [loading, setLoading] = useState(false);
    const [q, setQ] = useState("");
    const [page, setPage] = useState(1);
    const [limit] = useState(6);
    const [meta, setMeta] = useState<InsuranceProductsResponseMeta | null>(null);
    const debounceRef = useRef<number | null>(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const res = await insuranceService.listProducts({
                    q,
                    page,
                    limit,
                });
                setPlans(res.products ?? []);
                setMeta(res.meta ?? null);
            } catch (err) {
                console.error("insurance plans load error", err);
                setPlans([]);
                setMeta(null);
            } finally {
                setLoading(false);
            }
        };

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = window.setTimeout(() => {
            load();
        }, 250);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [q, page, limit]);

    const handleSearchChange = (value: string) => {
        setQ(value);
        setPage(1);
    };

    const planUi = useMemo(() => {
        return plans.map((plan) => {
            const palette =
                plan.id === "sepelio"
                    ? {
                          accentClass: "bg-brand-500",
                          badgeClass: "text-brand-600 bg-brand-50",
                          iconWrapClass: "bg-brand-50",
                          iconClass: "text-brand-600",
                          ctaClass: "bg-brand-600 hover:bg-brand-700",
                      }
                    : plan.id === "vida"
                      ? {
                            accentClass: "bg-brand-500",
                            badgeClass: "text-brand-600 bg-brand-50",
                            iconWrapClass: "bg-brand-50",
                            iconClass: "text-brand-600",
                            ctaClass: "bg-brand-600 hover:bg-brand-700",
                        }
                      : {
                            accentClass: "bg-emerald-500",
                            badgeClass: "text-emerald-600 bg-emerald-50",
                            iconWrapClass: "bg-emerald-50",
                            iconClass: "text-emerald-600",
                            ctaClass: "bg-emerald-600 hover:bg-emerald-700",
                        };

            return {
                ...plan,
                badge: plan.badge || "Nuevo",
                label: plan.label || "Seguro",
                infoPath: plan.infoPath || `/insurance/${plan.id}`,
                ...palette,
            };
        });
    }, [plans]);

    return (
        <section className="mt-16">
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-gray-900">
                        Nuestros Seguros
                    </h3>
                    <Link
                        to="/insurance"
                        className="text-sm text-brand-600 hover:underline font-medium"
                    >
                        Comparar planes {"->"}
                    </Link>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                    Elegi la cobertura que mejor se adapte a tus necesidades.
                </p>

                <div className="relative mt-4">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={q}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        placeholder="Buscar planes o coberturas..."
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-10">
                    <ArrowPathIcon className="w-6 h-6 animate-spin text-brand-500" />
                </div>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {planUi.map((plan) => (
                    <article
                        key={plan.id}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden"
                    >
                        <div className={`h-1.5 w-full ${plan.accentClass}`} />
                        <div className="p-6 flex flex-col flex-1">
                            <div className="flex items-center justify-between mb-3">
                                <div className="inline-flex items-center gap-3">
                                    <div
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${plan.iconWrapClass}`}
                                    >
                                        {getIcon(plan.id, `w-5 h-5 ${plan.iconClass}`)}
                                    </div>
                                    <div
                                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${plan.badgeClass}`}
                                    >
                                        {plan.badge}
                                    </div>
                                </div>
                                <div className="text-sm text-gray-500">{plan.label}</div>
                            </div>

                            <h4 className="text-lg font-semibold mb-2">{plan.title}</h4>
                            <p className="text-sm text-gray-600 mb-4">{plan.description}</p>

                            <ul className="text-sm text-gray-700 space-y-2 mb-6">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-start gap-2">
                                        <span className="text-brand-600">✓</span>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <div className="mt-auto">
                                <button
                                    onClick={() => onQuote(plan.title)}
                                    className={`w-full text-white font-medium px-4 py-2.5 rounded-xl transition text-sm ${plan.ctaClass}`}
                                >
                                    Cotizar Ahora
                                </button>
                                <button
                                    onClick={() => onMoreInfo(plan.infoPath)}
                                    className="w-full mt-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 font-medium px-4 py-2.5 rounded-xl transition text-sm border border-gray-100"
                                >
                                    Mas Informacion
                                </button>
                            </div>
                        </div>
                    </article>
                ))}
            </div>

            {!loading && planUi.length === 0 ? (
                <div className="text-center py-10 text-sm text-gray-500">
                    No hay planes disponibles por el momento.
                </div>
            ) : null}

            {!loading && (meta?.total ?? 0) > limit ? (
                <div className="flex items-center justify-center gap-4 mt-8">
                    <button
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                    >
                        Anterior
                    </button>
                    <div className="text-sm text-gray-600">
                        Pagina {page} de {Math.max(1, Math.ceil((meta?.total ?? 0) / limit))}
                    </div>
                    <button
                        disabled={page * limit >= (meta?.total ?? 0)}
                        onClick={() => setPage((p) => p + 1)}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                    >
                        Siguiente
                    </button>
                </div>
            ) : null}
        </section>
    );
};

export default InsurancePlans;
