import { useCallback, useMemo, useState } from "react";
import "./styles.css";

import { DISHES } from "./dishes.js";
import { APP_VERSION } from "./constants.js";
import { supabaseAktiv } from "./lib/supabase.js";
import { useBoard } from "./hooks/useBoard.js";
import { useSuggestions } from "./hooks/useSuggestions.js";

import ControlPanel from "./components/ControlPanel.jsx";
import DishCard from "./components/DishCard.jsx";
import ShoppingList from "./components/ShoppingList.jsx";
import ManageTab from "./components/ManageTab.jsx";
import JoinGate from "./components/JoinGate.jsx";
import AbendCheck from "./components/AbendCheck.jsx";

const KUECHEN = [...new Set(DISHES.map((d) => d.kueche))].sort();

/**
 * Abendbrett — Hauptkomponente.
 *
 * Enthält bewusst nur noch Zusammenbau und Bedienzustand. Fachlogik liegt in
 * den Hooks (`useBoard`, `useSuggestions`), Darstellung in den Komponenten.
 * Vorher waren all das rund 1.100 Zeilen in einer Datei.
 */
export default function Abendbrett() {
  /* ---------- Geteilter Zustand ---------- */
  const {
    boardCode, memberName, members, custom, hidden,
    geladen, syncFehler,
    setCustom, setHidden, betrete, entferneMitglied,
  } = useBoard();

  /* ---------- Bedienzustand ---------- */
  const [zeit, setZeit] = useState(40);
  const [modus, setModus] = useState("egal");
  const [welt, setWelt] = useState("alle");
  const [chips, setChips] = useState([]);
  const [rejected, setRejected] = useState([]);
  const [selected, setSelected] = useState([]);
  const [openIng, setOpenIng] = useState(null);
  const [loeschAbfrage, setLoeschAbfrage] = useState(null);
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 100000));
  const [checkOpen, setCheckOpen] = useState(false);
  const [tab, setTab] = useState("vorschlaege");

  const { alle, pool, vorschlaege } = useSuggestions({
    custom, hidden, zeit, modus, welt, chips, rejected, seed,
  });

  const toggleChip = useCallback((id) => {
    setChips((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
  }, []);

  /* ---------- Gerichte verwalten ---------- */
  const gerichtHinzufuegen = useCallback((gericht) => {
    setCustom((c) => [...c, gericht]);
  }, [setCustom]);

  const gerichtEntfernen = useCallback((id) => {
    // Eigene Gerichte verschwinden ganz, mitgelieferte werden nur ausgeblendet.
    const eigenes = custom.some((d) => d.id === id);
    if (eigenes) setCustom((c) => c.filter((d) => d.id !== id));
    else setHidden((h) => (h.includes(id) ? h : [...h, id]));
    setSelected((s) => s.filter((x) => x !== id));
  }, [custom, setCustom, setHidden]);

  const gerichtWiederherstellen = useCallback((id) => {
    setHidden((h) => h.filter((x) => x !== id));
  }, [setHidden]);

  const reset = useCallback(() => {
    setRejected([]); setSelected([]); setOpenIng(null); setLoeschAbfrage(null);
  }, []);

  const ausgewaehlteGerichte = useMemo(
    () => alle.filter((d) => selected.includes(d.id)),
    [alle, selected]
  );

  const heute = useMemo(
    () => new Date().toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long" }),
    []
  );

  /* ---------- Einstieg: Kosmos wählen ----------
     Der frühere `if (!bereit)`-Zweig ist entfallen: `bereit` war im Hook eine
     Konstante `true` — der Block war nicht erreichbar. */
  if (supabaseAktiv && !boardCode) {
    return (
      <div className="ab-root">
        <div className="ab-wrap" style={{ maxWidth: 480 }}>
          <div style={{ marginTop: 60 }}>
            <h1 className="ab-title" style={{ fontSize: 24, marginBottom: 4 }}>Euer Kosmos</h1>
            <p style={{ fontSize: 14, color: "#4A6159", margin: "0 0 14px" }}>
              Vergebt einen Namen für eure Gruppe — Familie, Paar, WG. Wer denselben
              Namen eingibt, teilt sich dieselben Gerichte. Alle anderen sehen davon nichts.
            </p>
            <JoinGate onBetreten={betrete} />
            <p className="ab-note">
              Der Name wird nur auf diesem Gerät gemerkt. Auf dem Gerät der anderen
              einfach denselben Namen eintragen — schon teilt ihr euch die Liste.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- Hauptansicht ---------- */
  return (
    <div className="ab-root">
      <div className="ab-wrap">
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

        {syncFehler && <p className="ab-banner" role="alert">{syncFehler}</p>}

        {/* Tablist nach WAI-ARIA: Pfeiltasten wechseln zwischen den Tabs, tabIndex
            hält genau einen davon in der Tabreihenfolge. Der Tastaturhandler sitzt
            auf den Schaltflächen — der Container selbst ist nicht fokussierbar. */}
        <div className="ab-tabs" role="tablist" aria-label="Ansicht">
          {[["vorschlaege", "Vorschläge"], ["verwalten", "Gerichte verwalten"]].map(([id, label]) => (
            <button key={id} className="ab-tab" role="tab" id={`tab-${id}`}
              aria-selected={tab === id} aria-controls={`panel-${id}`}
              tabIndex={tab === id ? 0 : -1}
              onClick={() => setTab(id)}
              onKeyDown={(e) => {
                if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
                e.preventDefault();
                const naechster = id === "vorschlaege" ? "verwalten" : "vorschlaege";
                setTab(naechster);
                document.getElementById(`tab-${naechster}`)?.focus();
              }}
            >
              {label}
              {id === "verwalten" && <span className="ab-count">{alle.length}</span>}
            </button>
          ))}
        </div>

        {tab === "vorschlaege" && (
          <div id="panel-vorschlaege" role="tabpanel" aria-labelledby="tab-vorschlaege">
            <ControlPanel
              zeit={zeit} setZeit={setZeit}
              welt={welt} setWelt={setWelt}
              modus={modus} setModus={setModus}
              chips={chips} toggleChip={toggleChip}
              onWuerfeln={() => setSeed((s) => s + 1)}
              onReset={reset}
              trefferText={`${pool.length} von ${alle.length} Gerichten passen gerade`}
            />

            {!geladen ? (
              <p className="ab-skeleton">Gerichte werden geladen …</p>
            ) : (
              <div className="ab-grid">
                {vorschlaege.length === 0 && (
                  <div className="ab-panel">
                    <p className="ab-rowlabel">Keine Treffer</p>
                    <p className="ab-empty">
                      Die Kombination ist zu eng. Nimm einen Filter raus oder gib dem
                      Abend zehn Minuten mehr.
                    </p>
                    <button className="ab-mini" onClick={reset}>Zurücksetzen</button>
                  </div>
                )}

                {vorschlaege.map((d) => (
                  <DishCard
                    key={d.id}
                    dish={d}
                    gewaehlt={selected.includes(d.id)}
                    zutatenOffen={openIng === d.id}
                    loeschAbfrage={loeschAbfrage === d.id}
                    onToggle={() => setSelected((s) =>
                      s.includes(d.id) ? s.filter((x) => x !== d.id) : [...s, d.id])}
                    onZutaten={() => setOpenIng((v) => (v === d.id ? null : d.id))}
                    onAblehnen={() => setRejected((r) => [...r, d.id])}
                    onLoeschen={() => setLoeschAbfrage(d.id)}
                    onLoeschBestaetigt={() => { gerichtEntfernen(d.id); setLoeschAbfrage(null); }}
                    onLoeschAbbruch={() => setLoeschAbfrage(null)}
                  />
                ))}

                <button className="ab-add" onClick={() => setTab("verwalten")}>
                  <span className="ab-plus" aria-hidden="true">+</span>
                  <strong>Eigenes Gericht anlegen</strong>
                  <span>Fehlt euch etwas? Hier landet es dauerhaft in der Sammlung.</span>
                </button>
              </div>
            )}

            <ShoppingList gerichte={ausgewaehlteGerichte} onLeeren={() => setSelected([])} />

            <footer className="ab-foot">
              <b>Die Routine:</b> Vier Regler stellen (Zeit / Küche / Kochen oder Bestellen /
              Anpassen) → Kacheln durchgehen, &bdquo;Heute nicht&ldquo; wegwischen → eine Kachel nehmen →
              Liste kopieren. Zwei bis drei Gerichte auf einmal auswählen ergibt den Wocheneinkauf.
              <br />Abendbrett {APP_VERSION}
            </footer>
          </div>
        )}

        {tab === "verwalten" && (
          <div id="panel-verwalten" role="tabpanel" aria-labelledby="tab-verwalten">
            <ManageTab
              alle={alle}
              kuechen={KUECHEN}
              boardCode={boardCode}
              members={members}
              memberName={memberName}
              hidden={hidden}
              onHinzufuegen={gerichtHinzufuegen}
              onEntfernen={gerichtEntfernen}
              onWiederherstellen={gerichtWiederherstellen}
              onBetreten={betrete}
              onMitgliedEntfernen={entferneMitglied}
            />
          </div>
        )}
      </div>

      <AbendCheck
        offen={checkOpen}
        onClose={() => setCheckOpen(false)}
        zeit={zeit} setZeit={setZeit}
        welt={welt} setWelt={setWelt}
        modus={modus} setModus={setModus}
        chips={chips} toggleChip={toggleChip}
        onFertig={() => { setSeed((s) => s + 1); setCheckOpen(false); }}
      />
    </div>
  );
}
