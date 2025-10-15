import { useEffect, useState } from "react";

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
    const [sugsA, setSugsA] = useState([]);
    const [sugsB, setSugsB] = useState([]);
    const [openSugsA, setOpenSugsA] = useState(false);
    const [openSugsB, setOpenSugsB] = useState(false);

    const baseURL = import.meta.env.PUBLIC_API_URL || "http://localhost:3000";

    const fetchCompareSites = async (a, b) => {
        const url = `${baseURL}/api/sites/compare?a=${encodeURIComponent(a)}&b=${encodeURIComponent(b)}`;
        const res = await fetch(url, { credentials: "include" });
        if (!res.ok) return { intersection: [], count: 0 };
        return res.json(); // { a, b, intersection, count }
    };

    const score = (q, s) => {
        const t = q.toLowerCase().split(/\s+/).filter(Boolean);
        const n = String(s?.nombre || s?.name || "").toLowerCase();
        let sc = 0;
        for (const k of t) if (n.includes(k)) sc += 1;
        return sc;
    };

    const pickBest = (q, arr, labelKey) => {
        if (!Array.isArray(arr) || arr.length === 0) return null;
        const withScore = arr.map((x) => ({ x, sc: score(q, x) }))
            .filter((it) => it.sc > 0);
        if (withScore.length === 0) return arr[0] || null;
        withScore.sort((a, b) => {
            if (b.sc !== a.sc) return b.sc - a.sc;
            const la = String(a.x[labelKey] || a.x.nombre || a.x.name || "").length;
            const lb = String(b.x[labelKey] || b.x.nombre || b.x.name || "").length;
            return la - lb;
        });
        return withScore[0].x;
    };

    const fetchStopByName = async (name) => {
        const url = `${baseURL}/api/stops/search?nombre=${encodeURIComponent(name)}`;
        const res = await fetch(url, { credentials: "include" });
        if (!res.ok) throw new Error(`No se pudo buscar la parada: ${name}`);
        const data = await res.json();
        const best = pickBest(name, Array.isArray(data) ? data : [], "nombre");
        return best || null;
    };

    const fetchSitesAll = async (name) => {
        const url = `${baseURL}/api/sites/search?nombre=${encodeURIComponent(name)}`;
        const res = await fetch(url, { credentials: "include" });
        if (!res.ok) return [];
        const arr = await res.json();
        return Array.isArray(arr) ? arr.map((s) => ({ nombre: s.name, routes: Array.isArray(s.route_ids) ? s.route_ids : [] })) : [];
    };

    const fetchStopsAll = async (name) => {
        const url = `${baseURL}/api/stops/search?nombre=${encodeURIComponent(name)}`;
        const res = await fetch(url, { credentials: "include" });
        if (!res.ok) return [];
        const arr = await res.json();
        return Array.isArray(arr) ? arr.map((s) => ({ nombre: s.nombre, routes: Array.isArray(s.routes) ? s.routes : [] })) : [];
    };

    const fetchSiteByName = async (name) => {
        const all = await fetchSitesAll(name);
        const best = pickBest(name, all, "nombre");
        return best || null;
    };

    const fetchRouteById = async (routeId) => {
        const res = await fetch(`${baseURL}/api/rutas/${routeId}`, { credentials: "include" });
        if (!res.ok) throw new Error(`Ruta ${routeId} no encontrada`);
        return res.json();
    };

    const dedupeByName = (items) => {
        const m = new Map();
        for (const it of items) {
            const key = String(it.nombre || "").toLowerCase();
            if (!m.has(key)) m.set(key, it);
            else {
                const prev = m.get(key);
                const ra = Array.isArray(prev.routes) ? prev.routes : [];
                const rb = Array.isArray(it.routes) ? it.routes : [];
                const merged = Array.from(new Set([...ra, ...rb]));
                m.set(key, { ...prev, routes: merged });
            }
        }
        return Array.from(m.values());
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        setError("");
        setResults([]);
        setLoading(true);

        try {
            if (onSearch) onSearch(palabraBusqueda, palabraBusqueda2);

            const a = palabraBusqueda.trim();
            const b = palabraBusqueda2.trim();

            // 1) Intentar primero con sitios (intersección directa)
            const cmp = await fetchCompareSites(a, b);
            if (Array.isArray(cmp?.intersection) && cmp.intersection.length > 0) {
                const detailed = await Promise.all(
                    cmp.intersection.map(async (rid) => {
                        try {
                            const r = await fetch(`${baseURL}/api/rutas/${rid}`, { credentials: "include" });
                            if (!r.ok) throw new Error();
                            const data = await r.json();
                            return { id: data.id ?? rid, label: data.label ?? `Ruta ${rid}` };
                        } catch {
                            return { id: rid, label: `Ruta ${rid}` };
                        }
                    })
                );
                setResults(detailed);
                return; // listo
            }

            // 2) Si no hubo intersección por sitios, usar flujo de paradas + fallback a site por cada punto
            const [stopA0, stopB0, siteA0, siteB0] = await Promise.all([
                fetchStopByName(a),
                fetchStopByName(b),
                fetchSiteByName(a),
                fetchSiteByName(b),
            ]);

            if (!stopA0 && !siteA0) throw new Error(`No se encontró la parada o sitio: "${nameA}"`);
            if (!stopB0 && !siteB0) throw new Error(`No se encontró la parada o sitio: "${nameB}"`);

            const norm = (arr) => Array.from(new Set((Array.isArray(arr) ? arr : []).map((n) => Number(n)).filter((n) => Number.isFinite(n))));

            const routesA = (stopA0 && norm(stopA0.routes).length > 0)
                ? norm(stopA0.routes)
                : norm(siteA0?.routes);

            const routesB = (stopB0 && norm(stopB0.routes).length > 0)
                ? norm(stopB0.routes)
                : norm(siteB0?.routes);

            const setB = new Set(routesB);
            const intersection = routesA.filter((r) => setB.has(r));

            if (intersection.length === 0) {
                setError("No hay rutas que conecten ambos puntos.");
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
            setError(err.message || "Error buscando rutas entre puntos");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mb-6">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
                <input
                    type="text"
                    value={palabraBusqueda}
                    onChange={(e) => { setPalabraBusqueda(e.target.value); setOpenSugsA(true); }}
                    placeholder="Parada o sitio de inicio"
                    className="flex-1 min-w-0 w-full sm:w-auto border rounded-md p-2"
                />

                <input
                    type="text"
                    value={palabraBusqueda2}
                    onChange={(e) => { setPalabraBusqueda2(e.target.value); setOpenSugsB(true); }}
                    placeholder="Parada o sitio de destino"
                    className="flex-1 min-w-0 w-full sm:w-auto border rounded-md p-2"
                />

                <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 w-full sm:w-auto"
                >
                    Buscar
                </button>
            </form>

            {loading && <p className="mt-3 text-gray-600">Buscando rutas en común…</p>}
            {error && !loading && (
                <p className="mt-3 text-red-600">{error}</p>
            )}

            {openSugsA && sugsA.length > 0 && (
                <div className="mt-2 border rounded-md bg-white shadow">
                    <ul className="max-h-48 overflow-auto">
                        {sugsA.map((s, i) => (
                            <li key={i} className="px-3 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => { setPalabraBusqueda(s.nombre); setOpenSugsA(false); }}>
                                {s.nombre}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {openSugsB && sugsB.length > 0 && (
                <div className="mt-2 border rounded-md bg-white shadow">
                    <ul className="max-h-48 overflow-auto">
                        {sugsB.map((s, i) => (
                            <li key={i} className="px-3 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => { setPalabraBusqueda2(s.nombre); setOpenSugsB(false); }}>
                                {s.nombre}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {!loading && results.length > 0 && (
                <div className="mt-4 p-4 border rounded-md bg-white">
                    <h3 className="font-semibold mb-2">Rutas que conectan ambos puntos:</h3>
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
