import { useState, useRef, useCallback } from "react"; // Importar useRef y useCallback

export default function SearchBar({ onSearch }) {
    const [palabraBusqueda, setPalabraBusqueda] = useState("");
    //  useRef para mantener la referencia al temporizador entre renders
    const debounceTimeout = useRef(null);

    // Función que envuelve la llamada a onSearch y aplica el retraso
    const debouncedOnSearch = useCallback((value) => {
        // 1. Limpia cualquier temporizador pendiente si el usuario sigue tecleando
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }

        // 2. Establece un nuevo temporizador
        // La búsqueda solo se ejecuta si no hay otra pulsación en 300ms
        debounceTimeout.current = setTimeout(() => {
            onSearch(value);
        }, 300);
    }, [onSearch]);


    const handleInputChange = (e) => {
        const value = e.target.value;
        setPalabraBusqueda(value);

        // 3. Llama a la función con retraso en lugar de llamar a onSearch directamente
        debouncedOnSearch(value);
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