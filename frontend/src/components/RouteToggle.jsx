import { useState, useEffect } from "react";
import RouteList from "./RouteList.jsx";
import ParadasCerca from "./paradasCerca.jsx";

export default function RouteToggle() {
    const [showNearby, setShowNearby] = useState(false);
    const [palabraBusqueda, setPalabraBusqueda] = useState(""); // input controlado
    const [query, setQuery] = useState(""); // búsqueda confirmada al dar buscar
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

    const handleSearch = (e) => {
        e.preventDefault();
        setQuery(palabraBusqueda); // solo actualiza la búsqueda al dar clic en Buscar
    };

    return (
        <div className="max-w-3xl mx-auto p-4">
            {/* Admin buttons */}
            {isAdmin && (
                <div className="gap-2 mb-4 flex">
                    <button className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600">
                        Agregar ruta
                    </button>
                    <button className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600">
                        Eliminar ruta
                    </button>
                    <button className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600">
                        Modificar ruta
                    </button>
                </div>
            )}

            {/* Buscar rutas */}
            <form onSubmit={handleSearch} className="mb-6 flex gap-2">
                <input
                    type="text"
                    value={palabraBusqueda}
                    onChange={(e) => setPalabraBusqueda(e.target.value)}
                    placeholder="Buscar una ruta..."
                    className="flex-1 border rounded-md p-2"
                />
                <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                    Buscar
                </button>
            </form>

            {/* Toggle entre mostrar rutas o paradas cercanas */}
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


