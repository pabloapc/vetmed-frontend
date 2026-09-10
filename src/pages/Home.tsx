import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
    MagnifyingGlassIcon,
    MapPinIcon,
    UserCircleIcon,
    SparklesIcon,
    BuildingStorefrontIcon,
    LinkIcon,
    ArrowPathIcon,
    ArrowRightCircleIcon,
    ClipboardDocumentListIcon,
    ShieldCheckIcon,
    VideoCameraIcon,
    BoltIcon,
    TagIcon,
} from "@heroicons/react/24/outline";
 
import { motion } from "framer-motion";
import contactService from "../services/contactService";
import searchService from "../services/searchService";
import adminService from "../services/adminService";
//import { InsurancePlans } from "../components/InsurancePlans";
import { InsurersSection } from "../components/InsurersSection";
import { veterinariaDetailPath } from "../utils/seoUrl";
import { BrandLogo } from "../components/BrandLogo";

const PawPrint: React.FC<{
    x: number;
    y: number;
    scale?: number;
    rotate?: number;
    opacity?: number;
}> = ({ x, y, scale = 1, rotate = 0, opacity = 0.12 }) => (
    <g
        transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}
        opacity={opacity}
        fill="white"
    >
        <ellipse cx="0" cy="15" rx="14" ry="11" />
        <ellipse cx="-15" cy="-6" rx="6" ry="7.5" transform="rotate(-20 -15 -6)" />
        <ellipse cx="-5.5" cy="-15" rx="6" ry="8" transform="rotate(-7 -5.5 -15)" />
        <ellipse cx="5.5" cy="-15" rx="6" ry="8" transform="rotate(7 5.5 -15)" />
        <ellipse cx="15" cy="-6" rx="6" ry="7.5" transform="rotate(20 15 -6)" />
    </g>
);

export const Home: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [suggestLoading, setSuggestLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);

    const debounceRef = useRef<number | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    // user geolocation
    const [userLocation, setUserLocation] = useState<{
        lat: number;
        lng: number;
    } | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [locationRequested, setLocationRequested] = useState(false);

    // Form state for "Conoce nuestra tecnología"
    const [techForm, setTechForm] = useState({
        name: "",
        email: "",
        company: "",
        role: "company",
        message: "",
    });
    const [formError, setFormError] = useState("");
    const [formSuccess, setFormSuccess] = useState("");
    const [sending, setSending] = useState(false);

    // --- New: Lead (Cotizar Ahora) modal state ---
    // const [showLeadModal, setShowLeadModal] = useState(false);
    // const [leadPlan, setLeadPlan] = useState<string | null>(null);
    // const [leadForm, setLeadForm] = useState({
    //     name: "",
    //     email: "",
    //     telefono: "",
    //     company: "",
    //     role: "individual",
    //     message: "",
    // });
    // const [leadError, setLeadError] = useState("");
    // const [leadSuccess, setLeadSuccess] = useState("");
    // const [leadSending, setLeadSending] = useState(false);
    // -------------------------------------------------

    // Prestaciones públicas
    const [prestations, setPrestations] = useState<any[]>([]);
    const [prestationsLoading, setPrestationsLoading] = useState(false);

    const handleTechChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => {
        setTechForm({ ...techForm, [e.target.name]: e.target.value });
    };

    const handleTechSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError("");
        setFormSuccess("");

        if (!techForm.name || !techForm.email) {
            setFormError("Por favor completa nombre y email.");
            return;
        }

        setSending(true);
        console.log(sending, "sending...");
        try {
            const payload = {
                name: techForm.name,
                email: techForm.email,
                company: techForm.company,
                role: techForm.role,
                message: techForm.message,
                source: "home_form",
            };
            const res = await contactService.createEnterpriseLead(payload);
            if (res && (res.success || res.status === 201)) {
                setFormSuccess(
                    "Gracias — recibimos tu consulta. Nuestro equipo te contactará pronto."
                );
                setTechForm({
                    name: "",
                    email: "",
                    company: "",
                    role: "company",
                    message: "",
                });
            } else {
                setFormError(
                    res?.message || "No se pudo enviar. Intentá de nuevo."
                );
            }
        } catch (err: any) {
            setFormError(
                err?.response?.data?.message ||
                    err.message ||
                    "Error al enviar el formulario"
            );
        } finally {
            setSending(false);
        }
    };

    // --- Lead modal helpers ---
    // const openLeadModal = (plan: string) => {
    //     setLeadError("");
    //     setLeadSuccess("");
    //     setLeadPlan(plan);

    //     // prefill from session if available
    //     setLeadForm((prev) => ({
    //         ...prev,
    //         name: user?.name || "",
    //         email: user?.email || "",
    //         telefono: (user as any)?.telefono || "",
    //         company: "",
    //         role: "individual",
    //         message: `Cotización solicitada para: ${plan}`,
    //     }));

    //     setShowLeadModal(true);
    // };

    // const closeLeadModal = () => {
    //     setShowLeadModal(false);
    //     setLeadPlan(null);
    //     setLeadError("");
    //     setLeadSuccess("");
    //     setLeadSending(false);
    // };

    // const handleLeadChange = (
    //     e: React.ChangeEvent<
    //         HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    //     >
    // ) => {
    //     setLeadForm({ ...leadForm, [e.target.name]: e.target.value });
    // };

    // const handleLeadSubmit = async (e?: React.FormEvent) => {
    //     if (e) e.preventDefault();
    //     setLeadError("");
    //     setLeadSuccess("");

    //     // if logged in, require minimal checks else require name/email/telefono
    //     if (!isAuthenticated) {
    //         if (!leadForm.name || !leadForm.email || !leadForm.telefono) {
    //             setLeadError("Por favor completa nombre, email y teléfono.");
    //             return;
    //         }
    //     } else {
    //         // ensure email present in form (prefilled)
    //         if (!leadForm.email || !leadForm.name) {
    //             setLeadError(
    //                 "No se encontró información de usuario. Por favor inicia sesión nuevamente."
    //             );
    //             return;
    //         }
    //     }

    //     setLeadSending(true);
    //     try {
    //         const payload: any = {
    //             name: leadForm.name,
    //             email: leadForm.email,
    //             company: leadForm.company,
    //             role: leadForm.role,
    //             message: leadForm.message,
    //             telefono: leadForm.telefono,
    //             source: `cotizacion_home_${(leadPlan || "plan")
    //                 .toLowerCase()
    //                 .replace(/\s+/g, "_")}`,
    //         };

    //         // opcional: si querés enviar userId explícitamente
    //         if (isAuthenticated && user && user.id) {
    //             payload.userId = user.id; // backend puede ignorarlo si ya usa req.user
    //         }

    //         // Try generic createLead then fallback to createEnterpriseLead (compatibility)
    //         let res: any = null;
    //         try {
    //             if (typeof contactService.createLead === "function") {
    //                 res = await contactService.createLead(payload);
    //             } else {
    //                 // fallback to enterprise endpoint
    //                 res = await contactService.createEnterpriseLead(payload);
    //             }
    //         } catch (firstErr) {
    //             // if first attempt failed and another method exists, try alternative
    //             try {
    //                 if (
    //                     typeof contactService.createEnterpriseLead ===
    //                     "function"
    //                 ) {
    //                     res = await contactService.createEnterpriseLead(
    //                         payload
    //                     );
    //                 }
    //             } catch (secondErr) {
    //                 throw secondErr || firstErr;
    //             }
    //         }

    //         if (res && (res.success || res.status === 201)) {
    //             setLeadSuccess(
    //                 "Gracias — tu solicitud de cotización fue enviada."
    //             );
    //             // If user is logged in, we keep modal open to show success briefly then close
    //             setTimeout(() => {
    //                 closeLeadModal();
    //             }, 1400);
    //         } else {
    //             setLeadError(
    //                 res?.message || "No se pudo enviar. Intentá de nuevo."
    //             );
    //         }
    //     } catch (err: any) {
    //         console.error("lead submit error", err);
    //         setLeadError(
    //             err?.response?.data?.message ||
    //                 err.message ||
    //                 "Error al enviar la cotización"
    //         );
    //     } finally {
    //         setLeadSending(false);
    //     }
    // };
    // -------------------------------

    // --- geolocation helpers (unchanged) ---
    const requestUserLocation = async () => {
        if (locationRequested) return;
        setLocationRequested(true);
        if (!navigator?.geolocation) {
            setLocationError("Geolocalización no soportada");
            return;
        }
        return new Promise<void>((resolve) => {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setUserLocation({
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude,
                    });
                    setLocationError(null);
                    resolve();
                },
                (err) => {
                    setLocationError(
                        err.message || "Permiso de ubicación denegado"
                    );
                    resolve();
                },
                { maximumAge: 1000 * 60 * 5, timeout: 5000 }
            );
        });
    };

    const extractCoords = (s: any): { lat: number; lng: number } | null => {
        if (!s) return null;
        if (s.lat && s.lng) return { lat: Number(s.lat), lng: Number(s.lng) };
        if (s.latitude && s.longitude)
            return { lat: Number(s.latitude), lng: Number(s.longitude) };
        if (
            s.location &&
            Array.isArray(s.location.coordinates) &&
            s.location.coordinates.length >= 2
        ) {
            // GeoJSON [lng, lat]
            const [lng, lat] = s.location.coordinates;
            return { lat: Number(lat), lng: Number(lng) };
        }
        if (s.coords && s.coords.latitude && s.coords.longitude) {
            return {
                lat: Number(s.coords.latitude),
                lng: Number(s.coords.longitude),
            };
        }
        return null;
    };

    const haversineKm = (
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number
    ) => {
        const toRad = (v: number) => (v * Math.PI) / 180;
        const R = 6371; // km
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) *
                Math.cos(toRad(lat2)) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const attachDistances = (items: any[]) => {
        if (!userLocation)
            return items.map((it) => ({ ...it, distanceKm: undefined }));
        return items.map((it) => {
            const coords = extractCoords(it);
            if (!coords) return { ...it, distanceKm: undefined };
            const d = haversineKm(
                userLocation.lat,
                userLocation.lng,
                coords.lat,
                coords.lng
            );
            return { ...it, distanceKm: Math.round(d * 10) / 10 }; // 1 decimal
        });
    };
    // ---------------------------

    // logic for suggestions (debounced) - unchanged
    useEffect(() => {
        if (!query || query.trim().length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        setSuggestLoading(true);
        if (debounceRef.current) window.clearTimeout(debounceRef.current);
        debounceRef.current = window.setTimeout(async () => {
            try {
                const res = await searchService.getSuggestions(query, {
                    limit: 8,
                    type: "both",
                });
                const s = res?.data?.suggestions ?? res?.suggestions ?? [];
                if (!userLocation && !locationRequested) {
                    requestUserLocation().then(() => {
                        setSuggestions((_prev) => {
                            const withDist = attachDistances(s);
                            return withDist;
                        });
                    });
                    setSuggestions(s);
                } else {
                    const withDist = attachDistances(s);
                    setSuggestions(withDist);
                }
                setShowSuggestions(true);
            } catch (err) {
                setSuggestions([]);
                setShowSuggestions(false);
            } finally {
                setSuggestLoading(false);
            }
        }, 250);
        return () => {
            if (debounceRef.current) window.clearTimeout(debounceRef.current);
        };
    }, [query, userLocation]);

    useEffect(() => {
        if (!userLocation || suggestions.length === 0) return;
        const withDist = attachDistances(suggestions);
        setSuggestions(withDist);
    }, [userLocation]);

    // keyboard navigation - unchanged
    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!showSuggestions || suggestions.length === 0) return;
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex((i) => Math.min(i + 1, suggestions.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (selectedIndex >= 0 && suggestions[selectedIndex]) {
                handleSelectSuggestion(suggestions[selectedIndex]);
            } else {
                handleSubmitSearch();
            }
        } else if (e.key === "Escape") {
            setShowSuggestions(false);
            setSelectedIndex(-1);
        }
    };

    const handleSelectSuggestion = (s: any) => {
        setShowSuggestions(false);
        setSelectedIndex(-1);
        if (!s) return;
        if (s.type === "veterinaria") {
            navigate(veterinariaDetailPath(s));
        } else {
            navigate(`/search?q=${encodeURIComponent(s.name || query)}`);
        }
    };

    const handleSubmitSearch = () => {
        setShowSuggestions(false);
        setSelectedIndex(-1);
        if (!query || !query.trim()) return;
        navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    };

    // Click outside to close suggestions - unchanged
    useEffect(() => {
        setPrestationsLoading(true);
        adminService
            .listPrestationsPublic({ limit: 6, page: 1 })
            .then((res: any) => {
                const data = res?.data ?? res;
                setPrestations(data?.prestations ?? []);
            })
            .catch(() => setPrestations([]))
            .finally(() => setPrestationsLoading(false));
    }, []);

    useEffect(() => {
        const listener = (ev: MouseEvent) => {
            const target = ev.target as Node;
            if (inputRef.current && !inputRef.current.contains(target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("click", listener);
        return () => document.removeEventListener("click", listener);
    }, []);

    const renderDistance = (d?: number) => {
        if (d == null || Number.isNaN(d)) return null;
        if (d < 1) return `${Math.round(d * 1000)} m`;
        return `${d.toFixed(1)} km`;
    };

    // Testimonials section is temporarily disabled below (see "Testimonials" comment) — data kept for when it's re-enabled.
    // const testimonials = [
    //     {
    //         id: "t1",
    //         name: "María López",
    //         role: "Paciente",
    //         quote: "Encontré la veterinaria que necesitaba en segundos. Muy fácil de usar.",
    //         rating: 5,
    //     },
    //     {
    //         id: "t2",
    //         name: "Carlos Ruiz",
    //         role: "Profesional de salud",
    //         quote: "La geolocalización y la información de descuentos son súper útiles.",
    //         rating: 4,
    //     },
    //     {
    //         id: "t3",
    //         name: "Lucía Gómez",
    //         role: "Usuario",
    //         quote: "Interfaz clara y rápida — todo lo que esperaba.",
    //         rating: 5,
    //     },
    // ];

    const containerVariants = {
        hidden: { opacity: 0, y: 8 },
        show: { opacity: 1, y: 0, transition: { staggerChildren: 0.08 } },
    };
    const cardVariant = {
        hidden: { opacity: 0, y: 10, scale: 0.99 },
        show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45 } },
        hover: { scale: 1.03, y: -6, transition: { duration: 0.18 } },
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <header className="w-full bg-gradient-to-br from-brand-900 via-brand-700 to-brand-600 relative">
                {/* Decorative background layer (clipped so it never causes a scrollbar or bleeds outside the header) */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {/* Paw print pattern */}
                    <svg
                        className="absolute inset-0 w-full h-full"
                        xmlns="http://www.w3.org/2000/svg"
                        preserveAspectRatio="xMidYMid slice"
                        viewBox="0 0 1200 400"
                        aria-hidden="true"
                    >
                        <PawPrint x={70} y={70} scale={1.3} rotate={-18} opacity={0.14} />
                        <PawPrint x={190} y={230} scale={0.9} rotate={24} opacity={0.09} />
                        <PawPrint x={330} y={90} scale={1.1} rotate={8} opacity={0.11} />
                        <PawPrint x={470} y={280} scale={1.5} rotate={-10} opacity={0.08} />
                        <PawPrint x={600} y={130} scale={0.8} rotate={30} opacity={0.12} />
                        <PawPrint x={730} y={330} scale={1.2} rotate={-25} opacity={0.09} />
                        <PawPrint x={860} y={80} scale={1} rotate={15} opacity={0.13} />
                        <PawPrint x={980} y={260} scale={1.4} rotate={-6} opacity={0.08} />
                        <PawPrint x={1110} y={110} scale={0.9} rotate={20} opacity={0.11} />
                        <PawPrint x={1150} y={320} scale={1.1} rotate={-30} opacity={0.1} />
                        <PawPrint x={40} y={330} scale={1} rotate={12} opacity={0.09} />
                    </svg>
                    <img
                        src="/mascota-04.png"
                        alt=""
                        aria-hidden="true"
                        className="hidden xl:block absolute bottom-0 right-6 w-72 select-none drop-shadow-2xl"
                    />
                </div>
                <div className="container mx-auto px-8 py-20 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="text-center">
                            <motion.h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                                Vetfind, cerca de tu mascota
                            </motion.h1>
                            <motion.p className="text-lg md:text-xl text-brand-100 mb-6 max-w-3xl mx-auto">
                                Encontrá veterinarias para tu mascota, reservá
                                videollamadas o atención presencial y gestioná turnos,  desde una
                                sola plataforma.
                            </motion.p>
                            <div className="mt-6 max-w-2xl mx-auto relative z-30">
                                <div className="flex items-stretch gap-3">
                                    <div className="flex-1 relative">
                                        <input
                                            ref={inputRef}
                                            value={query}
                                            onChange={(e) =>
                                                setQuery(e.target.value)
                                            }
                                            onKeyDown={onKeyDown}
                                            onFocus={() => {
                                                if (suggestions.length)
                                                    setShowSuggestions(true);
                                            }}
                                            placeholder="Buscar veterinaria o dirección..."
                                            className="w-full border-0 rounded-full px-5 py-3.5 bg-white text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                                            aria-autocomplete="list"
                                            aria-controls="search-suggestions"
                                            aria-expanded={showSuggestions}
                                        />
                                        <div className="absolute right-3 top-3">
                                            {suggestLoading ? (
                                                <ArrowPathIcon className="w-5 h-5 text-gray-400 animate-spin" />
                                            ) : (
                                                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
                                            )}
                                        </div>
                                        {/* Suggestions dropdown (unchanged) */}
                                        {showSuggestions &&
                                            suggestions.length > 0 && (
                                                <div
                                                    id="search-suggestions"
                                                    role="listbox"
                                                    className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-md shadow-lg z-50 overflow-hidden"
                                                >
                                                    {suggestions.map((s, i) => (
                                                        <button
                                                            key={`${s.type}-${s.id}-${i}`}
                                                            onClick={() =>
                                                                handleSelectSuggestion(
                                                                    s
                                                                )
                                                            }
                                                            className={`w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 ${
                                                                i ===
                                                                selectedIndex
                                                                    ? "bg-gray-50"
                                                                    : ""
                                                            }`}
                                                        >
                                                            <div className="flex items-start gap-3 flex-1">
                                                                <div className="mt-0.5">
                                                                    {s.type ===
                                                                    "veterinaria" ? (
                                                                        <MapPinIcon className="w-5 h-5 text-brand-600" />
                                                                    ) : (
                                                                        <UserCircleIcon className="w-5 h-5 text-green-600" />
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="font-medium text-gray-900 truncate">
                                                                            {
                                                                                s.name
                                                                            }
                                                                        </div>
                                                                        {s.distanceKm !=
                                                                            null && (
                                                                            <div className="text-xs text-gray-500 ml-3 flex-shrink-0">
                                                                                {renderDistance(
                                                                                    s.distanceKm
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500 truncate">
                                                                        {
                                                                            s.address
                                                                        }
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className=" ml-3">
                                                                <button
                                                                    type="button"
                                                                    onClick={(
                                                                        e
                                                                    ) => {
                                                                        e.stopPropagation();
                                                                        let mapsUrl =
                                                                            "";
                                                                        const coords =
                                                                            extractCoords(
                                                                                s
                                                                            );
                                                                        if (
                                                                            coords
                                                                        ) {
                                                                            mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                                                                coords.lat +
                                                                                    "," +
                                                                                    coords.lng
                                                                            )}`;
                                                                        } else if (
                                                                            s.address
                                                                        ) {
                                                                            mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                                                                s.address
                                                                            )}`;
                                                                        } else if (
                                                                            s.name
                                                                        ) {
                                                                            mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                                                                s.name
                                                                            )}`;
                                                                        } else {
                                                                            mapsUrl = `https://www.google.com/maps`;
                                                                        }
                                                                        window.open(
                                                                            mapsUrl,
                                                                            "_blank"
                                                                        );
                                                                    }}
                                                                    className="inline-flex items-center justify-center p-2 rounded hover:bg-gray-100 text-gray-600"
                                                                    title="Cómo llegar (Google Maps)"
                                                                >
                                                                    <LinkIcon className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </button>
                                                    ))}
                                                    <div className="border-t px-4 py-2 text-xs text-gray-500 flex justify-between items-center">
                                                        <div>
                                                            ¿No encontraste?
                                                            Buscar todos los
                                                            resultados
                                                        </div>
                                                        <button
                                                            onClick={() =>
                                                                handleSubmitSearch()
                                                            }
                                                            className="text-brand-600 hover:underline text-sm"
                                                        >
                                                            Buscar
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                    </div>
                                    <div className="shrink-0">
                                        <button
                                            onClick={handleSubmitSearch}
                                            className="bg-white hover:bg-gray-50 text-brand-700 font-semibold px-6 py-3.5 rounded-full transition shadow-sm"
                                        >
                                            Buscar
                                        </button>
                                    </div>
                                </div>
                                {locationError ? (
                                    <div className="mt-2 text-xs text-red-600">
                                        Ubicación: {locationError}
                                    </div>
                                ) : userLocation ? (
                                    <div className="mt-2 text-xs text-gray-500">
                                        Mostrando distancias según tu ubicación
                                    </div>
                                ) : null}
                            </div>

                            {!isAuthenticated ? (
                                <></>
                                // <motion.div
                                //     className="flex justify-center space-x-4 mt-6"
                                //     initial={{ opacity: 0 }}
                                //     animate={{ opacity: 1 }}
                                //     transition={{ delay: 0.12 }}
                                // >
                                //     <Link
                                //         to="/register"
                                //         className="bg-white hover:bg-gray-50 text-brand-700 font-semibold px-7 py-3 rounded-full transition shadow-sm inline-flex items-center gap-2"
                                //     >
                                //         <ArrowRightCircleIcon className="w-5 h-5" />
                                //         <span>Registrarse</span>
                                //     </Link>
                                //     <Link
                                //         to="/login"
                                //         className="bg-white/10 hover:bg-white/20 border border-white/30 text-white font-medium px-7 py-3 rounded-full transition"
                                //     >
                                //         Iniciar Sesión
                                //     </Link>
                                // </motion.div>
                            ) : (
                                // <motion.div
                                //     initial={{ opacity: 0 }}
                                //     animate={{ opacity: 1 }}
                                //     transition={{ delay: 0.12 }}
                                //     className="flex justify-center space-x-4 mt-3"
                                // >
                                //     <Link
                                //         to="/veterinarias"
                                //         className="inline-block bg-brand-600 hover:bg-brand-700 text-white px-8 py-3 rounded-lg text-lg font-medium"
                                //     >
                                //         Ver Veterinarias
                                //     </Link>
                                // </motion.div>
                                <></>
                            )}

                            <motion.div
                                className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-brand-100"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                <span className="inline-flex items-center gap-1.5">
                                    <ShieldCheckIcon className="w-4 h-4" />
                                    Veterinarias verificadas
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <VideoCameraIcon className="w-4 h-4" />
                                    Presencial o videollamada
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <BoltIcon className="w-4 h-4" />
                                    Turno en segundos, sin llamados
                                </span>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </header>

            {/* Main content */}
            <main className="w-full">
                <div className="mx-auto mt-8 px-4 pb-16 w-full">
                    <div className="max-w-6xl mx-auto">

                        {/* ¿Por qué elegir Vetfind? */}
                        <section className="mb-16">
                            <div className="mb-8 flex flex-col md:flex-row items-center gap-6 md:gap-10">
                                <div className="flex-1 text-center md:text-left">
                                    <div className="inline-flex items-center gap-2 text-xs font-semibold text-brand-700 bg-brand-50 px-3 py-1 rounded-full mb-3">
                                        <SparklesIcon className="w-3.5 h-3.5" />
                                        Beneficios
                                    </div>
                                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                                        ¿Por qué elegir Vetfind para tu mascota?
                                    </h2>
                                    <p className="text-sm text-gray-500 mt-2 max-w-lg">
                                        Cuidar a tu mascota no debería significar horas buscando turno o esperando en la sala de espera.
                                    </p>
                                </div>
                                {/* <img
                                    src="/mascota-01.png"
                                    alt="Perrito esperando su turno en Vetfind"
                                    className="hidden md:block w-36 lg:w-44 shrink-0"
                                /> */}
                            </div>
                            <motion.div
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
                                initial="hidden"
                                animate="show"
                                variants={containerVariants}
                            >
                                <motion.div
                                    variants={cardVariant}
                                    whileHover="hover"
                                    className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md flex flex-col gap-3"
                                >
                                    <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center">
                                        <ShieldCheckIcon className="w-5 h-5 text-brand-600" />
                                    </div>
                                    <h3 className="text-base font-semibold text-gray-900">Red verificada</h3>
                                    <p className="text-sm text-gray-500 leading-relaxed">
                                        Veterinarias evaluadas y verificadas, cerca tuyo.
                                    </p>
                                </motion.div>

                                <motion.div
                                    variants={cardVariant}
                                    whileHover="hover"
                                    className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md flex flex-col gap-3"
                                >
                                    <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center">
                                        <VideoCameraIcon className="w-5 h-5 text-brand-600" />
                                    </div>
                                    <h3 className="text-base font-semibold text-gray-900">Presencial o videollamada</h3>
                                    <p className="text-sm text-gray-500 leading-relaxed">
                                        Elegí cómo atenderte: en el consultorio o desde tu casa.
                                    </p>
                                </motion.div>

                                <motion.div
                                    variants={cardVariant}
                                    whileHover="hover"
                                    className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md flex flex-col gap-3"
                                >
                                    <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center">
                                        <BoltIcon className="w-5 h-5 text-brand-600" />
                                    </div>
                                    <h3 className="text-base font-semibold text-gray-900">Turno en segundos</h3>
                                    <p className="text-sm text-gray-500 leading-relaxed">
                                        Sin llamados ni esperas: pedí tu turno online y recibí un código al instante.
                                    </p>
                                </motion.div>

                                <motion.div
                                    variants={cardVariant}
                                    whileHover="hover"
                                    className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md flex flex-col gap-3"
                                >
                                    <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center">
                                        <TagIcon className="w-5 h-5 text-brand-600" />
                                    </div>
                                    <h3 className="text-base font-semibold text-gray-900">Beneficios exclusivos</h3>
                                    <p className="text-sm text-gray-500 leading-relaxed">
                                        Descuentos en consultas, medicamentos y productos para tu mascota.
                                    </p>
                                </motion.div>
                            </motion.div>
                        </section>



                        {/* Cómo funciona */}
                        <section className="mb-16">
                            <div className="mb-8 text-center max-w-2xl mx-auto">
                                <img
                                    src="/mascota-03.png"
                                    alt=""
                                    aria-hidden="true"
                                    className="w-20 h-20 object-contain mx-auto mb-3"
                                />
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                                    ¿Cómo funciona?
                                </h2>
                                <p className="text-sm text-gray-500 mt-2">
                                    Pedí tu atención veterinaria en 3 pasos.
                                </p>
                            </div>
                            <motion.div
                                className="grid grid-cols-1 md:grid-cols-3 gap-8"
                                initial="hidden"
                                animate="show"
                                variants={containerVariants}
                            >
                                <motion.div variants={cardVariant} className="text-center">
                                    <div className="w-10 h-10 mx-auto rounded-full bg-brand-600 text-white font-bold flex items-center justify-center mb-4">
                                        1
                                    </div>
                                    <h3 className="text-base font-semibold text-gray-900">Buscá tu veterinaria</h3>
                                    <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
                                        Por ubicación, nombre o dirección, cerca tuyo.
                                    </p>
                                </motion.div>
                                <motion.div variants={cardVariant} className="text-center">
                                    <div className="w-10 h-10 mx-auto rounded-full bg-brand-600 text-white font-bold flex items-center justify-center mb-4">
                                        2
                                    </div>
                                    <h3 className="text-base font-semibold text-gray-900">Elegí el tipo de atención</h3>
                                    <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
                                        Presencial o videollamada, con una nota para el profesional si hace falta.
                                    </p>
                                </motion.div>
                                <motion.div variants={cardVariant} className="text-center">
                                    <div className="w-10 h-10 mx-auto rounded-full bg-brand-600 text-white font-bold flex items-center justify-center mb-4">
                                        3
                                    </div>
                                    <h3 className="text-base font-semibold text-gray-900">Recibí tu código</h3>
                                    <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
                                        Te llega un código de solicitud para coordinar la atención.
                                    </p>
                                </motion.div>
                            </motion.div>
                            <div className="mt-8 text-center">
                                <Link
                                    to="/veterinarias"
                                    className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold px-6 py-3 rounded-full transition"
                                >
                                    Buscar veterinarias
                                    <ArrowRightCircleIcon className="w-4 h-4" />
                                </Link>
                            </div>
                        </section>


                                                {/* Tipos de atención */}
                        <section className="mb-16">
                            <div className="mb-8 flex flex-col md:flex-row-reverse items-center gap-6 md:gap-10">
                                <div className="flex-1 text-center md:text-left">
                                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                                        Encontrá la atención que tu mascota necesita
                                    </h2>
                                    <p className="text-sm text-gray-500 mt-2 max-w-lg md:mx-0 mx-auto">
                                        Consultas de rutina, videollamadas o una urgencia: elegí cómo querés que te atiendan.
                                    </p>
                                </div>
                                <img
                                    src="/mascota-02.png"
                                    alt="Perrito feliz esperando su consulta"
                                    className="hidden md:block w-36 lg:w-44 shrink-0"
                                />
                            </div>
                            <motion.div
                                className="grid grid-cols-1 md:grid-cols-3 gap-5"
                                initial="hidden"
                                animate="show"
                                variants={containerVariants}
                            >
                                <motion.div variants={cardVariant} whileHover="hover">
                                    <Link
                                        to="/veterinarias"
                                        className="block h-full bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-brand-200 transition"
                                    >
                                        <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center mb-4">
                                            <BuildingStorefrontIcon className="w-5 h-5 text-brand-600" />
                                        </div>
                                        <h3 className="text-base font-semibold text-gray-900">Consulta presencial</h3>
                                        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                                            Buscá una veterinaria cerca tuyo y coordiná tu visita.
                                        </p>
                                    </Link>
                                </motion.div>

                                <motion.div variants={cardVariant} whileHover="hover">
                                    <Link
                                        to="/veterinarias"
                                        className="block h-full bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-brand-200 transition"
                                    >
                                        <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center mb-4">
                                            <VideoCameraIcon className="w-5 h-5 text-brand-600" />
                                        </div>
                                        <h3 className="text-base font-semibold text-gray-900">Videollamada</h3>
                                        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                                            Consultá a un profesional sin salir de tu casa.
                                        </p>
                                    </Link>
                                </motion.div>

                                <motion.div variants={cardVariant} whileHover="hover">
                                    <Link
                                        to="/emergencies"
                                        className="block h-full bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-red-200 transition"
                                    >
                                        <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center mb-4">
                                            <BoltIcon className="w-5 h-5 text-red-600" />
                                        </div>
                                        <h3 className="text-base font-semibold text-gray-900">Urgencias 24 hs</h3>
                                        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                                            Atención inmediata para emergencias de riesgo vital.
                                        </p>
                                    </Link>
                                </motion.div>
                            </motion.div>
                        </section>

                        {/* Testimonials */}
                        {/* <section className="mb-16">
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Testimonios</h2>
                                <p className="text-sm text-gray-500 mt-1">Lo que dicen nuestros usuarios.</p>
                            </div>
                            <motion.div
                                className="grid grid-cols-1 md:grid-cols-3 gap-5"
                                initial="hidden"
                                whileInView="show"
                                viewport={{ once: true }}
                            >
                                {testimonials.map((t, idx) => (
                                    <motion.article
                                        key={t.id}
                                        className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-4"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{
                                            opacity: 1,
                                            y: 0,
                                            transition: { delay: 0.08 * idx },
                                        }}
                                    >
                                        <div className="flex items-center gap-1">
                                            {Array.from({
                                                length: t.rating,
                                            }).map((_, i) => (
                                                <StarIcon
                                                    key={i}
                                                    className="w-4 h-4 text-amber-400"
                                                />
                                            ))}
                                            {Array.from({
                                                length: 5 - t.rating,
                                            }).map((_, i) => (
                                                <StarIcon
                                                    key={`o${i}`}
                                                    className="w-4 h-4 text-gray-200"
                                                />
                                            ))}
                                        </div>
                                        <p className="text-gray-700 text-sm leading-relaxed flex-1">
                                            "{t.quote}"
                                        </p>
                                        <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                                            <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 text-xs font-bold shrink-0">
                                                {t.name
                                                    .split(" ")
                                                    .map((n) => n[0])
                                                    .slice(0, 2)
                                                    .join("")}
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-gray-900">
                                                    {t.name}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {t.role}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.article>
                                ))}
                            </motion.div>
                        </section> */}

                        {/* ───────── Para profesionales e instituciones (B2B) ───────── */}
                        <div className="border-t border-gray-200 pt-16">
                            <div className="mb-8">
                                <div className="inline-flex items-center gap-2 text-xs font-semibold text-brand-700 bg-brand-50 px-3 py-1 rounded-full mb-3">
                                    <BuildingStorefrontIcon className="w-3.5 h-3.5" />
                                    Para profesionales e instituciones
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    ¿Tenés una veterinaria o representás una institución?
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    Vetfind también es una red abierta a veterinarias, a prepagas y empresas.
                                </p>
                            </div>

                            <motion.div
                                className="grid grid-cols-1 md:grid-cols-2 gap-5"
                                initial="hidden"
                                animate="show"
                                variants={containerVariants}
                            >
                                <motion.div
                                    variants={cardVariant}
                                    whileHover="hover"
                                    className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md flex flex-col gap-4"
                                >
                                    <div className="w-11 h-11 rounded-xl bg-sky-50 flex items-center justify-center">
                                        <UserCircleIcon className="w-5 h-5 text-sky-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-semibold text-gray-900">Para veterinarias</h3>
                                        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                                            Gestioná turnos, atendé videollamadas y conectate con dueños de mascotas de tu zona.
                                        </p>
                                    </div>
                                    <Link
                                        to="/register-entity"
                                        className="mt-auto text-sm text-sky-600 hover:text-sky-700 font-medium inline-flex items-center gap-1.5"
                                    >
                                        Sumar mi veterinaria
                                        <ArrowRightCircleIcon className="w-4 h-4" />
                                    </Link>
                                </motion.div>

                                <motion.div
                                    variants={cardVariant}
                                    whileHover="hover"
                                    className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md flex flex-col gap-4"
                                >
                                    <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center">
                                        <BuildingStorefrontIcon className="w-5 h-5 text-brand-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-semibold text-gray-900">Para instituciones</h3>
                                        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                                            Empresas que gestionan afiliados, descuentos y reportes.
                                        </p>
                                    </div>
                                    <Link
                                        to="/admin"
                                        className="mt-auto text-sm text-brand-600 hover:text-brand-700 font-medium inline-flex items-center gap-1.5"
                                    >
                                        Conocer soluciones
                                        <ArrowRightCircleIcon className="w-4 h-4" />
                                    </Link>
                                </motion.div>
                            </motion.div>

                            {/* Promo banner */}
                            <motion.section
                                className="mt-12 bg-linear-to-r from-brand-700 to-brand-500 rounded-xl text-white p-8 flex flex-col md:flex-row items-center gap-6"
                                initial={{ opacity: 0, x: -12 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6 }}
                            >
                                <div className="md:flex-1">
                                    <h2 className="text-2xl md:text-3xl font-bold mb-2">
                                        Impulsamos la atención desde la comunidad
                                    </h2>
                                    <p className="text-sm md:text-base opacity-90 mb-3">
                                        Vetfind conecta usuarios, veterinarias,
                                        profesionales y organizaciones para
                                        facilitar cuidados, descuentos y gestión de
                                        afiliados.
                                    </p>
                                    <div className="mt-3 flex gap-3">
                                        <Link
                                            to="/veterinarias"
                                            className="bg-white text-sky-700 px-4 py-2 rounded-md font-medium"
                                        >
                                            Buscar veterinarias
                                        </Link>
                                    </div>
                                </div>

                                <div className="md:w-1/3 flex justify-center">
                                    <img
                                        src="/mascota-01.png"
                                        alt="Perrito esperando su turno en Vetfind"
                                        className="w-40 lg:w-48"
                                    />
                                </div>
                            </motion.section>

                            <InsurersSection />

                            {/* Prestaciones */}
                            {(prestationsLoading || prestations.length > 0) && (
                                <section className="mt-12">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="text-2xl font-bold text-gray-900">
                                                Prestaciones disponibles
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                Servicios y coberturas que estamos incorporando a la plataforma.
                                            </p>
                                        </div>
                                    </div>

                                    {prestationsLoading ? (
                                        <div className="flex justify-center py-10">
                                            <ArrowPathIcon className="w-6 h-6 animate-spin text-brand-400" />
                                        </div>
                                    ) : (
                                        <motion.div
                                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                                            initial="hidden"
                                            animate="show"
                                            variants={containerVariants}
                                        >
                                            {prestations.map((p) => (
                                                <motion.article
                                                    key={p._id ?? p.code}
                                                    variants={cardVariant}
                                                    whileHover="hover"
                                                    className="bg-white rounded-lg shadow p-6 flex flex-col gap-3"
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="p-2 rounded-md bg-violet-50 text-violet-600">
                                                            <ClipboardDocumentListIcon className="w-5 h-5" />
                                                        </div>
                                                        {p.category && (
                                                            <span className="text-xs bg-brand-50 text-brand-700 px-2 py-1 rounded-full">
                                                                {p.category}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <h4 className="text-base font-semibold text-gray-900">
                                                        {p.name}
                                                    </h4>

                                                    {p.description && (
                                                        <p className="text-sm text-gray-600 line-clamp-3 flex-1">
                                                            {p.description}
                                                        </p>
                                                    )}

                                                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                                                        {p.defaultDurationMinutes ? (
                                                            <span className="text-xs text-gray-500">
                                                                {p.defaultDurationMinutes} min
                                                            </span>
                                                        ) : (
                                                            <span />
                                                        )}
                                                        {p.defaultPrice?.min != null ? (
                                                            <span className="text-sm font-medium text-gray-700">
                                                                {p.defaultPrice.currency ?? "ARS"}{" "}
                                                                {p.defaultPrice.min.toLocaleString()}
                                                                {p.defaultPrice.max != null &&
                                                                    p.defaultPrice.max !== p.defaultPrice.min &&
                                                                    ` – ${p.defaultPrice.max.toLocaleString()}`}
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                </motion.article>
                                            ))}
                                        </motion.div>
                                    )}
                                </section>
                            )}

                            {/* Contact / Know our tech */}
                            <motion.section
                                className="mt-12 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="mb-6">
                                    <div className="inline-flex items-center gap-2 text-xs font-semibold text-brand-600 bg-brand-50 px-3 py-1 rounded-full mb-3">
                                        <SparklesIcon className="w-3.5 h-3.5" />
                                        Integraciones B2B
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900">
                                        Conocé nuestra tecnología
                                    </h3>
                                    <p className="text-gray-500 mt-1 text-sm">
                                        Si representás una empresa, obra social o institución y querés integrar o administrar afiliados con Vetfind, dejá tus datos y te contactamos.
                                    </p>
                                </div>

                                <form
                                    onSubmit={handleTechSubmit}
                                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                                >
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                            Nombre
                                        </label>
                                        <input
                                            name="name"
                                            value={techForm.name}
                                            onChange={handleTechChange}
                                            placeholder="Tu nombre"
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                            Email
                                        </label>
                                        <input
                                            name="email"
                                            type="email"
                                            value={techForm.email}
                                            onChange={handleTechChange}
                                            placeholder="tu@empresa.com"
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                            Empresa / Organización
                                        </label>
                                        <input
                                            name="company"
                                            value={techForm.company}
                                            onChange={handleTechChange}
                                            placeholder="Nombre de la organización"
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div className="md:col-span-3">
                                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                            Tipo de organización
                                        </label>
                                        <select
                                            name="role"
                                            value={techForm.role}
                                            onChange={handleTechChange}
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                                        >
                                            <option value="company">
                                                Empresa / Proveedor
                                            </option>
                                            <option value="institution">
                                                Obra social / Institución
                                            </option>
                                            <option value="other">Otro</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-3">
                                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                            Mensaje (opcional)
                                        </label>
                                        <textarea
                                            name="message"
                                            value={techForm.message}
                                            onChange={handleTechChange}
                                            rows={3}
                                            placeholder="Contanos en qué podemos ayudarte..."
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                                        />
                                    </div>
                                    {formError && (
                                        <div className="md:col-span-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                                            {formError}
                                        </div>
                                    )}
                                    {formSuccess && (
                                        <div className="md:col-span-3 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                                            {formSuccess}
                                        </div>
                                    )}
                                    <div className="md:col-span-3 flex justify-end">
                                        <motion.button
                                            type="submit"
                                            whileTap={{ scale: 0.98 }}
                                            className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                                        >
                                            Enviar consulta
                                        </motion.button>
                                    </div>
                                </form>
                            </motion.section>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer unchanged */}
            <footer className="mt-auto backdrop-blur-2xl border-t border-slate-200/50 bg-white/30">
                <div className="container mx-auto px-4 py-10">
                    <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div>
                            <BrandLogo variant="onLight" size="sm" />
                            <p className="text-sm text-slate-500 mt-2">
                                Plataforma para encontrar veterinarias y gestionar
                                información de salud.
                            </p>
                            <p className="text-xs text-slate-500 mt-4">
                                © {new Date().getFullYear()} Vetfind. Todos los
                                derechos reservados.
                            </p>
                        </div>
                        <div>
                            <h5 className="font-medium">Enlaces</h5>
                            <ul className="mt-3 space-y-2 text-sm text-slate-600">
                                <li>
                                    <Link
                                        to="/veterinarias"
                                        className="hover:underline"
                                    >
                                        Encuentra Veterinarias
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/profile"
                                        className="hover:underline"
                                    >
                                        Mi Perfil
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/help"
                                        className="hover:underline"
                                    >
                                        Ayuda
                                    </Link>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h5 className="font-medium">Contacto</h5>
                            <p className="text-sm text-slate-500 mt-3">
                                soporte@vetfind.app
                            </p>
                            <p className="text-sm text-slate-500 mt-1">
                                (+54) 9 3512 30-9838
                            </p>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Lead Modal */}
            {/* {showLeadModal && (
                <div className="fixed inset-0 z-60 flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={closeLeadModal}
                    />
                    <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 z-50">
                        <div className="flex items-start justify-between mb-5">
                            <div>
                                <h4 className="text-lg font-bold text-gray-900">
                                    Cotizar: {leadPlan}
                                </h4>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Completá tus datos y nos contactamos.
                                </p>
                            </div>
                            <button
                                onClick={closeLeadModal}
                                className="text-gray-400 hover:text-gray-600 ml-4"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleLeadSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                        Nombre
                                    </label>
                                    <input
                                        name="name"
                                        value={leadForm.name}
                                        onChange={handleLeadChange}
                                        placeholder="Tu nombre"
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                                        disabled={!!(isAuthenticated && user)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                        Email
                                    </label>
                                    <input
                                        name="email"
                                        type="email"
                                        value={leadForm.email}
                                        onChange={handleLeadChange}
                                        placeholder="tu@email.com"
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                                        disabled={!!(isAuthenticated && user)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                        Teléfono
                                    </label>
                                    <input
                                        name="telefono"
                                        value={leadForm.telefono}
                                        onChange={handleLeadChange}
                                        placeholder="+54 9 ..."
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                                        disabled={!!(isAuthenticated && user)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                        Empresa (opcional)
                                    </label>
                                    <input
                                        name="company"
                                        value={leadForm.company}
                                        onChange={handleLeadChange}
                                        placeholder="Nombre de empresa"
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                    Mensaje (opcional)
                                </label>
                                <textarea
                                    name="message"
                                    value={leadForm.message}
                                    onChange={handleLeadChange}
                                    rows={3}
                                    placeholder="¿Algo más que quieras contarnos?"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                                />
                            </div>

                            {leadError && (
                                <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                                    {leadError}
                                </div>
                            )}
                            {leadSuccess && (
                                <div className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                                    {leadSuccess}
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={closeLeadModal}
                                    className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={leadSending}
                                    className="px-5 py-2 text-sm bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-60"
                                >
                                    {leadSending
                                        ? "Enviando..."
                                        : "Enviar solicitud"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )} */}
        </div>
    );
};

export default Home;
