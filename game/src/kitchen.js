// Ember & Thyme — the kitchen floor plan.
// Every station is a rectangle with a name, a label, an approach point the
// chef walks to, and a reach radius. Nothing here knows about game rules;
// it only answers "where is everything, and what did the player click?"

export const STATIONS = {
  pantry: {
    id: 'pantry', label: 'PANTRY', sub: 'grab ingredients',
    x: 24, y: 168, w: 288, h: 148,
    approach: { x: 168, y: 348 },
  },
  board: {
    id: 'board', label: 'CHOPPING BOARD', sub: 'chop · auto',
    x: 344, y: 168, w: 224, h: 148,
    approach: { x: 456, y: 348 },
  },
  wok: {
    id: 'wok', label: 'WOK STATION', sub: 'cook · watch the heat',
    x: 600, y: 168, w: 264, h: 148,
    approach: { x: 732, y: 348 },
  },
  plating: {
    id: 'plating', label: 'PLATING COUNTER', sub: 'finished plates wait here',
    x: 896, y: 168, w: 272, h: 148,
    approach: { x: 1032, y: 348 },
  },
  serving: {
    id: 'serving', label: 'SERVING WINDOW', sub: 'ring the bell · serve',
    x: 896, y: 392, w: 272, h: 148,
    approach: { x: 1032, y: 568 },
  },
  trash: {
    id: 'trash', label: 'COMPOST BIN', sub: 'dump burnt food',
    x: 24, y: 560, w: 120, h: 96,
    approach: { x: 84, y: 540 },
  },
};

// The eight pantry crates, laid out in two rows inside the pantry station.
// Each crate holds one ingredient type; clicking a crate takes one piece.
export const PANTRY_CRATES = (() => {
  const ids = ['noodle', 'chicken', 'prawn', 'pepper', 'mushroom', 'egg', 'chili', 'herb'];
  return ids.map((id, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    return {
      ingredient: id,
      x: STATIONS.pantry.x + 10 + col * 68,
      y: STATIONS.pantry.y + 30 + row * 62,
      w: 60, h: 54,
    };
  });
})();

export function stationAt(px, py) {
  for (const station of Object.values(STATIONS)) {
    if (px >= station.x && px <= station.x + station.w &&
        py >= station.y && py <= station.y + station.h) {
      return station;
    }
  }
  return null;
}

export function crateAt(px, py) {
  return PANTRY_CRATES.find((c) => px >= c.x && px <= c.x + c.w && py >= c.y && py <= c.y + c.h) ?? null;
}

export function stationCenter(station) {
  return { x: station.x + station.w / 2, y: station.y + station.h / 2 };
}

export function distanceToStation(px, py, station) {
  const c = stationCenter(station);
  return Math.hypot(px - c.x, py - c.y);
}

// The chef may work a station from its approach point; a click on a far
// station is a walk order, not a failed interaction.
export const REACH_PX = 190;

export function isInReach(px, py, station) {
  return distanceToStation(px, py, station) <= REACH_PX;
}
