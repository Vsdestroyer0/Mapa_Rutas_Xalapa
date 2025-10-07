import React, { useState, useEffect } from "react";

// Hook para obtener el estado de logueo (como se usa en RouteManager.jsx, pero simplificado)
const useAuthStatus = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        // Verifica si existe la información de usuario en localStorage
        // CORRECCIÓN: usar JSON.parse()
        const user = JSON.parse(localStorage.getItem("user"));
        setIsLoggedIn(!!user?.username);
    }, []);

    return { isLoggedIn };
};
export default function TrafficControls() {
    const [trafficStatus, setTrafficStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [signaling, setSignaling] = useState(false);
    const [error, setError] = useState(null);

    const { isLoggedIn } = useAuthStatus();

    // Obtener el ID de la ruta del path actual (e.g., /route/101 -> 101)
    const routeId = window.location.pathname.split("/").pop();
    // Obtener la baseURL (definida en astro.config.mjs)
    const baseURL = import.meta.env.PUBLIC_API_URL || "http://localhost:3000";

    // Función para obtener el estado del tráfico
    const fetchTrafficStatus = async () => {
        if (!routeId || isNaN(Number(routeId))) return;

        try {
            setLoading(true);
            const res = await fetch(`${baseURL}/api/traffic/status/${routeId}`, {
                credentials: "include",
            });
            if (!res.ok) throw new Error("Error al consultar el estado del tráfico.");

            const data = await res.json();
            setTrafficStatus(data);
        } catch (err) {
            console.error("Error fetching traffic status:", err);
            // No mostrar error permanente por fallos de red, solo el estado por defecto
            setTrafficStatus({ traffic: false });
        } finally {
            setLoading(false);
        }
    };

    // 1. Efecto inicial para cargar el estado y 2. Configurar la actualización automática (reset)
    useEffect(() => {
        fetchTrafficStatus();
        // Re-chequear el estado cada 60 segundos (1 minuto) para refrescar la alerta
        const intervalId = setInterval(fetchTrafficStatus, 60000);

        return () => clearInterval(intervalId); // Limpieza al desmontar
    }, [routeId]);

    // Manejador del botón para reportar tráfico
    const handleSignalTraffic = async () => {
        if (!isLoggedIn) return alert("Debes iniciar sesión para reportar tráfico.");
        if (signaling) return;

        try {
            setSignaling(true);
            setError(null);

            // Llamada al endpoint POST para reiniciar el contador
            const res = await fetch(`${baseURL}/api/traffic/signal`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ route_id: Number(routeId), signal: true }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Fallo en la señalización del backend.");
            }

            // Recargar el estado para reflejar el reinicio del contador y activar la alerta
            await fetchTrafficStatus();

            alert("✅ Reporte de tráfico enviado. El contador de 30 minutos se ha reiniciado.");

        } catch (err) {
            console.error("Error signaling traffic:", err);
            setError(err.message || "Error de conexión al reportar tráfico.");
        } finally {
            setSignaling(false);
        }
    };

    const isAlertActive = trafficStatus?.traffic === true;

    return (
        <div className="space-y-4 my-4">
            {/* Alerta de Tráfico (Visible para todos) */}
            {loading && <div className="text-gray-500 text-sm">Cargando estado del tráfico...</div>}
            {error && <div className="text-red-600 font-semibold text-sm">{error}</div>}

            {isAlertActive && (
                <div
                    className="bg-red-600 text-white p-3 rounded-lg text-center font-bold shadow-lg"
                    role="alert"
                >
                    🚨 ¡ALERTA DE TRÁFICO! Se ha reportado congestión en esta ruta. 🚨
                </div>
            )}

            {/* Botón de Reporte de Tráfico (Solo visible si está logueado) */}
            {isLoggedIn && (
                <button
                    onClick={handleSignalTraffic}
                    disabled={signaling}
                    className={`
                        w-full md:w-auto px-6 py-2 rounded-md 
                        ${signaling ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700 transition'}
                        font-semibold shadow
                    `}
                >
                    {signaling ? "Enviando reporte..." : "🚗 Reportar Tráfico Ahora"}
                </button>
            )}

        </div>
    );
}