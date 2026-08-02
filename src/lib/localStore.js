/**
 * Gerätelokale Ablage.
 *
 * Kapselt localStorage inklusive der Fälle, in denen es nicht verfügbar ist
 * (Privatmodus in Safari, deaktivierte Cookies, serverseitiges Rendering).
 * Fällt dann still auf einen In-Memory-Speicher zurück, statt zu werfen.
 */
const speicher = new Map();

const verfuegbar = (() => {
  try {
    if (typeof window === "undefined" || !window.localStorage) return false;
    const probe = "__abendbrett_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
})();

export const localStore = {
  get(key) {
    try {
      if (!verfuegbar) return speicher.has(key) ? speicher.get(key) : null;
      const roh = window.localStorage.getItem(key);
      return roh ? JSON.parse(roh) : null;
    } catch {
      return null; // beschädigter Eintrag darf die App nicht blockieren
    }
  },
  set(key, value) {
    try {
      if (!verfuegbar) { speicher.set(key, value); return true; }
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false; // z. B. Quota überschritten
    }
  },
  remove(key) {
    try {
      if (!verfuegbar) { speicher.delete(key); return true; }
      window.localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },
};

export const KEYS = {
  boardCode: "abendbrett:boardcode",
  memberName: "abendbrett:membername",
  custom: "abendbrett:custom",
  hidden: "abendbrett:hidden",
};
