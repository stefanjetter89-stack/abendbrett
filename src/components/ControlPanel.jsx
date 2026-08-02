import { CHIPS, GRUPPEN_BTN, ZEIT_OPTIONEN, ZEIT_LABEL } from "../constants.js";

/** Die vier Regler. Reine Darstellung, kein eigener Zustand. */
export default function ControlPanel({
  zeit, setZeit, welt, setWelt, modus, setModus,
  chips, toggleChip, onWuerfeln, onReset, trefferText,
}) {
  return (
    <section className="ab-panel" aria-label="Filter">
      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="ab-rowlabel">Wie viel Zeit ist heute?</legend>
        <div className="ab-seg">
          {ZEIT_OPTIONEN.map((m) => (
            <button key={m} className="ab-btn" aria-pressed={zeit === m}
              onClick={() => setZeit(m)}>{ZEIT_LABEL(m)}</button>
          ))}
        </div>
      </fieldset>

      <div className="ab-divider" />
      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="ab-rowlabel">Worauf habt ihr Lust?</legend>
        <div className="ab-seg">
          {GRUPPEN_BTN.map(([v, l]) => (
            <button key={v} className="ab-btn" aria-pressed={welt === v}
              onClick={() => setWelt(v)}>{l}</button>
          ))}
        </div>
      </fieldset>

      <div className="ab-divider" />
      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="ab-rowlabel">Kochen oder bestellen?</legend>
        <div className="ab-seg">
          {[["kochen", "Wir kochen"], ["bestellen", "Wir bestellen"], ["egal", "Zeig mir beides"]].map(([v, l]) => (
            <button key={v} className="ab-btn" aria-pressed={modus === v}
              onClick={() => setModus(v)}>{l}</button>
          ))}
        </div>
      </fieldset>

      <div className="ab-divider" />
      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="ab-rowlabel">Anpassen — was soll heute anders sein?</legend>
        <div className="ab-seg">
          {CHIPS.map((c) => (
            <button key={c.id} className="ab-btn chip" aria-pressed={chips.includes(c.id)}
              onClick={() => toggleChip(c.id)}>{c.label}</button>
          ))}
        </div>
      </fieldset>

      <div className="ab-divider" />
      <div className="ab-seg">
        <button className="ab-mini" onClick={onWuerfeln}>Neu würfeln</button>
        <button className="ab-mini ghost" onClick={onReset}>Alles zurücksetzen</button>
        {/* aria-live: Screenreader erfahren, dass sich die Trefferzahl geändert hat */}
        <span className="ab-live" role="status" aria-live="polite" style={{ alignSelf: "center" }}>
          {trefferText}
        </span>
      </div>
    </section>
  );
}
