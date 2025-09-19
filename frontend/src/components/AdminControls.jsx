export default function AdminControls() {
    return (
        <div className="gap-2 mb-4 flex">
            <button className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600">
                Agregar ruta
            </button>
            <button className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600">
                Eliminar ruta
            </button>
            <button className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600">
                Modificar ruta
            </button>
        </div>
    );
}
