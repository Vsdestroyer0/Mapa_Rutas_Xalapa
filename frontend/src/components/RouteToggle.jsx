import { useState, useEffect } from "react";
import RouteList from "./RouteList.jsx";
import ParadasCerca from "./paradasCerca.jsx";

export default function RouteToggle() {
    const [showNearby, setShowNearby] = useState(false);
    const [allRoutes, setAllRoutes] = useState([]);

    // Cargar todas las rutas desde backend
    useEffect(() => {
        fetch("/api/rutas/todas")
            .then(res => res.json())
            .then(data => setAllRoutes(data))
            .catch(err => console.error(err));
    }, []);

    return (
        <div>
            <button
                className="bg-green-600 text-white px-4 py-2 rounded-md mb-6"
                onClick={() => setShowNearby(!showNearby)}
            >
                {showNearby ? "Mostrar rutas" : "Buscar paradas cerca de mí"}
            </button>
            {showNearby
                ? <ParadasCerca allRoutes={allRoutes} />
                : <RouteList />}

        </div>
    );
}

