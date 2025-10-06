import React, { useEffect, useState } from "react";

const RouteList = ({ palabraBusqueda, isAdmin, onSelectRoute, viewMode }) => {
  const [routes, setRoutes] = useState([]);
  const [error, setError] = useState(null);
  const [prefs, setPrefs] = useState({ favoritos: [], ocultos: [] });

  // Cargar rutas desde API
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const res = await fetch(`${import.meta.env.PUBLIC_API_URL}/api/rutas/listado`, { credentials: "include" });
        if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setRoutes(data);
          setError(null);
        } else throw new Error("La respuesta no es un array");
      } catch (err) {
        console.error("Error cargando rutas:", err);
        setError("No se pudieron cargar las rutas.");
        setRoutes([]);
      }
    };
    fetchRoutes();
  }, []);

  // Cargar preferencias del usuario desde localStorage
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const storedPrefs = JSON.parse(localStorage.getItem(`prefs_${user.username}`) || '{"favoritos":[],"ocultos":[]}');
    setPrefs(storedPrefs);
  }, []);

  // Guardar preferencias en localStorage
  const savePrefs = (newPrefs) => {
    setPrefs(newPrefs);
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    localStorage.setItem(`prefs_${user.username}`, JSON.stringify(newPrefs));
  };

  const toggleFavorito = (id) => {
    // Si ya está en favoritos, la quitamos
    if (prefs.favoritos.includes(id)) {
      const updated = {
        ...prefs,
        favoritos: prefs.favoritos.filter(f => f !== id)
      };
      setPrefs(updated);
      savePrefs(updated);
    } else {
      // Si está en ocultos, la sacamos de ocultos
      let newOcultos = prefs.ocultos.filter(o => o !== id);

      const updated = {
        ...prefs,
        favoritos: [...prefs.favoritos, id],
        ocultos: newOcultos
      };
      setPrefs(updated);
      savePrefs(updated);
    }
  };

  const toggleOculto = (id) => {
    // Si ya está en ocultos, la quitamos
    if (prefs.ocultos.includes(id)) {
      const updated = {
        ...prefs,
        ocultos: prefs.ocultos.filter(o => o !== id)
      };
      setPrefs(updated);
      savePrefs(updated);
    } else {
      // Si está en favoritos, la sacamos de favoritos
      let newFavoritos = prefs.favoritos.filter(f => f !== id);

      const updated = {
        ...prefs,
        ocultos: [...prefs.ocultos, id],
        favoritos: newFavoritos
      };
      setPrefs(updated);
      savePrefs(updated);
    }
  };



  // Filtrar rutas según viewMode
  const visibleRoutes = routes.filter(r => {
    if (viewMode === "favoritos") {
      return prefs.favoritos.includes(r.id) && !prefs.ocultos.includes(r.id);
    }
    if (viewMode === "ocultos") {
      return prefs.ocultos.includes(r.id);
    }
    // viewMode === "all"
    return !prefs.ocultos.includes(r.id);
  });


  // Filtrar por palabra de búsqueda
  const filteredRoutes = palabraBusqueda
    ? visibleRoutes.filter(r =>
      r.label.toLowerCase().includes(palabraBusqueda.toLowerCase())
    )
    : visibleRoutes;

  const handleClick = (route, index) => {
    if (isAdmin) {
      onSelectRoute({ ...route, index });
    } else {
      if (route.id === undefined || route.id === null) {
        alert("Esta ruta no tiene 'id'. Pide al backend incluir 'id' en /api/rutas/listado.");
        return;
      }
      window.location.href = `/route/${route.id}`;
    }
  };

  return (
    <div className="w-full p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Rutas disponibles</h2>
      {error && <p className="text-red-500">{error}</p>}
      {filteredRoutes.length === 0 && !error && (
        <p className="text-gray-500">No se encontraron rutas</p>
      )}
      <ul className="space-y-3">
        {filteredRoutes.map((route, index) => (
          <li
            key={route.id ?? index}
            onClick={() => handleClick(route, index)}
            className={`flex justify-between items-center px-4 py-2 rounded-lg shadow-sm transition-colors duration-200 text-gray-700 font-medium cursor-pointer ${isAdmin
              ? "hover:bg-blue-100 hover:text-blue-700"
              : "hover:bg-gray-100 hover:text-gray-800"
              }`}
          >
            <span>
              {prefs.favoritos.includes(route.id) ? "⭐ " : ""}
              {route.label || "Ruta sin nombre"}
            </span>
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorito(route.id);
                }}
                className={`text-yellow-500 hover:text-yellow-700 ${prefs.favoritos.includes(route.id) ? "font-bold" : ""
                  }`}
              >
                ⭐
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleOculto(route.id);
                }}
                className={`text-red-500 hover:text-red-700 ${prefs.ocultos.includes(route.id) ? "font-bold" : ""
                  }`}
              >
                🚫
              </button>
            </div>


          </li>
        ))}
      </ul>
    </div>
  );
};

export default RouteList;

/* import { useEffect, useState } from "react";

export default function RouteList({ palabraBusqueda }) {
  const [routes, setRoutes] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        let url = "/api/rutas/listado";
        if (palabraBusqueda?.trim()) {
          url = `/api/rutas/busqueda?palabra=${encodeURIComponent(palabraBusqueda)}`;
        }

        const res = await fetch(url, { credentials: "include" });

        if (!res.ok) {
          throw new Error(`Error ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();

        if (Array.isArray(data)) {
          setRoutes(data);
          setError(null);
        } else {
          throw new Error("La respuesta no es un array");
        }
      } catch (err) {
        console.error("Error cargando rutas:", err);
        setError("No se pudieron cargar las rutas.");
        setRoutes([]); // vaciamos para evitar romper el map
      }
    };

    fetchRoutes();
  }, [palabraBusqueda]);

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Rutas disponibles</h2>

      {error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <ul className="space-y-3">
          {routes.map((r, index) => (
            <li key={r._id || index}>
              <a
                href={`/route/${index}`}
                className="block px-4 py-2 rounded-lg hover:bg-blue-100 hover:text-blue-700 transition-colors duration-200 text-gray-700 font-medium shadow-sm"
              >
                {r.label || "Ruta sin nombre"}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
 */