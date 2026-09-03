import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import useAuth from '../hooks/useAuth';
import PasswordInput from '../components/PasswordInput';
import { BrandLogo } from '../components/BrandLogo';
import {
    ShieldCheckIcon,
    LockClosedIcon,
    ArrowRightIcon,
    ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

export const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const getLoginErrorMessage = (err: unknown): string => {
        if (axios.isAxiosError(err)) {
            const status = err.response?.status;
            const data = err.response?.data as
                | { message?: string; errors?: Array<{ msg?: string }> }
                | undefined;

            if (data?.message) return data.message;
            if (data?.errors?.length) {
                return data.errors
                    .map((item) => item.msg)
                    .filter(Boolean)
                    .join(', ');
            }
            if (status === 401) {
                return 'Credenciales inválidas. Mostro Verificá tu email y contraseña.';
            }
            if (err.code === 'ERR_NETWORK') {
                return 'No se pudo conectar con el servidor. Revisá la URL/API y que el backend esté levantado.';
            }
            return 'No se pudo iniciar sesión. Intentá nuevamente.';
        }

        return 'Ocurrió un error inesperado al iniciar sesión.';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await login({ email, password });
            const rawUser = localStorage.getItem('user');
            let loggedUser: any = null;
            if (rawUser) {
                try {
                    loggedUser = JSON.parse(rawUser);
                } catch {
                    loggedUser = null;
                }
            }
            const role = loggedUser?.role;

            if (role === 'admin') {
                navigate('/admin');
            } else if (role === 'veterinaria') {
                navigate('/veterinaria/requests');
            } else if (role === 'emergency') {
                navigate('/emergency/requests');
            } else {
                navigate('/welcome');
            }
        } catch (err) {
            setError(getLoginErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left panel — brand */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-900 via-brand-700 to-brand-600 flex-col justify-between p-12 relative overflow-hidden">
                {/* decorative circles */}
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/5 rounded-full" />
                <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3" />

                {/* Logo */}
                <div className="relative z-10">
                    <BrandLogo variant="onDark" size="lg" />
                </div>

                {/* Hero text */}
                <div className="relative z-10 space-y-6">
                    <h1 className="text-4xl font-bold text-white leading-snug">
                        Tu mascota, <br />
                        bien cuidada.
                    </h1>
                    <p className="text-brand-100 text-base leading-relaxed max-w-sm">
                        Accedé a veterinarias, profesionales de salud y servicios de emergencia desde una sola plataforma segura.
                    </p>

                    <div className="space-y-3 pt-2">
                        {[
                            'Información verificada y actualizada',
                            'Solicitudes con token de seguridad',
                            'Datos protegidos con cifrado TLS',
                        ].map((item) => (
                            <div key={item} className="flex items-center gap-3">
                                <ShieldCheckIcon className="w-5 h-5 text-brand-200 shrink-0" />
                                <span className="text-brand-100 text-sm">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="relative z-10 text-brand-300 text-xs">
                    © {new Date().getFullYear()} Vetfind. Todos los derechos reservados.
                </div>
            </div>

            {/* Right panel — form */}
            <div className="flex-1 flex items-center justify-center bg-gray-50 px-6 py-12">
                <div className="w-full max-w-sm">

                    {/* Mobile logo */}
                    <div className="lg:hidden mb-8 flex justify-center">
                        <BrandLogo variant="onLight" size="lg" />
                    </div>

                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-start justify-between mb-4">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-50">
                                <LockClosedIcon className="w-6 h-6 text-brand-600" />
                            </div>
                            <Link
                                to="/"
                                className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 transition"
                            >
                                <ArrowRightIcon className="w-3.5 h-3.5 rotate-180" />
                                Volver al inicio
                            </Link>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            Bienvenido de vuelta
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Ingresá tus credenciales para continuar
                        </p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mb-5 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                            <ExclamationCircleIcon className="w-5 h-5 shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-gray-700 mb-1.5"
                            >
                                Correo electrónico
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="tu@email.com"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label
                                    htmlFor="password"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Contraseña
                                </label>
                                <Link
                                    to="/resend-verification"
                                    className="text-xs text-brand-600 hover:text-brand-700 hover:underline"
                                >
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            </div>
                            <PasswordInput
                                id="password"
                                name="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                                placeholder="••••••••"
                                className="[&_input]:px-4 [&_input]:py-2.5 [&_input]:rounded-lg [&_input]:text-sm [&_input]:border-gray-300 [&_input]:focus:ring-2 [&_input]:focus:ring-brand-500 [&_input]:focus:border-transparent [&_input]:transition [&_input]:mt-0"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-lg text-sm transition focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                    </svg>
                                    Ingresando...
                                </>
                            ) : (
                                <>
                                    Ingresar
                                    <ArrowRightIcon className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="my-6 flex items-center gap-3 text-gray-300">
                        <div className="flex-1 h-px bg-gray-200" />
                        <span className="text-xs text-gray-400">¿No tenés cuenta?</span>
                        <div className="flex-1 h-px bg-gray-200" />
                    </div>

                    <Link
                        to="/register"
                        className="w-full flex items-center justify-center gap-2 border border-gray-300 hover:border-brand-400 hover:bg-brand-50 text-gray-700 hover:text-brand-700 font-medium py-2.5 px-4 rounded-lg text-sm transition"
                    >
                        Crear una cuenta nueva
                    </Link>

                    {/* Security note */}
                    <p className="mt-8 text-center text-xs text-gray-400 flex items-center justify-center gap-1.5">
                        <ShieldCheckIcon className="w-3.5 h-3.5" />
                        Conexión segura — tus datos están protegidos
                    </p>
                </div>
            </div>
        </div>
    );
};
