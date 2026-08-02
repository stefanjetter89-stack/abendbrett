import { useEffect, useRef } from "react";
import { CHIPS, GRUPPEN_BTN, ZEIT_OPTIONEN, ZEIT_LABEL } from "../constants.js";

/**
 * Abend-Check auf Basis des nativen <dialog>-Elements.
 *
 * Damit übernimmt der Browser Fokusverwaltung, Escape-Taste, Modalität und das
 * Deaktivieren des Hintergrunds für Screenreader. Die Vorversion war ein reines
 * <div role="dialog"> ohne all das: mit der Tastatur nicht verlassbar und für
 * Screenreader nicht als Dialog abgegrenzt.
 */
export default function AbendCheck({
  offen, onClose, zeit, setZeit, welt, setWelt, modus, setModus, chips, toggleChip, onFertig,
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return undefined;
    if (offen && !dlg.open) dlg.showModal();
    if (!offen && dlg.open) dlg.close();
    return undefined;
  }, [offen]);

  // onCancel deckt die Escape-Taste ab, der Klick-Handler den Backdrop:
  // ein Klick auf die Abdunklung trifft das <dialog> selbst, nicht den Inhalt.
  return (
    // Begründung für die folgende Ausnahme: Der Klick auf den Backdrop ist reine
    // Zusatzbequemlichkeit für die Maus. Tastaturnutzer schließen über Escape
    // (onCancel) oder die Schaltfläche "Überspringen" — es geht keine Funktion verloren.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events
    <dialog
      className="ab-dialog"
      ref={dialogRef}
      aria-labelledby="ab-check-titel"
      onCancel={onClose}
      onClose={onClose}
      onClick={(e) => { if (e.target === dialogRef.current) onClose(); }}
    >
      <div className="ab-modal">
        <h2 id="ab-check-titel">Abend-Check</h2>
        <p style={{ fontSize: 14, color: "#4A6159", margin: 0 }}>
          Vier Fragen, dann stehen die Vorschläge.
        </p>

        <fieldset className="ab-q" style={{ border: 0, padding: 0, margin: "16px 0 0" }}>
          <legend className="ab-rowlabel">1 · Wie viel Zeit ist heute?</legend>
          <div className="ab-seg">
            {ZEIT_OPTIONEN.map((m) => (
              <button key={m} className="ab-btn" aria-pressed={zeit === m}
                onClick={() => setZeit(m)}>{ZEIT_LABEL(m)}</button>
            ))}
          </div>
        </fieldset>

        <fieldset className="ab-q" style={{ border: 0, padding: 0, margin: "16px 0 0" }}>
          <legend className="ab-rowlabel">2 · Worauf habt ihr Lust?</legend>
          <div className="ab-seg">
            {GRUPPEN_BTN.map(([v, l]) => (
              <button key={v} className="ab-btn" aria-pressed={welt === v}
                onClick={() => setWelt(v)}>{l}</button>
            ))}
          </div>
        </fieldset>

        <fieldset className="ab-q" style={{ border: 0, padding: 0, margin: "16px 0 0" }}>
          <legend className="ab-rowlabel">3 · Lust auf Kochen oder Bestellen?</legend>
          <div className="ab-seg">
            {[["kochen", "Kochen"], ["bestellen", "Bestellen"], ["egal", "Egal"]].map(([v, l]) => (
              <button key={v} className="ab-btn" aria-pressed={modus === v}
                onClick={() => setModus(v)}>{l}</button>
            ))}
          </div>
        </fieldset>

        <fieldset className="ab-q" style={{ border: 0, padding: 0, margin: "16px 0 0" }}>
          <legend className="ab-rowlabel">4 · Etwas Besonderes heute?</legend>
          <div className="ab-seg">
            {CHIPS.map((c) => (
              <button key={c.id} className="ab-btn chip" aria-pressed={chips.includes(c.id)}
                onClick={() => toggleChip(c.id)}>{c.label}</button>
            ))}
          </div>
        </fieldset>

        <div className="ab-actions" style={{ marginTop: 18 }}>
          <button className="ab-mini" onClick={onFertig}>Vorschläge zeigen</button>
          <button className="ab-mini ghost" onClick={onClose}>Überspringen</button>
        </div>
      </div>
    </dialog>
  );
}
