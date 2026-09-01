export interface Emergency {
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
    url?: string;
}

// Backend emergency response structure
export interface BackendEmergency {
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
  distance?: number;
    url?: string;

}
