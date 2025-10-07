import React, { useEffect, useMemo, useState } from "react";

/**
 * Componente para editar una Ruta existente usando TU id numérico (no _id de Mongo).
 * - Igual UX que `addRuta.jsx`, pero precarga y hace PUT a /api/rutas/:id
 */
export default function EditRuta({ open = true, routeId, onClose = () => { }, onUpdated = () => { } }) {
  const [id, setId] = useState("");
  const [label, setLabel] = useState("");
  const [type, setType] = useState("line"); // 'line' | 'circuit'
  const [color, setColor] = useState("#2563eb");
  const [points, setPoints] = useState([]); // [[lat, lng], ...]
  const [stops, setStops] = useState([]); // [{ coordenas:[lat,lng], nombre }]

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  // Modales
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [showStopsModal, setShowStopsModal] = useState(false);

  // Helpers para points modal
  const [tempPointLat, setTempPointLat] = useState("");
  const [tempPointLng, setTempPointLng] = useState("");

  // Helpers para stops modal
  const [stopQuery, setStopQuery] = useState("");
  const [stopResults, setStopResults] = useState([]);
  const [loadingStops, setLoadingStops] = useState(false);
  const [stopError, setStopError] = useState("");

  useEffect(() => {
    let ignore = false;
    async function fetchRoute() {
      setError("");
      setLoading(true);
      try {
        if (routeId === undefined || routeId === null) throw new Error("Falta routeId");
        const baseURL = import.meta.env.PUBLIC_API_URL;
        const res = await fetch(`${baseURL}/api/rutas/${encodeURIComponent(routeId)}`, { credentials: "include" });
        if (!res.ok) throw new Error(`Error cargando ruta (HTTP ${res.status})`);
        const data = await res.json();
        if (ignore) return;
        setId(String(data?.id ?? ""));
        setLabel(String(data?.label ?? ""));
        setType(String(data?.type ?? "line"));
        setColor(String(data?.color ?? "#2563eb"));
        setPoints(Array.isArray(data?.points) ? data.points : []);
        setStops(Array.isArray(data?.stops) ? data.stops : []);
      } catch (e) {
        setError(e.message || "No se pudo cargar la ruta");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    if (open) fetchRoute();
    return () => { ignore = true; };
  }, [open, routeId]);

  useEffect(() => {
    if (!open) {
      setError("");
      setOkMsg("");
    }
  }, [open]);

  const canSave = useMemo(() => {
    return (
      String(label).trim() !== "" &&
      (type === "line" || type === "circuit") &&
      /^#([0-9a-fA-F]{3}){1,2}([0-9a-fA-F]{2})?$/.test(color)
    );
  }, [label, type, color]);

  const addPoint = () => {
    const lat = parseFloat(String(tempPointLat).replace(",", "."));
    const lng = parseFloat(String(tempPointLng).replace(",", "."));
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    setPoints((prev) => [...prev, [lat, lng]]);
    setTempPointLat("");
    setTempPointLng("");
  };

  const removePoint = (idx) => {
    setPoints((prev) => prev.filter((_, i) => i !== idx));
  };

  const movePoint = (idx, dir) => {
    setPoints((prev) => {
      const arr = [...prev];
      const j = idx + dir;
      if (j < 0 || j >= arr.length) return arr;
      const tmp = arr[idx];
      arr[idx] = arr[j];
      arr[j] = tmp;
      return arr;
    });
  };

  const onSearchStops = async () => {
    setStopError("");
    setStopResults([]);
    const q = stopQuery.trim();
    if (!q) return;
    setLoadingStops(true);
    try {
      const baseURL = import.meta.env.PUBLIC_API_URL;
      const res = await fetch(`${baseURL}/api/stops/search?nombre=${encodeURIComponent(q)}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Error buscando paradas (${res.status})`);
      const data = await res.json();
      setStopResults(Array.isArray(data) ? data : []);
    } catch (e) {
      setStopError(e.message || "Error buscando paradas");
    } finally {
      setLoadingStops(false);
    }
  };

  const addStopFromResult = (s) => {
    let latLng = null;
    if (Array.isArray(s?.coordenas)) {
      const [lat, lng] = s.coordenas;
      if (Number.isFinite(lat) && Number.isFinite(lng)) latLng = [lat, lng];
    } else if (s?.coordenas?.type === "Point" && Array.isArray(s?.coordenas?.coordinates)) {
      const [lng, lat] = s.coordenas.coordinates;
      if (Number.isFinite(lat) && Number.isFinite(lng)) latLng = [lat, lng];
    }
    if (!latLng) return;
    const nombre = s?.nombre || "Parada";
    setStops((prev) => [...prev, { coordenas: latLng, nombre }]);
  };

  const removeStop = (idx) => {
    setStops((prev) => prev.filter((_, i) => i !== idx));
  };

  const submit = async () => {
    setError("");
    setOkMsg("");
    if (!canSave) {
      setError("Completa los campos requeridos correctamente.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        id: Number(id),
        label: String(label).trim(),
        type: String(type),
        color: String(color),
        points,
        stops,
        images: [`bus_${Number(id)}`],
      };
      const baseURL = import.meta.env.PUBLIC_API_URL;
      const url = `${baseURL}/api/rutas/${encodeURIComponent(id)}`;
      const res = await fetch(url, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        let message = `Error guardando (HTTP ${res.status})`;
        try {
          const ct = res.headers.get("content-type") || "";
          if (ct.includes("application/json")) {
            const data = await res.json();
            if (data?.message) message = data.message;
          } else {
            const text = await res.text();
            if (text) message = `${message}: ${text}`;
          }
        } catch { }
        throw new Error(message);
      }
      setOkMsg("Ruta actualizada correctamente.");
      if (typeof onUpdated === "function") onUpdated();
    } catch (e) {
      setError(e.message || "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* overlay */}
      <div className="flex-1 bg-black/40" onClick={onClose} />

      {/* drawer derecho */}
      <div className="w-full max-w-xl bg-white h-full shadow-xl p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Editar ruta</h2>
          <button onClick={() => window.location.href = "/"} className="text-gray-600 hover:text-gray-900">✕</button>
        </div>

        {loading && <div className="mb-3 text-sm text-gray-600">Cargando…</div>}
        {error && (
          <div className="mb-3 rounded-md bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>
        )}
        {okMsg && (
          <div className="mb-3 rounded-md bg-green-50 text-green-700 px-3 py-2 text-sm">{okMsg}</div>
        )}

        {!loading && (
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">ID (numérico propio)</label>
              <input
                type="number"
                value={id}
                onChange={(e) => setId(e.target.value)}
                className="mt-1 w-full border rounded-md p-2 bg-gray-50"
                placeholder="Ej. 101"
                disabled
                title="El ID no se puede cambiar"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre (label)</label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="mt-1 w-full border rounded-md p-2"
                placeholder="Ej. Arco Sur - Centro"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Tipo</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="mt-1 w-full border rounded-md p-2 bg-white"
                >
                  <option value="line">line</option>
                  <option value="circuit">circuit</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Color</label>
                <div className="mt-1 flex items-center gap-2 flex-wrap">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-8 h-8 rounded border-2 border-gray-200 cursor-pointer flex-shrink-0"
                    title="Selecciona color"
                  />
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="flex-1 min-w-0 border rounded-md p-2 text-sm"
                    placeholder="#dc2626"
                  />
                </div>
              </div>
            </div>

            {/* Points */}
            <div className="border rounded-lg p-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Puntos del recorrido (points)</h3>
                <button
                  type="button"
                  onClick={() => setShowPointsModal(true)}
                  className="px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                >
                  Editar puntos
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">{points.length} puntos</p>
              {points.length > 0 && (
                <div className="mt-2 max-h-40 overflow-auto text-sm">
                  {points.map((p, i) => (
                    <div key={i} className="flex items-center justify-between py-1">
                      <span className="font-mono">[{p[0].toFixed(6)}, {p[1].toFixed(6)}]</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => movePoint(i, -1)} className="text-xs px-2 py-1 rounded bg-gray-100">↑</button>
                        <button onClick={() => movePoint(i, +1)} className="text-xs px-2 py-1 rounded bg-gray-100">↓</button>
                        <button onClick={() => removePoint(i)} className="text-xs px-2 py-1 rounded bg-red-100 text-red-700">Eliminar</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Stops */}
            <div className="border rounded-lg p-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Paradas (stops)</h3>
                <button
                  type="button"
                  onClick={() => setShowStopsModal(true)}
                  className="px-3 py-1.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  Agregar paradas
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">{stops.length} paradas</p>
              {stops.length > 0 && (
                <div className="mt-2 max-h-48 overflow-auto text-sm">
                  {stops.map((s, i) => (
                    <div key={i} className="flex items-center justify-between py-1">
                      <div>
                        <div className="font-medium">{s.nombre || "Parada"}</div>
                        <div className="font-mono text-gray-600">[{s.coordenas?.[0]?.toFixed?.(6)}, {s.coordenas?.[1]?.toFixed?.(6)}]</div>
                      </div>
                      <button onClick={() => removeStop(i)} className="text-xs px-2 py-1 rounded bg-red-100 text-red-700">Quitar</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 mt-2">
              <button className="px-4 py-2 rounded-md border" onClick={() => window.location.href = "/"}>Cancelar</button>
              <button
                disabled={!canSave || saving}
                onClick={submit}
                className={`px-4 py-2 rounded-md text-white ${canSave ? "bg-yellow-600 hover:bg-yellow-700" : "bg-gray-400"}`}
              >
                {saving ? "Guardando..." : "Actualizar ruta"}
              </button>
            </div>
          </div>
        )}

        {/* Modal Points */}
        {showPointsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white w-full max-w-2xl rounded-lg shadow-xl p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Editar puntos (lat, lng)</h3>
                <button onClick={() => setShowPointsModal(false)} className="text-gray-500">✕</button>
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tempPointLat}
                    onChange={(e) => setTempPointLat(e.target.value)}
                    placeholder="Latitud"
                    className="flex-1 border rounded-md p-2"
                  />
                  <input
                    type="text"
                    value={tempPointLng}
                    onChange={(e) => setTempPointLng(e.target.value)}
                    placeholder="Longitud"
                    className="flex-1 border rounded-md p-2"
                  />
                  <button onClick={addPoint} className="px-3 py-2 rounded-md bg-blue-600 text-white">Añadir</button>
                </div>
                {points.length > 0 && (
                  <div className="border rounded-md max-h-64 overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left p-2">#</th>
                          <th className="text-left p-2">Lat</th>
                          <th className="text-left p-2">Lng</th>
                          <th className="text-left p-2">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {points.map((p, i) => (
                          <tr key={i} className="border-t">
                            <td className="p-2">{i + 1}</td>
                            <td className="p-2 font-mono">{p[0]}</td>
                            <td className="p-2 font-mono">{p[1]}</td>
                            <td className="p-2">
                              <div className="flex gap-2">
                                <button onClick={() => movePoint(i, -1)} className="px-2 py-1 text-xs rounded bg-gray-100">↑</button>
                                <button onClick={() => movePoint(i, +1)} className="px-2 py-1 text-xs rounded bg-gray-100">↓</button>
                                <button onClick={() => removePoint(i)} className="px-2 py-1 text-xs rounded bg-red-100 text-red-700">Eliminar</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="mt-4 text-right">
                <button onClick={() => setShowPointsModal(false)} className="px-4 py-2 rounded-md border">Cerrar</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Stops */}
        {showStopsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white w-full max-w-3xl rounded-lg shadow-xl p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Agregar paradas</h3>
                <button onClick={() => setShowStopsModal(false)} className="text-gray-500">✕</button>
              </div>
              <div className="mt-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={stopQuery}
                    onChange={(e) => setStopQuery(e.target.value)}
                    placeholder="Buscar por nombre (ej. Plaza Americas)"
                    className="flex-1 border rounded-md p-2"
                  />
                  <button onClick={onSearchStops} className="px-3 py-2 rounded-md bg-indigo-600 text-white">Buscar</button>
                </div>
                {loadingStops && <p className="text-sm text-gray-600 mt-2">Buscando…</p>}
                {stopError && <p className="text-sm text-red-600 mt-2">{stopError}</p>}
                <div className="mt-3 max-h-72 overflow-auto border rounded-md">
                  {stopResults.length === 0 && !loadingStops ? (
                    <p className="p-3 text-gray-500 text-sm">Sin resultados</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left p-2">Nombre</th>
                          <th className="text-left p-2">Coordenadas</th>
                          <th className="text-left p-2">Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stopResults.map((s, i) => {
                          let latLngText = "";
                          if (Array.isArray(s?.coordenas)) {
                            latLngText = `[${s.coordenas[0]?.toFixed?.(6)}, ${s.coordenas[1]?.toFixed?.(6)}]`;
                          } else if (s?.coordenas?.type === "Point") {
                            const [lng, lat] = s.coordenas.coordinates || [];
                            latLngText = `[${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}]`;
                          }
                          return (
                            <tr key={i} className="border-t">
                              <td className="p-2">{s.nombre}</td>
                              <td className="p-2 font-mono">{latLngText}</td>
                              <td className="p-2">
                                <button
                                  onClick={() => addStopFromResult(s)}
                                  className="px-2 py-1 rounded bg-green-600 text-white text-xs"
                                >
                                  Añadir
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
                {stops.length > 0 && (
                  <div className="mt-3">
                    <h4 className="font-medium mb-2">Paradas seleccionadas</h4>
                    <div className="border rounded-md max-h-40 overflow-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left p-2">Nombre</th>
                            <th className="text-left p-2">Coordenas</th>
                            <th className="text-left p-2">Acción</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stops.map((s, i) => (
                            <tr key={i} className="border-t">
                              <td className="p-2">{s.nombre}</td>
                              <td className="p-2 font-mono">[{s.coordenas?.[0]}, {s.coordenas?.[1]}]</td>
                              <td className="p-2">
                                <button onClick={() => removeStop(i)} className="px-2 py-1 rounded bg-red-100 text-red-700 text-xs">Quitar</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-4 text-right">
                <button onClick={() => setShowStopsModal(false)} className="px-4 py-2 rounded-md border">Cerrar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
