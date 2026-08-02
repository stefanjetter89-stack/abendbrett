import { useMemo, useState } from "react";
import { D, DISHES } from "../dishes.js";
import { CAT_LABEL, EIGENSCHAFTEN, LIMITS } from "../constants.js";
import { normalizeDish } from "../lib/normalize.js";
import { supabaseAktiv } from "../lib/supabase.js";
import JoinGate from "./JoinGate.jsx";

const LEERES_FORMULAR = {
  name: "", kueche: "Gutbürgerlich", cat: "schnell", min: 30, flags: [], zutaten: "",
};

/** Eindeutige ID auch bei zeitgleichem Anlegen auf zwei Geräten. */
const neueId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? `c-${crypto.randomUUID()}`
    : `c-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export default function ManageTab({
  alle, kuechen, boardCode, members, memberName,
  onHinzufuegen, onEntfernen, onWiederherstellen, hidden,
  onBetreten, onMitgliedEntfernen,
}) {
  const [form, setForm] = useState(LEERES_FORMULAR);
  const [suche, setSuche] = useState("");
  const [status, setStatus] = useState("");
  const [loeschAbfrage, setLoeschAbfrage] = useState(null);
  const [wechseln, setWechseln] = useState(false);

  const toggleFlag = (f) =>
    setForm((s) => ({
      ...s,
      flags: s.flags.includes(f) ? s.flags.filter((x) => x !== f) : [...s.flags, f],
    }));

  const speichern = () => {
    const name = form.name.trim();
    if (!name) { setStatus("Bitte einen Namen eingeben."); return; }
    if (name.length > LIMITS.nameLen) { setStatus("Der Name ist zu lang."); return; }

    // Doppelte Namen abfangen — vorher konnte dasselbe Gericht beliebig oft entstehen.
    if (alle.some((d) => d.name.trim().toLowerCase() === name.toLowerCase())) {
      setStatus(`\u201E${name}\u201C gibt es bereits.`);
      return;
    }

    const minuten = Number(form.min);
    if (!Number.isFinite(minuten) || minuten < LIMITS.minMin || minuten > LIMITS.maxMin) {
      setStatus(`Die Zeit muss zwischen ${LIMITS.minMin} und ${LIMITS.maxMin} Minuten liegen.`);
      return;
    }

    const zutaten = form.zutaten
      .split("\n").map((z) => z.trim()).filter(Boolean).slice(0, LIMITS.maxZutaten);

    const rohes = D(name, form.kueche, form.cat, Math.round(minuten), form.flags.join(""),
      zutaten.length ? zutaten : ["Zutaten noch ergänzen"]);
    const gericht = normalizeDish({ ...rohes, id: neueId(), eigen: true });

    onHinzufuegen(gericht);
    setForm({ ...LEERES_FORMULAR, kueche: form.kueche, cat: form.cat });
    setStatus(`\u201E${name}\u201C ist gespeichert.`);
  };

  const treffer = useMemo(() => {
    const q = suche.trim().toLowerCase();
    return alle.filter((d) => d.name.toLowerCase().includes(q)).slice(0, 60);
  }, [alle, suche]);

  const ausgeblendet = useMemo(() => {
    const set = new Set(hidden);
    return DISHES.filter((d) => set.has(d.id));
  }, [hidden]);

  return (
    <section className="ab-panel" style={{ marginTop: 18 }}>
      {/* ---------- Kosmos ---------- */}
      <p className="ab-note" style={{ marginTop: 0 }}>
        {supabaseAktiv
          ? <>Geteilte Ablage aktiv für euren Kosmos <strong>&bdquo;{boardCode}&ldquo;</strong> — Änderungen
              sehen alle Geräte mit demselben Namen.</>
          : "Geteilte Ablage nicht eingerichtet — Änderungen bleiben nur auf diesem Gerät (siehe README)."}
      </p>

      {supabaseAktiv && (
        <>
          <h2 className="ab-rowlabel" style={{ margin: "0 0 4px" }}>
            Wer ist dabei ({members.length})
          </h2>
          {members.length === 0 ? (
            <p className="ab-note" style={{ marginTop: 0 }}>Noch niemand eingetragen.</p>
          ) : (
            <ul className="ab-scroll" style={{ listStyle: "none", margin: "0 0 10px", padding: 0 }}>
              {members.map((m) => (
                <li className="ab-item" key={m.name}>
                  <span>
                    {m.name}
                    {m.name.toLowerCase() === memberName.trim().toLowerCase() && (
                      <span className="ab-eigen"> DU</span>
                    )}
                  </span>
                  {m.name.toLowerCase() !== memberName.trim().toLowerCase() && (
                    <button className="ab-mini ghost" onClick={() => onMitgliedEntfernen(m.name)}>
                      Entfernen
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {!wechseln ? (
            <button className="ab-mini ghost" style={{ marginBottom: 14 }}
              onClick={() => setWechseln(true)}>Kosmos wechseln</button>
          ) : (
            <div style={{ marginBottom: 14 }}>
              <JoinGate
                initialCode={boardCode ?? ""}
                initialName={memberName}
                onBetreten={(code, name) => { setWechseln(false); onBetreten(code, name); }}
                onAbbrechen={() => setWechseln(false)}
              />
            </div>
          )}
          <div className="ab-divider" />
        </>
      )}

      {/* ---------- Anlegen ---------- */}
      <h2 className="ab-rowlabel" style={{ margin: 0 }}>Neues Gericht anlegen</h2>
      <div className="ab-form" style={{ marginTop: 8 }}>
        <input className="ab-in" placeholder="Name des Gerichts" value={form.name}
          maxLength={LIMITS.nameLen}
          onChange={(e) => setForm({ ...form, name: e.target.value })} aria-label="Name des Gerichts" />
        <select className="ab-in" value={form.kueche} aria-label="Küche"
          onChange={(e) => setForm({ ...form, kueche: e.target.value })}>
          {kuechen.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
        <select className="ab-in" value={form.cat} aria-label="Kategorie"
          onChange={(e) => setForm({ ...form, cat: e.target.value })}>
          {Object.entries(CAT_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <input className="ab-in" type="number" min={LIMITS.minMin} max={LIMITS.maxMin}
          value={form.min} aria-label="Zubereitungszeit in Minuten"
          onChange={(e) => setForm({ ...form, min: e.target.value })} />
      </div>

      <fieldset style={{ border: 0, padding: 0, margin: "12px 0 0" }}>
        <legend className="ab-rowlabel">Eigenschaften</legend>
        <div className="ab-seg">
          {EIGENSCHAFTEN.map(([v, l]) => (
            <button key={v} className="ab-btn chip" aria-pressed={form.flags.includes(v)}
              onClick={() => toggleFlag(v)}>{l}</button>
          ))}
        </div>
      </fieldset>

      <div style={{ marginTop: 12 }}>
        <label className="ab-rowlabel" htmlFor="ab-zutaten">Zutaten — eine pro Zeile</label>
        <textarea id="ab-zutaten" className="ab-in" rows="4" value={form.zutaten}
          placeholder={"250 g Nudeln\n1 Zwiebel\n…"}
          onChange={(e) => setForm({ ...form, zutaten: e.target.value })} />
      </div>

      <div className="ab-actions" style={{ marginTop: 12 }}>
        <button className="ab-mini" onClick={speichern}>Gericht speichern</button>
        <span className="ab-live" role="status" aria-live="polite" style={{ alignSelf: "center" }}>
          {status}
        </span>
      </div>

      {/* ---------- Suchen und löschen ---------- */}
      <div className="ab-divider" />
      <label className="ab-rowlabel" htmlFor="ab-suche">Gerichte durchsuchen und löschen</label>
      <input id="ab-suche" className="ab-in" placeholder="Suchen …" value={suche}
        onChange={(e) => setSuche(e.target.value)} />

      <ul className="ab-scroll" style={{ listStyle: "none", margin: "6px 0 0", padding: 0 }}>
        {treffer.map((d) => (
          <li className="ab-item" key={d.id}>
            <span>
              {d.name}{" "}
              <span className="ab-meta">· {d.kueche}{d.min > 0 ? ` · ${d.min} Min` : ""}</span>
              {d.eigen && <span className="ab-eigen"> EIGEN</span>}
            </span>
            {loeschAbfrage === d.id ? (
              <span style={{ display: "flex", gap: 6 }}>
                <button className="ab-mini danger"
                  onClick={() => { onEntfernen(d.id); setLoeschAbfrage(null); }}>Ja, löschen</button>
                <button className="ab-mini ghost" onClick={() => setLoeschAbfrage(null)}>Abbrechen</button>
              </span>
            ) : (
              <button className="ab-mini ghost" onClick={() => setLoeschAbfrage(d.id)}>
                Löschen<span className="ab-sr"> — {d.name}</span>
              </button>
            )}
          </li>
        ))}
      </ul>
      <p className="ab-note">
        Es werden bis zu 60 Treffer angezeigt. Eigene Gerichte werden endgültig gelöscht,
        mitgelieferte nur ausgeblendet und lassen sich unten zurückholen.
      </p>

      {ausgeblendet.length > 0 && (
        <>
          <div className="ab-divider" />
          <h2 className="ab-rowlabel" style={{ margin: 0 }}>Ausgeblendet ({ausgeblendet.length})</h2>
          <ul className="ab-scroll" style={{ listStyle: "none", margin: "6px 0 0", padding: 0 }}>
            {ausgeblendet.map((d) => (
              <li className="ab-item" key={d.id}>
                <span>{d.name}</span>
                <button className="ab-mini ghost" onClick={() => onWiederherstellen(d.id)}>
                  Zurückholen<span className="ab-sr"> — {d.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
