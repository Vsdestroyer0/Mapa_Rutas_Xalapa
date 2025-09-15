import { useEffect, useState } from "react";

export default function RouteList() {
  const [routes, setRoutes] = useState([]);

  useEffect(() => {
    // Trae solo los datos necesarios para listar rutas

    fetch("/api/rutas/listado", { credentials: "include" })

      .then(res => res.json())
      .then(data => setRoutes(data))
      .catch(err => console.error(err));
  }, []);
  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Rutas disponibles</h2>
      <ul className="space-y-3">
        {routes.map((r, index) => (
          <li key={r._id}>
            <a
              href={`/route/${index}`}
              className="block px-4 py-2 rounded-lg hover:bg-blue-100 hover:text-blue-700 transition-colors duration-200 text-gray-700 font-medium shadow-sm"
            >
              {r.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

