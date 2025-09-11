// src/components/RouteToggle.jsx
import { useState } from "react";
import RouteList from "./RouteList.jsx";
import ParadasCerca from "./paradasCerca.jsx";
// componente que quieres mostrar al presionar el botón

export default function RouteToggle() {
    const [showNearby, setShowNearby] = useState(false);

    return (
        <div>
            <div className="mb-6 flex gap-2">
                <input
                    type="text"
                    placeholder="Buscar una ruta..."
                    className="flex-1 border rounded-md p-2"
                />
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md">Buscar</button>
            </div>

            <button
                className="bg-green-600 text-white px-4 py-2 rounded-md mb-6"
                onClick={() => setShowNearby(!showNearby)}
            >
                {showNearby ? "Mostrar rutas" : "Buscar paradas cerca de mí"}
            </button>

            {/* Render condicional */}
            {showNearby ? <ParadasCerca /> : <RouteList />}
        </div>
    );
}
