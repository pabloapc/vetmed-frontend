import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import adminService from "../../services/adminService";

export const AdminInsurers: React.FC = () => {
    const navigate = useNavigate();
    const [items, setItems] = useState<any[]>([]);
    const [q, setQ] = useState("");
    const [page, setPage] = useState(1);
    const [limit] = useState(25);
    const [meta, setMeta] = useState<any>(null);
    const [loading, setLoading] = useState(false);

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
            const res: any = await adminService.listInsurersAdmin({
                page,
                limit,
                q,
            });
            setItems(normalizeList(res, "insurers"));
            setMeta(res?.meta ?? res?.data?.meta ?? null);
        } catch (err) {
            console.error("admin insurers list error", err);
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line
    }, [page]);

    const handleSearch = async (e?: React.FormEvent) => {
        e?.preventDefault();
        setPage(1);
        await load();
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar obra social? Esta acción es irreversible."))
            return;
        try {
            await adminService.deleteInsurerAdmin(id);
            await load();
        } catch (err) {
            console.error(err);
            alert("No se pudo eliminar la obra social");
        }
    };

    if (loading) return <div className="container p-6">Cargando...</div>;

    return (
        <div className="container mx-auto p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                    Obras sociales
                </h2>
                <div>
                    <button
                        onClick={() => navigate("/admin/insurers/new")}
                        className="px-3 py-1 bg-blue-600 text-white rounded"
                    >
                        Nueva obra social
                    </button>
                </div>
            </div>

            <form onSubmit={handleSearch} className="mb-4 flex gap-2">
                <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Buscar por nombre o código"
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
                            <th className="p-2 text-left">Nombre</th>
                            <th className="p-2 text-left">Tipo</th>
                            <th className="p-2 text-left">Teléfono</th>
                            <th className="p-2 text-left">Activo</th>
                            <th className="p-2 text-left">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((p) => (
                            <tr key={p._id} className="border-t">
                                <td className="p-2">{p.name}</td>
                                <td className="p-2">{p.kind ?? p.category ?? "-"}</td>
                                <td className="p-2">{p.phone ?? "-"}</td>
                                <td className="p-2">{p.isActive ? "Sí" : "No"}</td>
                                <td className="p-2">
                                    <div className="flex gap-2">
                                        <Link
                                            to={`/admin/insurers/${p._id}`}
                                            className="px-2 py-1 bg-indigo-600 text-white rounded text-xs"
                                        >
                                            Editar
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(p._id)}
                                            className="px-2 py-1 bg-red-600 text-white rounded text-xs"
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {items.length === 0 && (
                            <tr>
                                <td
                                    colSpan={5}
                                    className="p-4 text-center text-gray-500"
                                >
                                    No hay obras sociales
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex items-center justify-between mt-3">
                <div className="text-sm text-gray-600">
                    Total: {meta?.total ?? 0}
                </div>
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
                        disabled={
                            meta && meta.total && page * limit >= meta.total
                        }
                        onClick={() => setPage((p) => p + 1)}
                        className="px-3 py-1 bg-gray-200 rounded"
                    >
                        Siguiente
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminInsurers;
