import React, { useEffect, useMemo, useState } from "react";
//import { useAuth } from "../hooks/useAuth";
import { requestService } from "../services/requestService";
import {
    UserGroupIcon,
    ClockIcon,
    CheckBadgeIcon,
    CheckCircleIcon,
    XCircleIcon,
} from "@heroicons/react/24/outline";

type DashboardFilter =
    | "all"
    | "today"
    | "pending"
    | "accepted"
    | "fulfilled"
    | "cancelled";

export const PharmacyRequests: React.FC = () => {
    //const { user } = useAuth();
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeFilter, setActiveFilter] = useState<DashboardFilter>("all");

    const metrics = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return requests.reduce(
            (acc, r) => {
                const status = String(r?.status || "").toLowerCase();
                const createdAt = r?.createdAt ? new Date(r.createdAt) : null;
                const isToday =
                    createdAt &&
                    !Number.isNaN(createdAt.getTime()) &&
                    (() => {
                        const d = new Date(createdAt);
                        d.setHours(0, 0, 0, 0);
                        return d.getTime() === today.getTime();
                    })();

                acc.total += 1;
                if (status === "pending") acc.pending += 1;
                if (status === "accepted") acc.accepted += 1;
                if (status === "fulfilled") acc.fulfilled += 1;
                if (status === "cancelled") acc.cancelled += 1;
                if (isToday) acc.today += 1;
                return acc;
            },
            {
                total: 0,
                today: 0,
                pending: 0,
                accepted: 0,
                fulfilled: 0,
                cancelled: 0,
            }
        );
    }, [requests]);

    const filteredRequests = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (activeFilter === "today") {
            return requests.filter((r) => {
                if (!r?.createdAt) return false;
                const d = new Date(r.createdAt);
                if (Number.isNaN(d.getTime())) return false;
                d.setHours(0, 0, 0, 0);
                return d.getTime() === today.getTime();
            });
        }

        if (activeFilter === "all") return requests;
        return requests.filter(
            (r) => String(r?.status || "").toLowerCase() === activeFilter
        );
    }, [requests, activeFilter]);

    const load = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await requestService.getRequestsForPharmacy();
            const list =
                res?.data?.requests ?? res?.requests ?? res?.data ?? [];
            setRequests(list);
        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                    err.message ||
                    "Error al cargar solicitudes"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const handleUpdateStatus = async (id: string, status: string) => {
        try {
            await requestService.updateRequestStatus(id, status);
            // refresh
            await load();
        } catch (err) {
            console.error(err);
        }
    };

    if (loading)
        return (
            <div className="container mx-auto p-6">Cargando solicitudes...</div>
        );
    if (error)
        return (
            <div className="container mx-auto p-6 text-red-600">{error}</div>
        );

    return (
        <div className="container mx-auto p-6">
            <h2 className="text-2xl font-semibold mb-4">
                Solicitudes recibidas
            </h2>

            <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-5">
                <button
                    type="button"
                    onClick={() => setActiveFilter("all")}
                    className={`rounded-xl border p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm ${
                        activeFilter === "all"
                            ? "border-slate-700 bg-slate-50 ring-2 ring-slate-200"
                            : "border-slate-200 bg-white"
                    }`}
                >
                    <div className="flex items-center gap-2 text-slate-600 text-xs">
                        <UserGroupIcon className="w-4 h-4" /> Total
                    </div>
                    <div className="text-2xl font-semibold mt-1 text-slate-900">
                        {metrics.total}
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveFilter("today")}
                    className={`rounded-xl border p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm ${
                        activeFilter === "today"
                            ? "border-sky-500 bg-sky-100 ring-2 ring-sky-200"
                            : "border-sky-200 bg-sky-50"
                    }`}
                >
                    <div className="flex items-center gap-2 text-sky-700 text-xs">
                        <ClockIcon className="w-4 h-4" /> Día actual
                    </div>
                    <div className="text-2xl font-semibold mt-1 text-sky-900">
                        {metrics.today}
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveFilter("pending")}
                    className={`rounded-xl border p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm ${
                        activeFilter === "pending"
                            ? "border-amber-500 bg-amber-100 ring-2 ring-amber-200"
                            : "border-amber-200 bg-amber-50"
                    }`}
                >
                    <div className="flex items-center gap-2 text-amber-700 text-xs">
                        <ClockIcon className="w-4 h-4" /> Pendientes
                    </div>
                    <div className="text-2xl font-semibold mt-1 text-amber-900">
                        {metrics.pending}
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveFilter("accepted")}
                    className={`rounded-xl border p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm ${
                        activeFilter === "accepted"
                            ? "border-indigo-500 bg-indigo-100 ring-2 ring-indigo-200"
                            : "border-indigo-200 bg-indigo-50"
                    }`}
                >
                    <div className="flex items-center gap-2 text-indigo-700 text-xs">
                        <CheckBadgeIcon className="w-4 h-4" /> Aceptadas
                    </div>
                    <div className="text-2xl font-semibold mt-1 text-indigo-900">
                        {metrics.accepted}
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveFilter("fulfilled")}
                    className={`rounded-xl border p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm ${
                        activeFilter === "fulfilled"
                            ? "border-emerald-500 bg-emerald-100 ring-2 ring-emerald-200"
                            : "border-emerald-200 bg-emerald-50"
                    }`}
                >
                    <div className="flex items-center gap-2 text-emerald-700 text-xs">
                        <CheckCircleIcon className="w-4 h-4" /> Cumplidas
                    </div>
                    <div className="text-2xl font-semibold mt-1 text-emerald-900">
                        {metrics.fulfilled}
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveFilter("cancelled")}
                    className={`rounded-xl border p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm ${
                        activeFilter === "cancelled"
                            ? "border-rose-500 bg-rose-100 ring-2 ring-rose-200"
                            : "border-rose-200 bg-rose-50"
                    }`}
                >
                    <div className="flex items-center gap-2 text-rose-700 text-xs">
                        <XCircleIcon className="w-4 h-4" /> Canceladas
                    </div>
                    <div className="text-2xl font-semibold mt-1 text-rose-900">
                        {metrics.cancelled}
                    </div>
                </button>
            </div>

            <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                    Mostrando <span className="font-semibold">{filteredRequests.length}</span> solicitudes
                </p>
                {activeFilter !== "all" && (
                    <button
                        type="button"
                        onClick={() => setActiveFilter("all")}
                        className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
                    >
                        Limpiar filtro
                    </button>
                )}
            </div>

            {filteredRequests.length === 0 ? (
                <p>No hay solicitudes.</p>
            ) : (
                <div className="space-y-4">
                    {filteredRequests.map((r) => (
                        <div
                            key={r._id}
                            className="bg-white p-4 rounded shadow"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="font-medium">
                                        {r.userSnapshot?.name ||
                                            "Usuario Anónimo"}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {r.userSnapshot?.email}
                                    </div>
                                </div>
                                <div className="text-sm text-gray-600">
                                    {new Date(r.createdAt).toLocaleString()}
                                </div>
                            </div>

                            <div className="mt-2 text-sm text-gray-700">
                                <div>
                                    <strong>Tipo:</strong> {r.actionType}
                                </div>
                                {r.notes && (
                                    <div>
                                        <strong>Observaciones:</strong>{" "}
                                        {r.notes}
                                    </div>
                                )}
                                <div className="mt-2">
                                    <strong>Código:</strong>{" "}
                                    <span className="font-mono">{r.token}</span>{" "}
                                    <span className="text-xs text-gray-500">
                                        expira{" "}
                                        {new Date(r.expiresAt).toLocaleString()}
                                    </span>
                                </div>
                                <div className="mt-3 flex space-x-2">
                                    {r.status === "pending" && (
                                        <button
                                            onClick={() =>
                                                handleUpdateStatus(
                                                    r._id,
                                                    "accepted"
                                                )
                                            }
                                            className="px-3 py-1 bg-green-600 text-white rounded"
                                        >
                                            Aceptar
                                        </button>
                                    )}
                                    {r.status === "accepted" && (
                                        <button
                                            onClick={() =>
                                                handleUpdateStatus(
                                                    r._id,
                                                    "fulfilled"
                                                )
                                            }
                                            className="px-3 py-1 bg-blue-600 text-white rounded"
                                        >
                                            Marcar como cumplida
                                        </button>
                                    )}
                                    <button
                                        onClick={() =>
                                            handleUpdateStatus(
                                                r._id,
                                                "cancelled"
                                            )
                                        }
                                        className="px-3 py-1 bg-red-600 text-white rounded"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
