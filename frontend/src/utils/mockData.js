// src/utils/mockData.js
export const routes = [
    {
        id: 1,
        name: "Ruta Centro-Xalapa",
        stops: [
            { name: "Parada 1", lat: 19.543, lng: -96.923 },
            { name: "Parada 2", lat: 19.546, lng: -96.921 },
            { name: "Parada 3", lat: 19.550, lng: -96.919 },
        ],
        timeApprox: "30 min",
        safeForWomen: true,
        busImage: "/images/bus1.jpg",
    },
    {
        id: 2,
        name: "Ruta Universidad",
        stops: [
            { name: "Parada A", lat: 19.555, lng: -96.918 },
            { name: "Parada B", lat: 19.558, lng: -96.917 },
            { name: "Parada C", lat: 19.560, lng: -96.915 },
        ],
        timeApprox: "25 min",
        safeForWomen: false,
        busImage: "/images/bus2.png",
    },
];
