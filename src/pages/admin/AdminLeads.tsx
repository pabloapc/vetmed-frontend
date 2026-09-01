import React, { useEffect, useState } from "react";
import adminService from "../../services/adminService";
import { Link } from "react-router-dom";

export const AdminLeads: React.FC = () => {
    const [leads, setLeads] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [limit] = useState(25);
    const [q, setQ] = useState("");
    const [meta, setMeta] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const res: any = await adminService.listLeads({ page, limit, q });
            const data = res?.data ?? res;
            setLeads(data?.leads ?? []);
            setMeta(data?.meta ?? null);
        } catch (err) {
            console.error("list leads error", err);
            setLeads([]);
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

    const handleMarkHandled = async (id: string, handled: boolean) => {
        if (!id) return;
        try {
            await adminService.updateLead(id, { handled });
            await load();
        } catch (err) {
            console.error(err);
            alert("No se pudo actualizar el lead");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar lead? Acción irreversible.")) return;
        try {
            await adminService.deleteLead(id);
            await load();
        } catch (err) {
            console.error(err);
            alert("No se pudo eliminar el lead");
        }
    };

    if (loading) return <div className="container p-6">Cargando...</div>;

    return (
        <div className="container mx-auto p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Leads</h2>
                <div className="flex items-center gap-2">
                    <Link
                        to="/admin"
                        className="text-sm text-blue-600 hover:underline"
                    >
                        Volver
                    </Link>
                </div>
            </div>

            <form onSubmit={handleSearch} className="mb-4 flex gap-2">
                <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Buscar por nombre, email o mensaje"
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
                            <th className="p-2 text-left">Email / Tel</th>
                            <th className="p-2 text-left">Fuente</th>
                            <th className="p-2 text-left">Fecha</th>
                            <th className="p-2 text-left">Manejado</th>
                            <th className="p-2 text-left">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leads.map((l) => (
                            <tr key={l._id} className="border-t">
                                <td className="p-2">
                                    <div className="font-medium">{l.name}</div>
                                    <div className="text-xs text-gray-500">
                                        {l.company}
                                    </div>
                                </td>
                                <td className="p-2">
                                    <div>{l.email}</div>
                                    <div className="text-xs text-gray-500">
                                        {l.telefono}
                                    </div>
                                </td>
                                <td className="p-2 text-sm text-gray-600">
                                    {l.source ?? "-"}
                                </td>
                                <td className="p-2 text-xs text-gray-500">
                                    {new Date(l.createdAt).toLocaleString()}
                                </td>
                                <td className="p-2">
                                    {l.handled ? (
                                        <span className="text-sm text-green-700">
                                            Sí
                                        </span>
                                    ) : (
                                        <span className="text-sm text-red-600">
                                            No
                                        </span>
                                    )}
                                </td>
                                <td className="p-2">
                                    <div className="flex gap-2">
                                        {!l.handled && (
                                            <button
                                                onClick={() =>
                                                    handleMarkHandled(
                                                        l._id,
                                                        true
                                                    )
                                                }
                                                className="px-2 py-1 bg-green-600 text-white rounded text-xs"
                                            >
                                                Marcar manejado
                                            </button>
                                        )}
                                        <Link
                                            to={`/admin/leads/${l._id}`}
                                            className="px-2 py-1 bg-indigo-600 text-white rounded text-xs"
                                        >
                                            Ver
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(l._id)}
                                            className="px-2 py-1 bg-red-600 text-white rounded text-xs"
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {leads.length === 0 && (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="p-4 text-center text-gray-500"
                                >
                                    No hay leads
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

export default AdminLeads;
