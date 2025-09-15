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

    <div >
      <h2 className="text-xl font-bold mb-4">Rutas disponibles</h2>
      <ul className="space-y-2">
        {routes.map((r, index) => (
          <li key={r._id}>
            <a href={`/route/${index}`}>
              {r.label}
            </a>
          </li>
        ))}

      </ul>
    </div >
  );
}
