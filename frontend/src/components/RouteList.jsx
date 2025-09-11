// src/components/RouteList.jsx
import { routes } from "../utils/mockData";

export default function RouteList() {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Rutas disponibles</h2>
      <ul className="space-y-2">
        {routes.map((r) => (
          <li
            key={r.id}
            className="p-3 bg-white rounded-md shadow hover:bg-gray-100"
          >
            <a href={`/route/${r.id}`} className="block">
              {r.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
