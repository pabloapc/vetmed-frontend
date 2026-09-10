import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import adminService from "../../services/adminService";
import {
    UserGroupIcon,
    BuildingStorefrontIcon,
    ChartBarIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    RectangleStackIcon,
    ShieldCheckIcon,
    ClipboardDocumentListIcon,
    DocumentTextIcon,
} from "@heroicons/react/24/outline";

/**
 * AdminDashboard
 * Muestra tarjetas con métricas y una mini-gráfica de movimientos diarios.
 */

const StatCard: React.FC<{
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: React.ComponentType<any>;
    colorBg?: string;
}> = ({ title, value, subtitle, icon: Icon, colorBg }) => {
    return (
        <div className="p-4 bg-white rounded shadow hover:shadow-md">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="text-sm text-gray-500">{title}</div>
                    <div className="mt-1 text-2xl font-semibold text-gray-900">
                        {value}
                    </div>
                    {subtitle && (
                        <div className="text-xs text-gray-400 mt-1">
                            {subtitle}
                        </div>
                    )}
                </div>
                {Icon && (
                    <div
                        className={`p-2 rounded-md ${colorBg ?? "bg-brand-50"}`}
                    >
                        <Icon className="h-7 w-7 text-brand-600" />
                    </div>
                )}
            </div>
        </div>
    );
};

const MiniSparkline: React.FC<{ data: number[]; color?: string }> = ({
    data,
    color = "#2563eb",
}) => {
    if (!data || data.length === 0) return null;
    const w = 160;
    const h = 40;
    const max = Math.max(...data, 1);
    const points = data.map((v, i) => {
        const x = (i / (data.length - 1 || 1)) * (w - 4) + 2;
        const y = h - (v / max) * (h - 4) - 2;
        return `${x},${y}`;
    });
    const poly = points.join(" ");
    return (
        <svg width={w} height={h} className="rounded-md bg-white/30">
            <polyline
                fill="none"
                stroke={color}
                strokeWidth={2}
                points={poly}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

const labelForTargetType = (t?: string) => {
    if (!t) return "Destino";
    if (t === "veterinaria") return "Veterinaria";
    if (t === "emergency") return "Emergencia";
    return t.charAt(0).toUpperCase() + t.slice(1);
};

// friendly label for actionType values
const actionTypeLabel = (actionType?: string, targetType?: string) => {
    if (!actionType) return "";
    const at = String(actionType).toLowerCase();

    if (targetType === "emergency") {
        if (at === "emergency" || at === "urgencia") return "Urgencia";
        if (
            at === "consulta_medica" ||
            at === "visita_medica" ||
            at === "visita médica"
        )
            return "Visita médica";
    }

    if (at === "presencial") return "Asistencia presencial";
    if (at === "video_llamada" || at === "video-llamada")
        return "Videollamada";
    if (at === "consulta_medica") return "Consulta médica";
    if (at === "emergency" || at === "urgencia") return "Urgencia";
    if (at === "visita_medica" || at === "visita médica")
        return "Visita médica";

    return at.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

export const AdminDashboard: React.FC = () => {
    const [metrics, setMetrics] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [recentTargetFilter, setRecentTargetFilter] = useState<
        "all" | "veterinaria" | "emergency"
    >("all");

    const load = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await adminService.getDashboardMetrics({ days: 7 });
            setMetrics(res?.data ?? res);
        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                    err.message ||
                    "Error cargando métricas"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line
    }, []);

    const dailyTotals = (metrics?.dailySeries ?? []).map((d: any) => d.total);
    const recentRequests = metrics?.recentRequests ?? [];
    const filteredRecentRequests = useMemo(() => {
        if (recentTargetFilter === "all") return recentRequests;
        return recentRequests.filter(
            (r: any) => r?.targetType === recentTargetFilter
        );
    }, [recentRequests, recentTargetFilter]);

    if (loading)
        return (
            <div className="container mx-auto p-6">Cargando métricas...</div>
        );
    if (error)
        return (
            <div className="container mx-auto p-6 text-red-600">{error}</div>
        );

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-2xl font-semibold mb-4">
                Panel de administración
            </h1>

            {/* top stat cards - expanded to include Emergencies */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <StatCard
                    title="Solicitudes totales"
                    value={metrics.totalRequests ?? 0}
                    subtitle={`Hoy: ${metrics.requestsToday ?? 0}`}
                    icon={RectangleStackIcon}
                    colorBg="bg-violet-50"
                />
                <Link to="/admin/requests?target=veterinaria">
                    <StatCard
                        title="Veterinarias (solicitudes)"
                        value={metrics.targetCounts?.veterinaria ?? 0}
                        subtitle="Solicitudes dirigidas a veterinarias"
                        icon={BuildingStorefrontIcon}
                        colorBg="bg-amber-50"
                    />
                </Link>
                <Link to="/admin/requests?target=emergency">
                    <StatCard
                        title="Urgencias (solicitudes)"
                        value={metrics.targetCounts?.emergency ?? 0}
                        subtitle="Solicitudes dirigidas a emergencias"
                        icon={UserGroupIcon}
                        colorBg="bg-red-50"
                    />
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-medium">
                                Movimientos últimos 7 días
                            </h3>
                            <div className="text-xs text-gray-500">
                                Solicitudes por día (total)
                            </div>
                        </div>
                        <MiniSparkline data={dailyTotals} color="#06b6d4" />
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                        <div className="p-3 bg-gray-50 rounded">
                            <div className="text-xs text-gray-500">
                                Pendientes
                            </div>
                            <div className="text-lg font-semibold text-yellow-600 flex items-center gap-2">
                                <ClockIcon className="w-5 h-5 text-yellow-600" />
                                {metrics.statusCounts?.pending ?? 0}
                            </div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded">
                            <div className="text-xs text-gray-500">
                                Aceptadas
                            </div>
                            <div className="text-lg font-semibold text-green-600 flex items-center gap-2">
                                <CheckCircleIcon className="w-5 h-5 text-green-600" />
                                {metrics.statusCounts?.accepted ?? 0}
                            </div>
                        </div>

                        <div className="p-3 bg-gray-50 rounded">
                            <div className="text-xs text-gray-500">
                                Cumplidas
                            </div>
                            <div className="text-lg font-semibold text-brand-600 flex items-center gap-2">
                                <ChartBarIcon className="w-5 h-5 text-brand-600" />
                                {metrics.statusCounts?.fulfilled ?? 0}
                            </div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded">
                            <div className="text-xs text-gray-500">
                                Canceladas
                            </div>
                            <div className="text-lg font-semibold text-red-600 flex items-center gap-2">
                                <XCircleIcon className="w-5 h-5 text-red-600" />
                                {metrics.statusCounts?.cancelled ?? 0}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-white rounded shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-medium">Últimas solicitudes</h3>
                            <div className="text-xs text-gray-500">
                                Revisión rápida
                            </div>
                        </div>
                        <Link
                            to={
                                recentTargetFilter === "all"
                                    ? "/admin/requests"
                                    : `/admin/requests?target=${recentTargetFilter}`
                            }
                            className="text-sm text-brand-600 hover:underline"
                        >
                            Ver todas
                        </Link>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                        {[
                            { key: "all", label: "Todas" },
                            { key: "veterinaria", label: "Veterinarias" },
                            { key: "emergency", label: "Urgencias" },
                        ].map((opt) => (
                            <button
                                key={opt.key}
                                type="button"
                                onClick={() =>
                                    setRecentTargetFilter(
                                        opt.key as
                                            | "all"
                                            | "veterinaria"
                                            | "emergency"
                                    )
                                }
                                className={`px-2.5 py-1 rounded-full text-xs border transition ${
                                    recentTargetFilter === opt.key
                                        ? "bg-slate-800 text-white border-slate-800"
                                        : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    <div className="mt-3 space-y-3">
                        {filteredRecentRequests.map((rq: any) => (
                            <div
                                key={rq._id}
                                className="p-3 bg-gray-50 rounded flex items-center justify-between"
                            >
                                <div>
                                    <div className="font-medium">
                                        {rq.userSnapshot?.name ?? "Usuario"}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {actionTypeLabel(
                                            rq.actionType,
                                            rq.targetType
                                        )}{" "}
                                        • {labelForTargetType(rq.targetType)}
                                    </div>
                                </div>
                                <div className="text-right text-xs text-gray-500">
                                    <div>
                                        {new Date(
                                            rq.createdAt
                                        ).toLocaleString()}
                                    </div>
                                    <div className="mt-1 font-mono text-sm">
                                        {rq.token}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {filteredRecentRequests.length === 0 && (
                            <div className="p-3 bg-gray-50 rounded text-sm text-gray-500">
                                No hay movimientos para este filtro.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <Link
                    to="/admin/users"
                    className="p-4 bg-white rounded shadow hover:shadow-md"
                >
                    <div className="flex items-center gap-3">
                        <UserGroupIcon className="w-6 h-6 text-brand-600" />
                        <div>
                            <div className="font-medium">Usuarios</div>
                            <div className="text-xs text-gray-500">
                                Listar y administrar usuarios
                            </div>
                        </div>
                    </div>
                </Link>

                <Link
                    to="/admin/veterinarias"
                    className="p-4 bg-white rounded shadow hover:shadow-md"
                >
                    <div className="flex items-center gap-3">
                        <BuildingStorefrontIcon className="w-6 h-6 text-amber-600" />
                        <div>
                            <div className="font-medium">Veterinarias</div>
                            <div className="text-xs text-gray-500">
                                Listar y administrar veterinarias
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Emergencies management tile */}
                <Link
                    to="/admin/emergencies"
                    className="p-4 bg-white rounded shadow hover:shadow-md"
                >
                    <div className="flex items-center gap-3">
                        <UserGroupIcon className="w-6 h-6 text-red-600" />
                        <div>
                            <div className="font-medium">Emergencias</div>
                            <div className="text-xs text-gray-500">
                                Listar y administrar servicios de emergencia
                            </div>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Obras sociales / planes / coberturas: entidades relacionadas entre sí —
                agrupadas aparte, con el orden de carga sugerido, para que el alta de
                punta a punta se entienda como un solo flujo y no como 4 pantallas sueltas. */}
            <div className="mt-8">
                <h2 className="text-lg font-semibold text-gray-900">
                    Obras sociales y coberturas
                </h2>
                <p className="text-xs text-gray-500 mt-0.5 mb-3">
                    Flujo sugerido: cargá la obra social, después sus planes (desde su
                    ficha), y por último qué prestaciones cubre cada plan (desde la
                    ficha del plan). Prestaciones es un catálogo aparte, compartido por
                    todos los planes.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Link
                        to="/admin/insurers"
                        className="p-4 bg-white rounded shadow hover:shadow-md relative"
                    >
                        <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-sky-100 text-sky-700 text-[11px] font-semibold flex items-center justify-center">
                            1
                        </span>
                        <div className="flex items-center gap-3">
                            <ShieldCheckIcon className="w-6 h-6 text-sky-600" />
                            <div>
                                <div className="font-medium">Obras sociales</div>
                                <div className="text-xs text-gray-500">
                                    Alta de financiadores (obra social/prepaga)
                                </div>
                            </div>
                        </div>
                    </Link>

                    <Link
                        to="/admin/plans"
                        className="p-4 bg-white rounded shadow hover:shadow-md relative"
                    >
                        <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-cyan-100 text-cyan-700 text-[11px] font-semibold flex items-center justify-center">
                            2
                        </span>
                        <div className="flex items-center gap-3">
                            <DocumentTextIcon className="w-6 h-6 text-cyan-600" />
                            <div>
                                <div className="font-medium">Planes</div>
                                <div className="text-xs text-gray-500">
                                    Se cargan desde la ficha de cada obra social
                                </div>
                            </div>
                        </div>
                    </Link>

                    <Link
                        to="/admin/plan-coverages"
                        className="p-4 bg-white rounded shadow hover:shadow-md relative"
                    >
                        <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-teal-100 text-teal-700 text-[11px] font-semibold flex items-center justify-center">
                            3
                        </span>
                        <div className="flex items-center gap-3">
                            <ClipboardDocumentListIcon className="w-6 h-6 text-teal-600" />
                            <div>
                                <div className="font-medium">Coberturas</div>
                                <div className="text-xs text-gray-500">
                                    Se cargan desde la ficha de cada plan
                                </div>
                            </div>
                        </div>
                    </Link>

                    <Link
                        to="/admin/prestations"
                        className="p-4 bg-white rounded shadow hover:shadow-md relative"
                    >
                        <span className="absolute top-3 right-3 px-1.5 h-5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-semibold flex items-center justify-center">
                            catálogo
                        </span>
                        <div className="flex items-center gap-3">
                            <ClipboardDocumentListIcon className="w-6 h-6 text-violet-600" />
                            <div>
                                <div className="font-medium">Prestaciones</div>
                                <div className="text-xs text-gray-500">
                                    Catálogo de servicios, independiente de los planes
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
