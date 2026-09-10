import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import adminService from "../../services/adminService";

export const AdminInsurerCreate: React.FC = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState<any>({
        name: "",
        code: "",
        kind: "obra_social",
        description: "",
        phone: "",
        email: "",
        url: "",
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
                code: form.code,
                kind: form.kind,
                description: form.description,
                phone: form.phone,
                email: form.email,
                url: form.url,
                isActive: !!form.isActive,
            };
            const res: any = await adminService.createInsurerAdmin(payload);
            const created = res?.data?.insurer ?? res?.data ?? res?.insurer ?? res;
            const newId = created?._id ?? created?.id;
            // Va directo a la ficha para poder seguir cargando los planes de esta
            // obra social sin tener que buscarla de nuevo en el listado.
            navigate(newId ? `/admin/insurers/${newId}` : "/admin/insurers");
        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                    err.message ||
                    "Error al crear obra social"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-6 max-w-2xl">
            <h2 className="text-xl font-semibold mb-4">Nueva obra social</h2>
            {error && <div className="mb-3 text-red-600">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                    <label className="block text-sm font-medium">
                        Nombre
                    </label>
                    <input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        className="mt-1 w-full border rounded px-3 py-2"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium">Código</label>
                    <input
                        name="code"
                        value={form.code}
                        onChange={handleChange}
                        className="mt-1 w-full border rounded px-3 py-2"
                        placeholder="Ej: OSDE, SWISS, OSECAC"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium">Tipo</label>
                    <select
                        name="kind"
                        value={form.kind}
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
                        value={form.email}
                        onChange={handleChange}
                        className="mt-1 w-full border rounded px-3 py-2"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium">Teléfono</label>
                    <input
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        className="mt-1 w-full border rounded px-3 py-2"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium">Sitio web</label>
                    <input
                        name="url"
                        value={form.url}
                        onChange={handleChange}
                        className="mt-1 w-full border rounded px-3 py-2"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium">Descripción</label>
                    <input
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        className="mt-1 w-full border rounded px-3 py-2"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        name="isActive"
                        checked={!!form.isActive}
                        onChange={handleChange}
                    />
                    <label className="block text-sm font-medium">Activo</label>
                </div>

                <div className="flex gap-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-brand-600 text-white rounded"
                    >
                        {loading ? "Creando..." : "Crear obra social"}
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

export default AdminInsurerCreate;
