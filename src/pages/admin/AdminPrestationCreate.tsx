import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import adminService from "../../services/adminService";

export const AdminPrestationCreate: React.FC = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState<any>({
        code: "",
        name: "",
        slug: "",
        description: "",
        category: "",
        defaultDurationMinutes: "",
        priceMin: "",
        priceMax: "",
        currency: "ARS",
        isActive: true,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
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
                code: form.code,
                name: form.name,
                slug: form.slug,
                description: form.description,
                category: form.category,
                defaultDurationMinutes: form.defaultDurationMinutes
                    ? Number(form.defaultDurationMinutes)
                    : undefined,
                defaultPrice: {
                    min: form.priceMin ? Number(form.priceMin) : undefined,
                    max: form.priceMax ? Number(form.priceMax) : undefined,
                    currency: form.currency || "ARS",
                },
                isActive: !!form.isActive,
            };
            await adminService.createPrestation(payload);
            alert("Prestación creada");
            navigate("/admin/prestations");
        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                    err.message ||
                    "Error al crear prestación"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-6 max-w-2xl">
            <h2 className="text-xl font-semibold mb-4">Nueva prestación</h2>
            {error && <div className="mb-3 text-red-600">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                    <label className="block text-sm font-medium">Código</label>
                    <input
                        name="code"
                        value={form.code}
                        onChange={handleChange}
                        className="mt-1 w-full border rounded px-3 py-2"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium">Nombre</label>
                    <input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        className="mt-1 w-full border rounded px-3 py-2"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium">Slug</label>
                    <input
                        name="slug"
                        value={form.slug}
                        onChange={handleChange}
                        className="mt-1 w-full border rounded px-3 py-2"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium">
                        Descripción
                    </label>
                    <textarea
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        rows={4}
                        className="mt-1 w-full border rounded px-3 py-2"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium">
                        Categoría
                    </label>
                    <input
                        name="category"
                        value={form.category}
                        onChange={handleChange}
                        className="mt-1 w-full border rounded px-3 py-2"
                    />
                </div>

                <div className="grid grid-cols-3 gap-2">
                    <div>
                        <label className="block text-sm font-medium">
                            Duración (min)
                        </label>
                        <input
                            name="defaultDurationMinutes"
                            value={form.defaultDurationMinutes}
                            onChange={handleChange}
                            className="mt-1 w-full border rounded px-3 py-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">
                            Precio min
                        </label>
                        <input
                            name="priceMin"
                            value={form.priceMin}
                            onChange={handleChange}
                            className="mt-1 w-full border rounded px-3 py-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">
                            Precio max
                        </label>
                        <input
                            name="priceMax"
                            value={form.priceMax}
                            onChange={handleChange}
                            className="mt-1 w-full border rounded px-3 py-2"
                        />
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded"
                    >
                        {loading ? "Creando..." : "Crear prestación"}
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

export default AdminPrestationCreate;
