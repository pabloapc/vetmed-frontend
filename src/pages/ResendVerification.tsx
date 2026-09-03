import React, { useState } from "react";
import { Link } from "react-router-dom";
import authService from "../services/authService";

const ResendVerification: React.FC = () => {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<
        "idle" | "loading" | "success" | "error"
    >("idle");
    const [message, setMessage] = useState("");

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("loading");
        setMessage("");
        try {
            const res = await authService.resendVerification(email);
            if (res?.success) {
                setStatus("success");
                setMessage(res.message || "Email de verificación reenviado.");
            } else {
                setStatus("error");
                setMessage(res?.message || "No se pudo reenviar el email.");
            }
        } catch (err: any) {
            setStatus("error");
            setMessage(
                err?.response?.data?.message ||
                    err.message ||
                    "Error reenviando verificación."
            );
        }
    };

    return (
        <div className="container mx-auto p-6 max-w-md">
            <h2 className="text-2xl font-semibold mb-4">
                Reenviar verificación
            </h2>

            {status === "success" && (
                <div className="mb-3 p-3 bg-green-50 text-green-700 rounded">
                    {message}
                </div>
            )}
            {status === "error" && (
                <div className="mb-3 p-3 bg-red-50 text-red-700 rounded">
                    {message}
                </div>
            )}

            <form onSubmit={onSubmit} className="space-y-3">
                <div>
                    <label className="block text-sm mb-1">Email</label>
                    <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full border rounded px-3 py-2"
                    />
                </div>

                <div className="flex items-center justify-between">
                    <button
                        type="submit"
                        disabled={status === "loading"}
                        className="bg-brand-600 text-white px-4 py-2 rounded"
                    >
                        {status === "loading"
                            ? "Enviando..."
                            : "Reenviar email"}
                    </button>
                    <Link
                        to="/login"
                        className="text-sm text-brand-600 hover:underline"
                    >
                        Volver a login
                    </Link>
                </div>
            </form>
        </div>
    );
};

export default ResendVerification;
