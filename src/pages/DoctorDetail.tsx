import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doctorService } from "../services/doctorService";
import { requestService } from "../services/requestService";
import { useAuth } from "../hooks/useAuth";
import type { BackendDoctor } from "../types/doctor";
import {
    ArrowLeftIcon,
    MapPinIcon,
    PhoneIcon,
    ClockIcon,
    ArrowPathIcon,
    CheckCircleIcon,
    ExclamationCircleIcon,
    UserCircleIcon,
    AcademicCapIcon,
    LinkIcon,
} from "@heroicons/react/24/outline";

const ACTION_TYPES = [
    { value: "consulta_medica", label: "Consulta médica" },
    { value: "video_llamada", label: "Videollamada" },
    { value: "visita_medica", label: "Visita médica" },
    { value: "informacion", label: "Información general" },
];

export const DoctorDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const [doctor, setDoctor] = useState<BackendDoctor | null>(null);
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
        if (!id) return;
        setLoading(true);
        doctorService
            .getDoctorById(id)
            .then((data) => setDoctor(data))
            .catch((err) => {
                const status = err?.response?.status;
                if (status === 401 || status === 403) {
                    setNeedsAuth(true);
                } else {
                    setError(
                        err?.response?.data?.message ||
                            err.message ||
                            "No se pudo cargar el profesional"
                    );
                }
            })
            .finally(() => setLoading(false));
    }, [id]);

    const buildMapsUrl = () => {
        if (!doctor) return "https://www.google.com/maps";
        const lat = doctor.coordinates?.latitude;
        const lng = doctor.coordinates?.longitude;
        if (lat && lng)
            return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            doctor.address ?? doctor.name
        )}`;
    };

    const handleRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;
        setReqError("");
        setReqLoading(true);
        try {
            const payload: any = {
                targetType: "doctor",
                targetId: id,
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
                <ArrowPathIcon className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );

    if (needsAuth)
        return (
            <div className="container mx-auto px-4 py-12 text-center max-w-md">
                <UserCircleIcon className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    Iniciá sesión para ver este profesional
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                    El contenido de esta página está disponible para usuarios registrados.
                </p>
                <div className="flex justify-center gap-3">
                    <button
                        onClick={() => navigate("/login")}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium"
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

    if (error || !doctor)
        return (
            <div className="container mx-auto px-4 py-12 text-center">
                <ExclamationCircleIcon className="w-12 h-12 text-red-400 mx-auto mb-3" />
                <p className="text-gray-600">
                    {error || "Profesional no encontrado"}
                </p>
                <button
                    onClick={() => navigate(-1)}
                    className="mt-4 text-blue-600 hover:underline"
                >
                    Volver
                </button>
            </div>
        );

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
                    <div className="p-3 rounded-xl bg-green-50 text-green-600 shrink-0">
                        <UserCircleIcon className="w-8 h-8" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-2xl font-bold text-gray-900 mb-1">
                            {doctor.name}
                        </h1>
                        {(doctor.city || doctor.province) && (
                            <p className="text-sm text-gray-500">
                                {[doctor.city, doctor.province]
                                    .filter(Boolean)
                                    .join(", ")}
                            </p>
                        )}
                    </div>
                    {doctor.discount != null && (
                        <span className="shrink-0 bg-green-100 text-green-700 text-sm font-semibold px-3 py-1 rounded-full">
                            {doctor.discount}% desc.
                        </span>
                    )}
                </div>

                {/* Specialty badge */}
                {doctor.specialty && (
                    <div className="mt-4 flex items-center gap-2">
                        <AcademicCapIcon className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full">
                            {doctor.specialty}
                        </span>
                    </div>
                )}

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Address */}
                    {doctor.address && (
                        <div className="flex items-start gap-3">
                            <MapPinIcon className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                            <div>
                                <div className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">
                                    Dirección
                                </div>
                                <div className="text-sm text-gray-700">
                                    {doctor.address}
                                </div>
                                <a
                                    href={buildMapsUrl()}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                                >
                                    Ver en Google Maps →
                                </a>
                            </div>
                        </div>
                    )}

                    {/* Phone */}
                    {doctor.phone && (
                        <div className="flex items-start gap-3">
                            <PhoneIcon className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                            <div>
                                <div className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">
                                    Teléfono
                                </div>
                                <a
                                    href={`tel:${doctor.phone}`}
                                    className="text-sm text-gray-700 hover:text-blue-600"
                                >
                                    {doctor.phone}
                                </a>
                            </div>
                        </div>
                    )}

                    {/* Hours */}
                    {doctor.openingHours && (
                        <div className="flex items-start gap-3">
                            <ClockIcon className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                            <div>
                                <div className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">
                                    Horario
                                </div>
                                <div className="text-sm text-gray-700">
                                    {doctor.openingHours}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* URL */}
                    {doctor.url && (
                        <div className="flex items-start gap-3">
                            <LinkIcon className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                            <div>
                                <div className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">
                                    Sitio web
                                </div>
                                <a
                                    href={doctor.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:underline break-all"
                                >
                                    {doctor.url}
                                </a>
                            </div>
                        </div>
                    )}

                    {/* Benefits */}
                    {doctor.benefits && (
                        <div className="flex items-start gap-3 sm:col-span-2">
                            <div className="w-5 h-5 text-gray-400 mt-0.5 shrink-0 text-center">✓</div>
                            <div>
                                <div className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">
                                    Beneficios
                                </div>
                                <div className="text-sm text-gray-700">
                                    {doctor.benefits}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Request form */}
            <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                    Solicitar atención
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                    {isAuthenticated
                        ? "Elegí el tipo de consulta y enviá tu solicitud."
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tipo de consulta
                            </label>
                            <select
                                value={actionType}
                                onChange={(e) => setActionType(e.target.value)}
                                disabled={!isAuthenticated}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-50 disabled:text-gray-400"
                            >
                                {ACTION_TYPES.map((at) => (
                                    <option key={at.value} value={at.value}>
                                        {at.label}
                                    </option>
                                ))}
                            </select>
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
                                placeholder="Describí brevemente tu consulta..."
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-50 disabled:text-gray-400"
                            />
                        </div>

                        {reqError && (
                            <p className="text-sm text-red-600">{reqError}</p>
                        )}

                        {!isAuthenticated ? (
                            <button
                                type="button"
                                onClick={() => navigate("/login")}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium"
                            >
                                Iniciar sesión para enviar
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={reqLoading}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-2.5 rounded-lg text-sm font-medium inline-flex justify-center items-center gap-2"
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
                        className="mt-3 text-sm text-blue-600 hover:underline"
                    >
                        Hacer otra solicitud
                    </button>
                )}
            </div>
        </div>
    );
};

export default DoctorDetail;
