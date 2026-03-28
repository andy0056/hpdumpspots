const ALLOWED_DISTRICTS = [
  "Bilaspur",
  "Chamba",
  "Hamirpur",
  "Kangra",
  "Kinnaur",
  "Kullu",
  "Lahaul-Spiti",
  "Mandi",
  "Shimla",
  "Sirmaur",
  "Solan",
  "Una",
];

const ALLOWED_SITE_TYPES = [
  "Road",
  "Footpath",
  "Nala / Drain",
  "Open plot",
  "Near temple",
  "Tourist spot",
  "River / Nala bank",
  "Forest area",
  "Market",
  "Near school",
  "Near hospital",
];

const ALLOWED_CATEGORIES = [
  "Plastic waste",
  "Food waste",
  "Construction",
  "Nala / Sewage",
  "Burning garbage",
  "E-waste",
  "Medical waste",
  "Animal waste",
  "Mixed / general",
  "Landslide debris",
  "Tourist litter",
];

const ALLOWED_SEVERITIES = [
  "Minor",
  "Moderate",
  "Severe",
  "Blocking road",
];

const QUARANTINE_BUCKET = "report-photos-quarantine";
const PUBLIC_BUCKET = "report-photos-public";

const MAX_PHOTOS = 6;
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const MAX_TEXT_LENGTH = 500;
const MAX_LOCATION_LENGTH = 120;
const MAX_NAME_LENGTH = 60;
const MAX_IMAGE_DIMENSION = 8000;

module.exports = {
  ALLOWED_CATEGORIES,
  ALLOWED_DISTRICTS,
  ALLOWED_SEVERITIES,
  ALLOWED_SITE_TYPES,
  MAX_IMAGE_DIMENSION,
  MAX_LOCATION_LENGTH,
  MAX_NAME_LENGTH,
  MAX_PHOTOS,
  MAX_TEXT_LENGTH,
  MAX_UPLOAD_BYTES,
  PUBLIC_BUCKET,
  QUARANTINE_BUCKET,
};
