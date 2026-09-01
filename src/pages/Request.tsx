import React, { useEffect, useMemo, useState } from "react";
import { requestService } from "../services/requestService";
import {
    ClockIcon,
    CheckCircleIcon,
    CheckIcon,
    XCircleIcon,
    LinkIcon,
    PhoneIcon,
    UserCircleIcon,
    BuildingStorefrontIcon,
    BoltIcon,
    ListBulletIcon,
    KeyIcon,
    ArrowPathIcon,
    ExclamationCircleIcon,
    ClipboardDocumentIcon,
} from "@heroicons/react/24/outline";

/* ─── helpers ─────────────────────────────────────────────────────────────── */

const statusConfig: Record<
    string,
    {
        label: string;
        pillBg: string;
        pillText: string;
        stripe: string;
        iconBg: string;
        icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    }
> = {
    pending: {
        label: "Pendiente",
        pillBg: "bg-amber-100",
        pillText: "text-amber-700",
        stripe: "bg-amber-400",
        iconBg: "bg-amber-50",
        icon: ClockIcon,
    },
    accepted: {
        label: "Aceptada",
        pillBg: "bg-emerald-100",
        pillText: "text-emerald-700",
        stripe: "bg-emerald-500",
        iconBg: "bg-emerald-50",
        icon: CheckCircleIcon,
    },
    fulfilled: {
        label: "Cumplida",
        pillBg: "bg-blue-100",
        pillText: "text-blue-700",
        stripe: "bg-blue-500",
        iconBg: "bg-blue-50",
        icon: CheckIcon,
    },
    cancelled: {
        label: "Cancelada",
        pillBg: "bg-red-100",
        pillText: "text-red-700",
        stripe: "bg-red-400",
        iconBg: "bg-red-50",
        icon: XCircleIcon,
    },
};

const targetMeta = {
    doctor: { label: "Doctor", Icon: UserCircleIcon, color: "text-sky-600", bg: "bg-sky-50" },
    pharmacy: { label: "Farmacia", Icon: BuildingStorefrontIcon, color: "text-amber-600", bg: "bg-amber-50" },
    emergency: { label: "Emergencia", Icon: BoltIcon, color: "text-red-600", bg: "bg-red-50" },
};

const labelForTargetType = (t?: string) =>
    t && t in targetMeta ? targetMeta[t as keyof typeof targetMeta].label : "Destino";

const actionTypeLabel = (actionType?: string) => {
    if (!actionType) return "";
    const at = String(actionType).toLowerCase();
    if (at === "consulta_medica") return "Consulta médica";
    if (at === "video_llamada" || at === "video-llamada") return "Video llamada";
    if (at === "visita_medica" || at === "visita médica") return "Visita médica";
    if (at === "emergency") return "Urgencia";
    return at.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

type FilterType = "all" | "doctor" | "pharmacy" | "emergency";

const TABS: { key: FilterType; label: string; Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; activeClass: string }[] = [
    { key: "all",       label: "Todas",      Icon: ListBulletIcon,          activeClass: "bg-gray-900 text-white" },
    { key: "doctor",    label: "Doctores",   Icon: UserCircleIcon,          activeClass: "bg-sky-600 text-white" },
    { key: "pharmacy",  label: "Farmacias",  Icon: BuildingStorefrontIcon,  activeClass: "bg-amber-500 text-white" },
    { key: "emergency", label: "Urgencias",  Icon: BoltIcon,                activeClass: "bg-red-600 text-white" },
];

/* ─── component ───────────────────────────────────────────────────────────── */

export const Requests: React.FC = () => {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filter, setFilter] = useState<FilterType>("all");
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await requestService.getUserRequests();
            const list = res?.data?.requests ?? res?.requests ?? res?.data ?? [];
            setRequests(list);
        } catch (err: any) {
            setError(err?.response?.data?.message || err.message || "Error al cargar solicitudes");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const counts = useMemo(() => {
        const c = { all: 0, doctor: 0, pharmacy: 0, emergency: 0 } as Record<string, number>;
        requests.forEach((r) => {
            c.all += 1;
            const t = r.targetType ?? (r.pharmacy ? "pharmacy" : r.doctor ? "doctor" : undefined);
            if (t === "doctor") c.doctor += 1;
            else if (t === "pharmacy") c.pharmacy += 1;
            else if (t === "emergency") c.emergency += 1;
        });
        return c;
    }, [requests]);

    const filteredRequests = useMemo(() => {
        if (filter === "all") return requests;
        return requests.filter((r) => {
            const t = r.targetType ?? (r.pharmacy ? "pharmacy" : r.doctor ? "doctor" : undefined);
            return t === filter;
        });
    }, [requests, filter]);

    const handleConfirm = async (r: any) => {
        if (!confirm("Confirmás que la llamada/consulta se completó correctamente?")) return;
        try {
            const res = await requestService.confirmRequest(r._id);
            if (res?.success) {
                await load();
                alert("Confirmación registrada. Gracias.");
            } else {
                alert(res?.message || "No se pudo confirmar la solicitud.");
            }
        } catch (err: any) {
            alert(err?.response?.data?.message || err.message || "Error al confirmar la solicitud.");
        }
    };

    const copyToken = (token: string, id: string) => {
        navigator.clipboard.writeText(token).then(() => {
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        });
    };

    /* ── Loading ── */
    if (loading)
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-gray-500">
                <svg className="animate-spin w-8 h-8 text-blue-500" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span className="text-sm font-medium">Cargando solicitudes...</span>
            </div>
        );

    /* ── Error ── */
    if (error)
        return (
            <div className="max-w-xl mx-auto mt-16 px-6">
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
                    <ExclamationCircleIcon className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold">Error al cargar</p>
                        <p className="mt-0.5 text-red-600">{error}</p>
                        <button onClick={load} className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-red-700 hover:underline">
                            <ArrowPathIcon className="w-3.5 h-3.5" /> Reintentar
                        </button>
                    </div>
                </div>
            </div>
        );

    /* ── Main ── */
    return (
        <div className="max-w-4xl mx-auto px-4 py-10">

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Mis solicitudes</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Seguí el estado de tus consultas y derivaciones</p>
                </div>
                <button
                    onClick={load}
                    className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition"
                    title="Actualizar"
                >
                    <ArrowPathIcon className="w-4 h-4" />
                    Actualizar
                </button>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                {TABS.map(({ key, label, Icon }) => (
                    <div key={key} className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                            <Icon className="w-5 h-5 text-gray-500" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">{label}</p>
                            <p className="text-lg font-bold text-gray-900 leading-tight">{counts[key]}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
                {TABS.map(({ key, label, Icon, activeClass }) => (
                    <button
                        key={key}
                        onClick={() => setFilter(key)}
                        aria-pressed={filter === key}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition ${
                            filter === key
                                ? activeClass
                                : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                    >
                        <Icon className="w-3.5 h-3.5" />
                        {label}
                        <span className={`ml-0.5 text-xs ${filter === key ? "opacity-80" : "text-gray-400"}`}>
                            {counts[key]}
                        </span>
                    </button>
                ))}
            </div>

            {/* Empty state */}
            {filteredRequests.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                    <div className="mx-auto w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <ListBulletIcon className="w-7 h-7 text-gray-300" />
                    </div>
                    <p className="text-gray-500 text-sm">No tenés solicitudes para esta vista.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredRequests.map((r) => {
                        const target = r.target ?? r.pharmacy ?? r.doctor ?? null;
                        const targetType: string | undefined =
                            r.targetType ?? (r.pharmacy ? "pharmacy" : r.doctor ? "doctor" : undefined);
                        const tMeta = targetType && targetType in targetMeta
                            ? targetMeta[targetType as keyof typeof targetMeta]
                            : null;
                        const cfg = statusConfig[r.status] ?? {
                            label: r.status ?? "Desconocido",
                            pillBg: "bg-gray-100",
                            pillText: "text-gray-600",
                            stripe: "bg-gray-300",
                            iconBg: "bg-gray-50",
                            icon: ClockIcon,
                        };
                        const StatusIcon = cfg.icon;
                        const scheduled = r.metadata?.scheduledAt ? new Date(r.metadata.scheduledAt) : null;
                        const isFinalized = r.status === "fulfilled" && r.status_reply;
                        const isEmergency = targetType === "emergency";

                        return (
                            <div
                                key={r._id}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                            >
                                {/* Status stripe */}
                                <div className={`h-1 w-full ${cfg.stripe}`} />

                                <div className="p-5">
                                    {/* Top row */}
                                    <div className="flex items-start justify-between gap-4">
                                        {/* Left: icon + name */}
                                        <div className="flex items-start gap-3 min-w-0">
                                            <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${tMeta?.bg ?? "bg-gray-50"}`}>
                                                {tMeta
                                                    ? <tMeta.Icon className={`w-5 h-5 ${tMeta.color}`} />
                                                    : <ListBulletIcon className="w-5 h-5 text-gray-400" />
                                                }
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-gray-900 truncate">
                                                    {target?.name ?? labelForTargetType(targetType)}
                                                </p>
                                                {(target?.address || target?.direccion) && (
                                                    <p className="text-xs text-gray-400 truncate mt-0.5">
                                                        {target.address ?? target.direccion}
                                                    </p>
                                                )}
                                                <div className="mt-1.5 flex flex-wrap gap-1.5">
                                                    {tMeta && (
                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${tMeta.bg} ${tMeta.color}`}>
                                                            <tMeta.Icon className="w-3 h-3" />
                                                            {tMeta.label}
                                                        </span>
                                                    )}
                                                    {r.actionType && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                                            {actionTypeLabel(r.actionType)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: status + date */}
                                        <div className="shrink-0 text-right">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.pillBg} ${cfg.pillText}`}>
                                                <StatusIcon className="w-3.5 h-3.5" />
                                                {cfg.label}
                                            </span>
                                            <p className="text-xs text-gray-400 mt-1.5">
                                                {new Date(r.createdAt).toLocaleDateString("es-AR", {
                                                    day: "numeric", month: "short", year: "numeric",
                                                })}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Token */}
                                    {r.token && (
                                        <div className="mt-4 flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                                            <KeyIcon className="w-4 h-4 text-gray-400 shrink-0" />
                                            <code className="flex-1 text-xs font-mono text-gray-700 truncate">
                                                {r.token}
                                            </code>
                                            <button
                                                onClick={() => copyToken(r.token, r._id)}
                                                className="shrink-0 text-gray-400 hover:text-gray-700 transition"
                                                title="Copiar código"
                                            >
                                                {copiedId === r._id
                                                    ? <CheckIcon className="w-4 h-4 text-emerald-500" />
                                                    : <ClipboardDocumentIcon className="w-4 h-4" />
                                                }
                                            </button>
                                            {r.expiresAt && (
                                                <span className="text-xs text-gray-400 shrink-0 hidden sm:inline">
                                                    exp. {new Date(r.expiresAt).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* Scheduled */}
                                    {scheduled && (
                                        <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg">
                                            <ClockIcon className="w-3.5 h-3.5" />
                                            Programada: {scheduled.toLocaleString("es-AR")}
                                        </div>
                                    )}

                                    {/* Notes */}
                                    {r.notes && (
                                        <div className="mt-3 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                                            <span className="font-semibold text-gray-400 uppercase tracking-wide text-[10px]">Observaciones</span>
                                            <p className="mt-1 text-gray-700 text-sm leading-relaxed">{r.notes}</p>
                                        </div>
                                    )}

                                    {/* Confirmed by patient banner */}
                                    {r.status === "fulfilled" && r.status_reply && (
                                        <div className="mt-4 flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 text-sm text-emerald-700">
                                            <CheckCircleIcon className="w-4 h-4 shrink-0" />
                                            <span>
                                                Confirmada por{" "}
                                                <strong>
                                                    {r.status_reply_by?.name
                                                        ? r.status_reply_by.name
                                                        : typeof r.status_reply_by === "string"
                                                        ? r.status_reply_by
                                                        : "Paciente"}
                                                </strong>
                                                {r.status_reply_at
                                                    ? ` • ${new Date(r.status_reply_at).toLocaleString("es-AR")}`
                                                    : ""}
                                            </span>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    {!isFinalized && (
                                        <div className="mt-4 flex flex-wrap items-center gap-2">
                                            {(target?.phone || r.userSnapshot?.telefono) && (
                                                <a
                                                    href={`tel:${target?.phone ?? r.userSnapshot?.telefono}`}
                                                    className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition ${
                                                        isEmergency
                                                            ? "bg-red-600 text-white hover:bg-red-700"
                                                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                                    }`}
                                                >
                                                    <PhoneIcon className="w-4 h-4" />
                                                    Llamar
                                                </a>
                                            )}

                                            {r.metadata?.callUrl && (
                                                <a
                                                    href={r.metadata.callUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition"
                                                >
                                                    <LinkIcon className="w-4 h-4" />
                                                    Entrar a la llamada
                                                </a>
                                            )}

                                            {r.status === "fulfilled" && !r.status_reply && (
                                                <button
                                                    onClick={() => handleConfirm(r)}
                                                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 transition"
                                                >
                                                    <CheckIcon className="w-4 h-4" />
                                                    Confirmar consulta
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Requests;
