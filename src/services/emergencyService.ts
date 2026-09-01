import api from "./api";
import type { BackendResponse } from "../types/user";
import type { BackendEmergency } from "../types/emergency";

export const emergencyService = {
    async getNearbyEmergencies(
        latitude: number,
        longitude: number,
        radius: number = 5000
    ): Promise<BackendEmergency[]> {
        const response = await api.get<BackendResponse<BackendEmergency[]>>(
            "/emergencies/nearby",
            {
                params: { latitude, longitude, radius },
            }
        );
        return response.data.data;
    },

    async getAllEmergencies(): Promise<BackendEmergency[]> {
        const response = await api.get<BackendResponse<BackendEmergency[]>>(
            "/emergencies"
        );
        return response.data.data;
    },

    async getEmergencyById(id: string): Promise<BackendEmergency> {
        const response = await api.get<BackendResponse<BackendEmergency>>(
            `/emergencies/${id}`
        );
        return response.data.data;
    },

    // alias
    async getById(id: string): Promise<BackendEmergency> {
        return emergencyService.getEmergencyById(id);
    },

    // update entity
    async update(id: string, payload: Partial<any>): Promise<any> {
        const response = await api.put<BackendResponse<any>>(
            `/emergencies/${id}`,
            payload
        );
        return response.data;
    },
};

export default emergencyService;