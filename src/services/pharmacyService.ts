import api from "./api";
import type { BackendPharmacy } from "../types/pharmacy";
import type { BackendResponse } from "../types/user";

export const pharmacyService = {
    async getNearbyPharmacies(
        latitude: number,
        longitude: number,
        radius: number = 5000
    ): Promise<BackendPharmacy[]> {
        const response = await api.get<BackendResponse<BackendPharmacy[]>>(
            "/pharmacies/nearby",
            {
                params: { latitude, longitude, radius },
            }
        );
        return response.data.data;
    },

    async getAllPharmacies(): Promise<BackendPharmacy[]> {
        const response = await api.get<BackendResponse<BackendPharmacy[]>>(
            "/pharmacies"
        );
        return response.data.data;
    },

    async getPharmacyById(id: string): Promise<BackendPharmacy> {
        const response = await api.get<BackendResponse<BackendPharmacy>>(
            `/pharmacies/${id}`
        );
        return response.data.data;
    },

    // alias para compatibilidad con getById used in Profile
    async getById(id: string): Promise<BackendPharmacy> {
        return pharmacyService.getPharmacyById(id);
    },

    // update entity (owner/admin only)
    async update(id: string, payload: Partial<any>): Promise<any> {
        const response = await api.put<BackendResponse<any>>(
            `/pharmacies/${id}`,
            payload
        );
        return response.data;
    },

    // optional: create, delete etc. if needed
};

export default pharmacyService;
