import React, { useEffect, useState } from "react";
import RouteActionsModal from "./RouteActionsModal.jsx"; // Asegúrate de importar el Modal

const RouteList = ({ palabraBusqueda, isAdmin, isLoggedIn, onSelectRoute, viewMode }) => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [prefs, setPrefs] = useState({ favoritos: [], ocultos: [] }); // Mantener prefs
  const [selectedRoute, setSelectedRoute] = useState(null); // Para acciones de admin

  // ------------------------------------------
  // LÓGICA 1: Fetch de Rutas (Unificada y Listado)
  // ------------------------------------------
  useEffect(() => {
    const fetchRoutes = async () => {
      setLoading(true);
      setError(null);

      const baseURL = import.meta.env.PUBLIC_API_URL || "http://localhost:3000";
      let url;

      if (palabraBusqueda) {
        // USAR ENDPOINT DE BÚSQUEDA UNIFICADA
        url = `${baseURL}/api/search/unified?q=${encodeURIComponent(palabraBusqueda)}`;
      } else {
        // USAR ENDPOINT DE LISTADO COMPLETO (cuando el buscador está vacío)
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

    // NOTA: Se ejecuta cada vez que 'palabraBusqueda' cambia (al teclear en SearchBar)
    fetchRoutes();
  }, [palabraBusqueda]);

  // ------------------------------------------
  // LÓGICA 2: Preferencias (Local Storage)
  // Se mantiene intacta para que los favoritos/ocultos funcionen
  // ------------------------------------------
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const storedPrefs = JSON.parse(localStorage.getItem(`prefs_${user.username}`) || '{"favoritos":[],"ocultos":[]}');
    setPrefs(storedPrefs);
  }, []);

  const savePrefs = (newPrefs) => {
    setPrefs(newPrefs);
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    localStorage.setItem(`prefs_${user.username}`, JSON.stringify(newPrefs));
  };

  const requireLogin = () => {
    alert("Debes iniciar sesión para usar esta función.");
  };

  const toggleFavorito = (id) => {
    if (!isLoggedIn) return requireLogin();
    if (prefs.favoritos.includes(id)) {
      const updated = { ...prefs, favoritos: prefs.favoritos.filter(f => f !== id) };
      savePrefs(updated);
    } else {
      const updated = {
        ...prefs,
        favoritos: [...prefs.favoritos, id],
        ocultos: prefs.ocultos.filter(o => o !== id),
      };
      savePrefs(updated);
    }
  };

  const toggleOculto = (id) => {
    if (!isLoggedIn) return requireLogin();
    if (prefs.ocultos.includes(id)) {
      const updated = { ...prefs, ocultos: prefs.ocultos.filter(o => o !== id) };
      savePrefs(updated);
    } else {
      const updated = {
        ...prefs,
        ocultos: [...prefs.ocultos, id],
        favoritos: prefs.favoritos.filter(f => f !== id),
      };
      savePrefs(updated);
    }
  };

  // ------------------------------------------
  // LÓGICA 3: Filtrado Final por ViewMode (sobre los resultados del server)
  // ------------------------------------------
  const visibleRoutes = routes.filter(r => {
    if (viewMode === "favoritos") return prefs.favoritos.includes(r.id) && !prefs.ocultos.includes(r.id);
    if (viewMode === "ocultos") return prefs.ocultos.includes(r.id);
    // Si viewMode es "all", muestra todas las rutas devueltas que NO estén ocultas
    return !prefs.ocultos.includes(r.id);
  });


  const handleClick = (route) => { // Eliminamos 'index' ya que no se usa
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

  if (loading) {
    return <p className="text-blue-600 font-semibold mt-4">Buscando rutas y actualizando listado...</p>;
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

  // El mapa final solo usa visibleRoutes
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
              {/* Botones de Favoritos y Ocultar (se detienen si se hace click sin ser admin) */}
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