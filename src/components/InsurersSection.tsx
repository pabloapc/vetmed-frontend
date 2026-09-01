import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
    ArrowPathIcon,
    MagnifyingGlassIcon,
    BuildingLibraryIcon,
    ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import adminService from "../services/adminService";

export const InsurersSection: React.FC = () => {
    const navigate = useNavigate();
    const [insurances, setInsurances] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [q, setQ] = useState("");
    const [page, setPage] = useState(1);
    const [limit] = useState(12);
    const [meta, setMeta] = useState<any>(null);
    const debounceRef = useRef<number | null>(null);

    const containerVariants = {
        hidden: { opacity: 0, y: 8 },
        show: { opacity: 1, y: 0, transition: { staggerChildren: 0.08 } },
    };

    const cardVariant = {
        hidden: { opacity: 0, y: 10, scale: 0.99 },
        show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45 } },
        hover: { scale: 1.03, y: -6, transition: { duration: 0.18 } },
    };

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

    const loadInsurers = async (searchQuery: string = "", pageNum: number = 1) => {
        setLoading(true);
        try {
            const res: any = await adminService.listInsurers({
                page: pageNum,
                limit,
                q: searchQuery,
            });
            setInsurances(normalizeList(res, "insurers"));
            setMeta(res?.meta ?? res?.data?.meta ?? null);
        } catch (err) {
            console.error("Error loading insurers:", err);
            setInsurances([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInsurers(q, page);
        // eslint-disable-next-line
    }, [page]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQ(value);
        setPage(1);

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = window.setTimeout(() => {
            loadInsurers(value, 1);
        }, 300);
    };

    if (loading && insurances.length === 0) {
        return (
            <section className="py-12 px-4">
                <div className="flex justify-center">
                    <ArrowPathIcon className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            </section>
        );
    }

    return (
        <section className="py-12 px-4 bg-gray-50">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900">
                                Obras Sociales y Prepagas
                            </h2>
                            <p className="text-gray-600 mt-2">
                                Entidades de cobertura y servicios asociados en la red Gimed.
                            </p>
                        </div>
                    </div>

                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={q}
                            onChange={handleSearch}
                            placeholder="Buscar por nombre o código..."
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                        />
                    </div>
                </div>

                {insurances.length > 0 ? (
                    <>
                        <motion.div
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                            initial="hidden"
                            animate="show"
                            variants={containerVariants}
                        >
                            {insurances.map((insurance) => {
                                const insurerId = insurance?._id ?? insurance?.id;
                                const canOpenDetail = Boolean(insurerId);

                                return (
                                <motion.article
                                    key={insurerId ?? insurance?.name}
                                    variants={cardVariant}
                                    whileHover="hover"
                                    className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col gap-4 border border-gray-100 ${canOpenDetail ? "cursor-pointer" : ""}`}
                                    role={canOpenDetail ? "button" : undefined}
                                    tabIndex={canOpenDetail ? 0 : -1}
                                    onClick={() => {
                                        if (!canOpenDetail) return;
                                        navigate(`/insurers/${insurerId}`);
                                    }}
                                    onKeyDown={(e) => {
                                        if (!canOpenDetail) return;
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            navigate(`/insurers/${insurerId}`);
                                        }
                                    }}
                                >
                                    <div className="p-3 rounded-md bg-blue-50 text-blue-600 w-fit">
                                        <BuildingLibraryIcon className="w-6 h-6" />
                                    </div>

                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {insurance.name}
                                    </h3>

                                    {insurance.description && (
                                        <p className="text-sm text-gray-600 line-clamp-2 flex-1">
                                            {insurance.description}
                                        </p>
                                    )}

                                    <div className="pt-4 border-t border-gray-100">
                                        <div className="flex items-center justify-between text-sm">
                                            {insurance.kind || insurance.category ? (
                                                <span className="inline-block bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                                                    {insurance.kind || insurance.category}
                                                </span>
                                            ) : null}

                                            <span
                                                className={`px-2 py-1 rounded text-xs font-medium ${
                                                    insurance.isActive
                                                        ? "bg-green-50 text-green-700"
                                                        : "bg-gray-100 text-gray-600"
                                                }`}
                                            >
                                                {insurance.isActive ? "Activo" : "Inactivo"}
                                            </span>
                                        </div>
                                    </div>

                                    {insurance.phone && (
                                        <div className="text-xs text-gray-500 pt-2">
                                            📞 {insurance.phone}
                                        </div>
                                    )}

                                    <div className="mt-auto pt-2">
                                        {canOpenDetail ? (
                                            <span className="inline-flex items-center gap-1.5 text-sm text-blue-700 font-medium">
                                                Ver planes y ofertas
                                                <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 text-sm text-gray-400 font-medium">
                                                Información próximamente
                                            </span>
                                        )}
                                    </div>
                                </motion.article>
                            );
                        })}
                        </motion.div>

                        {meta && meta.total > limit && (
                            <div className="flex items-center justify-center gap-4 mt-8">
                                <button
                                    disabled={page <= 1}
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                                >
                                    Anterior
                                </button>
                                <div className="text-sm text-gray-600">
                                    Pagina {page} de {Math.ceil(meta.total / limit)}
                                </div>
                                <button
                                    disabled={page * limit >= meta.total}
                                    onClick={() => setPage((p) => p + 1)}
                                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                                >
                                    Siguiente
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-12">
                        <BuildingLibraryIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-gray-700 mb-1">
                            No se encontraron instituciones
                        </h3>
                        <p className="text-gray-500">
                            {q
                                ? "Intenta con otro termino de busqueda"
                                : "No hay instituciones disponibles en este momento"}
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
};

export default InsurersSection;
