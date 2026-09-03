import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import adminService from "../../services/adminService";

export const AdminEmergencyCreate: React.FC = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState<any>({
        name: "",
        serviceType: "",
        address: "",
        phone: "",
        url: "",
        latitude: "",
        longitude: "",
        isActive: true,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
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
                serviceType: form.serviceType,
                address: form.address,
                phone: form.phone,
                url: form.url,
                horario: form.horario,
                isActive: !!form.isActive,
            };
            if (form.latitude && form.longitude) {
                payload.latitude = parseFloat(form.latitude);
                payload.longitude = parseFloat(form.longitude);
            }
            await adminService.createEmergency(payload);
            alert("Servicio de emergencia creado");
            navigate("/admin/emergencies");
        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                    err.message ||
                    "Error al crear servicio de emergencia"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-6 max-w-2xl">
            <h2 className="text-xl font-semibold mb-4">
                Nuevo servicio de emergencia
            </h2>
            {error && <div className="mb-3 text-red-600">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                    <label className="block text-sm font-medium">
                        Nombre público
                    </label>
                    <input
                        name="name"
                        value={form.name}
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
                        value={form.address}
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
                        value={form.phone}
                        onChange={handleChange}
                        className="mt-1 w-full border rounded px-3 py-2"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium">URL</label>
                    <input
                        name="url"
                        value={form.url}
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
                            value={form.latitude}
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
                            value={form.longitude}
                            onChange={handleChange}
                            className="mt-1 w-full border rounded px-3 py-2"
                        />
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-brand-600 text-white rounded"
                    >
                        {loading ? "Creando..." : "Crear servicio"}
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

export default AdminEmergencyCreate;
