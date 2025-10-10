import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Posición por defecto (Xalapa)
const DEFAULT_POS = [19.542, -96.927];

export default function NearbyStopsMap() {
    const mapRef = useRef(null);
    const routeLayerRef = useRef(null);
    const stopsLayerRef = useRef(null);

    const [stops, setStops] = useState([]);
    const [relevantRoutes, setRelevantRoutes] = useState([]);
    const [userPos, setUserPos] = useState(DEFAULT_POS);
    const [loadingPos, setLoadingPos] = useState(true); // Indica que se está buscando la posición real

    // Función unificada para realizar el fetch de paradas/rutas
    const fetchStopsAndRoutes = (lat, lng) => {
        const baseURL = import.meta.env.PUBLIC_API_URL || "http://localhost:3000";

        fetch(`${baseURL}/api/stops/nearby?lat=${lat}&lng=${lng}&limit=10`, { credentials: "include" })
            .then((res) => res.json())
            .then((data) => {
                if (data.nearbyStops && data.relevantRoutes) {
                    setStops(data.nearbyStops);
                    setRelevantRoutes(data.relevantRoutes);
                } else {
                    setStops(data);
                }
            })
            .catch((err) => console.error("Error fetching stops and relevant routes:", err));
    };


    // LÓGICA 1: Fetch de paradas con fallback + Geolocalización ASÍNCRONA
    useEffect(() => {
        // 1. FETCH INICIAL INMEDIATO (Carga inmediata de la UX)
        // Usamos la posición por defecto para que el usuario vea datos al instante.
        fetchStopsAndRoutes(DEFAULT_POS[0], DEFAULT_POS[1]);

        // 2. INICIAR GEOLOCALIZACIÓN ASÍNCRONA (Carga en paralelo)
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                ({ coords }) => {
                    const pos = [coords.latitude, coords.longitude];
                    // Si la posición es nueva, forzamos la actualización del mapa y los datos
                    setUserPos(pos);
                    setLoadingPos(false);
                },
                (err) => {
                    console.error("Geolocation error:", err);
                    // Si falla el GPS, nos quedamos con la posición y datos por defecto
                    setLoadingPos(false);
                },
                { timeout: 5000 } // Limita la espera del GPS a 5 segundos
            );
        } else {
            setLoadingPos(false);
        }
    }, []); // Se ejecuta solo al montar

    // LÓGICA 2: Inicializar Mapa y Recarga al obtener la Posición Real
    useEffect(() => {
        if (!mapRef.current) {
            // Inicialización (se ejecuta con la posición por defecto)
            mapRef.current = L.map("map").setView(userPos, 14);
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: "&copy; OpenStreetMap contributors",
            }).addTo(mapRef.current);

            routeLayerRef.current = L.layerGroup().addTo(mapRef.current);
            stopsLayerRef.current = L.layerGroup().addTo(mapRef.current);
        } else if (userPos[0] !== DEFAULT_POS[0] || userPos[1] !== DEFAULT_POS[1]) {
            // Recarga: Si userPos cambia (porque el GPS lo actualizó), centramos el mapa y recargamos los datos
            mapRef.current.setView(userPos, 14);
            // 3. Disparar fetch con coordenadas precisas
            fetchStopsAndRoutes(userPos[0], userPos[1]);
        }
    }, [userPos]); // Se ejecuta si el GPS actualiza userPos

    // LÓGICA 3: Dibujar paradas y rutas (Usa OSRM Secuencialmente para evitar 429)
    useEffect(() => {
        if (!mapRef.current || !stops.length || !relevantRoutes.length) return;
        if (!stopsLayerRef.current || !routeLayerRef.current) return;

        stopsLayerRef.current.clearLayers();
        routeLayerRef.current.clearLayers();

        // --- DEFINICIÓN DE ICONOS ---
        const userIcon = L.icon({
            iconUrl: "/images/user-marker.png",
            iconSize: [30, 30],
            iconAnchor: [15, 30],
        });
        L.marker(userPos, { icon: userIcon, title: "Tú" }).addTo(stopsLayerRef.current);

        const stopIcon = L.icon({
            iconUrl: "https://cdn-icons-png.flaticon.com/512/149/149059.png",
            iconSize: [30, 30],
            iconAnchor: [15, 30],
            popupAnchor: [0, -30],
        });
        // --- FIN DEFINICIÓN DE ICONOS ---

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
                    routeLayerRef.current.clearLayers();
                    const bounds = [];

                    // [Lógica Secuencial OSRM]
                    for (const routeId of stop.routes) {
                        const route = routeMap.get(routeId);

                        if (!route || !route.points || route.points.length < 2) continue;

                        const coordsParam = route.points.map(([lat, lng]) => `${lng},${lat}`).join(";");
                        const url = `${OSRM_URL}${coordsParam}?overview=full&geometries=geojson`;

                        try {
                            const res = await fetch(url);

                            if (!res.ok) {
                                console.warn(`OSRM Rate Limit alcanzado o error ${res.status} para ruta ${routeId}. Deteniendo dibujo.`);
                                if (res.status === 429) break; // Detiene el bucle si hay un 429
                            }

                            const data = await res.json();
                            const geometry = data?.routes?.[0]?.geometry;

                            if (!geometry) continue;

                            const geoLayer = L.geoJSON(geometry, {
                                style: { color: route.color || "#3388ff", weight: 4, opacity: 0.9 },
                            }).addTo(routeLayerRef.current);

                            geoLayer.eachLayer(layer => {
                                if (layer.getLatLngs) bounds.push(...layer.getLatLngs());
                            });
                        } catch (err) {
                            console.error(`OSRM error para ruta ${routeId}:`, err);
                            continue;
                        }
                    }

                    if (bounds.length) mapRef.current.fitBounds(bounds, { padding: [30, 30] });
                });
        });

    }, [stops, userPos, relevantRoutes]);

    return (
        <div className="relative">
            {/* Mensaje de carga que aparece solo mientras se busca la posición real */}
            {loadingPos && (
                <div className="absolute top-0 left-0 right-0 z-10 p-2 text-center text-sm bg-yellow-100 border border-yellow-300 text-gray-700">
                    Buscando tu ubicación precisa (puede tardar unos segundos)...
                </div>
            )}
            <div id="map" style={{ width: "100%", height: "500px" }} />
        </div>
    );
}