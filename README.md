# Mapa de Rutas

## Configuración con Docker (Recomendado)

### Requisitos Previos
- Docker Desktop
- MongoDB Compass (para importar datos)

### Instalación con Docker
1. Clona el repositorio
2. Abre una terminal en la raíz del proyecto
3. Ejecuta:
```bash
docker-compose up --build
```
4. Abre MongoDB Compass y conecta a `mongodb://localhost:27017`
5. Crea la base de datos `transportes`
6. Importa los datos desde `database/rutas.json` a la colección `rutas`
7. Abre http://localhost:3000 en tu navegador

### Comandos Docker Útiles
```bash
# Iniciar contenedores
docker-compose up

# Detener contenedores
docker-compose down

# Ver logs
docker-compose logs

# Reconstruir contenedores
docker-compose up --build
```

## Configuración Manual (Alternativa)

1. Clona el repositorio:

2. Instala las dependencias:
```bash
cd backend
npm install
```

3. Configura la base de datos:
- Instala MongoDB si no lo tienes instalado
- Abre MongoDB Compass
- Crea una base de datos llamada `transportes`
- Importa los datos desde el archivo `database/rutas.json` a una colección llamada `rutas`

4. Inicia el servidor:
```bash
cd backend
node server.js
```

5. Abre el navegador en `http://localhost:3000`

6. Disfruta de los mapas :D

# Cambios a futuro
- Subir esto a un servidor gratuito 
- implementación de usuario y superusuario
- Busqueda por lugares

