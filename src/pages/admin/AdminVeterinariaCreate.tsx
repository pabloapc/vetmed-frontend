import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import adminService from "../../services/adminService";
import {
    BuildingStorefrontIcon,
    ExclamationCircleIcon,
    ChevronLeftIcon,
} from "@heroicons/react/24/outline";

export const AdminVeterinariaCreate: React.FC = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState<any>({
        name: "",
        address: "",
        phone: "",
        description: "",
        benefits: "",
        discount: "",
        openingHours: "",
        latitude: "",
        longitude: "",
        isActive: true,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const v =
            e.target.type === "checkbox"
                ? (e.target as HTMLInputElement).checked
                : e.target.value;
        setForm({ ...form, [e.target.name]: v });
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const payload: any = {
                name: form.name,
                address: form.address,
                phone: form.phone,
                description: form.description,
                benefits: form.benefits,
                discount: form.discount ? Number(form.discount) : undefined,
                openingHours: form.openingHours,
                isActive: !!form.isActive,
            };
            if (form.latitude && form.longitude) {
                payload.latitude = parseFloat(form.latitude);
                payload.longitude = parseFloat(form.longitude);
            }
            await adminService.createVeterinaria(payload);
            alert("Veterinaria creada");
            navigate("/admin/veterinarias");
        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                    err.message ||
                    "Error al crear veterinaria"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-10">
            {/* Hero */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-brand-900 px-6 pt-10 pb-8">
                <div className="mx-auto max-w-2xl">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-white mb-4 transition-colors"
                    >
                        <ChevronLeftIcon className="h-4 w-4" />
                        Volver
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                            <BuildingStorefrontIcon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Nueva veterinaria</h1>
                            <p className="text-sm text-slate-300">Completá los datos para registrar la veterinaria</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-2xl px-4 -mt-4">
                <div className="rounded-[1.75rem] bg-white border border-gray-100 shadow-sm px-6 py-6">
                    {error && (
                        <div className="mb-5 flex items-start gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
                            <ExclamationCircleIcon className="h-5 w-5 shrink-0 mt-0.5" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre público</label>
                            <input
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-brand-400 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                            <input
                                name="address"
                                value={form.address}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-brand-400 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                            <input
                                name="phone"
                                value={form.phone}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-brand-400 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Horario de atención</label>
                            <input
                                name="openingHours"
                                value={form.openingHours}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-brand-400 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Descripción
                                <span className="ml-1.5 font-normal text-gray-400">
                                    (aparece en la ficha pública y ayuda al posicionamiento en Google)
                                </span>
                            </label>
                            <textarea
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                rows={4}
                                maxLength={600}
                                placeholder="Contá qué servicios ofrece, especialidades, atención de urgencias, etc."
                                className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-brand-400 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Beneficios</label>
                            <input
                                name="benefits"
                                value={form.benefits}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-brand-400 focus:outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descuento (%)</label>
                                <input
                                    name="discount"
                                    value={form.discount}
                                    onChange={handleChange}
                                    className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-brand-400 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                                <select
                                    name="isActive"
                                    value={String(form.isActive)}
                                    onChange={handleChange}
                                    className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-brand-400 focus:outline-none"
                                >
                                    <option value="true">Activa</option>
                                    <option value="false">Inactiva</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Latitud</label>
                                <input
                                    name="latitude"
                                    value={form.latitude}
                                    onChange={handleChange}
                                    className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-brand-400 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Longitud</label>
                                <input
                                    name="longitude"
                                    value={form.longitude}
                                    onChange={handleChange}
                                    className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-brand-400 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-500 disabled:opacity-60 transition-colors"
                            >
                                {loading ? "Creando…" : "Crear veterinaria"}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdminVeterinariaCreate;
