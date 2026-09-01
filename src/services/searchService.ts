import api from "./api";
import type { AxiosResponse } from "axios";

const searchService = {
    // suggestions: GET /api/search?q=...&limit=...
    async getSuggestions(q: string, opts?: { type?: string; limit?: number }) {
        const params: any = { q };
        if (opts?.type) params.type = opts.type;
        if (opts?.limit) params.limit = opts.limit;
        const res: AxiosResponse<any> = await api.get("/search", {
            params,
        });
        return res.data;
    },

    // full search: GET /api/search?q=...&full=true
    async search(q: string, opts?: { type?: string }) {
        const params: any = { q, full: true };
        if (opts?.type) params.type = opts.type;
        const res: AxiosResponse<any> = await api.get("/search", {
            params,
        });
        return res.data;
    },
};

export default searchService;
