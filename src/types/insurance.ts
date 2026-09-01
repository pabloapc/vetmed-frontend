export interface InsuranceProduct {
    id: string;
    title: string;
    description: string;
    features: string[];
    badge?: string;
    label?: string;
    infoPath?: string;
    isActive?: boolean;
}

export interface InsuranceProductsResponseMeta {
    total?: number;
    page?: number;
    limit?: number;
}

export interface InsuranceProductsResult {
    products: InsuranceProduct[];
    meta?: InsuranceProductsResponseMeta | null;
    source: "api" | "fallback";
}
