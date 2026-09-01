import React, { useEffect, useState } from "react";
import adminService from "../../services/adminService";
import { Link, useNavigate } from "react-router-dom";
import {
    BuildingStorefrontIcon,
    MagnifyingGlassIcon,
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    FunnelIcon,
    ArrowLeftIcon,
    ArrowRightIcon,
    ExclamationTriangleIcon,
    DocumentTextIcon,
} from "@heroicons/react/24/outline";

const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:3000/api").replace(
    /\/api\/?$/,
    ""
);

const toPublicFileUrl = (raw?: string) => {
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;

    const uploadsIdx = raw.indexOf("/uploads/");
    if (uploadsIdx >= 0) {
        return `${API_ORIGIN}${raw.slice(uploadsIdx)}`;
    }

    if (raw.startsWith("/")) {
        return `${API_ORIGIN}${raw}`;
    }

    return `${API_ORIGIN}/${raw}`;
};

export const AdminPharmacies: React.FC = () => {
    const [items, setItems] = useState<any[]>([]);
    const [q, setQ] = useState("");
    const [vademecumFilter, setVademecumFilter] = useState<
        "all" | "with" | "without"
    >("all");
    const [page, setPage] = useState(1);
    const [limit] = useState(25);
    const [meta, setMeta] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const load = async () => {
        setLoading(true);
        try {
            const res = await adminService.listPharmacies({ page, limit, q });
            const data = res?.data ?? res;
            setItems(data?.pharmacies ?? []);
            setMeta(data?.meta ?? null);
        } catch (err) {
            console.error("admin pharmacies list error", err);
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
        if (!confirm("¿Eliminar farmacia? Esta acción es irreversible."))
            return;
        try {
            await adminService.deletePharmacy(id);
            await load();
        } catch (err) {
            console.error(err);
            alert("No se pudo eliminar la farmacia");
        }
    };

    const getVademecumMeta = (p: any) => {
        const fileName =
            p?.vademecumFile?.originalName ||
            p?.vademecumFile?.fileName ||
            p?.vademecumFileName ||
            p?.vademecum?.fileName ||
            "";

        const fileUrl =
            p?.vademecumFile?.url || p?.vademecumFileUrl || p?.vademecum?.url || "";

        const publicUrl = toPublicFileUrl(fileUrl);

        return {
            hasFile: Boolean(fileName || publicUrl),
            fileName,
            fileUrl: publicUrl,
        };
    };

    const filteredItems = items.filter((p) => {
        const vm = getVademecumMeta(p);
        if (vademecumFilter === "with") return vm.hasFile;
        if (vademecumFilter === "without") return !vm.hasFile;
        return true;
    });

    return (
        <div className="min-h-screen bg-gray-50 pb-10">
            {/* Hero */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 px-6 pt-10 pb-8">
                <div className="mx-auto max-w-5xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                                <BuildingStorefrontIcon className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">Farmacias</h1>
                                <p className="text-sm text-slate-300">Gestión de farmacias adheridas</p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate("/admin/pharmacies/new")}
                            className="flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-indigo-400 transition-colors"
                        >
                            <PlusIcon className="h-4 w-4" />
                            Nueva farmacia
                        </button>
                    </div>

                    {/* KPI */}
                    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl bg-white/10 px-4 py-3 text-center">
                            <p className="text-2xl font-bold text-white">{meta?.total ?? filteredItems.length}</p>
                            <p className="text-xs text-slate-300">Total</p>
                        </div>
                        <div className="rounded-2xl bg-white/10 px-4 py-3 text-center">
                            <p className="text-2xl font-bold text-emerald-300">{filteredItems.filter(p => getVademecumMeta(p).hasFile).length}</p>
                            <p className="text-xs text-slate-300">Con vademécum</p>
                        </div>
                        <div className="rounded-2xl bg-white/10 px-4 py-3 text-center">
                            <p className="text-2xl font-bold text-amber-300">{filteredItems.filter(p => p.isActive).length}</p>
                            <p className="text-xs text-slate-300">Activas</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-5xl px-4 -mt-4">
                {/* Filtros */}
                <div className="rounded-[1.75rem] bg-white border border-gray-100 shadow-sm px-5 py-4 mb-5">
                    <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                            <FunnelIcon className="h-4 w-4" />
                            Filtros
                        </div>
                        <div className="flex flex-1 items-center gap-2 rounded-xl border border-gray-300 px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-indigo-400">
                            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 shrink-0" />
                            <input
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="Buscar por nombre o dirección…"
                                className="flex-1 text-sm outline-none bg-transparent"
                            />
                        </div>
                        <select
                            value={vademecumFilter}
                            onChange={(e) => setVademecumFilter(e.target.value as "all" | "with" | "without")}
                            className="rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                        >
                            <option value="all">Todos</option>
                            <option value="with">Con vademécum</option>
                            <option value="without">Sin vademécum</option>
                        </select>
                        <button
                            type="submit"
                            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
                        >
                            Buscar
                        </button>
                    </form>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Cargando…</div>
                ) : (
                    <>
                        <div className="rounded-[1.75rem] bg-white border border-gray-100 shadow-sm overflow-hidden">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Nombre</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Dirección</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Teléfono</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Vademécum</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Activo</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredItems.map((p) => {
                                        const vm = getVademecumMeta(p);
                                        return (
                                            <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                                                <td className="px-4 py-3 text-gray-600">{p.address}</td>
                                                <td className="px-4 py-3 text-gray-600">{p.phone ?? "-"}</td>
                                                <td className="px-4 py-3">
                                                    {vm.hasFile ? (
                                                        <div className="flex flex-col gap-1">
                                                            <span className="inline-flex w-fit items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                                                <DocumentTextIcon className="h-3 w-3" />
                                                                Cargado
                                                            </span>
                                                            {vm.fileUrl && (
                                                                <a
                                                                    href={vm.fileUrl}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="text-xs text-indigo-600 hover:underline max-w-[180px] truncate"
                                                                    title={vm.fileName || vm.fileUrl}
                                                                >
                                                                    {vm.fileName || "Ver archivo"}
                                                                </a>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                                                            Sin archivo
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${p.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                                                        {p.isActive ? "Activa" : "Inactiva"}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <Link
                                                            to={`/admin/pharmacies/${p._id}`}
                                                            className="flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
                                                        >
                                                            <PencilSquareIcon className="h-3.5 w-3.5" />
                                                            Editar
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDelete(p._id)}
                                                            className="flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors"
                                                        >
                                                            <TrashIcon className="h-3.5 w-3.5" />
                                                            Eliminar
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredItems.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-12 text-center">
                                                <ExclamationTriangleIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                                <p className="text-sm text-gray-400">No hay farmacias para mostrar</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Paginador */}
                        <div className="flex items-center justify-between mt-4 px-1">
                            <p className="text-sm text-gray-500">Total: <span className="font-semibold text-gray-700">{meta?.total ?? 0}</span></p>
                            <div className="flex items-center gap-2">
                                <button
                                    disabled={page <= 1}
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    className="flex items-center gap-1 rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ArrowLeftIcon className="h-3.5 w-3.5" />
                                    Anterior
                                </button>
                                <span className="px-3 text-sm text-gray-600 font-medium">{page}</span>
                                <button
                                    disabled={!!(meta && meta.total && page * limit >= meta.total)}
                                    onClick={() => setPage((p) => p + 1)}
                                    className="flex items-center gap-1 rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    Siguiente
                                    <ArrowRightIcon className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminPharmacies;
