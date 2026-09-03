import React, { useState } from "react";
import requestService from "../services/requestService";
import { useAuth } from "../hooks/useAuth";
import { veterinariaActionTypeLabel } from "../constants/veterinariaActionTypes";
import { CheckIcon } from "@heroicons/react/24/outline";

type RequestType = any;

type Props = {
    r: RequestType;
    onRefresh: () => Promise<void> | void;
};

/**
 * RequestRow
 *
 * Componente reutilizable para mostrar una solicitud (request) y
 * permitir a la veterinaria aceptar programando día/hora y url,
 * editar la metadata, marcar como cumplida o cancelar.
 *
 * Actualizaciones:
 * - Muestra información de confirmación por parte del paciente (status_reply, status_reply_by, status_reply_at)
 * - Deshabilita acciones sensibles (aceptar, marcar cumplida, cancelar, editar metadata) si el paciente ya confirmó la finalización
 * - Añade un editor simple de "receta" que permite:
 *    - editar/preview de la receta (texto)
 *    - descargar la receta como PDF (usa jsPDF)
 *    - enviar la receta como texto por WhatsApp (usa wa.me con el texto)
 *
 * Nota: para que `Generar PDF` funcione hay que instalar la dependencia `jspdf`:
 * npm install jspdf
 */
export const RequestRow: React.FC<Props> = ({ r, onRefresh }) => {
    const { user } = useAuth();

    const userInfo = r.user ?? r.userSnapshot ?? {};
    const phone = userInfo?.telefono || userInfo?.phone || "";
    const createdAt = r.createdAt ? new Date(r.createdAt).toLocaleString() : "";
    const expiresAt = r.expiresAt ? new Date(r.expiresAt).toLocaleString() : "";

    const [loadingAccept, setLoadingAccept] = useState(false);
    const [loadingFulfill, setLoadingFulfill] = useState(false);
    const [loadingCancel, setLoadingCancel] = useState(false);
    const [loadingMetadataUpdate, setLoadingMetadataUpdate] = useState(false);

    const [showScheduleEditor, setShowScheduleEditor] = useState(false);
    const [callUrl, setCallUrl] = useState<string>(r.metadata?.callUrl ?? "");
    const [scheduledAt, setScheduledAt] = useState<string>(
        r.metadata?.scheduledAt ? toDateTimeLocal(r.metadata?.scheduledAt) : ""
    );

    // Nuevo: receta editor / preview
    const [showPrescriptionEditor, setShowPrescriptionEditor] = useState(false);
    const [prescriptionText, setPrescriptionText] = useState<string>(() => {
        // plantilla de ejemplo
        const veterinarianName = (user && user.name) || "Dr./Dra. Nombre";
        const dateStr = new Date().toLocaleDateString();
        return `Receta veterinaria\n\nPaciente: ${
            userInfo?.name || "Nombre paciente"
        }\nFecha: ${dateStr}\n\nPrescripción:\n- Paracetamol 500 mg, 1 tableta cada 8 horas por 5 días\n- Ibuprofeno 400 mg, 1 tableta si dolor (máx 3/día)\n\nIndicaciones adicionales:\n- Reposo relativo\n- Consultar si persisten los síntomas\n\nVeterinario: ${veterinarianName}\nFirma: ____________________`;
    });

    // convierte ISO/Date a string para input datetime-local (yyyy-MM-ddTHH:mm)
    function toDateTimeLocal(value: string | Date) {
        const dt = new Date(value);
        if (isNaN(dt.getTime())) return "";
        const pad = (n: number) => String(n).padStart(2, "0");
        const yyyy = dt.getFullYear();
        const mm = pad(dt.getMonth() + 1);
        const dd = pad(dt.getDate());
        const hh = pad(dt.getHours());
        const min = pad(dt.getMinutes());
        return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
    }

    // convertir datetime-local value a ISO (UTC)
    function toIsoFromLocal(dtLocal: string | null) {
        if (!dtLocal) return null;
        const dt = new Date(dtLocal);
        if (isNaN(dt.getTime())) return null;
        return dt.toISOString();
    }

    const canAct =
        user &&
        (user.role === "admin" ||
            String(user.entityId) ===
                String(r.target || r.targetId || r.target?._id));

    // Nuevo: si el paciente ya confirmó, consideramos finalizada la request desde su lado
    const isPatientConfirmed = Boolean(r.status_reply);

    // Accept + schedule
    const handleAcceptWithSchedule = async () => {
        if (isPatientConfirmed) {
            alert(
                "La solicitud ya fue confirmada por el paciente. No se pueden modificar los detalles."
            );
            return;
        }
        setLoadingAccept(true);
        try {
            const iso = toIsoFromLocal(scheduledAt);
            await requestService.updateRequestStatus(r._id, "accepted", {
                callUrl: callUrl || "",
                scheduledAt: iso,
            });
            if (onRefresh) await onRefresh();
            setShowScheduleEditor(false);
            alert("Solicitud aceptada y programada.");
        } catch (err: any) {
            console.error(err);
            alert(
                err?.response?.data?.message || "Error al aceptar la solicitud"
            );
        } finally {
            setLoadingAccept(false);
        }
    };

    // Update metadata only (for accepted requests)
    const handleUpdateMetadata = async () => {
        if (isPatientConfirmed) {
            alert(
                "La solicitud ya fue confirmada por el paciente. No se pueden modificar los detalles."
            );
            return;
        }
        setLoadingMetadataUpdate(true);
        try {
            const iso = toIsoFromLocal(scheduledAt);
            await requestService.updateRequestStatus(
                r._id,
                r.status || "accepted",
                {
                    callUrl: callUrl || "",
                    scheduledAt: iso,
                }
            );
            if (onRefresh) await onRefresh();
            setShowScheduleEditor(false);
            alert("Metadata actualizada.");
        } catch (err: any) {
            console.error(err);
            alert(
                err?.response?.data?.message || "Error al actualizar metadata"
            );
        } finally {
            setLoadingMetadataUpdate(false);
        }
    };

    const handleMarkFulfilled = async () => {
        if (isPatientConfirmed) {
            alert("La solicitud ya fue confirmada por el paciente.");
            return;
        }
        setLoadingFulfill(true);
        try {
            await requestService.updateRequestStatus(r._id, "fulfilled");
            if (onRefresh) await onRefresh();
            alert("Solicitud marcada como cumplida.");
        } catch (err: any) {
            console.error(err);
            alert(
                err?.response?.data?.message || "Error al marcar como cumplida"
            );
        } finally {
            setLoadingFulfill(false);
        }
    };

    const handleCancel = async () => {
        if (!confirm("¿Confirmás cancelar esta solicitud?")) return;
        if (isPatientConfirmed) {
            alert(
                "La solicitud ya fue confirmada por el paciente. No se puede cancelar."
            );
            return;
        }
        setLoadingCancel(true);
        try {
            await requestService.updateRequestStatus(r._id, "cancelled");
            if (onRefresh) await onRefresh();
            alert("Solicitud cancelada.");
        } catch (err: any) {
            console.error(err);
            alert(err?.response?.data?.message || "Error al cancelar");
        } finally {
            setLoadingCancel(false);
        }
    };

    // ---- WhatsApp helper ---------------------------------------------------
    const normalizePhoneForWhatsApp = (p?: string) => {
        if (!p) return null;
        const digits = String(p).replace(/\D/g, "");
        // basic sanity check
        if (digits.length < 7) return null;
        return digits; // wa.me expects country code + number without '+', e.g. 549351...
    };

    const buildWhatsAppMessage = (extra?: string) => {
        const name = userInfo?.name || "Paciente";
        const parts: string[] = [];
        parts.push(`Hola ${name}, te contacto desde el sistema de consultas.`);
        if (callUrl) parts.push(`Enlace de la videollamada: ${callUrl}`);
        if (r.metadata?.callUrl && !callUrl)
            parts.push(`Enlace de la videollamada: ${r.metadata.callUrl}`);
        if (scheduledAt) {
            const local = new Date(
                toIsoFromLocal(scheduledAt) || scheduledAt
            ).toLocaleString();
            parts.push(`Fecha y hora: ${local}`);
        } else if (r.metadata?.scheduledAt) {
            parts.push(
                `Fecha y hora: ${new Date(
                    r.metadata.scheduledAt
                ).toLocaleString()}`
            );
        }
        parts.push(`Código de la solicitud: ${r.token}`);
        if (extra) parts.push("", extra);
        parts.push("Saludos.");
        return parts.join("\n");
    };

    const handleSendWhatsApp = (ev?: React.MouseEvent) => {
        ev?.preventDefault();
        const phoneNormalized = normalizePhoneForWhatsApp(phone);
        if (!phoneNormalized) {
            alert("Teléfono inválido o no disponible para enviar WhatsApp.");
            return;
        }
        const message = buildWhatsAppMessage();
        const encoded = encodeURIComponent(message);
        const url = `https://wa.me/${phoneNormalized}?text=${encoded}`;
        window.open(url, "_blank");
    };
    // -----------------------------------------------------------------------

    // ----- Prescription: generate PDF and send as text via WhatsApp ----------
    const generatePrescriptionPdf = async () => {
        try {
            const { jsPDF } = await import("jspdf");
            const doc = new jsPDF({ unit: "pt", format: "a4" });
            const margin = 40;
            const pageWidth = doc.internal.pageSize.getWidth();

            doc.setFont("Helvetica", "normal");
            doc.setFontSize(14);
            doc.text("Receta veterinaria", pageWidth / 2, 60, { align: "center" });

            doc.setFontSize(11);
            const lines: string[] = [];
            lines.push(`Paciente: ${userInfo?.name || "Nombre paciente"}`);
            lines.push(`DNI / ID: ${userInfo?.dni || ""}`); // si existe
            lines.push(`Fecha: ${new Date().toLocaleDateString()}`);
            lines.push("");
            lines.push("Prescripción:");
            // split prescriptionText into lines
            const presLines = prescriptionText.split("\n");
            presLines.forEach((l) => lines.push(l));
            lines.push("");
            lines.push(`Veterinario: ${user?.name || "Dr./Dra. Nombre"}`);
            lines.push("Firma: ____________________________");

            // write lines with simple wrapping
            let y = 90;
            const lineHeight = 14;
            lines.forEach((ln) => {
                const wrapped = doc.splitTextToSize(ln, pageWidth - margin * 2);
                doc.text(wrapped, margin, y);
                y += wrapped.length * lineHeight;
                // add new page if necessary
                if (y > doc.internal.pageSize.getHeight() - 60) {
                    doc.addPage();
                    y = 60;
                }
            });

            // add small footer
            doc.setFontSize(9);
            doc.setTextColor(120);
            doc.text(
                "Este documento es un ejemplo de receta. Validar según normativa local.",
                margin,
                doc.internal.pageSize.getHeight() - 40
            );

            // trigger download
            const filename = `receta_${(userInfo?.name || "paciente").replace(
                /\s+/g,
                "_"
            )}.pdf`;
            doc.save(filename);
        } catch (err) {
            console.error("Error generando PDF:", err);
            alert(
                "No se pudo generar el PDF. Asegurate de tener jspdf instalado."
            );
        }
    };

    const handleSendPrescriptionWhatsApp = (ev?: React.MouseEvent) => {
        ev?.preventDefault();
        const phoneNormalized = normalizePhoneForWhatsApp(phone);
        if (!phoneNormalized) {
            alert("Teléfono inválido o no disponible para enviar WhatsApp.");
            return;
        }
        // For now we send prescription as text (WhatsApp does not accept file uploads via wa.me).
        // The PDF generation is available for download separately.
        const message = buildWhatsAppMessage(`Receta:\n\n${prescriptionText}`);
        const encoded = encodeURIComponent(message);
        const url = `https://wa.me/${phoneNormalized}?text=${encoded}`;
        window.open(url, "_blank");
    };
    // -----------------------------------------------------------------------

    // helper to get confirmer's display name
    const confirmerName = () => {
        const by = r.status_reply_by;
        if (!by) return null;
        if (typeof by === "string") return by; // fallback id or string
        if (typeof by === "object") return by.name || by.email || by._id;
        return String(by);
    };

    return (
        <div className="bg-white p-4 rounded shadow">
            <div className="flex justify-between items-start">
                <div>
                    <div className="font-medium">
                        {userInfo?.name || "Usuario Anónimo"}
                        {phone && (
                            <span className="ml-2 text-sm text-gray-500">
                                ({phone})
                            </span>
                        )}
                    </div>
                    <div className="text-xs text-gray-500">
                        {userInfo?.email}
                    </div>
                </div>

                <div className="text-sm text-gray-600">{createdAt}</div>
            </div>

            <div className="mt-2 text-sm text-gray-700">
                <div>
                    <strong>Tipo:</strong> {veterinariaActionTypeLabel(r.actionType)}
                </div>
                {r.notes && (
                    <div>
                        <strong>Observaciones:</strong> {r.notes}
                    </div>
                )}

                <div className="mt-2">
                    <strong>Código:</strong>{" "}
                    <span className="font-mono">{r.token}</span>{" "}
                    <span className="text-xs text-gray-500">
                        expira {expiresAt}
                    </span>
                </div>

                {/* Metadata display */}
                {r.metadata?.callUrl && (
                    <div className="mt-2">
                        <strong>Enlace:</strong>{" "}
                        <a
                            href={r.metadata.callUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-brand-600 underline"
                        >
                            {r.metadata.callUrl}
                        </a>
                        <button
                            onClick={() => {
                                navigator.clipboard?.writeText(
                                    r.metadata.callUrl
                                );
                                alert("Enlace copiado al portapapeles");
                            }}
                            className="ml-2 text-xs px-2 py-1 bg-gray-100 rounded"
                        >
                            Copiar
                        </button>
                    </div>
                )}
                {r.metadata?.scheduledAt && (
                    <div className="mt-1 text-sm text-gray-600">
                        <strong>Programado:</strong>{" "}
                        {new Date(r.metadata.scheduledAt).toLocaleString()}
                    </div>
                )}

                {/* Muestra confirmación por parte del paciente (si existe) */}
                {isPatientConfirmed && (
                    <div className="mt-3 p-3 bg-green-50 border rounded text-sm text-green-800">
                        <div className="font-medium inline-flex items-center gap-2">
                            <CheckIcon className="w-4 h-4" />
                            Confirmación del paciente
                        </div>
                        <div className="text-xs text-gray-700 mt-1">
                            {confirmerName()
                                ? `${confirmerName()}`
                                : "Paciente"}{" "}
                            {r.status_reply_at
                                ? `• ${new Date(
                                      r.status_reply_at
                                  ).toLocaleString()}`
                                : ""}
                        </div>
                    </div>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                    {r.status === "pending" &&
                        canAct &&
                        !isPatientConfirmed && (
                            <>
                                <button
                                    onClick={() =>
                                        setShowScheduleEditor((s) => !s)
                                    }
                                    className="px-3 py-1 bg-green-600 text-white rounded"
                                >
                                    Aceptar y programar
                                </button>

                                <button
                                    onClick={handleCancel}
                                    disabled={loadingCancel}
                                    className="px-3 py-1 bg-red-600 text-white rounded"
                                >
                                    {loadingCancel
                                        ? "Cancelando..."
                                        : "Cancelar"}
                                </button>
                            </>
                        )}

                    {r.status === "accepted" &&
                        canAct &&
                        !isPatientConfirmed && (
                            <>
                                <button
                                    onClick={handleMarkFulfilled}
                                    disabled={loadingFulfill}
                                    className="px-3 py-1 bg-brand-600 text-white rounded"
                                >
                                    {loadingFulfill
                                        ? "Guardando..."
                                        : "Marcar como cumplida"}
                                </button>

                                <button
                                    onClick={() =>
                                        setShowScheduleEditor((s) => !s)
                                    }
                                    className="px-3 py-1 bg-gray-100 rounded"
                                >
                                    {showScheduleEditor
                                        ? "Cerrar"
                                        : "Editar programación"}
                                </button>

                                <button
                                    onClick={handleCancel}
                                    disabled={loadingCancel}
                                    className="px-3 py-1 bg-red-600 text-white rounded"
                                >
                                    {loadingCancel
                                        ? "Cancelando..."
                                        : "Cancelar"}
                                </button>
                            </>
                        )}

                    {/* Mostrar estado */}
                    <div className="ml-auto text-sm px-2 py-1 border rounded text-gray-700">
                        Estado: <span className="font-medium">{r.status}</span>
                    </div>
                </div>

                {/* WhatsApp action + phone - siempre disponible */}
                <div className="mt-3 flex items-center gap-2">
                    {phone ? (
                        <>
                            <button
                                onClick={handleSendWhatsApp}
                                className="px-3 py-1 bg-green-500 text-white rounded"
                                title="Enviar mensaje por WhatsApp al usuario"
                            >
                                Enviar por WhatsApp
                            </button>

                            <a
                                href={`tel:${phone}`}
                                className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 text-sm"
                            >
                                Llamar / Enviar link ({phone})
                            </a>

                            {/* Receta: editor / enviar / PDF */}
                            <button
                                onClick={() =>
                                    setShowPrescriptionEditor((s) => !s)
                                }
                                className="px-3 py-1 bg-brand-600 text-white rounded"
                            >
                                {showPrescriptionEditor
                                    ? "Cerrar receta"
                                    : "Editar receta"}
                            </button>

                            <button
                                onClick={handleSendPrescriptionWhatsApp}
                                className="px-3 py-1 bg-emerald-600 text-white rounded"
                                title="Enviar receta por WhatsApp (texto)"
                            >
                                Enviar Receta por WhatsApp
                            </button>

                            <button
                                onClick={generatePrescriptionPdf}
                                className="px-3 py-1 bg-slate-700 text-white rounded"
                                title="Generar PDF de la receta"
                            >
                                Descargar Receta PDF
                            </button>
                        </>
                    ) : (
                        <span className="px-3 py-1 bg-gray-50 text-xs text-gray-400 rounded">
                            No hay teléfono
                        </span>
                    )}
                </div>

                {/* Prescription editor / preview */}
                {showPrescriptionEditor && canAct && (
                    <div className="mt-3 p-3 border rounded bg-gray-50 w-full">
                        <div className="mb-2 text-sm font-medium">
                            Editor de receta (ejemplo)
                        </div>
                        <textarea
                            value={prescriptionText}
                            onChange={(e) =>
                                setPrescriptionText(e.target.value)
                            }
                            className="w-full h-40 border rounded p-2 font-mono text-sm"
                        />

                        <div className="mt-2 flex gap-2">
                            <button
                                onClick={generatePrescriptionPdf}
                                className="px-3 py-1 bg-slate-700 text-white rounded"
                            >
                                Descargar PDF
                            </button>

                            <button
                                onClick={handleSendPrescriptionWhatsApp}
                                className="px-3 py-1 bg-emerald-600 text-white rounded"
                            >
                                Enviar por WhatsApp (texto)
                            </button>

                            <button
                                onClick={() => {
                                    setPrescriptionText(
                                        (s) => s + "\n\nObservaciones: "
                                    );
                                }}
                                className="px-3 py-1 bg-gray-100 rounded"
                            >
                                Añadir observaciones
                            </button>
                        </div>

                        <div className="mt-3 text-sm">
                            <strong>Vista previa:</strong>
                            <div className="mt-2 p-3 bg-white border rounded text-sm whitespace-pre-line">
                                {prescriptionText}
                            </div>
                        </div>
                    </div>
                )}

                {showScheduleEditor && canAct && !isPatientConfirmed && (
                    <div className="mt-3 p-3 border rounded bg-gray-50">
                        <div className="mb-2">
                            <label className="block text-sm font-medium">
                                Enlace videollamada
                            </label>
                            <input
                                type="text"
                                value={callUrl}
                                onChange={(e) => setCallUrl(e.target.value)}
                                className="mt-1 w-full border rounded px-3 py-2"
                                placeholder="https://meet.example/abc"
                            />
                        </div>

                        <div className="mb-2">
                            <label className="block text-sm font-medium">
                                Fecha y hora
                            </label>
                            <input
                                type="datetime-local"
                                value={scheduledAt}
                                onChange={(e) => setScheduledAt(e.target.value)}
                                className="mt-1 w-full border rounded px-3 py-2"
                            />
                        </div>

                        <div className="flex gap-2">
                            {r.status === "pending" ? (
                                <button
                                    onClick={handleAcceptWithSchedule}
                                    disabled={loadingAccept}
                                    className="px-3 py-1 bg-brand-600 text-white rounded"
                                >
                                    {loadingAccept
                                        ? "Guardando..."
                                        : "Aceptar y enviar"}
                                </button>
                            ) : (
                                <button
                                    onClick={handleUpdateMetadata}
                                    disabled={loadingMetadataUpdate}
                                    className="px-3 py-1 bg-brand-600 text-white rounded"
                                >
                                    {loadingMetadataUpdate
                                        ? "Guardando..."
                                        : "Actualizar"}
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => {
                                    setShowScheduleEditor(false);
                                    setCallUrl(r.metadata?.callUrl ?? "");
                                    setScheduledAt(
                                        r.metadata?.scheduledAt
                                            ? toDateTimeLocal(
                                                  r.metadata.scheduledAt
                                              )
                                            : ""
                                    );
                                }}
                                className="px-3 py-1 bg-gray-300 rounded"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RequestRow;
