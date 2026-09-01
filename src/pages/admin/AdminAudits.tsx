import React, { useEffect, useState } from "react";
import adminService from "../../services/adminService";
import type { AuditStatus, MedicalAudit } from "../../types/medicalAudit";
import { Link } from "react-router-dom";
import {
    ArrowPathIcon,
    ExclamationTriangleIcon,
    FunnelIcon,
    MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

const STATUS_OPTIONS: AuditStatus[] = [
    "pending",
    "in_review",
    "validated",
    "rejected",
    "requires_more",
];

const statusLabels: Record<AuditStatus, string> = {
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

export const AdminAudits: React.FC = () => {
    const [audits, setAudits] = useState<MedicalAudit[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [total, setTotal] = useState(0);

    const [q, setQ] = useState("");
    const [status, setStatus] = useState("");
    const [caseStatus, setCaseStatus] = useState("");

    const pendingReviewCount = audits.filter(
        (a) => a.auditStatus === "pending" || a.auditStatus === "in_review"
    ).length;
    const requiresMoreCount = audits.filter(
        (a) => a.auditStatus === "requires_more"
    ).length;
    const validatedCount = audits.filter(
        (a) => a.auditStatus === "validated"
    ).length;
    const rejectedCount = audits.filter(
        (a) => a.auditStatus === "rejected"
    ).length;
    const closedCasesCount = audits.filter((a) => a.caseStatus === "closed").length;

    const scoredAudits = audits.filter(
        (a) => typeof a.validation?.score === "number"
    );
    const averageScore =
        scoredAudits.length > 0
            ? (
                  scoredAudits.reduce(
                      (acc, a) => acc + Number(a.validation?.score ?? 0),
                      0
                  ) / scoredAudits.length
              ).toFixed(1)
            : "-";

    const load = async () => {
        setLoading(true);
        try {
            const res: any = await adminService.listAudits({
                page,
                limit,
                q: q || undefined,
                status: status || undefined,
                caseStatus: caseStatus || undefined,
            });

            const payload = res?.data ?? res;
            const rawItems = Array.isArray(payload)
                ? payload
                : payload?.audits ?? payload?.items ?? payload?.data ?? [];

            const normalized: MedicalAudit[] = (rawItems ?? []).map((a: any) => ({
                ...a,
                caseStatus: a?.caseStatus ?? a?.status ?? "active",
                validation: a?.validation ?? a?.auditValidation,
            }));

            setAudits(normalized);
            setTotal(
                payload?.pagination?.total ??
                    payload?.meta?.total ??
                    payload?.total ??
                    normalized.length ??
                    0
            );
        } catch (err) {
            console.error("list audits error", err);
            setAudits([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [page]);

    const onSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        await load();
    };

    const handleValidate = async (id: string, nextStatus: AuditStatus) => {
        const notes = window.prompt("Notas (opcional)", "") || undefined;
        try {
            await adminService.validateAudit(id, {
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
        }
    };

    const handleClose = async (id: string) => {
        const reason = window.prompt("Motivo de cierre (opcional)", "") || undefined;
        try {
            await adminService.closeAudit(id, { reason });
            await load();
        } catch (err: any) {
            alert(
                err?.response?.data?.message ||
                    err?.message ||
                    "No se pudo cerrar el caso."
            );
        }
    };

    const handleContact = async (id: string) => {
        const channel = window.prompt("Canal (ej: phone, whatsapp, email)", "phone") || "phone";
        const notes = window.prompt("Notas de contacto", "") || undefined;

        try {
            await adminService.registerAuditContact(id, { channel, notes });
            await load();
        } catch (err: any) {
            alert(
                err?.response?.data?.message ||
                    err?.message ||
                    "No se pudo registrar el contacto."
            );
        }
    };

    const formatEmployee = (employee: unknown): string => {
        if (typeof employee === "object" && employee !== null) {
            const e = employee as { name?: string; email?: string; _id?: string };
            return e.name || e.email || e._id || "-";
        }
        return String(employee ?? "-");
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 space-y-6 pb-28">
                <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 p-6 sm:p-8 text-white shadow-xl">
                    <div className="absolute -top-16 -right-12 h-56 w-56 rounded-full bg-white/10" />
                    <div className="absolute -bottom-24 -left-10 h-48 w-48 rounded-full bg-white/10" />

                    <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-300">
                                Backoffice
                            </p>
                            <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">
                                Auditorías médicas
                            </h1>
                            <p className="mt-2 max-w-xl text-sm text-slate-300 sm:text-base">
                                Gestioná validaciones, seguimientos y cierres de caso desde un panel único.
                            </p>
                        </div>

                        <button
                            onClick={load}
                            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm font-medium text-white hover:bg-white/20 transition"
                        >
                            <ArrowPathIcon className="h-4 w-4" />
                            Actualizar
                        </button>
                    </div>
                </section>

                <section className="rounded-[1.5rem] border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-800">
                        <FunnelIcon className="h-4 w-4" />
                        Filtros
                    </div>
                    <form onSubmit={onSearch} className="grid grid-cols-1 md:grid-cols-4 gap-2">
                        <div className="relative md:col-span-2">
                            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <input
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="Buscar por empleado o diagnóstico"
                                className="w-full rounded-xl border border-gray-300 py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>

                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                            <option value="">Estado auditoría</option>
                            {STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>
                                    {statusLabels[s]}
                                </option>
                            ))}
                        </select>

                        <select
                            value={caseStatus}
                            onChange={(e) => setCaseStatus(e.target.value)}
                            className="rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                            <option value="">Estado caso</option>
                            <option value="active">Activo</option>
                            <option value="closed">Cerrado</option>
                            <option value="appealed">Apelado</option>
                            <option value="cancelled">Cancelado</option>
                        </select>

                        <button className="md:col-span-4 md:justify-self-end inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition">
                            <MagnifyingGlassIcon className="h-4 w-4" />
                            Buscar
                        </button>
                    </form>
                </section>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-3.5">
                        <div className="text-xs text-slate-500">Total visible</div>
                        <div className="mt-1 text-2xl font-semibold text-slate-900">{audits.length}</div>
                        <div className="mt-1 text-xs text-slate-500">De {total} filtrados</div>
                    </div>

                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5">
                        <div className="text-xs text-amber-700">En gestión</div>
                        <div className="mt-1 text-2xl font-semibold text-amber-900">{pendingReviewCount}</div>
                        <div className="mt-1 text-xs text-amber-700">Pendiente + revisión</div>
                    </div>

                    <div className="rounded-2xl border border-orange-200 bg-orange-50 p-3.5">
                        <div className="text-xs text-orange-700">Requieren info</div>
                        <div className="mt-1 text-2xl font-semibold text-orange-900">{requiresMoreCount}</div>
                        <div className="mt-1 text-xs text-orange-700">Seguimiento pendiente</div>
                    </div>

                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5">
                        <div className="text-xs text-emerald-700">Validadas</div>
                        <div className="mt-1 text-2xl font-semibold text-emerald-900">{validatedCount}</div>
                        <div className="mt-1 text-xs text-emerald-700">Casos aprobados</div>
                    </div>

                    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3.5">
                        <div className="text-xs text-rose-700">Rechazadas</div>
                        <div className="mt-1 text-2xl font-semibold text-rose-900">{rejectedCount}</div>
                        <div className="mt-1 text-xs text-rose-700">Con observaciones</div>
                    </div>

                    <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-3.5">
                        <div className="text-xs text-indigo-700">Cerradas | Score</div>
                        <div className="mt-1 text-2xl font-semibold text-indigo-900">
                            {closedCasesCount} <span className="text-lg">|</span> {averageScore}
                        </div>
                        <div className="mt-1 text-xs text-indigo-700">Cierre + promedio</div>
                    </div>
                </div>

                {loading ? (
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-600">
                        Cargando auditorías...
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                        <div className="overflow-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-50 text-gray-600">
                                    <tr>
                                        <th className="p-3 text-left font-semibold">Empleado</th>
                                        <th className="p-3 text-left font-semibold">Diagnóstico</th>
                                        <th className="p-3 text-left font-semibold">Estado</th>
                                        <th className="p-3 text-left font-semibold">Caso</th>
                                        <th className="p-3 text-left font-semibold">Score</th>
                                        <th className="p-3 text-left font-semibold">Fecha</th>
                                        <th className="p-3 text-left font-semibold">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {audits.map((a) => {
                                        const currentStatus = (a.auditStatus || "pending") as AuditStatus;
                                        return (
                                            <tr key={a._id} className="border-t border-gray-100 align-top">
                                                <td className="p-3 text-gray-900">{formatEmployee(a.employee)}</td>
                                                <td className="p-3 max-w-[320px] text-gray-700">
                                                    {a.diagnosis?.description || a.diagnosis?.summary || "-"}
                                                </td>
                                                <td className="p-3">
                                                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClass[currentStatus]}`}>
                                                        {statusLabels[currentStatus]}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-gray-700">{a.caseStatus}</td>
                                                <td className="p-3 text-gray-700">{a.validation?.score ?? "-"}</td>
                                                <td className="p-3 text-xs text-gray-500">
                                                    {a.createdAt
                                                        ? new Date(a.createdAt).toLocaleString()
                                                        : "-"}
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex flex-wrap gap-1.5">
                                                        <button
                                                            onClick={() => handleValidate(a._id, "validated")}
                                                            disabled={a.auditStatus === "validated"}
                                                            className={`rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white ${
                                                                a.auditStatus === "validated"
                                                                    ? "cursor-not-allowed opacity-50"
                                                                    : "hover:bg-emerald-700"
                                                            }`}
                                                        >
                                                            Validar
                                                        </button>
                                                        <button
                                                            onClick={() => handleValidate(a._id, "rejected")}
                                                            disabled={a.auditStatus === "rejected"}
                                                            className={`rounded-lg bg-red-600 px-2.5 py-1 text-xs font-medium text-white ${
                                                                a.auditStatus === "rejected"
                                                                    ? "cursor-not-allowed opacity-50"
                                                                    : "hover:bg-red-700"
                                                            }`}
                                                        >
                                                            Rechazar
                                                        </button>
                                                        <button
                                                            onClick={() => handleValidate(a._id, "requires_more")}
                                                            disabled={a.auditStatus === "requires_more"}
                                                            className={`rounded-lg bg-amber-600 px-2.5 py-1 text-xs font-medium text-white ${
                                                                a.auditStatus === "requires_more"
                                                                    ? "cursor-not-allowed opacity-50"
                                                                    : "hover:bg-amber-700"
                                                            }`}
                                                        >
                                                            Pedir info
                                                        </button>
                                                        <button
                                                            onClick={() => handleContact(a._id)}
                                                            className="rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-indigo-700"
                                                        >
                                                            Contacto
                                                        </button>
                                                        <button
                                                            onClick={() => handleClose(a._id)}
                                                            disabled={a.caseStatus === "closed"}
                                                            className={`rounded-lg bg-gray-700 px-2.5 py-1 text-xs font-medium text-white ${
                                                                a.caseStatus === "closed"
                                                                    ? "cursor-not-allowed opacity-50"
                                                                    : "hover:bg-gray-800"
                                                            }`}
                                                        >
                                                            Cerrar
                                                        </button>
                                                        <Link
                                                            to={`/admin/audits/${a._id}`}
                                                            className="rounded-lg bg-slate-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-700"
                                                        >
                                                            Abrir
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {audits.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="p-10 text-center text-gray-500">
                                                <div className="inline-flex flex-col items-center gap-2">
                                                    <ExclamationTriangleIcon className="h-6 w-6 text-gray-300" />
                                                    No hay auditorías para los filtros aplicados.
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">Total: {total}</div>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={page <= 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className="rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Anterior
                        </button>
                        <div className="rounded-xl bg-white px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-200">
                            {page}
                        </div>
                        <button
                            disabled={page * limit >= total}
                            onClick={() => setPage((p) => p + 1)}
                            className="rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminAudits;
