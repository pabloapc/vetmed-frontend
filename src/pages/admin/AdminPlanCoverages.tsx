import React, { useEffect, useState } from "react";
import adminService from "../../services/adminService";
import { Link } from "react-router-dom";

export const AdminPlanCoverages: React.FC = () => {
    const [coverages, setCoverages] = useState<any[]>([]);
    const [insurers, setInsurers] = useState<any[]>([]);
    const [plans, setPlans] = useState<any[]>([]);
    const [prestations, setPrestations] = useState<any[]>([]);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [showCreate, setShowCreate] = useState(false);

    const [page, setPage] = useState(1);
    const [limit] = useState(25);
    const [q, setQ] = useState("");
    const [meta, setMeta] = useState<any>(null);

    const [form, setForm] = useState<any>({
        insurerId: "",
        planId: "",
        prestationId: "",
        coverageMode: "covered",
        coveragePercent: "100",
        copayAmount: "0",
        currency: "ARS",
        requiresAuthorization: false,
        isActive: true,
    });

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

    const getId = (item: any) => String(item?._id ?? item?.id ?? "");
    const getName = (item: any) =>
        String(item?.name ?? item?.nombre ?? item?.title ?? "Sin nombre");

    const load = async () => {
        setLoading(true);
        try {
            const res: any = await adminService.listPlanCoveragesAdmin({
                page,
                limit,
                q,
                insurerId: form.insurerId || undefined,
                planId: form.planId || undefined,
                prestationId: form.prestationId || undefined,
            });
            setCoverages(normalizeList(res, "coverages"));
            setMeta(res?.meta ?? res?.data?.meta ?? null);
        } catch (err) {
            console.error("load plan coverages", err);
            setCoverages([]);
        } finally {
            setLoading(false);
        }
    };

    const loadLookups = async () => {
        try {
            const [insRes, planRes, presRes] = await Promise.all([
                adminService.listInsurersAdmin({ page: 1, limit: 300 }),
                adminService.listPlansAdmin({ page: 1, limit: 500 }),
                adminService.listPrestations({ page: 1, limit: 300 }),
            ]);

            const insurersList = normalizeList(insRes, "insurers");
            const plansList = normalizeList(planRes, "plans");
            const prestationsList = normalizeList(presRes, "prestations");

            setInsurers(insurersList);
            setPlans(plansList);
            setPrestations(prestationsList);
        } catch (err) {
            console.warn("load coverages lookups failed", err);
            setInsurers([]);
            setPlans([]);
            setPrestations([]);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    useEffect(() => {
        loadLookups();
    }, []);

    const filteredPlans = plans.filter((p: any) => {
        if (!form.insurerId) return true;
        const planInsurerId = String(
            p?.insurerId?._id ?? p?.insurerId?.id ?? p?.insurerId ?? ""
        );
        return planInsurerId === String(form.insurerId);
    });

    const findName = (arr: any[], id: any) =>
        getName(arr.find((i: any) => getId(i) === String(id))) || id;

    const handleSearch = async (e?: React.FormEvent) => {
        e?.preventDefault();
        setPage(1);
        await load();
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const v =
            e.target.type === "checkbox"
                ? (e.target as HTMLInputElement).checked
                : e.target.value;

        if (e.target.name === "insurerId") {
            setForm((prev: any) => ({ ...prev, insurerId: String(v), planId: "" }));
            return;
        }

        setForm((prev: any) => ({ ...prev, [e.target.name]: v }));
    };

    const handleCreate = async (e?: React.FormEvent) => {
        e?.preventDefault();
        setError("");

        if (!form.insurerId || !form.planId || !form.prestationId) {
            setError("Obra social, plan y prestación son requeridos");
            return;
        }

        setSaving(true);
        try {
            const payload = {
                insurerId: form.insurerId,
                planId: form.planId,
                prestationId: form.prestationId,
                coverageMode: form.coverageMode,
                coveragePercent:
                    form.coveragePercent !== "" ? Number(form.coveragePercent) : undefined,
                copayAmount: form.copayAmount !== "" ? Number(form.copayAmount) : undefined,
                currency: form.currency,
                requiresAuthorization: !!form.requiresAuthorization,
                isActive: !!form.isActive,
            };

            await adminService.createPlanCoverageAdmin(payload);
            setShowCreate(false);
            setForm({
                insurerId: "",
                planId: "",
                prestationId: "",
                coverageMode: "covered",
                coveragePercent: "100",
                copayAmount: "0",
                currency: "ARS",
                requiresAuthorization: false,
                isActive: true,
            });
            await load();
        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                    err?.message ||
                    "Error al crear cobertura"
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar cobertura? Esta acción es irreversible.")) return;
        try {
            await adminService.deletePlanCoverageAdmin(id);
            await load();
        } catch (err) {
            console.error(err);
            alert("No se pudo eliminar la cobertura");
        }
    };

    const handleToggleActive = async (id: string, current: boolean) => {
        try {
            await adminService.updatePlanCoverageAdmin(id, { isActive: !current });
            await load();
        } catch (err) {
            console.error(err);
            alert("No se pudo actualizar la cobertura");
        }
    };

    if (loading) return <div className="container p-6">Cargando...</div>;

    return (
        <div className="container mx-auto p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Coberturas de planes</h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowCreate(true)}
                        className="px-3 py-1 bg-blue-600 text-white rounded"
                    >
                        Nueva cobertura
                    </button>
                    <Link to="/admin" className="text-sm text-blue-600 hover:underline">
                        Volver
                    </Link>
                </div>
            </div>

            <form onSubmit={handleSearch} className="mb-4 flex gap-2">
                <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Buscar por plan o prestación"
                    className="border px-3 py-2 rounded w-full"
                />
                <button
                    type="submit"
                    className="bg-blue-600 text-white px-3 py-2 rounded"
                >
                    Buscar
                </button>
            </form>

            <div className="bg-white rounded shadow">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-2 text-left">Obra social</th>
                            <th className="p-2 text-left">Plan</th>
                            <th className="p-2 text-left">Prestación</th>
                            <th className="p-2 text-left">Cobertura</th>
                            <th className="p-2 text-left">Copago</th>
                            <th className="p-2 text-left">Activo</th>
                            <th className="p-2 text-left">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {coverages.map((c) => (
                            <tr key={c._id} className="border-t">
                                <td className="p-2">{findName(insurers, c.insurerId?._id ?? c.insurerId)}</td>
                                <td className="p-2">{findName(plans, c.planId?._id ?? c.planId)}</td>
                                <td className="p-2">{findName(prestations, c.prestationId?._id ?? c.prestationId)}</td>
                                <td className="p-2">
                                    {String(c.coverageMode || "covered")} {c.coveragePercent != null ? `(${c.coveragePercent}%)` : ""}
                                </td>
                                <td className="p-2">
                                    {c.copayAmount != null ? `${c.copayAmount} ${c.currency || "ARS"}` : "-"}
                                </td>
                                <td className="p-2">{c.isActive ? "Sí" : "No"}</td>
                                <td className="p-2">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleToggleActive(c._id, !!c.isActive)}
                                            className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                                        >
                                            {c.isActive ? "Desactivar" : "Activar"}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(c._id)}
                                            className="px-2 py-1 bg-red-600 text-white rounded text-xs"
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {coverages.length === 0 && (
                            <tr>
                                <td colSpan={7} className="p-4 text-center text-gray-500">
                                    No hay coberturas
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
                    <div className="relative bg-white rounded-lg shadow-lg w-full max-w-2xl mx-4 p-6 z-50">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-semibold">Crear cobertura</h4>
                            <button
                                onClick={() => setShowCreate(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                Cerrar
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm text-gray-700">Obra social</label>
                                    <select
                                        name="insurerId"
                                        value={form.insurerId}
                                        onChange={handleChange}
                                        className="mt-1 w-full border rounded px-3 py-2"
                                    >
                                        <option value="">-- seleccionar --</option>
                                        {insurers.map((i: any) => (
                                            <option key={getId(i)} value={getId(i)}>
                                                {getName(i)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-sm text-gray-700">Plan</label>
                                    <select
                                        name="planId"
                                        value={form.planId}
                                        onChange={handleChange}
                                        className="mt-1 w-full border rounded px-3 py-2"
                                    >
                                        <option value="">-- seleccionar --</option>
                                        {filteredPlans.map((p: any) => (
                                            <option key={getId(p)} value={getId(p)}>
                                                {getName(p)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-sm text-gray-700">Prestación</label>
                                    <select
                                        name="prestationId"
                                        value={form.prestationId}
                                        onChange={handleChange}
                                        className="mt-1 w-full border rounded px-3 py-2"
                                    >
                                        <option value="">-- seleccionar --</option>
                                        {prestations.map((p: any) => (
                                            <option key={getId(p)} value={getId(p)}>
                                                {getName(p)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-sm text-gray-700">Modo cobertura</label>
                                    <select
                                        name="coverageMode"
                                        value={form.coverageMode}
                                        onChange={handleChange}
                                        className="mt-1 w-full border rounded px-3 py-2"
                                    >
                                        <option value="covered">covered</option>
                                        <option value="partial">partial</option>
                                        <option value="excluded">excluded</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-sm text-gray-700">Cobertura %</label>
                                    <input
                                        name="coveragePercent"
                                        value={form.coveragePercent}
                                        onChange={handleChange}
                                        className="mt-1 w-full border rounded px-3 py-2"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm text-gray-700">Copago</label>
                                    <input
                                        name="copayAmount"
                                        value={form.copayAmount}
                                        onChange={handleChange}
                                        className="mt-1 w-full border rounded px-3 py-2"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm text-gray-700">Moneda</label>
                                    <input
                                        name="currency"
                                        value={form.currency}
                                        onChange={handleChange}
                                        className="mt-1 w-full border rounded px-3 py-2"
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name="requiresAuthorization"
                                        checked={!!form.requiresAuthorization}
                                        onChange={handleChange}
                                    />
                                    <label className="text-sm text-gray-700">Requiere autorización</label>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name="isActive"
                                        checked={!!form.isActive}
                                        onChange={handleChange}
                                    />
                                    <label className="text-sm text-gray-700">Activo</label>
                                </div>
                            </div>

                            {error && <div className="text-sm text-red-600">{error}</div>}

                            <div className="flex items-center justify-end gap-2">
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
                                    {saving ? "Guardando..." : "Crear cobertura"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPlanCoverages;
