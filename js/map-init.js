let map, canvas;

function initMap() {
  const select = document.getElementById('citySelect');
  cities.forEach((c,i) => select.append(new Option(c.name, i)));
  select.addEventListener('change', () => setCity(+select.value));
  setCity(0);
}

function setCity(idx) {
  const city = cities[idx];
  const center = [city.center.lat, city.center.lng];

  if (!map) {
    // 1) Initialize Leaflet
    map = L.map('map', { zoomControl: false }).setView(center, 11);

    // 2) Add a free dark‐themed tile layer (Carto Dark Matter here)
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; CARTO',
      }
    ).addTo(map);

    // 3) Create a Paper.js canvas overlay
    canvas = document.createElement('canvas');
    canvas.id = 'paperCanvas';
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    document.getElementById('map').appendChild(canvas);
    paper.setup(canvas);

    // 4) Keep canvas sized to the map viewport
    map.on('move zoom resize', resizeCanvas);
    resizeCanvas();

    // 5) Start polling & drawing flights
    startFlightUpdates();
  }

  // Fit the map to the city's bounding box
  map.fitBounds([
    [city.bbox[0], city.bbox[2]], // south, west
    [city.bbox[1], city.bbox[3]], // north, east
  ]);
}

function resizeCanvas() {
  const size = map.getSize();
  canvas.width = size.x;
  canvas.height = size.y;
  // tell Paper.js about the new view size
  paper.view.viewSize = new paper.Size(size.x, size.y);
}

// kick things off once the DOM is ready
document.addEventListener('DOMContentLoaded', initMap);
