import api from "./api";
import type { LoginRequest, AuthResponse, User } from "../types/user";
import type { AxiosResponse } from "axios";

export const authService = {
    async login(credentials: LoginRequest): Promise<AuthResponse> {
        const response = await api.post("/auth/login", credentials);
        // response.data could be { success, message, data: { token, user } }
        // keep returning the data block (if present) for the caller
        return response.data?.data ?? response.data;
    },

    // register ahora acepta cualquier payload y devuelve la respuesta completa del backend
    async register(data: any): Promise<any> {
        const response = await api.post("/auth/register", data);
        // Devuelve la respuesta tal cual viene para que el caller use message, data.user, etc.
        return response.data;
    },

    async getProfile(): Promise<User | any> {
        const response = await api.get("/auth/profile");
        // Puede venir en distintos shapes: data.user, data, user, etc.
        return (
            response.data?.data?.user ?? response.data?.data ?? response.data
        );
    },

    async updateProfile(payload: Partial<User>) {
        const res = await api.put("/auth/profile", payload);
        const user =
            res?.data?.data?.user ?? res?.data?.user ?? res?.data ?? res;
        return user;
    },

    async resendVerification(email: string) {
        const res: AxiosResponse<any> = await api.post(
            "/auth/resend-verification",
            { email }
        );
        return res.data;
    },

    async verifyEmail(token: string) {
        const res: AxiosResponse<any> = await api.get(
            `/auth/verify-email/${encodeURIComponent(token)}`
        );
        return res.data;
    },

    logout() {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
    },
};

export default authService;
