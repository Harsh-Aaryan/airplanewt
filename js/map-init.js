let map, canvas;

function initMap() {
  const select = document.getElementById('citySelect');
  cities.forEach((c, i) => select.append(new Option(c.name, i)));
  select.addEventListener('change', () => setCity(+select.value));
  setCity(0);
}

function setCity(idx) {
  const city = cities[idx];
  const center = [city.center.lat, city.center.lng];

  if (!map) {
    // 1) Initialize Leaflet
    map = L.map('map', { zoomControl: false }).setView(center, 11);
    // 2) Add Carto Dark tiles
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; CARTO',
      }
    ).addTo(map);

    // 3) Create Paper.js canvas overlay
    canvas = document.createElement('canvas');
    canvas.id = 'paperCanvas';
    document.getElementById('map').appendChild(canvas);
    paper.setup(canvas);

    // 4) Keep canvas matched to map size
    map.on('move zoom resize', resizeCanvas);
    resizeCanvas();

    // 5) Start flight polling
    startFlightUpdates();
  }

  // 6) Fit map to the city bbox
  map.fitBounds([
    [city.bbox[0], city.bbox[2]], // south, west
    [city.bbox[1], city.bbox[3]], // north, east
  ]);
}

function resizeCanvas() {
  const size = map.getSize();
  canvas.width = size.x;
  canvas.height = size.y;
  paper.view.viewSize = new paper.Size(size.x, size.y);
}

document.addEventListener('DOMContentLoaded', initMap);
