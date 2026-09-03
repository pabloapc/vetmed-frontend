import React, { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import searchService from "../services/searchService";
import { MapPinIcon } from "@heroicons/react/24/outline";

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

export const SearchResults: React.FC = () => {
    const q = useQuery().get("q") || "";
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any>({
        veterinarias: [],
    });
    const [error, setError] = useState("");

    useEffect(() => {
        const load = async () => {
            if (!q || q.trim().length === 0) return;
            setLoading(true);
            setError("");
            try {
                const res = await searchService.search(q, { type: "both" });
                const data = res?.data ?? res;
                setResults({
                    veterinarias: data.veterinarias ?? [],
                });
            } catch (err: any) {
                setError(
                    err?.response?.data?.message ||
                        err.message ||
                        "Error buscando resultados"
                );
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [q]);

    return (
        <div className="container mx-auto p-6">
            <h2 className="text-2xl font-semibold mb-4">
                Resultados de búsqueda para: "{q}"
            </h2>

            {loading && <div>Cargando resultados…</div>}
            {error && <div className="text-red-600">{error}</div>}

            {!loading && !error && (
                <div>
                    <h3 className="text-lg font-medium mb-2">
                        Veterinarias ({results.veterinarias.length})
                    </h3>
                    <div className="space-y-3">
                        {results.veterinarias.map((p: any) => (
                            <Link
                                key={p._id}
                                to={`/veterinarias/${p._id}`}
                                className="block p-3 bg-white rounded shadow hover:shadow-md"
                            >
                                <div className="flex items-start gap-3">
                                    <MapPinIcon className="w-6 h-6 text-brand-600" />
                                    <div>
                                        <div className="font-medium text-gray-900">
                                            {p.name}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {p.address ?? p.direccion}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                        {results.veterinarias.length === 0 && (
                            <div className="text-sm text-gray-500">
                                No se encontraron veterinarias.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchResults;
