import React, { useEffect, useState, useCallback } from "react";
import RouteActionsModal from "./RouteActionsModal.jsx";

const RouteList = ({ palabraBusqueda, isAdmin, isLoggedIn, onSelectRoute, viewMode }) => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // [MODIFICACIÓN CLAVE] Inicializamos y manejamos la carga de preferencias
  const [prefs, setPrefs] = useState({ favoritos: [], ocultos: [] });
  const [isPrefsLoading, setIsPrefsLoading] = useState(true);

  const [selectedRoute, setSelectedRoute] = useState(null);

  // Función para obtener la URL base
  const getBaseUrl = useCallback(() =>
    import.meta.env?.PUBLIC_API_URL || "http://localhost:3000"
    , []);

  // ------------------------------------------
  // LÓGICA 1: Fetch de Rutas (Unificada y Listado) - Sin cambios importantes
  // ------------------------------------------
  useEffect(() => {
    const fetchRoutes = async () => {
      setLoading(true);
      setError(null);

      const baseURL = getBaseUrl();
      let url;

      if (palabraBusqueda) {
        url = `${baseURL}/api/search/unified?q=${encodeURIComponent(palabraBusqueda)}`;
      } else {
        url = `${baseURL}/api/rutas/listado`;
      }

      try {
        const res = await fetch(url, { credentials: "include" });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Error al cargar las rutas.");
        }

        const data = await res.json();
        setRoutes(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching routes:", err);
        setError(err.message || "Error de red al cargar las rutas.");
        setRoutes([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRoutes();
  }, [palabraBusqueda, getBaseUrl]);

  // ------------------------------------------
  // LÓGICA 2: MIGRACIÓN A BACKEND (CARGA DE PREFERENCIAS)
  // ------------------------------------------

  // Función para obtener preferencias del servidor (se usa en el useEffect y en caso de error)
  const fetchPrefsFromBackend = useCallback(async () => {
    if (!isLoggedIn) {
      setPrefs({ favoritos: [], ocultos: [] });
      setIsPrefsLoading(false);
      return;
    }

    const baseURL = getBaseUrl();
    setIsPrefsLoading(true);
    try {
      // LLAMADA AL NUEVO ENDPOINT PROTEGIDO
      const res = await fetch(`${baseURL}/api/user/prefs`, { credentials: "include" });
      if (!res.ok) {
        // Si el token expira o hay error, asume sin preferencias
        setPrefs({ favoritos: [], ocultos: [] });
        return;
      }

      const data = await res.json();
      setPrefs({
        favoritos: Array.isArray(data.favoritos) ? data.favoritos : [],
        ocultos: Array.isArray(data.ocultos) ? data.ocultos : [],
      });
    } catch (err) {
      console.error("Error al cargar preferencias desde el servidor:", err);
      setPrefs({ favoritos: [], ocultos: [] });
    } finally {
      setIsPrefsLoading(false);
    }
  }, [isLoggedIn, getBaseUrl]);

  // Ejecutar la carga de preferencias al iniciar sesión
  useEffect(() => {
    fetchPrefsFromBackend();
  }, [isLoggedIn, fetchPrefsFromBackend]);


  // ------------------------------------------
  // LÓGICA 3: MIGRACIÓN A BACKEND (TOGGLE DE PREFERENCIAS)
  // ------------------------------------------

  const requireLogin = () => {
    alert("Debes iniciar sesión para usar esta función.");
  };

  // [MODIFICACIÓN CLAVE]: Función unificada para enviar el cambio al Backend
  const togglePref = async (routeId, list) => {
    if (!isLoggedIn) return requireLogin();

    // 1. DETERMINAR ACCIÓN Y HACER ACTUALIZACIÓN OPTIMISTA (Mejora la UX)
    const isAdding = !prefs[list].includes(routeId);

    // Clonar estado para revertir en caso de fallo
    const originalPrefs = prefs;

    const currentPrefs = { ...prefs };
    const opposingList = list === 'favoritos' ? 'ocultos' : 'favoritos';

    // Aplicar cambio optimista en el frontend
    if (isAdding) {
      currentPrefs[list] = [...currentPrefs[list], routeId];
      currentPrefs[opposingList] = currentPrefs[opposingList].filter(id => id !== routeId);
    } else {
      currentPrefs[list] = currentPrefs[list].filter(id => id !== routeId);
    }
    setPrefs(currentPrefs);

    // 2. LLAMADA AL BACKEND PARA PERSISTIR
    const baseURL = getBaseUrl();
    try {
      const res = await fetch(`${baseURL}/api/user/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          route_id: routeId, // 👈 ¡CORREGIDO! Antes era 'routeId'
          type: list,        // 👈 ¡CORREGIDO! Antes era 'list'
          // Ya no es necesario enviar 'action'
        }),
      });
      if (res.status === 401 || res.status === 403) {
        // [NUEVO MANEJO DE ERROR]: Si el servidor dice que la sesión es inválida
        alert("Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.");
        localStorage.removeItem("user"); // Limpia el estado local obsoleto
        window.location.reload(); // Recarga para forzar el logout visual
        return;
      }

      if (!res.ok) {
        // [MODIFICACIÓN CLAVE]: Eliminamos la lógica de cerrar sesión, solo notificamos
        if (res.status === 401 || res.status === 403) {
          // El servidor rechaza el token. Solo notificamos y revertimos el estado visual.
          alert("No se pudo guardar. La sesión no está siendo reconocida por el servidor. Por favor, recarga la página e intenta de nuevo.");
        }
        throw new Error("El servidor no pudo guardar la preferencia.");
      }

      // ... (Si tiene éxito, el estado ya es el correcto)
    } catch (err) {
      console.error("Fallo al guardar en el servidor:", err);
      alert("Error: No se pudo guardar la preferencia en la nube. Revertiendo cambios.");
      setPrefs(originalPrefs);
    }
  };




  // Handlers wrapper (Ahora llaman a togglePref)
  const toggleFavorito = (id) => togglePref(id, 'favoritos');
  const toggleOculto = (id) => togglePref(id, 'ocultos');

  // ------------------------------------------
  // LÓGICA 4: Renderizado y Filtros
  // ------------------------------------------

  // El filtro de preferencias permanece sin cambios, ahora opera sobre los datos del backend
  const visibleRoutes = routes.filter(r => {
    if (viewMode === "favoritos") return prefs.favoritos.includes(r.id) && !prefs.ocultos.includes(r.id);
    if (viewMode === "ocultos") return prefs.ocultos.includes(r.id);
    return !prefs.ocultos.includes(r.id);
  });


  const handleClick = (route) => {
    if (isAdmin) {
      setSelectedRoute(route);
    } else {
      if (route.id === undefined || route.id === null) {
        alert("Esta ruta no tiene 'id'.");
        return;
      }
      window.location.href = `/route/${route.id}`;
    }
  };

  if (loading || isPrefsLoading) {
    return <p className="text-blue-600 font-semibold mt-4">Cargando rutas y sincronizando preferencias...</p>;
  }

  if (error) {
    return <p className="mt-4 text-red-600 font-semibold">❌ {error}</p>;
  }

  if (visibleRoutes.length === 0) {
    return (
      <p className="mt-4 text-gray-600">
        {palabraBusqueda ? `No se encontraron resultados para "${palabraBusqueda}"` : "No hay rutas disponibles en este modo de vista."}
      </p>
    );
  }

  // Renderizado final
  return (
    <div className="w-full p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        {palabraBusqueda ? `Resultados para "${palabraBusqueda}"` : "Rutas disponibles"}
      </h2>

      <ul className="space-y-3">
        {visibleRoutes.map((route) => (
          <li
            key={route.id}
            onClick={() => handleClick(route)}
            className={`flex justify-between items-center px-4 py-2 rounded-lg shadow-sm transition-colors duration-200 text-gray-700 font-medium cursor-pointer ${isAdmin ? "hover:bg-blue-100 hover:text-blue-700" : "hover:bg-gray-100 hover:text-gray-800"}`}
          >
            <span>
              {prefs.favoritos.includes(route.id) ? "⭐ " : ""}
              {route.label || "Ruta sin nombre"}
            </span>
            <div className="flex gap-2">
              {/* Botones de Favoritos y Ocultar */}
              <button
                onClick={(e) => { e.stopPropagation(); toggleFavorito(route.id); }}
                className={`text-yellow-500 hover:text-yellow-700 ${prefs.favoritos.includes(route.id) ? "font-bold" : ""}`}
              >
                ⭐
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); toggleOculto(route.id); }}
                className={`text-red-500 hover:text-red-700 ${prefs.ocultos.includes(route.id) ? "font-bold" : ""}`}
              >
                🚫
              </button>
            </div>
          </li>
        ))}
      </ul>

      {isAdmin && selectedRoute && (
        <RouteActionsModal route={selectedRoute} onClose={() => setSelectedRoute(null)} />
      )}
    </div>
  );
};

export default RouteList;