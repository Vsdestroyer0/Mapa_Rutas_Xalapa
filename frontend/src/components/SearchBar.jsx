import { useState } from "react";

export default function SearchBar({ onSearch }) {
    const [palabraBusqueda, setPalabraBusqueda] = useState("");

    // Nota: Eliminamos el botón de submit para buscar en tiempo real mientras se escribe.
    const handleInputChange = (e) => {
        const value = e.target.value;
        setPalabraBusqueda(value);
        // Enviamos la palabra de búsqueda al componente padre (RouteManager)
        onSearch(value);
    };

    return (
        <div className="mb-6">
            <input
                type="text"
                value={palabraBusqueda}
                onChange={handleInputChange}
                placeholder="Buscar rutas, paradas o sitios importantes..."
                className="w-full border rounded-md p-2 flex-1"
            />
        </div>
    );
}