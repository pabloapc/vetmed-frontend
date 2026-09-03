import type { ComponentType, SVGProps } from "react";
import { BuildingOffice2Icon, VideoCameraIcon } from "@heroicons/react/24/outline";

export type VeterinariaActionType = "consulta_medica" | "video_llamada";

export const VETERINARIA_ACTION_TYPES: {
    value: VeterinariaActionType;
    label: string;
    Icon: ComponentType<SVGProps<SVGSVGElement>>;
}[] = [
    { value: "consulta_medica", label: "Asistencia presencial", Icon: BuildingOffice2Icon },
    { value: "video_llamada", label: "Videollamada", Icon: VideoCameraIcon },
];

export function veterinariaActionTypeLabel(value?: string): string {
    if (!value) return "";
    const found = VETERINARIA_ACTION_TYPES.find((a) => a.value === value);
    if (found) return found.label;
    return String(value)
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
}
