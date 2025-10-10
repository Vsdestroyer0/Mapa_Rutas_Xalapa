import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

export default function NearbyStopsMap() {
    const mapRef = useRef(null);
    const routeLayerRef = useRef(null);
    const stopsLayerRef = useRef(null);

    const [stops, setStops] = useState([]);
    const [relevantRoutes, setRelevantRoutes] = useState([]);
    const [userPos, setUserPos] = useState([19.542, -96.927]); // posición default

    // LÓGICA 1: Geolocalización y fetch de paradas cercanas y rutas relevantes
    useEffect(() => {
        if (!navigator.geolocation) return;

        navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
                const pos = [coords.latitude, coords.longitude];
                setUserPos(pos);

                const baseURL = import.meta.env.PUBLIC_API_URL;
                // Fetch al endpoint optimizado que devuelve stops y relevantRoutes
                fetch(`${baseURL}/api/stops/nearby?lat=${coords.latitude}&lng=${coords.longitude}&limit=20`, { credentials: "include" })
                    .then((res) => res.json())
                    .then((data) => {
                        // Manejamos el objeto unificado del backend
                        if (data.nearbyStops && data.relevantRoutes) {
                            setStops(data.nearbyStops);
                            setRelevantRoutes(data.relevantRoutes);
                        } else {
                            setStops(data);
                            console.error("El backend no devolvió el formato optimizado {nearbyStops, relevantRoutes}.");
                        }
                    })
                    .catch((err) => console.error("Error fetching stops and relevant routes:", err));
            },
            (err) => console.error("Geolocation error:", err)
        );
    }, []);

    // Inicializar mapa solo una vez (sin cambios, es correcto)
    useEffect(() => {
        if (!mapRef.current) {
            mapRef.current = L.map("map").setView(userPos, 14);
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: "&copy; OpenStreetMap contributors",
            }).addTo(mapRef.current);

            routeLayerRef.current = L.layerGroup().addTo(mapRef.current);
            stopsLayerRef.current = L.layerGroup().addTo(mapRef.current);
        }
    }, [userPos]);

    // LÓGICA 3: Dibujar paradas y rutas (Usa OSRM en paralelo)
    useEffect(() => {
        if (!mapRef.current || !stops.length || !relevantRoutes.length) return;
        if (!stopsLayerRef.current || !routeLayerRef.current) return;

        stopsLayerRef.current.clearLayers();
        routeLayerRef.current.clearLayers();

        const userIcon = L.icon({
            iconUrl: "/images/user-marker.png",
            iconSize: [30, 30],
            iconAnchor: [15, 30],
        });
        L.marker(userPos, { icon: userIcon, title: "Tú" }).addTo(stopsLayerRef.current);
        // [DEFINICIÓN DE ICONOS se mantiene aquí]

        const stopIcon = L.icon({
            iconUrl: "https://cdn-icons-png.flaticon.com/512/149/149059.png",
            iconSize: [30, 30],
            iconAnchor: [15, 30],
            popupAnchor: [0, -30],
        });

        const routeMap = new Map(relevantRoutes.map(r => [r.id, r]));
        const OSRM_URL = "https://router.project-osrm.org/route/v1/driving/";

        // Marcadores de paradas
        stops.forEach((stop) => {
            L.marker([stop.coordenas.coordinates[1], stop.coordenas.coordinates[0]], {
                icon: stopIcon,
                title: stop.nombre,
            })
                .addTo(stopsLayerRef.current)
                .bindPopup(`<b>${stop.nombre}</b><br/>Rutas: ${stop.routes.join(", ")}`)
                .on("click", async () => {
                    // Limpia la capa y prepara los límites
                    routeLayerRef.current.clearLayers();
                    const bounds = [];

                    // [REVERSIÓN A SECUENCIAL]: Usamos for...of para asegurar que un fetch termine antes de empezar el siguiente
                    for (const routeId of stop.routes) {
                        const route = routeMap.get(routeId);

                        if (!route || !route.points || route.points.length < 2) continue;

                        // Los puntos de Leaflet/MongoDB están en [lat, lng], OSRM espera [lng, lat]
                        const coordsParam = route.points.map(([lat, lng]) => `${lng},${lat}`).join(";");
                        const url = `${OSRM_URL}${coordsParam}?overview=full&geometries=geojson`;

                        try {
                            // AWAIT: Detiene el bucle aquí hasta que el fetch termine.
                            const res = await fetch(url);

                            if (res.status === 429) {
                                console.warn(`OSRM Rate Limit alcanzado para ruta ${routeId}. Deteniendo dibujo.`);
                                break; // Detiene el bucle si hay un 429
                            }

                            const data = await res.json();
                            const geometry = data?.routes?.[0]?.geometry;

                            if (!geometry) continue;

                            // DIBUJO INMEDIATO: El usuario ve el dibujo al instante
                            const geoLayer = L.geoJSON(geometry, {
                                style: { color: route.color || "#3388ff", weight: 4, opacity: 0.9 },
                            }).addTo(routeLayerRef.current);

                            geoLayer.eachLayer(layer => {
                                if (layer.getLatLngs) bounds.push(...layer.getLatLngs());
                            });
                        } catch (err) {
                            // Capturamos el error de OSRM (ej. SyntaxError por HTML de 429)
                            console.error(`OSRM error para ruta ${routeId}:`, err);
                            // Continuamos con la siguiente ruta para intentar dibujar lo que se pueda
                            continue;
                        }
                    } // Fin del bucle for...of

                    // Centrar el mapa al final
                    if (bounds.length) mapRef.current.fitBounds(bounds, { padding: [30, 30] });
                });
        });

    }, [stops, userPos, relevantRoutes]);

    return <div id="map" style={{ width: "100%", height: "500px" }} />;
}
