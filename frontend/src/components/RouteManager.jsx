import { useState, useEffect } from "react";
import SearchBar from "./SearchBar.jsx";
import InicioDestino from "./InicioDestino.jsx";
import RouteList from "./RouteList.jsx";
import ParadasCerca from "./paradasCerca.jsx";
import AdminControls from "./AdminControls.jsx";
import RouteActionsModal from "./RouteActionsModal.jsx";

export default function RouteManager() {
    const [showNearby, setShowNearby] = useState(false);
    const [showPair, setShowPair] = useState(false);
    const [query, setQuery] = useState("");
    const [isAdmin, setIsAdmin] = useState(false);
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [viewMode, setViewMode] = useState("all"); // all | favoritos | ocultos

    useEffect(() => {
        const checkSession = async () => {
            try {
                const baseURL = import.meta.env.PUBLIC_API_URL;
                const res = await fetch(`${baseURL}/api/session`, { credentials: "include" });
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

            {/* Botones de filtro de vista */}
            <div className="flex gap-2 mb-6">
                <button
                    className={`px-4 py-2 rounded-md ${viewMode === "all" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
                    onClick={() => setViewMode("all")}
                >
                    Todas
                </button>
                <button
                    className={`px-4 py-2 rounded-md ${viewMode === "favoritos" ? "bg-yellow-500 text-white" : "bg-gray-200"}`}
                    onClick={() => setViewMode("favoritos")}
                >
                    Favoritas
                </button>
                <button
                    className={`px-4 py-2 rounded-md ${viewMode === "ocultos" ? "bg-red-500 text-white" : "bg-gray-200"}`}
                    onClick={() => setViewMode("ocultos")}
                >
                    Ocultas
                </button>
            </div>

            {/* Controles de admin */}
            {isAdmin && <AdminControls />}

            {/* Barra de búsqueda */}
            <SearchBar onSearch={setQuery} />

            {/* Botones de funciones adicionales */}
            <div className="flex gap-2 mb-6">
                <button
                    className="bg-green-600 text-white px-4 py-2 rounded-md cursor-pointer"
                    onClick={() => setShowNearby(!showNearby)}
                >
                    {showNearby ? "Mostrar rutas" : "Buscar paradas cerca de mí"}
                </button>

                <button
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md cursor-pointer"
                    onClick={() => setShowPair((v) => !v)}
                >
                    {showPair ? "Ocultar búsqueda por 2 paradas" : "Buscar ruta entre 2 paradas"}
                </button>
            </div>

            {/* Búsqueda por dos paradas */}
            {showPair && <InicioDestino />}

            {/* Listado de rutas o paradas cercanas */}
            {showNearby ? (
                <ParadasCerca />
            ) : (
                <RouteList
                    palabraBusqueda={query}
                    isAdmin={isAdmin}
                    onSelectRoute={setSelectedRoute}
                    viewMode={viewMode} // ✅ Pasamos viewMode a RouteList
                />
            )}

            {/* Modal solo para admins */}
            {isAdmin && (
                <RouteActionsModal
                    route={selectedRoute}
                    onClose={() => setSelectedRoute(null)}
                />
            )}
        </div>
    );
}
