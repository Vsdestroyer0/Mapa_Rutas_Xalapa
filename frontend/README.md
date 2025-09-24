# MiRutaXalapa
## Aplicación web para consultar rutas de camiones en Xalapa. Permite:

- Buscar rutas por nombre.
- Ver el detalle de una ruta.
- Encontrar rutas comunes entre dos paradas.
- Ver paradas cercanas usando geolocalización (cuando el backend está configurado con índice 2dsphere).
- Administración básica de rutas (ver, eliminar) usando el id numérico de cada ruta.
Importante: en todo el sistema se usa el id numérico propio de la ruta, nunca el _id de Mongo, para evitar problemas al reordenar o eliminar elementos.

## Tecnologías
- Frontend: Astro + React + TailwindCSS + Leaflet
- Backend: Node.js + Express
- Base de datos: MongoDB (Mongoose)
- Autenticación: JWT/Cookies (según implementación actual de /api/session y /api/logout)

## Estructura
Mapa_Rutas_Xalapa/
├─ backend/
│  ├─ controllers/
│  │  ├─ rutasController.js
│  │  └─ stopsController.js
│  ├─ routes/
│  │  ├─ rutas.js
│  │  └─ stops.js
│  ├─ models/
│  │  ├─ ruta.js
│  │  └─ stop.js
│  └─ server.js
│
└─ frontend/
   ├─ src/pages/
   │  ├─ index.astro
   │  └─ route/[id].astro
   ├─ src/components/
   │  ├─ RouteManager.jsx
   │  ├─ RouteList.jsx
   │  ├─ RouteActionsModal.jsx
   │  ├─ InicioDestino.jsx
   │  └─ Map.jsx (y otros)
   └─ src/layouts/
      └─ mainLayout.astro

## Requisitos
- Node.js LTS (18+)
- MongoDB en local o Atlas
- Windows (el proyecto fue probado en Windows)
- Puesta en marcha

## Backend
En backend/:
bash
cd backend
npm install
# Variables de entorno (ejemplo):
# - PORT=3000
# - MONGODB_URI=mongodb://localhost:27017/miruta
# - JWT_SECRET=un_secreto
npm run dev o nodemon server.js o node server.js
## Frontend
En frontend/:
bash
cd frontend
npm install
npm run dev

Abre el frontend en el puerto que indica Astro (por defecto http://localhost:4321).
El frontend consume el backend en http://localhost:3000 (ajusta si usas otro puerto).
## Endpoints principales (Backend)
## Rutas:
GET /api/rutas/listado → listado de rutas con id y label. Asegúrate de incluir el campo id en la proyección.
GET /api/rutas/:id → detalle de ruta por id numérico (no _id).
DELETE /api/rutas/:id → elimina por id numérico.
## Paradas:
GET /api/stops/search?nombre=XYZ&limit=5 → busca paradas por nombre (insensible a mayúsculas). Devuelve cada parada con:
nombre
coordenas (GeoJSON Point [lng, lat] o tu estructura)
routes: number[] → IDs numéricos de las rutas donde aparece esa parada (calculado dinámicamente).
GET /api/stops/nearby?lat=..&lng=..&limit=.. → paradas cercanas a coordenadas. Requiere índice 2dsphere en coordenas.
## Sesión:
GET /api/session → devuelve { user: { name, email, role, ... } } o vacío.
POST /api/logout (o GET /api/logout según tu backend).
## Detalles clave implementados
Navegación y acciones por id numérico:
RouteList.jsx
 navega a /route/${route.id} y nunca usa índice ni _id.
RouteActionsModal.jsx
 elimina con DELETE /api/rutas/${route.id} y navega con id.
## Página de ruta:
src/pages/route/[id].astro hace GET /api/rutas/:id usando el id de la URL.
## Búsqueda por 2 paradas:
InicioDestino.jsx
 llama dos veces a /api/stops/search?nombre=..., toma stop.routes de cada una y hace la intersección para mostrar rutas en común.
## StopsController:
searchStopsByName construye routes “on the fly” buscando en la colección de rutas (Ruta) las que contienen el nombre de la parada en ruta.stops.nombre. Esto resuelve el caso “Plaza Animas” + “Clavijero” devolviendo la intersección correcta.
## Índices Mongo necesarios
Para /api/stops/nearby:
js
// En colección Stop:
db.stops.createIndex({ coordenas: "2dsphere" })
## Convenciones y buenas prácticas
Usar siempre id numérico de la ruta para:
Navegar a detalle: /route/:id
Eliminar: DELETE /api/rutas/:id
Listar: incluir id y label en /api/rutas/listado
Evitar _id de Mongo y evitar usar el índice del array para rutas.
En Stop:
El campo correcto es coordenas (evitar escribir “coordenadas”).
No esperes routes en la base; se calculan en el controlador al responder.
## Scripts útiles
Backend:
npm run dev con nodemon (si está configurado).
node server.js producción simple.
Frontend:
npm run dev desarrollo Astro.
npm run build y npm run preview para previsualización.
## Problemas comunes y soluciones
No encuentra rutas entre dos paradas:
Asegúrate de que GET /api/stops/search retorna objetos con routes: number[].
Verifica que los nombres coincidan (p. ej., “Plaza Animas” vs “Plaza Ánimas”). La búsqueda usa regex insensible, pero un nombre muy diferente no coincidirá.
## Se queda “cargando” al buscar paradas:
Revisa que searchStopsByName haga return res.json(stopsEnriched). Si no respondes, el frontend espera indefinidamente.
Considera añadir timeout con AbortController en 
InicioDestino.jsx
.
## nearbyStops devuelve 400 aunque mando 0:
Valida con Number.isFinite(lat) y Number.isFinite(lng) en vez de !lat o !lng.
## No carga el detalle de ruta:
Verifica que el ID en la URL sea el id numérico y que /api/rutas/:id lo soporte.
rutasController.getRutaById debe buscar findOne({ id: Number(req.params.id) }).
## Desarrollo y estilo
Frontend usa Tailwind. El contenedor principal en 
mainLayout.astro
 se amplió a max-w-7xl.
La lista de rutas (
RouteList.jsx
) 