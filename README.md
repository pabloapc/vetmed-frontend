# Vetfind Frontend

Frontend web de Vetfind.  
Plataforma React/TypeScript para registro, acceso, gestión y administración de usuarios, veterinarias, emergencias, obras sociales y prestaciones médicas.

El sistema cuenta con el registro de usuarios para que puedan acceder a Veterinarias (por ubicación lat/longitud, incluyendo videollamada) y urgencias médicas. Todos estos módulos generan una solicitud (generando un token) a los usuarios registrados con roles de veterinaria o emergencias, ya que tienen su propio perfil en donde visualizan los pedidos o solicitudes que pueden confirmar. El usuario `role:user` (consumidor/cliente) confirma esta solicitud cuando el servicio o producto fue recibido. También se cuenta con un usuario ADMIN que puede visualizar todos los movimientos de todos los perfiles.

**Roles disponibles:**

| Rol | Descripción |
|---|---|
| `user` | Usuario consumidor/cliente |
| `veterinaria` | Veterinaria registrada (incluye videollamada) |
| `emergency` | Servicio de urgencias |
| `admin` | Administrador global |

---

## 🆕 Últimos cambios (abril 2026)

### Obras Sociales y Prepagas (`InsurersSection` + `InsurerDetail`)
- Nueva sección pública en Home listando obras sociales y prepagas asociadas a Vetfind con búsqueda y paginación.
- Cards interactivas con navegación directa a `/insurers/:id` vía teclado y click.
- Página de detalle `/insurers/:id` con jerarquía completa: Institución → Planes → Coberturas/Ofertas vinculadas.
- Integración real con endpoints `/coverage/insurers`, `/coverage/plans` y `/coverage/plan-coverages` con fallback gracioso.
- Grilla de 3 columnas con variaciones visuales por posición usando CSS `nth-child` (tono verde, azul y naranja por cada tarjeta).
- Formateo de coberturas a texto legible: `"Cobertura 80% · Copago 1200 ARS · Requiere autorización"`.
- Cadena de fallback: ofertas vinculadas → campos embebidos del plan → estado vacío.

### Menú de acceso rápido — `BottomNavMenu`
- Nuevo componente fijo en la parte inferior estilo billetera virtual (Mercado Pago, PayPal).
- Visible únicamente para usuarios autenticados (`isAuthenticated`).
- 3 accesos: **Home** (`/welcome`), **Veterinaria** (`/veterinarias`), **Chat** (WhatsApp directo).
- Botón WhatsApp abre conversación pregenerada con número de soporte Vetfind.
- Animaciones con Framer Motion (entrada y tap feedback).

**Responsive del BottomNavMenu:**
- Etiquetas "Home" y "Chat" se ocultan por debajo de 480px; solo quedan íconos.
- Disponible en: `/welcome`, `/veterinarias`.

### UX Mobile — Cards de Veterinarias
- Badge principal (descuento o beneficio) movido al header superior derecho para visibilidad instantánea.
- Padding reducido en mobile para mostrar más resultados en el FCP.
- Reemplazado el botón único "Ver detalles y solicitar" por **dos botones táctiles en mobile**:
  - `Detalle` con ícono `InformationCircleIcon` — muestra/oculta la sección expandible.
  - `Solicitar` — abre la sección y hace scroll automático al formulario. Incluye la opción de solicitar videollamada.
- En desktop se mantiene el botón único original.

### Navbar — ajustes responsive
- Etiquetas de texto **Inicio**, **Solicitudes** y **Cerrar** en la barra de escritorio se ocultan por debajo de 1020px.
- Íconos siempre visibles para mantener la funcionalidad.
- Corregido bug: atributos SVG en kebab-case (`stroke-width`, `stroke-linecap`, `stroke-linejoin`) convertidos a camelCase JSX en el ícono de ambulancia del Navbar.

### Otros
- `InsurancePlans` desactivado temporalmente (comentado en Home) — no es prioridad en este ciclo.
- Home pública sin `BottomNavMenu` (solo accesible post-login).
- Footer con `pb-28` en páginas que usan `BottomNavMenu` para evitar solapamiento de contenido.


const veterinariaSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Por favor ingrese el nombre de la veterinaria'],
    trim: true
  },
  address: {
    type: String,
    required: [true, 'Por favor ingrese la dirección']
  },
  phone: {
    type: String,
    trim: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: [true, 'Por favor ingrese las coordenadas']
    }
  },
  benefits: {
    type: String,
    required: [true, 'Por favor ingrese los beneficios'],
    default: 'Descuentos especiales para usuarios registrados'
  },
  discount: {
    type: Number,
    default: 10,
    min: 0,
    max: 100
  },
  openingHours: {
    type: String,
    default: 'Lun-Vie: 9:00-18:00, Sáb: 9:00-14:00'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});





Consumidor del backend [vetfind-backend](https://github.com/pabloapc/vetfind-backend).

---

## 🧑‍💻 Stack y dependencias

- **React 19 + Typescript**
- **Vite** (build y desarrollo ultrarrápido)
- **Tailwind CSS** + Heroicons (UI)
- **React Router v7** (ruteo avanzado)
- **Axios** (HTTP requests al backend)
- **Framer Motion** (animaciones)
- **jspdf** (descarga PDF)
- **Eslint + Typescript + Prettier** (calidad de código)

---

## 🚀 Instalación y configuración

1. Clona el repo:
   ```bash
   git clone https://github.com/pabloapc/vetfind-frontend.git
   cd vetfind-frontend
   ```

2. Instala dependencias:
   ```bash
   npm install
   ```

3. Copia tu archivo `.env` si tienes endpoints personalizados (ejemplo base):
   ```env
   VITE_API_URL=http://localhost:3000/api
   ```
   (Ajusta según dónde corras el backend.)

4. Arranca el entorno de desarrollo:
   ```bash
   npm run dev
   ```
   Accede en [http://localhost:5173](http://localhost:5173) por defecto.

---

## 🗂️ Estructura principal

```
/src
  |-- App.tsx               # Ruteo principal y layout base
  |-- main.tsx              # Bootstrap React
  |-- index.css             # Global Tailwind
  |-- /components
  |     |-- BottomNavMenu.tsx   # Menú fijo bottom (acceso rápido autenticado)
  |     |-- InsurersSection.tsx # Sección obras sociales/prepagas (Home pública)
  |     |-- InsurancePlans.tsx  # Planes de seguro (temporalmente desactivado)
  |     |-- Layout.tsx
  |     |-- Navbar.tsx
  |     |-- PasswordInput.tsx
  |     |-- ProtectedRoute.tsx
  |     |-- ProtectedAdminRoute.tsx
  |     |-- RequestRow.tsx
  |-- /contexts             # Contextos globales (auth)
  |-- /hooks                # Custom hooks
  |-- /pages
  |     |-- Home.tsx            # Landing pública con InsurersSection
  |     |-- Welcome.tsx         # Dashboard post-login con accesos rápidos
  |     |-- InsurerDetail.tsx   # Detalle de obra social: planes y coberturas vinculadas
  |     |-- Veterinarias.tsx      # Listado de veterinarias con UX mobile mejorado
  |     |-- ... (resto de páginas)
  |-- /services
  |     |-- adminService.ts     # Incluye listPlanCoverages() con fallback de endpoint
  |     |-- ... (resto de servicios)
  |-- /types                # Definiciones y tipos TypeScript
```

---

## 🌐 Rutas y principales pantallas

- **`/`** — Home pública (InsurersSection visible sin login)
- **`/login`, `/register`, `/verify-email`, `/resend-verification`** — Autenticación
- **`/welcome`** — Dashboard post-login con resumen de solicitudes y accesos rápidos
- **`/profile`** — Perfil de usuario (requiere sesión)
- **`/veterinarias`** — Veterinarias con búsqueda, geolocalización, videollamada y UX mobile optimizado
- **`/emergencies`** — Servicios de urgencia
- **`/insurers/:id`** — Detalle de obra social o prepaga con planes y coberturas vinculadas
- **`/veterinaria/requests`, `/emergency/requests`, `/requests`** — Solicitudes y reservas (requiere sesión)
- **`/search`** — Resultados de búsqueda de entidades/servicios
- **`/admin/*`** — Panel de administración (usuarios, veterinarias, emergencias, obras sociales, planes, coberturas, prestaciones, leads)
  - Rutas: `/admin/users`, `/admin/veterinarias`, `/admin/insurers`, `/admin/plans`, `/admin/plan-coverages`, `/admin/prestations`, `/admin/leads`, ...

---

## 🔐 Autenticación y autorización

- **Contexto global:** manejo JWT y usuario a través de `AuthProvider` y hooks-context.
- **Rutas protegidas:** sólo accesibles con sesión y/o admin (ver `ProtectedRoute`, `ProtectedAdminRoute`).
- **Rol de usuario:** refleja la autenticación del backend (`user`, `admin`, `veterinaria`, `emergency`, etc).

---

## 🧩 Desarrollo y contribución

- Linting automático y recomendaciones de Prettier.
- Para agregar una página: crea un archivo en `/pages` y la ruta asociada en `App.tsx`.
- Para nuevos componentes, ponlos en `/components` y reutiliza según layout/contexto.
- Para servicios HTTP, usa funciones en `/services`.

---

## 📦 Scripts principales

```bash
npm run dev         # Entorno dev con Vite
npm run build       # Build producción
npm run preview     # Ver build local
npm run lint        # Corre eslint en todo el proyecto
```

---

## 🤝 Equipo y recomendaciones

- Sigue las convenciones de composición de componentes y hooks.
- Usa siempre los servicios de `/services` para consultas a backend; no hardcodees fetch/axios en componentes.
- Actualiza `/types` para tipos compartidos si agregas nuevos campos en el backend.

---

## 📄 Licencia

ISC

---

## 🧠 Resumen técnico

Vetfind es una **SPA (Single Page Application)** construida en **React 19 + TypeScript** con **Vite** como bundler. Se comunica exclusivamente con un backend REST propio (`vetmed-backend`, Node.js + Express + MongoDB) a través de **Axios** con interceptores JWT para autenticación stateless.

### Arquitectura general

```
Browser
  └── React SPA (Vite)
        ├── React Router v7        — client-side routing con lazy loading
        ├── AuthContext (JWT)      — estado global de sesión y rol
        ├── /services (Axios)      — capa de comunicación con la REST API
        ├── /pages                 — vistas únicas por ruta
        └── /components            — UI reutilizable y lógica de presentación
```

### Flujo de autenticación
1. El usuario hace login → el backend devuelve un JWT.
2. El token se guarda en memoria (`AuthContext`) y se adjunta como `Authorization: Bearer <token>` en cada request via interceptor Axios.
3. Las rutas protegidas (`ProtectedRoute`, `ProtectedAdminRoute`) validan el rol antes de renderizar.

### Modelo de solicitudes (core del negocio)
1. Un `user` encuentra una veterinaria o emergencia (la veterinaria incluye videollamada como tipo de consulta).
2. Genera una **solicitud** → el backend crea un registro con un **token de 6 dígitos** y TTL de 2 minutos.
3. El prestador (veterinaria/emergencia) ve la solicitud en su panel y la acepta o cancela.
4. El usuario confirma la entrega/consulta cerrando el ciclo.

### Puntos técnicos clave

| Área | Solución |
|---|---|
| Estado global | `AuthContext` + `useAuth` hook |
| Ruteo | React Router v7 con `lazy()` y `<Suspense>` |
| HTTP | Axios con interceptor de token JWT |
| Animaciones | Framer Motion (entrada, hover, tap) |
| Estilos | Tailwind CSS con clases responsivas (`md:`, `min-[1020px]:`, `max-[480px]:`) |
| Geolocalización | `navigator.geolocation` + haversine distance en cliente |
| PDF | jsPDF para exportar datos |
| Búsqueda | Debounce manual con `useRef` + `setTimeout` |
| Paginación | Infinite scroll con `IntersectionObserver` |
| Cobertura médica | Plan-coverages con fallback chain: API → campos embebidos → vacío |
| Accesibilidad | ARIA roles, `tabIndex`, keyboard navigation en cards interactivas |

### Endpoints REST consumidos (resumen)

| Recurso | Endpoint base |
|---|---|
| Auth | `/api/auth/login`, `/api/auth/register` |
| Veterinarias | `/api/veterinarias` |
| Emergencias | `/api/emergencies` |
| Solicitudes | `/api/requests` |
| Obras sociales | `/api/coverage/insurers` |
| Planes | `/api/coverage/plans` |
| Coberturas | `/api/coverage/plan-coverages` |
| Prestaciones | `/api/prestations/public` |
| Admin (CRUD) | `/api/admin/*` |

### Consideraciones de seguridad
- JWT en memoria (no localStorage) para evitar XSS persistente.
- Validación de rol en frontend **y** backend (defensa en profundidad).
- Sin credenciales hardcodeadas; toda configuración sensible via `VITE_API_URL` en `.env`.

---

## 💼 Resumen comercial

**Vetfind** es una plataforma digital de salud que conecta a personas con los servicios médicos que necesitan, en el momento que los necesitan. Funciona como una **ventanilla única de acceso a la salud**: veterinarias, médicos, urgencias y cobertura de obras sociales, todo desde el teléfono.

### ¿Qué problema resuelve?

Hoy el sistema de salud está fragmentado. Un afiliado no sabe qué cobertura tiene, no encuentra un turno rápido, no sabe a qué veterinaria puede ir con descuento. **Vetfind unifica ese acceso** en una sola app, conectando al paciente con su obra social, médico de cabecera y veterinaria de confianza.

### Propuesta de valor

| Para quien | Qué le ofrece Vetfind |
|---|---|
| **Paciente / afiliado** | Encuentra veterinarias con descuento por cobertura, agenda consultas médicas, accede a urgencias y ve toda su información de salud en un lugar. |
| **Veterinaria** | Recibe solicitudes digitales de sus afiliados y gestiona pedidos con token de validación. |
| **Médico / profesional** | Recibe y confirma turnos, coordina videollamadas y gestiona su agenda desde un panel propio. |
| **Obra social / prepaga** | Registra sus planes y coberturas; sus afiliados los encuentran dentro de la plataforma y pueden navegar qué prestaciones tienen disponibles. |
| **Empresa / asegurador** | Integra su red de prestadores y afiliados vía API a través del módulo B2B (contacto directo desde la home). |

### Diferencial clave
- **Geolocalización real**: el usuario ve las veterinarias y médicos más cercanos a su posición.
- **Token de validación**: cada solicitud genera un código único y temporizado que garantiza que el servicio fue efectivamente prestado — sin papel, sin fraude.
- **Coberturas transparentes**: el afiliado puede ver exactamente qué porcentaje de cobertura tiene por prestación, copago incluido.
- **Acceso multiplataforma**: funciona en móvil y desktop, con UX optimizado para touch (menú bottom, botones táctiles, badges de acceso rápido).
- **WhatsApp integrado**: contacto directo con el equipo de soporte desde cualquier pantalla autenticada.

### Módulos activos

```
✅ Registro y autenticación de usuarios
✅ Búsqueda de veterinarias por cercanía con descuentos
✅ Telemedicina / consultas médicas con turno digital
✅ Urgencias médicas con georreferencia
✅ Obras sociales y prepagas con planes y coberturas detalladas
✅ Panel de administración completo (usuarios, entidades, movimientos)
✅ Módulo de solicitudes y tokens de validación
✅ Prestaciones médicas navegables
⏳ Módulo de seguros individuales (sepelio, vida, salud) — en desarrollo
```

### Modelo de negocio (potencial)
- **SaaS B2B**: obras sociales, clínicas y aseguradoras pagan por integrar su red en Vetfind.
- **Comisión por transacción**: fee sobre solicitudes confirmadas (veterinaria, turno médico).
- **Licencia de plataforma**: hospitales o municipios que quieran desplegar Vetfind en su red.
- **Datos de salud (anonimizados)**: reportes de demanda por zona/especialidad para planificación sanitaria.

