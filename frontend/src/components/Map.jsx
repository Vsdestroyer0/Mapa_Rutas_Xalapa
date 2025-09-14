import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import useUserPosition from "../hooks/useUserPosition.jsx";
import L from "leaflet";

export default function Map({ stops, points, color = "#3388ff", isCircuit = false }) {
    const mapRef = useRef(null);
    const routeLayerRef = useRef(null);
    const stopsLayerRef = useRef(null);
    const userPosition = useUserPosition();

    // Inicializar mapa solo una vez
    useEffect(() => {
        if (!mapRef.current && points.length > 0) {
            mapRef.current = L.map("map").setView(points[0], 14);
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: "&copy; OpenStreetMap contributors",
            }).addTo(mapRef.current);

            routeLayerRef.current = L.layerGroup().addTo(mapRef.current);
            stopsLayerRef.current = L.layerGroup().addTo(mapRef.current);
        }
    }, [points]);

    // Actualizar ruta con OSRM
    useEffect(() => {
        if (!mapRef.current || points.length < 2) return;
        if (!routeLayerRef.current || !stopsLayerRef.current) return;

        routeLayerRef.current.clearLayers();
        stopsLayerRef.current.clearLayers();

        // Dibujar paradas
        stops.forEach((s) => {
            if (!s.coordenas) return;
            L.circleMarker(s.coordenas, {
                radius: 6,
                color: "red",
                fillColor: "yellow",
                fillOpacity: 1,
            })
                .addTo(stopsLayerRef.current)
                .bindPopup(s.nombre || "Parada");
        });

        // Dibujar marcador del usuario
        if (userPosition.lat && userPosition.lng) {
            const userIcon = L.icon({
                iconUrl: "/images/user-marker.png",
                iconSize: [30, 30],
                iconAnchor: [15, 30],
            });
            L.marker([userPosition.lat, userPosition.lng], { icon: userIcon, title: "Tú" }).addTo(stopsLayerRef.current);
        }

        // Preparar puntos de la ruta para OSRM
        let routePoints = [...points];
        if (isCircuit) routePoints.push(points[0]);
        const coordsParam = routePoints.map(([lat, lng]) => `${lng},${lat}`).join(";");
        const url = `https://router.project-osrm.org/route/v1/driving/${coordsParam}?overview=full&geometries=geojson`;

        fetch(url)
            .then((res) => res.json())
            .then((data) => {
                const routeGeo = data?.routes?.[0]?.geometry;
                if (!routeGeo) return;

                const gj = { type: "Feature", geometry: routeGeo };
                const geoLayer = L.geoJSON(gj, { style: { color, weight: 5, opacity: 0.9 } }).addTo(routeLayerRef.current);

                // Ajustar vista solo si bounds son válidas
                const bounds = geoLayer.getBounds();
                if (bounds.isValid()) mapRef.current.fitBounds(bounds, { padding: [20, 20] });
            })
            .catch((err) => console.error("OSRM error:", err));
    }, [points, stops, userPosition, color, isCircuit]);

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