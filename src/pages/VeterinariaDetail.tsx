import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { veterinariaService } from "../services/veterinariaService";
import { requestService } from "../services/requestService";
import { useAuth } from "../hooks/useAuth";
import type { BackendVeterinaria } from "../types/veterinaria";
import { VETERINARIA_ACTION_TYPES } from "../constants/veterinariaActionTypes";
import { veterinariaDetailPath } from "../utils/seoUrl";
import { setMetaTag, setCanonical, setJsonLd } from "../utils/pageMeta";

const FRONTEND_ORIGIN = "https://www.vetfind.com.ar";
import {
    ArrowLeftIcon,
    MapPinIcon,
    PhoneIcon,
    ClockIcon,
    TagIcon,
    ArrowPathIcon,
    CheckCircleIcon,
    ExclamationCircleIcon,
    BuildingStorefrontIcon,
} from "@heroicons/react/24/outline";

export const VeterinariaDetail: React.FC = () => {
    const { id, slug } = useParams<{ id?: string; citySlug?: string; slug?: string }>();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const [veterinaria, setVeterinaria] = useState<BackendVeterinaria | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [needsAuth, setNeedsAuth] = useState(false);

    // request form
    const [actionType, setActionType] = useState("consulta_medica");
    const [notes, setNotes] = useState("");
    const [reqLoading, setReqLoading] = useState(false);
    const [reqError, setReqError] = useState("");
    const [reqToken, setReqToken] = useState<string | null>(null);

    useEffect(() => {
        if (!id && !slug) return;
        setLoading(true);
        const fetcher = slug
            ? veterinariaService.getVeterinariaBySlug(slug)
            : veterinariaService.getVeterinariaById(id!);
        fetcher
            .then((data) => setVeterinaria(data))
            .catch((err) => {
                const status = err?.response?.status;
                if (status === 401 || status === 403) {
                    setNeedsAuth(true);
                } else {
                    setError(
                        err?.response?.data?.message ||
                            err.message ||
                            "No se pudo cargar la veterinaria"
                    );
                }
            })
            .finally(() => setLoading(false));
    }, [id, slug]);

    // Legacy /veterinarias/:id links redirect to the canonical SEO slug URL once resolved,
    // so search engines and old bookmarks consolidate onto a single indexable URL.
    useEffect(() => {
        if (id && !slug && veterinaria?.slug) {
            navigate(veterinariaDetailPath(veterinaria), { replace: true });
        }
    }, [id, slug, veterinaria, navigate]);

    useEffect(() => {
        if (!veterinaria?.name) return;

        const city = veterinaria.city;
        document.title = city
            ? `${veterinaria.name} - Veterinaria en ${city} | Vetfind`
            : `${veterinaria.name} · Vetfind`;

        const description =
            veterinaria.description ||
            (city
                ? `${veterinaria.name}, veterinaria en ${veterinaria.address}, ${city}. Teléfono, ubicación y cómo contactarla en Vetfind.`
                : `${veterinaria.name} en Vetfind: dirección, teléfono y ubicación.`);
        setMetaTag("name", "description", description);
        setMetaTag("property", "og:title", document.title);
        setMetaTag("property", "og:description", description);

        const canonicalPath = veterinariaDetailPath(veterinaria);
        const canonicalUrl = `${FRONTEND_ORIGIN}${canonicalPath}`;
        setCanonical(canonicalUrl);
        setMetaTag("property", "og:url", canonicalUrl);

        if (veterinaria.coordinates?.latitude && veterinaria.coordinates?.longitude) {
            setJsonLd("veterinaria-jsonld", {
                "@context": "https://schema.org",
                "@type": "VeterinaryCare",
                name: veterinaria.name,
                description: veterinaria.description || undefined,
                address: {
                    "@type": "PostalAddress",
                    streetAddress: veterinaria.address,
                    addressLocality: veterinaria.city || undefined,
                    addressRegion: veterinaria.province || undefined,
                    addressCountry: "AR",
                },
                telephone: veterinaria.phone || undefined,
                geo: {
                    "@type": "GeoCoordinates",
                    latitude: veterinaria.coordinates.latitude,
                    longitude: veterinaria.coordinates.longitude,
                },
                url: canonicalUrl,
            });
        }

        return () => {
            document.title = "Vetfind";
            setJsonLd("veterinaria-jsonld", null);
        };
    }, [veterinaria]);

    const buildMapsUrl = () => {
        if (!veterinaria) return "https://www.google.com/maps";
        const lat = veterinaria.coordinates?.latitude;
        const lng = veterinaria.coordinates?.longitude;
        if (lat && lng)
            return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            veterinaria.address ?? veterinaria.name
        )}`;
    };

    const buildOsmEmbedUrl = () => {
        const lat = veterinaria?.coordinates?.latitude;
        const lng = veterinaria?.coordinates?.longitude;
        if (lat == null || lng == null) return null;
        const delta = 0.006;
        const bbox = [lng - delta, lat - delta, lng + delta, lat + delta].join(",");
        return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
    };

    const handleRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!veterinaria?.id) return;
        setReqError("");
        setReqLoading(true);
        try {
            const payload: any = {
                targetType: "veterinaria",
                targetId: veterinaria.id,
                actionType,
                notes,
            };
            if (!isAuthenticated) {
                payload.userSnapshot = {
                    name: localStorage.getItem("anon_name") || "Invitado",
                    email: localStorage.getItem("anon_email") || "",
                };
            }
            const res = await requestService.createRequest(payload);
            const token =
                res?.data?.token ?? res?.token ?? res?.data?.code ?? null;
            setReqToken(token);
            setNotes("");
        } catch (err: any) {
            setReqError(
                err?.response?.data?.message ||
                    err.message ||
                    "Error al enviar la solicitud"
            );
        } finally {
            setReqLoading(false);
        }
    };

    if (loading)
        return (
            <div className="flex justify-center items-center py-24">
                <ArrowPathIcon className="w-8 h-8 animate-spin text-brand-500" />
            </div>
        );

    if (needsAuth)
        return (
            <div className="container mx-auto px-4 py-12 text-center max-w-md">
                <BuildingStorefrontIcon className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    Iniciá sesión para ver esta veterinaria
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                    El contenido de esta página está disponible para usuarios registrados.
                </p>
                <div className="flex justify-center gap-3">
                    <button
                        onClick={() => navigate("/login")}
                        className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium"
                    >
                        Iniciar sesión
                    </button>
                    <button
                        onClick={() => navigate(-1)}
                        className="border border-gray-300 text-gray-600 px-5 py-2.5 rounded-lg text-sm"
                    >
                        Volver
                    </button>
                </div>
            </div>
        );

    if (error || !veterinaria)
        return (
            <div className="container mx-auto px-4 py-12 text-center">
                <ExclamationCircleIcon className="w-12 h-12 text-red-400 mx-auto mb-3" />
                <p className="text-gray-600">{error || "Veterinaria no encontrada"}</p>
                <button
                    onClick={() => navigate(-1)}
                    className="mt-4 text-brand-600 hover:underline"
                >
                    Volver
                </button>
            </div>
        );

    const isClaimed = veterinaria.isClaimed ?? false;

    return (
        <div className="container mx-auto px-4 py-10 max-w-3xl">
            {/* Back */}
            <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6"
            >
                <ArrowLeftIcon className="w-4 h-4" />
                Volver
            </button>

            {/* Header card */}
            <div className="bg-white rounded-xl shadow p-6 mb-6">
                <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-amber-50 text-amber-600 shrink-0">
                        <BuildingStorefrontIcon className="w-8 h-8" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-2xl font-bold text-gray-900 mb-1">
                            {veterinaria.name}
                        </h1>
                        {(veterinaria.city || veterinaria.province) && (
                            <p className="text-sm text-gray-500">
                                {[veterinaria.city, veterinaria.province]
                                    .filter(Boolean)
                                    .join(", ")}
                            </p>
                        )}
                        {!isClaimed && (
                            <span className="inline-flex items-center mt-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-500">
                                No registrada en VetFind
                            </span>
                        )}
                        {veterinaria.description && (
                            <p className="text-sm text-gray-600 mt-3 whitespace-pre-line">
                                {veterinaria.description}
                            </p>
                        )}
                    </div>
                    {isClaimed && veterinaria.discount != null && (
                        <span className="shrink-0 bg-green-100 text-green-700 text-sm font-semibold px-3 py-1 rounded-full">
                            {veterinaria.discount}% desc.
                        </span>
                    )}
                </div>

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Address */}
                    <div className="flex items-start gap-3">
                        <MapPinIcon className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                        <div>
                            <div className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">
                                Dirección
                            </div>
                            <div className="text-sm text-gray-700">
                                {veterinaria.address}
                            </div>
                            {!(isClaimed && buildOsmEmbedUrl()) && (
                                <a
                                    href={buildMapsUrl()}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline mt-1"
                                >
                                    <MapPinIcon className="w-3 h-3" />
                                    Ver ubicación →
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Phone */}
                    {veterinaria.phone && (
                        <div className="flex items-start gap-3">
                            <PhoneIcon className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                            <div>
                                <div className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">
                                    Teléfono
                                </div>
                                <a
                                    href={`tel:${veterinaria.phone}`}
                                    className="text-sm text-gray-700 hover:text-brand-600"
                                >
                                    {veterinaria.phone}
                                </a>
                            </div>
                        </div>
                    )}

                    {isClaimed && (
                        <>
                            {/* Hours */}
                            {veterinaria.openingHours && (
                                <div className="flex items-start gap-3">
                                    <ClockIcon className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                                    <div>
                                        <div className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">
                                            Horario
                                        </div>
                                        <div className="text-sm text-gray-700">
                                            {veterinaria.openingHours}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Benefits */}
                            {veterinaria.benefits && (
                                <div className="flex items-start gap-3">
                                    <TagIcon className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                                    <div>
                                        <div className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">
                                            Beneficios
                                        </div>
                                        <div className="text-sm text-gray-700">
                                            {veterinaria.benefits}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Map */}
                {isClaimed && buildOsmEmbedUrl() && (
                    <div className="mt-5">
                        <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">
                            Ubicación
                        </div>
                        <div className="rounded-xl overflow-hidden border border-gray-200 h-64 sm:h-80">
                            <iframe
                                title={`Mapa de ${veterinaria.name}`}
                                src={buildOsmEmbedUrl() ?? undefined}
                                className="w-full h-full border-0"
                                loading="lazy"
                            />
                        </div>
                        <a
                            href={buildMapsUrl()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-brand-600 hover:underline mt-2 inline-block"
                        >
                            Ver en Google Maps →
                        </a>
                    </div>
                )}
            </div>

            {/* Request form */}
            {isClaimed && (
            <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                    Hacer una solicitud
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                    {isAuthenticated
                        ? "Enviá tu consulta directamente a la veterinaria."
                        : "Iniciá sesión para enviar solicitudes."}
                </p>

                {reqToken ? (
                    <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                        <CheckCircleIcon className="w-6 h-6 text-green-600 shrink-0" />
                        <div>
                            <div className="text-sm font-medium text-green-800">
                                Solicitud enviada
                            </div>
                            <div className="text-xs text-green-600 mt-0.5">
                                Token:{" "}
                                <span className="font-mono font-semibold">
                                    {reqToken}
                                </span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleRequest} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tipo de solicitud
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {VETERINARIA_ACTION_TYPES.map((at) => {
                                    const selected = actionType === at.value;
                                    return (
                                        <button
                                            key={at.value}
                                            type="button"
                                            onClick={() => setActionType(at.value)}
                                            disabled={!isAuthenticated}
                                            aria-pressed={selected}
                                            className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 px-4 py-4 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${
                                                selected
                                                    ? "border-brand-500 bg-brand-50 text-brand-700"
                                                    : "border-gray-200 bg-white text-gray-600 hover:border-brand-300 hover:bg-brand-50/50"
                                            }`}
                                        >
                                            <at.Icon className="w-6 h-6" />
                                            {at.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Notas adicionales
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                disabled={!isAuthenticated}
                                rows={3}
                                placeholder="Indicá qué necesitás..."
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 disabled:bg-gray-50 disabled:text-gray-400"
                            />
                        </div>

                        {reqError && (
                            <p className="text-sm text-red-600">{reqError}</p>
                        )}

                        {!isAuthenticated ? (
                            <button
                                type="button"
                                onClick={() => navigate("/login")}
                                className="w-full bg-brand-600 hover:bg-brand-700 text-white py-2.5 rounded-lg text-sm font-medium"
                            >
                                Iniciar sesión para enviar
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={reqLoading}
                                className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white py-2.5 rounded-lg text-sm font-medium inline-flex justify-center items-center gap-2"
                            >
                                {reqLoading && (
                                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                )}
                                {reqLoading ? "Enviando..." : "Enviar solicitud"}
                            </button>
                        )}
                    </form>
                )}

                {reqToken && (
                    <button
                        onClick={() => {
                            setReqToken(null);
                            setNotes("");
                        }}
                        className="mt-3 text-sm text-brand-600 hover:underline"
                    >
                        Hacer otra solicitud
                    </button>
                )}
            </div>
            )}
        </div>
    );
};

export default VeterinariaDetail;
