// src/components/Map.jsx
import { useEffect } from "react";
import "leaflet/dist/leaflet.css";
import useUserPosition from "../hooks/useUserPosition.jsx";

export default function Map({ stops }) {
    const userPosition = useUserPosition();

    useEffect(() => {
        if (!userPosition.lat || !userPosition.lng) return; // Espera a tener coordenadas

        import("leaflet").then(L => {
            // Evitar reinicializar el mapa si ya existe
            if (L.map.hasOwnProperty("mapInstance")) {
                L.map.mapInstance.remove();
            }

            const map = L.map("map").setView([userPosition.lat, userPosition.lng], 13);
            L.map.mapInstance = map; // Guardamos la instancia para evitar errores "Map container is already initialized"

            // Capas base
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: "&copy; OpenStreetMap contributors",
            }).addTo(map);

            // Marcadores de paradas
            stops.forEach(s => {
                L.marker([s.lat, s.lng])
                    .addTo(map)
                    .bindPopup(s.name);
            });

            // Marcador del usuario con icono personalizado
            const userIcon = L.icon({
                iconUrl: "/images/user-marker.png",
                iconSize: [30, 30],
                iconAnchor: [15, 30],
            });

            L.marker([userPosition.lat, userPosition.lng], {
                title: "Tú",
                icon: userIcon
            }).addTo(map);

            // Dibujar línea de ruta conectando las paradas
            const latlngs = stops.map(s => [s.lat, s.lng]);
            L.polyline(latlngs, { color: "yellow" }).addTo(map);
        });
    }, [stops, userPosition]);

    return <div id="map" style={{ height: "500px", width: "100%" }}></div>;
}


/* import { useEffect } from "react";
import "leaflet/dist/leaflet.css";

export default function Map() { //retorna el div con mapa
    useEffect(() => { //se ejecuta cuando el componente cambia

        import("leaflet").then(L => {
            const map = L.map("map").setView([19.553792519503695, -96.91853384513733], 15); //crea el mapa con id map para que sepa en que div poner el mapa, y dala posicion inicial.

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: '&copy; OpenStreetMap contributors',
            }).addTo(map); //titlelayer es la imagenes del mapa

            L.marker([19.553792519503695, -96.91853384513733]) //crear marcador en posicion
                .addTo(map) //agregar al mapa
                .bindPopup("¡Hola! Este es un marcador en  xalapa")//agregar popup al marcador
        });
    }, []);

    return (
        <div id="map" style={{ height: "500px", width: "100%" }}>

        </div>

    );
}
 */