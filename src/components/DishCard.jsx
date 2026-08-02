import { memo } from "react";
import { CAT_LABEL } from "../constants.js";

/**
 * Einzelne Gericht-Kachel. `memo`, weil bei fünf Kacheln plus Zustandswechseln
 * sonst alle neu rendern, sobald sich irgendein Regler ändert.
 */
function DishCard({
  dish, gewaehlt, zutatenOffen, loeschAbfrage,
  onToggle, onZutaten, onAblehnen, onLoeschen, onLoeschBestaetigt, onLoeschAbbruch,
}) {
  return (
    <article className={`ab-card${gewaehlt ? " on" : ""}`}>
      <div className="ab-card-top">
        <span className="ab-eyebrow">{CAT_LABEL[dish.cat] ?? "Vorschlag"}</span>
        <span className="ab-burner" aria-hidden="true" />
      </div>

      <h3 className="ab-name">{dish.name}</h3>
      <p className="ab-meta">
        {dish.cat === "bestellen" ? "LIEFERZEIT" : `${dish.min} MIN`} · {dish.kueche.toUpperCase()}
      </p>

      {dish.tags.length > 0 && (
        <ul className="ab-tags" style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {dish.tags.map((t) => <li className="ab-tag" key={t}>{t}</li>)}
        </ul>
      )}

      {zutatenOffen && (
        <div className="ab-ing">
          <strong>{dish.cat === "bestellen" ? "Dazu daheim" : "Für 2 Personen"}</strong>
          {dish.zutaten.length > 0 ? (
            <ul>{dish.zutaten.map((z, i) => <li key={`${dish.id}-${i}`}>{z}</li>)}</ul>
          ) : (
            <p style={{ margin: "6px 0 0" }}>Für dieses Gericht sind noch keine Zutaten hinterlegt.</p>
          )}
          {dish.tipp && <div className="ab-tipp">{dish.tipp}</div>}
        </div>
      )}

      {loeschAbfrage ? (
        <div className="ab-actions">
          <span className="ab-confirm">Dauerhaft löschen?</span>
          <button className="ab-mini danger" onClick={onLoeschBestaetigt}>Ja, löschen</button>
          <button className="ab-mini ghost" onClick={onLoeschAbbruch}>Abbrechen</button>
        </div>
      ) : (
        <div className="ab-actions">
          <button className="ab-mini" onClick={onToggle}>
            {gewaehlt ? "Wieder runter" : "Nehmen wir"}
          </button>
          <button className="ab-mini ghost" onClick={onZutaten}
            aria-expanded={zutatenOffen}>
            {zutatenOffen ? "Zutaten zu" : "Zutaten"}
          </button>
          <button className="ab-mini ghost" onClick={onAblehnen}>Heute nicht</button>
          <button className="ab-mini ghost" onClick={onLoeschen}>
            Löschen<span className="ab-sr"> — {dish.name} dauerhaft entfernen</span>
          </button>
        </div>
      )}
    </article>
  );
}

export default memo(DishCard);
