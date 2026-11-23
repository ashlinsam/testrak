# 24 ROTATIONS

A digital vinyl time capsule: 24 songs from his closest friends, for his 24th birthday.

**Everything you'll change lives in the `content/` folder.** You never need to touch code to add a friend, a song, a photo or a message.

---

## Adding a friend's record

Each friend has a numbered folder in `content/records/` (01 to 24). Put their things in it:

```
content/records/03/
  details.txt     ← their name, the song, the artist
  message.txt     ← their note, in their words
  song.mp3        ← the song (any file name is fine)
  cover.jpg       ← the album cover for their sleeve (optional)
  photo.jpg       ← a photo taped inside their note (optional)
```

**details.txt** looks like this. Fill in what you have and leave the rest empty:

```
friend: Anna Linson
song: Otha Sollaala
artist: G.V. Prakash Kumar, Velmurugan

sign-off: love Anna
memory:
spotify:
photo-caption:
photo-description:
```

| Line | What it does |
| --- | --- |
| `friend` | Their name, shown in their handwriting on the shelf and the note |
| `song`, `artist` | Shown on the turntable and the record label |
| `sign-off` | How the note ends, e.g. "love Anna". Leave empty for "— Anna Linson" |
| `memory` | Optional small title above the note, e.g. "Bondi, 3am, summer 2019" |
| `spotify` | Optional Spotify track link. Used only if there's no song file |
| `photo-caption` | Optional handwritten caption under the photo |
| `photo-description` | Optional description of the photo for screen readers |

**message.txt** is just their message. Paste it exactly as they wrote it. Leave a blank line between paragraphs.

**Files**
- **Song:** `.mp3` or `.m4a` work everywhere, including iPhone.
- **Cover:** any image. A square image looks best; other shapes are cropped to the centre. If there's only one image in the folder, it's used as the cover. Leave it out and the record gets its own designed cover.
- **Photo:** name it `photo.jpg` (or `photo.png`…) and it appears inside the note instead of on the sleeve.
- **iPhone photos (.HEIC) don't work in most browsers.** Export them as JPG first. The build tells you if it finds one.

## Site-wide words

- `content/settings.txt`: his name, the opening lines, the button, the note headings, and the placeholder tone switch.
- `content/last-note/details.txt`: the three lines of the final surprise, the greeting and the sign-off.
- `content/last-note/letter.txt`: the closing letter. Blank line between paragraphs. The signatures underneath are added automatically from every friend's name.

**Before you send him the link, set `placeholder-tone: off` in `content/settings.txt`.** While it's on, records without a song play a soft generated tone, labelled as a placeholder on the turntable.

---

## Run it on your computer

You need [Node.js](https://nodejs.org) 20.9 or newer.

```bash
npm install
npm run dev        # open http://localhost:3000
```

Every time it starts, it reads `content/` and prints a summary: which records have a song, cover, photo and message, and anything to fix. After changing content, restart `npm run dev` (or run `npm run content`) to pick it up.

Handy addresses while testing:

| Address | What it does |
| --- | --- |
| `/?unlock` | Marks every record as played, so you can see the last note |
| `/?reset`  | Clears saved progress |

---

## Host it on Render

The site builds into plain static files, so it runs as a **free Render Static Site**.

1. Put this folder in a GitHub repository (GitHub Desktop is the easiest way).
2. In Render, choose **New + → Blueprint** and pick the repository. `render.yaml` already has the settings.

   Or choose **New + → Static Site** and enter:
   - **Build command:** `npm ci && npm run build`
   - **Publish directory:** `out`
3. Every time you push a change (a new song, a message), Render rebuilds and the site updates in a minute or two.

**Keep the link private.** The page tells search engines not to list it, but anyone with the link can open it.

---

## How it's built (for adding features)

Next.js 16, React 19, TypeScript, Tailwind CSS 4 and Motion. No server or database: progress is saved in the browser.

```
content/                  ← all the gift's content (see above)
scripts/build-content.mjs reads content/, copies media to public/content/,
                          writes data/generated/content.ts (both regenerated each run)
app/
  layout.tsx              fonts, grain + vignette layers
  globals.css             colours, fonts, paper/wood/vinyl textures, shelf, last note
components/
  Experience.tsx          landing → collection → record / last note; phone back gesture
  landing/                opening lines, slow record, "Unwrap your gift"
  collection/             shelf, sleeves, tick index, tracklist, sealed envelope
  player/                 PlayerScene, Turntable (CSS + SVG), DeckControls, SpotifyDeck
  notes/LinerNote.tsx     the note tucked in each sleeve
  finale/Finale.tsx       ring of records, the letter, everyone's signatures
  ui/                     CoverArt, Sleeve, Vinyl
data/                     types + small files that read the generated content
lib/
  identity.ts             each record's colours, cover pattern, handwriting, tilt
  progress.ts             saved progress (played records, last note)
  playback/               the playback engine, Spotify loader, React hook
public/                   icon and placeholder tone; content/ is generated, don't edit
```

**Playback:** one shared audio player, so only one song plays at a time. The record only spins once the browser confirms the song is actually playing. If a record has no song file but has a Spotify link, it uses Spotify's official embed. That plays a 30-second preview unless he's logged into Spotify in the same browser.

**Accessibility:** everything works by tap, click or keyboard (Tab, Enter, Space to play/pause, Escape to go back). With Reduce Motion turned on, nothing spins or travels, but every step still happens.

Only use song files you have the right to play.
