import api from "./api";
import type { AxiosResponse } from "axios";

const base = "/admin";

export const adminService = {
    async listUsers(params?: { page?: number; limit?: number; q?: string }) {
        const res: AxiosResponse<any> = await api.get(`${base}/users`, {
            params,
        });
        return res.data;
    },
    async getUser(id: string) {
        const res: AxiosResponse<any> = await api.get(`${base}/users/${id}`);
        return res.data;
    },
    async updateUser(id: string, payload: any) {
        const res: AxiosResponse<any> = await api.put(
            `${base}/users/${id}`,
            payload
        );
        return res.data;
    },
    async deleteUser(id: string) {
        const res: AxiosResponse<any> = await api.delete(`${base}/users/${id}`);
        return res.data;
    },
    async createUser(payload: any) {
        const res: AxiosResponse<any> = await api.post(
            `${base}/users`,
            payload
        );
        return res.data;
    },

    // Pharmacies
    async listPharmacies(params?: {
        page?: number;
        limit?: number;
        q?: string;
        unassigned?: boolean;
    }) {
        const res = await api.get(`${base}/pharmacies`, { params });
        return res.data;
    },
    async getPharmacy(id: string) {
        const res = await api.get(`${base}/pharmacies/${id}`);
        return res.data;
    },
    async updatePharmacy(id: string, payload: any) {
        const res = await api.put(`${base}/pharmacies/${id}`, payload);
        return res.data;
    },
    async uploadPharmacyVademecumFile(id: string, file: File) {
        const formData = new FormData();
        formData.append("vademecumFile", file);
        
        const res = await api.patch(`${base}/pharmacies/${id}/vademecum`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return res.data;
    },
    async deletePharmacy(id: string) {
        const res = await api.delete(`${base}/pharmacies/${id}`);
        return res.data;
    },
    async createPharmacy(payload: any) {
        const res = await api.post(`${base}/pharmacies`, payload);
        return res.data;
    },

    // Doctors
    async listDoctors(params?: {
        page?: number;
        limit?: number;
        q?: string;
        unassigned?: boolean;
    }) {
        const res = await api.get(`${base}/doctors`, { params });
        return res.data;
    },
    async getDoctor(id: string) {
        const res = await api.get(`${base}/doctors/${id}`);
        return res.data;
    },
    async updateDoctor(id: string, payload: any) {
        const res = await api.put(`${base}/doctors/${id}`, payload);
        return res.data;
    },
    async deleteDoctor(id: string) {
        const res = await api.delete(`${base}/doctors/${id}`);
        return res.data;
    },
    async createDoctor(payload: any) {
        const res = await api.post(`${base}/doctors`, payload);
        return res.data;
    },

    // Emergencies (new)
    async listEmergencies(params?: {
        page?: number;
        limit?: number;
        q?: string;
        unassigned?: boolean;
    }) {
        const res = await api.get(`${base}/emergencies`, { params });
        return res.data;
    },
    async getEmergency(id: string) {
        const res = await api.get(`${base}/emergencies/${id}`);
        return res.data;
    },
    async updateEmergency(id: string, payload: any) {
        const res = await api.put(`${base}/emergencies/${id}`, payload);
        return res.data;
    },
    async deleteEmergency(id: string) {
        const res = await api.delete(`${base}/emergencies/${id}`);
        return res.data;
    },
    async createEmergency(payload: any) {
        const res = await api.post(`${base}/emergencies`, payload);
        return res.data;
    },

    async getDashboardMetrics(params?: { days?: number }) {
        const res = await api.get(`${base}/dashboard/metrics`, { params });
        return res.data;
    },

    async listRequests(params?: {
        page?: number;
        limit?: number;
        q?: string;
        targetType?: "pharmacy" | "doctor" | "emergency";
        status?: "pending" | "accepted" | "fulfilled" | "cancelled";
    }) {
        const res = await api.get(`/requests`, { params });
        return res.data;
    },

    // Leads
    // Leads
    async listLeads(params?: { page?: number; limit?: number; q?: string }) {
        const res = await api.get(`${base}/leads`, { params });
        return res.data;
    },
    async getLead(id: string) {
        const res = await api.get(`${base}/leads/${id}`);
        return res.data;
    },
    async updateLead(id: string, payload: any) {
        const res = await api.put(`${base}/leads/${id}`, payload);
        return res.data;
    },
    async deleteLead(id: string) {
        const res = await api.delete(`${base}/leads/${id}`);
        return res.data;
    },

    // Medical audits
    async listAudits(params?: {
        page?: number;
        limit?: number;
        q?: string;
        status?: string;
        caseStatus?: string;
    }) {
        const res = await api.get(`${base}/audits`, { params });
        return res.data;
    },
    async validateAudit(
        id: string,
        payload: {
            status: "pending" | "in_review" | "validated" | "rejected" | "requires_more";
            notes?: string;
        }
    ) {
        const mappedStatus =
            payload.status === "requires_more"
                ? "requires_more"
                : payload.status;

        // Compat: algunos backends esperan `auditStatus` en vez de `status`.
        const requestBody = {
            ...payload,
            status: mappedStatus,
            auditStatus: mappedStatus,
        };

        const res = await api.patch(
            `${base}/audits/${id}/validate`,
            requestBody
        );
        return res.data;
    },
    async closeAudit(id: string, payload?: { reason?: string }) {
        const res = await api.patch(`${base}/audits/${id}/close`, payload ?? {});
        return res.data;
    },
    async registerAuditContact(
        id: string,
        payload: { channel: string; notes?: string }
    ) {
        const res = await api.post(`/audits/${id}/contact`, payload);
        return res.data;
    },
    async getAuditById(id: string) {
        const res = await api.get(`/audits/${id}`);
        return res.data;
    },

    // --- Insurers (public listing for registration/profile) ---
    async listInsurers(params?: {
        page?: number;
        limit?: number;
        q?: string;
        category?: string;
    }) {
        const res = await api.get(`/coverage/insurers`, { params });
        return res.data;
    },
    async getInsurer(id: string) {
        const res = await api.get(`/coverage/insurers/${id}`);
        return res.data;
    },

    // --- Plans (public listing for registration/profile) ---
    async listPlans(params?: {
        page?: number;
        limit?: number;
        q?: string;
        insurerId?: string;
    }) {
        const res = await api.get(`/coverage/plans`, { params });
        return res.data;
    },
    async getPlan(id: string) {
        const res = await api.get(`/coverage/plans/${id}`);
        return res.data;
    },

    // --- Plan coverages (public listing for institution detail) ---
    async listPlanCoverages(params?: {
        page?: number;
        limit?: number;
        q?: string;
        insurerId?: string;
        planId?: string;
    }) {
        try {
            const res = await api.get(`/coverage/plan-coverages`, { params });
            return res.data;
        } catch {
            const res = await api.get(`/plan-coverages`, { params });
            return res.data;
        }
    },

    // --- Admin: Plan Coverages ---
    async listPlanCoveragesAdmin(params?: {
        page?: number;
        limit?: number;
        q?: string;
        insurerId?: string;
        planId?: string;
        prestationId?: string;
    }) {
        const res = await api.get(`${base}/plan-coverages`, { params });
        return res.data;
    },
    async createPlanCoverageAdmin(payload: any) {
        const res = await api.post(`${base}/plan-coverages`, payload);
        return res.data;
    },
    async updatePlanCoverageAdmin(id: string, payload: any) {
        const res = await api.put(`${base}/plan-coverages/${id}`, payload);
        return res.data;
    },
    async deletePlanCoverageAdmin(id: string) {
        const res = await api.delete(`${base}/plan-coverages/${id}`);
        return res.data;
    },

    // --- Prestaciones (Prestacion) ---
    /**
     * Admin: listar prestaciones (paginado)
     * GET /api/admin/prestations
     */
    async listPrestations(params?: {
        page?: number;
        limit?: number;
        q?: string;
    }) {
        const res = await api.get(`${base}/prestations`, { params });
        return res.data;
    },
    /**
     * Admin: obtener una prestacion
     */
    async getPrestation(id: string) {
        const res = await api.get(`${base}/prestations/${id}`);
        return res.data;
    },
    /**
     * Admin: crear prestacion
     */
    async createPrestation(payload: any) {
        const res = await api.post(`${base}/prestations`, payload);
        return res.data;
    },
    /**
     * Admin: actualizar prestacion
     */
    async updatePrestation(id: string, payload: any) {
        const res = await api.put(`${base}/prestations/${id}`, payload);
        return res.data;
    },
    /**
     * Admin: eliminar prestacion
     */
    async deletePrestation(id: string) {
        const res = await api.delete(`${base}/prestations/${id}`);
        return res.data;
    },

    // --- Public Prestations (fallback if admin endpoints not available to frontend) ---
    /**
     * Public: listar prestaciones (no admin)
     * GET /api/prestations
     */
    async listPrestationsPublic(params?: {
        page?: number;
        limit?: number;
        q?: string;
    }) {
        const res = await api.get(`/prestations`, { params });
        return res.data;
    },
    /**
     * Public: obtener una prestacion
     */
    async getPrestationPublic(id: string) {
        const res = await api.get(`/prestations/${id}`);
        return res.data;
    },

    async listInsurersAdmin(params?: {
        page?: number;
        limit?: number;
        q?: string;
        category?: string;
    }) {
        const res: AxiosResponse<any> = await api.get(`${base}/insurers`, {
            params,
        });
        return res.data;
    },
    async getInsurerAdmin(id: string) {
        const res: AxiosResponse<any> = await api.get(
            `${base}/insurers/${id}`
        );
        return res.data;
    },
    async createInsurerAdmin(payload: any) {
        const res: AxiosResponse<any> = await api.post(
            `${base}/insurers`,
            payload
        );
        return res.data;
    },
    async updateInsurerAdmin(id: string, payload: any) {
        const res: AxiosResponse<any> = await api.put(
            `${base}/insurers/${id}`,
            payload
        );
        return res.data;
    },
    async deleteInsurerAdmin(id: string) {
        const res: AxiosResponse<any> = await api.delete(
            `${base}/insurers/${id}`
        );
        return res.data;
    },

    // --- Admin: Plans ---
    async listPlansAdmin(params?: {
        page?: number;
        limit?: number;
        q?: string;
        insurerId?: string;
    }) {
        const res: AxiosResponse<any> = await api.get(`${base}/plans`, {
            params,
        });
        return res.data;
    },
    async getPlanAdmin(id: string) {
        const res: AxiosResponse<any> = await api.get(`${base}/plans/${id}`);
        return res.data;
    },
    async createPlanAdmin(payload: any) {
        const res: AxiosResponse<any> = await api.post(`${base}/plans`, payload);
        return res.data;
    },
    async updatePlanAdmin(id: string, payload: any) {
        const res: AxiosResponse<any> = await api.put(
            `${base}/plans/${id}`,
            payload
        );
        return res.data;
    },
    async deletePlanAdmin(id: string) {
        const res: AxiosResponse<any> = await api.delete(`${base}/plans/${id}`);
        return res.data;
    },
};

export default adminService;
