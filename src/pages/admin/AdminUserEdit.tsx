import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import adminService from "../../services/adminService";

type EntityOption = { id: string; name: string; address?: string };

export const AdminUserEdit: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [data, setData] = useState<any>(null);

    // entity assignment state
    const [assignMode, setAssignMode] = useState<
        "none" | "existing" | "create"
    >("none");
    const [entityQuery, setEntityQuery] = useState("");
    const [entityOptions, setEntityOptions] = useState<EntityOption[]>([]);
    const [selectedEntityId, setSelectedEntityId] = useState<string>("");
    const [entityForm, setEntityForm] = useState<any>({
        name: "",
        address: "",
        phone: "",
        latitude: "",
        longitude: "",
    });
    const [searchLoading, setSearchLoading] = useState(false);

    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                setLoading(true);
                const res = await adminService.getUser(id);
                const u = res?.data?.user ?? res?.user ?? res;
                setData(u);

                // initialize assignMode depending on whether user has entityId
                if (u?.entityId) {
                    setAssignMode("none");
                    setSelectedEntityId(String(u.entityId));
                } else {
                    setAssignMode("none"); // default none - admin can opt to assign
                }
            } catch (err: any) {
                setError(
                    err?.response?.data?.message ||
                        err.message ||
                        "Error al cargar usuario"
                );
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    // when role selection changes, reset entity related state
    useEffect(() => {
        if (!data) return;
        if (
            data.role === "veterinaria" ||
            data.role === "emergency"
        ) {
            setEntityOptions([]);
            setSelectedEntityId(data.entityId ? String(data.entityId) : "");
            setAssignMode(data.entityId ? "none" : "none");
        } else {
            setEntityOptions([]);
            setSelectedEntityId("");
            setAssignMode("none");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data?.role]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        setData({ ...data, [e.target.name]: e.target.value });
    };

    const handleEntityFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEntityForm({ ...entityForm, [e.target.name]: e.target.value });
    };

    const handleSearchEntities = async (e?: React.FormEvent) => {
        if (e && typeof e.preventDefault === "function") e.preventDefault();
        if (!data?.role) return;
        setSearchLoading(true);
        setEntityOptions([]);
        try {
            const q = entityQuery?.trim() || "";
            console.debug("handleSearchEntities start", { role: data.role, q });

            if (data.role === "veterinaria") {
                const res: any = await adminService.listVeterinarias({
                    q,
                    page: 1,
                    limit: 50,
                    unassigned: true,
                });
                console.debug("adminService.listVeterinarias rawres=", res);

                let list: any[] = [];
                if (Array.isArray(res)) list = res;
                else if (res && res.data && Array.isArray(res.data.veterinarias))
                    list = res.data.veterinarias;
                else if (res && res.veterinarias && Array.isArray(res.veterinarias))
                    list = res.veterinarias;
                else if (res && res.data && Array.isArray(res.data))
                    list = res.data;
                else if (
                    res &&
                    res.data &&
                    res.data.data &&
                    Array.isArray(res.data.data)
                )
                    list = res.data.data;

                const opts = (Array.isArray(list) ? list : []).map(
                    (p: any) => ({
                        id: p._id ?? p.id ?? (p._doc && p._doc._id) ?? "",
                        name: p.name ?? p.nombre ?? "",
                        address: p.address ?? p.direccion ?? "",
                    })
                );
                setEntityOptions(opts);
            } else if (data.role === "emergency") {
                // support searching emergencies
                const res: any = await adminService.listEmergencies({
                    q,
                    page: 1,
                    limit: 50,
                    unassigned: true,
                });
                console.debug("adminService.listEmergencies rawres=", res);

                let list: any[] = [];
                if (Array.isArray(res)) list = res;
                else if (res && res.data && Array.isArray(res.data.emergencies))
                    list = res.data.emergencies;
                else if (
                    res &&
                    res.emergencies &&
                    Array.isArray(res.emergencies)
                )
                    list = res.emergencies;
                else if (res && res.data && Array.isArray(res.data))
                    list = res.data;
                else if (
                    res &&
                    res.data &&
                    res.data.data &&
                    Array.isArray(res.data.data)
                )
                    list = res.data.data;

                const opts = (Array.isArray(list) ? list : []).map(
                    (d: any) => ({
                        id: d._id ?? d.id ?? (d._doc && d._doc._id) ?? "",
                        name: d.name ?? d.title ?? d.nombre ?? "",
                        address: d.address ?? d.direccion ?? "",
                    })
                );
                setEntityOptions(opts);
            }
        } catch (err) {
            console.error("search entities error", err);
            setEntityOptions([]);
        } finally {
            setSearchLoading(false);
        }
    };

    const handleSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!id) return;
        setSaving(true);
        setError("");

        try {
            const payload: any = {};
            // allowed fields
            [
                "name",
                "email",
                "role",
                "entityId",
                "telefono",
                "direccion",
                "ciudad",
                "provincia",
                "codigoPostal",
                "isVerified",
                "isActive",
            ].forEach((k) => {
                if (typeof data[k] !== "undefined") payload[k] = data[k];
            });

            // assign existing entity
            if (assignMode === "existing" && selectedEntityId) {
                payload.entityId = selectedEntityId;
            }

            // create entity inline: send entityData so backend can create and assign (if backend supports entityData)
            if (assignMode === "create") {
                // include entityData in payload under entityData key
                payload.entityData = {
                    name: entityForm.name,
                    address: entityForm.address,
                    phone: entityForm.phone,
                };
                if (entityForm.latitude && entityForm.longitude) {
                    const lat = parseFloat(entityForm.latitude);
                    const lng = parseFloat(entityForm.longitude);
                    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
                        payload.entityData.latitude = lat;
                        payload.entityData.longitude = lng;
                    }
                }
            }

            const res = await adminService.updateUser(id, payload);
            const updatedUser = res?.data?.user ?? res?.user ?? res;
            console.log("User updated", updatedUser);
            alert("Usuario actualizado");
            navigate("/admin/users");
        } catch (err: any) {
            const msg =
                err?.response?.data?.message ||
                err.message ||
                "Error al guardar";
            setError(msg);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="container p-6">Cargando...</div>;
    if (!data)
        return (
            <div className="container p-6 text-red-600">
                {error || "Usuario no encontrado"}
            </div>
        );

    return (
        <div className="container mx-auto p-6 max-w-2xl">
            <h2 className="text-xl font-semibold mb-4">Editar usuario</h2>
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
                    <label className="block text-sm font-medium">Email</label>
                    <input
                        name="email"
                        value={data.email || ""}
                        onChange={handleChange}
                        className="mt-1 w-full border rounded px-3 py-2"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium">Rol</label>
                    <select
                        name="role"
                        value={data.role || "user"}
                        onChange={(e) => {
                            // update role in data and reset entity linking UI
                            const newRole = e.target.value;
                            setData({ ...data, role: newRole });
                            setAssignMode("none");
                            setEntityOptions([]);
                            setSelectedEntityId("");
                            setEntityForm({
                                name: "",
                                address: "",
                                phone: "",
                                latitude: "",
                                longitude: "",
                            });
                        }}
                        className="mt-1 w-full border rounded px-3 py-2"
                    >
                        <option value="user">user</option>
                        <option value="veterinaria">veterinaria</option>
                        <option value="admin">admin</option>
                        <option value="emergency">emergency</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium">
                        Entidad (entityId)
                    </label>
                    <input
                        name="entityId"
                        value={String(data.entityId ?? selectedEntityId ?? "")}
                        onChange={(e) => {
                            setData({ ...data, entityId: e.target.value });
                            setSelectedEntityId(e.target.value);
                        }}
                        className="mt-1 w-full border rounded px-3 py-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Si querés asignar una entidad existente o crear una
                        nueva, usá las opciones debajo.
                    </p>
                </div>

                {/* Show assignment controls for veterinaria/emergency */}
                {(data.role === "veterinaria" ||
                    data.role === "emergency") && (
                    <div className="mt-3 p-3 border rounded bg-gray-50">
                        <div className="flex items-center gap-3 mb-3">
                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    checked={assignMode === "none"}
                                    onChange={() => setAssignMode("none")}
                                    className="mr-2"
                                />
                                Ninguna (usar lo que tenga el usuario / crear
                                minimal si el backend lo hace)
                            </label>

                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    checked={assignMode === "existing"}
                                    onChange={() => setAssignMode("existing")}
                                    className="mr-2"
                                />
                                Asignar existente
                            </label>

                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    checked={assignMode === "create"}
                                    onChange={() => setAssignMode("create")}
                                    className="mr-2"
                                />
                                Crear y asignar
                            </label>
                        </div>

                        {assignMode === "existing" && (
                            <div>
                                {/* búsqueda - reemplazo del form anidado */}
                                <div className="flex gap-2 mb-2">
                                    <input
                                        placeholder={`Buscar ${
                                            data.role === "veterinaria"
                                                ? "veterinarias"
                                                : "servicios de emergencia"
                                        }`}
                                        value={entityQuery}
                                        onChange={(e) =>
                                            setEntityQuery(e.target.value)
                                        }
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                handleSearchEntities();
                                            }
                                        }}
                                        className="border px-3 py-2 rounded flex-1"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleSearchEntities()}
                                        disabled={searchLoading}
                                        className="px-3 py-2 bg-blue-600 text-white rounded"
                                    >
                                        {searchLoading
                                            ? "Buscando..."
                                            : "Buscar"}
                                    </button>
                                </div>

                                <div className="mb-2">
                                    <label className="block text-sm font-medium">
                                        Seleccionar entidad
                                    </label>
                                    <select
                                        value={selectedEntityId}
                                        onChange={(e) =>
                                            setSelectedEntityId(e.target.value)
                                        }
                                        className="mt-1 w-full border rounded px-3 py-2"
                                    >
                                        <option value="">
                                            -- Seleccionar --
                                        </option>
                                        {entityOptions.map((opt) => (
                                            <option key={opt.id} value={opt.id}>
                                                {opt.name}{" "}
                                                {opt.address
                                                    ? `— ${opt.address}`
                                                    : ""}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        {assignMode === "create" && (
                            <div className="space-y-2">
                                <div>
                                    <label className="block text-sm font-medium">
                                        Nombre público
                                    </label>
                                    <input
                                        name="name"
                                        value={entityForm.name}
                                        onChange={handleEntityFormChange}
                                        className="mt-1 w-full border rounded px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">
                                        Dirección
                                    </label>
                                    <input
                                        name="address"
                                        value={entityForm.address}
                                        onChange={handleEntityFormChange}
                                        className="mt-1 w-full border rounded px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">
                                        Teléfono
                                    </label>
                                    <input
                                        name="phone"
                                        value={entityForm.phone}
                                        onChange={handleEntityFormChange}
                                        className="mt-1 w-full border rounded px-3 py-2"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-sm font-medium">
                                            Latitud
                                        </label>
                                        <input
                                            name="latitude"
                                            value={entityForm.latitude}
                                            onChange={handleEntityFormChange}
                                            className="mt-1 w-full border rounded px-3 py-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium">
                                            Longitud
                                        </label>
                                        <input
                                            name="longitude"
                                            value={entityForm.longitude}
                                            onChange={handleEntityFormChange}
                                            className="mt-1 w-full border rounded px-3 py-2"
                                        />
                                    </div>
                                </div>

                                <p className="text-xs text-gray-500">
                                    Si el backend soporta `entityData` en el
                                    payload, estos valores serán utilizados para
                                    crear y asignar la entidad. Si no, el
                                    servidor creará una entidad mínima.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex gap-2 mt-4">
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

export default AdminUserEdit;
