import { useEffect, useState } from "react";

export default function RouteList() {
  const [routes, setRoutes] = useState([]); //estado para almacenar las rutas, esto es un hook de react, setroutes es la funcion que actualiza el dato, routes es el dato en si. 

  useEffect(() => {
    // Trae solo los datos necesarios para listar rutas

   fetch("/api/rutas/listado", { credentials: "include" })

      .then(res => res.json()) //res es la respuesta del backend, res.json() convierte esa respuesta en un objeto json, solo nos sirve para confirmar que la respuesta es correcta ya que res no se usa despues
      .then(data => setRoutes(data)) //aqui data es el array de rutas que viene del backend, esa data se la pasamos a setRoutes para actualizar el estado de routes
      .catch(err => console.error(err));
  }, []);
  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Rutas disponibles</h2>
      <ul className="space-y-3">
        {routes.map((r, index) => (
          <li key={r._id}> {/* usamos el _id de la bd que proporciona mongo para un mejor renderizado y el index para manejar las rutas (0,1,2,3,4) */}
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

