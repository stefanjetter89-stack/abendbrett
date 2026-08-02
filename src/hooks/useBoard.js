import { useCallback, useEffect, useRef, useState } from "react";
import { boardApi } from "../lib/boardApi.js";
import { supabaseAktiv } from "../lib/supabase.js";
import { localStore, KEYS } from "../lib/localStore.js";
import { normalizeDishes, normalizeHidden } from "../lib/normalize.js";
import { gleich, vereineGerichte, vereineIds } from "../lib/format.js";
import { SYNC_INTERVAL_MS } from "../config.js";

/**
 * Verwaltet den gesamten geteilten Zustand: Kosmos, Mitglieder, eigene und
 * ausgeblendete Gerichte — inklusive Laden, Speichern und Abgleich.
 *
 * Behobene Defekte gegenüber der Vorfassung:
 *
 *  1. DATENVERLUST nach Ladefehler. Schlug `board_load` fehl (Funkloch,
 *     Supabase kurz weg), wurden leere Listen gesetzt und `updatedAt` blieb
 *     null. Die nächste Änderung ging mit `basedOn: null` an den Server, der
 *     das als "ungeprüft überschreiben" verstand — der ganze Kosmos war weg.
 *     Jetzt gilt: ohne bestätigten Serverstand wird NICHT geschrieben
 *     (`serverStandBekannt`), sondern nur lokal zwischengespeichert.
 *
 *  2. VERLORENE ÄNDERUNGEN im Konfliktfall. Bisher wurde bei `conflict` der
 *     fremde Stand geladen — die eigene, gerade angelegte Kachel war
 *     kommentarlos fort. Jetzt werden beide Stände zusammengeführt.
 *
 *  3. ABGLEICH LIEF NIE. Der Intervall-Effekt hing an `custom`/`hidden` und
 *     wurde bei jeder Änderung neu aufgesetzt. Wer regelmäßig etwas anfasste,
 *     bekam nie einen Hintergrundabgleich. Die Werte liegen jetzt in einer Ref.
 */
export function useBoard() {
  /* Startwerte beim ersten Render (Lazy Initializer) — spart einen Renderlauf. */
  const [boardCode, setBoardCode] = useState(() => {
    const v = localStore.get(KEYS.boardCode);
    return typeof v === "string" && v ? v : null;
  });
  const [memberName, setMemberName] = useState(() => {
    const v = localStore.get(KEYS.memberName);
    return typeof v === "string" ? v : "";
  });
  const [members, setMembers] = useState([]);

  /* Der lokale Zwischenspeicher wird in BEIDEN Betriebsarten gefüllt. Im
     geteilten Betrieb ist er die Rückfallebene bei Serverausfall. */
  const [custom, setCustom] = useState(() => normalizeDishes(localStore.get(KEYS.custom)));
  const [hidden, setHidden] = useState(() => normalizeHidden(localStore.get(KEYS.hidden)));

  const [geladenFuer, setGeladenFuer] = useState(supabaseAktiv ? null : "lokal");
  const [syncFehler, setSyncFehler] = useState(null);

  const geladen = supabaseAktiv ? geladenFuer === boardCode : geladenFuer === "lokal";

  const letzterServerStand = useRef({ custom: [], hidden: [] });
  const updatedAtRef = useRef(null);
  /** Liegt ein bestätigter Serverstand vor? Nur dann darf geschrieben werden. */
  const serverStandBekannt = useRef(false);
  const schreibTimer = useRef(null);
  /* Aktuelle Werte für den Intervall-Abgleich, ohne den Effekt neu aufzusetzen.
     Die Zuweisung gehört in einen Effekt: Refs während des Renderns zu
     beschreiben ist ein Seiteneffekt und in React 18+ nicht zulässig. */
  const standRef = useRef({ custom, hidden });
  useEffect(() => { standRef.current = { custom, hidden }; }, [custom, hidden]);

  /* ---------- Laden ---------- */
  const ladeStand = useCallback(async (code) => {
    if (!supabaseAktiv || !code) return null;
    const res = await boardApi.load(code);

    if (!res.ok) {
      // Kein Serverstand: lokal weiterarbeiten, aber NICHT zurückschreiben.
      serverStandBekannt.current = false;
      updatedAtRef.current = null;
      setSyncFehler(
        "Der geteilte Stand ist nicht erreichbar. Änderungen bleiben vorerst auf diesem Gerät."
      );
      setGeladenFuer(code);
      return null;
    }

    setSyncFehler(null);
    setCustom(res.data.custom);
    setHidden(res.data.hidden);
    setMembers(res.data.members);
    letzterServerStand.current = { custom: res.data.custom, hidden: res.data.hidden };
    updatedAtRef.current = res.data.updatedAt;
    serverStandBekannt.current = true;
    setGeladenFuer(code);
    return res.data;
  }, []);

  useEffect(() => {
    if (!supabaseAktiv || !boardCode) return;
    // Bewusst als asynchrone Funktion: alle Zustandsänderungen passieren erst
    // nach dem Netzwerkaufruf, lösen also keine Renderkaskade im Effektkörper aus.
    void (async () => { await ladeStand(boardCode); })();
  }, [boardCode, ladeStand]);

  /* ---------- Speichern (entprellt, mit Konfliktzusammenführung) ---------- */
  useEffect(() => {
    if (!geladen) return undefined;

    // Lokaler Zwischenspeicher wird immer gepflegt — auch im geteilten Betrieb,
    // damit ein Ausfall nicht die Arbeit des Abends kostet.
    localStore.set(KEYS.custom, custom);
    localStore.set(KEYS.hidden, hidden);

    if (!supabaseAktiv || !boardCode) return undefined;
    if (!serverStandBekannt.current) return undefined; // siehe Defekt 1

    const unveraendert =
      gleich(custom, letzterServerStand.current.custom) &&
      gleich(hidden, letzterServerStand.current.hidden);
    if (unveraendert) return undefined;

    clearTimeout(schreibTimer.current);
    schreibTimer.current = setTimeout(async () => {
      const res = await boardApi.save(boardCode, {
        custom, hidden, basedOn: updatedAtRef.current,
      });

      if (!res.ok) {
        setSyncFehler("Änderungen konnten nicht gespeichert werden — bitte Verbindung prüfen.");
        return;
      }

      if (res.data.conflict) {
        // Zusammenführen statt verwerfen: Gerichte beider Seiten bleiben erhalten.
        const fremd = await boardApi.load(boardCode);
        if (!fremd.ok) {
          setSyncFehler("Ein anderes Gerät war schneller, der Abgleich schlug fehl.");
          return;
        }
        const zusammen = {
          custom: vereineGerichte(fremd.data.custom, custom),
          hidden: vereineIds(fremd.data.hidden, hidden),
        };
        const zweit = await boardApi.save(boardCode, {
          ...zusammen, basedOn: fremd.data.updatedAt,
        });
        setCustom(zusammen.custom);
        setHidden(zusammen.hidden);
        setMembers(fremd.data.members);
        letzterServerStand.current = zusammen;
        updatedAtRef.current = zweit.ok ? zweit.data.updatedAt : fremd.data.updatedAt;
        setSyncFehler(
          zweit.ok && !zweit.data.conflict
            ? "Ein anderes Gerät hatte parallel geändert — beide Stände wurden zusammengeführt."
            : "Abgleich mit einem anderen Gerät läuft noch. Bitte kurz warten."
        );
        return;
      }

      setSyncFehler(null);
      letzterServerStand.current = { custom, hidden };
      updatedAtRef.current = res.data.updatedAt;
    }, 600); // Entprellung: schnelle Klickfolgen ergeben einen Schreibvorgang

    return () => clearTimeout(schreibTimer.current);
  }, [custom, hidden, geladen, boardCode]);

  /* ---------- Hintergrundabgleich ----------
     Realtime hätte Lesezugriff auf die Tabelle erfordert und das
     Sicherheitsmodell aufgeweicht. Abfrage im Intervall und beim Zurückkehren
     auf den Tab genügt für den Zweck. */
  useEffect(() => {
    if (!supabaseAktiv || !boardCode || !geladen) return undefined;

    let aktiv = true;
    const abgleich = async () => {
      if (document.visibilityState === "hidden") return;
      const res = await boardApi.load(boardCode);
      if (!aktiv || !res.ok) return;

      // Nach einem früheren Ausfall hier wieder sauber aufsetzen.
      if (!serverStandBekannt.current) {
        serverStandBekannt.current = true;
        updatedAtRef.current = res.data.updatedAt;
        letzterServerStand.current = { custom: res.data.custom, hidden: res.data.hidden };
        setSyncFehler(null);
        return;
      }
      if (res.data.updatedAt === updatedAtRef.current) return; // nichts Neues

      const { custom: c, hidden: h } = standRef.current;
      const lokalSauber =
        gleich(c, letzterServerStand.current.custom) &&
        gleich(h, letzterServerStand.current.hidden);
      if (!lokalSauber) return; // eigene Änderung steht an, die schreibt gleich selbst

      setCustom(res.data.custom);
      setHidden(res.data.hidden);
      setMembers(res.data.members);
      letzterServerStand.current = { custom: res.data.custom, hidden: res.data.hidden };
      updatedAtRef.current = res.data.updatedAt;
    };

    const timer = setInterval(abgleich, SYNC_INTERVAL_MS);
    document.addEventListener("visibilitychange", abgleich);
    return () => {
      aktiv = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", abgleich);
    };
  }, [boardCode, geladen]);

  /* ---------- Kosmos betreten ---------- */
  const betrete = useCallback(async (code, name) => {
    localStore.set(KEYS.boardCode, code);
    localStore.set(KEYS.memberName, name);
    setMemberName(name);
    // Beim Wechsel darf der alte Stand nicht in den neuen Kosmos geschrieben werden.
    serverStandBekannt.current = false;
    updatedAtRef.current = null;
    letzterServerStand.current = { custom: [], hidden: [] };
    setGeladenFuer(null);
    setBoardCode(code);
    if (supabaseAktiv) {
      const res = await boardApi.join(code, name);
      if (res.ok) setMembers(res.data.members);
    }
  }, []);

  const entferneMitglied = useCallback(async (name) => {
    if (!supabaseAktiv || !boardCode) return;
    const res = await boardApi.removeMember(boardCode, name);
    if (res.ok) setMembers(res.data);
  }, [boardCode]);

  return {
    boardCode, memberName, members, custom, hidden,
    geladen, syncFehler,
    setCustom, setHidden,
    betrete, entferneMitglied,
  };
}
