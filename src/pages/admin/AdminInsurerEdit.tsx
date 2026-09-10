import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import adminService from "../../services/adminService";

const normalizeList = (res: any, key: string) => {
    const candidates = [
        res?.data?.[key],
        res?.[key],
        res?.data?.items,
        res?.items,
        res?.data,
        res,
    ];
    const list = candidates.find((c: any) => Array.isArray(c));
    return Array.isArray(list) ? list : [];
};

const emptyPlanForm = {
    name: "",
    code: "",
    tier: "",
    description: "",
    isActive: true,
};

export const AdminInsurerEdit: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [savedMessage, setSavedMessage] = useState("");
    const [data, setData] = useState<any>(null);

    const [plans, setPlans] = useState<any[]>([]);
    const [plansLoading, setPlansLoading] = useState(false);
    const [showCreatePlan, setShowCreatePlan] = useState(false);
    const [planForm, setPlanForm] = useState<any>(emptyPlanForm);
    const [planSaving, setPlanSaving] = useState(false);
    const [planError, setPlanError] = useState("");

    const loadInsurer = async () => {
        if (!id) return;
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
    };

    const loadPlans = async () => {
        if (!id) return;
        setPlansLoading(true);
        try {
            const res: any = await adminService.listPlansAdmin({ insurerId: id, limit: 200 });
            setPlans(normalizeList(res, "plans"));
        } catch (err) {
            console.error("load plans for insurer", err);
            setPlans([]);
        } finally {
            setPlansLoading(false);
        }
    };

    useEffect(() => {
        loadInsurer();
        loadPlans();
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
        setSavedMessage("");
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
            setSavedMessage("Obra social actualizada");
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

    const handlePlanFormChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const v = e.target.type === "checkbox" ? e.target.checked : e.target.value;
        setPlanForm((prev: any) => ({ ...prev, [e.target.name]: v }));
    };

    const handleCreatePlan = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!id) return;
        if (!planForm.name) {
            setPlanError("El nombre del plan es requerido");
            return;
        }
        setPlanSaving(true);
        setPlanError("");
        try {
            await adminService.createPlanAdmin({
                insurerId: id,
                name: planForm.name,
                code: planForm.code || undefined,
                tier: planForm.tier || undefined,
                description: planForm.description || undefined,
                isActive: !!planForm.isActive,
            });
            setShowCreatePlan(false);
            setPlanForm(emptyPlanForm);
            await loadPlans();
        } catch (err: any) {
            setPlanError(
                err?.response?.data?.message || err?.message || "Error al crear plan"
            );
        } finally {
            setPlanSaving(false);
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
            <nav className="text-sm text-gray-500 mb-4">
                <Link to="/admin/insurers" className="hover:underline">Obras sociales</Link>
                <span className="mx-1.5">/</span>
                <span className="text-gray-700 font-medium">{data.name}</span>
            </nav>
            <h2 className="text-xl font-semibold mb-4">Editar obra social</h2>
            {error && <div className="mb-3 text-red-600">{error}</div>}
            {savedMessage && <div className="mb-3 text-emerald-600 text-sm">{savedMessage}</div>}

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
                        className="px-4 py-2 bg-brand-600 text-white rounded"
                    >
                        {saving ? "Guardando..." : "Guardar"}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate("/admin/insurers")}
                        className="px-4 py-2 bg-gray-300 rounded"
                    >
                        Volver al listado
                    </button>
                </div>
            </form>

            <div className="flex items-center justify-between mb-3">
                <div>
                    <h3 className="text-lg font-semibold">Planes de {data.name}</h3>
                    <p className="text-xs text-gray-500">
                        Cargá los planes de esta obra social; después entrá a cada uno para definir sus coberturas.
                    </p>
                </div>
                <button
                    onClick={() => {
                        setPlanError("");
                        setPlanForm(emptyPlanForm);
                        setShowCreatePlan(true);
                    }}
                    className="px-3 py-1.5 bg-brand-600 text-white rounded text-sm shrink-0"
                >
                    + Nuevo plan
                </button>
            </div>

            <div className="bg-white rounded shadow mb-8">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-2 text-left">Nombre</th>
                            <th className="p-2 text-left">Código</th>
                            <th className="p-2 text-left">Tier</th>
                            <th className="p-2 text-left">Activo</th>
                            <th className="p-2 text-left"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {plansLoading && (
                            <tr>
                                <td colSpan={5} className="p-4 text-center text-gray-400">
                                    Cargando...
                                </td>
                            </tr>
                        )}
                        {!plansLoading &&
                            plans.map((p: any) => (
                                <tr key={p._id} className="border-t">
                                    <td className="p-2">{p.name}</td>
                                    <td className="p-2">{p.code ?? "-"}</td>
                                    <td className="p-2">{p.tier ?? "-"}</td>
                                    <td className="p-2">{p.isActive ? "Sí" : "No"}</td>
                                    <td className="p-2 text-right">
                                        <Link
                                            to={`/admin/plans/${p._id}`}
                                            className="text-brand-600 hover:underline text-xs font-medium"
                                        >
                                            Editar / coberturas →
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        {!plansLoading && plans.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-4 text-center text-gray-500">
                                    Esta obra social todavía no tiene planes cargados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showCreatePlan && (
                <div className="fixed inset-0 z-60 flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setShowCreatePlan(false)}
                    />
                    <div className="relative bg-white rounded-lg shadow-lg w-full max-w-lg mx-4 p-6 z-50">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-semibold">Nuevo plan de {data.name}</h4>
                            <button
                                onClick={() => setShowCreatePlan(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                Cerrar
                            </button>
                        </div>

                        <form onSubmit={handleCreatePlan} className="space-y-3">
                            <div>
                                <label className="text-sm text-gray-700">Nombre</label>
                                <input
                                    name="name"
                                    value={planForm.name}
                                    onChange={handlePlanFormChange}
                                    className="mt-1 w-full border rounded px-3 py-2"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm text-gray-700">Código</label>
                                    <input
                                        name="code"
                                        value={planForm.code}
                                        onChange={handlePlanFormChange}
                                        className="mt-1 w-full border rounded px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-gray-700">Tier</label>
                                    <input
                                        name="tier"
                                        value={planForm.tier}
                                        onChange={handlePlanFormChange}
                                        className="mt-1 w-full border rounded px-3 py-2"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm text-gray-700">Descripción</label>
                                <input
                                    name="description"
                                    value={planForm.description}
                                    onChange={handlePlanFormChange}
                                    className="mt-1 w-full border rounded px-3 py-2"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    name="isActive"
                                    checked={!!planForm.isActive}
                                    onChange={handlePlanFormChange}
                                />
                                <label className="text-sm text-gray-700">Activo</label>
                            </div>

                            {planError && <div className="text-sm text-red-600">{planError}</div>}

                            <div className="flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreatePlan(false)}
                                    className="px-4 py-2 bg-gray-200 rounded"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={planSaving}
                                    className="px-4 py-2 bg-brand-600 text-white rounded"
                                >
                                    {planSaving ? "Guardando..." : "Crear plan"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminInsurerEdit;
