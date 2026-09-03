export interface Veterinaria {
  id: string;
  nombre: string;
  direccion: string;
  ciudad: string;
  provincia: string;
  codigoPostal?: string;
  telefono?: string;
  latitud: number;
  longitud: number;
  horarioApertura?: string;
  horarioCierre?: string;
  distancia?: number;
  beneficios?: string;
  descuento?: number;
  vademecum?: VademecumItem | VademecumItem[];
  vademecumFileUrl?: string;
  vademecumFileName?: string;
  /** true once a user account (role "veterinaria") is linked to this entity — otherwise it's just an indexed listing */
  isClaimed?: boolean;
}

export interface VademecumItem {
  droga: string;
  marca: string;
  presentacion: string;
  laboratorio: string;
  cobertura: string;
  precio: number;
}

// Backend veterinaria response structure
export interface BackendVeterinaria {
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
  vademecum?: VademecumItem | VademecumItem[];
  vademecumFileUrl?: string;
  vademecumFileName?: string;
  isClaimed?: boolean;
}
