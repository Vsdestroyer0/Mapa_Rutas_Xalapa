
export default function RouteCard({ route }) {
    return (
        <div style={{ border: "1px solid gray", margin: "10px", padding: "10px" }}>
            <h3>{route.name}</h3>
            <p>Paradas: {route.stops.length}</p>
            <p>Tiempo aproximado: {route.timeApprox}</p>
            <p>{route.safeForWomen ? "Ruta Mujer Segura ✅" : "Ruta normal"}</p>

            {/* Enlace a la ruta dinámica */}
            <a href={`/route/${route.id}`} style={{ color: "blue", textDecoration: "underline" }}>
                Ver detalles
            </a>
        </div>
    );
}
