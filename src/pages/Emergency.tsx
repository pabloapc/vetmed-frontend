import React, { useEffect, useMemo, useRef, useState } from "react";
import emergencyService from "../services/emergencyService";
import requestService from "../services/requestService";
import { useAuth } from "../hooks/useAuth";
import { BottomNavMenu } from "../components/BottomNavMenu";
import {
    MagnifyingGlassIcon,
    MapPinIcon,
    MapIcon,
    ArrowPathIcon,
    PhoneIcon,
    KeyIcon,
    ClipboardDocumentIcon,
    CheckIcon,
    ExclamationTriangleIcon,
    ExclamationCircleIcon,
    XMarkIcon,
    ChevronDownIcon,
    LinkIcon,
} from "@heroicons/react/24/outline";

const PAGE_SIZE = 9;

type EmergencyBackend = any;
type Emergency = {
    id: string;
    nombre: string;
    direccion?: string;
    telefono?: string;
    ciudad?: string;
    provincia?: string;
    latitud?: number;
    longitud?: number;
    distancia?: number; // meters
    url?: string;
};

type TokenInfo = {
    code: string;
    expiresAt: number;
};

export const Emergencies: React.FC = () => {
    const [items, setItems] = useState<Emergency[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [useLocation, setUseLocation] = useState<boolean>(() => {
        try {
            return localStorage.getItem("emergencies_useLocation") === "true";
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

    const [tokens, setTokens] = useState<Record<string, TokenInfo>>({});
    const [tick, setTick] = useState(0);
    const tickRef = useRef<number | null>(null);

    // requestForms per emergency (only actionType & loading)
    const [requestForms, setRequestForms] = useState<
        Record<string, { actionType: string; loading?: boolean }>
    >({});

    // pagination / lazy load
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const loadMoreRef = useRef<HTMLDivElement | null>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);

    // debounce search
    useEffect(() => {
        const t = window.setTimeout(() => {
            setDebouncedSearch(search.trim().toLowerCase());
        }, 300);
        return () => clearTimeout(t);
    }, [search]);

    useEffect(() => {
        loadEmergencies();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [useLocation, user]);

    useEffect(() => {
        setVisibleCount(PAGE_SIZE);
    }, [debouncedSearch, items]);

    useEffect(
        () => {
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
                { root: null, rootMargin: "200px", threshold: 0.1 }
            );
            observerRef.current.observe(loadMoreRef.current);
            return () => observerRef.current?.disconnect();
            // eslint-disable-next-line react-hooks/exhaustive-deps
        },
        [
            /* filtered triggers later */
        ]
    );

    // manage tick for tokens
    useEffect(() => {
        const hasActive = Object.keys(tokens).length > 0;
        if (hasActive && tickRef.current === null) {
            tickRef.current = window.setInterval(
                () => setTick((t) => t + 1),
                1000
            );
        }
        if (!hasActive && tickRef.current !== null) {
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

    useEffect(() => {
        if (Object.keys(tokens).length === 0) return;
        const now = Date.now();
        let changed = false;
        const next = { ...tokens };
        Object.entries(next).forEach(([id, info]) => {
            if (info.expiresAt <= now) {
                delete next[id];
                changed = true;
            }
        });
        if (changed) setTokens(next);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tick]);

    const mapEmergency = (e: EmergencyBackend): Emergency => {
        return {
            id: e.id ?? e._id ?? String(Math.random()),
            nombre: e.name ?? e.title ?? "Servicio",
            direccion: e.address ?? e.location_text ?? "",
            telefono: e.phone ?? e.telefono ?? "",
            ciudad: e.city ?? "",
            provincia: e.province ?? "",
            latitud:
                e.coordinates?.latitude ?? e.location?.coordinates?.[1] ?? 0,
            longitud:
                e.coordinates?.longitude ?? e.location?.coordinates?.[0] ?? 0,
            distancia: e.distance ?? undefined,
            url: e.url ?? "",
        };
    };

    const normalizeResponseToArray = (raw: any): EmergencyBackend[] => {
        if (!raw) return [];
        if (Array.isArray(raw)) return raw as EmergencyBackend[];
        if (Array.isArray(raw.emergencies))
            return raw.emergencies as EmergencyBackend[];
        if (raw.data) {
            if (Array.isArray(raw.data)) return raw.data as EmergencyBackend[];
            if (Array.isArray(raw.data.emergencies))
                return raw.data.emergencies as EmergencyBackend[];
            if (Array.isArray(raw.data.data))
                return raw.data.data as EmergencyBackend[];
        }
        const possible =
            raw.emergencies ??
            raw.data ??
            raw.data?.emergencies ??
            raw.data?.data ??
            null;
        if (Array.isArray(possible)) return possible as EmergencyBackend[];
        return [];
    };

    const loadEmergencies = async () => {
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
                raw = await emergencyService.getNearbyEmergencies(
                    latitude,
                    longitude
                );
            } else {
                raw = await emergencyService.getAllEmergencies();
            }
            const arr = normalizeResponseToArray(raw);
            const mapped = arr.map(mapEmergency);
            setItems(mapped);
        } catch (err: any) {
            const msg =
                err?.response?.data?.message ||
                err?.message ||
                "Error al cargar emergencias";
            setError(msg);
            setItems([]);
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
            localStorage.setItem("emergencies_useLocation", String(next));
        } catch {}
    };

    const toggleExpand = (id: string) =>
        setExpandedIds((p) => ({ ...p, [id]: !p[id] }));

    const getRemainingMs = (id: string) => {
        const t = tokens[id];
        if (!t) return 0;
        return Math.max(0, t.expiresAt - Date.now());
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

 

    // Create request for emergency (mirrors Veterinarias logic)
    const handleCreateRequest = async (emergencyId: string) => {
        const form = requestForms[emergencyId] || {
            actionType: "consulta_medica",
            notes: "",
        };
        setRequestForms((s) => ({
            ...s,
            [emergencyId]: { ...(s[emergencyId] || {}), loading: true },
        }));
        try {
            const payload: any = {
                targetType: "emergency",
                targetId: emergencyId,
                actionType: form.actionType,
                metadata: {},
                userSnapshot: user
                    ? {
                          name: user.name,
                          email: user.email,
                          telefono: user.telefono || "",
                      }
                    : {
                          name: localStorage.getItem("anon_name") || "Invitado",
                          email: localStorage.getItem("anon_email") || "",
                          telefono: "",
                      },
            };

            // Attach emergency target field so backend can adapt (if you implemented targetType/targetId)
            payload.emergencyId = emergencyId;

            // Include userSnapshot for anonymous users; server will resolve req.user if Authorization header present
            if (user) {
                payload.userSnapshot = {
                    name: user.name,
                    email: user.email,
                    telefono: (user as any).telefono || "",
                };
            } else {
                payload.userSnapshot = {
                    name: localStorage.getItem("anon_name") || "Invitado",
                    email: localStorage.getItem("anon_email") || "",
                    telefono: "",
                };
            }

            // Call unified createRequest endpoint
            const res = await requestService.createRequest(payload);
            const created = res?.data?.request ?? res?.request ?? res;

            if (created?.token && created?.expiresAt) {
                setTokens((t) => ({
                    ...t,
                    [emergencyId]: {
                        code: created.token,
                        expiresAt: new Date(created.expiresAt).getTime(),
                    },
                }));
            }
        } catch (err: any) {
            console.error("createRequest (emergency) error", err);
            setError(
                err?.response?.data?.message ||
                    err.message ||
                    "Error al crear solicitud"
            );
        } finally {
            setRequestForms((s) => ({
                ...s,
                [emergencyId]: { ...(s[emergencyId] || {}), loading: false },
            }));
        }
    };

    const handleRequestFormChange = (
        emergencyId: string,
        field: "actionType" | "notes",
        value: string
    ) => {
        setRequestForms((s) => ({
            ...s,
            [emergencyId]: {
                ...(s[emergencyId] || {
                    actionType: "consulta_medica",
                    notes: "",
                }),
                [field]: value,
            },
        }));
    };

    const filtered = useMemo(() => {
        const q = debouncedSearch;
        if (!q) return items;
        return items.filter((it) => {
            return (
                it.nombre?.toLowerCase().includes(q) ||
                (it.direccion ?? "").toLowerCase().includes(q) ||
                (it.ciudad ?? "").toLowerCase().includes(q)
            );
        });
    }, [items, debouncedSearch]);

    const displayed = useMemo(
        () => filtered.slice(0, visibleCount),
        [filtered, visibleCount]
    );

    const waitingSearch =
        search.trim().length > 0 &&
        debouncedSearch !== search.trim().toLowerCase();

    if (isLoading) {
        return (
            <div className="max-w-6xl mx-auto pb-safe">
                <div className="bg-gradient-to-br from-rose-700 via-red-600 to-orange-700 px-4 pt-6 pb-5 sm:mx-4 sm:mt-6 sm:rounded-[2rem] sm:shadow-xl sm:p-8 animate-pulse">
                    <div className="h-6 w-36 bg-white/30 rounded-xl mb-2" />
                    <div className="h-4 w-24 bg-white/20 rounded mb-4" />
                    <div className="h-10 bg-white/20 rounded-2xl" />
                </div>
                <div className="px-4 pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse">
                            <div className="flex items-start gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-gray-200 shrink-0" />
                                <div className="flex-1">
                                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                                    <div className="h-3 bg-gray-100 rounded w-full" />
                                </div>
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

            {/* Hero — card in mobile, full-bleed on sm+ */}
            <div className="px-4 py-6 sm:px-4 sm:py-0">
            <div className="bg-gradient-to-br from-rose-700 via-red-600 to-orange-700 px-4 pt-6 pb-5 rounded-[2rem] sm:rounded-[2rem] sm:shadow-xl sm:p-8">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center">
                            <ExclamationTriangleIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white leading-tight">Emergencias</h1>
                            <p className="text-xs text-rose-100">{filtered.length} disponibles</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLocationToggle}
                        aria-pressed={useLocation}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                            useLocation
                                ? "bg-white text-rose-700"
                                : "bg-white/15 text-white border border-white/30"
                        }`}
                    >
                        <MapPinIcon className="w-3.5 h-3.5" />
                        {useLocation ? "Cercanas" : "Ver cercanas"}
                    </button>
                </div>

                {/* Search */}
                <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                        id="emergency-search"
                        type="text"
                        placeholder="Buscar por nombre o ciudad…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 rounded-2xl text-sm bg-white border-0 focus:outline-none focus:ring-2 focus:ring-rose-400 shadow-sm"
                        aria-label="Buscar emergencias"
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
            </div>{/* end gradient */}
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
                        <ExclamationTriangleIcon className="w-7 h-7 text-gray-300" />
                    </div>
                    <p className="text-gray-500 text-sm">
                        {search ? `No encontramos servicios para "${search}".` : "No hay servicios de emergencia disponibles."}
                    </p>
                    {search && (
                        <button onClick={() => setSearch("")} className="mt-3 text-xs text-rose-600 hover:underline">
                            Limpiar búsqueda
                        </button>
                    )}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {displayed.map((it) => {
                            const expanded = !!expandedIds[it.id];
                            const tokenInfo = tokens[it.id];
                            const remainingMs = getRemainingMs(it.id);
                            const form = requestForms[it.id] || { actionType: "urgencia", loading: false };
                            const progressPct = tokenInfo
                                ? Math.max(0, (remainingMs / (2 * 60 * 1000)) * 100)
                                : 0;

                            return (
                                <article
                                    key={it.id}
                                    className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col"
                                >
                                    {/* Card header */}
                                    <div className="p-4 md:p-5 flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                                            <ExclamationTriangleIcon className="w-5 h-5 text-rose-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <h3 className="font-semibold text-gray-900 text-sm leading-snug truncate">
                                                    {it.nombre}
                                                </h3>
                                                {it.distancia !== undefined && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-600 whitespace-nowrap shrink-0">
                                                        <MapPinIcon className="w-3 h-3" />
                                                        {(it.distancia / 1000).toFixed(1)} km
                                                    </span>
                                                )}
                                            </div>
                                            {it.direccion && (
                                                <p className="text-xs text-gray-400 truncate mt-0.5" title={it.direccion}>
                                                    {it.direccion}{it.ciudad ? `, ${it.ciudad}` : ""}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Toggle buttons */}
                                    <div className="px-4 md:px-5 pb-4 md:pb-5 mt-auto">
                                        <div className="grid grid-cols-2 gap-2 md:hidden">
                                            <button
                                                onClick={() => toggleExpand(it.id)}
                                                aria-expanded={expanded}
                                                aria-controls={`details-${it.id}`}
                                                className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white active:scale-[0.99] transition"
                                            >
                                                <ChevronDownIcon className={`w-4 h-4 text-rose-600 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
                                                {expanded ? "Ocultar" : "Detalle"}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setExpandedIds((p) => ({ ...p, [it.id]: true }));
                                                    setTimeout(() => {
                                                        document.getElementById(`details-${it.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                                                    }, 120);
                                                }}
                                                className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 active:scale-[0.99] transition"
                                            >
                                                Solicitar
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => toggleExpand(it.id)}
                                            aria-expanded={expanded}
                                            aria-controls={`details-${it.id}`}
                                            className="hidden md:flex w-full items-center justify-center gap-1.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition"
                                        >
                                            {expanded ? "Ocultar detalles" : "Ver detalles y solicitar"}
                                            <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
                                        </button>
                                    </div>

                                    {/* Expandable */}
                                    <div
                                        id={`details-${it.id}`}
                                        className={`overflow-hidden transition-[max-height,opacity] duration-300 ${expanded ? "max-h-[700px] opacity-100" : "max-h-0 opacity-0"}`}
                                    >
                                        <div className="border-t border-gray-100 mx-5" />
                                        <div className="px-5 py-4 space-y-3">
                                            {/* Big tap-friendly action buttons */}
                                            <div className="grid grid-cols-2 gap-2">
                                                {it.telefono && (
                                                    <a
                                                        href={`tel:${it.telefono}`}
                                                        className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-50 text-emerald-700 text-sm font-semibold active:scale-95 transition"
                                                    >
                                                        <PhoneIcon className="w-4 h-4" />
                                                        Llamar
                                                    </a>
                                                )}
                                                {it.latitud && it.longitud ? (
                                                    <a
                                                        href={`https://www.google.com/maps/search/?api=1&query=${it.latitud},${it.longitud}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-brand-50 text-brand-700 text-sm font-semibold active:scale-95 transition"
                                                    >
                                                        <MapIcon className="w-4 h-4" />
                                                        Cómo llegar
                                                    </a>
                                                ) : it.telefono ? null : <div />}
                                            </div>
                                            {it.url && (
                                                <a
                                                    href={it.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-gray-50 text-gray-700 text-sm font-medium active:scale-95 transition"
                                                >
                                                    <LinkIcon className="w-4 h-4" />
                                                    Ver enlace
                                                </a>
                                            )}
                                        </div>

                                        {/* Request section */}
                                        {user?.role !== "emergency" && (
                                            <div className="px-5 pb-5">
                                                <div className="border-t border-gray-100 mb-4" />
                                                {tokenInfo ? (
                                                    <div className="space-y-3">
                                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Código de solicitud</p>
                                                        <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                                                            <KeyIcon className="w-4 h-4 text-gray-400 shrink-0" />
                                                            <code className="flex-1 text-sm font-mono font-semibold text-gray-800">
                                                                {tokenInfo.code}
                                                            </code>
                                                            <button
                                                                onClick={() =>
                                                                    navigator.clipboard?.writeText(tokenInfo.code).then(() => {
                                                                        setCopyFeedback((s) => ({ ...s, [it.id]: true }));
                                                                        setTimeout(() => setCopyFeedback((s) => ({ ...s, [it.id]: false })), 1600);
                                                                    })
                                                                }
                                                                className="text-gray-400 hover:text-gray-700 transition"
                                                                title="Copiar código"
                                                            >
                                                                {copyFeedback[it.id]
                                                                    ? <CheckIcon className="w-4 h-4 text-emerald-500" />
                                                                    : <ClipboardDocumentIcon className="w-4 h-4" />
                                                                }
                                                            </button>
                                                        </div>
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
                                                    <div className="space-y-3">
                                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Solicitar asistencia</p>
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-600 mb-1.5">Tipo de pedido</label>
                                                            <select
                                                                value={form.actionType}
                                                                onChange={(e) => handleRequestFormChange(it.id, "actionType", e.target.value)}
                                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition"
                                                            >
                                                                <option value="urgencia">Urgencia</option>
                                                                <option value="emergencia">Emergencia</option>
                                                                <option value="consulta">Consulta</option>
                                                            </select>
                                                        </div>
                                                        <button
                                                            disabled={form.loading}
                                                            onClick={() => handleCreateRequest(it.id)}
                                                            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-2xl active:scale-[0.98] transition"
                                                        >
                                                            {form.loading ? (
                                                                <>
                                                                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                                                    </svg>
                                                                    Enviando…
                                                                </>
                                                            ) : "Solicitar ayuda"}
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
                                    className="px-6 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:border-rose-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                >
                                    Cargar más servicios
                                </button>
                                <p className="text-xs text-gray-400">
                                    Mostrando {displayed.length} de {filtered.length}
                                </p>
                                <div ref={loadMoreRef} className="w-full h-1" aria-hidden />
                            </>
                        ) : (
                            <p className="text-xs text-gray-400">
                                {filtered.length > 0 ? `Mostrando los ${filtered.length} servicios disponibles` : ""}
                            </p>
                        )}
                    </div>
                </>
            )}
            </div>{/* end inner px-4 */}
            <BottomNavMenu />
        </div>
    );
};

export default Emergencies;