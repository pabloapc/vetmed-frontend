export interface User {
    id: string;
    email: string;
    name: string;
    isVerified?: boolean;
    telefono?: string;
    direccion?: string;
    ciudad?: string;
    provincia?: string;
    codigoPostal?: string;
    location?: {
        type: string;
        coordinates: [number, number]; // [longitude, latitude] in GeoJSON format
    };
    role?: "user" | "pharmacy" | "doctor" | "emergency" | "admin" | null;
    insurerId?: string | null;
    planId?: string | null;
    entityId?: string | null;
}

// Backend user response with location structure
export interface BackendUser {
  id: string;
  email: string;
  name: string;
  isVerified?: boolean;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  location?: {
    type: string;
    coordinates: [number, number];
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  provincia?: string;
  codigoPostal?: string;
  role?: "user" | "pharmacy" | "doctor" | "emergency" | "admin" | null;
  insurerId?: string | null;
  planId?: string | null;
  entityId?: string | null;
}

export interface AuthResponse {
  token: string;
  user: User;
  message: string;
  data: any;
}

export interface BackendResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
