const fs = require('fs');
const path = require('path');

const folder = path.join(__dirname, '../public/items/transparent');

function normalize(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

fs.readdirSync(folder).forEach(file => {
  if (!file.toLowerCase().endsWith('.png')) return;

  const original = path.join(folder, file);
  const base = file.replace(/\.png$/, '');
  const normalized = normalize(base) + '.png';

  const target = path.join(folder, normalized);

  if (original !== target) {
    fs.renameSync(original, target);
    console.log(`Renamed: ${file} → ${normalized}`);
  }
});

console.log("✔ Transparent filenames cleaned.");
