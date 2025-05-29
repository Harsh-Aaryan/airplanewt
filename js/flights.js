// js/flights.js

// Assumes the following globals exist (defined in config.js):
//   cities            — Array of city objects { name, center: {lat,lng}, bbox }
//   POLL_INTERVAL     — milliseconds between updates
//   map               — your Leaflet map instance
// Paper.js must already be set up on your map’s canvas

const flights = new Map();  // keyed by aircraft ICAO code

/**
 * Start the fetch–draw loop
 */
function startFlightUpdates() {
  updateFlights();
  setInterval(updateFlights, POLL_INTERVAL);
}

/**
 * Fetch live aircraft positions from ADSBExchange's VirtualRadar API,
 * then add/update/remove Paper.js symbols accordingly.
 */
async function updateFlights() {
  // 1) Determine current city center
  const idx = +document.getElementById('citySelect').value;
  const { lat, lng } = cities[idx].center;

  // 2) Build ADSBExchange API URL (radius in km: 200 here)
  const url = 
    `https://public-api.adsbexchange.com/VirtualRadar/AircraftList.json` +
    `?lat=${lat}&lng=${lng}&fDstL=0&fDstU=200`;

  let payload;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    payload = await res.json();
  } catch (err) {
    console.error('ADSBExchange fetch error:', err);
    return;
  }

  // 3) If no list, bail
  if (!Array.isArray(payload.acList)) {
    console.warn('No acList in response', payload);
    return;
  }

  const seen = new Set();

  // 4) Process each aircraft
  payload.acList.forEach(ac => {
    const icao     = ac.Icao;
    const callsign = ac.Call?.trim() || ac.Reg?.trim() || '–––';
    const latPos   = ac.Lat;
    const lngPos   = ac.Long;
    const altitude = ac.Alt;     // in feet
    const speed    = ac.Spd;     // in knots
    const track    = ac.Trak;    // in degrees

    // only if position data exists
    if (latPos == null || lngPos == null) return;
    seen.add(icao);

    // 5) Convert lat/lng → pixel on the Leaflet overlay
    const pt = map.latLngToLayerPoint([latPos, lngPos]);
    const pos = [pt.x, pt.y];

    let node = flights.get(icao);
    if (!node) {
      // 6a) First sighting: draw a small triangle
      node = new paper.Path.RegularPolygon({
        center: new paper.Point(pos[0], pos[1]),
        sides: 3,
        radius: 6,
        fillColor: 'white',
        strokeColor: 'black',
        strokeWidth: 1,
        data: { callsign, altitude, speed, track }
      });
      node.rotation = track || 0;
      node.onClick = evt => showInfo(node, evt.event);
      flights.set(icao, node);
    } else {
      // 6b) Update existing: data, heading, smooth move
      node.data.altitude = altitude;
      node.data.speed    = speed;
      node.data.track    = track;

      // rotate delta
      const deltaRot = ((track || 0) - (node.rotation || 0));
      node.rotate(deltaRot);
      node.rotation = track || 0;

      // tween to new position
      node.tween(
        { point: new paper.Point(pos[0], pos[1]) },
        { duration: POLL_INTERVAL * 0.8 }
      );
    }
  });

  // 7) Remove any aircraft no longer in the list
  flights.forEach((node, icao) => {
    if (!seen.has(icao)) {
      node.remove();
      flights.delete(icao);
    }
  });
}

/**
 * Display a transient popup with flight info at the mouse click.
 */
function showInfo(node, domEvent) {
  // remove existing popup
  document.getElementById('infoPopup')?.remove();

  const div = document.createElement('div');
  div.id = 'infoPopup';
  div.innerHTML = `
    <strong>${node.data.callsign}</strong><br>
    Altitude: ${node.data.altitude != null ? Math.round(node.data.altitude) + ' ft' : '–––'}<br>
    Speed: ${node.data.speed != null ? Math.round(node.data.speed) + ' kt' : '–––'}<br>
    Heading: ${node.data.track != null ? Math.round(node.data.track) + '°' : '–––'}
  `;
  document.body.append(div);

  // position near cursor
  div.style.left = `${domEvent.clientX + 10}px`;
  div.style.top  = `${domEvent.clientY + 10}px`;

  // auto-dismiss
  setTimeout(() => div.remove(), 5000);
}

// Expose to map-init.js:
window.startFlightUpdates = startFlightUpdates;
