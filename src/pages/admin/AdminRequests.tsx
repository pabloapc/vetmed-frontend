import React, { useEffect, useMemo, useState } from "react";
import adminService from "../../services/adminService";
import { useSearchParams } from "react-router-dom";

const labelForTargetType = (t?: string) => {
    if (!t) return "-";
    if (t === "pharmacy") return "Farmacia";
    if (t === "doctor") return "Doctor";
    if (t === "emergency") return "Urgencia";
    return t;
};

type TargetFilter = "all" | "pharmacy" | "doctor" | "emergency";

type StatusFilter = "all" | "pending" | "accepted" | "fulfilled" | "cancelled";

export const AdminRequests: React.FC = () => {
    const [searchParams] = useSearchParams();
    const initialTarget = searchParams.get("target");
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [warning, setWarning] = useState("");

    const [q, setQ] = useState("");
    const [targetType, setTargetType] = useState<TargetFilter>(
        initialTarget === "pharmacy" ||
            initialTarget === "doctor" ||
            initialTarget === "emergency"
            ? initialTarget
            : "all"
    );
    const [status, setStatus] = useState<StatusFilter>("all");

    const load = async () => {
        setLoading(true);
        setError("");
        setWarning("");
        try {
            const res: any = await adminService.listRequests({
                q: q || undefined,
                targetType: targetType === "all" ? undefined : targetType,
                status: status === "all" ? undefined : status,
                limit: 100,
            });

            const payload = res?.data ?? res;
            const list = payload?.requests ?? payload?.items ?? payload?.data ?? [];
            setItems(Array.isArray(list) ? list : []);
        } catch (err: any) {
            // Fallback when backend endpoint is not available yet
            try {
                const fallback: any = await adminService.getDashboardMetrics({ days: 30 });
                const payload = fallback?.data ?? fallback;
                const list = payload?.recentRequests ?? [];
                setItems(Array.isArray(list) ? list : []);
                setWarning("Mostrando movimientos recientes. Endpoint /admin/requests no disponible en backend.");
            } catch (fallbackErr: any) {
                setError(
                    err?.response?.data?.message ||
                        err?.message ||
                        fallbackErr?.response?.data?.message ||
                        fallbackErr?.message ||
                        "Error cargando movimientos"
                );
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filtered = useMemo(() => {
        return items.filter((r) => {
            const targetOk = targetType === "all" || r?.targetType === targetType;
            const statusOk = status === "all" || r?.status === status;
            const query = q.trim().toLowerCase();
            const queryOk =
                !query ||
                String(r?.userSnapshot?.name ?? "").toLowerCase().includes(query) ||
                String(r?.userSnapshot?.email ?? "").toLowerCase().includes(query) ||
                String(r?.token ?? "").toLowerCase().includes(query);
            return targetOk && statusOk && queryOk;
        });
    }, [items, q, status, targetType]);

    const counts = useMemo(() => {
        return filtered.reduce(
            (acc, r) => {
                acc.total += 1;
                if (r?.targetType === "pharmacy") acc.pharmacy += 1;
                if (r?.targetType === "doctor") acc.doctor += 1;
                if (r?.targetType === "emergency") acc.emergency += 1;
                return acc;
            },
            { total: 0, pharmacy: 0, doctor: 0, emergency: 0 }
        );
    }, [filtered]);

    if (loading) return <div className="container mx-auto p-6">Cargando movimientos...</div>;
    if (error) return <div className="container mx-auto p-6 text-red-600">{error}</div>;

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-2xl font-semibold mb-4">Movimientos</h1>

            {warning && (
                <div className="mb-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                    {warning}
                </div>
            )}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="text-xs text-slate-500">Total</div>
                    <div className="text-2xl font-semibold text-slate-900 mt-1">{counts.total}</div>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <div className="text-xs text-amber-700">Farmacias</div>
                    <div className="text-2xl font-semibold text-amber-900 mt-1">{counts.pharmacy}</div>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                    <div className="text-xs text-emerald-700">Doctores</div>
                    <div className="text-2xl font-semibold text-emerald-900 mt-1">{counts.doctor}</div>
                </div>
                <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                    <div className="text-xs text-red-700">Urgencias</div>
                    <div className="text-2xl font-semibold text-red-900 mt-1">{counts.emergency}</div>
                </div>
            </div>

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    load();
                }}
                className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-4"
            >
                <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Buscar por paciente, email o token"
                    className="border px-3 py-2 rounded md:col-span-2"
                />
                <select
                    value={targetType}
                    onChange={(e) => setTargetType(e.target.value as TargetFilter)}
                    className="border px-3 py-2 rounded"
                >
                    <option value="all">Todos los destinos</option>
                    <option value="pharmacy">Farmacias</option>
                    <option value="doctor">Doctores</option>
                    <option value="emergency">Urgencias</option>
                </select>
                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as StatusFilter)}
                    className="border px-3 py-2 rounded"
                >
                    <option value="all">Todos los estados</option>
                    <option value="pending">Pendiente</option>
                    <option value="accepted">Aceptada</option>
                    <option value="fulfilled">Cumplida</option>
                    <option value="cancelled">Cancelada</option>
                </select>
            </form>

            <div className="bg-white rounded shadow overflow-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-2 text-left">Paciente</th>
                            <th className="p-2 text-left">Destino</th>
                            <th className="p-2 text-left">Estado</th>
                            <th className="p-2 text-left">Código</th>
                            <th className="p-2 text-left">Fecha</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((r) => (
                            <tr key={r._id} className="border-t">
                                <td className="p-2">
                                    <div className="font-medium">{r?.userSnapshot?.name ?? "Usuario"}</div>
                                    <div className="text-xs text-gray-500">{r?.userSnapshot?.email ?? "-"}</div>
                                </td>
                                <td className="p-2">{labelForTargetType(r?.targetType)}</td>
                                <td className="p-2">{r?.status ?? "-"}</td>
                                <td className="p-2 font-mono">{r?.token ?? "-"}</td>
                                <td className="p-2 text-xs text-gray-500">
                                    {r?.createdAt ? new Date(r.createdAt).toLocaleString() : "-"}
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-4 text-center text-gray-500">
                                    No hay movimientos para los filtros aplicados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminRequests;
