import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../services/authService";
import PasswordInput from "../components/PasswordInput";
import {
    ShieldCheckIcon,
    ArrowRightIcon,
    ArrowLeftIcon,
    ExclamationCircleIcon,
    BuildingStorefrontIcon,
    BoltIcon,
    MapPinIcon,
    LockClosedIcon,
    IdentificationIcon,
    CheckIcon,
} from "@heroicons/react/24/outline";

const ROLE_META = {
    veterinaria: {
        label: "Veterinaria",
        icon: BuildingStorefrontIcon,
        desc: "Registrá tu veterinaria, ofrecé videoconsultas y conectate con miles de dueños de mascotas.",
    },
    emergency: {
        label: "Servicio de emergencias",
        icon: BoltIcon,
        desc: "Sumá tu servicio a la red de emergencias de Vetfind.",
    },
};

const STEPS = [
    {
        number: 1,
        title: "Tipo de entidad",
        subtitle: "¿Qué tipo de prestador sos?",
        icon: IdentificationIcon,
    },
    {
        number: 2,
        title: "Credenciales",
        subtitle: "Email y contraseña de acceso",
        icon: LockClosedIcon,
    },
    {
        number: 3,
        title: "Perfil y ubicación",
        subtitle: "Datos del servicio",
        icon: MapPinIcon,
    },
];

export const RegisterEntity: React.FC = () => {
    const [step, setStep] = useState(1);
    const [role, setRole] = useState<"veterinaria" | "emergency">("veterinaria");

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        telefono: "",
        direccion: "",
        ciudad: "",
        provincia: "",
        codigoPostal: "",
        latitude: "",
        longitude: "",
        benefits: "",
        discount: "",
        openingHours: "",
    });

    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [geoLoading, setGeoLoading] = useState(false);
    const navigate = useNavigate();

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            setError("Tu navegador no soporta geolocalización.");
            return;
        }
        setGeoLoading(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setFormData((prev) => ({
                    ...prev,
                    latitude: pos.coords.latitude.toFixed(6),
                    longitude: pos.coords.longitude.toFixed(6),
                }));
                setGeoLoading(false);
            },
            () => {
                setError("No se pudo obtener la ubicación. Revisá los permisos del navegador.");
                setGeoLoading(false);
            }
        );
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const toNumberOrUndefined = (v: string) => {
        if (v === "" || v === null || typeof v === "undefined") return undefined;
        const n = Number(v);
        return Number.isNaN(n) ? undefined : n;
    };

    const cleanString = (v: string) => (v === "" ? undefined : v);

    const validateStep = (): boolean => {
        setError("");
        if (step === 1 && !formData.name.trim()) {
            setError("El nombre es requerido.");
            return false;
        }
        if (step === 2) {
            if (!formData.email.trim()) {
                setError("El correo electrónico es requerido.");
                return false;
            }
            if (!formData.password) {
                setError("La contraseña es requerida.");
                return false;
            }
            if (formData.password !== formData.confirmPassword) {
                setError("Las contraseñas no coinciden.");
                return false;
            }
        }
        return true;
    };

    const handleNext = () => {
        if (validateStep()) setStep((s) => s + 1);
    };

    const handleBack = () => {
        setError("");
        setStep((s) => s - 1);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateStep()) return;
        setError("");

        if (formData.password !== formData.confirmPassword) {
            setError("Las contraseñas no coinciden");
            return;
        }

        setIsLoading(true);
        try {
            const payload: any = {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                latitude: toNumberOrUndefined(formData.latitude),
                longitude: toNumberOrUndefined(formData.longitude),
                role,
            };

            if (role === "veterinaria") {
                payload.entityName = cleanString(formData.name);
                payload.address = cleanString(formData.direccion);
                payload.phone = cleanString(formData.telefono);
                payload.benefits = cleanString(formData.benefits);
                payload.discount = toNumberOrUndefined(formData.discount);
                payload.openingHours = cleanString(formData.openingHours);
            } else if (role === "emergency") {
                payload.entityName = cleanString(formData.name);
                payload.address = cleanString(formData.direccion);
                payload.phone = cleanString(formData.telefono);
                payload.openingHours = cleanString(formData.openingHours);
            }

            await authService.register(payload);
            navigate("/login");
        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                    err.message ||
                    "Error en el registro"
            );
        } finally {
            setIsLoading(false);
        }
    };

    const inputClass =
        "w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition";
    const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

    const ActiveIcon = ROLE_META[role].icon;

    return (
        <div className="min-h-screen flex">
            {/* Left panel — verde médico con stepper */}
            <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-700 flex-col justify-between p-12 relative overflow-hidden">
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/5 rounded-full" />
                <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3" />

                {/* Logo */}
                <div className="relative z-10">
                    <Link to="/" className="text-white text-2xl font-bold tracking-tight hover:opacity-80 transition">
                        Vetfind
                    </Link>
                </div>

                {/* Hero + Stepper */}
                <div className="relative z-10 space-y-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white leading-snug mb-2">
                            Súmate a la red <br />de salud Vetfind.
                        </h1>
                        <p className="text-emerald-100 text-sm">
                            Completá los pasos para registrar tu prestador.
                        </p>
                    </div>

                    {/* Vertical step list */}
                    <div>
                        {STEPS.map((s, idx) => {
                            const isCompleted = step > s.number;
                            const isCurrent = step === s.number;
                            const StepIcon = s.icon;
                            const isLast = idx === STEPS.length - 1;

                            return (
                                <div key={s.number} className="flex items-start gap-4">
                                    {/* Connector column */}
                                    <div className="flex flex-col items-center">
                                        <div
                                            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                                                isCompleted
                                                    ? "bg-white text-emerald-700"
                                                    : isCurrent
                                                    ? "bg-white/20 border-2 border-white text-white"
                                                    : "bg-white/10 border border-white/20 text-white/40"
                                            }`}
                                        >
                                            {isCompleted ? (
                                                <CheckIcon className="w-5 h-5" />
                                            ) : (
                                                <StepIcon className="w-5 h-5" />
                                            )}
                                        </div>
                                        {!isLast && (
                                            <div
                                                className={`w-0.5 h-12 mt-1 transition-all duration-300 ${
                                                    isCompleted ? "bg-white/60" : "bg-white/15"
                                                }`}
                                            />
                                        )}
                                    </div>

                                    {/* Step text */}
                                    <div className={`pt-1.5 ${isLast ? "pb-0" : "pb-10"}`}>
                                        <p
                                            className={`text-sm font-semibold transition-all duration-300 ${
                                                isCurrent
                                                    ? "text-white"
                                                    : isCompleted
                                                    ? "text-white/80"
                                                    : "text-white/40"
                                            }`}
                                        >
                                            {s.title}
                                        </p>
                                        <p
                                            className={`text-xs mt-0.5 transition-all duration-300 ${
                                                isCurrent
                                                    ? "text-emerald-100"
                                                    : isCompleted
                                                    ? "text-white/50"
                                                    : "text-white/25"
                                            }`}
                                        >
                                            {s.subtitle}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="relative z-10 text-emerald-300 text-xs">
                    © {new Date().getFullYear()} Vetfind. Todos los derechos reservados.
                </div>
            </div>

            {/* Right panel — formulario */}
            <div className="flex-1 flex items-start justify-center bg-gray-50 px-6 py-12 overflow-y-auto">
                <div className="w-full max-w-lg">

                    {/* Mobile logo */}
                    <div className="lg:hidden mb-6 text-center">
                        <Link to="/" className="text-emerald-700 text-2xl font-bold tracking-tight hover:opacity-80 transition">
                            Vetfind
                        </Link>
                    </div>

                    {/* Mobile step dots */}
                    <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
                        {STEPS.map((s) => (
                            <div
                                key={s.number}
                                className={`h-2 rounded-full transition-all duration-300 ${
                                    step === s.number
                                        ? "w-6 bg-emerald-600"
                                        : step > s.number
                                        ? "w-2 bg-emerald-400"
                                        : "w-2 bg-gray-300"
                                }`}
                            />
                        ))}
                    </div>

                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-start justify-between mb-4">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-50">
                                <ActiveIcon className="w-6 h-6 text-emerald-600" />
                            </div>
                            <Link
                                to="/"
                                className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-emerald-600 transition"
                            >
                                <ArrowRightIcon className="w-3.5 h-3.5 rotate-180" />
                                Volver al inicio
                            </Link>
                        </div>
                        <p className="text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-1">
                            Paso {step} de {STEPS.length}
                        </p>
                        <h2 className="text-2xl font-bold text-gray-900">{STEPS[step - 1].title}</h2>
                        <p className="text-sm text-gray-500 mt-1">{STEPS[step - 1].subtitle}</p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mb-5 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                            <ExclamationCircleIcon className="w-5 h-5 shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form
                        onSubmit={step === STEPS.length ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}
                        className="space-y-5"
                    >
                        {/* ── PASO 1: Tipo de entidad + nombre + teléfono ── */}
                        {step === 1 && (
                            <>
                                <div>
                                    <label className={labelClass}>Tipo de entidad</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {(["veterinaria", "emergency"] as const).map((r) => {
                                            const Icon = ROLE_META[r].icon;
                                            return (
                                                <button
                                                    key={r}
                                                    type="button"
                                                    onClick={() => setRole(r)}
                                                    className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg border text-xs font-medium transition ${
                                                        role === r
                                                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                                            : "border-gray-200 bg-white text-gray-600 hover:border-emerald-300 hover:bg-emerald-50/50"
                                                    }`}
                                                >
                                                    <Icon className="w-5 h-5" />
                                                    {ROLE_META[r].label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="name" className={labelClass}>
                                        Nombre <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        required
                                        placeholder={
                                            role === "veterinaria"
                                                ? "Veterinaria El Sol"
                                                : "Emergencias del Norte"
                                        }
                                        className={inputClass}
                                        value={formData.name}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="telefono" className={labelClass}>Teléfono</label>
                                    <input
                                        id="telefono"
                                        name="telefono"
                                        type="tel"
                                        placeholder="+54 9 351 000-0000"
                                        className={inputClass}
                                        value={formData.telefono}
                                        onChange={handleChange}
                                    />
                                </div>
                            </>
                        )}

                        {/* ── PASO 2: Credenciales ── */}
                        {step === 2 && (
                            <>
                                <div>
                                    <label htmlFor="email" className={labelClass}>
                                        Correo electrónico <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        placeholder="contacto@ejemplo.com"
                                        className={inputClass}
                                        value={formData.email}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="password" className={labelClass}>
                                        Contraseña <span className="text-red-500">*</span>
                                    </label>
                                    <PasswordInput
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        autoComplete="new-password"
                                        placeholder="••••••••"
                                        className="[&_input]:px-4 [&_input]:py-2.5 [&_input]:rounded-lg [&_input]:text-sm [&_input]:border-gray-300 [&_input]:focus:ring-2 [&_input]:focus:ring-emerald-500 [&_input]:focus:border-transparent [&_input]:transition [&_input]:mt-0"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="confirmPassword" className={labelClass}>
                                        Repetir contraseña <span className="text-red-500">*</span>
                                    </label>
                                    <PasswordInput
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        required
                                        autoComplete="new-password"
                                        placeholder="••••••••"
                                        className="[&_input]:px-4 [&_input]:py-2.5 [&_input]:rounded-lg [&_input]:text-sm [&_input]:border-gray-300 [&_input]:focus:ring-2 [&_input]:focus:ring-emerald-500 [&_input]:focus:border-transparent [&_input]:transition [&_input]:mt-0"
                                    />
                                </div>
                            </>
                        )}

                        {/* ── PASO 3: Perfil y ubicación ── */}
                        {step === 3 && (
                            <>
                                <div>
                                    <label htmlFor="direccion" className={labelClass}>Dirección</label>
                                    <input
                                        id="direccion"
                                        name="direccion"
                                        type="text"
                                        placeholder="Av. Colón 1234"
                                        className={inputClass}
                                        value={formData.direccion}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-sm font-medium text-gray-700">Latitud / Longitud</span>
                                        <button
                                            type="button"
                                            onClick={handleGetLocation}
                                            disabled={geoLoading}
                                            className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                        >
                                            {geoLoading ? (
                                                <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                                </svg>
                                            ) : (
                                                <MapPinIcon className="w-3.5 h-3.5" />
                                            )}
                                            Usar mi ubicación
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <input
                                            id="latitude"
                                            name="latitude"
                                            placeholder="Latitud  −31.4201"
                                            className={inputClass}
                                            value={formData.latitude}
                                            onChange={handleChange}
                                        />
                                        <input
                                            id="longitude"
                                            name="longitude"
                                            placeholder="Longitud  −64.1888"
                                            className={inputClass}
                                            value={formData.longitude}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                {/* Campos condicionales por rol */}
                                {role === "veterinaria" && (
                                    <div className="space-y-5 pt-2 border-t border-gray-100">
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-1">
                                            Datos de veterinaria
                                        </p>
                                        <div>
                                            <label htmlFor="benefits" className={labelClass}>Beneficios</label>
                                            <input
                                                id="benefits"
                                                name="benefits"
                                                placeholder="Descuentos en genéricos, atención 24hs..."
                                                className={inputClass}
                                                value={formData.benefits}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label htmlFor="discount" className={labelClass}>Descuento (%)</label>
                                                <input
                                                    id="discount"
                                                    name="discount"
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    placeholder="40"
                                                    className={inputClass}
                                                    value={formData.discount}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="openingHours" className={labelClass}>Horario</label>
                                                <input
                                                    id="openingHours"
                                                    name="openingHours"
                                                    placeholder="Lun-Vie 8:00-20:00"
                                                    className={inputClass}
                                                    value={formData.openingHours}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {role === "emergency" && (
                                    <div className="space-y-5 pt-2 border-t border-gray-100">
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-1">
                                            Datos del servicio de emergencias
                                        </p>
                                        <div>
                                            <label htmlFor="openingHours" className={labelClass}>Disponibilidad</label>
                                            <input
                                                id="openingHours"
                                                name="openingHours"
                                                placeholder="24hs / Lun-Dom"
                                                className={inputClass}
                                                value={formData.openingHours}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Botones de navegación */}
                        <div className="flex gap-3 pt-2">
                            {step > 1 && (
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    className="flex items-center justify-center gap-2 border border-gray-300 hover:border-emerald-400 hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 font-medium py-2.5 px-5 rounded-lg text-sm transition"
                                >
                                    <ArrowLeftIcon className="w-4 h-4" />
                                    Anterior
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-lg text-sm transition focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                            >
                                {step < STEPS.length ? (
                                    <>
                                        Siguiente
                                        <ArrowRightIcon className="w-4 h-4" />
                                    </>
                                ) : isLoading ? (
                                    <>
                                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                        </svg>
                                        Registrando...
                                    </>
                                ) : (
                                    <>
                                        Registrar entidad
                                        <ArrowRightIcon className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Divider */}
                    <div className="my-6 flex items-center gap-3">
                        <div className="flex-1 h-px bg-gray-200" />
                        <span className="text-xs text-gray-400">¿Ya tenés cuenta?</span>
                        <div className="flex-1 h-px bg-gray-200" />
                    </div>

                    <Link
                        to="/login"
                        className="w-full flex items-center justify-center gap-2 border border-gray-300 hover:border-emerald-400 hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 font-medium py-2.5 px-4 rounded-lg text-sm transition"
                    >
                        Iniciar sesión
                    </Link>

                    <p className="mt-8 text-center text-xs text-gray-400 flex items-center justify-center gap-1.5">
                        <ShieldCheckIcon className="w-3.5 h-3.5" />
                        Conexión segura — tus datos están protegidos
                    </p>
                </div>
            </div>
        </div>
    );
};
