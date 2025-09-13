// src/hooks/useUserPosition.jsx
import { useState, useEffect } from "react";

export default function useUserPosition() {
    const [position, setPosition] = useState({ lat: null, lng: null });

    useEffect(() => {
        if (!navigator.geolocation) return;

        const watcher = navigator.geolocation.watchPosition(
            (pos) => {
                setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            },
            (err) => {
                if (err.code === 3) {
                    console.warn("Timeout obteniendo ubicación, esperando al siguiente cambio...");
                } else {
                    console.error("Error al obtener ubicación:", err);
                }
            }
            ,
            { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
        );

        // limpia
        return () => navigator.geolocation.clearWatch(watcher);
    }, []);

    return position;
}
