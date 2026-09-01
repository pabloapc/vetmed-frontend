import type { AxiosResponse } from "axios";
import api from "./api";
import type {
    AddMedicalAuditDocumentPayload,
    AddMedicalAuditTrackingPayload,
    CloseMedicalAuditPayload,
    CreateMedicalAuditPayload,
    RegisterAuditContactPayload,
    UpdateMedicalAuditAdminPayload,
} from "../types/medicalAudit";

export const medicalAuditService = {
    async createAudit(payload: CreateMedicalAuditPayload) {
        const res: AxiosResponse<any> = await api.post("/audits", payload);
        return res.data;
    },

    async getMyAudits(params?: {
        page?: number;
        limit?: number;
        status?: string;
        caseStatus?: string;
    }) {
        const res: AxiosResponse<any> = await api.get("/audits/my", {
            params,
        });
        return res.data;
    },

    async getAuditById(id: string) {
        const res: AxiosResponse<any> = await api.get(`/audits/${id}`);
        return res.data;
    },

    async addDocuments(id: string, payload: AddMedicalAuditDocumentPayload[]) {
        const res: AxiosResponse<any> = await api.post(
            `/audits/${id}/documents`,
            { documents: payload }
        );
        return res.data;
    },

    async addTrackingEvent(id: string, payload: AddMedicalAuditTrackingPayload) {
        const res: AxiosResponse<any> = await api.post(
            `/audits/${id}/tracking`,
            payload
        );
        return res.data;
    },

    async registerContact(id: string, payload: RegisterAuditContactPayload) {
        const res: AxiosResponse<any> = await api.post(
            `/audits/${id}/contact`,
            payload
        );
        return res.data;
    },

    async listAdminAudits(params?: {
        page?: number;
        limit?: number;
        status?: string;
        caseStatus?: string;
        q?: string;
    }) {
        const res: AxiosResponse<any> = await api.get("/admin/audits", {
            params,
        });
        return res.data;
    },

    async validateAdminAudit(
        id: string,
        payload: UpdateMedicalAuditAdminPayload
    ) {
        const requestBody = {
            ...payload,
            status: payload.status,
            auditStatus: payload.status,
        };
        const res: AxiosResponse<any> = await api.patch(
            `/admin/audits/${id}/validate`,
            requestBody
        );
        return res.data;
    },

    async closeAdminAudit(id: string, payload?: CloseMedicalAuditPayload) {
        const res: AxiosResponse<any> = await api.patch(
            `/admin/audits/${id}/close`,
            payload ?? {}
        );
        return res.data;
    },
};

export default medicalAuditService;
