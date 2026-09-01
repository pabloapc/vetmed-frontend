import React, { useState, useEffect, useMemo, useRef } from "react";
import { pharmacyService } from "../services/pharmacyService";
import { requestService } from "../services/requestService";
import type { Pharmacy, BackendPharmacy } from "../types/pharmacy";
import { useAuth } from "../hooks/useAuth";
import { BottomNavMenu } from "../components/BottomNavMenu";

import {
    MagnifyingGlassIcon,
    MapPinIcon,
    MapIcon,
    ArrowPathIcon,
    BuildingStorefrontIcon,
    ChevronDownIcon,
    InformationCircleIcon,
    PhoneIcon,
    ClockIcon,
    TagIcon,
    XMarkIcon,
    KeyIcon,
    ClipboardDocumentIcon,
    CheckIcon,
    ExclamationCircleIcon,
} from "@heroicons/react/24/outline";

const PAGE_SIZE = 9;
//const TOKEN_TTL_MS = 2 * 60 * 1000; // 2 minutes

type TokenInfo = {
    code: string;
    expiresAt: number; // timestamp ms
};

export const Pharmacies: React.FC = () => {
    const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [useLocation, setUseLocation] = useState<boolean>(() => {
        try {
            const raw = localStorage.getItem("pharmacies_useLocation");
            return raw === "true";
        } catch {
            return false;
        }
    });
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
    const [copyFeedback, setCopyFeedback] = useState<Record<string, boolean>>(
        {}
    );
    const { user } = useAuth();

    // tokens state: a mapping pharmacyId -> TokenInfo
    const [tokens, setTokens] = useState<Record<string, TokenInfo>>({});
    // requestForms per pharmacy
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
        loadPharmacies();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [useLocation, user]);

    useEffect(() => {
        setVisibleCount(PAGE_SIZE);
    }, [debouncedSearch, pharmacies]);

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

    const mapPharmacy = (p: BackendPharmacy): Pharmacy => {
        const horarios = p.openingHours?.split(",")[0] ?? "";
        const apertura = horarios.includes(":")
            ? horarios.split(" ")[1]?.split("-")[0]
            : "";
        const cierre = horarios.includes(":")
            ? horarios.split(" ")[1]?.split("-")[1]
            : "";

        return {
            id: p.id,
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
        };
    };

    const normalizeResponseToArray = (raw: any): BackendPharmacy[] => {
        if (!raw) return [];
        if (Array.isArray(raw)) return raw as BackendPharmacy[];
        if (Array.isArray(raw.pharmacies))
            return raw.pharmacies as BackendPharmacy[];
        if (raw.data) {
            if (Array.isArray(raw.data)) return raw.data as BackendPharmacy[];
            if (Array.isArray(raw.data.pharmacies))
                return raw.data.pharmacies as BackendPharmacy[];
            if (Array.isArray(raw.data.data))
                return raw.data.data as BackendPharmacy[];
        }
        const possible =
            raw.pharmacies ??
            raw.data ??
            raw.data?.pharmacies ??
            raw.data?.data ??
            null;
        if (Array.isArray(possible)) return possible as BackendPharmacy[];
        return [];
    };

    const loadPharmacies = async () => {
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
                raw = await pharmacyService.getNearbyPharmacies(
                    latitude,
                    longitude
                );
            } else {
                raw = await pharmacyService.getAllPharmacies();
            }

            const dataArray = normalizeResponseToArray(raw);
            if (!Array.isArray(dataArray)) {
                throw new Error(
                    "El endpoint no devolvió un array de farmacias"
                );
            }

            const mapped = dataArray.map(mapPharmacy);
            setPharmacies(mapped);
        } catch (err) {
            const errorObj = err as {
                response?: { data?: { message?: string } };
                message?: string;
            };
            const msg =
                errorObj.response?.data?.message ||
                errorObj.message ||
                "Error al cargar farmacias";
            setError(msg);
            setPharmacies([]);
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
            localStorage.setItem("pharmacies_useLocation", String(next));
        } catch {
            // ignore
        }
    };

    const toggleExpand = (id: string) => {
        setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const openDetailsAndRequest = (id: string) => {
        setExpandedIds((prev) => ({ ...prev, [id]: true }));
        window.setTimeout(() => {
            const details = document.getElementById(`details-${id}`);
            details?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 120);
    };

    // function generate6Digit() {
    //     return Math.floor(100000 + Math.random() * 900000).toString();
    // }

    // Create request (calls backend). Supports anonymous users: provide userSnapshot in payload.
    const handleCreateRequest = async (pharmacyId: string) => {
        // form for this pharmacy
        const form = requestForms[pharmacyId] || {
            actionType: "medicamento",
            notes: "",
        };
        setRequestForms((s) => ({
            ...s,
            [pharmacyId]: { ...(s[pharmacyId] || {}), loading: true },
        }));
        try {
            // ... dentro handleCreateRequest for pharmacy
            const payload: any = {
                targetType: "pharmacy",
                targetId: pharmacyId,
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
                    [pharmacyId]: {
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
                [pharmacyId]: { ...(s[pharmacyId] || {}), loading: false },
            }));
        }
    };

    const handleRequestFormChange = (
        pharmacyId: string,
        field: "actionType" | "notes",
        value: string
    ) => {
        setRequestForms((s) => ({
            ...s,
            [pharmacyId]: {
                ...(s[pharmacyId] || { actionType: "medicamento", notes: "" }),
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
        if (!q) return pharmacies;
        return pharmacies.filter((p) => {
            return (
                p.nombre.toLowerCase().includes(q) ||
                (p.beneficios || "").toLowerCase().includes(q)
            );
        });
    }, [pharmacies, debouncedSearch]);

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
            <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 px-4 pt-6 pb-5 rounded-[2rem] sm:rounded-[2rem] sm:shadow-xl sm:p-8">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center">
                            <BuildingStorefrontIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white leading-tight">Farmacias</h1>
                            <p className="text-xs text-blue-100">{filtered.length} disponibles</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLocationToggle}
                        aria-pressed={useLocation}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                            useLocation
                                ? "bg-white text-blue-700"
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
                        id="pharmacy-search"
                        type="text"
                        placeholder="Buscar por nombre o beneficio…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 rounded-2xl text-sm bg-white border-0 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
                        aria-label="Buscar farmacias"
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
                        {search ? `No encontramos farmacias para "${search}".` : "No hay farmacias disponibles en este momento."}
                    </p>
                    {search && (
                        <button onClick={() => setSearch("")} className="mt-3 text-xs text-blue-600 hover:underline">
                            Limpiar búsqueda
                        </button>
                    )}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {displayed.map((pharmacy) => {
                            const expanded = !!expandedIds[pharmacy.id];
                            const tokenInfo = tokens[pharmacy.id];
                            const remainingMs = getRemainingMs(pharmacy.id);
                            const form = requestForms[pharmacy.id] || {
                                actionType: "medicamento",
                                notes: "",
                                loading: false,
                            };
                            const progressPct = tokenInfo
                                ? Math.max(0, (remainingMs / (2 * 60 * 1000)) * 100)
                                : 0;

                            return (
                                <article
                                    key={pharmacy.id}
                                    className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col"
                                >
                                    {/* Card header */}
                                    <div className="p-4 md:p-5 flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                                            <BuildingStorefrontIcon className="w-5 h-5 text-amber-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <h3 className="font-semibold text-gray-900 text-sm leading-snug truncate">
                                                    {pharmacy.nombre}
                                                </h3>
                                                {pharmacy.descuento !== undefined && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 whitespace-nowrap shrink-0">
                                                        <TagIcon className="w-3 h-3" />
                                                        {pharmacy.descuento}% off
                                                    </span>
                                                )}
                                            </div>
                                            {pharmacy.direccion && (
                                                <p className="text-xs text-gray-400 truncate mt-0.5" title={pharmacy.direccion}>
                                                    {pharmacy.direccion}
                                                    {pharmacy.ciudad ? `, ${pharmacy.ciudad}` : ""}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Badges row */}
                                    <div className="px-4 md:px-5 pb-3 flex flex-wrap gap-1.5">
                                        {pharmacy.distancia !== undefined && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
                                                <MapPinIcon className="w-3 h-3" />
                                                {(pharmacy.distancia / 1000).toFixed(1)} km
                                            </span>
                                        )}
                                        {pharmacy.horarioApertura && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-500">
                                                <ClockIcon className="w-3 h-3" />
                                                {pharmacy.horarioApertura}
                                                {pharmacy.horarioCierre ? ` - ${pharmacy.horarioCierre}` : ""}
                                            </span>
                                        )}
                                    </div>

                                    {/* Toggle button */}
                                    <div className="px-4 md:px-5 pb-4 md:pb-5 mt-auto">
                                        <div className="grid grid-cols-2 gap-2 md:hidden">
                                            <button
                                                onClick={() => toggleExpand(pharmacy.id)}
                                                aria-expanded={expanded}
                                                aria-controls={`details-${pharmacy.id}`}
                                                className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white active:scale-[0.99] transition"
                                            >
                                                <InformationCircleIcon className="w-4 h-4 text-blue-600" />
                                                {expanded ? "Ocultar" : "Detalle"}
                                            </button>

                                            <button
                                                onClick={() => openDetailsAndRequest(pharmacy.id)}
                                                className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.99] transition"
                                            >
                                                Solicitar
                                            </button>
                                        </div>

                                        <button
                                            onClick={() => toggleExpand(pharmacy.id)}
                                            aria-expanded={expanded}
                                            aria-controls={`details-${pharmacy.id}`}
                                            className="hidden md:flex w-full items-center justify-center gap-1.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition"
                                        >
                                            {expanded ? "Ocultar detalles" : "Ver detalles y solicitar"}
                                            <ChevronDownIcon
                                                className={`w-4 h-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                                            />
                                        </button>
                                    </div>

                                    {/* Expandable section */}
                                    <div
                                        id={`details-${pharmacy.id}`}
                                        className={`overflow-hidden transition-[max-height,opacity] duration-300 ${
                                            expanded ? "max-h-[700px] opacity-100" : "max-h-0 opacity-0"
                                        }`}
                                    >
                                        <div className="border-t border-gray-100 mx-5" />
                                        <div className="px-5 py-4 space-y-3 text-sm text-gray-700">
                                            {pharmacy.beneficios && (
                                                <div className="bg-amber-50 rounded-lg px-3 py-2 text-xs text-amber-800">
                                                    <span className="font-semibold">Beneficios: </span>
                                                    {pharmacy.beneficios}
                                                </div>
                                            )}
                                            {/* Big tap-friendly action buttons */}
                                            <div className="grid grid-cols-2 gap-2">
                                                {pharmacy.telefono && (
                                                    <a
                                                        href={`tel:${pharmacy.telefono}`}
                                                        className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-50 text-emerald-700 text-sm font-semibold active:scale-95 transition"
                                                    >
                                                        <PhoneIcon className="w-4 h-4" />
                                                        Llamar
                                                    </a>
                                                )}
                                                {pharmacy.latitud && pharmacy.longitud ? (
                                                    <a
                                                        href={`https://www.google.com/maps/search/?api=1&query=${pharmacy.latitud},${pharmacy.longitud}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-blue-50 text-blue-700 text-sm font-semibold active:scale-95 transition"
                                                    >
                                                        <MapIcon className="w-4 h-4" />
                                                        Cómo llegar
                                                    </a>
                                                ) : pharmacy.telefono ? null : (
                                                    <div />
                                                )}
                                            </div>
                                        </div>

                                        {/* Request section */}
                                        {user?.role !== "pharmacy" && (
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
                                                                        setCopyFeedback((s) => ({ ...s, [pharmacy.id]: true }));
                                                                        setTimeout(() => setCopyFeedback((s) => ({ ...s, [pharmacy.id]: false })), 1600);
                                                                    })
                                                                }
                                                                className="text-gray-400 hover:text-gray-700 transition"
                                                                title="Copiar código"
                                                            >
                                                                {copyFeedback[pharmacy.id]
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
                                                            <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                                                Tipo de solicitud
                                                            </label>
                                                            <select
                                                                value={form.actionType}
                                                                onChange={(e) =>
                                                                    handleRequestFormChange(pharmacy.id, "actionType", e.target.value)
                                                                }
                                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                                            >
                                                                <option value="medicamento">Medicamento</option>
                                                                <option value="pedido_medico">Pedido médico</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                                                Observaciones
                                                            </label>
                                                            <input
                                                                value={form.notes}
                                                                onChange={(e) =>
                                                                    handleRequestFormChange(pharmacy.id, "notes", e.target.value)
                                                                }
                                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition placeholder-gray-400"
                                                                placeholder="Detalles, receta, preferencia..."
                                                            />
                                                        </div>
                                                        <button
                                                            disabled={form.loading}
                                                            onClick={() => handleCreateRequest(pharmacy.id)}
                                                            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-2xl active:scale-[0.98] transition"
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
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
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
                                    className="px-6 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition"
                                >
                                    Cargar más farmacias
                                </button>
                                <p className="text-xs text-gray-400">
                                    Mostrando {displayed.length} de {filtered.length}
                                </p>
                                <div ref={loadMoreRef} className="w-full h-1" aria-hidden />
                            </>
                        ) : (
                            <p className="text-xs text-gray-400">
                                {filtered.length > 0 ? `Mostrando las ${filtered.length} farmacias disponibles` : ""}
                            </p>
                        )}
                    </div>
                </>
            )}            </div>{/* end inner px-4 */}            <BottomNavMenu />        </div>
    );
};
