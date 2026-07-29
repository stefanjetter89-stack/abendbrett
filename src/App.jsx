import { useState, useMemo, useEffect } from "react";
import { D, DISHES } from "./dishes.js";
import { supabase, supabaseAktiv } from "./supabaseClient.js";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Archivo:wght@600;800&family=Instrument+Sans:wght@400;500;600&family=Space+Mono:wght@400;700&display=swap');

.ab-root {
  --ink:#15302A;
  --ink-soft:#4A6159;
  --paper:#E6E7DD;
  --tile:#FFFFFF;
  --line:#C9CEC0;
  --hot:#E8A317;
  --hot-deep:#C2410C;
  --plum:#5E2A50;
  --font-d:'Archivo',system-ui,sans-serif;
  --font-b:'Instrument Sans',system-ui,sans-serif;
  --font-m:'Space Mono',ui-monospace,monospace;
  background:var(--paper);
  color:var(--ink);
  font-family:var(--font-b);
  min-height:100%;
  padding:22px 18px 60px;
  box-sizing:border-box;
}
.ab-root *,.ab-root *::before,.ab-root *::after{box-sizing:border-box;}
.ab-wrap{max-width:1080px;margin:0 auto;}

/* --- Kopf: Bedienleiste --- */
.ab-head{
  background:var(--ink);color:var(--paper);border-radius:14px;
  padding:16px 20px;display:flex;flex-wrap:wrap;gap:14px;
  align-items:center;justify-content:space-between;
}
.ab-title{
  font-family:var(--font-d);font-weight:800;font-size:30px;line-height:1;
  letter-spacing:-0.03em;text-transform:uppercase;margin:0;
}
.ab-sub{font-size:13px;color:#A9BDB2;margin:6px 0 0;}
.ab-readout{
  font-family:var(--font-m);font-size:12px;letter-spacing:0.08em;
  text-transform:uppercase;background:#0C201C;border:1px solid #27473F;
  padding:8px 12px;border-radius:8px;color:var(--hot);white-space:nowrap;
}

/* --- Regler --- */
.ab-panel{
  background:var(--tile);border:1px solid var(--line);border-radius:14px;
  padding:16px 18px;margin-top:14px;
}
.ab-rowlabel{
  font-family:var(--font-m);font-size:10.5px;letter-spacing:0.14em;
  text-transform:uppercase;color:var(--ink-soft);margin-bottom:8px;
}
.ab-seg{display:flex;flex-wrap:wrap;gap:6px;}
.ab-btn{
  font-family:var(--font-b);font-size:13.5px;font-weight:500;
  border:1px solid var(--line);background:#F6F6F0;color:var(--ink);
  padding:8px 13px;border-radius:999px;cursor:pointer;
  transition:background .15s,border-color .15s,color .15s;
}
.ab-btn:hover{background:#ECEDE3;}
.ab-btn[aria-pressed="true"]{background:var(--ink);border-color:var(--ink);color:#fff;}
.ab-btn.chip[aria-pressed="true"]{background:var(--plum);border-color:var(--plum);}
.ab-divider{height:1px;background:var(--line);margin:16px 0;}

/* --- Kacheln --- */
.ab-grid{
  display:grid;gap:14px;margin-top:14px;
  grid-template-columns:repeat(auto-fit,minmax(258px,1fr));
}
.ab-card{
  background:var(--tile);border:1px solid var(--line);border-radius:14px;
  padding:16px;display:flex;flex-direction:column;gap:10px;
  transition:border-color .18s, transform .18s;
}
.ab-card.on{border-color:var(--hot);border-width:2px;padding:15px;}
.ab-card-top{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;}
.ab-eyebrow{
  font-family:var(--font-m);font-size:10px;letter-spacing:0.16em;
  text-transform:uppercase;color:var(--ink-soft);
}
/* Signatur: die Herdplatte */
.ab-burner{
  width:22px;height:22px;border-radius:50%;flex:0 0 auto;
  border:2px solid var(--line);background:#F1F2EA;
  transition:box-shadow .25s,border-color .25s,background .25s;
}
.ab-card.on .ab-burner{
  border-color:var(--hot-deep);
  background:radial-gradient(circle at 50% 50%, #FFD166 0%, var(--hot) 45%, var(--hot-deep) 100%);
  box-shadow:0 0 0 4px rgba(232,163,23,.18), 0 0 14px rgba(194,65,12,.45);
}
.ab-name{
  font-family:var(--font-d);font-weight:600;font-size:19px;line-height:1.2;
  letter-spacing:-0.015em;margin:0;
}
.ab-meta{font-family:var(--font-m);font-size:11.5px;color:var(--ink-soft);letter-spacing:0.04em;}
.ab-tags{display:flex;flex-wrap:wrap;gap:5px;}
.ab-tag{
  font-size:11px;background:#EFF1E7;border:1px solid var(--line);
  border-radius:5px;padding:2px 7px;color:var(--ink-soft);
}
.ab-actions{display:flex;flex-wrap:wrap;gap:6px;margin-top:auto;padding-top:4px;}
.ab-mini{
  font-family:var(--font-b);font-size:12.5px;font-weight:600;cursor:pointer;
  border-radius:8px;padding:7px 11px;border:1px solid var(--ink);
  background:var(--ink);color:#fff;transition:opacity .15s;
}
.ab-mini:hover{opacity:.85;}
.ab-mini.ghost{background:transparent;color:var(--ink);border-color:var(--line);}
.ab-mini.ghost:hover{background:#F0F1E8;}
.ab-ing{
  background:#F7F8F1;border:1px dashed var(--line);border-radius:10px;
  padding:11px 13px;font-size:13px;line-height:1.65;
}
.ab-ing ul{margin:6px 0 0;padding-left:17px;}
.ab-tipp{font-size:12.5px;color:var(--ink-soft);margin-top:8px;font-style:italic;}

/* --- Einkaufsliste --- */
.ab-list{width:100%;min-height:150px;font-family:var(--font-m);font-size:12.5px;
  line-height:1.7;border:1px solid var(--line);border-radius:10px;padding:12px;
  background:#F7F8F1;color:var(--ink);resize:vertical;}
.ab-empty{font-size:14px;color:var(--ink-soft);padding:6px 0;}

/* --- Modal --- */
.ab-scrim{position:fixed;inset:0;background:rgba(21,48,42,.55);display:flex;
  align-items:center;justify-content:center;padding:18px;z-index:50;}
.ab-modal{background:var(--tile);border-radius:16px;padding:22px;max-width:440px;width:100%;
  border:2px solid var(--ink);max-height:90vh;overflow:auto;}
.ab-modal h2{font-family:var(--font-d);font-size:22px;margin:0 0 4px;letter-spacing:-0.02em;}
.ab-q{margin-top:16px;}

.ab-foot{margin-top:22px;font-size:13px;color:var(--ink-soft);line-height:1.7;}
.ab-foot b{color:var(--ink);}
.ab-root button:focus-visible,.ab-root textarea:focus-visible{
  outline:3px solid var(--hot-deep);outline-offset:2px;}

@media (max-width:560px){
  .ab-title{font-size:24px;}
  .ab-root{padding:14px 12px 44px;}
}
/* --- Tabs --- */
.ab-tabs{display:flex;gap:24px;margin-top:16px;border-bottom:2px solid var(--line);}
.ab-tab{font-family:var(--font-d);font-weight:600;font-size:15px;letter-spacing:-0.01em;
  background:none;border:none;border-bottom:3px solid transparent;margin-bottom:-2px;
  padding:10px 2px;color:var(--ink-soft);cursor:pointer;transition:color .15s,border-color .15s;}
.ab-tab:hover{color:var(--ink);}
.ab-tab[aria-selected="true"]{color:var(--ink);border-bottom-color:var(--hot-deep);}
.ab-count{font-family:var(--font-m);font-size:11px;color:var(--ink-soft);margin-left:6px;}

/* --- Kachel zum Anlegen --- */
.ab-add{border:2px dashed var(--line);background:transparent;border-radius:14px;
  min-height:190px;display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:6px;cursor:pointer;color:var(--ink-soft);font-family:var(--font-b);font-size:14px;
  transition:border-color .18s,color .18s;padding:16px;text-align:center;}
.ab-add:hover{border-color:var(--hot-deep);color:var(--ink);}
.ab-add .ab-plus{font-family:var(--font-d);font-weight:800;font-size:34px;line-height:1;}
.ab-mini.danger{background:var(--hot-deep);border-color:var(--hot-deep);color:#fff;}
.ab-confirm{font-size:12.5px;color:var(--hot-deep);font-weight:600;align-self:center;margin-right:2px;}

/* --- Gerichte verwalten --- */
.ab-form{display:grid;gap:10px;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));}
.ab-in{font-family:var(--font-b);font-size:13.5px;padding:8px 10px;border:1px solid var(--line);
  border-radius:8px;background:#F7F8F1;color:var(--ink);width:100%;}
.ab-in:focus{outline:2px solid var(--hot-deep);outline-offset:1px;}
.ab-item{display:flex;justify-content:space-between;align-items:center;gap:10px;
  padding:7px 0;border-bottom:1px solid var(--line);font-size:13.5px;}
.ab-item:last-child{border-bottom:none;}
.ab-scroll{max-height:280px;overflow:auto;margin-top:6px;}
.ab-note{font-size:12.5px;color:var(--ink-soft);margin:8px 0 0;}
.ab-eigen{font-family:var(--font-m);font-size:10px;letter-spacing:.1em;color:var(--hot-deep);}

@media (prefers-reduced-motion:reduce){
  .ab-root *{transition:none !important;}
}
`;

const CAT_LABEL = {
  schnell: "Schnell nach Feierabend",
  leicht: "Leicht & frisch",
  komfort: "Komfortfood",
  neu: "Etwas Neues",
  bestellen: "Bestellen",
};

const GRUPPE = {
  Italienisch: "mittelmeer", Mediterran: "mittelmeer", Spanisch: "mittelmeer", Griechisch: "mittelmeer",
  Gutbürgerlich: "deutsch", Schwäbisch: "deutsch",
  Asiatisch: "asien", Japanisch: "asien", Thai: "asien", Chinesisch: "asien",
  Vietnamesisch: "asien", Koreanisch: "asien", Indisch: "asien",
  Türkisch: "orient", Orientalisch: "orient",
  Mexikanisch: "streetfood", Amerikanisch: "streetfood",
  Protein: "leicht", Lieferung: "liefern",
};
const GRUPPEN_BTN = [
  ["alle", "Alle"], ["mittelmeer", "Mittelmeer"], ["asien", "Asien"],
  ["deutsch", "Gutbürgerlich"], ["welt", "Orient & Streetfood"], ["leicht", "Leicht & Protein"],
];
const inGruppe = (d, g) =>
  g === "alle" ? true
    : g === "welt" ? ["orient", "streetfood"].includes(GRUPPE[d.kueche])
      : GRUPPE[d.kueche] === g;

const CHIPS = [
  { id: "ohneFleisch", label: "Heute ohne Fleisch" },
  { id: "kalt", label: "Etwas Kaltes" },
  { id: "vorrat", label: "Wenig einkaufen" },
  { id: "scharf", label: "Darf scharf sein" },
  { id: "schnell20", label: "Muss in 20 Min stehen" },
];

/* --- kleiner deterministischer Zufall, damit „Neu würfeln" reproduzierbar bleibt --- */
function rng(seed) {
  let t = seed + 0x6d2b79f5;
  return function () {
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

/* --- Lokaler Speicher: window.storage im Artefakt, localStorage im eigenen Build ---
   Dient als Rückfall, solange Supabase nicht eingerichtet ist oder offline. */
const localStore = {
  async get(key) {
    try {
      if (typeof window !== "undefined" && window.storage) {
        const r = await window.storage.get(key);
        return r ? JSON.parse(r.value) : null;
      }
      const v = window.localStorage.getItem(key);
      return v ? JSON.parse(v) : null;
    } catch { return null; }
  },
  async set(key, value) {
    try {
      if (typeof window !== "undefined" && window.storage) {
        await window.storage.set(key, JSON.stringify(value));
        return true;
      }
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch { return false; }
  },
};

/* --- Geteilte Ablage in Supabase: eine einzige Zeile (id = 1) mit den zwei Listen.
   Reicht für "ein Paar teilt ein Dashboard" völlig aus — kein Konto, kein Login. --- */
const SHARED_ROW_ID = 1;

const sharedStore = {
  async load() {
    if (!supabaseAktiv) return null;
    const { data, error } = await supabase
      .from("abendbrett_state")
      .select("custom, hidden")
      .eq("id", SHARED_ROW_ID)
      .maybeSingle();
    if (error || !data) return null;
    return {
      custom: Array.isArray(data.custom) ? data.custom : [],
      hidden: Array.isArray(data.hidden) ? data.hidden : [],
    };
  },
  async save(partial) {
    if (!supabaseAktiv) return false;
    const { error } = await supabase
      .from("abendbrett_state")
      .upsert({ id: SHARED_ROW_ID, ...partial, updated_at: new Date().toISOString() });
    return !error;
  },
  subscribe(onChange) {
    if (!supabaseAktiv) return () => {};
    const channel = supabase
      .channel("abendbrett_state_changes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "abendbrett_state", filter: `id=eq.${SHARED_ROW_ID}` },
        (payload) => onChange(payload.new)
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  },
};

/* Bei jeder inhaltlichen Änderung hochzählen — macht sichtbar, ob eine neue
   Version wirklich angekommen ist. Format: v<Haupt>.<Neben> */
const APP_VERSION = "v1.2";

const KUECHEN = [...new Set(DISHES.map((d) => d.kueche))].sort();

export default function Abendbrett() {
  const [zeit, setZeit] = useState(40);          // Minutenbudget
  const [modus, setModus] = useState("egal");    // kochen | bestellen | egal
  const [welt, setWelt] = useState("alle");      // Küchen-Gruppe
  const [chips, setChips] = useState([]);
  const [rejected, setRejected] = useState([]);
  const [selected, setSelected] = useState([]);
  const [openIng, setOpenIng] = useState(null);
  const [seed, setSeed] = useState(7);
  const [checkOpen, setCheckOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const [custom, setCustom] = useState([]);   // selbst angelegte Gerichte
  const [hidden, setHidden] = useState([]);   // gelöschte Gerichte
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("vorschlaege");
  const [confirmDel, setConfirmDel] = useState(null);
  const [suche, setSuche] = useState("");
  const [status, setStatus] = useState("");
  const [form, setForm] = useState({
    name: "", kueche: "Gutbürgerlich", cat: "schnell", min: 30, flags: [], zutaten: "",
  });

  /* Laden: zuerst versuchen, die geteilte Ablage zu holen; sonst lokal */
  useEffect(() => {
    let live = true;
    (async () => {
      const shared = await sharedStore.load();
      if (shared) {
        if (!live) return;
        setCustom(shared.custom);
        setHidden(shared.hidden);
        setLoaded(true);
        return;
      }
      const c = await localStore.get("abendbrett:custom");
      const h = await localStore.get("abendbrett:hidden");
      if (!live) return;
      if (Array.isArray(c)) setCustom(c);
      if (Array.isArray(h)) setHidden(h);
      setLoaded(true);
    })();
    return () => { live = false; };
  }, []);

  /* Live-Sync: Änderungen vom Partnergerät sofort übernehmen */
  useEffect(() => {
    if (!supabaseAktiv) return undefined;
    return sharedStore.subscribe((row) => {
      if (Array.isArray(row.custom)) setCustom(row.custom);
      if (Array.isArray(row.hidden)) setHidden(row.hidden);
    });
  }, []);

  /* Speichern: bei aktiver Supabase-Anbindung geteilt, sonst nur lokal */
  useEffect(() => {
    if (!loaded) return;
    if (supabaseAktiv) sharedStore.save({ custom, hidden });
    else localStore.set("abendbrett:custom", custom);
  }, [custom, loaded]);
  useEffect(() => {
    if (!loaded) return;
    if (supabaseAktiv) sharedStore.save({ custom, hidden });
    else localStore.set("abendbrett:hidden", hidden);
  }, [hidden, loaded]);

  const alle = useMemo(
    () => [...DISHES, ...custom].filter((d) => !hidden.includes(d.id)),
    [custom, hidden]
  );

  const addDish = () => {
    const name = form.name.trim();
    if (!name) { setStatus("Bitte einen Namen eingeben."); return; }
    const zut = form.zutaten.split("\n").map((z) => z.trim()).filter(Boolean);
    const neu = {
      ...D(name, form.kueche, form.cat, Number(form.min) || 0, form.flags.join(""),
        zut.length ? zut : ["Zutaten noch ergänzen"]),
      id: `c${Date.now()}`, eigen: true,
    };
    setCustom((c) => [...c, neu]);
    setForm({ name: "", kueche: form.kueche, cat: form.cat, min: 30, flags: [], zutaten: "" });
    setStatus(`„${name}" ist gespeichert.`);
  };

  const removeDish = (id) => {
    if (String(id).startsWith("c")) setCustom((c) => c.filter((d) => d.id !== id));
    else setHidden((h) => [...h, id]);
    setSelected((s) => s.filter((x) => x !== id));
  };
  const restoreDish = (id) => setHidden((h) => h.filter((x) => x !== id));
  const toggleFlag = (f) =>
    setForm((s) => ({ ...s, flags: s.flags.includes(f) ? s.flags.filter((x) => x !== f) : [...s.flags, f] }));


  const toggleChip = (id) =>
    setChips((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));

  const heute = new Date().toLocaleDateString("de-DE", {
    weekday: "long", day: "2-digit", month: "long",
  });

  const pool = useMemo(() => {
    const zeitBudget = chips.includes("schnell20") ? 20 : zeit;
    return alle.filter((d) => {
      if (rejected.includes(d.id)) return false;
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
  }, [zeit, modus, chips, rejected, welt, alle]);

  const vorschlaege = useMemo(() => {
    const mixed = shuffle(pool, seed);
    const out = [];
    const order = modus === "bestellen"
      ? ["bestellen"]
      : ["schnell", "leicht", "komfort", "neu", "bestellen"];
    order.forEach((cat) => {
      const hit = mixed.find((d) => d.cat === cat && !out.includes(d));
      if (hit) out.push(hit);
    });
    mixed.forEach((d) => { if (out.length < 5 && !out.includes(d)) out.push(d); });
    return out.slice(0, 5);
  }, [pool, seed, modus]);

  const selectedDishes = alle.filter((d) => selected.includes(d.id));
  const einkauf = selectedDishes.flatMap((d) =>
    [`── ${d.name} ──`, ...d.zutaten]
  ).join("\n");

  const copyList = async () => {
    try {
      await navigator.clipboard.writeText(einkauf);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const reset = () => { setRejected([]); setSelected([]); setOpenIng(null); };

  return (
    <div className="ab-root">
      <style>{CSS}</style>
      <div className="ab-wrap">

        {/* ---------- Kopf ---------- */}
        <header className="ab-head">
          <div>
            <h1 className="ab-title">Abendbrett</h1>
            <p className="ab-sub">Was gibt&rsquo;s heute Abend? Vier Regler, fünf Vorschläge, fertig.</p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span className="ab-readout">{heute} · {APP_VERSION}</span>
            <button className="ab-mini ghost" style={{ color: "#E6E7DD", borderColor: "#27473F" }}
              onClick={() => setCheckOpen(true)}>Abend-Check</button>
          </div>
        </header>

        {/* ---------- Tabs ---------- */}
        <div className="ab-tabs" role="tablist">
          <button className="ab-tab" role="tab" aria-selected={tab === "vorschlaege"}
            onClick={() => setTab("vorschlaege")}>Vorschläge</button>
          <button className="ab-tab" role="tab" aria-selected={tab === "verwalten"}
            onClick={() => setTab("verwalten")}>
            Gerichte verwalten<span className="ab-count">{alle.length}</span>
          </button>
        </div>

        {tab === "vorschlaege" && (<>
        {/* ---------- Regler ---------- */}
        <section className="ab-panel">
          <div className="ab-rowlabel">Wie viel Zeit ist heute?</div>
          <div className="ab-seg">
            {[20, 30, 40, 999].map((m) => (
              <button key={m} className="ab-btn" aria-pressed={zeit === m}
                onClick={() => setZeit(m)}>
                {m === 999 ? "Zeit genug" : `bis ${m} Min`}
              </button>
            ))}
          </div>

          <div className="ab-divider" />
          <div className="ab-rowlabel">Worauf habt ihr Lust?</div>
          <div className="ab-seg">
            {GRUPPEN_BTN.map(([v, l]) => (
              <button key={v} className="ab-btn" aria-pressed={welt === v}
                onClick={() => setWelt(v)}>{l}</button>
            ))}
          </div>

          <div className="ab-divider" />
          <div className="ab-rowlabel">Kochen oder bestellen?</div>
          <div className="ab-seg">
            {[["kochen", "Wir kochen"], ["bestellen", "Wir bestellen"], ["egal", "Zeig mir beides"]].map(([v, l]) => (
              <button key={v} className="ab-btn" aria-pressed={modus === v}
                onClick={() => setModus(v)}>{l}</button>
            ))}
          </div>

          <div className="ab-divider" />
          <div className="ab-rowlabel">Anpassen — was soll heute anders sein?</div>
          <div className="ab-seg">
            {CHIPS.map((c) => (
              <button key={c.id} className="ab-btn chip" aria-pressed={chips.includes(c.id)}
                onClick={() => toggleChip(c.id)}>{c.label}</button>
            ))}
          </div>

          <div className="ab-divider" />
          <div className="ab-seg">
            <button className="ab-mini" onClick={() => setSeed((s) => s + 1)}>Neu würfeln</button>
            <button className="ab-mini ghost" onClick={reset}>Alles zurücksetzen</button>
            <span style={{ fontSize: 12.5, color: "#4A6159", alignSelf: "center" }}>
              {pool.length} von {alle.length} Gerichten passen gerade
            </span>
          </div>
        </section>

        {/* ---------- Vorschläge ---------- */}
        <div className="ab-grid">
          {vorschlaege.length === 0 && (
            <div className="ab-panel">
              <div className="ab-rowlabel">Keine Treffer</div>
              <p className="ab-empty">
                Die Kombination ist zu eng. Nimm einen Filter raus oder gib dem Abend
                zehn Minuten mehr.
              </p>
              <button className="ab-mini" onClick={reset}>Zurücksetzen</button>
            </div>
          )}

          {vorschlaege.map((d) => {
            const on = selected.includes(d.id);
            return (
              <article key={d.id} className={`ab-card${on ? " on" : ""}`}>
                <div className="ab-card-top">
                  <span className="ab-eyebrow">{CAT_LABEL[d.cat]}</span>
                  <span className="ab-burner" aria-hidden="true" />
                </div>

                <h3 className="ab-name">{d.name}</h3>
                <div className="ab-meta">
                  {d.cat === "bestellen" ? "LIEFERZEIT" : `${d.min} MIN`} · {d.kueche.toUpperCase()}
                </div>

                <div className="ab-tags">
                  {d.tags.map((t) => <span className="ab-tag" key={t}>{t}</span>)}
                </div>

                {openIng === d.id && (
                  <div className="ab-ing">
                    <strong>{d.cat === "bestellen" ? "Dazu daheim" : "Für 2 Personen"}</strong>
                    <ul>{d.zutaten.map((z) => <li key={z}>{z}</li>)}</ul>
                    {d.tipp && <div className="ab-tipp">{d.tipp}</div>}
                  </div>
                )}

                {confirmDel === d.id ? (
                  <div className="ab-actions">
                    <span className="ab-confirm">Dauerhaft löschen?</span>
                    <button className="ab-mini danger"
                      onClick={() => { removeDish(d.id); setConfirmDel(null); }}>Ja, löschen</button>
                    <button className="ab-mini ghost"
                      onClick={() => setConfirmDel(null)}>Abbrechen</button>
                  </div>
                ) : (
                  <div className="ab-actions">
                    <button className="ab-mini"
                      onClick={() => setSelected((s) => on ? s.filter((x) => x !== d.id) : [...s, d.id])}>
                      {on ? "Wieder runter" : "Nehmen wir"}
                    </button>
                    <button className="ab-mini ghost"
                      onClick={() => setOpenIng(openIng === d.id ? null : d.id)}>
                      {openIng === d.id ? "Zutaten zu" : "Zutaten"}
                    </button>
                    <button className="ab-mini ghost"
                      onClick={() => setRejected((r) => [...r, d.id])}>Heute nicht</button>
                    <button className="ab-mini ghost"
                      onClick={() => setConfirmDel(d.id)}>Löschen</button>
                  </div>
                )}
              </article>
            );
          })}

          <button className="ab-add" onClick={() => setTab("verwalten")}>
            <span className="ab-plus" aria-hidden="true">+</span>
            <strong>Eigenes Gericht anlegen</strong>
            <span>Fehlt euch etwas? Hier landet es dauerhaft in der Sammlung.</span>
          </button>
        </div>

        {/* ---------- Einkaufsliste ---------- */}
        <section className="ab-panel" style={{ marginTop: 18 }}>
          <div className="ab-rowlabel">
            Auf dem Brett {selectedDishes.length > 0 && `(${selectedDishes.length})`}
          </div>
          {selectedDishes.length === 0 ? (
            <p className="ab-empty">
              Noch nichts ausgewählt. Tipp „Nehmen wir" auf einer Kachel – die Zutaten
              landen automatisch hier in der Einkaufsliste.
            </p>
          ) : (
            <>
              <p style={{ fontSize: 14, margin: "0 0 10px" }}>
                {selectedDishes.map((d) => d.name).join(" · ")}
              </p>
              <textarea className="ab-list" value={einkauf} readOnly
                onFocus={(e) => e.target.select()} aria-label="Einkaufsliste" />
              <div className="ab-actions" style={{ marginTop: 10 }}>
                <button className="ab-mini" onClick={copyList}>
                  {copied ? "Kopiert" : "Liste kopieren"}
                </button>
                <button className="ab-mini ghost" onClick={() => setSelected([])}>Liste leeren</button>
              </div>
            </>
          )}
        </section>

        {/* ---------- Routine ---------- */}
        </>)}

        {/* ---------- Gerichte verwalten ---------- */}
        {tab === "verwalten" && (
          <section className="ab-panel" style={{ marginTop: 18 }}>
            <p className="ab-note" style={{ marginTop: 0 }}>
              {supabaseAktiv
                ? "Geteilte Ablage aktiv – Änderungen sehen alle Geräte, die dieses Abendbrett öffnen."
                : "Geteilte Ablage nicht eingerichtet – Änderungen bleiben nur auf diesem Gerät (siehe README)."}
            </p>
            <div className="ab-rowlabel">Neues Gericht anlegen</div>
            <div className="ab-form">
              <input className="ab-in" placeholder="Name des Gerichts" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} aria-label="Name" />
              <select className="ab-in" value={form.kueche} aria-label="Küche"
                onChange={(e) => setForm({ ...form, kueche: e.target.value })}>
                {KUECHEN.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
              <select className="ab-in" value={form.cat} aria-label="Kategorie"
                onChange={(e) => setForm({ ...form, cat: e.target.value })}>
                {Object.entries(CAT_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <input className="ab-in" type="number" min="0" max="240" value={form.min}
                aria-label="Minuten" onChange={(e) => setForm({ ...form, min: e.target.value })} />
            </div>

            <div style={{ marginTop: 12 }}>
              <div className="ab-rowlabel">Eigenschaften</div>
              <div className="ab-seg">
                {[["v", "Vegetarisch"], ["f", "Mit Fleisch"], ["s", "Fisch"],
                  ["k", "Kalt"], ["p", "Vorratskammer"], ["x", "Scharf"]].map(([v, l]) => (
                  <button key={v} className="ab-btn chip" aria-pressed={form.flags.includes(v)}
                    onClick={() => toggleFlag(v)}>{l}</button>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <div className="ab-rowlabel">Zutaten – eine pro Zeile</div>
              <textarea className="ab-in" rows="4" value={form.zutaten}
                placeholder={"250 g Nudeln\n1 Zwiebel\n..."}
                onChange={(e) => setForm({ ...form, zutaten: e.target.value })} />
            </div>

            <div className="ab-actions" style={{ marginTop: 12 }}>
              <button className="ab-mini" onClick={addDish}>Gericht speichern</button>
              {status && <span className="ab-note" style={{ alignSelf: "center" }}>{status}</span>}
            </div>

            <div className="ab-divider" />
            <div className="ab-rowlabel">Gerichte durchsuchen und löschen</div>
            <input className="ab-in" placeholder="Suchen …" value={suche}
              onChange={(e) => setSuche(e.target.value)} aria-label="Gerichte suchen" />
            <div className="ab-scroll">
              {alle
                .filter((d) => d.name.toLowerCase().includes(suche.toLowerCase()))
                .slice(0, 60)
                .map((d) => (
                  <div className="ab-item" key={d.id}>
                    <span>
                      {d.name}{" "}
                      <span className="ab-meta">· {d.kueche}{d.min > 0 ? ` · ${d.min} Min` : ""}</span>
                      {d.eigen && <span className="ab-eigen"> EIGEN</span>}
                    </span>
                    {confirmDel === d.id ? (
                      <span style={{ display: "flex", gap: 6 }}>
                        <button className="ab-mini danger"
                          onClick={() => { removeDish(d.id); setConfirmDel(null); }}>Ja, löschen</button>
                        <button className="ab-mini ghost"
                          onClick={() => setConfirmDel(null)}>Abbrechen</button>
                      </span>
                    ) : (
                      <button className="ab-mini ghost"
                        onClick={() => setConfirmDel(d.id)}>Löschen</button>
                    )}
                  </div>
                ))}
            </div>
            <p className="ab-note">
              Es werden bis zu 60 Treffer angezeigt. Eigene Gerichte werden endgültig gelöscht,
              mitgelieferte nur ausgeblendet und lassen sich unten zurückholen.
            </p>

            {hidden.length > 0 && (
              <>
                <div className="ab-divider" />
                <div className="ab-rowlabel">Ausgeblendet ({hidden.length})</div>
                <div className="ab-scroll">
                  {DISHES.filter((d) => hidden.includes(d.id)).map((d) => (
                    <div className="ab-item" key={d.id}>
                      <span>{d.name}</span>
                      <button className="ab-mini ghost" onClick={() => restoreDish(d.id)}>Zurückholen</button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {tab === "vorschlaege" && (
        <footer className="ab-foot">
          <b>Die Routine:</b> Vier Regler stellen (Zeit / Küche / Kochen oder Bestellen /
          Anpassen) → Kacheln durchgehen, „Heute nicht" wegwischen → eine Kachel nehmen →
          Liste kopieren. Zwei bis drei Gerichte auf einmal auswählen ergibt den Wocheneinkauf.
          <br />Abendbrett {APP_VERSION}
        </footer>
        )}
      </div>

      {/* ---------- Abend-Check ---------- */}
      {checkOpen && (
        <div className="ab-scrim" role="dialog" aria-modal="true" aria-label="Abend-Check">
          <div className="ab-modal">
            <h2>Abend-Check</h2>
            <p style={{ fontSize: 14, color: "#4A6159", margin: 0 }}>
              Vier Fragen, dann stehen die Vorschläge.
            </p>

            <div className="ab-q">
              <div className="ab-rowlabel">1 · Wie viel Zeit ist heute?</div>
              <div className="ab-seg">
                {[20, 30, 40, 999].map((m) => (
                  <button key={m} className="ab-btn" aria-pressed={zeit === m}
                    onClick={() => setZeit(m)}>{m === 999 ? "Zeit genug" : `bis ${m} Min`}</button>
                ))}
              </div>
            </div>

            <div className="ab-q">
              <div className="ab-rowlabel">2 · Worauf habt ihr Lust?</div>
              <div className="ab-seg">
                {GRUPPEN_BTN.map(([v, l]) => (
                  <button key={v} className="ab-btn" aria-pressed={welt === v}
                    onClick={() => setWelt(v)}>{l}</button>
                ))}
              </div>
            </div>

            <div className="ab-q">
              <div className="ab-rowlabel">3 · Lust auf Kochen oder Bestellen?</div>
              <div className="ab-seg">
                {[["kochen", "Kochen"], ["bestellen", "Bestellen"], ["egal", "Egal"]].map(([v, l]) => (
                  <button key={v} className="ab-btn" aria-pressed={modus === v}
                    onClick={() => setModus(v)}>{l}</button>
                ))}
              </div>
            </div>

            <div className="ab-q">
              <div className="ab-rowlabel">4 · Etwas Besonderes heute?</div>
              <div className="ab-seg">
                {CHIPS.map((c) => (
                  <button key={c.id} className="ab-btn chip" aria-pressed={chips.includes(c.id)}
                    onClick={() => toggleChip(c.id)}>{c.label}</button>
                ))}
              </div>
            </div>

            <div className="ab-actions" style={{ marginTop: 18 }}>
              <button className="ab-mini" onClick={() => { setSeed((s) => s + 1); setCheckOpen(false); }}>
                Vorschläge zeigen
              </button>
              <button className="ab-mini ghost" onClick={() => setCheckOpen(false)}>Überspringen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
