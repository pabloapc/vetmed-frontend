export type AuditStatus =
    | "pending"
    | "in_review"
    | "validated"
    | "rejected"
    | "requires_more";

export type CaseStatus = "active" | "closed" | "appealed" | "cancelled";

export interface MedicalAuditDiagnosis {
    description: string;
    startDate: string;
    endDate: string;
    summary?: string;
    restDays?: number;
    symptoms?: string;
    observations?: string;
}

export interface MedicalAuditDocument {
    _id?: string;
    name?: string;
    type?: string;
    url: string;
    uploadedAt?: string;
    notes?: string;
}

export interface MedicalAuditTrackingEvent {
    _id?: string;
    eventType?: string;
    location: {
        lat: number;
        lng: number;
        accuracy?: number;
    };
    notes?: string;
    createdAt?: string;
}

export interface MedicalAuditContactLog {
    _id?: string;
    channel?: string;
    notes?: string;
    by?: string;
    contactedBy?: string;
    createdAt?: string;
    contactedAt?: string;
}

export interface MedicalAuditValidationResult {
    score?: number;
    flags?: string[];
    suggestedStatus?: AuditStatus;
    autoApproved?: boolean;
    notes?: string;
    rejectionReason?: string | null;
    validatedAt?: string;
    validatedBy?: string;
}

export interface MedicalAuditEmployee {
    _id?: string;
    name?: string;
    email?: string;
}

export interface MedicalAudit {
    _id: string;
    employee?: string | MedicalAuditEmployee;
    diagnosis: MedicalAuditDiagnosis;
    documents?: MedicalAuditDocument[];
    tracking?: MedicalAuditTrackingEvent[];
    contactLog?: MedicalAuditContactLog[];
    auditStatus: AuditStatus;
    caseStatus: CaseStatus;
    validation?: MedicalAuditValidationResult;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateMedicalAuditPayload {
    diagnosis: MedicalAuditDiagnosis;
    documents?: MedicalAuditDocument[];
    auditStatus?: AuditStatus;
    status?: CaseStatus;
}

export interface AddMedicalAuditDocumentPayload {
    name?: string;
    type?: string;
    url: string;
    notes?: string;
}

export interface AddMedicalAuditTrackingPayload {
    eventType: string;
    lat: number;
    lng: number;
    accuracy?: number;
    notes?: string;
}

export interface RegisterAuditContactPayload {
    channel: string;
    notes?: string;
}

export interface UpdateMedicalAuditAdminPayload {
    status: AuditStatus;
    notes?: string;
}

export interface CloseMedicalAuditPayload {
    reason?: string;
}
