// One-off: compress public/resturant + public/hotels imagery for the Android
// full-offline APK. Originals are ~2 MB camera JPGs; 192 photos at that size
// make the APK ~305 MB — over Play's 200 MB initial-download cap and a
// multi-hundred-MB sideload. Target: max 1400px on the long edge, quality 70,
// ~150-250 KB per image, which stays sharp on phone screens.
// Idempotent: skips files already processed (sidecar marker).
import sharp from "sharp";
import { readdirSync, statSync, existsSync, renameSync, writeFileSync, rmSync } from "node:fs";
import { join, extname } from "node:path";

const ROOTS = ["public/resturant", "public/hotels"];
const MAX_EDGE = 1400;
const QUALITY = 70;
// Anything at or below this size is treated as already fine.
const SKIP_BELOW_BYTES = 220 * 1024;

let processed = 0, skipped = 0, failed = 0, bytesBefore = 0, bytesAfter = 0;

function walk(dir) {
  let out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) out = out.concat(walk(p));
    else if (/\.(jpe?g|png)$/i.test(name)) out.push(p);
  }
  return out;
}

for (const root of ROOTS) {
  if (!existsSync(root)) continue;
  for (const file of walk(root)) {
    const marker = file + ".compressed";
    const big = statSync(file).size;
    if (big <= SKIP_BELOW_BYTES || existsSync(marker)) { skipped++; continue; }
    try {
      const tmp = file + ".tmp.jpg";
      const img = sharp(file).rotate(); // honour EXIF orientation
      const meta = await img.metadata();
      const width = meta.width ?? 0, height = meta.height ?? 0;
      const longEdge = Math.max(width, height);
      if (longEdge > MAX_EDGE) img.resize({ width: width >= height ? MAX_EDGE : undefined, height: height > width ? MAX_EDGE : undefined, fit: "inside" });
      const buf = await img.jpeg({ quality: QUALITY, mozjpeg: true }).toBuffer();
      if (buf.length < big) {
        bytesBefore += big; bytesAfter += buf.length;
        writeFileSync(tmp, buf);
        rmSync(file);
        renameSync(tmp, file);
        writeFileSync(marker, "");
        processed++;
      } else {
        writeFileSync(marker, "");
        skipped++;
      }
    } catch (e) {
      failed++;
      console.error("FAIL", file, e.message);
    }
  }
}

console.log(`processed=${processed} skipped=${skipped} failed=${failed}`);
console.log(`bytes: ${(bytesBefore / 1e6).toFixed(1)} MB -> ${(bytesAfter / 1e6).toFixed(1)} MB`);
