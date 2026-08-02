/** Version der App — wird im Kopf und in der Fußzeile angezeigt. */
export const APP_VERSION = "v2.1";

export const CAT_LABEL = {
  schnell: "Schnell nach Feierabend",
  leicht: "Leicht & frisch",
  komfort: "Komfortfood",
  neu: "Etwas Neues",
  bestellen: "Bestellen",
};

/** Reihenfolge, in der pro Runde je eine Kachel gesucht wird. */
export const CAT_ORDER = ["schnell", "leicht", "komfort", "neu", "bestellen"];

/** Zuordnung Küche -> Filtergruppe. */
export const GRUPPE = {
  Italienisch: "mittelmeer", Mediterran: "mittelmeer", Spanisch: "mittelmeer", Griechisch: "mittelmeer",
  Gutbürgerlich: "deutsch", Schwäbisch: "deutsch",
  Asiatisch: "asien", Japanisch: "asien", Thai: "asien", Chinesisch: "asien",
  Vietnamesisch: "asien", Koreanisch: "asien", Indisch: "asien",
  Türkisch: "orient", Orientalisch: "orient",
  Mexikanisch: "streetfood", Amerikanisch: "streetfood",
  Protein: "leicht", Lieferung: "liefern",
};

export const GRUPPEN_BTN = [
  ["alle", "Alle"], ["mittelmeer", "Mittelmeer"], ["asien", "Asien"],
  ["deutsch", "Gutbürgerlich"], ["welt", "Orient & Streetfood"], ["leicht", "Leicht & Protein"],
];

export const inGruppe = (dish, gruppe) =>
  gruppe === "alle"
    ? true
    : gruppe === "welt"
      ? ["orient", "streetfood"].includes(GRUPPE[dish.kueche])
      : GRUPPE[dish.kueche] === gruppe;

export const CHIPS = [
  { id: "ohneFleisch", label: "Heute ohne Fleisch" },
  { id: "kalt", label: "Etwas Kaltes" },
  { id: "vorrat", label: "Wenig einkaufen" },
  { id: "scharf", label: "Darf scharf sein" },
  { id: "schnell20", label: "Muss in 20 Min stehen" },
];

export const ZEIT_OPTIONEN = [20, 30, 40, 999];
export const ZEIT_LABEL = (m) => (m === 999 ? "Zeit genug" : `bis ${m} Min`);

export const EIGENSCHAFTEN = [
  ["v", "Vegetarisch"], ["f", "Mit Fleisch"], ["s", "Fisch"],
  ["k", "Kalt"], ["p", "Vorratskammer"], ["x", "Scharf"],
];

/** Obergrenzen für das Anlegeformular. */
export const LIMITS = { nameLen: 120, minMin: 0, maxMin: 600, maxZutaten: 40 };
