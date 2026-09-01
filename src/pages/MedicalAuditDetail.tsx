import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import medicalAuditService from "../services/medicalAuditService";
import type { MedicalAudit } from "../types/medicalAudit";
import {
    ArrowLeftIcon,
    DocumentTextIcon,
    ExclamationCircleIcon,
    MapPinIcon,
    PaperAirplaneIcon,
} from "@heroicons/react/24/outline";

const statusClass: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    in_review: "bg-blue-100 text-blue-700",
    validated: "bg-emerald-100 text-emerald-700",
    rejected: "bg-red-100 text-red-700",
    requires_more: "bg-orange-100 text-orange-700",
};

export const MedicalAuditDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [audit, setAudit] = useState<MedicalAudit | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [documentUrl, setDocumentUrl] = useState("");
    const [documentType, setDocumentType] = useState("certificate");
    const [documentNotes, setDocumentNotes] = useState("");

    const [eventType, setEventType] = useState("gps_ping");
    const [lat, setLat] = useState("");
    const [lng, setLng] = useState("");
    const [accuracy, setAccuracy] = useState("");
    const [trackingNotes, setTrackingNotes] = useState("");

    const load = async () => {
        if (!id) return;
        setLoading(true);
        setError("");
        try {
            const res: any = await medicalAuditService.getAuditById(id);
            const payload = res?.data ?? res;
            const item = payload?.audit ?? payload;
            setAudit(item ?? null);
        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                    err?.message ||
                    "No se pudo cargar la auditoría."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [id]);

    const addDocument = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id || !documentUrl.trim()) return;
        try {
            await medicalAuditService.addDocuments(id, [
                {
                    url: documentUrl.trim(),
                    type: documentType,
                    notes: documentNotes.trim() || undefined,
                },
            ]);
            setDocumentUrl("");
            setDocumentNotes("");
            await load();
        } catch (err: any) {
            alert(
                err?.response?.data?.message ||
                    err?.message ||
                    "No se pudo agregar el documento."
            );
        }
    };

    const addTracking = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id || !lat || !lng) {
            alert("Ingresá latitud y longitud.");
            return;
        }

        try {
            await medicalAuditService.addTrackingEvent(id, {
                eventType,
                lat: Number(lat),
                lng: Number(lng),
                accuracy: accuracy ? Number(accuracy) : undefined,
                notes: trackingNotes.trim() || undefined,
            });
            setLat("");
            setLng("");
            setAccuracy("");
            setTrackingNotes("");
            await load();
        } catch (err: any) {
            alert(
                err?.response?.data?.message ||
                    err?.message ||
                    "No se pudo registrar el tracking."
            );
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 text-sm text-gray-600">
                    Cargando auditoría...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
                    <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        <ExclamationCircleIcon className="h-5 w-5 mt-0.5 shrink-0" />
                        <span>{error}</span>
                    </div>
                    <Link
                        to="/audits"
                        className="mt-4 inline-flex items-center gap-1.5 text-sm text-blue-700 hover:underline"
                    >
                        <ArrowLeftIcon className="h-4 w-4" />
                        Volver
                    </Link>
                </div>
            </div>
        );
    }

    if (!audit) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="container mx-auto p-6">
                <p>Auditoría no encontrada.</p>
                </div>
            </div>
        );
    }

    const auditStatus = audit.auditStatus || "pending";

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 space-y-6 pb-28">
                <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-cyan-700 via-sky-600 to-blue-700 p-6 sm:p-8 text-white shadow-xl">
                    <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-white/10" />
                    <div className="absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-white/10" />
                    <div className="relative z-10 flex items-end justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold sm:text-4xl">Detalle de auditoría</h1>
                            <p className="mt-2 text-sm text-cyan-100">
                                Estado del caso, carga de documentos y seguimiento GPS.
                            </p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusClass[auditStatus] || "bg-white/15 text-white"}`}
                                >
                                    {auditStatus}
                                </span>
                                <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-medium">
                                    Caso: {audit.caseStatus}
                                </span>
                            </div>
                        </div>

                        <Link
                            to="/audits"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm font-medium text-white hover:bg-white/20 transition"
                        >
                            <ArrowLeftIcon className="h-4 w-4" />
                            Volver
                        </Link>
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-0">
                    <section className="rounded-[1.5rem] border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Diagnóstico</h2>
                        <p className="text-sm text-gray-800">
                            {audit.diagnosis?.description ||
                                audit.diagnosis?.summary ||
                                "Sin detalle"}
                        </p>
                        <p className="text-sm text-gray-600 mt-2">
                            Período: {audit.diagnosis?.startDate || "-"} a {" "}
                            {audit.diagnosis?.endDate || "-"}
                        </p>
                        {audit.diagnosis?.restDays != null && (
                            <p className="text-sm text-gray-600 mt-1">
                                Días de reposo: {audit.diagnosis.restDays}
                            </p>
                        )}
                        {audit.validation && (
                            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                                <p className="font-medium">Resultado automático</p>
                                <p className="mt-1">Score: {audit.validation.score ?? "-"}</p>
                                <p>
                                    Flags: {(audit.validation.flags ?? []).join(", ") || "Sin alertas"}
                                </p>
                            </div>
                        )}
                    </section>

                    <section className="rounded-[1.5rem] border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Agregar documento</h2>
                        <p className="text-sm text-gray-500 mb-4">Adjuntá estudios, certificados o evidencia en URL.</p>
                        <form onSubmit={addDocument} className="space-y-3">
                            <input
                                value={documentUrl}
                                onChange={(e) => setDocumentUrl(e.target.value)}
                                className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                placeholder="URL del documento"
                            />
                            <input
                                value={documentType}
                                onChange={(e) => setDocumentType(e.target.value)}
                                className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                placeholder="Tipo"
                            />
                            <input
                                value={documentNotes}
                                onChange={(e) => setDocumentNotes(e.target.value)}
                                className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                placeholder="Notas (opcional)"
                            />
                            <button className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 transition">
                                <DocumentTextIcon className="h-4 w-4" />
                                Cargar documento
                            </button>
                        </form>
                    </section>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <section className="rounded-[1.5rem] border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Eventos de tracking</h2>
                        <p className="text-sm text-gray-500 mb-4">Registrá ubicación y contexto del seguimiento.</p>
                    <form onSubmit={addTracking} className="space-y-2 mb-4">
                        <input
                            value={eventType}
                            onChange={(e) => setEventType(e.target.value)}
                            className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            placeholder="Tipo de evento"
                        />
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                value={lat}
                                onChange={(e) => setLat(e.target.value)}
                                className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                placeholder="Latitud"
                            />
                            <input
                                value={lng}
                                onChange={(e) => setLng(e.target.value)}
                                className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                placeholder="Longitud"
                            />
                        </div>
                        <input
                            value={accuracy}
                            onChange={(e) => setAccuracy(e.target.value)}
                            className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            placeholder="Precisión (opcional)"
                        />
                        <input
                            value={trackingNotes}
                            onChange={(e) => setTrackingNotes(e.target.value)}
                            className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            placeholder="Notas (opcional)"
                        />
                        <button className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition">
                            <PaperAirplaneIcon className="h-4 w-4" />
                            Registrar tracking
                        </button>
                    </form>

                    <div className="space-y-2">
                        {(audit.tracking ?? []).map((t) => (
                            <div key={t._id} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm">
                                <p className="font-medium text-gray-900">{t.eventType || "gps_ping"}</p>
                                <p className="mt-1 inline-flex items-center gap-1 text-gray-600">
                                    <MapPinIcon className="h-4 w-4" />
                                    {t.location?.lat}, {t.location?.lng}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {t.createdAt ? new Date(t.createdAt).toLocaleString() : "-"}
                                </p>
                            </div>
                        ))}
                    </div>
                    </section>

                    <section className="rounded-[1.5rem] border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Documentos cargados</h2>
                    <div className="space-y-2">
                        {(audit.documents ?? []).map((d) => (
                            <div key={d._id ?? d.url} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm">
                                <a
                                    href={d.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-600 hover:underline break-all"
                                >
                                    {d.url}
                                </a>
                                <p className="text-gray-600 mt-1">
                                    Tipo: {d.type || "-"}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {d.uploadedAt
                                        ? new Date(d.uploadedAt).toLocaleString()
                                        : "-"}
                                </p>
                            </div>
                        ))}
                        {(audit.documents ?? []).length === 0 && (
                            <p className="text-sm text-gray-500">Sin documentos cargados.</p>
                        )}
                    </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default MedicalAuditDetail;
