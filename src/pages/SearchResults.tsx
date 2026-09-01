import React, { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import searchService from "../services/searchService";
import { MapPinIcon, UserCircleIcon } from "@heroicons/react/24/outline";

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

export const SearchResults: React.FC = () => {
    const q = useQuery().get("q") || "";
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any>({
        doctors: [],
        pharmacies: [],
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
                    doctors: data.doctors ?? [],
                    pharmacies: data.pharmacies ?? [],
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-lg font-medium mb-2">
                            Farmacias ({results.pharmacies.length})
                        </h3>
                        <div className="space-y-3">
                            {results.pharmacies.map((p: any) => (
                                <Link
                                    key={p._id}
                                    to={`/pharmacies/${p._id}`}
                                    className="block p-3 bg-white rounded shadow hover:shadow-md"
                                >
                                    <div className="flex items-start gap-3">
                                        <MapPinIcon className="w-6 h-6 text-blue-600" />
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
                            {results.pharmacies.length === 0 && (
                                <div className="text-sm text-gray-500">
                                    No se encontraron farmacias.
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-medium mb-2">
                            Doctores ({results.doctors.length})
                        </h3>
                        <div className="space-y-3">
                            {results.doctors.map((d: any) => (
                                <Link
                                    key={d._id}
                                    to={`/doctors/${d._id}`}
                                    className="block p-3 bg-white rounded shadow hover:shadow-md"
                                >
                                    <div className="flex items-start gap-3">
                                        <UserCircleIcon className="w-6 h-6 text-green-600" />
                                        <div>
                                            <div className="font-medium text-gray-900">
                                                {d.name}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {d.specialty ?? d.address}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                            {results.doctors.length === 0 && (
                                <div className="text-sm text-gray-500">
                                    No se encontraron doctores.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchResults;
