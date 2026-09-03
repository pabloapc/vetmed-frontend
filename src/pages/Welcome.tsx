import React, { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
    ArrowRightIcon,
    BoltIcon,
    BuildingStorefrontIcon,
    CalendarDaysIcon,
    CheckCircleIcon,
    ClipboardDocumentListIcon,
    ClockIcon,
    ExclamationCircleIcon,
    ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../hooks/useAuth";
import { requestService } from "../services/requestService";
import { BottomNavMenu } from "../components/BottomNavMenu";

const statusStyles: Record<string, { label: string; className: string }> = {
    pending: { label: "Pendiente", className: "bg-amber-100 text-amber-700" },
    accepted: { label: "Aceptada", className: "bg-emerald-100 text-emerald-700" },
    fulfilled: { label: "Cumplida", className: "bg-brand-100 text-brand-700" },
    cancelled: { label: "Cancelada", className: "bg-red-100 text-red-700" },
};

const quickActions = [
    {
        title: "Veterinarias",
        description: "Buscá cobertura, horarios y beneficios cerca tuyo.",
        to: "/veterinarias",
        Icon: BuildingStorefrontIcon,
        className: "from-amber-50 to-orange-50 border-amber-100 text-amber-700",
    },
    {
        title: "Urgencias",
        description: "Accedé rápido a servicios de atención inmediata.",
        to: "/emergencies",
        Icon: BoltIcon,
        className: "from-red-50 to-rose-50 border-red-100 text-red-700",
    },
];

const getId = (value: unknown): string => {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value === "object") {
        const doc = value as { _id?: string; id?: string };
        return doc._id || doc.id || "";
    }
    return "";
};

const getName = (value: unknown): string => {
    if (!value || typeof value !== "object") return "";
    const doc = value as { name?: string; nombre?: string };
    return doc.name || doc.nombre || "";
};

export const Welcome: React.FC = () => {
    const { user } = useAuth();
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadRequests = async () => {
            if (!user || (user.role !== null && user.role !== "user")) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError("");
                const res = await requestService.getUserRequests();
                const list = res?.data?.requests ?? res?.requests ?? res?.data ?? [];
                setRequests(Array.isArray(list) ? list : []);
            } catch (err: any) {
                setError(
                    err?.response?.data?.message ||
                        err?.message ||
                        "No se pudo cargar el resumen de solicitudes."
                );
            } finally {
                setLoading(false);
            }
        };

        loadRequests();
    }, [user]);

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (user.role && user.role !== "user") {
        const redirectMap: Record<string, string> = {
            veterinaria: "/veterinaria/requests",
            emergency: "/emergency/requests",
            admin: "/admin",
        };
        return <Navigate to={redirectMap[user.role] || "/profile"} replace />;
    }

    const rawInsurer = (user as any)?.insurerId ?? user.entityId;
    const rawPlan = (user as any)?.planId;
    const insurerId = getId(rawInsurer);
    const insurerName = getName(rawInsurer) || (!insurerId ? "Vetfind" : "Cobertura asignada");
    const planName = getName(rawPlan) || (!insurerId ? "Base Vetfind" : "Plan pendiente");
    const pendingCount = requests.filter((request) => request.status === "pending").length;
    const acceptedCount = requests.filter((request) => request.status === "accepted").length;
    const latestRequests = [...requests]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 4);

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 pb-28">
                <section className="relative overflow-hidden rounded-[2rem] mx-4 my-6 sm:mx-0 sm:my-0 bg-gradient-to-br from-brand-900 via-brand-700 to-brand-600 p-6 sm:p-8 text-white shadow-xl">
                     <div className="absolute -bottom-20 right-0 h-56 w-56 rounded-full bg-white/10" />

                    <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-2xl">
 
                            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
                                Hola, {user.name.split(" ")[0]}.
                            </h1>
 

                            <div className="mt-5 flex flex-wrap gap-2">
                                <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-medium border border-white/10">
                                    Cobertura: {insurerName}
                                </span>
                                <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-medium border border-white/10">
                                    Plan: {planName}
                                </span>
                                <span className="inline-flex items-center rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-medium border border-emerald-200/20 text-emerald-50">
                                    <ShieldCheckIcon className="w-3.5 h-3.5 mr-1.5" />
                                    Cuenta {user.isVerified ? "verificada" : "pendiente de verificación"}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 w-full lg:w-auto lg:min-w-[320px]">
                            <div className="rounded-3xl bg-white/10 border border-white/10 px-4 py-4 backdrop-blur-sm">
                                <p className="text-xs text-brand-100">Solicitudes totales</p>
                                <p className="mt-1 text-3xl font-bold">{requests.length}</p>
                            </div>
                            <div className="rounded-3xl bg-white/10 border border-white/10 px-4 py-4 backdrop-blur-sm">
                                <p className="text-xs text-brand-100">Pendientes</p>
                                <p className="mt-1 text-3xl font-bold">{pendingCount}</p>
                            </div>
                            <div className="rounded-3xl bg-white/10 border border-white/10 px-4 py-4 backdrop-blur-sm">
                                <p className="text-xs text-brand-100">Aceptadas</p>
                                <p className="mt-1 text-3xl font-bold">{acceptedCount}</p>
                            </div>
                            <div className="rounded-3xl bg-white/10 border border-white/10 px-4 py-4 backdrop-blur-sm">
                                <p className="text-xs text-brand-100">Plan actual</p>
                                <p className="mt-1 text-lg font-semibold truncate">{planName}</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
                    <div className="rounded-[2rem] border border-gray-100 bg-white p-5 sm:p-6 shadow-sm">
                        <div className="flex items-center justify-between gap-4 mb-5">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Tus solicitudes</h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    Un resumen rápido del estado de tus últimas gestiones.
                                </p>
                            </div>
                            <Link
                                to="/requests"
                                className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Ver todas
                                <ArrowRightIcon className="w-4 h-4" />
                            </Link>
                        </div>

                        {loading ? (
                            <div className="flex min-h-52 items-center justify-center text-sm text-gray-500">
                                Cargando resumen...
                            </div>
                        ) : error ? (
                            <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
                                <ExclamationCircleIcon className="w-5 h-5 shrink-0 mt-0.5" />
                                <span>{error}</span>
                            </div>
                        ) : latestRequests.length === 0 ? (
                            <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center">
                                <ClipboardDocumentListIcon className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                                <p className="text-sm font-medium text-gray-700">Todavía no tenés solicitudes.</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    Podés empezar consultando veterinarias o urgencias.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {latestRequests.map((request) => {
                                    const status = statusStyles[request.status] ?? {
                                        label: request.status || "Sin estado",
                                        className: "bg-gray-100 text-gray-700",
                                    };
                                    const targetName =
                                        request?.target?.name ||
                                        request?.veterinaria?.name ||
                                        request?.emergency?.name ||
                                        (request?.targetType === "veterinaria"
                                            ? "Veterinaria"
                                            : request?.targetType === "emergency"
                                            ? "Servicio de emergencia"
                                            : request?.veterinaria ? "Veterinaria" : request?.emergency ? "Servicio de emergencia" : "Prestador");

                                    return (
                                        <div
                                            key={request._id}
                                            className="rounded-3xl border border-gray-100 bg-gray-50/80 px-4 py-4 transition hover:bg-white hover:shadow-sm"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">{targetName}</p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {new Date(request.createdAt).toLocaleDateString("es-AR", {
                                                            day: "numeric",
                                                            month: "short",
                                                            year: "numeric",
                                                        })}
                                                    </p>
                                                </div>
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}>
                                                    {status.label}
                                                </span>
                                            </div>

                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {request.actionType && (
                                                    <span className="rounded-full bg-white px-2.5 py-1 text-xs text-gray-600 border border-gray-200">
                                                        {String(request.actionType).replace(/_/g, " ")}
                                                    </span>
                                                )}
                                                {request.token && (
                                                    <span className="rounded-full bg-white px-2.5 py-1 text-xs text-gray-600 border border-gray-200">
                                                        Token: {request.token}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="rounded-[2rem] border border-gray-100 bg-white p-5 sm:p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-5">
                            <CalendarDaysIcon className="w-5 h-5 text-brand-600" />
                            <h2 className="text-xl font-bold text-gray-900">Accesos principales</h2>
                        </div>

                        <div className="space-y-3">
                            {quickActions.map(({ title, description, to, Icon, className }) => (
                                <Link
                                    key={title}
                                    to={to}
                                    className={`block rounded-3xl border bg-gradient-to-br p-4 transition hover:-translate-y-0.5 hover:shadow-md ${className}`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-base font-semibold">{title}</p>
                                            <p className="mt-1 text-sm text-gray-600">{description}</p>
                                        </div>
                                        <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-white shadow-sm shrink-0">
                                            <Icon className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium">
                                        Abrir
                                        <ArrowRightIcon className="w-4 h-4" />
                                    </div>
                                </Link>
                            ))}
                        </div>

                        <div className="mt-5 rounded-3xl border border-brand-100 bg-brand-50 px-4 py-4">
                            <div className="flex items-start gap-3">
                                <CheckCircleIcon className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">Tu cobertura ya está lista</p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Estás navegando con {insurerName} y {planName}. Si necesitás cambiar algo, lo hacemos desde tu perfil.
                                    </p>
                                    <Link
                                        to="/profile"
                                        className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800"
                                    >
                                        Ir a mi perfil
                                        <ArrowRightIcon className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-3xl bg-white p-5 border border-gray-100 shadow-sm">
                        <ClockIcon className="w-6 h-6 text-amber-500 mb-3" />
                        <p className="text-sm font-semibold text-gray-900">Seguimiento rápido</p>
                        <p className="mt-1 text-sm text-gray-500">
                            Revisá el estado de tus derivaciones sin salir de la home.
                        </p>
                    </div>
                    <div className="rounded-3xl bg-white p-5 border border-gray-100 shadow-sm">
                        <ShieldCheckIcon className="w-6 h-6 text-emerald-500 mb-3" />
                        <p className="text-sm font-semibold text-gray-900">Datos claros</p>
                        <p className="mt-1 text-sm text-gray-500">
                            Tu cobertura y plan quedan visibles desde el primer ingreso.
                        </p>
                    </div>
                    <div className="rounded-3xl bg-white p-5 border border-gray-100 shadow-sm">
                        <BoltIcon className="w-6 h-6 text-red-500 mb-3" />
                        <p className="text-sm font-semibold text-gray-900">Acción inmediata</p>
                        <p className="mt-1 text-sm text-gray-500">
                            Accedé a veterinarias, telemedicina y urgencias en un toque.
                        </p>
                    </div>
                </section>
            </div>
            <BottomNavMenu />
        </div>
    );
};

export default Welcome;