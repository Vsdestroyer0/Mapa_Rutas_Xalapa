FROM node:18

WORKDIR /app

COPY package*.json ./
COPY backend/ ./backend/
COPY Mapa-de-Rutas/ ./Mapa-de-Rutas/

RUN cd backend && npm install

EXPOSE 3000

CMD ["node", "backend/server.js"]
