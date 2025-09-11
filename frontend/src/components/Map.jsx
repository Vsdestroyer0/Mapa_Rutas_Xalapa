import { useEffect } from "react";
import "leaflet/dist/leaflet.css";

export default function Map() { //retorna el div con mapa
    useEffect(() => { //se ejecuta cuando el componente cambia

        import("leaflet").then(L => {
            const map = L.map("map").setView([19.553792519503695, -96.91853384513733], 15); //crea el mapa con id map para que sepa en que div poner el mapa, y dala posicion inicial.

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: '&copy; OpenStreetMap contributors',
            }).addTo(map); //titlelayer es la imagenes del mapa

            L.marker([19.553792519503695, -96.91853384513733]) //crear marcador en posicion
                .addTo(map) //agregar al mapa
                .bindPopup("¡Hola! Este es un marcador en  xalapa")//agregar popup al marcador
        });
    }, []);

    return (
        <div id="map" style={{ height: "500px", width: "100%" }}>

        </div>

    );
}
