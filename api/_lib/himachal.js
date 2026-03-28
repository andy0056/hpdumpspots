const fs = require("fs");
const path = require("path");

let outline = null;

function loadOutline() {
  if (outline) return outline;
  const file = path.join(process.cwd(), "himachal-boundaries.geojson");
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  const feature = data.features.find(
    (item) => item.properties && item.properties.kind === "state-outline",
  );
  if (!feature) throw new Error("Himachal outline not found");
  outline = feature.geometry.type === "LineString"
    ? feature.geometry.coordinates
    : feature.geometry.coordinates[0];
  return outline;
}

function isPointInPolygon(lat, lng, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];

    const intersects =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi || Number.EPSILON) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function isPointInHimachal(lat, lng) {
  return isPointInPolygon(lat, lng, loadOutline());
}

module.exports = {
  isPointInHimachal,
  loadOutline,
};
