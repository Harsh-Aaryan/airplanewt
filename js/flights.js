// flights.js
// Globals expected: cities, OPEN_SKY_BASE, PROXY_URL, POLL_INTERVAL, map, paper

const flights = new Map(); // icao24 → Paper.js Path

function startFlightUpdates() {
  updateFlights();
  setInterval(updateFlights, POLL_INTERVAL);
}

async function updateFlights() {
  const idx = +document.getElementById('citySelect').value;
  const [south, north, west, east] = cities[idx].bbox;
  const url = `${OPEN_SKY_BASE}?bbox=${south},${north},${west},${east}`;

  console.log('Fetching flights for bbox', [south, north, west, east]);

  let res;
  try {
    res = await fetch(url);
    if (!res.ok) throw new Error(`Status ${res.status}`);
  } catch (err) {
    console.warn('Direct fetch failed, retrying with proxy', err);
    try {
      res = await fetch(PROXY_URL + url);
      if (!res.ok) throw new Error(`Proxy status ${res.status}`);
    } catch (e) {
      console.error('Proxy fetch failed too:', e);
      return;
    }
  }

  let data;
  try {
    data = await res.json();
    console.log('OpenSky response:', data);
  } catch (e) {
    console.error('JSON parse error:', e);
    return;
  }

  const seen = new Set();
  (data.states || []).forEach(state => {
    const [
      icao, callsign, country, tpos, lcon,
      lon, lat, alt, onGround, speed,
      track, vRate
    ] = state;

    if (onGround) return;
    seen.add(icao);

    const pt = map.latLngToLayerPoint([lat, lon]);
    console.log(`Plane ${callsign} @${lat},${lon} →`, pt);
    const pos = [pt.x, pt.y];

    let node = flights.get(icao);
    if (!node) {
      node = new paper.Path.RegularPolygon({
        center: new paper.Point(pos[0], pos[1]),
        sides: 3,
        radius: 8,
        fillColor: 'white',
        strokeColor: 'black',
        strokeWidth: 1,
        data: { callsign: callsign.trim(), alt, speed, track }
      });
      node.rotation = track || 0;
      node.onClick = evt => showInfo(node, evt.event);
      flights.set(icao, node);
    } else {
      node.data.alt   = alt;
      node.data.speed = speed;
      node.data.track = track;
      const delta = (track || 0) - (node.rotation || 0);
      node.rotate(delta);
      node.rotation = track || 0;
      node.tween(
        { point: new paper.Point(pos[0], pos[1]) },
        { duration: POLL_INTERVAL - 1000 }
      );
    }
  });

  // remove vanished planes
  flights.forEach((node, icao) => {
    if (!seen.has(icao)) {
      node.remove();
      flights.delete(icao);
    }
  });
}

function showInfo(node, domEvent) {
  document.getElementById('infoPopup')?.remove();
  const div = document.createElement('div');
  div.id = 'infoPopup';
  div.innerHTML = `
    <strong>${node.data.callsign}</strong><br>
    Altitude: ${node.data.alt != null ? Math.round(node.data.alt) + ' m' : '–––'}<br>
    Speed: ${node.data.speed != null ? Math.round(node.data.speed) + ' m/s' : '–––'}<br>
    Heading: ${node.data.track != null ? Math.round(node.data.track) + '°' : '–––'}
  `;
  document.body.append(div);
  div.style.left = `${domEvent.clientX + 12}px`;
  div.style.top  = `${domEvent.clientY + 12}px`;
  setTimeout(() => div.remove(), 5000);
}

// expose globally
window.startFlightUpdates = startFlightUpdates;
