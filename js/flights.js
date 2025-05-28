// flights.js

// Assumes the following globals are defined in config.js or map-init.js:
//   cities         — Array of city objects with .bbox ([south,north,west,east]) and .center
//   OPEN_SKY_BASE  — e.g. "https://opensky-network.org/api/states/all"
//   POLL_INTERVAL  — milliseconds between fetches
//   map            — your Leaflet map instance
// Paper.js is loaded and paper.setup(canvas) has been called.

const flights = new Map();  // icao24 → Paper.js Path

/**
 * Kick off the initial fetch and then poll every POLL_INTERVAL.
 */
function startFlightUpdates() {
  updateFlights();
  setInterval(updateFlights, POLL_INTERVAL);
}

/**
 * Fetch the latest airborne flights in the current city's bbox,
 * add new ones, animate existing, and remove gone ones.
 */
async function updateFlights() {
  const cityIdx = +document.getElementById('citySelect').value;
  const city = cities[cityIdx];
  const [south, north, west, east] = city.bbox;
  const url = `${OPEN_SKY_BASE}?bbox=${south},${north},${west},${east}`;

  let data;
  try {
    const res = await fetch(url);
    data = await res.json();
  } catch (err) {
    console.error('OpenSky fetch failed:', err);
    return;
  }

  const seen = new Set();

  (data.states || []).forEach(state => {
    const [
      icao24, callsign, origin_country, time_position, last_contact,
      lon, lat, baro_altitude, on_ground, velocity,
      true_track, vertical_rate, sensors, geo_altitude, squawk, spi, position_source
    ] = state;

    // Only show airborne aircraft
    if (on_ground) return;
    seen.add(icao24);

    // Convert lat/lon → pixel coords on the Leaflet overlay
    const pt = map.latLngToLayerPoint([lat, lon]);
    const pos = [pt.x, pt.y];

    let node = flights.get(icao24);
    if (!node) {
      // First sighting: draw a simple triangle
      node = new paper.Path.RegularPolygon({
        center: new paper.Point(pos[0], pos[1]),
        sides: 3,
        radius: 8,
        fillColor: 'white',
        strokeColor: 'black',
        strokeWidth: 1,
        data: {
          callsign: callsign?.trim() || '–––',
          alt: baro_altitude,
          speed: velocity,
          track: true_track
        }
      });

      // Rotate triangle to heading
      node.rotation = true_track || 0;

      // On-click popup
      node.onClick = (evt) => showInfo(node, evt.event);

      flights.set(icao24, node);
    } else {
      // Update data
      node.data.alt   = baro_altitude;
      node.data.speed = velocity;
      node.data.track = true_track;

      // Rotate smoothly
      const deltaRot = (true_track || 0) - (node.rotation || 0);
      node.rotate(deltaRot);
      node.rotation = true_track || 0;

      // Tween position for smooth movement
      node.tween(
        { point: new paper.Point(pos[0], pos[1]) },
        { duration: POLL_INTERVAL - 1000 }
      );
    }
  });

  // Remove aircraft no longer in data
  flights.forEach((node, icao24) => {
    if (!seen.has(icao24)) {
      node.remove();
      flights.delete(icao24);
    }
  });
}

/**
 * Show a transient info popup near the mouse click.
 * @param {paper.Path} node 
 * @param {MouseEvent} domEvent 
 */
function showInfo(node, domEvent) {
  // Remove any existing popup
  const existing = document.getElementById('infoPopup');
  if (existing) existing.remove();

  const div = document.createElement('div');
  div.id = 'infoPopup';
  div.style.position = 'absolute';
  div.style.pointerEvents = 'none';
  div.style.background = 'rgba(255,255,255,0.95)';
  div.style.padding = '6px 10px';
  div.style.borderRadius = '4px';
  div.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
  div.style.fontSize = '0.9em';

  div.innerHTML = `
    <strong>${node.data.callsign}</strong><br>
    Altitude: ${node.data.alt != null ? Math.round(node.data.alt) + ' m' : '–––'}<br>
    Speed: ${node.data.speed != null ? Math.round(node.data.speed) + ' m/s' : '–––'}<br>
    Heading: ${node.data.track != null ? Math.round(node.data.track) + '°' : '–––'}
  `;

  document.body.appendChild(div);
  // Position near cursor
  div.style.left = `${domEvent.clientX + 12}px`;
  div.style.top  = `${domEvent.clientY + 12}px`;

  // Auto-dismiss
  setTimeout(() => {
    div.remove();
  }, 5000);
}

// Expose startFlightUpdates globally so map-init.js can call it:
window.startFlightUpdates = startFlightUpdates;
