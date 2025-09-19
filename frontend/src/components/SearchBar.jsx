import { useState } from "react";

export default function SearchBar({ onSearch }) {
    const [palabraBusqueda, setPalabraBusqueda] = useState("");

    const handleSearch = (e) => {
        e.preventDefault();
        onSearch(palabraBusqueda); // solo envía al dar clic en Buscar
    };

    return (
        <form onSubmit={handleSearch} className="mb-6 flex gap-2">
            <input
                type="text"
                value={palabraBusqueda}
                onChange={(e) => setPalabraBusqueda(e.target.value)}
                placeholder="Buscar una ruta..."
                className="flex-1 border rounded-md p-2"
            />
            <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
                Buscar
            </button>
        </form>
    );
}
