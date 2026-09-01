import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import adminService from "../../services/adminService";

export const AdminPrestationEdit: React.FC = () => {
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
                const res: any = await adminService.getPrestation(id);
                const doc = res?.data?.prestation ?? res?.prestation ?? res;
                setData(doc);
            } catch (err: any) {
                setError(
                    err?.response?.data?.message ||
                        err.message ||
                        "Error al cargar prestación"
                );
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => {
        const v =
            e.target.type === "checkbox"
                ? (e.target as HTMLInputElement).checked
                : e.target.value;
        setData({ ...data, [e.target.name]: v });
    };

    const handleSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!id) return;
        setSaving(true);
        setError("");
        try {
            const payload: any = {};
            [
                "code",
                "name",
                "slug",
                "description",
                "category",
                "defaultDurationMinutes",
                "isActive",
            ].forEach((k) => {
                if (typeof data[k] !== "undefined") payload[k] = data[k];
            });
            // defaultPrice handling
            payload.defaultPrice = {
                min: data.defaultPrice?.min ?? data.priceMin ?? undefined,
                max: data.defaultPrice?.max ?? data.priceMax ?? undefined,
                currency: data.defaultPrice?.currency ?? data.currency ?? "ARS",
            };
            await adminService.updatePrestation(id, payload);
            alert("Prestación actualizada");
            navigate("/admin/prestations");
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
                {error || "Prestación no encontrada"}
            </div>
        );

    return (
        <div className="container mx-auto p-6 max-w-2xl">
            <h2 className="text-xl font-semibold mb-4">Editar Prestación</h2>
            {error && <div className="mb-3 text-red-600">{error}</div>}

            <form onSubmit={handleSave} className="space-y-3">
                <div>
                    <label className="block text-sm font-medium">Código</label>
                    <input
                        name="code"
                        value={data.code || ""}
                        onChange={handleChange}
                        className="mt-1 w-full border rounded px-3 py-2"
                    />
                </div>

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
                    <label className="block text-sm font-medium">Slug</label>
                    <input
                        name="slug"
                        value={data.slug || ""}
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
                        value={data.description || ""}
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
                        value={data.category || ""}
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
                            value={data.defaultDurationMinutes ?? ""}
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
                            value={(data.defaultPrice?.min ?? "") as any}
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
                            value={(data.defaultPrice?.max ?? "") as any}
                            onChange={handleChange}
                            className="mt-1 w-full border rounded px-3 py-2"
                        />
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-4 py-2 bg-blue-600 text-white rounded"
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

export default AdminPrestationEdit;
