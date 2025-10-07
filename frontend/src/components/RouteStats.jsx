// src/components/RouteStats.jsx
import useUserPosition from "../hooks/useUserPosition.jsx";

export default function RouteStats({ route }) {
    const userPosition = useUserPosition();

    if (!userPosition.lat || !userPosition.lng) {
        return <p>Cargando ubicación...</p>;
    }

    // Normalizar stops del JSON
    const stops = (route ?? []).map((s) => ({
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
            <p>Número de paradas: {stops.length}</p>
            <p>
                Tiempo aproximado de recorrido en autobús:{" "}
                <strong>{Math.round(busTimeMin)} min</strong>
            </p>

            {nearestStop && (
                <>
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

