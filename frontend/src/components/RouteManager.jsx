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
            {isAdmin && <AdminControls />}

            <SearchBar onSearch={setQuery} />

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

            {showPair && <InicioDestino />}

            {showNearby ? (
                <ParadasCerca />
            ) : (
                <RouteList
                    palabraBusqueda={query}
                    isAdmin={isAdmin}
                    onSelectRoute={setSelectedRoute}
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
