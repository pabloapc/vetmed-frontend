import React, { useState, useEffect, useMemo, useRef } from "react";

import type { Doctor, BackendDoctor } from "../types/doctor";

import { doctorService } from "../services/doctorService";
import { requestService } from "../services/requestService";

import { useAuth } from "../hooks/useAuth";
import { BottomNavMenu } from "../components/BottomNavMenu";

import {
    MagnifyingGlassIcon,
    MapPinIcon,
    MapIcon,
    ArrowPathIcon,
    LinkIcon,
    UserCircleIcon,
    ChevronDownIcon,
    InformationCircleIcon,
    PhoneIcon,
    ClockIcon,
    TagIcon,
    AcademicCapIcon,
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
    expiresAt: number;
};

export const Doctors: React.FC = () => {
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [useLocation, setUseLocation] = useState<boolean>(() => {
        try {
            const raw = localStorage.getItem("doctors_useLocation");
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

    // tokens state for doctors (created requests tokens)
    const [tokens, setTokens] = useState<Record<string, TokenInfo>>({});
    const [tick, setTick] = useState(0);
    const tickRef = useRef<number | null>(null);

    // requestForms per doctor (actionType, notes, loading)
    const [requestForms, setRequestForms] = useState<
        Record<string, { actionType: string; notes: string; loading?: boolean }>
    >({});

    // pagination / lazy load
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const loadMoreRef = useRef<HTMLDivElement | null>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);

    //nuevo filtro por especialidades
    // --- specialty filter state ---
    const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(
        null
    );

    // compute unique specialties from loaded doctors (sorted)
    // const specialties = useMemo(() => {
    //     const setSpec = new Set<string>();
    //     doctors.forEach((d) => {
    //         if (d.especialidad && typeof d.especialidad === "string") {
    //             // split if backend returns multiple specialties separated by commas (optional)
    //             d.especialidad.split?.(",").forEach((s: string) => {
    //                 const trimmed = s.trim();
    //                 if (trimmed) setSpec.add(trimmed);
    //             });
    //         }
    //     });
    //     return Array.from(setSpec).sort((a, b) => a.localeCompare(b));
    // }, [doctors]);

    // compute specialties with counts from loaded doctors (sorted by count desc, then name)
    const specialtiesWithCount = useMemo(() => {
        const map = new Map<string, number>();
        doctors.forEach((d) => {
            if (!d.especialidad) return;
            // soporta múltiples especialidades separadas por coma en el campo
            const parts = String(d.especialidad).split?.(",") ?? [
                String(d.especialidad),
            ];
            parts.forEach((p) => {
                const name = p.trim();
                if (!name) return;
                map.set(name, (map.get(name) || 0) + 1);
            });
        });

        const arr = Array.from(map.entries()).map(([name, count]) => ({
            name,
            count,
        }));
        // ordenar por cantidad descendente y luego por nombre
        arr.sort((a, b) => {
            if (b.count !== a.count) return b.count - a.count;
            return a.name.localeCompare(b.name);
        });
        return arr;
    }, [doctors]);

    // debounce search input (300ms)
    useEffect(() => {
        const t = window.setTimeout(() => {
            setDebouncedSearch(search.trim().toLowerCase());
        }, 300);
        return () => clearTimeout(t);
    }, [search]);

    useEffect(() => {
        loadDoctors();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [useLocation, user]);

    useEffect(() => {
        setVisibleCount(PAGE_SIZE);
    }, [debouncedSearch, doctors]);

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
                {
                    root: null,
                    rootMargin: "200px",
                    threshold: 0.1,
                }
            );
            observerRef.current.observe(loadMoreRef.current);
            return () => observerRef.current?.disconnect();
            // eslint-disable-next-line react-hooks/exhaustive-deps
        },
        [
            /* trigger after filtered recalculated */
        ]
    );

    // manage global tick interval while tokens exist
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

    // regenerate expired tokens on tick (local fallback)
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

    const mapDoctor = (d: BackendDoctor): Doctor => {
        // try to map common fields; BackendDoctor may vary per backend
        return {
            id: d.id,
            nombre: d.name,
            direccion: d.address,
            telefono: d.phone,
            ciudad: d.city ?? "",
            provincia: d.province ?? "",
            latitud: d.coordinates?.latitude ?? 0,
            longitud: d.coordinates?.longitude ?? 0,
            horario: d.openingHours ?? "",
            especialidad: d.specialty ?? "",
            url: d.url ?? "",
            distancia: d.distance ?? undefined,
            beneficios: d.benefits ?? "",
            descuento: d.discount ?? undefined,
        } as Doctor;
    };

    const normalizeResponseToArray = (raw: any): BackendDoctor[] => {
        if (!raw) return [];
        if (Array.isArray(raw)) return raw as BackendDoctor[];
        if (Array.isArray(raw.doctors)) return raw.doctors as BackendDoctor[];
        if (raw.data) {
            if (Array.isArray(raw.data)) return raw.data as BackendDoctor[];
            if (Array.isArray(raw.data.doctors))
                return raw.data.doctors as BackendDoctor[];
            if (Array.isArray(raw.data.data))
                return raw.data.data as BackendDoctor[];
        }
        const possible =
            raw.doctors ??
            raw.data ??
            raw.data?.doctors ??
            raw.data?.data ??
            null;
        if (Array.isArray(possible)) return possible as BackendDoctor[];
        return [];
    };

    const loadDoctors = async () => {
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
                raw = await doctorService.getNearbyDoctors(latitude, longitude);
            } else {
                raw = await doctorService.getAllDoctors();
            }

            const dataArray = normalizeResponseToArray(raw);
            if (!Array.isArray(dataArray))
                throw new Error("El endpoint no devolvió un array de doctores");

            const mapped = dataArray.map(mapDoctor);
            setDoctors(mapped);
        } catch (err) {
            const errorObj = err as {
                response?: { data?: { message?: string } };
                message?: string;
            };
            const msg =
                errorObj.response?.data?.message ||
                errorObj.message ||
                "Error al cargar doctores";
            setError(msg);
            setDoctors([]);
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
            localStorage.setItem("doctors_useLocation", String(next));
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

    // Token helpers (same as Pharmacies)
    // function generate6Digit() {
    //     return Math.floor(100000 + Math.random() * 900000).toString();
    // }

    // const startOrRefreshTokenFor = (id: string) => {
    //     const now = Date.now();
    //     setTokens((prev) => ({
    //         ...prev,
    //         [id]: { code: generate6Digit(), expiresAt: now + TOKEN_TTL_MS },
    //     }));
    // };

    // const stopTokenFor = (id: string) => {
    //     setTokens((prev) => {
    //         const next = { ...prev };
    //         delete next[id];
    //         return next;
    //     });
    // };

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

    // const copyToken = async (id: string) => {
    //     const t = tokens[id];
    //     if (!t) return;
    //     try {
    //         await navigator.clipboard?.writeText(t.code);
    //         setCopyFeedback((s) => ({ ...s, [id]: true }));
    //         setTimeout(
    //             () => setCopyFeedback((s) => ({ ...s, [id]: false })),
    //             1600
    //         );
    //     } catch {
    //         // ignore
    //     }
    // };

    // Create request for doctor (mirrors Pharmacies logic)
    const handleCreateRequest = async (doctorId: string) => {
        const form = requestForms[doctorId] || {
            actionType: "consulta_medica",
            notes: "",
        };
        setRequestForms((s) => ({
            ...s,
            [doctorId]: { ...(s[doctorId] || {}), loading: true },
        }));
        try {
            const payload: any = {
                targetType: "doctor",
                targetId: doctorId,
                actionType: form.actionType,
                notes: form.notes,
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

            // Attach doctor target field so backend can adapt (if you implemented targetType/targetId)
            // If your backend uses a different pattern for doctor requests, adapt accordingly.
            payload.doctorId = doctorId;

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
                    [doctorId]: {
                        code: created.token,
                        expiresAt: new Date(created.expiresAt).getTime(),
                    },
                }));
            }
        } catch (err: any) {
            console.error("createRequest (doctor) error", err);
            setError(
                err?.response?.data?.message ||
                    err.message ||
                    "Error al crear solicitud"
            );
        } finally {
            setRequestForms((s) => ({
                ...s,
                [doctorId]: { ...(s[doctorId] || {}), loading: false },
            }));
        }
    };

    const handleRequestFormChange = (
        doctorId: string,
        field: "actionType" | "notes",
        value: string
    ) => {
        setRequestForms((s) => ({
            ...s,
            [doctorId]: {
                ...(s[doctorId] || {
                    actionType: "consulta_medica",
                    notes: "",
                }),
                [field]: value,
            },
        }));
    };

    // filter by debounced search (name, specialty, description)
    const filtered = useMemo(() => {
        const q = debouncedSearch;
        return doctors.filter((d) => {
            // text match
            const matchesText =
                !q ||
                d.nombre.toLowerCase().includes(q) ||
                (d.especialidad || "").toLowerCase().includes(q);

            // specialty match (if a specialty is selected)
            const matchesSpecialty =
                !selectedSpecialty ||
                (d.especialidad || "")
                    .toString()
                    .split?.(",")
                    .map((s: string) => s.trim().toLowerCase())
                    .includes(selectedSpecialty.toLowerCase());

            return matchesText && matchesSpecialty;
        });
    }, [doctors, debouncedSearch, selectedSpecialty]);

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
                                <div className="h-6 w-20 bg-gray-100 rounded-full" />
                                <div className="h-6 w-16 bg-gray-100 rounded-full" />
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
            <div className="bg-gradient-to-br from-sky-700 via-sky-600 to-blue-700 px-4 pt-6 pb-5 rounded-[2rem] sm:rounded-[2rem] sm:shadow-xl sm:p-8">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center">
                            <UserCircleIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white leading-tight">Profesionales</h1>
                            <p className="text-xs text-sky-100">{filtered.length} disponibles</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLocationToggle}
                        aria-pressed={useLocation}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                            useLocation
                                ? "bg-white text-sky-700"
                                : "bg-white/15 text-white border border-white/30"
                        }`}
                    >
                        <MapPinIcon className="w-3.5 h-3.5" />
                        {useLocation ? "Cercanos" : "Ver cercanos"}
                    </button>
                </div>

                {/* Search */}
                <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                        id="doctor-search"
                        type="text"
                        placeholder="Buscar por nombre o especialidad…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 rounded-2xl text-sm bg-white border-0 focus:outline-none focus:ring-2 focus:ring-sky-400 shadow-sm"
                        aria-label="Buscar doctores"
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

            {/* Specialty chips */}
            {specialtiesWithCount.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                    <button
                        type="button"
                        onClick={() => setSelectedSpecialty(null)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                            !selectedSpecialty
                                ? "bg-sky-600 text-white border-sky-600"
                                : "bg-white text-gray-600 border-gray-200 hover:border-sky-300 hover:bg-sky-50"
                        }`}
                    >
                        Todas
                    </button>
                    {specialtiesWithCount.map((sp) => (
                        <button
                            key={sp.name}
                            type="button"
                            onClick={() => setSelectedSpecialty((s) => s === sp.name ? null : sp.name)}
                            className={`px-3 py-1 rounded-full text-xs font-medium border transition whitespace-nowrap ${
                                selectedSpecialty === sp.name
                                    ? "bg-sky-600 text-white border-sky-600"
                                    : "bg-white text-gray-600 border-gray-200 hover:border-sky-300 hover:bg-sky-50"
                            }`}
                        >
                            {sp.name}
                            <span className="ml-1 opacity-60">({sp.count})</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
                    <ExclamationCircleIcon className="w-5 h-5 shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}

            {/* Result count */}
            <p className="text-xs text-gray-400 mb-4">
                {filtered.length === 0
                    ? "Sin resultados"
                    : `${filtered.length} profesional${filtered.length !== 1 ? "es" : ""}${debouncedSearch ? ` para "${debouncedSearch}"` : ""}${selectedSpecialty ? ` · ${selectedSpecialty}` : ""}`}
            </p>

            {/* Empty state */}
            {filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-14 flex flex-col items-center text-center">
                    <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                        <UserCircleIcon className="w-7 h-7 text-gray-300" />
                    </div>
                    <p className="text-gray-500 text-sm">
                        {search || selectedSpecialty
                            ? "No encontramos profesionales con ese criterio."
                            : "No hay profesionales disponibles en este momento."}
                    </p>
                    {(search || selectedSpecialty) && (
                        <button
                            onClick={() => { setSearch(""); setSelectedSpecialty(null); }}
                            className="mt-3 text-xs text-blue-600 hover:underline"
                        >
                            Limpiar filtros
                        </button>
                    )}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {displayed.map((doctor) => {
                            const expanded = !!expandedIds[doctor.id];
                            const tokenInfo = tokens[doctor.id];
                            const remainingMs = getRemainingMs(doctor.id);
                            const form = requestForms[doctor.id] || {
                                actionType: "consulta_medica",
                                notes: "",
                                loading: false,
                            };
                            const progressPct = tokenInfo
                                ? Math.max(0, (remainingMs / (2 * 60 * 1000)) * 100)
                                : 0;

                            return (
                                <article
                                    key={doctor.id}
                                    className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col"
                                >
                                    {/* Card header */}
                                    <div className="p-4 md:p-5 flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center shrink-0">
                                            <UserCircleIcon className="w-5 h-5 text-sky-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <h3 className="font-semibold text-gray-900 text-sm leading-snug truncate">
                                                    {doctor.nombre}
                                                </h3>
                                                {doctor.descuento !== undefined ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 whitespace-nowrap shrink-0">
                                                        <TagIcon className="w-3 h-3" />
                                                        {doctor.descuento}% off
                                                    </span>
                                                ) : doctor.especialidad ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-sky-50 text-sky-700 whitespace-nowrap shrink-0 max-w-[50%] truncate">
                                                        <AcademicCapIcon className="w-3 h-3" />
                                                        {doctor.especialidad}
                                                    </span>
                                                ) : null}
                                            </div>
                                            {doctor.direccion && (
                                                <p className="text-xs text-gray-400 truncate mt-0.5" title={doctor.direccion}>
                                                    {doctor.direccion}
                                                    {doctor.ciudad ? `, ${doctor.ciudad}` : ""}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Badges */}
                                    <div className="px-4 md:px-5 pb-3 flex flex-wrap gap-1.5">
                                        {doctor.distancia !== undefined && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
                                                <MapPinIcon className="w-3 h-3" />
                                                {(doctor.distancia / 1000).toFixed(1)} km
                                            </span>
                                        )}
                                        {doctor.horario && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-500">
                                                <ClockIcon className="w-3 h-3" />
                                                {doctor.horario}
                                            </span>
                                        )}
                                    </div>

                                    {/* Toggle */}
                                    <div className="px-4 md:px-5 pb-4 md:pb-5 mt-auto">
                                        <div className="grid grid-cols-2 gap-2 md:hidden">
                                            <button
                                                onClick={() => toggleExpand(doctor.id)}
                                                aria-expanded={expanded}
                                                aria-controls={`details-${doctor.id}`}
                                                className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white active:scale-[0.99] transition"
                                            >
                                                <InformationCircleIcon className="w-4 h-4 text-blue-600" />
                                                {expanded ? "Ocultar" : "Detalle"}
                                            </button>

                                            <button
                                                onClick={() => openDetailsAndRequest(doctor.id)}
                                                className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 active:scale-[0.99] transition"
                                            >
                                                Solicitar
                                            </button>
                                        </div>

                                        <button
                                            onClick={() => toggleExpand(doctor.id)}
                                            aria-expanded={expanded}
                                            aria-controls={`details-${doctor.id}`}
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
                                        id={`details-${doctor.id}`}
                                        className={`overflow-hidden transition-[max-height,opacity] duration-300 ${
                                            expanded ? "max-h-[700px] opacity-100" : "max-h-0 opacity-0"
                                        }`}
                                    >
                                        <div className="border-t border-gray-100 mx-5" />
                                        <div className="px-5 py-4 space-y-3">
                                            {/* Big tap-friendly action buttons */}
                                            <div className="grid grid-cols-2 gap-2">
                                                {doctor.telefono && (
                                                    <a
                                                        href={`tel:${doctor.telefono}`}
                                                        className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-50 text-emerald-700 text-sm font-semibold active:scale-95 transition"
                                                    >
                                                        <PhoneIcon className="w-4 h-4" />
                                                        Llamar
                                                    </a>
                                                )}
                                                {doctor.latitud && doctor.longitud ? (
                                                    <a
                                                        href={`https://www.google.com/maps/search/?api=1&query=${doctor.latitud},${doctor.longitud}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-sky-50 text-sky-700 text-sm font-semibold active:scale-95 transition"
                                                    >
                                                        <MapIcon className="w-4 h-4" />
                                                        Cómo llegar
                                                    </a>
                                                ) : doctor.telefono ? null : (
                                                    <div />
                                                )}
                                            </div>
                                            {doctor.url && (
                                                <a
                                                    href={doctor.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="mt-2 flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-gray-50 text-gray-700 text-sm font-medium active:scale-95 transition"
                                                >
                                                    <LinkIcon className="w-4 h-4" />
                                                    Instagram / Web
                                                </a>
                                            )}
                                        </div>

                                        {/* Request section */}
                                        {user?.role !== "doctor" && (
                                            <div className="px-5 pb-5">
                                                <div className="border-t border-gray-100 mb-4" />

                                                {tokenInfo ? (
                                                    <div className="space-y-3">
                                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                                                            Código de consulta
                                                        </p>
                                                        <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                                                            <KeyIcon className="w-4 h-4 text-gray-400 shrink-0" />
                                                            <code className="flex-1 text-sm font-mono font-semibold text-gray-800">
                                                                {tokenInfo.code}
                                                            </code>
                                                            <button
                                                                onClick={() =>
                                                                    navigator.clipboard?.writeText(tokenInfo.code).then(() => {
                                                                        setCopyFeedback((s) => ({ ...s, [doctor.id]: true }));
                                                                        setTimeout(() => setCopyFeedback((s) => ({ ...s, [doctor.id]: false })), 1600);
                                                                    })
                                                                }
                                                                className="text-gray-400 hover:text-gray-700 transition"
                                                                title="Copiar código"
                                                            >
                                                                {copyFeedback[doctor.id]
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
                                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                                                            Solicitar consulta
                                                        </p>
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                                                Tipo de consulta
                                                            </label>
                                                            <select
                                                                value={form.actionType}
                                                                onChange={(e) => handleRequestFormChange(doctor.id, "actionType", e.target.value)}
                                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                                            >
                                                                <option value="consulta_medica">Consulta médica</option>
                                                                <option value="video_llamada">Video llamada</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                                                Observaciones
                                                            </label>
                                                            <input
                                                                value={form.notes}
                                                                onChange={(e) => handleRequestFormChange(doctor.id, "notes", e.target.value)}
                                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition placeholder-gray-400"
                                                                placeholder="Síntomas, preferencia de horario..."
                                                            />
                                                        </div>
                                                        <button
                                                            disabled={form.loading}
                                                            onClick={() => handleCreateRequest(doctor.id)}
                                                            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-sky-600 hover:bg-sky-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-2xl active:scale-[0.98] transition"
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
                                                                "Solicitar consulta"
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
                                    Cargar más profesionales
                                </button>
                                <p className="text-xs text-gray-400">
                                    Mostrando {displayed.length} de {filtered.length}
                                </p>
                                <div ref={loadMoreRef} className="w-full h-1" aria-hidden />
                            </>
                        ) : (
                            <p className="text-xs text-gray-400">
                                {filtered.length > 0 ? `Mostrando los ${filtered.length} profesionales disponibles` : ""}
                            </p>
                        )}
                    </div>
                </>
            )}            </div>{/* end inner px-4 */}            <BottomNavMenu />        </div>
    );
};
