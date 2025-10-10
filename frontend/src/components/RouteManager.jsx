import { useState, useEffect, lazy, Suspense } from "react";
import SearchBar from "./SearchBar.jsx";
import RouteList from "./RouteList.jsx";
// Las importaciones directas de los módulos pesados/condicionales deben ser eliminadas.

// 1. DEFINICIÓN DE LOS PUNTOS DE CARGA DIFERIDA (LAZY LOADING)
// Estos componentes se moverán a bundles JavaScript separados.
const LazyInicioDestino = lazy(() => import("./InicioDestino.jsx"));
const LazyParadasCerca = lazy(() => import("./paradasCerca.jsx"));
const LazyAdminControls = lazy(() => import("./AdminControls.jsx"));
const LazyRouteActionsModal = lazy(() => import("./RouteActionsModal.jsx"));


export default function RouteManager({ baseURL }) {
    // --- ESTADO PRINCIPAL (Se mantiene) ---
    const [showNearby, setShowNearby] = useState(false);
    const [showPair, setShowPair] = useState(false);
    const [query, setQuery] = useState("");
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [viewMode, setViewMode] = useState("all");

    // Lógica de sesión (Se mantiene)
    useEffect(() => {
        const checkSession = async () => {
            if (!baseURL) return;
            try {
                const res = await fetch(`${baseURL}/api/session`, {
                    credentials: "include",
                });
                if (!res.ok) throw new Error("No autorizado");
                const data = await res.json();
                if (data?.user) {
                    setIsLoggedIn(true);
                    if (data.user.role === "admin") setIsAdmin(true);
                }
            } catch (err) {
                console.error("No se pudo verificar la sesión:", err);
                setIsLoggedIn(false);
                setIsAdmin(false);
            }
        };

        checkSession();
    }, [baseURL]);

    // Handlers para gestionar las vistas mutuamente excluyentes
    const handleToggleNearby = () => {
        setShowNearby(v => !v);
        setShowPair(false);
    };

    const handleTogglePair = () => {
        setShowPair(v => !v);
        setShowNearby(false);
    };


    return (
        <div className="max-w-3xl mx-auto p-4">
            {/* Filtros de modo de vista (Ligeros, se cargan de inmediato) */}
            <div className="flex gap-2 mb-6">
                <button
                    className={`px-4 py-2 rounded-md ${viewMode === "all" ? "bg-blue-600 text-white" : "bg-gray-200"
                        }`}
                    onClick={() => setViewMode("all")}
                >
                    Todas
                </button>
                <button
                    className={`px-4 py-2 rounded-md ${viewMode === "favoritos" ? "bg-yellow-500 text-white" : "bg-gray-200"
                        }`}
                    onClick={() => setViewMode("favoritos")}
                >
                    Favoritas
                </button>
                <button
                    className={`px-4 py-2 rounded-md ${viewMode === "ocultos" ? "bg-red-500 text-white" : "bg-gray-200"
                        }`}
                    onClick={() => setViewMode("ocultos")}
                >
                    Ocultas
                </button>
            </div>

            {/* 2. Carga Diferida para Controles de Administración (Solo si isAdmin) */}
            {isAdmin && (
                <Suspense fallback={<p className="text-gray-400">Cargando controles de administración...</p>}>
                    <LazyAdminControls />
                </Suspense>
            )}

            <SearchBar onSearch={setQuery} />

            {/* Botones de activación de módulos pesados */}
            <div className="flex flex-wrap gap-2 mb-6">
                <button
                    className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-md cursor-pointer text-sm sm:text-base whitespace-normal break-words text-center leading-snug max-w-full w-full sm:w-auto"
                    onClick={handleToggleNearby}
                >
                    {showNearby ? "Mostrar rutas" : "Buscar paradas cerca de mí"}
                </button>
                <button
                    className="bg-indigo-600 text-white px-3 sm:px-4 py-2 rounded-md cursor-pointer text-sm sm:text-base whitespace-normal break-words text-center leading-snug max-w-full w-full sm:w-auto"
                    onClick={handleTogglePair}
                >
                    {showPair ? "Ocultar búsqueda por 2 paradas" : "Buscar ruta entre 2 paradas"}
                </button>
            </div>

            {/* 3. Carga Diferida para Módulos de Búsqueda Pesada */}
            <Suspense fallback={<p className="text-blue-500 mt-4 text-center">Cargando módulo de búsqueda...</p>}>
                {showPair && <LazyInicioDestino />}
                {showNearby ? (
                    <LazyParadasCerca />
                ) : (
                    <RouteList
                        palabraBusqueda={query}
                        isAdmin={isAdmin}
                        isLoggedIn={isLoggedIn}
                        onSelectRoute={setSelectedRoute}
                        viewMode={viewMode}
                    />
                )}
            </Suspense>

            {/* 4. Carga Diferida para Modal de Administrador */}
            {isAdmin && selectedRoute && (
                <Suspense fallback={null}>
                    <LazyRouteActionsModal route={selectedRoute} onClose={() => setSelectedRoute(null)} />
                </Suspense>
            )}
        </div>
    );
}