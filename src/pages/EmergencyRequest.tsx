import React, { useEffect, useState } from "react";
import { requestService } from "../services/requestService";

export const EmergencyRequests: React.FC = () => {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionLoading, setActionLoading] = useState<Record<string, boolean>>(
        {}
    );

    const load = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await requestService.getRequestsForEmergency();
            const list =
                res?.data?.requests ?? res?.requests ?? res?.data ?? [];
            setRequests(list);
        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                    err.message ||
                    "Error al cargar solicitudes"
            );
            setRequests([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const setRequestActionLoading = (id: string, v: boolean) =>
        setActionLoading((s) => ({ ...s, [id]: v }));

    const humanStatus = (s?: string) => {
        if (!s) return "Desconocido";
        switch (s) {
            case "pending":
                return "Pendiente";
            case "accepted":
                return "Aceptada";
            case "en_transito":
                return "En tránsito";
            case "llego_destino":
                return "Llegó al destino";
            case "fulfilled":
                return "Cumplida";
            case "cancelled":
                return "Cancelada";
            default:
                return s.replace(/_/g, " ");
        }
    };

    const handleChangeStatus = async (r: any, newStatus: string) => {
        const confirmMsg = `Vas a cambiar el estado a "${humanStatus(
            newStatus
        )}". ¿Confirmás?`;
        if (!confirm(confirmMsg)) return;
        const id = r._id;
        setRequestActionLoading(id, true);
        try {
            await requestService.updateRequestStatus(id, newStatus);
            await load();
            // optionally show a small feedback
            // alert("Estado actualizado");
        } catch (err: any) {
            console.error("Error updating request status", err);
            alert(
                err?.response?.data?.message ||
                    err?.message ||
                    "Error actualizando estado"
            );
        } finally {
            setRequestActionLoading(id, false);
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
                Solicitudes recibidas (Emergencia)
            </h2>

            {requests.length === 0 ? (
                <p>No hay solicitudes.</p>
            ) : (
                <div className="space-y-4">
                    {requests.map((r) => {
                        const requester = r.userSnapshot ?? r.user ?? {};
                        const createdAt = r.createdAt
                            ? new Date(r.createdAt).toLocaleString()
                            : "";
                        const callUrl = r.metadata?.callUrl;
                        const scheduled = r.metadata?.scheduledAt
                            ? new Date(r.metadata.scheduledAt).toLocaleString()
                            : null;
                        const loadingForThis = !!actionLoading[r._id];

                        return (
                            <div
                                key={r._id}
                                className="bg-white rounded-lg shadow p-4 flex flex-col"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="text-lg font-medium">
                                            {requester.name ?? "Paciente"}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {requester.email ?? ""}{" "}
                                            {requester.telefono
                                                ? `• ${requester.telefono}`
                                                : ""}
                                        </div>
                                        <div className="text-xs text-gray-400 mt-1">
                                            Creada: {createdAt}
                                        </div>
                                        {scheduled && (
                                            <div className="text-xs text-gray-500 mt-1">
                                                Programada: {scheduled}
                                            </div>
                                        )}
                                    </div>

                                    <div className="text-right">
                                        <div className="text-sm text-gray-600">
                                            Estado
                                        </div>
                                        <div className="mt-1 font-medium">
                                            {humanStatus(r.status)}
                                        </div>
                                    </div>
                                </div>

                                {r.notes && (
                                    <div className="mt-3 text-sm text-gray-700">
                                        <strong className="text-xs text-gray-500">
                                            Observaciones:
                                        </strong>
                                        <div className="mt-1 p-3 bg-gray-50 rounded border text-gray-700">
                                            {r.notes}
                                        </div>
                                    </div>
                                )}

                                {callUrl && (
                                    <div className="mt-3">
                                        <a
                                            href={callUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
                                        >
                                            Ir a la videollamada
                                        </a>
                                    </div>
                                )}

                                <div className="mt-4 flex flex-wrap items-center gap-2">
                                    {/* Buttons to change status: accepted, en_transito, llego_destino */}
                                    <button
                                        disabled={
                                            loadingForThis ||
                                            r.status === "accepted"
                                        }
                                        onClick={() =>
                                            handleChangeStatus(r, "accepted")
                                        }
                                        className={`px-3 py-1 rounded text-sm ${
                                            r.status === "accepted"
                                                ? "bg-gray-200 text-gray-600"
                                                : "bg-green-600 text-white hover:bg-green-700"
                                        }`}
                                    >
                                        {loadingForThis &&
                                        r.status !== "accepted"
                                            ? "..."
                                            : "Marcar Aceptada"}
                                    </button>

                                    <button
                                        disabled={
                                            loadingForThis ||
                                            r.status === "en_transito"
                                        }
                                        onClick={() =>
                                            handleChangeStatus(r, "en_transito")
                                        }
                                        className={`px-3 py-1 rounded text-sm ${
                                            r.status === "en_transito"
                                                ? "bg-gray-200 text-gray-600"
                                                : "bg-yellow-600 text-white hover:bg-yellow-700"
                                        }`}
                                    >
                                        {loadingForThis &&
                                        r.status !== "en_transito"
                                            ? "..."
                                            : "Marcar En tránsito"}
                                    </button>

                                    <button
                                        disabled={
                                            loadingForThis ||
                                            r.status === "llego_destino"
                                        }
                                        onClick={() =>
                                            handleChangeStatus(
                                                r,
                                                "llego_destino"
                                            )
                                        }
                                        className={`px-3 py-1 rounded text-sm ${
                                            r.status === "llego_destino"
                                                ? "bg-gray-200 text-gray-600"
                                                : "bg-blue-600 text-white hover:bg-blue-700"
                                        }`}
                                    >
                                        {loadingForThis &&
                                        r.status !== "llego_destino"
                                            ? "..."
                                            : "Marcar Llegó al destino"}
                                    </button>

                                    {/* Cancel */}
                                    <button
                                        disabled={
                                            loadingForThis ||
                                            r.status === "cancelled"
                                        }
                                        onClick={() =>
                                            handleChangeStatus(r, "cancelled")
                                        }
                                        className={`px-3 py-1 rounded text-sm ${
                                            r.status === "cancelled"
                                                ? "bg-gray-200 text-gray-600"
                                                : "bg-red-600 text-white hover:bg-red-700 ml-auto"
                                        }`}
                                    >
                                        {loadingForThis &&
                                        r.status !== "cancelled"
                                            ? "..."
                                            : "Cancelar"}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default EmergencyRequests;
