import api from "./api";
import type { BackendResponse } from "../types/user";
import type { BackendDoctor } from "../types/doctor";

export const doctorService = {
    async getNearbyDoctors(
        latitude: number,
        longitude: number,
        radius: number = 5000
    ): Promise<BackendDoctor[]> {
        const response = await api.get<BackendResponse<BackendDoctor[]>>(
            "/doctors/nearby",
            {
                params: { latitude, longitude, radius },
            }
        );
        return response.data.data;
    },

    async getAllDoctors(): Promise<BackendDoctor[]> {
        const response = await api.get<BackendResponse<BackendDoctor[]>>(
            "/doctors"
        );
        return response.data.data;
    },

    async getDoctorById(id: string): Promise<BackendDoctor> {
        const response = await api.get<BackendResponse<BackendDoctor>>(
            `/doctors/${id}`
        );
        return response.data.data;
    },

    // alias
    async getById(id: string): Promise<BackendDoctor> {
        return doctorService.getDoctorById(id);
    },

    // update entity
    async update(id: string, payload: Partial<any>): Promise<any> {
        const response = await api.put<BackendResponse<any>>(
            `/doctors/${id}`,
            payload
        );
        return response.data;
    },
};

export default doctorService;
