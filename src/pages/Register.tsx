import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../services/authService";
import adminService from "../services/adminService";
import PasswordInput from "../components/PasswordInput";
import { BrandLogo } from "../components/BrandLogo";
import {
    ShieldCheckIcon,
    UserPlusIcon,
    ArrowRightIcon,
    ArrowLeftIcon,
    ExclamationCircleIcon,
    CheckCircleIcon,
    BuildingOffice2Icon,
    LockClosedIcon,
    CheckIcon,
} from "@heroicons/react/24/outline";

const STEPS = [
    {
        number: 1,
        title: "Cobertura",
        subtitle: "Particular o institución",
        icon: BuildingOffice2Icon,
    },
    {
        number: 2,
        title: "Tu cuenta",
        subtitle: "Datos personales y acceso",
        icon: LockClosedIcon,
    },
];

export const Register: React.FC = () => {
    const [step, setStep] = useState(1);
    const [coverageType, setCoverageType] = useState<"particular" | "institucion">("particular");
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        name: "",
        telefono: "",
        direccion: "",
        ciudad: "",
        provincia: "",
        codigoPostal: "",
        insurerId: "",
        planId: "",
    });
    const [insurers, setInsurers] = useState<Array<{ id: string; name: string }>>([]);
    const [plans, setPlans] = useState<Array<{ id: string; name: string; insurerId?: string }>>([]);
    const [loadingInsurers, setLoadingInsurers] = useState(false);
    const [loadingPlans, setLoadingPlans] = useState(false);
    const [showInsurerPicker, setShowInsurerPicker] = useState(false);
    const [showPlanPicker, setShowPlanPicker] = useState(false);
    const [insurerSearch, setInsurerSearch] = useState("");
    const [planSearch, setPlanSearch] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const navigate = useNavigate();

    const normalizeList = (res: any, key: string) => {
        const candidates = [
            res?.data?.[key],
            // Legacy providers payload: { success, data: { providers: [...] } }
            key === "insurers" ? res?.data?.providers : undefined,
            res?.[key],
            key === "insurers" ? res?.providers : undefined,
            res?.data?.items,
            res?.items,
            res?.data,
            res,
        ];
        const list = candidates.find((c) => Array.isArray(c));
        return Array.isArray(list) ? list : [];
    };

    useEffect(() => {
        const loadInsurers = async () => {
            try {
                setLoadingInsurers(true);
                const res: any = await adminService.listInsurers({
                    page: 1,
                    limit: 200,
                });
                const list = normalizeList(res, "insurers");
                const normalized = list
                    .map((i: any) => ({
                        id: String(i?._id ?? i?.id ?? ""),
                        name: String(i?.name ?? i?.nombre ?? "Sin nombre"),
                        category: String(
                            i?.category ?? i?.kind ?? i?.type ?? ""
                        ).toLowerCase(),
                    }))
                    .filter((p) => Boolean(p.id))
                    // Keep only social insurers when data comes from mixed providers.
                    .filter((p) =>
                        p.category
                            ? p.category.includes("obra social") ||
                              p.category.includes("social") ||
                              p.category.includes("prepaga") ||
                              p.category.includes("seguro")
                            : true
                    )
                    .map(({ id, name }) => ({ id, name }));

                setInsurers(normalized);
            } catch (err) {
                console.warn("No se pudieron cargar obras sociales", err);
                setInsurers([]);
            } finally {
                setLoadingInsurers(false);
            }
        };

        loadInsurers();
    }, []);

    useEffect(() => {
        const loadPlans = async () => {
            if (!formData.insurerId) {
                setPlans([]);
                setFormData((prev) => ({ ...prev, planId: "" }));
                return;
            }

            try {
                setLoadingPlans(true);
                const res: any = await adminService.listPlans({
                    page: 1,
                    limit: 200,
                    insurerId: formData.insurerId,
                });
                const list = normalizeList(res, "plans");
                const normalized = list
                    .map((p: any) => ({
                        id: String(p?._id ?? p?.id ?? ""),
                        name: String(p?.name ?? p?.nombre ?? "Sin nombre"),
                        insurerId: String(p?.insurerId?._id ?? p?.insurerId ?? ""),
                    }))
                    .filter((p) => Boolean(p.id));

                setPlans(normalized);
            } catch (err) {
                console.warn("No se pudieron cargar planes", err);
                setPlans([]);
            } finally {
                setLoadingPlans(false);
            }
        };

        loadPlans();
    }, [formData.insurerId]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const validateStep = (): boolean => {
        setError("");

        if (step === 1) {
            if (coverageType === "institucion" && !formData.insurerId) {
                setError("Seleccioná una institución para continuar.");
                return false;
            }
        }

        if (step === 2) {
            if (!formData.name.trim()) {
                setError("El nombre completo es requerido.");
                return false;
            }
            if (!formData.email.trim()) {
                setError("El correo electrónico es requerido.");
                return false;
            }
            if (!formData.password) {
                setError("La contraseña es requerida.");
                return false;
            }
            if (formData.password !== formData.confirmPassword) {
                setError("Las contraseñas no coinciden");
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

        setIsLoading(true);
        try {
            const { confirmPassword, insurerId, planId, ...rest } = formData;
            const registerData = {
                ...rest,
                role: "user",
                insurerId: insurerId || null,
                planId: planId || null,
                // backward compatibility with older backend payload contracts
                entityId: insurerId || null,
            };
            const resp = await authService.register(registerData);
            const message =
                (resp && resp.message) ||
                (resp?.data && resp.data.message) ||
                "Registro exitoso. Por favor verificá tu correo.";
            setSuccessMessage(String(message));
            setShowSuccessModal(true);
        } catch (err) {
            const errorObj = err as {
                response?: { data?: { message?: string } };
                message?: string;
            };
            setError(
                errorObj.response?.data?.message ||
                    errorObj.message ||
                    "Error al registrar usuario"
            );
        } finally {
            setIsLoading(false);
        }
    };

    const closeModal = () => {
        setShowSuccessModal(false);
        navigate("/login");
    };

    const inputClass =
        "w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition";
    const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";
    const selectedInsurer = insurers.find((i) => i.id === formData.insurerId);
    const selectedPlan = plans.find((p) => p.id === formData.planId);
    const filteredInsurers = insurers.filter((i) =>
        i.name.toLowerCase().includes(insurerSearch.toLowerCase())
    );
    const filteredPlans = plans.filter((p) =>
        p.name.toLowerCase().includes(planSearch.toLowerCase())
    );

    return (
        <div className="min-h-screen flex">
            {/* Left panel — bienvenida + stepper */}
            <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-brand-900 via-brand-700 to-brand-600 flex-col justify-between p-12 relative overflow-hidden">
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/5 rounded-full" />
                <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3" />

                <div className="relative z-10">
                    <BrandLogo variant="onDark" size="lg" />
                </div>

                <div className="relative z-10 space-y-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10">
                        <UserPlusIcon className="w-8 h-8 text-white" />
                    </div>

                    <div>
                        <h1 className="text-4xl font-bold text-white leading-snug">
                            Bienvenido a <br />
                            Vetfind.
                        </h1>
                        <p className="text-brand-100 text-base leading-relaxed max-w-sm mt-2">
                            Un buen onboarding hace la diferencia: te guiamos paso a paso para que tu cuenta quede lista en minutos.
                        </p>
                    </div>

                    <div>
                        {STEPS.map((s, idx) => {
                            const isCompleted = step > s.number;
                            const isCurrent = step === s.number;
                            const StepIcon = s.icon;
                            const isLast = idx === STEPS.length - 1;

                            return (
                                <div key={s.number} className="flex items-start gap-4">
                                    <div className="flex flex-col items-center">
                                        <div
                                            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                                                isCompleted
                                                    ? "bg-white text-brand-700"
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
                                                    ? "text-brand-100"
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

                <div className="relative z-10 text-brand-300 text-xs">
                    © {new Date().getFullYear()} Vetfind. Todos los derechos reservados.
                </div>
            </div>

            {/* Right panel — onboarding */}
            <div className="flex-1 flex items-start justify-center bg-gray-50 px-6 py-12 overflow-y-auto">
                <div className="w-full max-w-lg">
                    <div className="lg:hidden mb-6 flex justify-center">
                        <BrandLogo variant="onLight" size="lg" />
                    </div>

                    <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
                        {STEPS.map((s) => (
                            <div
                                key={s.number}
                                className={`h-2 rounded-full transition-all duration-300 ${
                                    step === s.number
                                        ? "w-6 bg-brand-600"
                                        : step > s.number
                                        ? "w-2 bg-brand-400"
                                        : "w-2 bg-gray-300"
                                }`}
                            />
                        ))}
                    </div>

                    <div className="mb-8">
                        <div className="flex items-start justify-between mb-4">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-50">
                                <UserPlusIcon className="w-6 h-6 text-brand-600" />
                            </div>
                            <Link
                                to="/"
                                className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 transition"
                            >
                                <ArrowRightIcon className="w-3.5 h-3.5 rotate-180" />
                                Volver al inicio
                            </Link>
                        </div>
                        <p className="text-xs font-semibold text-brand-600 uppercase tracking-widest mb-1">
                            Paso {step} de {STEPS.length}
                        </p>
                        <h2 className="text-2xl font-bold text-gray-900">{STEPS[step - 1].title}</h2>
                        <p className="text-sm text-gray-500 mt-1">{STEPS[step - 1].subtitle}</p>
                    </div>

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
                        {step === 1 && (
                            <>
                                <div>
                                    <label className={labelClass}>¿Cómo te atendés?</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setCoverageType("particular");
                                                setFormData((prev) => ({ ...prev, insurerId: "", planId: "" }));
                                                setShowInsurerPicker(false);
                                                setShowPlanPicker(false);
                                                setError("");
                                            }}
                                            className={`text-left rounded-xl border p-4 transition ${
                                                coverageType === "particular"
                                                    ? "border-brand-500 bg-brand-50"
                                                    : "border-gray-200 bg-white hover:border-brand-300"
                                            }`}
                                        >
                                            <p className="text-sm font-semibold text-gray-900">Sin institución</p>
                                            <p className="text-xs text-gray-500 mt-1">Cobertura con plan base de Vetfind</p>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setCoverageType("institucion");
                                                setShowInsurerPicker(true);
                                                setError("");
                                            }}
                                            className={`text-left rounded-xl border p-4 transition ${
                                                coverageType === "institucion"
                                                    ? "border-brand-500 bg-brand-50"
                                                    : "border-gray-200 bg-white hover:border-brand-300"
                                            }`}
                                        >
                                            <p className="text-sm font-semibold text-gray-900">Cobertura</p>
                                            <p className="text-xs text-gray-500 mt-1">Obra social, prepaga o seguro</p>
                                        </button>
                                    </div>
                                </div>

                                {coverageType === "institucion" && (
                                    <>
                                        <div>
                                            <label className={labelClass}>Institución</label>
                                            <button
                                                type="button"
                                                onClick={() => setShowInsurerPicker((s) => !s)}
                                                className="w-full text-left px-4 py-2.5 bg-white hover:bg-brand-50 text-gray-700 text-sm rounded-lg border border-gray-300 transition"
                                            >
                                                {selectedInsurer
                                                    ? selectedInsurer.name
                                                    : "Seleccionar institución"}
                                            </button>

                                            {showInsurerPicker && (
                                                <div className="mt-3 border border-gray-200 rounded-xl bg-white p-3">
                                                    <input
                                                        type="text"
                                                        value={insurerSearch}
                                                        onChange={(e) => setInsurerSearch(e.target.value)}
                                                        placeholder="Buscar obra social..."
                                                        className={inputClass}
                                                    />

                                                    <div className="mt-3 flex flex-wrap gap-2 max-h-44 overflow-y-auto pr-1">
                                                        {loadingInsurers && (
                                                            <span className="text-xs text-gray-500">
                                                                Cargando instituciones...
                                                            </span>
                                                        )}

                                                        {!loadingInsurers && filteredInsurers.length === 0 && (
                                                            <span className="text-xs text-gray-500">
                                                                No se encontraron instituciones.
                                                            </span>
                                                        )}

                                                        {!loadingInsurers &&
                                                            filteredInsurers.map((insurer) => {
                                                                const active = formData.insurerId === insurer.id;
                                                                return (
                                                                    <button
                                                                        key={insurer.id}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setFormData((prev) => ({
                                                                                ...prev,
                                                                                insurerId: insurer.id,
                                                                                planId: "",
                                                                            }));
                                                                            setShowInsurerPicker(false);
                                                                            setShowPlanPicker(true);
                                                                        }}
                                                                        className={`px-3 py-1.5 rounded-full text-xs border transition ${
                                                                            active
                                                                                ? "bg-brand-600 text-white border-brand-600"
                                                                                : "bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100"
                                                                        }`}
                                                                    >
                                                                        {insurer.name}
                                                                    </button>
                                                                );
                                                            })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <label className={labelClass}>Plan (opcional)</label>
                                            <button
                                                type="button"
                                                onClick={() => setShowPlanPicker((s) => !s)}
                                                disabled={!formData.insurerId}
                                                className="w-full text-left px-4 py-2.5 bg-white hover:bg-brand-50 disabled:bg-gray-100 disabled:text-gray-400 text-gray-700 text-sm rounded-lg border border-gray-300 transition"
                                            >
                                                {selectedPlan
                                                    ? selectedPlan.name
                                                    : "Seleccionar plan"}
                                            </button>

                                            {showPlanPicker && (
                                                <div className="mt-3 border border-gray-200 rounded-xl bg-white p-3">
                                                    <input
                                                        type="text"
                                                        value={planSearch}
                                                        onChange={(e) => setPlanSearch(e.target.value)}
                                                        placeholder="Buscar plan..."
                                                        className={inputClass}
                                                    />

                                                    <div className="mt-3 flex flex-wrap gap-2 max-h-44 overflow-y-auto pr-1">
                                                        {loadingPlans && (
                                                            <span className="text-xs text-gray-500">
                                                                Cargando planes...
                                                            </span>
                                                        )}

                                                        {!loadingPlans && filteredPlans.length === 0 && (
                                                            <span className="text-xs text-gray-500">
                                                                No se encontraron planes para esta institución.
                                                            </span>
                                                        )}

                                                        {!loadingPlans &&
                                                            filteredPlans.map((plan) => {
                                                                const active = formData.planId === plan.id;
                                                                return (
                                                                    <button
                                                                        key={plan.id}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setFormData((prev) => ({
                                                                                ...prev,
                                                                                planId: plan.id,
                                                                            }));
                                                                            setShowPlanPicker(false);
                                                                        }}
                                                                        className={`px-3 py-1.5 rounded-full text-xs border transition ${
                                                                            active
                                                                                ? "bg-brand-600 text-white border-brand-600"
                                                                                : "bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100"
                                                                        }`}
                                                                    >
                                                                        {plan.name}
                                                                    </button>
                                                                );
                                                            })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <p className="text-xs text-gray-500">
                                            Tip: podés dejar el plan sin seleccionar y elegirlo más adelante desde tu perfil.
                                        </p>
                                    </>
                                )}

                                {coverageType === "particular" && (
                                    <p className="text-xs text-gray-500">
                                        Vas a continuar sin institución, con el plan base de Vetfind. Si más adelante tenés cobertura, podés agregarla en tu perfil.
                                    </p>
                                )}
                            </>
                        )}

                        {step === 2 && (
                            <>
                                <div className="rounded-xl border border-brand-100 bg-brand-50/70 px-4 py-3">
                                    <p className="text-[11px] uppercase tracking-widest font-semibold text-brand-700 mb-2">
                                        Resumen de cobertura
                                    </p>
                                    <div className="space-y-1">
                                        <p className="text-sm text-gray-700">
                                            <span className="font-medium">Modalidad:</span>{" "}
                                            {coverageType === "particular" ? "Sin institución" : "Cobertura"}
                                        </p>
                                        {coverageType === "particular" && (
                                            <p className="text-sm text-gray-700">
                                                <span className="font-medium">Plan:</span>{" "}
                                                Plan base de Vetfind
                                            </p>
                                        )}
                                        {coverageType === "institucion" && (
                                            <>
                                                <p className="text-sm text-gray-700">
                                                    <span className="font-medium">Institución:</span>{" "}
                                                    {selectedInsurer?.name || "No seleccionada"}
                                                </p>
                                                <p className="text-sm text-gray-700">
                                                    <span className="font-medium">Plan:</span>{" "}
                                                    {selectedPlan?.name || "Sin plan seleccionado"}
                                                </p>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="name" className={labelClass}>
                                        Nombre completo <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        required
                                        placeholder="Juan García"
                                        className={inputClass}
                                        value={formData.name}
                                        onChange={handleChange}
                                    />
                                </div>

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
                                        placeholder="tu@email.com"
                                        className={inputClass}
                                        value={formData.email}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                                            className="[&_input]:px-4 [&_input]:py-2.5 [&_input]:rounded-lg [&_input]:text-sm [&_input]:border-gray-300 [&_input]:focus:ring-2 [&_input]:focus:ring-brand-500 [&_input]:focus:border-transparent [&_input]:transition [&_input]:mt-0"
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
                                            className="[&_input]:px-4 [&_input]:py-2.5 [&_input]:rounded-lg [&_input]:text-sm [&_input]:border-gray-300 [&_input]:focus:ring-2 [&_input]:focus:ring-brand-500 [&_input]:focus:border-transparent [&_input]:transition [&_input]:mt-0"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="flex gap-3 pt-2">
                            {step > 1 && (
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    className="flex items-center justify-center gap-2 border border-gray-300 hover:border-brand-400 hover:bg-brand-50 text-gray-700 hover:text-brand-700 font-medium py-2.5 px-5 rounded-lg text-sm transition"
                                >
                                    <ArrowLeftIcon className="w-4 h-4" />
                                    Anterior
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex-1 flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-lg text-sm transition focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
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
                                        Crear cuenta
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
                        className="w-full flex items-center justify-center gap-2 border border-gray-300 hover:border-brand-400 hover:bg-brand-50 text-gray-700 hover:text-brand-700 font-medium py-2.5 px-4 rounded-lg text-sm transition"
                    >
                        Iniciar sesión
                    </Link>

                    <p className="mt-8 text-center text-xs text-gray-400 flex items-center justify-center gap-1.5">
                        <ShieldCheckIcon className="w-3.5 h-3.5" />
                        Conexión segura — tus datos están protegidos
                    </p>
                </div>
            </div>

            {/* Success modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-50 mb-4">
                            <CheckCircleIcon className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            ¡Cuenta creada!
                        </h3>
                        <p className="text-sm text-gray-600 mb-6">
                            {successMessage}
                        </p>
                        <button
                            onClick={closeModal}
                            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded-lg text-sm transition"
                        >
                            Ir a iniciar sesión
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
