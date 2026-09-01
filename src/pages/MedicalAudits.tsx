import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import medicalAuditService from "../services/medicalAuditService";
import type { AuditStatus, MedicalAudit } from "../types/medicalAudit";
import {
    ArrowPathIcon,
    CalendarDaysIcon,
    ClipboardDocumentListIcon,
    ExclamationCircleIcon,
    ShieldCheckIcon,
} from "@heroicons/react/24/outline";

const statusLabel: Record<AuditStatus, string> = {
    pending: "Pendiente",
    in_review: "En revisión",
    validated: "Validada",
    rejected: "Rechazada",
    requires_more: "Requiere más info",
};

const statusClass: Record<AuditStatus, string> = {
    pending: "bg-amber-100 text-amber-700",
    in_review: "bg-blue-100 text-blue-700",
    validated: "bg-emerald-100 text-emerald-700",
    rejected: "bg-red-100 text-red-700",
    requires_more: "bg-orange-100 text-orange-700",
};

export const MedicalAudits: React.FC = () => {
    const [audits, setAudits] = useState<MedicalAudit[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [diagnosisDescription, setDiagnosisDescription] = useState("");
    const [startDate, setStartDate] = useState(
        new Date().toISOString().slice(0, 10)
    );
    const [endDate, setEndDate] = useState(
        new Date().toISOString().slice(0, 10)
    );
    const [restDays, setRestDays] = useState(1);
    const [symptoms, setSymptoms] = useState("");
    const [observations, setObservations] = useState("");
    const [documentsText, setDocumentsText] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const load = async () => {
        setLoading(true);
        setError("");
        try {
            const res: any = await medicalAuditService.getMyAudits({
                page: 1,
                limit: 50,
            });
            const payload = res?.data ?? res;
            const rawItems = Array.isArray(payload)
                ? payload
                : payload?.audits ?? payload?.items ?? [];

            const normalized: MedicalAudit[] = (rawItems ?? []).map((a: any) => ({
                ...a,
                diagnosis: {
                    ...a?.diagnosis,
                },
                // Backend puede devolver `status` en lugar de `caseStatus`
                caseStatus: a?.caseStatus ?? a?.status ?? "active",
                // Backend puede devolver `auditValidation` en lugar de `validation`
                validation: a?.validation ?? a?.auditValidation,
            }));

            setAudits(normalized);
        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                    err?.message ||
                    "No se pudieron cargar tus auditorías."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const submitAudit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!diagnosisDescription.trim()) {
            alert("Ingresá el diagnóstico.");
            return;
        }
        if (!startDate || !endDate) {
            alert("Ingresá fecha de inicio y fin.");
            return;
        }
        if (new Date(endDate) < new Date(startDate)) {
            alert("La fecha de fin no puede ser anterior a la fecha de inicio.");
            return;
        }

        const docs = documentsText
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean)
            .map((url) => ({ url, type: "certificate" }));

        setSubmitting(true);
        try {
            await medicalAuditService.createAudit({
                diagnosis: {
                    description: diagnosisDescription.trim(),
                    summary: diagnosisDescription.trim(),
                    startDate,
                    endDate,
                    restDays,
                    symptoms: symptoms.trim() || undefined,
                    observations: observations.trim() || undefined,
                },
                documents: docs,
                auditStatus: "pending",
                status: "active",
            });

            setDiagnosisDescription("");
            setStartDate(new Date().toISOString().slice(0, 10));
            setEndDate(new Date().toISOString().slice(0, 10));
            setRestDays(1);
            setSymptoms("");
            setObservations("");
            setDocumentsText("");
            await load();
        } catch (err: any) {
            alert(
                err?.response?.data?.message ||
                    err?.message ||
                    "No se pudo crear la auditoría."
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 space-y-6 pb-28">
                <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-cyan-700 via-sky-600 to-blue-700 p-6 sm:p-8 text-white shadow-xl">
                    <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-white/10" />
                    <div className="absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-white/10" />

                    <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="text-xs font-medium uppercase tracking-[0.18em] text-cyan-100">
                                Módulo de salud
                            </p>
                            <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">
                                Auditoría médica
                            </h1>
                            <p className="mt-2 max-w-xl text-sm text-cyan-100 sm:text-base">
                                Cargá certificados, seguí el estado del caso y respondé requerimientos de validación.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 w-full md:w-auto md:min-w-[280px]">
                            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
                                <p className="text-xs text-cyan-100">Mis casos</p>
                                <p className="mt-1 text-2xl font-bold">{audits.length}</p>
                            </div>
                            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
                                <p className="text-xs text-cyan-100">Pendientes</p>
                                <p className="mt-1 text-2xl font-bold">
                                    {audits.filter((a) => (a.auditStatus ?? "pending") === "pending").length}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="flex items-center justify-end">
                    <button
                        onClick={load}
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                    >
                        <ArrowPathIcon className="h-4 w-4" />
                        Actualizar
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <section className="rounded-[1.5rem] border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-1">Crear nueva auditoría</h2>
                        <p className="text-sm text-gray-500 mb-4">
                            Completá los datos clínicos y adjuntá los documentos en formato URL.
                        </p>

                    <form onSubmit={submitAudit} className="space-y-3">
                        <div>
                            <label className="text-sm text-gray-600 block mb-1">
                                Diagnóstico
                            </label>
                            <textarea
                                value={diagnosisDescription}
                                onChange={(e) => setDiagnosisDescription(e.target.value)}
                                rows={3}
                                    className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                placeholder="Ej: Lumbalgia aguda"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm text-gray-600 block mb-1">
                                    Fecha inicio
                                </label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-gray-600 block mb-1">
                                    Fecha fin
                                </label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm text-gray-600 block mb-1">
                                Días de reposo
                            </label>
                            <input
                                type="number"
                                min={1}
                                value={restDays}
                                onChange={(e) => setRestDays(Number(e.target.value))}
                                className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="text-sm text-gray-600 block mb-1">
                                Síntomas (opcional)
                            </label>
                            <input
                                value={symptoms}
                                onChange={(e) => setSymptoms(e.target.value)}
                                className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="text-sm text-gray-600 block mb-1">
                                Observaciones (opcional)
                            </label>
                            <input
                                value={observations}
                                onChange={(e) => setObservations(e.target.value)}
                                className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="text-sm text-gray-600 block mb-1">
                                URLs de documentos (una por línea)
                            </label>
                            <textarea
                                value={documentsText}
                                onChange={(e) => setDocumentsText(e.target.value)}
                                rows={3}
                                className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                placeholder="https://..."
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
                        >
                            <ShieldCheckIcon className="h-4 w-4" />
                            {submitting ? "Guardando..." : "Crear auditoría"}
                        </button>
                    </form>
                </section>

                    <section className="rounded-[1.5rem] border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-1">Mis casos</h2>
                        <p className="text-sm text-gray-500 mb-4">Seguí el estado y abrí el detalle de cada auditoría.</p>

                        {loading && (
                            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                                Cargando auditorías...
                            </div>
                        )}
                        {!loading && error && (
                            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                                <ExclamationCircleIcon className="h-5 w-5 mt-0.5 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}
                        {!loading && !error && audits.length === 0 && (
                            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center">
                                <ClipboardDocumentListIcon className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                                <p className="text-sm font-medium text-gray-700">
                                    Todavía no creaste auditorías.
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                    Completá el formulario para iniciar tu primer caso.
                                </p>
                            </div>
                        )}

                        <div className="space-y-3">
                            {audits.map((audit) => {
                                const status = (audit.auditStatus ||
                                    "pending") as AuditStatus;
                                return (
                                    <Link
                                        key={audit._id}
                                        to={`/audits/${audit._id}`}
                                        className="group block rounded-2xl border border-gray-100 bg-gray-50/80 px-4 py-4 transition hover:bg-white hover:shadow-sm"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900 group-hover:text-cyan-700 transition">
                                                    {audit.diagnosis?.description ||
                                                        audit.diagnosis?.summary ||
                                                        "Sin diagnóstico"}
                                                </p>
                                                <p className="mt-1 inline-flex items-center gap-1 text-xs text-gray-500">
                                                    <CalendarDaysIcon className="h-3.5 w-3.5" />
                                                    {audit.diagnosis?.startDate || "-"} a {audit.diagnosis?.endDate || "-"}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Caso: {audit.caseStatus}
                                                </p>
                                            </div>
                                            <span
                                                className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusClass[status]}`}
                                            >
                                                {statusLabel[status]}
                                            </span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default MedicalAudits;
