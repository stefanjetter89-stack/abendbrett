import { useState } from "react";
import { slugify, seitWann } from "../lib/format.js";
import { boardApi } from "../lib/boardApi.js";
import { MIN_CODE_LENGTH } from "../config.js";

/**
 * Einstieg in einen Kosmos — als eigene Komponente, damit die Beitrittslogik
 * (existiert der Kosmos? gibt es den Namen schon?) nicht in der Hauptdatei liegt.
 * Wird auch im Verwaltungs-Tab zum Wechseln wiederverwendet.
 */
export default function JoinGate({ initialCode = "", initialName = "", onBetreten, onAbbrechen }) {
  const [codeEingabe, setCodeEingabe] = useState(initialCode);
  const [name, setName] = useState(initialName);
  const [status, setStatus] = useState("");
  const [pruefe, setPruefe] = useState(false);
  const [kosmosFrage, setKosmosFrage] = useState(null); // { code, info }
  const [namensFrage, setNamensFrage] = useState(null); // { code, name, seit }

  const zuruecksetzen = () => { setKosmosFrage(null); setNamensFrage(null); };

  const pruefen = async () => {
    const code = slugify(codeEingabe);
    const eigenerName = name.trim();
    zuruecksetzen();

    if (code.length < MIN_CODE_LENGTH) {
      setStatus(`Der Kosmos-Name braucht mindestens ${MIN_CODE_LENGTH} Zeichen — das erschwert Fremden das Erraten.`);
      return;
    }
    if (!eigenerName) { setStatus("Bitte auch deinen eigenen Namen eingeben."); return; }

    setPruefe(true);
    setStatus("Prüfe …");
    const res = await boardApi.peek(code);
    setPruefe(false);

    if (!res.ok) {
      // Fehler NICHT als "Kosmos ist frei" deuten — sonst legt ein Netzwerkfehler
      // versehentlich einen zweiten Kosmos an bzw. überschreibt einen fremden.
      setStatus("Die Prüfung ist fehlgeschlagen. Bitte Verbindung prüfen und erneut versuchen.");
      return;
    }
    setStatus("");

    if (!res.data) { onBetreten(code, eigenerName); return; } // frei
    setKosmosFrage({ code, info: res.data });
  };

  /* Ob der Name schon vergeben ist, beantwortet jetzt der Server im Probelauf.
     Die Mitgliederliste kommt bewusst nicht mehr im Vorabblick mit. */
  const kosmosBestaetigt = async () => {
    const { code } = kosmosFrage;
    const eigenerName = name.trim();
    setPruefe(true);
    const res = await boardApi.checkName(code, eigenerName);
    setPruefe(false);
    if (!res.ok) {
      setStatus("Die Prüfung ist fehlgeschlagen. Bitte erneut versuchen.");
      return;
    }
    if (res.data.bekannt) {
      setNamensFrage({ code, name: eigenerName, seit: res.data.seit });
      return;
    }
    onBetreten(code, eigenerName);
  };

  return (
    <div className="ab-panel">
      <label className="ab-rowlabel" htmlFor="ab-kosmos">Name eures Kosmos</label>
      <input id="ab-kosmos" className="ab-in" style={{ marginBottom: 10 }}
        placeholder={`mindestens ${MIN_CODE_LENGTH} Zeichen, z. B. jetter-kueche-42`}
        value={codeEingabe} onChange={(e) => setCodeEingabe(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && pruefen()} autoComplete="off" />

      <label className="ab-rowlabel" htmlFor="ab-name">Dein Name</label>
      <input id="ab-name" className="ab-in" placeholder="z. B. Stefan"
        value={name} onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && pruefen()} autoComplete="off" />

      <div className="ab-actions" style={{ marginTop: 12 }}>
        <button className="ab-mini" onClick={pruefen} disabled={pruefe}>
          {pruefe ? "Prüfe …" : "Loslegen"}
        </button>
        {onAbbrechen && (
          <button className="ab-mini ghost" onClick={onAbbrechen}>Abbrechen</button>
        )}
        <span className="ab-live" role="status" aria-live="polite"
          data-tone={status && !pruefe ? "error" : undefined} style={{ alignSelf: "center" }}>
          {status}
        </span>
      </div>

      {kosmosFrage && !namensFrage && (
        <div className="ab-panel" style={{ marginTop: 14 }}>
          <h3 className="ab-rowlabel" style={{ margin: 0 }}>Dieser Kosmos existiert schon</h3>
          <p style={{ fontSize: 13.5, margin: "6px 0 10px" }}>
            {kosmosFrage.info.memberCount > 0
              ? `Dabei sind bereits ${kosmosFrage.info.memberCount} Personen.`
              : "Es sind Gerichte hinterlegt, aber noch niemand mit Namen."}
            {" "}{kosmosFrage.info.customCount} eigene Gerichte, zuletzt geändert{" "}
            {seitWann(kosmosFrage.info.updatedAt)}. Ist das euer Kosmos?
          </p>
          <div className="ab-actions">
            <button className="ab-mini" onClick={kosmosBestaetigt} disabled={pruefe}>
              Ja, das sind wir — beitreten als {name.trim() || "…"}
            </button>
            <button className="ab-mini ghost" onClick={zuruecksetzen}>
              Nein, anderen Namen wählen
            </button>
          </div>
        </div>
      )}

      {namensFrage && (
        <div className="ab-panel" style={{ marginTop: 14 }}>
          <h3 className="ab-rowlabel" style={{ margin: 0 }}>Bist du das?</h3>
          <p style={{ fontSize: 13.5, margin: "6px 0 10px" }}>
            &bdquo;{namensFrage.name}&ldquo; ist in diesem Kosmos schon bekannt — dabei seit{" "}
            {seitWann(namensFrage.seit)}.
          </p>
          <div className="ab-actions">
            <button className="ab-mini"
              onClick={() => onBetreten(namensFrage.code, namensFrage.name)}>
              Ja, das bin ich
            </button>
            <button className="ab-mini ghost" onClick={() => setNamensFrage(null)}>
              Nein, das ist jemand anderes
            </button>
          </div>
          <p className="ab-note">
            Bei zwei gleichen Namen: Nachnamen oder Kurzform ergänzen, z. B. &bdquo;Stefan J.&ldquo;.
          </p>
        </div>
      )}
    </div>
  );
}
