import React, { useEffect, useState } from "react";

const RouteList = ({ palabraBusqueda, isAdmin, onSelectRoute }) => {
  const [routes, setRoutes] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const res = await fetch("/api/rutas/listado", { credentials: "include" });
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

  const filteredRoutes = palabraBusqueda
    ? routes.filter((r) =>
      r.label.toLowerCase().includes(palabraBusqueda.toLowerCase())
    )
    : routes;

  const handleClick = (route, index) => {
    if (isAdmin) {
      onSelectRoute({ ...route, index });
    } else {
      window.location.href = `/route/${index}`;
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Rutas disponibles</h2>
      {error && <p className="text-red-500">{error}</p>}
      {filteredRoutes.length === 0 && !error && (
        <p className="text-gray-500">No se encontraron rutas</p>
      )}
      <ul className="space-y-3">
        {filteredRoutes.map((route, index) => (
          <li
            key={route._id || index}
            onClick={() => handleClick(route, index)}
            className={`block px-4 py-2 rounded-lg shadow-sm transition-colors duration-200 text-gray-700 font-medium cursor-pointer ${isAdmin
                ? "hover:bg-blue-100 hover:text-blue-700"
                : "hover:bg-gray-100 hover:text-gray-800"
              }`}
          >
            {route.label || "Ruta sin nombre"}
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