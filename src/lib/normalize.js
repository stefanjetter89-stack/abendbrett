/**
 * Normalisierung fremder Daten.
 *
 * Alles, was aus der geteilten Ablage oder dem lokalen Speicher kommt, ist
 * potenziell unvollständig, veraltet oder mutwillig manipuliert. Die App darf
 * daran nicht zerbrechen: ein Gericht ohne `zutaten`-Array hätte bisher beim
 * Rendern eine Ausnahme geworfen und die ganze Seite weiß werden lassen.
 * Deshalb wird hier jedes Feld auf einen sicheren Typ gezwungen.
 */
const CATS = new Set(["schnell", "leicht", "komfort", "neu", "bestellen"]);

const MAX = { name: 120, kueche: 40, zutat: 160, tipp: 400, zutaten: 40, tags: 12 };

const text = (wert, grenze) =>
  typeof wert === "string" ? wert.slice(0, grenze) : "";

/** Macht aus beliebigem Input ein renderbares Gericht — oder null, wenn unbrauchbar. */
export function normalizeDish(roh) {
  if (!roh || typeof roh !== "object") return null;
  const name = text(roh.name, MAX.name).trim();
  if (!name) return null; // ohne Namen ist die Kachel sinnlos

  const min = Number.isFinite(Number(roh.min))
    ? Math.min(Math.max(Math.round(Number(roh.min)), 0), 600)
    : 0;

  return {
    id: typeof roh.id === "string" || typeof roh.id === "number" ? roh.id : `x${Math.random()}`,
    name,
    kueche: text(roh.kueche, MAX.kueche).trim() || "Sonstiges",
    cat: CATS.has(roh.cat) ? roh.cat : "schnell",
    min,
    veg: Boolean(roh.veg),
    fleisch: Boolean(roh.fleisch),
    kalt: Boolean(roh.kalt),
    vorrat: Boolean(roh.vorrat),
    scharf: Boolean(roh.scharf),
    tags: Array.isArray(roh.tags)
      ? roh.tags.slice(0, MAX.tags).map((t) => text(t, 40)).filter(Boolean)
      : [],
    zutaten: Array.isArray(roh.zutaten)
      ? roh.zutaten.slice(0, MAX.zutaten).map((z) => text(z, MAX.zutat)).filter(Boolean)
      : [],
    tipp: text(roh.tipp, MAX.tipp),
    eigen: Boolean(roh.eigen),
  };
}

export const normalizeDishes = (liste) =>
  Array.isArray(liste) ? liste.map(normalizeDish).filter(Boolean) : [];

/** IDs ausgeblendeter Gerichte — nur primitive Werte zulassen. */
export const normalizeHidden = (liste) =>
  Array.isArray(liste)
    ? liste.filter((id) => typeof id === "string" || typeof id === "number").slice(0, 2000)
    : [];

/** Mitgliederliste: Name plus Zeitstempel, alles andere wird verworfen. */
export const normalizeMembers = (liste) =>
  Array.isArray(liste)
    ? liste
        .map((m) => {
          const name = text(m?.name, 60).trim();
          return name ? { name, seit: text(m?.seit, 40), zuletzt: text(m?.zuletzt, 40) } : null;
        })
        .filter(Boolean)
        .slice(0, 50)
    : [];
