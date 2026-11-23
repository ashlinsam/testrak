/**
 * One record in the collection. These are built from the /content folder
 * by scripts/build-content.mjs: edit /content, not this file.
 */
export type RecordEntry = {
  /** Stable id, used for progress tracking. Keep it unique, e.g. "record-07". */
  id: string;
  /** 1–24. Decides shelf order, the catalogue number and the generated cover. */
  recordNumber: number;
  /** The friend who chose this song. Shown in their own handwriting. */
  friendName: string;
  songTitle: string;
  artistName: string;

  /** Full Spotify track link, e.g. https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC */
  spotifyUrl?: string;
  /** Just the id part of the link above. Used for the embedded Spotify player fallback. */
  spotifyTrackId?: string;

  /** Sleeve cover image. Empty means the record gets a designed cover. */
  coverImage?: string;

  /** The note. Separate paragraphs with a blank line (\n\n). */
  personalMessage: string;
  /** Optional photo shown taped to the note. */
  optionalPhoto?: { src: string; alt: string; caption?: string } | null;
  /** Optional short title for the memory, e.g. "Bondi, 3am, summer 2019". */
  optionalMemoryTitle?: string;
  /** Optional sign-off in their words, e.g. "love Anna". Defaults to "— {friendName}". */
  optionalSignOff?: string;

  /** The song file. Played first if present. */
  optionalAudioSource?: string;
  /** Secret code in this record's NFC card link (?card=…). Generated, never edited by hand. */
  cardCode?: string;
};
