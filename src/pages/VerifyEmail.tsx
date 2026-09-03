import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import authService from "../services/authService";
import { useAuth } from "../hooks/useAuth";

const VerifyEmail: React.FC = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token") || "";
    const [status, setStatus] = useState<
        "idle" | "loading" | "success" | "error"
    >("idle");
    const [message, setMessage] = useState<string>("");
    const navigate = useNavigate();
    const auth = useAuth();

    useEffect(() => {
        const verify = async () => {
            if (!token) {
                setStatus("error");
                setMessage("Token de verificación no provisto.");
                return;
            }
            setStatus("loading");
            try {
                // Llamar al endpoint backend
                const res = await authService.verifyEmail(token);
                if (res?.success) {
                    setStatus("success");
                    setMessage(
                        res.message || "Correo verificado correctamente."
                    );

                    // If backend returned an auth token in data.token, try to set in client
                    const authToken = res.data?.token || res.data?.token;
                    if (authToken) {
                        // attempt to use useAuth login method if provided
                        try {
                            if (
                                auth &&
                                typeof (auth as any).login === "function"
                            ) {
                                // prefer calling login method in auth context
                                await (auth as any).login(authToken);
                            } else if (
                                auth &&
                                typeof (auth as any).setToken === "function"
                            ) {
                                (auth as any).setToken(authToken);
                            } else {
                                // fallback: store token and reload
                                localStorage.setItem("authToken", authToken);
                                // optionally store user in localStorage if returned
                                if (res.data?.user)
                                    localStorage.setItem(
                                        "user",
                                        JSON.stringify(res.data.user)
                                    );
                                // small delay for UX then reload or navigate
                                setTimeout(
                                    () => window.location.replace("/login"),
                                    800
                                );
                            }
                        } catch (e) {
                            // if auth context failed, fallback to localStorage
                            localStorage.setItem("authToken", authToken);
                            setTimeout(() => window.location.replace("/"), 800);
                        }
                    } else {
                        // no token returned, just redirect to login after a pause
                        setTimeout(() => navigate("/login"), 1200);
                    }
                } else {
                    setStatus("error");
                    setMessage(
                        res?.message || "No fue posible verificar el correo."
                    );
                }
            } catch (err: any) {
                setStatus("error");
                setMessage(
                    err?.response?.data?.message ||
                        err.message ||
                        "Error verificando token."
                );
            }
        };

        verify();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    return (
        <div className="container mx-auto p-6 max-w-xl">
            <h2 className="text-2xl font-semibold mb-4">Verificar correo</h2>

            {status === "loading" && (
                <div className="p-4 bg-yellow-50 rounded">
                    Verificando tu correo...
                </div>
            )}
            {status === "success" && (
                <div className="p-4 bg-green-50 rounded">
                    <div className="font-medium text-green-700 mb-2">
                        ¡Correo verificado!
                    </div>
                    <div className="text-sm text-gray-700">{message}</div>
                    <div className="mt-3">
                        <Link to="/" className="text-brand-600 hover:underline">
                            Ir al inicio
                        </Link>
                    </div>
                </div>
            )}
            {status === "error" && (
                <div className="p-4 bg-red-50 rounded">
                    <div className="font-medium text-red-700 mb-2">Error</div>
                    <div className="text-sm text-gray-700">{message}</div>

                    <div className="mt-3 flex gap-2">
                        <Link
                            to="/login"
                            className="px-3 py-2 bg-white border rounded"
                        >
                            Ir a Iniciar sesión
                        </Link>
                        <Link
                            to="/resend-verification"
                            className="px-3 py-2 bg-brand-600 text-white rounded"
                        >
                            Reenviar email
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VerifyEmail;
