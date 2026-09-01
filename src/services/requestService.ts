import api from "./api";
import type { AxiosResponse } from "axios";

function getAuthHeader() {
    try {
        const token = localStorage.getItem("token");
        return token ? { Authorization: `Bearer ${token}` } : {};
    } catch {
        return {};
    }
}

export const requestService = {
    createRequest: async (payload: {
        pharmacyId: string;
        actionType: string;
        notes?: string;
        userSnapshot?: { name?: string; email?: string; telefono?: string };
        token?: string;
    }) => {
        const headers = {
            "Content-Type": "application/json",
            ...getAuthHeader(),
        };
        const res: AxiosResponse<any> = await api.post("/requests", payload, {
            headers,
        });
        return res.data;
    },

    getRequestsForPharmacy: async () => {
        const headers = { ...getAuthHeader() };
        const res = await api.get("/requests/pharmacy", { headers });
        return res.data;
    },

    getRequestsForDoctor: async () => {
        const headers = { ...getAuthHeader() };
        const res = await api.get("/requests/doctor", { headers });
        return res.data;
    },

    getUserRequests: async () => {
        const headers = { ...getAuthHeader() };
        const res = await api.get("/requests/user", { headers });
        return res.data;
    },

    getRequestById: async (id: string) => {
        const headers = { ...getAuthHeader() };
        const res = await api.get(`/requests/${id}`, { headers });
        return res.data;
    },

    // updateRequestStatus: async (id: string, status: string) => {
    //     const headers = { ...getAuthHeader() };
    //     const res = await api.put(
    //         `/requests/${id}/status`,
    //         { status },
    //         { headers }
    //     );
    //     return res.data;
    // },
    updateRequestStatus: async (
        id: string,
        status: string,
        metadata?: { callUrl?: string; scheduledAt?: string | null }
    ) => {
        const payload: any = { status };
        if (metadata) payload.metadata = metadata;
        const res = await api.put(`/requests/${id}/status`, payload);
        return res.data;
    },

    async confirmRequest(id: string) {
        const res: AxiosResponse<any> = await api.put(`/requests/${id}/reply`);
        return res.data;
    },
    // Nuevo: obtener solicitudes dirigidas a emergencias
    getRequestsForEmergency: async () => {
        const headers = { ...getAuthHeader() };
        const res = await api.get("/requests/emergency", { headers });
        return res.data;
    },
    
};

export default requestService;
