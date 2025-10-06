import { useState } from "react";

export default function SearchBar({ onSearch }) {
    //Aquí se almacenan las paradas de inicio y destino
    const [palabraBusqueda, setPalabraBusqueda] = useState("");
    const [palabraBusqueda2, setPalabraBusqueda2] = useState("");
    //Loading es para mostrar un mensaje de carga
    const [loading, setLoading] = useState(false);
    //Error es para mostrar un mensaje de error
    const [error, setError] = useState("");
    //Results es para mostrar los resultados de la búsqueda
    const [results, setResults] = useState([]);

    const fetchStopByName = async (name) => {
        //URL de la API
        const baseURL = import.meta.env.PUBLIC_API_URL;
        const url = `${baseURL}/api/stops/search?nombre=${encodeURIComponent(name)}`;
        //Hacemos la petición a la API
        const res = await fetch(url, {
            //include: include cookies
            credentials: "include"
        });
        if (!res.ok) throw new Error(`No se pudo buscar la parada: ${name}`);
        const data = await res.json();
        // Suponemos que devuelve un array de stops y 
        // escogemos el primero que concuerde
        return Array.isArray(data) && data.length > 0 ? data[0] : null;
    };

    const fetchRouteById = async (routeId) => {
        const baseURL = import.meta.env.PUBLIC_API_URL;
        const res = await fetch(`${baseURL}/api/rutas/${routeId}`, { credentials: "include" });
        if (!res.ok) throw new Error(`Ruta ${routeId} no encontrada`);
        return res.json();
    };

    const handleSearch = async (e) => {
        //Prevenir el envío del formulario
        e.preventDefault();
        //Setear error a vacío
        setError("");
        //Setear resultados a vacío
        setResults([]);
        //Setear loading a true para mostrar el mensaje de carga
        setLoading(true);

        try {
            if (onSearch) onSearch(palabraBusqueda, palabraBusqueda2);

            const [stopA, stopB] = await Promise.all([
                fetchStopByName(palabraBusqueda.trim()),
                fetchStopByName(palabraBusqueda2.trim()),
            ]);

            if (!stopA) throw new Error(`No se encontró la parada: "${palabraBusqueda}"`);
            if (!stopB) throw new Error(`No se encontró la parada: "${palabraBusqueda2}"`);

            const routesA = Array.isArray(stopA.routes) ? stopA.routes : [];
            const routesB = Array.isArray(stopB.routes) ? stopB.routes : [];
            const setB = new Set(routesB);
            const intersection = routesA.filter((r) => setB.has(r));

            if (intersection.length === 0) {
                setError("No hay rutas que conecten ambas paradas.");
                setResults([]);
                setLoading(false);
                return;
            }

            const detailed = await Promise.all(
                intersection.map(async (rid) => {
                    try {
                        const r = await fetchRouteById(rid);
                        return { id: r.id ?? rid, label: r.label ?? `Ruta ${rid}` };
                    } catch {
                        return { id: rid, label: `Ruta ${rid}` };
                    }
                })
            );

            setResults(detailed);
        } catch (err) {
            setError(err.message || "Error buscando rutas entre paradas");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mb-6">
            <form onSubmit={handleSearch} className="flex gap-2">
                <input
                    type="text"
                    value={palabraBusqueda}
                    onChange={(e) => setPalabraBusqueda(e.target.value)}
                    placeholder="Parada de inicio"
                    className="flex-1 border rounded-md p-2"
                />

                <input
                    type="text"
                    value={palabraBusqueda2}
                    onChange={(e) => setPalabraBusqueda2(e.target.value)}
                    placeholder="Parada de destino"
                    className="flex-1 border rounded-md p-2"
                />

                <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                    Buscar
                </button>
            </form>

            {loading && <p className="mt-3 text-gray-600">Buscando rutas en común :p</p>}
            {error && !loading && (
                <p className="mt-3 text-red-600">{error}</p>
            )}

            {!loading && results.length > 0 && (
                <div className="mt-4 p-4 border rounded-md bg-white">
                    <h3 className="font-semibold mb-2">Rutas que conectan ambas paradas:</h3>
                    <ul className="space-y-1 list-disc list-inside">
                        {results.map((r) => (
                            <li key={r.id}>
                                <a href={`/route/${r.id}`} className="text-blue-600 hover:underline">
                                    {r.label}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
