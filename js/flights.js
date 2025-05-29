// js/flights.js
// Globals expected from config.js:
//   cities         — Array of { name, center:{lat,lng}, bbox:[s,n,w,e] }
//   POLL_INTERVAL  — e.g. 10000 (ms)
//   map            — your Leaflet map
// Paper.js must already be set up on '#paperCanvas'

const flights = new Map();  // key: icao → Paper.js Path

function startFlightUpdates() {
  updateFlights();
  setInterval(updateFlights, POLL_INTERVAL);
}

async function updateFlights() {
  const idx = +document.getElementById('citySelect').value;
  const { lat, lng } = cities[idx].center;

  // ADS-B Exchange VirtualRadar feed:
  const url = `https://public-api.adsbexchange.com/VirtualRadar/AircraftList.json
    ?lat=${lat}&lng=${lng}&fDstL=0&fDstU=500`.replace(/\s+/g, '');

  let payload;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    payload = await res.json();
  } catch (err) {
    console.error('ADSBExchange fetch error:', err);
    return;
  }

  // Diagnostics:
  console.log('ADSBExchange payload:', payload);
  if (!Array.isArray(payload.acList)) {
    console.warn('No acList in response');
    return;
  }

  const seen = new Set();
  payload.acList.forEach(ac => {
    const icao     = ac.Icao;
    const callsign = ac.Call?.trim() || ac.Reg?.trim() || '–––';
    const latPos   = ac.Lat;
    const lonPos   = ac.Long;
    const alt      = ac.Alt;    // feet
    const spd      = ac.Spd;    // knots
    const hdg      = ac.Trak;   // degrees

    if (latPos == null || lonPos == null) return;
    seen.add(icao);

    // project to pixel coords
    const pt  = map.latLngToLayerPoint([latPos, lonPos]);
    const pos = [pt.x, pt.y];

    let node = flights.get(icao);
    if (!node) {
      node = new paper.Path.RegularPolygon({
        center: new paper.Point(pos),
        sides: 3,
        radius: 6,
        fillColor: 'white',
        strokeColor: 'black',
        strokeWidth: 1,
        data: { callsign, alt, spd, hdg }
      });
      node.rotation = hdg || 0;
      node.onClick = evt => showInfo(node, evt.event);
      flights.set(icao, node);
    } else {
      node.data.alt = alt;
      node.data.spd = spd;
      node.data.hdg = hdg;
      const delta = ((hdg||0) - (node.rotation||0));
      node.rotate(delta);
      node.rotation = hdg || 0;
      node.tween(
        { point: new paper.Point(pos) },
        { duration: POLL_INTERVAL * 0.8 }
      );
    }
  });

  // cleanup vanished flights
  for (let [icao,node] of flights) {
    if (!seen.has(icao)) {
      node.remove();
      flights.delete(icao);
    }
  }
}

function showInfo(node, domEvent) {
  document.getElementById('infoPopup')?.remove();
  const d = node.data;
  const div = document.createElement('div');
  div.id = 'infoPopup';
  div.style = `
    position:absolute; pointer-events:none;
    background:rgba(255,255,255,0.9);
    padding:6px 10px; border-radius:4px;
    box-shadow:0 2px 6px rgba(0,0,0,0.3);
    font-size:0.9em; z-index:900;
  `;
  div.innerHTML = `
    <strong>${d.callsign}</strong><br>
    Alt: ${d.alt!=null?Math.round(d.alt)+' ft':'–––'}<br>
    Spd: ${d.spd!=null?Math.round(d.spd)+' kt':'–––'}<br>
    Hdg: ${d.hdg!=null?Math.round(d.hdg)+'°':'–––'}
  `;
  document.body.append(div);
  div.style.left = `${domEvent.clientX+10}px`;
  div.style.top  = `${domEvent.clientY+10}px`;
  setTimeout(() => div.remove(), 5000);
}

// expose for map-init.js
window.startFlightUpdates = startFlightUpdates;
