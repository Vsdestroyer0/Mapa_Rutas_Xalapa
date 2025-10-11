import useUserPosition from "../hooks/useUserPosition.jsx";

export default function RouteStats({ route }) {
    const userPosition = useUserPosition();

    // [MODIFICACIÓN]: Extraer horario_servicio y las paradas directamente del objeto 'route'
    const { horario_servicio, stops: routeStops } = route;

    if (!userPosition.lat || !userPosition.lng) {
        return <p>Cargando ubicación...</p>;
    }

    // Normalizar stops del JSON (usando routeStops)
    const stops = (routeStops ?? []).map((s) => ({
        // ... (el resto de la lógica de stops se mantiene igual)
        lat: s.coordenas?.[0],
        lng: s.coordenas?.[1],
        name: s.nombre,
    }));

    // Función para calcular distancia entre dos puntos (Haversine)
    function getDistanceKm(lat1, lng1, lat2, lng2) {
        const R = 6371; // km
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLng = ((lng2 - lng1) * Math.PI) / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // km
    }

    // 🟡 Distancia total de la ruta (sumar segmento a segmento)
    let totalDistanceKm = 0;
    for (let i = 0; i < stops.length - 1; i++) {
        totalDistanceKm += getDistanceKm(
            stops[i].lat,
            stops[i].lng,
            stops[i + 1].lat,
            stops[i + 1].lng
        );
    }

    // 🟡 Tiempo estimado del autobús
    const busSpeedKmh = 20; // promedio urbano
    const busTimeMin = (totalDistanceKm / busSpeedKmh) * 60;

    // 🟡 Encontrar la parada más cercana
    let nearestStop = null;
    let minDistance = Infinity;

    stops.forEach((s) => {
        const distance = getDistanceKm(
            userPosition.lat,
            userPosition.lng,
            s.lat,
            s.lng
        );
        if (distance < minDistance) {
            minDistance = distance;
            nearestStop = s;
        }
    });

    // 🟡 Tiempo caminando (5 km/h)
    const walkingSpeedKmh = 5;
    const walkingTimeMin = (minDistance / walkingSpeedKmh) * 60;

    return (
        <div className="p-4 bg-white rounded-lg shadow-md mb-4">
            <h4 className="font-bold mb-2">Estadísticas de la ruta</h4>

            {/* Mostrar Horario de Servicio */}
            {horario_servicio && (
                <div className="mb-2">
                    <p>Horario de Servicio:</p>
                    <p className="ml-2">
                        Inicio: <strong>{horario_servicio.inicio || 'No disponible'}</strong>
                    </p>
                    <p className="ml-2">
                        Fin: <strong>{horario_servicio.fin || 'No disponible'}</strong>
                    </p>
                </div>
            )}

            <p>Número de paradas: {stops.length}</p>
            <p>
                Tiempo aproximado de recorrido en autobús:{" "}
                <strong>{Math.round(busTimeMin)} min</strong>
            </p>

            {nearestStop && (
                <>
                    <h5 className="font-semibold mt-3 mb-1">Tu ubicación:</h5>
                    <p>
                        Parada más cercana: <strong>{nearestStop.name}</strong>
                    </p>
                    <p>
                        Distancia a la parada:{" "}
                        <strong>{minDistance.toFixed(2)} km</strong>
                    </p>
                    <p>
                        Tiempo caminando aproximado:{" "}
                        <strong>{Math.round(walkingTimeMin)} min</strong>
                    </p>
                </>
            )}
        </div>
    );
}