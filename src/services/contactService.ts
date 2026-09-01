import api from "./api";
import type { AxiosResponse } from "axios";

const contactService = {
    async createEnterpriseLead(payload: any) {
        const res: AxiosResponse<any> = await api.post(
            "/contacts/enterprise",
            payload
        );
        return res.data;
    },

    // NUEVO: endpoint genérico de leads (p. ej. POST /leads)
    createLead: async (payload: any) => {
        const res: AxiosResponse<any> = await api.post("/contacts", payload);
        return res.data;
    },
    // baseURL already includes /api
    async getEnterpriseLeads(params?: { limit?: number }) {
        const res: AxiosResponse<any> = await api.get("/admin/leads", {
            params,
        });
        return res.data;
    },
};

export default contactService;
