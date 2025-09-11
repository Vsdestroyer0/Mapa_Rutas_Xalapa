// src/components/RouteStats.jsx
import useUserPosition from "../hooks/useUserPosition.jsx";

export default function RouteStats({ route }) {
    const userPosition = useUserPosition();

    if (!userPosition.lat || !userPosition.lng) {
        return <p>Cargando ubicación...</p>;
    }

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

    // Encontrar la parada más cercana
    let nearestStop = null;
    let minDistance = Infinity;

    route.stops.forEach(s => {
        const distance = getDistanceKm(userPosition.lat, userPosition.lng, s.lat, s.lng);
        if (distance < minDistance) {
            minDistance = distance;
            nearestStop = s;
        }
    });

    // Calcular tiempo caminando (velocidad promedio 5 km/h)
    const walkingSpeedKmh = 5;
    const walkingTimeMin = (minDistance / walkingSpeedKmh) * 60;

    return (
        <div className="p-4 bg-white rounded-lg shadow-md mb-4">
            <h4 className="font-bold mb-2">Estadísticas de la ruta</h4>
            <p>numero de paradas: {route.stops.length}</p>
            <p>Tiempo aproximado de recorrido: {route.timeApprox}</p>
            {nearestStop && (
                <>
                    <p>
                        Parada más cercana: <strong>{nearestStop.name}</strong>
                    </p>
                    <p>
                        Distancia a la parada: <strong>{minDistance.toFixed(2)} km</strong>
                    </p>
                    <p>
                        Tiempo caminando aproximado: <strong>{Math.round(walkingTimeMin)} min</strong>
                    </p>
                </>
            )}
        </div>
    );
}

