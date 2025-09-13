# Mapa de Rutas
```
Mapa_Rutas_Xalapa/
│
├─ backend/ # Backend de prueba con Express
│ ├─ controllers/ # Lógica de los endpoints
│ │ └─ authController.js
│ │ └─ rutasController.js
│ ├─ scripts/ # un scrip peque para mandar la bd al frontend
│ │ └─ exportToFrontend.js
│ ├─ routes/ # Rutas del backend
│ │ └─ auth.js
│ │ └─ rutas.js
│ ├─ data/ # "Base de datos" en JSON
│ │ └─ usuarios.json
│ │ └─ rutas.json
│ └─ server.js # Servidor Express principal
│
├─ frontend # Proyecto Astro
│ ├─ src/pages/ # Páginas
│ ├─ src/data/ # archivos json para renderizar el listado de rutas
│ ├─ src/components/ # Componentes
│ ├─ src/layouts/ # Layouts
│ ├─ src/hooks/ # hook para saber la posicion del usuario
│ └─ data/ # JSON de prueba de rutas
│
```

# Requisitos Previos
- Nodejs

# Correr frontend
- ir a la carpeta frontend
  - se vera algo asi: ~\Desktop\rutas\Mapa_Rutas_Xalapa\fronted (depende de donde clonen el repositorio)
- npm install (reconstruye modulos de node)
- npm run dev (levanta astro)

# Dependencias instaladas para el frontend
- react (dinamismo)
- tailwind (estilo)
- astro (framework principal)
- leaflet (mapa)

# Correr backend
- ir a la carpeta backend
  - se vera algo asi: ~\Desktop\rutas\Mapa_Rutas_Xalapa\backend (depende de donde clonen el repositorio)
- npm install (reconstruye modulos de node)
- nodemon server.js
  - node server.js (en caso de que no funcione)

# Dependencias instaladas para el backend
- bcrypt (cifrado de contraseñas)
- cors (para que el navegador no bloque la comunicacion entre frontend y backend)
- dotenv (variables de entorno)
- express (servidor)
- jsonwebtoken (persistencia de sesion)
- mongoose (mongo)
- nodemon(herramienta de desarrollo)


# Cambios a futuro
- Subir frontend a un servicio gratuito 
- Subir backend a un servidor gratuito 
- base de datos real con mongo atlas
  
# Mensaje
Solo sigan las instrucciones de como correr backend primero y luego frontend y jalara bien