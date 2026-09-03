import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import adminService from "../../services/adminService";

export const AdminEmergencyEdit: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                setLoading(true);
                const res = await adminService.getEmergency(id);
                const doc = res?.data?.emergency ?? res?.emergency ?? res;
                setData(doc);
            } catch (err: any) {
                setError(
                    err?.response?.data?.message ||
                        err.message ||
                        "Error al cargar servicio"
                );
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        setData({ ...data, [e.target.name]: e.target.value });
    };

    const handleSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!id) return;
        setSaving(true);
        setError("");
        try {
            const payload: any = {};
            [
                "name",
                "serviceType",
                "address",
                "phone",
                "url",
                "isActive",
            ].forEach((k) => {
                if (typeof data[k] !== "undefined") payload[k] = data[k];
            });
            if (
                typeof data.latitude !== "undefined" &&
                typeof data.longitude !== "undefined"
            ) {
                payload.latitude = data.latitude;
                payload.longitude = data.longitude;
            }
            await adminService.updateEmergency(id, payload);
            alert("Servicio actualizado");
            navigate("/admin/emergencies");
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

    if (loading) return <div className="container p-6">Cargando...</div>;
    if (!data)
        return (
            <div className="container p-6 text-red-600">
                {error || "Servicio no encontrado"}
            </div>
        );

    return (
        <div className="container mx-auto p-6 max-w-2xl">
            <h2 className="text-xl font-semibold mb-4">
                Editar Servicio de Emergencia
            </h2>
            {error && <div className="mb-3 text-red-600">{error}</div>}

            <form onSubmit={handleSave} className="space-y-3">
                <div>
                    <label className="block text-sm font-medium">Nombre</label>
                    <input
                        name="name"
                        value={data.name || ""}
                        onChange={handleChange}
                        className="mt-1 w-full border rounded px-3 py-2"
                    />
                </div>

 

                <div>
                    <label className="block text-sm font-medium">
                        Dirección
                    </label>
                    <input
                        name="address"
                        value={data.address || ""}
                        onChange={handleChange}
                        className="mt-1 w-full border rounded px-3 py-2"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium">
                        Teléfono
                    </label>
                    <input
                        name="phone"
                        value={data.phone || ""}
                        onChange={handleChange}
                        className="mt-1 w-full border rounded px-3 py-2"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium">URL</label>
                    <input
                        name="url"
                        value={data.url || ""}
                        onChange={handleChange}
                        className="mt-1 w-full border rounded px-3 py-2"
                    />
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-sm font-medium">
                            Latitud
                        </label>
                        <input
                            name="latitude"
                            value={
                                data.latitude ??
                                data.location?.coordinates?.[1] ??
                                ""
                            }
                            onChange={handleChange}
                            className="mt-1 w-full border rounded px-3 py-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">
                            Longitud
                        </label>
                        <input
                            name="longitude"
                            value={
                                data.longitude ??
                                data.location?.coordinates?.[0] ??
                                ""
                            }
                            onChange={handleChange}
                            className="mt-1 w-full border rounded px-3 py-2"
                        />
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-4 py-2 bg-brand-600 text-white rounded"
                    >
                        {saving ? "Guardando..." : "Guardar"}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="px-4 py-2 bg-gray-300 rounded"
                    >
                        Cancelar
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AdminEmergencyEdit;
