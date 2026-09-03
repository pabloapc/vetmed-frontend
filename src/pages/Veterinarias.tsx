import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { veterinariaService } from "../services/veterinariaService";
import { requestService } from "../services/requestService";
import type { Veterinaria, BackendVeterinaria } from "../types/veterinaria";
import { useAuth } from "../hooks/useAuth";
import { BottomNavMenu } from "../components/BottomNavMenu";
import { VETERINARIA_ACTION_TYPES } from "../constants/veterinariaActionTypes";
import { veterinariaDetailPath } from "../utils/seoUrl";

import {
    MagnifyingGlassIcon,
    MapPinIcon,
    MapIcon,
    ArrowPathIcon,
    BuildingStorefrontIcon,
    PhoneIcon,
    ClockIcon,
    TagIcon,
    XMarkIcon,
    KeyIcon,
    ClipboardDocumentIcon,
    CheckIcon,
    ExclamationCircleIcon,
    PlusIcon,
} from "@heroicons/react/24/outline";

const PAGE_SIZE = 9;
//const TOKEN_TTL_MS = 2 * 60 * 1000; // 2 minutes

type TokenInfo = {
    code: string;
    expiresAt: number; // timestamp ms
};

export const Veterinarias: React.FC = () => {
    const [veterinarias, setVeterinarias] = useState<Veterinaria[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [useLocation, setUseLocation] = useState<boolean>(() => {
        try {
            const raw = localStorage.getItem("veterinarias_useLocation");
            return raw === "true";
        } catch {
            return false;
        }
    });
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [copyFeedback, setCopyFeedback] = useState<Record<string, boolean>>(
        {}
    );
    const { user } = useAuth();
    const navigate = useNavigate();

    // tokens state: a mapping veterinariaId -> TokenInfo
    const [tokens, setTokens] = useState<Record<string, TokenInfo>>({});
    // requestForms per veterinaria
    const [requestForms, setRequestForms] = useState<
        Record<string, { actionType: string; notes: string; loading?: boolean }>
    >({});

    // tick to force re-render every second while there are active tokens
    const [tick, setTick] = useState(0);
    const tickRef = useRef<number | null>(null);

    // pagination / lazy load
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const loadMoreRef = useRef<HTMLDivElement | null>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);

    // debounce search input (300ms)
    useEffect(() => {
        const t = window.setTimeout(() => {
            setDebouncedSearch(search.trim().toLowerCase());
        }, 300);
        return () => clearTimeout(t);
    }, [search]);

    useEffect(() => {
        loadVeterinarias();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [useLocation, user]);

    useEffect(() => {
        setVisibleCount(PAGE_SIZE);
    }, [debouncedSearch, veterinarias]);

    useEffect(
        () => {
            // intersection observer to auto load more when sentinel visible
            if (observerRef.current) {
                observerRef.current.disconnect();
                observerRef.current = null;
            }
            if (!loadMoreRef.current) return;
            observerRef.current = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            setVisibleCount((c) => {
                                if (c >= filtered.length) return c;
                                return Math.min(filtered.length, c + PAGE_SIZE);
                            });
                        }
                    });
                },
                {
                    root: null,
                    rootMargin: "200px",
                    threshold: 0.1,
                }
            );
            observerRef.current.observe(loadMoreRef.current);
            return () => {
                observerRef.current?.disconnect();
            };
            // eslint-disable-next-line react-hooks/exhaustive-deps
        },
        [
            /* trigger after filtered recalculated */
        ]
    );

    // manage global tick interval when there are tokens present
    useEffect(() => {
        const hasActiveTokens = Object.keys(tokens).length > 0;
        if (hasActiveTokens && tickRef.current === null) {
            tickRef.current = window.setInterval(() => {
                setTick((t) => t + 1);
            }, 1000);
        }
        if (!hasActiveTokens && tickRef.current !== null) {
            window.clearInterval(tickRef.current);
            tickRef.current = null;
            setTick(0);
        }

        return () => {
            if (tickRef.current !== null) {
                window.clearInterval(tickRef.current);
                tickRef.current = null;
            }
        };
    }, [tokens]);

    // regenerate expired tokens on each tick (local fallback)
    useEffect(() => {
        if (Object.keys(tokens).length === 0) return;
        const now = Date.now();
        let changed = false;
        const next = { ...tokens };
        Object.entries(next).forEach(([id, info]) => {
            if (info.expiresAt <= now) {
                // expire locally - remove
                delete next[id];
                changed = true;
            }
        });
        if (changed) {
            setTokens(next);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tick]);

    const mapVeterinaria = (p: BackendVeterinaria): Veterinaria => {
        const horarios = p.openingHours?.split(",")[0] ?? "";
        const apertura = horarios.includes(":")
            ? horarios.split(" ")[1]?.split("-")[0]
            : "";
        const cierre = horarios.includes(":")
            ? horarios.split(" ")[1]?.split("-")[1]
            : "";

        return {
            id: p.id,
            slug: p.slug,
            nombre: p.name,
            direccion: p.address,
            telefono: p.phone,
            ciudad: p.city ?? "",
            provincia: p.province ?? "",
            latitud: p.coordinates?.latitude ?? 0,
            longitud: p.coordinates?.longitude ?? 0,
            horarioApertura: apertura ?? "",
            horarioCierre: cierre ?? "",
            distancia: p.distance ?? undefined,
            beneficios: p.benefits ?? "",
            descuento: p.discount ?? undefined,
            isClaimed: p.isClaimed ?? false,
        };
    };

    const normalizeResponseToArray = (raw: any): BackendVeterinaria[] => {
        if (!raw) return [];
        if (Array.isArray(raw)) return raw as BackendVeterinaria[];
        if (Array.isArray(raw.veterinarias))
            return raw.veterinarias as BackendVeterinaria[];
        if (raw.data) {
            if (Array.isArray(raw.data)) return raw.data as BackendVeterinaria[];
            if (Array.isArray(raw.data.veterinarias))
                return raw.data.veterinarias as BackendVeterinaria[];
            if (Array.isArray(raw.data.data))
                return raw.data.data as BackendVeterinaria[];
        }
        const possible =
            raw.veterinarias ??
            raw.data ??
            raw.data?.veterinarias ??
            raw.data?.data ??
            null;
        if (Array.isArray(possible)) return possible as BackendVeterinaria[];
        return [];
    };

    const loadVeterinarias = async () => {
        setIsLoading(true);
        setError("");

        try {
            let raw: any;

            if (
                useLocation &&
                user?.location?.coordinates &&
                user.location.coordinates.length === 2
            ) {
                const [longitude, latitude] = user.location.coordinates;
                raw = await veterinariaService.getNearbyVeterinarias(
                    latitude,
                    longitude
                );
            } else {
                raw = await veterinariaService.getAllVeterinarias();
            }

            const dataArray = normalizeResponseToArray(raw);
            if (!Array.isArray(dataArray)) {
                throw new Error(
                    "El endpoint no devolvió un array de veterinarias"
                );
            }

            const mapped = dataArray.map(mapVeterinaria);
            setVeterinarias(mapped);
        } catch (err) {
            const errorObj = err as {
                response?: { data?: { message?: string } };
                message?: string;
            };
            const msg =
                errorObj.response?.data?.message ||
                errorObj.message ||
                "Error al cargar veterinarias";
            setError(msg);
            setVeterinarias([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLocationToggle = () => {
        if (
            !user?.location?.coordinates ||
            user.location.coordinates.length !== 2
        ) {
            setError(
                "No tienes ubicación configurada. Por favor actualiza tu perfil."
            );
            return;
        }
        setError("");
        const next = !useLocation;
        setUseLocation(next);
        try {
            localStorage.setItem("veterinarias_useLocation", String(next));
        } catch {
            // ignore
        }
    };

    // function generate6Digit() {
    //     return Math.floor(100000 + Math.random() * 900000).toString();
    // }

    // Create request (calls backend). Supports anonymous users: provide userSnapshot in payload.
    const handleCreateRequest = async (veterinariaId: string) => {
        // form for this veterinaria
        const form = requestForms[veterinariaId] || {
            actionType: "consulta_medica",
            notes: "",
        };
        setRequestForms((s) => ({
            ...s,
            [veterinariaId]: { ...(s[veterinariaId] || {}), loading: true },
        }));
        try {
            // ... dentro handleCreateRequest for veterinaria
            const payload: any = {
                targetType: "veterinaria",
                targetId: veterinariaId,
                actionType: form.actionType,
                notes: form.notes,
                metadata: {}, // opcional
            };
            // attach userSnapshot as before

            // if logged in attach nothing (server will read req.user) otherwise attach userSnapshot
            if (!user) {
                // For anonymous, demand a short name/email - here we try to pull from localStorage or ask user
                payload.userSnapshot = {
                    name: localStorage.getItem("anon_name") || "Invitado",
                    email: localStorage.getItem("anon_email") || "",
                    telefono: "",
                };
            }

            const res = await requestService.createRequest(payload);
            const created = res?.data?.request ?? res?.request ?? res;

            // set token in local state so user sees it
            if (created?.token && created?.expiresAt) {
                setTokens((t) => ({
                    ...t,
                    [veterinariaId]: {
                        code: created.token,
                        expiresAt: new Date(created.expiresAt).getTime(),
                    },
                }));
            }

            // Optionally show a success toast (not implemented here)
        } catch (err: any) {
            console.error("createRequest error", err);
            setError(
                err?.response?.data?.message ||
                    err.message ||
                    "Error al crear solicitud"
            );
        } finally {
            setRequestForms((s) => ({
                ...s,
                [veterinariaId]: { ...(s[veterinariaId] || {}), loading: false },
            }));
        }
    };

    const handleRequestFormChange = (
        veterinariaId: string,
        field: "actionType" | "notes",
        value: string
    ) => {
        setRequestForms((s) => ({
            ...s,
            [veterinariaId]: {
                ...(s[veterinariaId] || { actionType: "consulta_medica", notes: "" }),
                [field]: value,
            },
        }));
    };

    const getRemainingMs = (id: string) => {
        const info = tokens[id];
        if (!info) return 0;
        return Math.max(0, info.expiresAt - Date.now());
    };

    const formatMsToMMSS = (ms: number) => {
        const totalSec = Math.ceil(ms / 1000);
        const mm = Math.floor(totalSec / 60)
            .toString()
            .padStart(2, "0");
        const ss = Math.floor(totalSec % 60)
            .toString()
            .padStart(2, "0");
        return `${mm}:${ss}`;
    };

    // filter by debounced search
    const filtered = useMemo(() => {
        const q = debouncedSearch;
        if (!q) return veterinarias;
        return veterinarias.filter((p) => {
            return (
                p.nombre.toLowerCase().includes(q) ||
                (p.beneficios || "").toLowerCase().includes(q)
            );
        });
    }, [veterinarias, debouncedSearch]);

    // displayed slice for pagination
    const displayed = useMemo(
        () => filtered.slice(0, visibleCount),
        [filtered, visibleCount]
    );

    const waitingSearch =
        search.trim().length > 0 &&
        debouncedSearch !== search.trim().toLowerCase();

    if (isLoading) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-10">
                <div className="mb-8">
                    <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse mb-2" />
                    <div className="h-4 w-72 bg-gray-100 rounded animate-pulse" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse">
                            <div className="flex items-start gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-gray-200 shrink-0" />
                                <div className="flex-1">
                                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                                    <div className="h-3 bg-gray-100 rounded w-full" />
                                </div>
                            </div>
                            <div className="flex gap-2 mb-4">
                                <div className="h-6 w-16 bg-gray-100 rounded-full" />
                                <div className="h-6 w-20 bg-gray-100 rounded-full" />
                            </div>
                            <div className="h-9 bg-gray-100 rounded-lg" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto pb-safe">

            {/* App Hero — card in mobile, full-bleed on sm+ */}
            <div className="px-4 py-6 sm:px-4 sm:py-0">
            <div className="bg-gradient-to-br from-brand-900 via-brand-700 to-brand-600 px-4 pt-6 pb-5 rounded-[2rem] sm:rounded-[2rem] sm:shadow-xl sm:p-8">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center">
                            <BuildingStorefrontIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white leading-tight">Veterinarias</h1>
                            <p className="text-xs text-brand-100">{filtered.length} disponibles</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLocationToggle}
                        aria-pressed={useLocation}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                            useLocation
                                ? "bg-white text-brand-700"
                                : "bg-white/15 text-white border border-white/30"
                        }`}
                    >
                        <MapPinIcon className="w-3.5 h-3.5" />
                        {useLocation ? "Cercanas" : "Ver cercanas"}
                    </button>
                </div>

                {/* Sticky search */}
                <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                        id="veterinaria-search"
                        type="text"
                        placeholder="Buscar por nombre o beneficio…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 rounded-2xl text-sm bg-white border-0 focus:outline-none focus:ring-2 focus:ring-brand-400 shadow-sm"
                        aria-label="Buscar veterinarias"
                    />
                    {search ? (
                        <button
                            onClick={() => setSearch("")}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                            aria-label="Limpiar búsqueda"
                        >
                            <XMarkIcon className="w-4 h-4" />
                        </button>
                    ) : waitingSearch ? (
                        <ArrowPathIcon className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" aria-hidden />
                    ) : null}
                </div>
            </div>{/* end gradient hero */}
            </div>{/* end sm:px wrapper */}

            <div className="px-4 pt-4">

            {/* Error */}
            {error && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
                    <ExclamationCircleIcon className="w-5 h-5 shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}

            {debouncedSearch && (
                <p className="text-xs text-gray-400 mb-3">
                    {filtered.length === 0 ? "Sin resultados" : `${filtered.length} resultado${filtered.length !== 1 ? "s" : ""} para "${debouncedSearch}"`}
                </p>
            )}

            {/* Empty state */}
            {filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-14 flex flex-col items-center text-center">
                    <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                        <BuildingStorefrontIcon className="w-7 h-7 text-gray-300" />
                    </div>
                    <p className="text-gray-500 text-sm">
                        {search ? `No encontramos veterinarias para "${search}".` : "No hay veterinarias disponibles en este momento."}
                    </p>
                    {search && (
                        <button onClick={() => setSearch("")} className="mt-3 text-xs text-brand-600 hover:underline">
                            Limpiar búsqueda
                        </button>
                    )}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {displayed.map((veterinaria) => {
                            const tokenInfo = tokens[veterinaria.id];
                            const remainingMs = getRemainingMs(veterinaria.id);
                            const form = requestForms[veterinaria.id] || {
                                actionType: "consulta_medica",
                                notes: "",
                                loading: false,
                            };
                            const progressPct = tokenInfo
                                ? Math.max(0, (remainingMs / (2 * 60 * 1000)) * 100)
                                : 0;

                            return (
                                <article
                                    key={veterinaria.id}
                                    className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col"
                                >
                                    {/* Card header */}
                                    <div className="p-4 md:p-5">
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className="font-semibold text-gray-900 text-lg leading-snug truncate">
                                                {veterinaria.nombre}
                                            </h3>
                                            {veterinaria.isClaimed && veterinaria.descuento !== undefined && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 whitespace-nowrap shrink-0">
                                                    <TagIcon className="w-3 h-3" />
                                                    {veterinaria.descuento}% off
                                                </span>
                                            )}
                                        </div>
                                        {veterinaria.direccion && (
                                            <p className="text-xs text-gray-400 truncate mt-0.5" title={veterinaria.direccion}>
                                                {veterinaria.direccion}
                                                {veterinaria.ciudad ? `, ${veterinaria.ciudad}` : ""}
                                                {veterinaria.provincia ? `, ${veterinaria.provincia}` : ""}
                                            </p>
                                        )}
                                        {!veterinaria.isClaimed && (
                                            <span className="inline-flex items-center mt-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-500">
                                                No registrada en VetFind
                                            </span>
                                        )}
                                    </div>

                                    {!veterinaria.isClaimed ? (
                                        /* Unclaimed listing: just an indexed reference, nobody manages requests here yet */
                                        <div className="mt-auto px-4 md:px-5 pb-4 md:pb-5">
                                            <div className="border-t border-gray-100 mb-4" />
                                            <div className="flex items-center gap-2">
                                                {veterinaria.telefono ? (
                                                    <a
                                                        href={`tel:${veterinaria.telefono}`}
                                                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-50 text-emerald-700 text-sm font-semibold active:scale-95 transition"
                                                    >
                                                        <PhoneIcon className="w-4 h-4" />
                                                        Llamar
                                                    </a>
                                                ) : (
                                                    <p className="flex-1 text-xs text-gray-400 flex items-center justify-center">
                                                        Sin teléfono
                                                    </p>
                                                )}
                                                {veterinaria.latitud && veterinaria.longitud ? (
                                                    <a
                                                        href={`https://www.google.com/maps/search/?api=1&query=${veterinaria.latitud},${veterinaria.longitud}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 rounded-2xl bg-brand-50 text-brand-700 text-sm font-semibold active:scale-95 transition"
                                                        title="Ver ubicación"
                                                    >
                                                        <span className="inline-flex items-center gap-2">
                                                            <MapPinIcon className="w-4 h-4" />
                                                            Ubicación
                                                        </span>
                                                        {veterinaria.distancia !== undefined && (
                                                            <span className="text-[11px] font-normal text-brand-600">
                                                                {(veterinaria.distancia / 1000).toFixed(1)} km
                                                            </span>
                                                        )}
                                                    </a>
                                                ) : (
                                                    <div className="flex-1" />
                                                )}
                                                <Link
                                                    to={veterinariaDetailPath(veterinaria)}
                                                    title="Ver ficha completa"
                                                    className="shrink-0 w-12 h-12 flex items-center justify-center rounded-2xl bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700 active:scale-95 transition"
                                                >
                                                    <PlusIcon className="w-4 h-4" />
                                                </Link>
                                            </div>
                                        </div>
                                    ) : (
                                    <>
                                    {/* Badges row */}
                                    <div className="px-4 md:px-5 pb-3 flex flex-wrap gap-1.5">
                                        {veterinaria.distancia !== undefined && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-600">
                                                <MapPinIcon className="w-3 h-3" />
                                                {(veterinaria.distancia / 1000).toFixed(1)} km
                                            </span>
                                        )}
                                        {veterinaria.horarioApertura && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-500">
                                                <ClockIcon className="w-3 h-3" />
                                                {veterinaria.horarioApertura}
                                                {veterinaria.horarioCierre ? ` - ${veterinaria.horarioCierre}` : ""}
                                            </span>
                                        )}
                                    </div>

                                    {/* Details */}
                                    <div className="mt-auto">
                                        <div className="border-t border-gray-100 mx-5" />
                                        <div className="px-5 py-4 space-y-3 text-sm text-gray-700">
                                            {veterinaria.beneficios && (
                                                <div className="bg-amber-50 rounded-lg px-3 py-2 text-xs text-amber-800">
                                                    <span className="font-semibold">Beneficios: </span>
                                                    {veterinaria.beneficios}
                                                </div>
                                            )}
                                            {/* Big tap-friendly action buttons */}
                                            <div className="flex items-center gap-2">
                                                {veterinaria.telefono && (
                                                    <a
                                                        href={`tel:${veterinaria.telefono}`}
                                                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-50 text-emerald-700 text-sm font-semibold active:scale-95 transition"
                                                    >
                                                        <PhoneIcon className="w-4 h-4" />
                                                        Llamar
                                                    </a>
                                                )}
                                                {veterinaria.latitud && veterinaria.longitud ? (
                                                    <a
                                                        href={`https://www.google.com/maps/search/?api=1&query=${veterinaria.latitud},${veterinaria.longitud}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-brand-50 text-brand-700 text-sm font-semibold active:scale-95 transition"
                                                    >
                                                        <MapIcon className="w-4 h-4" />
                                                        Cómo llegar
                                                    </a>
                                                ) : veterinaria.telefono ? null : (
                                                    <div className="flex-1" />
                                                )}
                                                <Link
                                                    to={veterinariaDetailPath(veterinaria)}
                                                    title="Ver ficha completa"
                                                    className="shrink-0 w-12 h-12 flex items-center justify-center rounded-2xl bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700 active:scale-95 transition"
                                                >
                                                    <PlusIcon className="w-4 h-4" />
                                                </Link>
                                            </div>
                                        </div>

                                        {/* Request section */}
                                        {user?.role !== "veterinaria" && (
                                            <div className="px-5 pb-5">
                                                <div className="border-t border-gray-100 mb-4" />

                                                {tokenInfo ? (
                                                    /* Token display */
                                                    <div className="space-y-3">
                                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                                                            Código de solicitud
                                                        </p>
                                                        <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                                                            <KeyIcon className="w-4 h-4 text-gray-400 shrink-0" />
                                                            <code className="flex-1 text-sm font-mono font-semibold text-gray-800">
                                                                {tokenInfo.code}
                                                            </code>
                                                            <button
                                                                onClick={() =>
                                                                    navigator.clipboard?.writeText(tokenInfo.code).then(() => {
                                                                        setCopyFeedback((s) => ({ ...s, [veterinaria.id]: true }));
                                                                        setTimeout(() => setCopyFeedback((s) => ({ ...s, [veterinaria.id]: false })), 1600);
                                                                    })
                                                                }
                                                                className="text-gray-400 hover:text-gray-700 transition"
                                                                title="Copiar código"
                                                            >
                                                                {copyFeedback[veterinaria.id]
                                                                    ? <CheckIcon className="w-4 h-4 text-emerald-500" />
                                                                    : <ClipboardDocumentIcon className="w-4 h-4" />
                                                                }
                                                            </button>
                                                        </div>
                                                        {/* Countdown progress */}
                                                        <div>
                                                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                                                                <span>Expira en</span>
                                                                <span className={`font-mono font-medium ${remainingMs < 30000 ? "text-red-500" : "text-gray-600"}`}>
                                                                    {formatMsToMMSS(remainingMs)}
                                                                </span>
                                                            </div>
                                                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full transition-all duration-1000 ${
                                                                        progressPct > 50 ? "bg-emerald-500" : progressPct > 20 ? "bg-amber-400" : "bg-red-500"
                                                                    }`}
                                                                    style={{ width: `${progressPct}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    /* Request form */
                                                    <div className="space-y-3">
                                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                                                            Realizar solicitud
                                                        </p>
                                                        <div>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                {VETERINARIA_ACTION_TYPES.map((at) => {
                                                                    const selected = form.actionType === at.value;
                                                                    return (
                                                                        <button
                                                                            key={at.value}
                                                                            type="button"
                                                                            disabled={!user}
                                                                            onClick={() =>
                                                                                handleRequestFormChange(veterinaria.id, "actionType", at.value)
                                                                            }
                                                                            aria-pressed={selected}
                                                                            className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 px-3 py-3 text-xs font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${
                                                                                selected
                                                                                    ? "border-brand-500 bg-brand-50 text-brand-700"
                                                                                    : "border-gray-200 bg-white text-gray-600 hover:border-brand-300 hover:bg-brand-50/50"
                                                                            }`}
                                                                        >
                                                                            <at.Icon className="w-5 h-5" />
                                                                            {at.label}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                                                Observaciones
                                                            </label>
                                                            <input
                                                                value={form.notes}
                                                                onChange={(e) =>
                                                                    handleRequestFormChange(veterinaria.id, "notes", e.target.value)
                                                                }
                                                                disabled={!user}
                                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition placeholder-gray-400 disabled:bg-gray-50 disabled:text-gray-400"
                                                                placeholder="Detalles, receta, preferencia..."
                                                            />
                                                        </div>
                                                        {user ? (
                                                            <button
                                                                disabled={form.loading}
                                                                onClick={() => handleCreateRequest(veterinaria.id)}
                                                                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-2xl active:scale-[0.98] transition"
                                                            >
                                                                {form.loading ? (
                                                                    <>
                                                                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                                                        </svg>
                                                                        Enviando...
                                                                    </>
                                                                ) : (
                                                                    "Realizar pedido"
                                                                )}
                                                            </button>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => navigate("/login")}
                                                                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-2xl active:scale-[0.98] transition"
                                                            >
                                                                Iniciá sesión para solicitar
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    </>
                                    )}
                                </article>
                            );
                        })}
                    </div>

                    {/* Load more */}
                    <div className="mt-8 flex flex-col items-center gap-3">
                        {visibleCount < filtered.length ? (
                            <>
                                <button
                                    onClick={() => setVisibleCount((c) => Math.min(filtered.length, c + PAGE_SIZE))}
                                    className="px-6 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:border-brand-400 hover:text-brand-600 hover:bg-brand-50 transition"
                                >
                                    Cargar más veterinarias
                                </button>
                                <p className="text-xs text-gray-400">
                                    Mostrando {displayed.length} de {filtered.length}
                                </p>
                                <div ref={loadMoreRef} className="w-full h-1" aria-hidden />
                            </>
                        ) : (
                            <p className="text-xs text-gray-400">
                                {filtered.length > 0 ? `Mostrando las ${filtered.length} veterinarias disponibles` : ""}
                            </p>
                        )}
                    </div>
                </>
            )}            </div>{/* end inner px-4 */}            <BottomNavMenu />        </div>
    );
};
