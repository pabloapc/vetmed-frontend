import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import adminService from "../services/adminService";
import {
    Bars3Icon,
    HomeIcon,
    MapPinIcon,
    UserCircleIcon,
    UserGroupIcon,
    CalendarIcon,
    ClipboardDocumentListIcon,
    PlusCircleIcon,
    ShieldCheckIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";

export const Navbar: React.FC = () => {
    const { isAuthenticated, logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [insurerName, setInsurerName] = useState("");
    const [planName, setPlanName] = useState("");
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

    const handleLogout = () => {
        setMobileMenuOpen(false);
        logout();
        navigate("/login");
    };

    const initials = (user?.name || "")
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

    useEffect(() => {
        const loadCoverageData = async () => {
            if (!(isAuthenticated && user?.role === "user")) {
                setInsurerName("");
                setPlanName("");
                return;
            }

            const rawInsurer = user?.insurerId ?? user?.entityId;
            const rawPlan = user?.planId;
            const insurerId = getId(rawInsurer);
            const selectedPlanId = getId(rawPlan);
            const insurerNameFromUser = getName(rawInsurer);
            const planNameFromUser = getName(rawPlan);

            if (insurerNameFromUser) {
                setInsurerName(insurerNameFromUser);
            } else if (insurerId) {
                try {
                    const res: any = await adminService.getInsurer(insurerId);
                    const doc = res?.data?.insurer ?? res?.insurer ?? res?.data ?? res;
                    setInsurerName(doc?.name || "");
                } catch (err) {
                    console.warn("No se pudo cargar la obra social del usuario", err);
                    setInsurerName("");
                }
            } else {
                setInsurerName("");
            }

            if (planNameFromUser) {
                setPlanName(planNameFromUser);
            } else if (selectedPlanId) {
                try {
                    const planRes: any = await adminService.getPlan(selectedPlanId);
                    const planDoc = planRes?.data?.plan ?? planRes?.plan ?? planRes?.data ?? planRes;
                    setPlanName(planDoc?.name || "");
                } catch (err) {
                    console.warn("No se pudo cargar el plan del usuario", err);
                    setPlanName("");
                }
            } else {
                setPlanName("");
            }
        };

        loadCoverageData();
    }, [isAuthenticated, user?.role, user?.insurerId, user?.entityId, user?.planId]);

    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location.pathname]);

    const userInsurerId = getId(user?.insurerId ?? user?.entityId);
    const displayInsurerName =
        isAuthenticated && (user?.role === null || user?.role === "user")
            ? insurerName || (!userInsurerId ? "Vetfind" : "")
            : "";
    const displayPlanName =
        isAuthenticated && (user?.role === null || user?.role === "user")
            ? planName || (!userInsurerId ? "Base Vetfind" : "")
            : "";
    const homePath =
        user?.role === "admin"
            ? "/admin"
            : user?.role === "veterinaria"
            ? "/veterinaria/requests"
            : user?.role === "emergency"
            ? "/emergency/requests"
            : isAuthenticated
            ? "/welcome"
            : "/";
    const isRouteActive = (path: string, exact = false) => {
        if (exact) return location.pathname === path;
        return (
            location.pathname === path ||
            location.pathname.startsWith(`${path}/`)
        );
    };
    const getMobileLinkClass = (path: string, exact = false) =>
        `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
            isRouteActive(path, exact)
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-800 hover:bg-slate-100"
        }`;
    const getMobileIconClass = (path: string, exact = false) =>
        `w-5 h-5 ${isRouteActive(path, exact) ? "text-white" : "text-blue-600"}`;

    return (
        <>
        <nav className="header backdrop-blur-2xl shadow-sm sticky top-0 z-50">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    <Link to={homePath} className="flex items-center gap-3">
                        <span className="text-xl font-bold tracking-tight">
                            Vetfind
                        </span>
                        <span className="inline-flex items-center justify-center w-7 h-7 bg-white/20 rounded-full text-sm font-bold">
                            +
                        </span>
                    </Link>

                    <div className="hidden md:flex items-center space-x-3">
                        {/* Common link for all */}
                        <Link
                            to={homePath}
                            className="flex items-center gap-2 px-3 py-2 rounded hover:bg-white/10"
                        >
                            <HomeIcon className="w-5 h-5" />
                            <span className="hidden min-[1020px]:inline">Inicio</span>
                        </Link>

                        {!isAuthenticated && (
                            <>
                                <Link
                                    to="/login"
                                    className="flex items-center gap-2 px-3 py-2 rounded hover:bg-white/10"
                                >
                                    <UserCircleIcon className="w-5 h-5" />
                                    <span className="hidden md:inline">
                                        Ingreso
                                    </span>
                                </Link>
                                <Link
                                    to="/register"
                                    className="flex items-center gap-2 px-3 py-2 rounded bg-white/10 hover:bg-white/20"
                                >
                                    <PlusCircleIcon className="w-5 h-5" />
                                    <span className="hidden md:inline">
                                        Registro
                                    </span>
                                </Link>
                            </>
                        )}

                        {isAuthenticated && user?.role === "veterinaria" && (
                            <>
                                <Link
                                    to="/veterinaria/requests"
                                    className="flex items-center gap-2 px-3 py-2 rounded hover:bg-white/10"
                                >
                                    <UserGroupIcon className="w-5 h-5" />
                                    <span className="hidden min-[1020px]:inline">
                                        Solicitudes
                                    </span>
                                </Link>
                                <Link
                                    to="/profile"
                                    className="flex items-center gap-2 px-3 py-2 rounded hover:bg-white/10"
                                >
                                    <UserCircleIcon className="w-5 h-5" />
                                    <span className="hidden md:inline">
                                        Perfil
                                    </span>
                                </Link>
                            </>
                        )}


                        {isAuthenticated && user?.role === "emergency" && (
                            <>
                                <Link
                                    to="/emergency/requests"
                                    className="flex items-center gap-2 px-3 py-2 rounded hover:bg-white/10"
                                >
                                    <CalendarIcon className="w-5 h-5" />
                                    <span className="hidden md:inline">
                                        Emergencias
                                    </span>
                                </Link>
                                <Link
                                    to="/profile"
                                    className="flex items-center gap-2 px-3 py-2 rounded hover:bg-white/10"
                                >
                                    <UserCircleIcon className="w-5 h-5" />
                                    <span className="hidden md:inline">
                                        Perfil
                                    </span>
                                </Link>
                            </>
                        )}

                        {isAuthenticated &&
                            (user?.role === null || user?.role === "user") && (
                                <>
                                    <Link
                                        to="/veterinarias"
                                        className="flex items-center gap-2 px-3 py-2 rounded hover:bg-white/10"
                                    >
                                        <MapPinIcon className="w-5 h-5" />
                                        <span className="hidden md:inline">
                                            Veterinarias
                                        </span>
                                    </Link>
                                    <Link
                                        to="/emergencies"
                                        className="flex items-center gap-2 px-3 py-2 rounded hover:bg-white/10"
                                        title="Emergencias"
                                    >
                                        {/* simple icon kept as svg for medical briefcase */}
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="24"
                                            height="24"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="lucide lucide-ambulance-icon lucide-ambulance"
                                        >
                                            <path d="M10 10H6" />
                                            <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
                                            <path d="M19 18h2a1 1 0 0 0 1-1v-3.28a1 1 0 0 0-.684-.948l-1.923-.641a1 1 0 0 1-.578-.502l-1.539-3.076A1 1 0 0 0 16.382 8H14" />
                                            <path d="M8 8v4" />
                                            <path d="M9 18h6" />
                                            <circle cx="17" cy="18" r="2" />
                                            <circle cx="7" cy="18" r="2" />
                                        </svg>
                                        <span className="hidden md:inline text-sm">
                                            Emergencias
                                        </span>
                                    </Link>

                                    <Link
                                        to="/requests"
                                        className="flex items-center gap-2 px-3 py-2 rounded hover:bg-white/10"
                                        title="Solicitudes"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={1.5}
                                            stroke="currentColor"
                                            className="size-6"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                                            />
                                        </svg>
                                        <span className="hidden min-[1020px]:inline text-sm">
                                            Solicitudes
                                        </span>
                                    </Link>

                                    {displayInsurerName && (
                                        <span className="hidden lg:inline-flex items-center px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-medium border border-emerald-200">
                                            Obra social: {displayInsurerName}
                                        </span>
                                    )}

                                    {displayPlanName && (
                                        <span className="hidden lg:inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium border border-blue-200">
                                            Plan: {displayPlanName}
                                        </span>
                                    )}

                                    {/* <Link
                                        to="/profile"
                                        className="flex items-center gap-2 px-3 py-2 rounded hover:bg-white/10"
                                    >
                                        <UserCircleIcon className="w-5 h-5" />
                                        <span className="hidden md:inline">
                                            Perfil
                                        </span>
                                    </Link> */}
                                </>
                            )}

                        {/* ADMIN: opciones visibles sólo para role === 'admin' */}
                        {isAuthenticated && user?.role === "admin" && (
                            <>
                                <Link
                                    to="/admin"
                                    className="flex items-center gap-2 px-3 py-2 rounded hover:bg-white/10"
                                >
                                    <ShieldCheckIcon className="w-5 h-5" />
                                    <span className="hidden md:inline">
                                        Admin
                                    </span>
                                </Link>

                                <Link
                                    to="/admin/users"
                                    className="flex items-center gap-2 px-3 py-2 rounded hover:bg-white/10"
                                >
                                    <UserGroupIcon className="w-5 h-5" />
                                    <span className="hidden md:inline">
                                        Usuarios
                                    </span>
                                </Link>

                                {/* Agregá aquí más links de administración según necesites:
                    /admin/veterinarias, /admin/settings, etc. */}
                            </>
                        )}

                        {isAuthenticated && (
                            <>
                                <div className="hidden md:flex items-center px-3 py-2 text-sm ">
                                    {/* <span className="mr-3">Hola,</span> */}
                                    <Link to="/profile">
                                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-600 text-sm font-medium text-white">
                                            {initials || "U"}
                                        </div>
                                    </Link>
                                </div>

                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 px-3 py-2 rounded bg-white/10 hover:bg-white/20"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={1.5}
                                        stroke="currentColor"
                                        className="size-6"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"
                                        />
                                    </svg>

                                    <span className="hidden min-[1020px]:inline">
                                        Cerrar
                                    </span>
                                </button>
                            </>
                        )}
                    </div>

                    <div className="md:hidden flex items-center gap-2">
                        {isAuthenticated && (
                            <Link
                                to="/profile"
                                className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-slate-900 text-sm font-semibold text-white shadow-sm"
                            >
                                {initials || "U"}
                            </Link>
                        )}

                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(true)}
                            aria-label="Abrir menú"
                            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm transition hover:bg-slate-50"
                        >
                            <Bars3Icon className="w-6 h-6" />
                            <span className="text-sm font-medium">Menú</span>
                        </button>
                    </div>
                </div>
            </div>
        </nav>

        {mobileMenuOpen && (
            <div className="md:hidden fixed inset-0 z-[60] animate-[fadeIn_.18s_ease-out]">
                <button
                    type="button"
                    aria-label="Cerrar menú"
                    className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm animate-[fadeIn_.18s_ease-out]"
                    onClick={() => setMobileMenuOpen(false)}
                />

                <div className="absolute right-0 top-0 h-full w-[88%] max-w-sm bg-white shadow-2xl rounded-l-3xl overflow-hidden animate-[slideInRight_.22s_ease-out]">
                    <div className="h-full flex flex-col">
                        <div
                            className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 px-5 pt-5 pb-6 text-white"
                            style={{ paddingTop: "calc(env(safe-area-inset-top) + 1rem)" }}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <Link to={homePath} className="flex items-center gap-3 text-lg font-bold tracking-tight">
                                    <span>Vetfind</span>
                                    <span className="inline-flex items-center justify-center w-7 h-7 bg-white/20 rounded-full text-sm font-bold">
                                        +
                                    </span>
                                </Link>

                                <button
                                    type="button"
                                    onClick={() => setMobileMenuOpen(false)}
                                    aria-label="Cerrar menú"
                                    className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 transition"
                                >
                                    <XMarkIcon className="w-6 h-6" />
                                </button>
                            </div>

                            {isAuthenticated ? (
                                <div className="rounded-3xl bg-white/10 border border-white/15 p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white text-blue-700 text-sm font-bold">
                                            {initials || "U"}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold truncate">{user?.name || "Usuario"}</p>
                                            <p className="text-xs text-blue-100 truncate">{user?.email}</p>
                                        </div>
                                    </div>

                                    {displayInsurerName && (
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-medium border border-emerald-200">
                                                Cobertura: {displayInsurerName}
                                            </span>
                                            {displayPlanName && (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium border border-blue-200">
                                                    Plan: {displayPlanName}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="rounded-3xl bg-white/10 border border-white/15 p-4 space-y-3">
                                    <p className="text-sm text-blue-50">
                                        Accedé o registrate para usar todas las funciones de Vetfind.
                                    </p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Link
                                            to="/login"
                                            className="inline-flex items-center justify-center rounded-2xl bg-white/10 px-4 py-3 text-sm font-medium"
                                        >
                                            Ingreso
                                        </Link>
                                        <Link
                                            to="/register"
                                            className="inline-flex items-center justify-center rounded-2xl bg-white text-blue-700 px-4 py-3 text-sm font-semibold"
                                        >
                                            Registro
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto px-4 py-5 bg-slate-50">
                            <div className="space-y-6">
                                <div>
                                    <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                                        Navegación
                                    </p>
                                    <div className="space-y-1">
                                        <Link to={homePath} className={getMobileLinkClass(homePath, homePath === "/") }>
                                            <HomeIcon className={getMobileIconClass(homePath, homePath === "/")} />
                                            <span>Inicio</span>
                                        </Link>

                                        {!isAuthenticated && (
                                            <>
                                                <Link to="/login" className={getMobileLinkClass("/login", true)}>
                                                    <UserCircleIcon className={getMobileIconClass("/login", true)} />
                                                    <span>Ingreso</span>
                                                </Link>
                                                <Link to="/register" className={getMobileLinkClass("/register", true)}>
                                                    <PlusCircleIcon className={getMobileIconClass("/register", true)} />
                                                    <span>Registro</span>
                                                </Link>
                                            </>
                                        )}

                                        {isAuthenticated && user?.role === "veterinaria" && (
                                            <>
                                                <Link to="/veterinaria/requests" className={getMobileLinkClass("/veterinaria/requests")}>
                                                    <UserGroupIcon className={getMobileIconClass("/veterinaria/requests")} />
                                                    <span>Solicitudes</span>
                                                </Link>
                                                <Link to="/profile" className={getMobileLinkClass("/profile")}>
                                                    <UserCircleIcon className={getMobileIconClass("/profile")} />
                                                    <span>Perfil</span>
                                                </Link>
                                            </>
                                        )}

                                        {isAuthenticated && user?.role === "emergency" && (
                                            <>
                                                <Link to="/emergency/requests" className={getMobileLinkClass("/emergency/requests")}>
                                                    <CalendarIcon className={getMobileIconClass("/emergency/requests")} />
                                                    <span>Emergencias</span>
                                                </Link>
                                                <Link to="/profile" className={getMobileLinkClass("/profile")}>
                                                    <UserCircleIcon className={getMobileIconClass("/profile")} />
                                                    <span>Perfil</span>
                                                </Link>
                                            </>
                                        )}

                                        {isAuthenticated && (user?.role === null || user?.role === "user") && (
                                            <>
                                                <Link to="/veterinarias" className={getMobileLinkClass("/veterinarias")}>
                                                    <MapPinIcon className={getMobileIconClass("/veterinarias")} />
                                                    <span>Veterinarias</span>
                                                </Link>
                                                <Link to="/emergencies" className={getMobileLinkClass("/emergencies")}>
                                                    <CalendarIcon className={getMobileIconClass("/emergencies")} />
                                                    <span>Emergencias</span>
                                                </Link>
                                                <Link to="/requests" className={getMobileLinkClass("/requests")}>
                                                    <ClipboardDocumentListIcon className={getMobileIconClass("/requests")} />
                                                    <span>Solicitudes</span>
                                                </Link>
                                                <Link to="/profile" className={getMobileLinkClass("/profile")}>
                                                    <UserCircleIcon className={getMobileIconClass("/profile")} />
                                                    <span>Perfil</span>
                                                </Link>
                                            </>
                                        )}

                                        {isAuthenticated && user?.role === "admin" && (
                                            <>
                                                <Link to="/admin" className={getMobileLinkClass("/admin")}>
                                                    <ShieldCheckIcon className={getMobileIconClass("/admin")} />
                                                    <span>Admin</span>
                                                </Link>
                                                <Link to="/admin/users" className={getMobileLinkClass("/admin/users")}>
                                                    <UserGroupIcon className={getMobileIconClass("/admin/users")} />
                                                    <span>Usuarios</span>
                                                </Link>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {isAuthenticated && (
                            <div className="border-t border-slate-200 p-4 bg-white">
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-3 text-sm font-medium transition"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={1.5}
                                        stroke="currentColor"
                                        className="size-5"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"
                                        />
                                    </svg>
                                    <span>Cerrar sesión</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
        </>
    );
};

export default Navbar;
