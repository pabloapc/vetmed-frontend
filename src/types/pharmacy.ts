export interface Pharmacy {
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
}

export interface VademecumItem {
  droga: string;
  marca: string;
  presentacion: string;
  laboratorio: string;
  cobertura: string;
  precio: number;
}

// Backend pharmacy response structure
export interface BackendPharmacy {
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
}
