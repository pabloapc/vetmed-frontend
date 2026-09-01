import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import adminService from "../../services/adminService";
import type { AuditStatus, MedicalAudit } from "../../types/medicalAudit";
import {
    ArrowLeftIcon,
    ChartBarIcon,
    DocumentTextIcon,
    MapPinIcon,
    PhoneIcon,
    ShieldCheckIcon,
} from "@heroicons/react/24/outline";

const STATUS_OPTIONS: AuditStatus[] = [
    "pending",
    "in_review",
    "validated",
    "rejected",
    "requires_more",
];

const statusLabel: Record<AuditStatus, string> = {
    pending: "Pendiente",
    in_review: "En revisión",
    validated: "Validada",
    rejected: "Rechazada",
    requires_more: "Requiere info",
};

const statusClass: Record<AuditStatus, string> = {
    pending: "bg-amber-100 text-amber-700",
    in_review: "bg-blue-100 text-blue-700",
    validated: "bg-emerald-100 text-emerald-700",
    rejected: "bg-red-100 text-red-700",
    requires_more: "bg-orange-100 text-orange-700",
};

export const AdminAuditDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [audit, setAudit] = useState<MedicalAudit | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const normalizeAudit = (a: any): MedicalAudit => ({
        ...a,
        caseStatus: a?.caseStatus ?? a?.status ?? "active",
        validation: a?.validation ?? a?.auditValidation,
    });

    const load = async () => {
        if (!id) return;
        setLoading(true);
        setError("");
        try {
            const res: any = await adminService.getAuditById(id);
            const payload = res?.data ?? res;
            const raw = payload?.audit ?? payload;
            setAudit(normalizeAudit(raw));
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

    const handleValidate = async (nextStatus: AuditStatus) => {
        if (!audit?._id) return;
        const notes = window.prompt("Notas (opcional)", "") || undefined;
        setSaving(true);
        try {
            await adminService.validateAudit(audit._id, {
                status: nextStatus,
                notes,
            });
            await load();
        } catch (err: any) {
            alert(
                err?.response?.data?.message ||
                    err?.message ||
                    "No se pudo actualizar la auditoría."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleClose = async () => {
        if (!audit?._id) return;
        const reason = window.prompt("Motivo de cierre (opcional)", "") || undefined;
        setSaving(true);
        try {
            await adminService.closeAudit(audit._id, { reason });
            await load();
        } catch (err: any) {
            alert(
                err?.response?.data?.message ||
                    err?.message ||
                    "No se pudo cerrar el caso."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleContact = async () => {
        if (!audit?._id) return;
        const channel =
            window.prompt("Canal (ej: phone, whatsapp, email)", "phone") ||
            "phone";
        const notes = window.prompt("Notas de contacto", "") || undefined;

        setSaving(true);
        try {
            await adminService.registerAuditContact(audit._id, {
                channel,
                notes,
            });
            await load();
        } catch (err: any) {
            alert(
                err?.response?.data?.message ||
                    err?.message ||
                    "No se pudo registrar el contacto."
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="container mx-auto p-6 text-sm text-gray-600">Cargando ficha...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="container mx-auto p-6">
                    <p className="text-red-600">{error}</p>
                    <Link to="/admin/audits" className="text-sm text-blue-600 hover:underline">
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

    const currentStatus = audit.auditStatus;
    const formatActor = (value: any) => {
        if (!value) return "-";
        if (typeof value === "string") return value;
        if (typeof value === "object") {
            return value.name || value.email || value._id || JSON.stringify(value);
        }
        return String(value);
    };
    const employeeName =
        typeof audit.employee === "object" && audit.employee !== null
            ? audit.employee.name || audit.employee.email || audit.employee._id
            : String(audit.employee ?? "-");

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 space-y-6 pb-28">
                <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 p-6 sm:p-8 text-white shadow-xl">
                    <div className="absolute -top-16 -right-12 h-56 w-56 rounded-full bg-white/10" />
                    <div className="absolute -bottom-24 -left-10 h-48 w-48 rounded-full bg-white/10" />

                    <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold sm:text-4xl">Ficha de auditoría</h1>
                            <p className="mt-2 text-sm text-slate-300">ID: {audit._id}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClass[currentStatus as AuditStatus] || "bg-white/20 text-white"}`}>
                                    {statusLabel[currentStatus as AuditStatus] || currentStatus}
                                </span>
                                <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-medium">
                                    Caso: {audit.caseStatus}
                                </span>
                            </div>
                        </div>

                        <Link
                            to="/admin/audits"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm font-medium text-white hover:bg-white/20 transition"
                        >
                            <ArrowLeftIcon className="h-4 w-4" />
                            Volver
                        </Link>
                    </div>
                </section>

                <section className="rounded-[1.5rem] border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-3">Acciones administrativas</h2>
                    <div className="flex flex-wrap gap-2">
                        {STATUS_OPTIONS.map((st) => {
                            const isCurrent = currentStatus === st;
                            return (
                                <button
                                    key={st}
                                    onClick={() => handleValidate(st)}
                                    disabled={isCurrent || saving}
                                    className={`rounded-xl px-3 py-2 text-xs font-semibold text-white ${
                                        st === "validated"
                                            ? "bg-emerald-600 hover:bg-emerald-700"
                                            : st === "rejected"
                                            ? "bg-red-600 hover:bg-red-700"
                                            : st === "requires_more"
                                            ? "bg-amber-600 hover:bg-amber-700"
                                            : st === "in_review"
                                            ? "bg-blue-600 hover:bg-blue-700"
                                            : "bg-gray-600 hover:bg-gray-700"
                                    } ${(isCurrent || saving) ? "opacity-50 cursor-not-allowed" : ""}`}
                                >
                                    {statusLabel[st]}
                                </button>
                            );
                        })}

                        <button
                            onClick={handleContact}
                            disabled={saving}
                            className={`inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 ${saving ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                            <PhoneIcon className="h-3.5 w-3.5" />
                            Registrar contacto
                        </button>

                        <button
                            onClick={handleClose}
                            disabled={audit.caseStatus === "closed" || saving}
                            className={`rounded-xl bg-gray-700 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-800 ${(audit.caseStatus === "closed" || saving) ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                            Cerrar caso
                        </button>
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <h3 className="text-base font-bold text-gray-900 mb-2">Resumen</h3>
                        <div className="text-sm space-y-1 text-gray-700">
                            <p><span className="font-medium">Empleado:</span> {employeeName}</p>
                            <p><span className="font-medium">Estado auditoría:</span> {statusLabel[currentStatus as AuditStatus] || currentStatus}</p>
                            <p><span className="font-medium">Estado caso:</span> {audit.caseStatus}</p>
                            <p><span className="font-medium">Creado:</span> {audit.createdAt ? new Date(audit.createdAt).toLocaleString() : "-"}</p>
                            <p><span className="font-medium">Actualizado:</span> {audit.updatedAt ? new Date(audit.updatedAt).toLocaleString() : "-"}</p>
                        </div>
                    </section>

                    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <h3 className="text-base font-bold text-gray-900 mb-2">Diagnóstico</h3>
                        <div className="text-sm space-y-1 text-gray-700">
                            <p><span className="font-medium">Descripción:</span> {audit.diagnosis?.description || audit.diagnosis?.summary || "-"}</p>
                            <p><span className="font-medium">Reposo:</span> {audit.diagnosis?.restDays ?? "-"} días</p>
                            <p><span className="font-medium">Inicio:</span> {audit.diagnosis?.startDate ? new Date(audit.diagnosis.startDate).toLocaleDateString() : "-"}</p>
                            <p><span className="font-medium">Fin:</span> {audit.diagnosis?.endDate ? new Date(audit.diagnosis.endDate).toLocaleDateString() : "-"}</p>
                        </div>
                    </section>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <h3 className="mb-2 inline-flex items-center gap-1.5 text-base font-bold text-gray-900">
                            <ChartBarIcon className="h-4 w-4" />
                            Validación
                        </h3>
                        <div className="text-sm space-y-1 text-gray-700">
                            <p><span className="font-medium">Score:</span> {audit.validation?.score ?? "-"}</p>
                            <p><span className="font-medium">Notas:</span> {audit.validation?.notes || "-"}</p>
                            <p><span className="font-medium">Rejection reason:</span> {audit.validation?.rejectionReason || "-"}</p>
                            <p><span className="font-medium">Validated at:</span> {audit.validation?.validatedAt ? new Date(audit.validation.validatedAt).toLocaleString() : "-"}</p>
                            <p><span className="font-medium">Validated by:</span> {formatActor(audit.validation?.validatedBy)}</p>
                            <p><span className="font-medium">Flags:</span> {(audit.validation?.flags ?? []).join(", ") || "Sin flags"}</p>
                        </div>
                    </section>

                    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <h3 className="mb-2 inline-flex items-center gap-1.5 text-base font-bold text-gray-900">
                            <DocumentTextIcon className="h-4 w-4" />
                            Documentos
                        </h3>
                        <div className="space-y-2">
                            {(audit.documents ?? []).map((d) => (
                                <div key={d._id ?? d.url} className="rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-sm">
                                    <p className="font-medium">{d.type || "document"}</p>
                                    <p className="text-xs break-all text-gray-600">{d.url}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {d.uploadedAt ? new Date(d.uploadedAt).toLocaleString() : "-"}
                                    </p>
                                </div>
                            ))}
                            {(audit.documents ?? []).length === 0 && (
                                <p className="text-sm text-gray-500">Sin documentos.</p>
                            )}
                        </div>
                    </section>

                    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <h3 className="mb-2 inline-flex items-center gap-1.5 text-base font-bold text-gray-900">
                            <MapPinIcon className="h-4 w-4" />
                            Tracking y contacto
                        </h3>
                        <div className="mb-3">
                            <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Tracking</p>
                            {(audit.tracking ?? []).length === 0 ? (
                                <p className="text-sm text-gray-500">Sin eventos de tracking.</p>
                            ) : (
                                <div className="space-y-2">
                                    {(audit.tracking ?? []).map((t) => (
                                        <div key={t._id} className="rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-sm">
                                            <p className="font-medium">{t.eventType || "gps_ping"}</p>
                                            <p className="text-xs text-gray-600">
                                                {t.location?.lat}, {t.location?.lng}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {t.createdAt ? new Date(t.createdAt).toLocaleString() : "-"}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Contact log</p>
                            {(audit.contactLog ?? []).length === 0 ? (
                                <p className="text-sm text-gray-500">Sin contactos registrados.</p>
                            ) : (
                                <div className="space-y-2">
                                    {(audit.contactLog ?? []).map((c) => (
                                        <div key={c._id} className="rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-sm">
                                            <p className="text-gray-700">{c.notes || "-"}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Por: {formatActor(c.contactedBy || c.by)}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {c.contactedAt || c.createdAt
                                                    ? new Date((c.contactedAt || c.createdAt) as string).toLocaleString()
                                                    : "-"}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <h3 className="mb-2 inline-flex items-center gap-1.5 text-base font-bold text-gray-900">
                        <ShieldCheckIcon className="h-4 w-4" />
                        Objeto completo
                    </h3>
                    <pre className="overflow-auto rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs">
                        {JSON.stringify(audit, null, 2)}
                    </pre>
                </section>
            </div>
        </div>
    );
};

export default AdminAuditDetail;
