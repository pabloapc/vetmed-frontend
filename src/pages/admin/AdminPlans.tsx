import React, { useEffect, useMemo, useState } from "react";
import adminService from "../../services/adminService";

export const AdminPlans: React.FC = () => {
    const [items, setItems] = useState<any[]>([]);
    const [insurers, setInsurers] = useState<any[]>([]);
    const [q, setQ] = useState("");
    const [insurerId, setInsurerId] = useState("");
    const [page, setPage] = useState(1);
    const [limit] = useState(25);
    const [meta, setMeta] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState<any>({
        insurerId: "",
        name: "",
        code: "",
        tier: "",
        description: "",
        isActive: true,
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const normalizeList = (res: any, key: string) => {
        const candidates = [
            res?.data?.[key],
            res?.[key],
            res?.data?.items,
            res?.items,
            res?.data,
            res,
        ];
        const list = candidates.find((c) => Array.isArray(c));
        return Array.isArray(list) ? list : [];
    };

    const load = async () => {
        setLoading(true);
        try {
            const res: any = await adminService.listPlansAdmin({
                page,
                limit,
                q,
                insurerId: insurerId || undefined,
            });
            setItems(normalizeList(res, "plans"));
            setMeta(res?.meta ?? res?.data?.meta ?? null);
        } catch (err) {
            console.error("admin plans list error", err);
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    const loadInsurers = async () => {
        try {
            const res: any = await adminService.listInsurersAdmin({
                page: 1,
                limit: 300,
            });
            setInsurers(normalizeList(res, "insurers"));
        } catch (err) {
            console.warn("could not load insurers", err);
            setInsurers([]);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    useEffect(() => {
        loadInsurers();
    }, []);

    const handleSearch = async (e?: React.FormEvent) => {
        e?.preventDefault();
        setPage(1);
        await load();
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar plan? Esta acción es irreversible.")) return;
        try {
            await adminService.deletePlanAdmin(id);
            await load();
        } catch (err) {
            console.error(err);
            alert("No se pudo eliminar el plan");
        }
    };

    const handleCreate = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!form.insurerId || !form.name) {
            setError("Obra social y nombre son requeridos");
            return;
        }

        setSaving(true);
        setError("");
        try {
            await adminService.createPlanAdmin({
                insurerId: form.insurerId,
                name: form.name,
                code: form.code || undefined,
                tier: form.tier || undefined,
                description: form.description || undefined,
                isActive: !!form.isActive,
            });

            setForm({
                insurerId: "",
                name: "",
                code: "",
                tier: "",
                description: "",
                isActive: true,
            });
            setShowCreate(false);
            await load();
        } catch (err: any) {
            setError(
                err?.response?.data?.message || err?.message || "Error al crear plan"
            );
        } finally {
            setSaving(false);
        }
    };

    const insurerMap = useMemo(() => {
        const map: Record<string, string> = {};
        insurers.forEach((i: any) => {
            map[String(i._id)] = i.name;
        });
        return map;
    }, [insurers]);

    if (loading) return <div className="container p-6">Cargando...</div>;

    return (
        <div className="container mx-auto p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Planes</h2>
                <button
                    onClick={() => setShowCreate(true)}
                    className="px-3 py-1 bg-blue-600 text-white rounded"
                >
                    Nuevo plan
                </button>
            </div>

            <form onSubmit={handleSearch} className="mb-4 flex gap-2">
                <select
                    value={insurerId}
                    onChange={(e) => setInsurerId(e.target.value)}
                    className="border px-3 py-2 rounded"
                >
                    <option value="">Todas las obras sociales</option>
                    {insurers.map((i: any) => (
                        <option key={i._id} value={i._id}>
                            {i.name}
                        </option>
                    ))}
                </select>

                <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Buscar por nombre o código"
                    className="border px-3 py-2 rounded w-full"
                />
                <button type="submit" className="bg-blue-600 text-white px-3 py-2 rounded">
                    Buscar
                </button>
            </form>

            <div className="bg-white rounded shadow">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-2 text-left">Nombre</th>
                            <th className="p-2 text-left">Código</th>
                            <th className="p-2 text-left">Obra social</th>
                            <th className="p-2 text-left">Tier</th>
                            <th className="p-2 text-left">Activo</th>
                            <th className="p-2 text-left">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((p: any) => {
                            const iid = String(p?.insurerId?._id ?? p?.insurerId ?? "");
                            return (
                                <tr key={p._id} className="border-t">
                                    <td className="p-2">{p.name}</td>
                                    <td className="p-2">{p.code ?? "-"}</td>
                                    <td className="p-2">
                                        {insurerMap[iid] || p?.insurerId?.name || iid || "-"}
                                    </td>
                                    <td className="p-2">{p.tier ?? "-"}</td>
                                    <td className="p-2">{p.isActive ? "Sí" : "No"}</td>
                                    <td className="p-2">
                                        <button
                                            onClick={() => handleDelete(p._id)}
                                            className="px-2 py-1 bg-red-600 text-white rounded text-xs"
                                        >
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {items.length === 0 && (
                            <tr>
                                <td colSpan={6} className="p-4 text-center text-gray-500">
                                    No hay planes
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex items-center justify-between mt-3">
                <div className="text-sm text-gray-600">Total: {meta?.total ?? 0}</div>
                <div className="flex items-center gap-2">
                    <button
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="px-3 py-1 bg-gray-200 rounded"
                    >
                        Anterior
                    </button>
                    <div className="px-3">{page}</div>
                    <button
                        disabled={meta && meta.total && page * limit >= meta.total}
                        onClick={() => setPage((p) => p + 1)}
                        className="px-3 py-1 bg-gray-200 rounded"
                    >
                        Siguiente
                    </button>
                </div>
            </div>

            {showCreate && (
                <div className="fixed inset-0 z-60 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setShowCreate(false)} />
                    <div className="relative bg-white rounded-lg shadow-lg w-full max-w-xl mx-4 p-6 z-50">
                        <h4 className="text-lg font-semibold mb-4">Crear plan</h4>
                        <form onSubmit={handleCreate} className="space-y-3">
                            <div>
                                <label className="text-sm text-gray-700">Obra social</label>
                                <select
                                    name="insurerId"
                                    value={form.insurerId}
                                    onChange={(e) =>
                                        setForm((prev: any) => ({ ...prev, insurerId: e.target.value }))
                                    }
                                    className="mt-1 w-full border rounded px-3 py-2"
                                >
                                    <option value="">-- seleccionar --</option>
                                    {insurers.map((i: any) => (
                                        <option key={i._id} value={i._id}>
                                            {i.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-sm text-gray-700">Nombre</label>
                                <input
                                    name="name"
                                    value={form.name}
                                    onChange={(e) =>
                                        setForm((prev: any) => ({ ...prev, name: e.target.value }))
                                    }
                                    className="mt-1 w-full border rounded px-3 py-2"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm text-gray-700">Código</label>
                                    <input
                                        name="code"
                                        value={form.code}
                                        onChange={(e) =>
                                            setForm((prev: any) => ({ ...prev, code: e.target.value }))
                                        }
                                        className="mt-1 w-full border rounded px-3 py-2"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm text-gray-700">Tier</label>
                                    <input
                                        name="tier"
                                        value={form.tier}
                                        onChange={(e) =>
                                            setForm((prev: any) => ({ ...prev, tier: e.target.value }))
                                        }
                                        className="mt-1 w-full border rounded px-3 py-2"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm text-gray-700">Descripción</label>
                                <input
                                    name="description"
                                    value={form.description}
                                    onChange={(e) =>
                                        setForm((prev: any) => ({ ...prev, description: e.target.value }))
                                    }
                                    className="mt-1 w-full border rounded px-3 py-2"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={!!form.isActive}
                                    onChange={(e) =>
                                        setForm((prev: any) => ({ ...prev, isActive: e.target.checked }))
                                    }
                                />
                                <label className="text-sm text-gray-700">Activo</label>
                            </div>

                            {error && <div className="text-sm text-red-600">{error}</div>}

                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreate(false)}
                                    className="px-4 py-2 bg-gray-200 rounded"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-4 py-2 bg-blue-600 text-white rounded"
                                >
                                    {saving ? "Guardando..." : "Crear plan"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPlans;
