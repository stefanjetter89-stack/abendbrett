import { describe, it, expect } from "vitest";
import { slugify, seitWann, gleich, vereineGerichte, vereineIds } from "../format.js";
import { normalizeDish, normalizeDishes, normalizeHidden, normalizeMembers } from "../normalize.js";

/* Diese Funktionen sind rein — sie lassen sich ohne Browser, ohne Netz und
   ohne React prüfen. Genau deshalb liegen sie außerhalb der Komponenten. */

describe("slugify", () => {
  it("wandelt Umlaute und Leerzeichen um", () => {
    expect(slugify("Familie Müller")).toBe("familie-muller");
  });
  it("entfernt führende und schließende Trenner", () => {
    expect(slugify("  --Küche 42--  ")).toBe("kuche-42");
  });
  it("verträgt null und Zahlen", () => {
    expect(slugify(null)).toBe("");
    expect(slugify(42)).toBe("42");
  });
  it("begrenzt die Länge", () => {
    expect(slugify("a".repeat(200)).length).toBe(60);
  });
});

describe("seitWann", () => {
  it("meldet unbekannt bei kaputten Werten", () => {
    expect(seitWann(null)).toBe("unbekannt");
    expect(seitWann("kein datum")).toBe("unbekannt");
  });
  it("erkennt heute und gestern", () => {
    expect(seitWann(new Date().toISOString())).toBe("heute");
    expect(seitWann(new Date(Date.now() - 86400000).toISOString())).toBe("gestern");
  });
});

describe("normalizeDish", () => {
  it("verwirft Einträge ohne Namen", () => {
    expect(normalizeDish({ name: "   " })).toBeNull();
    expect(normalizeDish(null)).toBeNull();
    expect(normalizeDish("kein objekt")).toBeNull();
  });

  it("erzwingt sichere Typen bei fehlenden Feldern", () => {
    // Genau dieser Fall ließ die Vorversion beim Rendern abstürzen.
    const d = normalizeDish({ name: "Testgericht" });
    expect(Array.isArray(d.zutaten)).toBe(true);
    expect(Array.isArray(d.tags)).toBe(true);
    expect(typeof d.min).toBe("number");
    expect(d.kueche).toBe("Sonstiges");
  });

  it("begrenzt Minuten auf einen sinnvollen Bereich", () => {
    expect(normalizeDish({ name: "X", min: -50 }).min).toBe(0);
    expect(normalizeDish({ name: "X", min: 99999 }).min).toBe(600);
    expect(normalizeDish({ name: "X", min: "abc" }).min).toBe(0);
  });

  it("kappt überlange Texte und Listen", () => {
    const d = normalizeDish({
      name: "N".repeat(500),
      zutaten: Array(200).fill("z".repeat(500)),
    });
    expect(d.name.length).toBeLessThanOrEqual(120);
    expect(d.zutaten.length).toBeLessThanOrEqual(40);
    expect(d.zutaten[0].length).toBeLessThanOrEqual(160);
  });

  it("fällt bei unbekannter Kategorie auf schnell zurück", () => {
    expect(normalizeDish({ name: "X", cat: "quatsch" }).cat).toBe("schnell");
  });
});

describe("normalizeDishes / normalizeHidden / normalizeMembers", () => {
  it("verträgt Nicht-Listen", () => {
    expect(normalizeDishes("kaputt")).toEqual([]);
    expect(normalizeHidden(null)).toEqual([]);
    expect(normalizeMembers(undefined)).toEqual([]);
  });
  it("filtert unbrauchbare Einträge heraus", () => {
    expect(normalizeDishes([{ name: "Gut" }, null, {}]).length).toBe(1);
    expect(normalizeHidden([1, "a", { b: 2 }, null])).toEqual([1, "a"]);
    expect(normalizeMembers([{ name: "Stefan" }, { name: "" }]).length).toBe(1);
  });
});

describe("Zusammenführung im Konfliktfall", () => {
  it("behält Gerichte beider Seiten", () => {
    const fremd = [{ id: "a", name: "Fremd" }];
    const eigen = [{ id: "b", name: "Eigen" }];
    expect(vereineGerichte(fremd, eigen).map((d) => d.id).sort()).toEqual(["a", "b"]);
  });

  it("bevorzugt bei gleicher ID den eigenen Stand", () => {
    const fremd = [{ id: "a", name: "Alt" }];
    const eigen = [{ id: "a", name: "Neu" }];
    expect(vereineGerichte(fremd, eigen)).toEqual([{ id: "a", name: "Neu" }]);
  });

  it("vereinigt ID-Listen ohne Dubletten", () => {
    expect(vereineIds([1, 2], [2, 3])).toEqual([1, 2, 3]);
    expect(vereineIds(null, undefined)).toEqual([]);
  });
});

describe("gleich", () => {
  it("erkennt inhaltliche Gleichheit", () => {
    expect(gleich([{ a: 1 }], [{ a: 1 }])).toBe(true);
    expect(gleich([{ a: 1 }], [{ a: 2 }])).toBe(false);
  });
});
