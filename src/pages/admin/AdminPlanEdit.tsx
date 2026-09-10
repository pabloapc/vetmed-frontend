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

const getId = (item: any) => String(item?._id ?? item?.id ?? "");
const getName = (item: any) =>
    String(item?.name ?? item?.nombre ?? item?.title ?? "Sin nombre");

const emptyCoverageForm = {
    prestationId: "",
    coverageMode: "covered",
    coveragePercent: "100",
    copayAmount: "0",
    currency: "ARS",
    requiresAuthorization: false,
    isActive: true,
};

export const AdminPlanEdit: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [savedMessage, setSavedMessage] = useState("");
    const [plan, setPlan] = useState<any>(null);

    const [coverages, setCoverages] = useState<any[]>([]);
    const [coveragesLoading, setCoveragesLoading] = useState(false);
    const [prestations, setPrestations] = useState<any[]>([]);

    const [showCreateCoverage, setShowCreateCoverage] = useState(false);
    const [coverageForm, setCoverageForm] = useState<any>(emptyCoverageForm);
    const [coverageSaving, setCoverageSaving] = useState(false);
    const [coverageError, setCoverageError] = useState("");

    const insurer = plan?.insurerId && typeof plan.insurerId === "object" ? plan.insurerId : null;
    const insurerId = String(insurer?._id ?? plan?.insurerId ?? "");

    const loadPlan = async () => {
        if (!id) return;
        setLoading(true);
        setError("");
        try {
            const res: any = await adminService.getPlanAdmin(id);
            const doc = res?.data?.plan ?? res?.data ?? res?.plan ?? res;
            setPlan(doc);
        } catch (err: any) {
            setError(
                err?.response?.data?.message || err.message || "Error al cargar el plan"
            );
        } finally {
            setLoading(false);
        }
    };

    const loadCoverages = async () => {
        if (!id) return;
        setCoveragesLoading(true);
        try {
            const res: any = await adminService.listPlanCoveragesAdmin({ planId: id, limit: 200 });
            setCoverages(normalizeList(res, "coverages"));
        } catch (err) {
            console.error("load plan coverages", err);
            setCoverages([]);
        } finally {
            setCoveragesLoading(false);
        }
    };

    const loadPrestations = async () => {
        try {
            const res: any = await adminService.listPrestations({ page: 1, limit: 500 });
            setPrestations(normalizeList(res, "prestations"));
        } catch (err) {
            console.warn("load prestations failed", err);
            setPrestations([]);
        }
    };

    useEffect(() => {
        loadPlan();
        loadCoverages();
        loadPrestations();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const v =
            e.target.type === "checkbox"
                ? (e.target as HTMLInputElement).checked
                : e.target.value;
        setPlan({ ...plan, [e.target.name]: v });
    };

    const handleSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!id) return;
        setSaving(true);
        setError("");
        setSavedMessage("");
        try {
            const payload: any = {};
            ["name", "code", "tier", "description", "isActive"].forEach((k) => {
                if (typeof plan[k] !== "undefined") payload[k] = plan[k];
            });
            await adminService.updatePlanAdmin(id, payload);
            setSavedMessage("Plan actualizado");
        } catch (err: any) {
            setError(err?.response?.data?.message || err.message || "Error al guardar");
        } finally {
            setSaving(false);
        }
    };

    const coverageMap = React.useMemo(() => {
        const set = new Set(coverages.map((c) => String(c.prestationId?._id ?? c.prestationId)));
        return set;
    }, [coverages]);

    const handleCoverageChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const v =
            e.target.type === "checkbox"
                ? (e.target as HTMLInputElement).checked
                : e.target.value;
        setCoverageForm((prev: any) => ({ ...prev, [e.target.name]: v }));
    };

    const handleCreateCoverage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!id) return;
        if (!coverageForm.prestationId) {
            setCoverageError("Elegí una prestación");
            return;
        }
        setCoverageSaving(true);
        setCoverageError("");
        try {
            await adminService.createPlanCoverageAdmin({
                insurerId,
                planId: id,
                prestationId: coverageForm.prestationId,
                coverageMode: coverageForm.coverageMode,
                coveragePercent:
                    coverageForm.coveragePercent !== ""
                        ? Number(coverageForm.coveragePercent)
                        : undefined,
                copayAmount:
                    coverageForm.copayAmount !== "" ? Number(coverageForm.copayAmount) : undefined,
                currency: coverageForm.currency,
                requiresAuthorization: !!coverageForm.requiresAuthorization,
                isActive: !!coverageForm.isActive,
            });
            setShowCreateCoverage(false);
            setCoverageForm(emptyCoverageForm);
            await loadCoverages();
        } catch (err: any) {
            setCoverageError(
                err?.response?.data?.message || err?.message || "Error al crear cobertura"
            );
        } finally {
            setCoverageSaving(false);
        }
    };

    const handleToggleCoverageActive = async (coverageId: string, current: boolean) => {
        try {
            await adminService.updatePlanCoverageAdmin(coverageId, { isActive: !current });
            await loadCoverages();
        } catch (err) {
            console.error(err);
            alert("No se pudo actualizar la cobertura");
        }
    };

    const handleDeleteCoverage = async (coverageId: string) => {
        if (!confirm("¿Eliminar esta cobertura? Esta acción es irreversible.")) return;
        try {
            await adminService.deletePlanCoverageAdmin(coverageId);
            await loadCoverages();
        } catch (err) {
            console.error(err);
            alert("No se pudo eliminar la cobertura");
        }
    };

    if (loading) return <div className="container p-6">Cargando...</div>;
    if (!plan)
        return (
            <div className="container p-6 text-red-600">{error || "Plan no encontrado"}</div>
        );

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <nav className="text-sm text-gray-500 mb-4 flex items-center gap-1.5 flex-wrap">
                <Link to="/admin/insurers" className="hover:underline">Obras sociales</Link>
                <span>/</span>
                {insurer ? (
                    <Link to={`/admin/insurers/${insurerId}`} className="hover:underline">
                        {insurer.name}
                    </Link>
                ) : (
                    <span>Obra social</span>
                )}
                <span>/</span>
                <span className="text-gray-700 font-medium">{plan.name}</span>
            </nav>

            <h2 className="text-xl font-semibold mb-4">Editar plan</h2>
            {error && <div className="mb-3 text-red-600 text-sm">{error}</div>}
            {savedMessage && <div className="mb-3 text-emerald-600 text-sm">{savedMessage}</div>}

            <form onSubmit={handleSave} className="space-y-3 bg-white rounded-lg shadow p-5 mb-8">
                <div>
                    <label className="block text-sm font-medium">Nombre</label>
                    <input
                        name="name"
                        value={plan.name || ""}
                        onChange={handleChange}
                        className="mt-1 w-full border rounded px-3 py-2"
                    />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-medium">Código</label>
                        <input
                            name="code"
                            value={plan.code || ""}
                            onChange={handleChange}
                            className="mt-1 w-full border rounded px-3 py-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Tier</label>
                        <input
                            name="tier"
                            value={plan.tier || ""}
                            onChange={handleChange}
                            className="mt-1 w-full border rounded px-3 py-2"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium">Descripción</label>
                    <input
                        name="description"
                        value={plan.description || ""}
                        onChange={handleChange}
                        className="mt-1 w-full border rounded px-3 py-2"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        name="isActive"
                        checked={!!plan.isActive}
                        onChange={handleChange}
                    />
                    <label className="text-sm font-medium">Activo</label>
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
                        className="px-4 py-2 bg-gray-200 rounded"
                    >
                        Volver
                    </button>
                </div>
            </form>

            <div className="flex items-center justify-between mb-3">
                <div>
                    <h3 className="text-lg font-semibold">Coberturas de este plan</h3>
                    <p className="text-xs text-gray-500">
                        Definí qué prestaciones cubre este plan y en qué condiciones.
                    </p>
                </div>
                <button
                    onClick={() => {
                        setCoverageError("");
                        setCoverageForm(emptyCoverageForm);
                        setShowCreateCoverage(true);
                    }}
                    className="px-3 py-1.5 bg-brand-600 text-white rounded text-sm"
                >
                    + Nueva cobertura
                </button>
            </div>

            <div className="bg-white rounded shadow">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-2 text-left">Prestación</th>
                            <th className="p-2 text-left">Cobertura</th>
                            <th className="p-2 text-left">Copago</th>
                            <th className="p-2 text-left">Activo</th>
                            <th className="p-2 text-left">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {coveragesLoading && (
                            <tr>
                                <td colSpan={5} className="p-4 text-center text-gray-400">
                                    Cargando...
                                </td>
                            </tr>
                        )}
                        {!coveragesLoading &&
                            coverages.map((c) => (
                                <tr key={c._id} className="border-t">
                                    <td className="p-2">
                                        {getName(
                                            typeof c.prestationId === "object"
                                                ? c.prestationId
                                                : prestations.find((p) => getId(p) === String(c.prestationId))
                                        )}
                                    </td>
                                    <td className="p-2">
                                        {String(c.coverageMode || "covered")}{" "}
                                        {c.coveragePercent != null ? `(${c.coveragePercent}%)` : ""}
                                    </td>
                                    <td className="p-2">
                                        {c.copayAmount != null ? `${c.copayAmount} ${c.currency || "ARS"}` : "-"}
                                    </td>
                                    <td className="p-2">{c.isActive ? "Sí" : "No"}</td>
                                    <td className="p-2">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleToggleCoverageActive(c._id, !!c.isActive)}
                                                className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                                            >
                                                {c.isActive ? "Desactivar" : "Activar"}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteCoverage(c._id)}
                                                className="px-2 py-1 bg-red-600 text-white rounded text-xs"
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        {!coveragesLoading && coverages.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-4 text-center text-gray-500">
                                    Este plan todavía no tiene coberturas cargadas.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showCreateCoverage && (
                <div className="fixed inset-0 z-60 flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setShowCreateCoverage(false)}
                    />
                    <div className="relative bg-white rounded-lg shadow-lg w-full max-w-lg mx-4 p-6 z-50">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-semibold">Nueva cobertura para {plan.name}</h4>
                            <button
                                onClick={() => setShowCreateCoverage(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                Cerrar
                            </button>
                        </div>

                        <form onSubmit={handleCreateCoverage} className="space-y-3">
                            <div>
                                <label className="text-sm text-gray-700">Prestación</label>
                                <select
                                    name="prestationId"
                                    value={coverageForm.prestationId}
                                    onChange={handleCoverageChange}
                                    className="mt-1 w-full border rounded px-3 py-2"
                                >
                                    <option value="">-- seleccionar --</option>
                                    {prestations.map((p: any) => (
                                        <option key={getId(p)} value={getId(p)} disabled={coverageMap.has(getId(p))}>
                                            {getName(p)}
                                            {coverageMap.has(getId(p)) ? " (ya tiene cobertura)" : ""}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm text-gray-700">Modo cobertura</label>
                                    <select
                                        name="coverageMode"
                                        value={coverageForm.coverageMode}
                                        onChange={handleCoverageChange}
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
                                        value={coverageForm.coveragePercent}
                                        onChange={handleCoverageChange}
                                        className="mt-1 w-full border rounded px-3 py-2"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm text-gray-700">Copago</label>
                                    <input
                                        name="copayAmount"
                                        value={coverageForm.copayAmount}
                                        onChange={handleCoverageChange}
                                        className="mt-1 w-full border rounded px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-gray-700">Moneda</label>
                                    <input
                                        name="currency"
                                        value={coverageForm.currency}
                                        onChange={handleCoverageChange}
                                        className="mt-1 w-full border rounded px-3 py-2"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    name="requiresAuthorization"
                                    checked={!!coverageForm.requiresAuthorization}
                                    onChange={handleCoverageChange}
                                />
                                <label className="text-sm text-gray-700">Requiere autorización</label>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    name="isActive"
                                    checked={!!coverageForm.isActive}
                                    onChange={handleCoverageChange}
                                />
                                <label className="text-sm text-gray-700">Activo</label>
                            </div>

                            {coverageError && (
                                <div className="text-sm text-red-600">{coverageError}</div>
                            )}

                            <div className="flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateCoverage(false)}
                                    className="px-4 py-2 bg-gray-200 rounded"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={coverageSaving}
                                    className="px-4 py-2 bg-brand-600 text-white rounded"
                                >
                                    {coverageSaving ? "Guardando..." : "Crear cobertura"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPlanEdit;
