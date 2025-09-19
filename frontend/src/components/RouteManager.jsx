import { useState, useEffect } from "react";
import AdminControls from "./AdminControls.jsx";
import SearchBar from "./SearchBar.jsx";
import RouteList from "./RouteList.jsx";
import ParadasCerca from "./paradasCerca.jsx";

export default function RouteManager() {
    const [showNearby, setShowNearby] = useState(false);
    const [query, setQuery] = useState("");
    const [isAdmin, setIsAdmin] = useState(false);

    // ✅ Verificar sesión y rol de usuario
    useEffect(() => {
        const checkSession = async () => {
            try {
                const res = await fetch("/api/session", { credentials: "include" });
                const data = await res.json();
                if (data.user?.role === "admin") setIsAdmin(true);
            } catch (err) {
                console.error("No se pudo verificar la sesión:", err);
            }
        };
        checkSession();
    }, []);

    return (
        <div className="max-w-3xl mx-auto p-4">
            {/* Botones admin */}
            {isAdmin && <AdminControls />}

            {/* Buscador */}
            <SearchBar onSearch={setQuery} />

            {/* Toggle rutas/paradas */}
            <button
                className="bg-green-600 text-white px-4 py-2 rounded-md mb-6 cursor-pointer"
                onClick={() => setShowNearby(!showNearby)}
            >
                {showNearby ? "Mostrar rutas" : "Buscar paradas cerca de mí"}
            </button>

            {/* Contenido */}
            {showNearby ? <ParadasCerca /> : <RouteList palabraBusqueda={query} />}
        </div>
    );
}
