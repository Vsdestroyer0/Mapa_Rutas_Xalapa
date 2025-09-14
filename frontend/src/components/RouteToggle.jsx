// src/components/RouteToggle.jsx
import { useState } from "react";
import RouteList from "./RouteList.jsx";
import ParadasCerca from "./paradasCerca.jsx";

export default function RouteToggle() {
    const [showNearby, setShowNearby] = useState(false);

    return (
        <div>


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
