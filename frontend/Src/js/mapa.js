  // === 1) Un solo mapa ===
const map = L.map('map').setView([19.5426, -96.9103], 14);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19, attribution: ' OpenStreetMap contributors'
}).addTo(map);

// Capas de trabajo
const routesLayer = L.layerGroup().addTo(map);
const markersLayer = L.layerGroup().addTo(map);

let routeSelected = null;

let ROUTES = [];

fetch("http://localhost:3000/api/rutas")
  .then(res => res.json())
  .then(data => {
    ROUTES = data;
    renderRouteButtons(); 
  })
  .catch(err => console.error("Error cargando rutas:", err));


// === MENU HAMBURGUESA ===

// Menu 1
document.addEventListener("DOMContentLoaded", function() {
  const menu = document.getElementById("toggle-menu");
  menu.addEventListener("click", () => {
    const enlaces = document.getElementById("menu");
    if (enlaces.hasAttribute("hidden")) {
      enlaces.removeAttribute("hidden");
      menu.setAttribute("aria-expanded", "true");
    } else {
      enlaces.setAttribute("hidden", "");
      menu.setAttribute("aria-expanded", "false");
    }
  });
});

// Menu 2
document.addEventListener("DOMContentLoaded", function() {
  const menu = document.getElementById("toggle-menu");
  menu.addEventListener("click", () => {
    const enlaces = document.getElementById("menu2");
    if (enlaces.hasAttribute("hidden")) {
      enlaces.removeAttribute("hidden");
      menu.setAttribute("aria-expanded", "true");
    } else {
      enlaces.setAttribute("hidden", "");
      menu.setAttribute("aria-expanded", "false");
    }
  });
});


// === FILTRO DE RUTAS Y PARADAS ===
const searchInput = document.getElementById('search-stop');
const btns = document.getElementById('btns');

function renderRouteButtons(filter = '') {
  btns.innerHTML = '';
  ROUTES.forEach(route => {
    if (route.label.toLowerCase().includes(filter)) {
      const b = document.createElement('button');
      b.id = route.id;
      b.textContent = route.label;
      b.addEventListener('click', () => {
        const isCircuit = route.type === 'circuit';
        routeSelected = route;
        if (searchInput) searchInput.value = '';
        drawRouted(route.points, isCircuit, route.color);

        // Mostrar imágenes en menu2
        const detailsDiv = document.getElementById('details');
        if (route.images && route.images.length) {
          detailsDiv.innerHTML = route.images.map(src => 
            `<img src="${src}" class="img-camion">`
          ).join('');
        } else {
          detailsDiv.innerHTML = '<small>No hay imágenes disponibles :c </small>';
        }
      });
      btns.appendChild(b);
    }
  });
}

renderRouteButtons();

if (searchInput) {
  searchInput.addEventListener('input', function() {
    const filtro = this.value.trim().toLowerCase();
    if (!routeSelected) {
      renderRouteButtons(filtro);
    } else if (Array.isArray(routeSelected.stops)) {
      markersLayer.clearLayers();
      routeSelected.stops.forEach(stop => {
        if (stop.nombre.toLowerCase().includes(filtro)) {
          L.circleMarker(stop.coordenas,{
            radius: 5,
            color: 'red',
            fillColor: 'yellow',
            fillOpacity: 1
          })
          .addTo(markersLayer)
          .bindPopup(stop.nombre || 'Parada');
        }
      });
    }
  });
}

// === 3) Utilidades de UI ===
const $stats = document.getElementById('stats');
function setStats(html) { $stats.innerHTML = html; }
function fmtKm(m) { return (m/1000).toFixed(2) + ' km'; }
function fmtMin(s) { return Math.round(s/60) + ' min'; }

// === 4) Dibujar ruta "encajada" a carreteras con OSRM ===
// Acepta >=2 puntos. Si es circuito, cierra con el primero.
async function drawRouted(pointsLatLng, isCircuit=false, color='#3388ff') {
  routesLayer.clearLayers();
  markersLayer.clearLayers();

  if (!pointsLatLng || pointsLatLng.length < 2) {
    setStats('<span class="pill"> Se necesitan al menos 2 puntos.');
    return;
  }

  // Cerrar circuito si aplica
  let pts = pointsLatLng.slice();
  if (isCircuit) pts.push(pointsLatLng[0]);

  // Leaflet usa [lat,lng], OSRM en URL usa lon,lat
  const coordsParam = pts.map(([lat,lng]) => `${lng},${lat}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${coordsParam}?overview=full&geometries=geojson`;

  setStats('Calculando ruta por carretera…');
  let data;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('OSRM no disponible');
    data = await res.json();
  } catch (e) {
    setStats('<span class="pill"> No se pudo calcular la ruta (OSRM).');
    return;
  }

  if (!data.routes || !data.routes.length) {
    setStats('<span class="pill"> No se encontró ruta.');
    return;
  }

  const route = data.routes[0]; // mejor ruta
  const gj = { type:'Feature', geometry: route.geometry, properties:{} };

  // Dibuja línea y marcadores de inicio/fin
  const line = L.geoJSON(gj, { style:{ color, weight:5, opacity:.9 } }).addTo(routesLayer);
  L.marker(pts[0].slice().reverse().slice().reverse() && pointsLatLng[0]).addTo(markersLayer).bindPopup('Inicio');
  L.marker(pts[pts.length-1].slice().reverse().slice().reverse() && pointsLatLng[isCircuit ? 0 : pointsLatLng.length-1])
    .addTo(markersLayer)
    .bindPopup(isCircuit ? 'Cierre' : 'Fin');

  map.fitBounds(line.getBounds(), { padding:[20,20] });

  // Resumen distancia/tiempo
  setStats(
    `<span class="pill">Distancia: ${fmtKm(route.distance)}</span>` +
    `<span class="pill">Duración: ${fmtMin(route.duration)}</span>` +
    (isCircuit ? ` <span class="pill">Circuito</span>` : '')
  );
  
  //Dibuja paradas si existen
  if (routeSelected && Array.isArray(routeSelected.stops)){
    routeSelected.stops.forEach(stop => {
    L.circleMarker(stop.coordenas,{
      radius: 5,
      color: 'red',
      fillColor: 'yellow',
      fillOpacity: 1
    })
    .addTo(markersLayer)
    .bindPopup(stop.nombre || 'Parada');
    });
  }
}


// === 6) Utilidades Limpiar/Ajustar ===
document.getElementById('clear').addEventListener('click', () => {
  routesLayer.clearLayers();
  markersLayer.clearLayers();
  routeSelected = null;
  setStats('<small class="muted">Limpio. Elige una ruta.</small>');
});

document.getElementById('fit').addEventListener('click', () => {
  const bounds = routesLayer.getBounds?.();
  if (bounds && bounds.isValid && bounds.isValid()) {
    map.fitBounds(bounds, { padding:[20,20] });
  } else {
    map.setView([19.5426, -96.9103], 14);
  }
});