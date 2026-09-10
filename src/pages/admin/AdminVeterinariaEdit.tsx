import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import adminService from "../../services/adminService";
import {
    BuildingStorefrontIcon,
    ExclamationCircleIcon,
    ChevronLeftIcon,
    DocumentTextIcon,
} from "@heroicons/react/24/outline";

const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:3001/api").replace(
    /\/api\/?$/,
    ""
);

const toPublicFileUrl = (raw?: string) => {
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;

    const uploadsIdx = raw.indexOf("/uploads/");
    if (uploadsIdx >= 0) {
        return `${API_ORIGIN}${raw.slice(uploadsIdx)}`;
    }

    if (raw.startsWith("/")) {
        return `${API_ORIGIN}${raw}`;
    }

    return `${API_ORIGIN}/${raw}`;
};

export const AdminVeterinariaEdit: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [data, setData] = useState<any>(null);
    const [vademecumFile, setVademecumFile] = useState<File | null>(null);
    const [vademecumInfo, setVademecumInfo] = useState("");

    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                setLoading(true);
                const res = await adminService.getVeterinaria(id);
                const doc = res?.data?.veterinaria ?? res?.veterinaria ?? res;
                setData(doc);
                const existingName =
                    doc?.vademecumFile?.originalName ||
                    doc?.vademecumFile?.fileName ||
                    doc?.vademecumFileName ||
                    doc?.vademecum?.fileName ||
                    "";
                const existingUrl =
                    doc?.vademecumFile?.url ||
                    doc?.vademecumFileUrl ||
                    doc?.vademecum?.url ||
                    "";
                const publicExistingUrl = toPublicFileUrl(existingUrl);
                if (existingName || existingUrl) {
                    setVademecumInfo(
                        `Actual: ${existingName || publicExistingUrl}`
                    );
                }
            } catch (err: any) {
                setError(
                    err?.response?.data?.message ||
                        err.message ||
                        "Error al cargar veterinaria"
                );
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        setData({ ...data, [e.target.name]: e.target.value });
    };

    const handleVademecumFile = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const allowed = [
            "text/csv",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ];
        const ext = file.name.toLowerCase();
        const validExt =
            ext.endsWith(".csv") || ext.endsWith(".xls") || ext.endsWith(".xlsx");

        if (!validExt && !allowed.includes(file.type)) {
            setError("Archivo inválido. Debe ser CSV/XLS/XLSX.");
            return;
        }

        setVademecumFile(file);
        setVademecumInfo(`Nuevo archivo: ${file.name}`);
    };

    const handleSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!id) return;
        setSaving(true);
        setError("");
        try {
            const payload: any = {};
            // allowed fields for admin
            [
                "name",
                "address",
                "phone",
                "description",
                "benefits",
                "discount",
                "openingHours",
                "isActive",
            ].forEach((k) => {
                if (typeof data[k] !== "undefined") payload[k] = data[k];
            });
            if (typeof payload.isActive === "string") {
                payload.isActive = payload.isActive === "true";
            }
            if (typeof payload.discount !== "undefined" && payload.discount !== "") {
                payload.discount = Number(payload.discount);
            }
            // location convenience
            if (
                typeof data.latitude !== "undefined" &&
                typeof data.longitude !== "undefined"
            ) {
                payload.latitude = Number(data.latitude);
                payload.longitude = Number(data.longitude);
            }

            // 1) Update core fields as JSON (compat with current backend controller)
            await adminService.updateVeterinaria(id, payload);

            // 2) Upload vademecum file using dedicated endpoint
            if (vademecumFile) {
                try {
                    await adminService.uploadVeterinariaVademecumFile(
                        id,
                        vademecumFile
                    );
                } catch (uploadErr: any) {
                    const msg =
                        uploadErr?.response?.data?.message ||
                        uploadErr?.message ||
                        "No se pudo subir el archivo de vademécum.";
                    setError(
                        `${msg} (la veterinaria sí se actualizó, pero faltó el archivo)`
                    );
                    return;
                }
            }
            alert("Veterinaria actualizada");
            navigate("/admin/veterinarias");
        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                    err.message ||
                    "Error al guardar"
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center text-sm text-gray-400">
            Cargando…
        </div>
    );
    if (!data) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center text-sm text-red-600">
            {error || "Veterinaria no encontrada"}
        </div>
    );

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
                            <h1 className="text-2xl font-bold text-white">Editar Veterinaria</h1>
                            <p className="text-sm text-slate-300">{data.name || "Sin nombre"}</p>
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

                    <form onSubmit={handleSave} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                            <input
                                name="name"
                                value={data.name || ""}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-brand-400 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                            <input
                                name="address"
                                value={data.address || ""}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-brand-400 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                            <input
                                name="phone"
                                value={data.phone || ""}
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
                                value={data.description || ""}
                                onChange={handleChange}
                                rows={4}
                                maxLength={600}
                                placeholder="Contá qué servicios ofrece, especialidades, atención de urgencias, etc."
                                className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-brand-400 focus:outline-none"
                            />
                            <p className="text-xs text-gray-400 mt-1">
                                {(data.description || "").length}/600
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Beneficios</label>
                            <input
                                name="benefits"
                                value={data.benefits || ""}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-brand-400 focus:outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descuento (%)</label>
                                <input
                                    name="discount"
                                    value={String(data.discount ?? "")}
                                    onChange={handleChange}
                                    className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-brand-400 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                                <select
                                    name="isActive"
                                    value={String(typeof data.isActive !== "undefined" ? data.isActive : "true")}
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
                                    value={data.latitude ?? data.location?.coordinates?.[1] ?? ""}
                                    onChange={handleChange}
                                    className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-brand-400 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Longitud</label>
                                <input
                                    name="longitude"
                                    value={data.longitude ?? data.location?.coordinates?.[0] ?? ""}
                                    onChange={handleChange}
                                    className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-brand-400 focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* Vademécum */}
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <DocumentTextIcon className="h-4 w-4 text-brand-600" />
                                <label className="text-sm font-medium text-gray-700">Vademécum</label>
                            </div>
                            <input
                                type="file"
                                accept=".csv,.xls,.xlsx"
                                onChange={handleVademecumFile}
                                className="block w-full text-sm text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-brand-700 hover:file:bg-brand-100"
                            />
                            <p className="text-xs text-gray-400 mt-2">
                                Se sube el archivo completo (CSV/XLS/XLSX) para ser procesado por el backend.
                            </p>
                            {vademecumInfo && (
                                <p className="text-xs text-emerald-700 mt-2 font-medium">{vademecumInfo}</p>
                            )}
                            {(data?.vademecumFile?.url || data?.vademecumFileUrl || data?.vademecum?.url) && (
                                <a
                                    href={toPublicFileUrl(data?.vademecumFile?.url || data?.vademecumFileUrl || data?.vademecum?.url)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-block mt-2 text-xs text-brand-600 hover:underline"
                                >
                                    Ver archivo actual
                                </a>
                            )}
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-500 disabled:opacity-60 transition-colors"
                            >
                                {saving ? "Guardando…" : "Guardar cambios"}
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

export default AdminVeterinariaEdit;
