export interface Doctor {
    id: string;
    nombre: string;
    direccion: string;
    ciudad: string;
    provincia: string;
    codigoPostal?: string;
    telefono?: string;
    latitud: number;
    longitud: number;
    horario?: string;
    distancia?: number;
    beneficios?: string;
    descuento?: number;
    url?: string;
    especialidad: string;
}

// Backend doctor response structure
export interface BackendDoctor {
  id: string;
  name: string;
  address: string;
  phone?: string;
  city?: string;
  province?: string;
  coordinates?: {
    latitude?: number;
    longitude?: number;
  };
  openingHours?: string;
  distance?: number;
  benefits?: string;
  discount?: number;
    url?: string;
    specialty: string;
}
