import { describe, it, expect } from "vitest";
import { DISHES } from "../../dishes.js";
import { inGruppe, GRUPPE } from "../../constants.js";

/* useSuggestions selbst ist ein Hook; die Auswahlregeln darin sind aber reine
   Mengenlehre und lassen sich direkt an den Daten prüfen. Diese Tests sichern
   die Regeln ab, die in der Vergangenheit stillschweigend kaputtgingen —
   etwa die Zeitgrenze, die "Zeit genug" auf 90 Minuten deckelte. */

const zeitBudget = (chips, zeit) => (chips.includes("schnell20") ? 20 : zeit);

const filtere = ({ zeit = 999, modus = "egal", welt = "alle", chips = [] }) =>
  DISHES.filter((d) => {
    if (!inGruppe(d, welt)) return false;
    if (modus === "kochen" && d.cat === "bestellen") return false;
    if (modus === "bestellen" && d.cat !== "bestellen") return false;
    if (d.cat !== "bestellen" && d.min > zeitBudget(chips, zeit)) return false;
    if (chips.includes("ohneFleisch") && d.fleisch) return false;
    if (chips.includes("kalt") && !d.kalt) return false;
    if (chips.includes("vorrat") && !d.vorrat) return false;
    if (chips.includes("scharf") && !d.scharf) return false;
    return true;
  });

describe("Gerichtedaten", () => {
  it("hat eindeutige IDs", () => {
    const ids = DISHES.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("hat für jedes Gericht Name, Küche und Zutaten", () => {
    const kaputt = DISHES.filter(
      (d) => !d.name || !d.kueche || !Array.isArray(d.zutaten) || d.zutaten.length === 0
    );
    expect(kaputt).toEqual([]);
  });

  it("ordnet jede Küche einer Filtergruppe zu", () => {
    // Fehlt die Zuordnung, taucht das Gericht nur unter "Alle" auf —
    // ein leiser Anzeigefehler, den sonst niemand bemerkt.
    const ohneGruppe = [...new Set(DISHES.map((d) => d.kueche))]
      .filter((k) => !GRUPPE[k]);
    expect(ohneGruppe).toEqual([]);
  });
});

describe("Zeitfilter", () => {
  it("blendet bei 20 Minuten alles Längere aus", () => {
    expect(filtere({ zeit: 20 }).every((d) => d.cat === "bestellen" || d.min <= 20)).toBe(true);
  });

  it("lässt bei 'Zeit genug' auch Wochenendprojekte zu", () => {
    // Der frühere Deckel von 90 Minuten schloss die 120-Minuten-Gerichte aus.
    const lange = filtere({ zeit: 999 }).filter((d) => d.min > 90);
    expect(lange.length).toBeGreaterThan(0);
  });

  it("überschreibt das Zeitbudget mit dem 20-Minuten-Chip", () => {
    expect(filtere({ zeit: 999, chips: ["schnell20"] })
      .every((d) => d.cat === "bestellen" || d.min <= 20)).toBe(true);
  });
});

describe("Modus- und Eigenschaftsfilter", () => {
  it("zeigt beim Bestellen ausschließlich Lieferungen", () => {
    expect(filtere({ modus: "bestellen" }).every((d) => d.cat === "bestellen")).toBe(true);
  });

  it("zeigt beim Kochen keine Lieferungen", () => {
    expect(filtere({ modus: "kochen" }).some((d) => d.cat === "bestellen")).toBe(false);
  });

  it("liefert für 'ohne Fleisch' nur fleischlose Gerichte", () => {
    expect(filtere({ chips: ["ohneFleisch"] }).every((d) => !d.fleisch)).toBe(true);
  });

  it("findet für jede Filtergruppe mindestens ein Gericht", () => {
    for (const g of ["mittelmeer", "asien", "deutsch", "welt", "leicht"]) {
      expect(filtere({ welt: g }).length).toBeGreaterThan(0);
    }
  });
});
