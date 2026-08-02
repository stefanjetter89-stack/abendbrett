import { useMemo } from "react";
import { DISHES } from "../dishes.js";
import { CAT_ORDER, inGruppe } from "../constants.js";

/** Deterministischer Zufall — gleiche Saat ergibt gleiche Reihenfolge. */
function rng(seed) {
  let t = seed + 0x6d2b79f5;
  return () => {
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(arr, seed) {
  const a = [...arr];
  const r = rng(seed);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Bündelt Zusammenführung, Filterung und Auswahl der Vorschläge.
 * Ausgelagert aus der Komponente, damit die Logik einzeln testbar ist und
 * nicht bei jeder UI-Änderung angefasst werden muss.
 */
export function useSuggestions({ custom, hidden, zeit, modus, welt, chips, rejected, seed }) {
  const alle = useMemo(() => {
    const versteckt = new Set(hidden);
    return [...DISHES, ...custom].filter((d) => !versteckt.has(d.id));
  }, [custom, hidden]);

  const pool = useMemo(() => {
    const abgelehnt = new Set(rejected);
    const zeitBudget = chips.includes("schnell20") ? 20 : zeit;
    return alle.filter((d) => {
      if (abgelehnt.has(d.id)) return false;
      if (!inGruppe(d, welt)) return false;
      if (modus === "kochen" && d.cat === "bestellen") return false;
      if (modus === "bestellen" && d.cat !== "bestellen") return false;
      if (d.cat !== "bestellen" && d.min > zeitBudget) return false;
      if (chips.includes("ohneFleisch") && d.fleisch) return false;
      if (chips.includes("kalt") && !d.kalt) return false;
      if (chips.includes("vorrat") && !d.vorrat) return false;
      if (chips.includes("scharf") && !d.scharf) return false;
      return true;
    });
  }, [alle, zeit, modus, welt, chips, rejected]);

  const vorschlaege = useMemo(() => {
    const gemischt = shuffle(pool, seed);
    const gewaehlt = [];
    const genommen = new Set();
    const reihenfolge = modus === "bestellen" ? ["bestellen"] : CAT_ORDER;

    for (const cat of reihenfolge) {
      const treffer = gemischt.find((d) => d.cat === cat && !genommen.has(d.id));
      if (treffer) { gewaehlt.push(treffer); genommen.add(treffer.id); }
    }
    for (const d of gemischt) {
      if (gewaehlt.length >= 5) break;
      if (!genommen.has(d.id)) { gewaehlt.push(d); genommen.add(d.id); }
    }
    return gewaehlt.slice(0, 5);
  }, [pool, seed, modus]);

  return { alle, pool, vorschlaege };
}
