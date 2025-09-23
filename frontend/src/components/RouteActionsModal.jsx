import React from "react";

const RouteActionsModal = ({ route, onClose }) => {
    if (!route) return null; // 🔹 Si route es null, no renderizamos nada

    const handleAction = async (action) => {
        if (action === "ver") {
            // usamos el índice en vez de _id
            window.location.href = `/route/${route.index}`;
        } else if (action === "editar") {
            alert(`Editar ruta: ${route.label}`);
            // Aquí abrirías un formulario o modal de edición
        } else if (action === "eliminar") {
            const confirmar = confirm(
                `¿Seguro que deseas eliminar la ruta: ${route.label}?`
            );
            if (confirmar) {
                try {
                    // Preferimos el _id de Mongo si existe; si no, usamos el índice
                    const idToDelete = route._id ?? route.index;
                    if (idToDelete === undefined || idToDelete === null) {
                        throw new Error("No se encontró un identificador de la ruta para eliminar.");
                    }

                    const url = `/api/rutas/${encodeURIComponent(idToDelete)}`;
                    console.log("[DELETE rutas]", { url, idToDelete, hasMongoId: Boolean(route._id), index: route.index, route });

                    const res = await fetch(url, {
                        method: "DELETE",
                        credentials: "include",
                        headers: {
                            "Accept": "application/json",
                        },
                    });

                    if (!res.ok) {
                        let message = `Error al eliminar (HTTP ${res.status})`;
                        try {
                            const contentType = res.headers.get("content-type") || "";
                            if (contentType.includes("application/json")) {
                                const data = await res.json();
                                if (data?.message) message = data.message;
                            } else {
                                const text = await res.text();
                                if (text) message = `${message}: ${text}`;
                            }
                        } catch (e) {
                            console.warn("No se pudo leer el cuerpo de error del backend", e);
                        }
                        throw new Error(message);
                    }

                    alert(`Ruta eliminada: ${route.label}`);
                    // Recargar para actualizar el listado rápidamente
                    window.location.reload();
                } catch (err) {
                    console.error("Fallo al eliminar la ruta:", err);
                    alert(`No se pudo eliminar la ruta: ${err.message}`);
                }
            }
        }
        // Cerramos el modal tras completar la acción
        onClose();
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white p-6 rounded-2xl shadow-2xl w-80">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 text-center">
                    Acciones para {route.label}
                </h3>
                <div className="flex flex-col gap-3">
                    <button
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
                        onClick={() => handleAction("ver")}
                    >
                        Ver
                    </button>
                    <button
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
                        onClick={() => handleAction("editar")}
                    >
                        Editar
                    </button>
                    <button
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
                        onClick={() => handleAction("eliminar")}
                    >
                        Eliminar
                    </button>
                    <button
                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
                        onClick={onClose}
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>

    );
};

export default RouteActionsModal;
