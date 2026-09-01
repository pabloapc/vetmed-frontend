import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import adminService from "../../services/adminService";

export const AdminInsurerEdit: React.FC = () => {
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
                const res: any = await adminService.getInsurerAdmin(id);
                const doc = res?.data?.insurer ?? res?.insurer ?? res;
                setData(doc);
            } catch (err: any) {
                setError(
                    err?.response?.data?.message ||
                        err.message ||
                        "Error al cargar obra social"
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
                "code",
                "kind",
                "description",
                "phone",
                "email",
                "url",
                "isActive",
            ].forEach((k) => {
                if (typeof data[k] !== "undefined") payload[k] = data[k];
            });
            await adminService.updateInsurerAdmin(id, payload);
            alert("Obra social actualizada");
            navigate("/admin/insurers");
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
                {error || "Obra social no encontrada"}
            </div>
        );

    return (
        <div className="container mx-auto p-6 max-w-2xl">
            <h2 className="text-xl font-semibold mb-4">Editar obra social</h2>
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
                    <label className="block text-sm font-medium">Código</label>
                    <input
                        name="code"
                        value={data.code || ""}
                        onChange={handleChange}
                        className="mt-1 w-full border rounded px-3 py-2"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium">Tipo</label>
                    <select
                        name="kind"
                        value={data.kind || "obra_social"}
                        onChange={handleChange}
                        className="mt-1 w-full border rounded px-3 py-2"
                    >
                        <option value="obra_social">Obra social</option>
                        <option value="prepaga">Prepaga</option>
                        <option value="seguro">Seguro</option>
                        <option value="otro">Otro</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium">
                        Email
                    </label>
                    <input
                        name="email"
                        value={data.email || ""}
                        onChange={handleChange}
                        className="mt-1 w-full border rounded px-3 py-2"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium">Teléfono</label>
                    <input
                        name="phone"
                        value={data.phone || ""}
                        onChange={handleChange}
                        className="mt-1 w-full border rounded px-3 py-2"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium">Sitio web</label>
                    <input
                        name="url"
                        value={data.url || ""}
                        onChange={handleChange}
                        className="mt-1 w-full border rounded px-3 py-2"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium">Descripción</label>
                    <input
                        name="description"
                        value={data.description || ""}
                        onChange={handleChange}
                        className="mt-1 w-full border rounded px-3 py-2"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        name="isActive"
                        checked={!!data.isActive}
                        onChange={(e) =>
                            setData({ ...data, isActive: e.target.checked })
                        }
                    />
                    <label className="block text-sm font-medium">Activo</label>
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

export default AdminInsurerEdit;
