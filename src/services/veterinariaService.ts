import api from "./api";
import type { BackendVeterinaria } from "../types/veterinaria";
import type { BackendResponse } from "../types/user";

export const veterinariaService = {
    async getNearbyVeterinarias(
        latitude: number,
        longitude: number,
        radius: number = 5000
    ): Promise<BackendVeterinaria[]> {
        const response = await api.get<BackendResponse<BackendVeterinaria[]>>(
            "/veterinarias/nearby",
            {
                params: { latitude, longitude, radius },
            }
        );
        return response.data.data;
    },

    async getAllVeterinarias(): Promise<BackendVeterinaria[]> {
        const response = await api.get<BackendResponse<BackendVeterinaria[]>>(
            "/veterinarias"
        );
        return response.data.data;
    },

    async getVeterinariaById(id: string): Promise<BackendVeterinaria> {
        const response = await api.get<BackendResponse<any>>(
            `/veterinarias/${id}`
        );
        const raw = response.data.data;
        return raw?.veterinaria ?? raw;
    },

    // alias para compatibilidad con getById used in Profile
    async getById(id: string): Promise<BackendVeterinaria> {
        return veterinariaService.getVeterinariaById(id);
    },

    // update entity (owner/admin only)
    async update(id: string, payload: Partial<any>): Promise<any> {
        const response = await api.put<BackendResponse<any>>(
            `/veterinarias/${id}`,
            payload
        );
        return response.data;
    },

    // optional: create, delete etc. if needed
};

export default veterinariaService;
