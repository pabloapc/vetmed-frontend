import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { authService } from "../services/authService";
import veterinariaService from "../services/veterinariaService";
import emergencyService from "../services/emergencyService";
import {
    CheckCircleIcon,
    ExclamationCircleIcon,
    GlobeAltIcon,
    MapPinIcon,
    PencilSquareIcon,
} from "@heroicons/react/24/outline";

export const Profile: React.FC = () => {
    const { user, updateUser } = useAuth();

    // Personal form
    const [personal, setPersonal] = useState({
        name: "",
        email: "",
        telefono: "",
        direccion: "",
        ciudad: "",
        provincia: "",
        codigoPostal: "",
        latitude: "",
        longitude: "",
    });
    const [personalEditing, setPersonalEditing] = useState(false);
    const [personalLoading, setPersonalLoading] = useState(false);
    const [personalError, setPersonalError] = useState("");
    const [personalSuccess, setPersonalSuccess] = useState("");

    // Entity form (veterinaria or emergency)
    const [entity, setEntity] = useState<any>(null);
    const [entityEditing, setEntityEditing] = useState(false);
    const [entityLoading, setEntityLoading] = useState(false);
    const [entityError, setEntityError] = useState("");
    const [entitySuccess, setEntitySuccess] = useState("");

    // load user into form
    useEffect(() => {
        if (!user) return;

        const coords = (user as any).location?.coordinates;
        const lng =
            Array.isArray(coords) && typeof coords[0] === "number"
                ? String(coords[0])
                : "";
        const lat =
            Array.isArray(coords) && typeof coords[1] === "number"
                ? String(coords[1])
                : "";

        setPersonal({
            name: user.name || "",
            email: user.email || "",
            telefono: (user as any).telefono || "",
            direccion: (user as any).direccion || "",
            ciudad: (user as any).ciudad || "",
            provincia: (user as any).provincia || "",
            codigoPostal: (user as any).codigoPostal || "",
            latitude: lat,
            longitude: lng,
        });
    }, [user]);

    // load entity if role is veterinaria/emergency
    useEffect(() => {
        const loadEntity = async () => {
            if (!user) return;
            if (!user.role || !user.entityId) return;

            try {
                setEntityLoading(true);
                setEntityError("");
                setEntity(null);

                if (user.role === "veterinaria") {
                    const res: any = await veterinariaService.getById(
                        user.entityId
                    );
                    const doc = res?.data?.veterinaria ?? res?.veterinaria ?? res;
                    if (doc) {
                        setEntity({
                            id: doc.id ?? doc._id,
                            name: doc.name ?? "",
                            address: doc.address ?? "",
                            phone: doc.phone ?? "",
                            benefits: doc.benefits ?? "",
                            discount: doc.discount ?? "",
                            openingHours: doc.openingHours ?? doc.horario ?? "",
                            latitude:
                                doc.coordinates?.latitude ??
                                doc.location?.coordinates?.[1] ??
                                "",
                            longitude:
                                doc.coordinates?.longitude ??
                                doc.location?.coordinates?.[0] ??
                                "",
                            isActive:
                                typeof doc.isActive !== "undefined"
                                    ? !!doc.isActive
                                    : true,
                        });
                    }
                } else if (user.role === "emergency") {
                    // Emergency entity: load similarly to veterinaria
                    // Uses emergencyService.getEmergency(id) — adapt if your service uses a different method
                    const res: any = await emergencyService.getById(
                        user.entityId
                    );
                    const doc = res?.data?.emergency ?? res?.emergency ?? res;
                    if (doc) {
                        setEntity({
                            id: doc.id ?? doc._id,
                            name: doc.name ?? "",
                            serviceType: doc.serviceType ?? doc.type ?? "",
                            address: doc.address ?? "",
                            phone: doc.phone ?? doc.telefono ?? "",
                            url: doc.url ?? "",
                            horario: doc.horario ?? doc.openingHours ?? "",
                            latitude:
                                doc.coordinates?.latitude ??
                                doc.location?.coordinates?.[1] ??
                                "",
                            longitude:
                                doc.coordinates?.longitude ??
                                doc.location?.coordinates?.[0] ??
                                "",
                            isActive:
                                typeof doc.isActive !== "undefined"
                                    ? !!doc.isActive
                                    : true,
                        });
                    }
                }
            } catch (err: any) {
                setEntityError(
                    err?.response?.data?.message ||
                        err.message ||
                        "Error al cargar entidad"
                );
            } finally {
                setEntityLoading(false);
            }
        };

        loadEntity();
    }, [user]);

    // handlers personal
    const handlePersonalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPersonal({ ...personal, [e.target.name]: e.target.value });
    };

    const handleUseBrowserLocationPersonal = () => {
        if (!navigator.geolocation) {
            setPersonalError("Geolocalización no disponible en este navegador");
            return;
        }
        setPersonalError("");
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setPersonal((p) => ({
                    ...p,
                    latitude: String(pos.coords.latitude),
                    longitude: String(pos.coords.longitude),
                }));
            },
            (err) => {
                setPersonalError(
                    "No se pudo obtener la ubicación: " + err.message
                );
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleSavePersonal = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setPersonalError("");
        setPersonalSuccess("");
        setPersonalLoading(true);
        try {
            const payload: any = {
                name: personal.name,
                email: personal.email,
                telefono: personal.telefono,
                direccion: personal.direccion,
                ciudad: personal.ciudad,
                provincia: personal.provincia,
                codigoPostal: personal.codigoPostal,
            };

            const lat =
                personal.latitude !== "" ? parseFloat(personal.latitude) : NaN;
            const lng =
                personal.longitude !== ""
                    ? parseFloat(personal.longitude)
                    : NaN;
            if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
                payload.location = { type: "Point", coordinates: [lng, lat] };
            }

            const updated = await authService.updateProfile(payload);
            // Normalize possible shapes (authService.updateProfile tries to return user)
            const updatedUser =
                updated?.data?.user ?? updated?.user ?? updated ?? null;
            if (!updatedUser || !updatedUser.id) {
                // In some shapes updateProfile returns the user directly
                if (updated && updated.id) {
                    updateUser(updated);
                } else {
                    throw new Error(
                        "La respuesta no contiene el usuario actualizado"
                    );
                }
            } else {
                updateUser(updatedUser);
            }

            setPersonalSuccess("Perfil personal actualizado.");
            setPersonalEditing(false);
        } catch (err: any) {
            setPersonalError(
                err?.response?.data?.message ||
                    err.message ||
                    "Error al actualizar perfil personal"
            );
        } finally {
            setPersonalLoading(false);
        }
    };

    const handleCancelPersonal = () => {
        if (!user) return;
        const coords = (user as any).location?.coordinates;
        const lng =
            Array.isArray(coords) && typeof coords[0] === "number"
                ? String(coords[0])
                : "";
        const lat =
            Array.isArray(coords) && typeof coords[1] === "number"
                ? String(coords[1])
                : "";
        setPersonal({
            name: user.name || "",
            email: user.email || "",
            telefono: (user as any).telefono || "",
            direccion: (user as any).direccion || "",
            ciudad: (user as any).ciudad || "",
            provincia: (user as any).provincia || "",
            codigoPostal: (user as any).codigoPostal || "",
            latitude: lat,
            longitude: lng,
        });
        setPersonalError("");
        setPersonalSuccess("");
        setPersonalEditing(false);
    };

    // handlers entity
    const handleEntityChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        setEntity({ ...entity, [e.target.name]: e.target.value });
    };

    const handleUseBrowserLocationEntity = () => {
        if (!navigator.geolocation) {
            setEntityError("Geolocalización no disponible en este navegador");
            return;
        }
        setEntityError("");
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setEntity((prev: any) => ({
                    ...prev,
                    latitude: String(pos.coords.latitude),
                    longitude: String(pos.coords.longitude),
                }));
            },
            (err) =>
                setEntityError(
                    "No se pudo obtener la ubicación: " + err.message
                ),
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleSaveEntity = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!user?.entityId || !user?.role) {
            setEntityError("Entidad no vinculada o rol inválido");
            return;
        }
        setEntityError("");
        setEntitySuccess("");
        setEntityLoading(true);

        try {
            const payload: any = {};
            // common fields
            if (typeof entity.name !== "undefined") payload.name = entity.name;
            if (typeof entity.address !== "undefined")
                payload.address = entity.address;
            if (typeof entity.phone !== "undefined")
                payload.phone = entity.phone;
            if (typeof entity.isActive !== "undefined")
                payload.isActive = !!entity.isActive;

            // role specific
            if (user.role === "veterinaria") {
                if (typeof entity.benefits !== "undefined")
                    payload.benefits = entity.benefits;
                if (typeof entity.discount !== "undefined")
                    payload.discount = entity.discount;
                if (typeof entity.openingHours !== "undefined")
                    payload.openingHours = entity.openingHours;
            } else if (user.role === "emergency") {
                // emergency-specific fields (example)
                if (typeof entity.serviceType !== "undefined")
                    payload.serviceType = entity.serviceType;
                if (typeof entity.url !== "undefined") payload.url = entity.url;
                if (typeof entity.horario !== "undefined")
                    payload.horario = entity.horario;
            }

            // location
            if (
                typeof entity.latitude !== "undefined" &&
                typeof entity.longitude !== "undefined" &&
                entity.latitude !== "" &&
                entity.longitude !== ""
            ) {
                const lat = parseFloat(entity.latitude);
                const lng = parseFloat(entity.longitude);
                if (
                    Number.isNaN(lat) ||
                    Number.isNaN(lng) ||
                    lat < -90 ||
                    lat > 90 ||
                    lng < -180 ||
                    lng > 180
                ) {
                    throw new Error("Coordenadas inválidas");
                }
                payload.latitude = lat;
                payload.longitude = lng;
            }

            // call proper service
            if (user.role === "veterinaria") {
                await veterinariaService.update(user.entityId, payload);
            } else if (user.role === "emergency") {
                // emergencyService.update assumed — adapt if your service uses a different method
                await emergencyService.update(user.entityId, payload);
            } else {
                throw new Error("Rol no soportado para actualizar entidad");
            }

            setEntitySuccess("Perfil público actualizado.");
            setEntityEditing(false);
            // refresh entity data
            // re-fetch
            if (user.role === "veterinaria") {
                const res: any = await veterinariaService.getById(user.entityId);
                const doc = res?.data?.veterinaria ?? res?.veterinaria ?? res;
                setEntity({
                    id: doc.id ?? doc._id,
                    name: doc.name ?? "",
                    address: doc.address ?? "",
                    phone: doc.phone ?? "",
                    benefits: doc.benefits ?? "",
                    discount: doc.discount ?? "",
                    openingHours: doc.openingHours ?? doc.horario ?? "",
                    latitude:
                        doc.coordinates?.latitude ??
                        doc.location?.coordinates?.[1] ??
                        "",
                    longitude:
                        doc.coordinates?.longitude ??
                        doc.location?.coordinates?.[0] ??
                        "",
                    isActive:
                        typeof doc.isActive !== "undefined"
                            ? !!doc.isActive
                            : true,
                });
            } else if (user.role === "emergency") {
                const res: any = await emergencyService.getById(user.entityId);
                const doc = res?.data?.emergency ?? res?.emergency ?? res;
                setEntity({
                    id: doc.id ?? doc._id,
                    name: doc.name ?? "",
                    serviceType: doc.serviceType ?? doc.type ?? "",
                    address: doc.address ?? "",
                    phone: doc.phone ?? doc.telefono ?? "",
                    url: doc.url ?? "",
                    horario: doc.horario ?? doc.openingHours ?? "",
                    latitude:
                        doc.coordinates?.latitude ??
                        doc.location?.coordinates?.[1] ??
                        "",
                    longitude:
                        doc.coordinates?.longitude ??
                        doc.location?.coordinates?.[0] ??
                        "",
                    isActive:
                        typeof doc.isActive !== "undefined"
                            ? !!doc.isActive
                            : true,
                });
            }
        } catch (err: any) {
            setEntityError(
                err?.response?.data?.message ||
                    err.message ||
                    "Error al actualizar entidad"
            );
        } finally {
            setEntityLoading(false);
        }
    };

    if (!user) return null;

    const roleLabels: Record<string, string> = {
        admin: "Administrador",
        veterinaria: "Veterinaria",
        emergency: "Emergencias",
        user: "Paciente",
    };

    const inputClass =
        "mt-1 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-gray-100 disabled:text-gray-500";

    const sectionTitleClass = "text-lg sm:text-xl font-bold text-gray-900";

    const actionPrimaryClass =
        "inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition";

    const actionSecondaryClass =
        "inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition";

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 pb-28">
                <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-6 sm:p-8 text-white shadow-xl">
                    <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-white/10" />
                    <div className="absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-white/10" />

                    <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="text-xs font-medium uppercase tracking-[0.18em] text-blue-100">
                                Panel de perfil
                            </p>
                            <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">
                                {personal.name || "Mi perfil"}
                            </h1>
                            <p className="mt-2 text-sm text-blue-100 sm:text-base">
                                Gestioná tu información personal y, si corresponde, tu perfil público.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium">
                                Rol: {roleLabels[user.role || "user"] || "Usuario"}
                            </span>
                            <span
                                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border ${
                                    user.isVerified
                                        ? "border-emerald-200/30 bg-emerald-400/20 text-emerald-50"
                                        : "border-amber-200/30 bg-amber-400/20 text-amber-50"
                                }`}
                            >
                                {user.isVerified ? "Cuenta verificada" : "Verificación pendiente"}
                            </span>
                        </div>
                    </div>
                </section>

                {/* Personal panel */}
                <div className="rounded-[1.75rem] border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
                    <div className="mb-5 flex items-center justify-between gap-3">
                        <div>
                            <h2 className={sectionTitleClass}>Perfil personal</h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Tus datos básicos de cuenta y ubicación.
                            </p>
                        </div>
                        {!personalEditing && (
                            <button
                                onClick={() => setPersonalEditing(true)}
                                className={actionSecondaryClass}
                            >
                                <PencilSquareIcon className="mr-1.5 h-4 w-4" />
                                Editar
                            </button>
                        )}
                    </div>

                    {personalError && (
                        <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            <ExclamationCircleIcon className="mt-0.5 h-5 w-5 shrink-0" />
                            {personalError}
                        </div>
                    )}
                    {personalSuccess && (
                        <div className="mb-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                            <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0" />
                            {personalSuccess}
                        </div>
                    )}

                    <form onSubmit={handleSavePersonal}>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Nombre completo
                                </label>
                                <input
                                    name="name"
                                    value={personal.name}
                                    onChange={handlePersonalChange}
                                    disabled={!personalEditing}
                                    className={inputClass}
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Email
                                </label>
                                <input
                                    name="email"
                                    value={personal.email}
                                    onChange={handlePersonalChange}
                                    disabled
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Teléfono
                                </label>
                                <input
                                    name="telefono"
                                    value={personal.telefono}
                                    onChange={handlePersonalChange}
                                    disabled={!personalEditing}
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Ciudad
                                </label>
                                <input
                                    name="ciudad"
                                    value={personal.ciudad}
                                    onChange={handlePersonalChange}
                                    disabled={!personalEditing}
                                    className={inputClass}
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Dirección
                                </label>
                                <input
                                    name="direccion"
                                    value={personal.direccion}
                                    onChange={handlePersonalChange}
                                    disabled={!personalEditing}
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Provincia
                                </label>
                                <input
                                    name="provincia"
                                    value={personal.provincia}
                                    onChange={handlePersonalChange}
                                    disabled={!personalEditing}
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Código postal
                                </label>
                                <input
                                    name="codigoPostal"
                                    value={personal.codigoPostal}
                                    onChange={handlePersonalChange}
                                    disabled={!personalEditing}
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Latitud
                                </label>
                                <input
                                    name="latitude"
                                    value={personal.latitude}
                                    onChange={handlePersonalChange}
                                    disabled={!personalEditing}
                                    placeholder="-31.39721"
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Longitud
                                </label>
                                <input
                                    name="longitude"
                                    value={personal.longitude}
                                    onChange={handlePersonalChange}
                                    disabled={!personalEditing}
                                    placeholder="-64.20185"
                                    className={inputClass}
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <button
                                    type="button"
                                    onClick={handleUseBrowserLocationPersonal}
                                    disabled={!personalEditing}
                                    className={`mt-1 inline-flex items-center rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                                        personalEditing
                                            ? "bg-indigo-600 text-white hover:bg-indigo-700"
                                            : "bg-gray-200 text-gray-700"
                                    }`}
                                >
                                    <MapPinIcon className="mr-1.5 h-4 w-4" />
                                    Obtener ubicación desde el navegador
                                </button>
                            </div>
                        </div>

                        {personalEditing && (
                            <div className="mt-5 flex flex-wrap gap-3">
                                <button
                                    type="submit"
                                    disabled={personalLoading}
                                    className={actionPrimaryClass}
                                >
                                    {personalLoading
                                        ? "Guardando..."
                                        : "Guardar personal"}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCancelPersonal}
                                    className={actionSecondaryClass}
                                >
                                    Cancelar
                                </button>
                            </div>
                        )}
                    </form>
                </div>

                {/* Entity panel (veterinaria | emergency) */}
                {(user.role === "veterinaria" ||
                    user.role === "emergency") && (
                    <div className="rounded-[1.75rem] border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
                        <div className="mb-5 flex items-center justify-between gap-3">
                            <div>
                                <h2 className={sectionTitleClass}>
                                    Perfil público ({roleLabels[user.role] || user.role})
                                </h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    Lo que ven tus pacientes o usuarios en la app.
                                </p>
                            </div>
                            {!entityEditing && (
                                <button
                                    onClick={() => setEntityEditing(true)}
                                    className={actionSecondaryClass}
                                >
                                    <PencilSquareIcon className="mr-1.5 h-4 w-4" />
                                    Editar
                                </button>
                            )}
                        </div>

                        {entityLoading && (
                            <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
                                Cargando información de la entidad...
                            </div>
                        )}
                        {entityError && (
                            <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                <ExclamationCircleIcon className="mt-0.5 h-5 w-5 shrink-0" />
                                {entityError}
                            </div>
                        )}
                        {entitySuccess && (
                            <div className="mb-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                                <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0" />
                                {entitySuccess}
                            </div>
                        )}

                        {!entity && !entityLoading && (
                            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-600">
                                No hay entidad vinculada.
                            </div>
                        )}

                        {entity && (
                            <form onSubmit={handleSaveEntity}>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="sm:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Nombre público
                                        </label>
                                        <input
                                            name="name"
                                            value={entity.name}
                                            onChange={handleEntityChange}
                                            disabled={!entityEditing}
                                            className={inputClass}
                                        />
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Dirección
                                        </label>
                                        <input
                                            name="address"
                                            value={entity.address}
                                            onChange={handleEntityChange}
                                            disabled={!entityEditing}
                                            className={inputClass}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Teléfono
                                        </label>
                                        <input
                                            name="phone"
                                            value={entity.phone}
                                            onChange={handleEntityChange}
                                            disabled={!entityEditing}
                                            className={inputClass}
                                        />
                                    </div>

                                    {user.role === "veterinaria" && (
                                        <>
                                            <div className="sm:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Beneficios
                                                </label>
                                                <input
                                                    name="benefits"
                                                    value={entity.benefits}
                                                    onChange={
                                                        handleEntityChange
                                                    }
                                                    disabled={!entityEditing}
                                                    className={inputClass}
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Descuento (%)
                                                </label>
                                                <input
                                                    name="discount"
                                                    value={String(
                                                        entity.discount ?? ""
                                                    )}
                                                    onChange={
                                                        handleEntityChange
                                                    }
                                                    disabled={!entityEditing}
                                                    className={inputClass}
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Horario
                                                </label>
                                                <input
                                                    name="openingHours"
                                                    value={entity.openingHours}
                                                    onChange={
                                                        handleEntityChange
                                                    }
                                                    disabled={!entityEditing}
                                                    className={inputClass}
                                                />
                                            </div>
                                        </>
                                    )}

                                    {user.role === "emergency" && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    URL / Link
                                                </label>
                                                <input
                                                    name="url"
                                                    value={entity.url}
                                                    onChange={
                                                        handleEntityChange
                                                    }
                                                    disabled={!entityEditing}
                                                    className={inputClass}
                                                />
                                            </div>

 
                                        </>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Latitud
                                        </label>
                                        <input
                                            name="latitude"
                                            value={entity.latitude}
                                            onChange={handleEntityChange}
                                            disabled={!entityEditing}
                                            className={inputClass}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Longitud
                                        </label>
                                        <input
                                            name="longitude"
                                            value={entity.longitude}
                                            onChange={handleEntityChange}
                                            disabled={!entityEditing}
                                            className={inputClass}
                                        />
                                    </div>

                                    <div className="sm:col-span-2">
                                        <button
                                            type="button"
                                            onClick={
                                                handleUseBrowserLocationEntity
                                            }
                                            disabled={!entityEditing}
                                            className={`mt-1 inline-flex items-center rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                                                entityEditing
                                                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                                                    : "bg-gray-200 text-gray-700"
                                            }`}
                                        >
                                            <GlobeAltIcon className="mr-1.5 h-4 w-4" />
                                            Obtener ubicación desde el navegador
                                        </button>
                                    </div>
                                </div>

                                {entityEditing && (
                                    <div className="mt-5 flex flex-wrap gap-3">
                                        <button
                                            type="submit"
                                            disabled={entityLoading}
                                            className={actionPrimaryClass}
                                        >
                                            {entityLoading
                                                ? "Guardando..."
                                                : "Guardar entidad"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                /* reload entity to cancel */ setEntityEditing(
                                                    false
                                                );
                                                setEntityError("");
                                                setEntitySuccess("");
                                            }}
                                            className={actionSecondaryClass}
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                )}
                            </form>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;
