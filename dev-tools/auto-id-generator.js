const fs = require("fs");
const path = require("path");

// Folder where your normal images live
const ROOT = path.join(__dirname, "../assets/images");

function normalize(name) {
  return name
    .toLowerCase()
    .replace(/\.[^.]+$/, "")      // remove extension
    .replace(/[^a-z0-9]+/g, "-")  // replace symbols/spaces with -
    .replace(/-+/g, "-")          // collapse repeating dashes
    .replace(/^-|-$/g, "");       // trim leading/trailing hyphens
}

function walk(dir, out) {
  const entries = fs.readdirSync(dir);

  for (const file of entries) {
    const full = path.join(dir, file);
    const stats = fs.statSync(full);

    if (stats.isDirectory()) {
      walk(full, out);
    } else if (stats.isFile()) {
      const ext = path.extname(file).toLowerCase();
      if (![".png", ".jpg", ".jpeg", ".webp"].includes(ext)) continue;

      const relative = full.replace(ROOT, "").replace(/\\/g, "/");
      const cleanId = normalize(file);

      out.push({
        id: cleanId,
        name: file.replace(ext, ""),
        image: `/assets/images${relative}`,
        expectedTransparent: `/public/items/transparent/${cleanId}.png` 
      });
    }
  }
}

// Run scan
const result = [];
walk(ROOT, result);

// Save output
const outPath = path.join(__dirname, "generated-items.json");
fs.writeFileSync(outPath, JSON.stringify(result, null, 2));

console.log(`✔ Generated ${result.length} items → ${outPath}`);
console.log("✔ Use each 'id' as item.id in your shop database");
console.log("✔ Transparent PNG must use: /public/items/transparent/{id}.png");
