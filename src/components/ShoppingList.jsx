import { useMemo, useState } from "react";

/** Einkaufsliste aus den ausgewählten Gerichten, mit Kopierfunktion. */
export default function ShoppingList({ gerichte, onLeeren }) {
  const [kopiert, setKopiert] = useState(null);

  const text = useMemo(
    () => gerichte.flatMap((d) => [`── ${d.name} ──`, ...d.zutaten]).join("\n"),
    [gerichte]
  );

  const kopieren = async () => {
    try {
      // Nur in sicherem Kontext verfügbar (https / localhost)
      if (!navigator.clipboard) throw new Error("Zwischenablage nicht verfügbar");
      await navigator.clipboard.writeText(text);
      setKopiert("ok");
    } catch {
      setKopiert("fehler"); // Vorversion schwieg hier — der Nutzer sah nichts
    } finally {
      setTimeout(() => setKopiert(null), 2500);
    }
  };

  return (
    <section className="ab-panel" style={{ marginTop: 18 }} aria-label="Einkaufsliste">
      <h2 className="ab-rowlabel" style={{ margin: 0 }}>
        Auf dem Brett {gerichte.length > 0 && `(${gerichte.length})`}
      </h2>

      {gerichte.length === 0 ? (
        <p className="ab-empty">
          Noch nichts ausgewählt. Tipp &bdquo;Nehmen wir&ldquo; auf einer Kachel — die Zutaten
          landen automatisch hier in der Einkaufsliste.
        </p>
      ) : (
        <>
          <p style={{ fontSize: 14, margin: "0 0 10px" }}>
            {gerichte.map((d) => d.name).join(" · ")}
          </p>
          <textarea
            className="ab-list"
            value={text}
            readOnly
            onFocus={(e) => e.target.select()}
            aria-label="Einkaufsliste zum Kopieren"
          />
          <div className="ab-actions" style={{ marginTop: 10 }}>
            <button className="ab-mini" onClick={kopieren}>Liste kopieren</button>
            <button className="ab-mini ghost" onClick={onLeeren}>Liste leeren</button>
            <span className="ab-live" role="status" aria-live="polite"
              data-tone={kopiert === "fehler" ? "error" : undefined}
              style={{ alignSelf: "center" }}>
              {kopiert === "ok" && "Kopiert."}
              {kopiert === "fehler" && "Kopieren nicht möglich — Text bitte manuell markieren."}
            </span>
          </div>
        </>
      )}
    </section>
  );
}
