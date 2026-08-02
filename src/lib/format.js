/** Wandelt eine freie Eingabe in einen technischen Code: "Familie Jetter" -> "familie-jetter". */
export const slugify = (s) =>
  String(s ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Umlaute und Akzente einebnen
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

/** "heute" / "gestern" / "vor N Tagen" — toleriert fehlende oder kaputte Werte. */
export const seitWann = (iso) => {
  if (!iso) return "unbekannt";
  const ms = new Date(iso).getTime();
  if (Number.isNaN(ms)) return "unbekannt";
  const tage = Math.floor((Date.now() - ms) / 86400000);
  if (tage <= 0) return "heute";
  if (tage === 1) return "gestern";
  return `vor ${tage} Tagen`;
};

/** Vergleicht zwei Strukturen inhaltlich — verhindert überflüssige Schreibvorgänge. */
export const gleich = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Führt zwei Gerichtelisten zusammen (Konfliktfall beim gleichzeitigen
 * Speichern). Bei gleicher ID gewinnt der eigene, neuere Eintrag.
 *
 * Bewusste Abwägung: Ein Gericht, das ein Gerät gelöscht und das andere
 * parallel bearbeitet hat, taucht wieder auf. Ein wiederauferstandenes Gericht
 * ist leichter zu verschmerzen als ein verlorenes.
 */
export const vereineGerichte = (fremd, eigen) => {
  const nachId = new Map();
  for (const d of Array.isArray(fremd) ? fremd : []) nachId.set(d.id, d);
  for (const d of Array.isArray(eigen) ? eigen : []) nachId.set(d.id, d);
  return [...nachId.values()];
};

/** Vereinigt zwei ID-Listen (ausgeblendete Gerichte) ohne Dubletten. */
export const vereineIds = (a, b) => [
  ...new Set([...(Array.isArray(a) ? a : []), ...(Array.isArray(b) ? b : [])]),
];
