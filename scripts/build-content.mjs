/**
 * Reads everything in /content and prepares it for the site.
 *
 *   content/settings.txt            site-wide words (his name, opening lines…)
 *   content/last-note/details.txt   the final surprise's lines
 *   content/last-note/letter.txt    the closing letter
 *   content/records/01 … 24/        one folder per friend:
 *       details.txt                 friend, song, artist, sign-off…
 *       message.txt                 their note, in their words
 *       any audio file              the song (.mp3 or .m4a recommended)
 *       cover.jpg (any image)       the sleeve cover (optional)
 *       photo.jpg                   a photo taped inside the note (optional)
 *
 * It copies the media to public/content/ and writes data/generated/content.ts.
 * Runs automatically before `npm run dev` and `npm run build`.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const CONTENT = path.join(root, "content");
const PUBLIC_OUT = path.join(root, "public", "content");
const GENERATED = path.join(root, "data", "generated", "content.ts");

const AUDIO = [".mp3", ".m4a", ".aac", ".wav", ".ogg", ".opus", ".flac"];
const IMAGES = [".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"];
const NOT_FOR_WEB = [".heic", ".heif", ".tif", ".tiff"];
const BIG_AUDIO = 15 * 1024 * 1024;
const BIG_IMAGE = 2.5 * 1024 * 1024;

const warnings = [];
const warn = (where, msg) => warnings.push(`  ${where}: ${msg}`);

/* ---------- helpers ---------- */

/** Reads "key: value" lines. Blank values and lines starting with # are ignored. */
function readDetails(file) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const raw of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf(":");
    if (i < 0) continue;
    const key = line.slice(0, i).trim().toLowerCase();
    const value = line.slice(i + 1).trim();
    if (value) out[key] = value;
  }
  return out;
}

function readText(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n").trim() : "";
}

function copyToPublic(src, relDest) {
  const dest = path.join(PUBLIC_OUT, relDest);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  // URL-encode each path segment so spaces and symbols in file names still work
  return "/content/" + relDest.split("/").map(encodeURIComponent).join("/");
}

const spotifyIdFrom = (url) => url?.match(/track[/:]([A-Za-z0-9]{22})/)?.[1] ?? "";

/* ---------- start fresh ---------- */
fs.rmSync(PUBLIC_OUT, { recursive: true, force: true });
fs.mkdirSync(PUBLIC_OUT, { recursive: true });
fs.mkdirSync(path.dirname(GENERATED), { recursive: true });

/* ---------- settings ---------- */
const s = readDetails(path.join(CONTENT, "settings.txt"));
const site = {
  recipientName: s["his-name"] ?? "[His name]",
  openingLines: [s["opening-line-1"], s["opening-line-2"], s["opening-line-3"]].filter(Boolean),
  openingSubline: s["opening-subline"] ?? "",
  unwrapLabel: s["unwrap-button"] ?? "Unwrap your gift",
  noteHeadings: [s["note-heading-1"], s["note-heading-2"], s["note-heading-3"]].filter(Boolean),
  placeholderAudio: (s["placeholder-tone"] ?? "on").toLowerCase() === "off" ? null : "/placeholder-tone.mp3",
  cardUnlock: (s["card-unlock"] ?? "off").toLowerCase() === "on",
};

/* NFC cards: each record gets a short secret code, so its card link can't be guessed. */
const cardSecret = s["card-secret"] ?? "change-me";
const siteAddress = (s["site-address"] ?? "https://YOUR-SITE.onrender.com").replace(/\/+$/, "");
const CODE_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"; // no look-alikes (0/o, 1/l/i)
const cardCodeFor = (num) => {
  const bytes = crypto.createHash("sha256").update(`${cardSecret}:${num}`).digest();
  return Array.from(bytes.subarray(0, 6), (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
};
if (!site.openingLines.length) site.openingLines = ["24 years.", "24 songs.", "24 little pieces of you."];
if (!site.noteHeadings.length) site.noteHeadings = ["Why I picked this for you"];

/* ---------- the last note ---------- */
const f = readDetails(path.join(CONTENT, "last-note", "details.txt"));
const finale = {
  lines: [f["line-1"], f["line-2"], f["line-3"]].filter(Boolean),
  letterGreeting: f["greeting"] ?? "",
  letter: readText(path.join(CONTENT, "last-note", "letter.txt")).split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean),
  letterSignOff: f["sign-off"] ?? "",
};

/* ---------- records ---------- */
const recordsDir = path.join(CONTENT, "records");
const folders = fs.existsSync(recordsDir)
  ? fs
      .readdirSync(recordsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && /^\d+$/.test(d.name))
      .map((d) => d.name)
      .sort((a, b) => Number(a) - Number(b))
  : [];

const summary = [];
const missingMessages = [];
const missingSongs = [];
const records = folders.map((folder) => {
  const n = Number(folder);
  const num = String(n).padStart(2, "0");
  const dir = path.join(recordsDir, folder);
  const where = `records/${folder}`;
  const d = readDetails(path.join(dir, "details.txt"));
  const files = fs.readdirSync(dir).filter((x) => !x.startsWith("."));

  for (const x of files) {
    if (NOT_FOR_WEB.includes(path.extname(x).toLowerCase()))
      warn(where, `"${x}" won't show in most browsers. Save it as a .jpg instead (it's being skipped).`);
  }

  const audioFile = files.find((x) => AUDIO.includes(path.extname(x).toLowerCase()));
  const images = files.filter((x) => IMAGES.includes(path.extname(x).toLowerCase()));
  const photoFile = images.find((x) => x.toLowerCase().startsWith("photo"));
  const coverFile = images.find((x) => x.toLowerCase().startsWith("cover")) ?? images.find((x) => x !== photoFile);

  let audio = "";
  if (audioFile) {
    const src = path.join(dir, audioFile);
    if (fs.statSync(src).size > BIG_AUDIO) warn(where, `"${audioFile}" is over 15 MB, so it may load slowly on a phone.`);
    if ([".ogg", ".opus", ".flac", ".wav"].includes(path.extname(audioFile).toLowerCase()))
      warn(where, `"${audioFile}" may not play on every iPhone. .mp3 or .m4a is safest.`);
    audio = copyToPublic(src, `records/${num}/${audioFile}`);
  }

  const image = (file) => {
    if (!file) return "";
    const src = path.join(dir, file);
    if (fs.statSync(src).size > BIG_IMAGE) warn(where, `"${file}" is large (over 2.5 MB). It works, but a smaller copy loads faster.`);
    return copyToPublic(src, `records/${num}/${file}`);
  };

  const message = readText(path.join(dir, "message.txt"));
  const friend = d["friend"] ?? `Friend ${num}`;
  const spotifyUrl = d["spotify"] ?? "";
  const photo = image(photoFile);

  summary.push(
    `  ${num}  ${friend.padEnd(18).slice(0, 18)}  ${audio ? "song" : "    "}  ${coverFile ? "cover" : "     "}  ${photo ? "photo" : "     "}  ${message ? "message" : ""}`,
  );
  if (!message) missingMessages.push(num);
  if (!audio) missingSongs.push(num);

  return {
    id: `record-${num}`,
    recordNumber: n,
    friendName: friend,
    songTitle: d["song"] ?? "[Song title]",
    artistName: d["artist"] ?? "[Artist]",
    spotifyUrl,
    spotifyTrackId: spotifyIdFrom(spotifyUrl),
    coverImage: image(coverFile),
    personalMessage: message || "[Placeholder] The note for this record hasn't been added yet.",
    optionalPhoto: photo ? { src: photo, alt: d["photo-description"] ?? `A photo from ${friend}`, caption: d["photo-caption"] ?? "" } : null,
    optionalMemoryTitle: d["memory"] ?? "",
    optionalSignOff: d["sign-off"] ?? "",
    optionalAudioSource: audio,
    cardCode: cardCodeFor(num),
  };
});

/* ---------- write ---------- */
const banner = "// Generated from /content by scripts/build-content.mjs. Don't edit: edit /content instead.\n";
fs.writeFileSync(
  GENERATED,
  banner +
    `import type { RecordEntry } from "../types";\n\n` +
    `export const site = ${JSON.stringify(site, null, 2)} as { recipientName: string; openingLines: string[]; openingSubline: string; unwrapLabel: string; noteHeadings: string[]; placeholderAudio: string | null; cardUnlock: boolean };\n\n` +
    `export const finale = ${JSON.stringify(finale, null, 2)};\n\n` +
    `export const records: RecordEntry[] = ${JSON.stringify(records, null, 2)};\n`,
);

/* The links to write onto the NFC cards */
const links = records.map((r) => `${String(r.recordNumber).padStart(2, "0")}  ${r.friendName.padEnd(18).slice(0, 18)}  ${siteAddress}/?card=${r.cardCode}`);
fs.writeFileSync(
  path.join(root, "card-links.txt"),
  `NFC card links (generated by npm run content / dev / build)\n` +
    `Write each link onto its card with NFC Tools: Write > Add a record > URL.\n` +
    `Changing card-secret or site-address in content/settings.txt changes these, so set both before writing cards.\n\n` +
    links.join("\n") + "\n",
);

console.log(`\n24 ROTATIONS: ${records.length} records found in /content/records\n`);
console.log(summary.join("\n"));
if (missingSongs.length) console.log(`\nNo song yet: ${missingSongs.join(", ")}`);
if (missingMessages.length) console.log(`No message yet: ${missingMessages.join(", ")}`);
if (warnings.length) console.log(`\nThings to check:\n${warnings.join("\n")}`);
console.log(site.cardUnlock ? "\nCard unlock is on: records stay sealed until their NFC card is tapped. Links are in card-links.txt." : "\nCard unlock is off: every record is open. Card links are still in card-links.txt.");
if (site.cardUnlock && cardSecret === "change-me") console.log("Set your own card-secret in content/settings.txt before writing the cards.");
if (!site.placeholderAudio) console.log("\nPlaceholder tone is off.");
else console.log("\nPlaceholder tone is on (records without a song play a soft tone). Set placeholder-tone: off in content/settings.txt before you send the link.");
console.log("");
