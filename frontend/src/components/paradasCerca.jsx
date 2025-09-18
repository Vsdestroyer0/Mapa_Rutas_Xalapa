import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

export default function NearbyStopsMap() {
    const mapRef = useRef(null);
    const routeLayerRef = useRef(null);
    const stopsLayerRef = useRef(null);

    const [stops, setStops] = useState([]);
    const [userPos, setUserPos] = useState([19.542, -96.927]);

    // ✅ Geolocalización y fetch de paradas cercanas
    useEffect(() => {
        if (!navigator.geolocation) return;

        navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
                const pos = [coords.latitude, coords.longitude];
                setUserPos(pos);

                fetch(`/api/stops/nearby?lat=${coords.latitude}&lng=${coords.longitude}&limit=20`)
                    .then((res) => res.json())
                    .then((data) => setStops(data))
                    .catch((err) => console.error("Error fetching stops:", err));
            },
            (err) => console.error("Geolocation error:", err)
        );
    }, []);

    // ✅ Inicializar mapa
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

    // ✅ Dibujar paradas y rutas bajo demanda
    useEffect(() => {
        if (!mapRef.current || !stops.length) return;
        if (!stopsLayerRef.current || !routeLayerRef.current) return;

        stopsLayerRef.current.clearLayers();
        routeLayerRef.current.clearLayers();

        // Marcador usuario
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

                    try {
                        const res = await fetch(`/api/stops/${stop.id}/routes`);
                        const routes = await res.json();

                        for (const route of routes) {
                            if (!route.points || route.points.length < 2) continue;

                            const coordsParam = route.points.map(([lat, lng]) => `${lng},${lat}`).join(";");
                            const url = `https://router.project-osrm.org/route/v1/driving/${coordsParam}?overview=full&geometries=geojson`;

                            const osrmRes = await fetch(url);
                            const osrmData = await osrmRes.json();
                            const routeGeo = osrmData?.routes?.[0]?.geometry;
                            if (!routeGeo) continue;

                            const geoLayer = L.geoJSON(routeGeo, {
                                style: { color: route.color || "#3388ff", weight: 4, opacity: 0.9 },
                            }).addTo(routeLayerRef.current);

                            geoLayer.eachLayer(layer => {
                                if (layer.getLatLngs) bounds.push(...layer.getLatLngs());
                            });
                        }

                        if (bounds.length) mapRef.current.fitBounds(bounds, { padding: [30, 30] });
                    } catch (err) {
                        console.error("Error cargando rutas de parada:", err);
                    }
                });
        });
    }, [stops, userPos]);

    return <div id="map" style={{ width: "100%", height: "500px" }} />;
}
