import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import adminService from "../../services/adminService";

export const AdminUserCreate: React.FC = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState<any>({
        name: "",
        email: "",
        password: "",
        role: "user",
        entityId: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const payload: any = {
                name: form.name,
                email: form.email,
                password: form.password,
                role: form.role,
            };
            if (form.entityId) payload.entityId = form.entityId;
            const res = await adminService.createUser(payload);
            alert("Usuario creado");
            // redirect to users list or to edit created user
            const createdId =
                res?.data?.user?.id ??
                res?.user?.id ??
                res?.data?.user?._id ??
                null;
            if (createdId) navigate(`/admin/users/${createdId}`);
            else navigate("/admin/users");
        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                    err.message ||
                    "Error al crear usuario"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-6 max-w-2xl">
            <h2 className="text-xl font-semibold mb-4">Nuevo usuario</h2>
            {error && <div className="mb-3 text-red-600">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-3">
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
                    <label className="block text-sm font-medium">Email</label>
                    <input
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        className="mt-1 w-full border rounded px-3 py-2"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium">
                        Password
                    </label>
                    <input
                        name="password"
                        type="password"
                        value={form.password}
                        onChange={handleChange}
                        className="mt-1 w-full border rounded px-3 py-2"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium">Rol</label>
                    <select
                        name="role"
                        value={form.role}
                        onChange={handleChange}
                        className="mt-1 w-full border rounded px-3 py-2"
                    >
                        <option value="user">user</option>
                        <option value="veterinaria">veterinaria</option>
                        <option value="admin">admin</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium">
                        Entidad (entityId) - opcional
                    </label>
                    <input
                        name="entityId"
                        value={form.entityId}
                        onChange={handleChange}
                        className="mt-1 w-full border rounded px-3 py-2"
                    />
                </div>

                <div className="flex gap-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-brand-600 text-white rounded"
                    >
                        {loading ? "Creando..." : "Crear usuario"}
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

export default AdminUserCreate;
