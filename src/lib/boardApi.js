/**
 * Zugriff auf die geteilte Ablage.
 *
 * WICHTIG (Sicherheit): Es wird bewusst NICHT mehr direkt auf die Tabelle
 * zugegriffen. Der anon key steckt im ausgelieferten JavaScript und ist damit
 * öffentlich; mit direkten Tabellenrechten könnte jeder sämtliche Kosmen
 * auflisten und überschreiben. Stattdessen laufen alle Zugriffe über
 * SECURITY-DEFINER-Funktionen, die zwingend den Code als Argument verlangen
 * (siehe supabase-setup.sql). Ohne Code gibt es keine Daten — und kein Auflisten.
 */
import { getSupabase, supabaseAktiv } from "./supabase.js";
import { normalizeDishes, normalizeHidden, normalizeMembers } from "./normalize.js";

const leer = { custom: [], hidden: [], members: [], updatedAt: null };

/** Einheitliche Antwort: { ok, data, error } — Aufrufer müssen Fehler nicht raten. */
const antwort = (ok, data = null, error = null) => ({ ok, data, error });

async function rpc(name, args) {
  if (!supabaseAktiv) return antwort(false, null, "nicht-konfiguriert");
  const client = await getSupabase();
  if (!client) return antwort(false, null, "client-nicht-verfuegbar");
  try {
    const { data, error } = await client.rpc(name, args);
    if (error) return antwort(false, null, error.message);
    return antwort(true, data);
  } catch (err) {
    return antwort(false, null, err?.message ?? "netzwerkfehler");
  }
}

const formeSnapshot = (row) => ({
  custom: normalizeDishes(row?.custom),
  hidden: normalizeHidden(row?.hidden),
  members: normalizeMembers(row?.members),
  updatedAt: row?.updated_at ?? null,
});

export const boardApi = {
  /**
   * Vorabblick vor dem Beitreten: existiert der Kosmos, wie voll ist er?
   *
   * Liefert bewusst nur Zähler. Vorher kamen hier die Klarnamen aller
   * Mitglieder zurück — wer einen Code erriet, bekam ohne weitere Hürde echte
   * Vornamen. Ob der eigene Name schon vergeben ist, klärt `checkName`.
   */
  async peek(code) {
    const res = await rpc("board_peek", { p_code: code });
    if (!res.ok) return res;
    const row = Array.isArray(res.data) ? res.data[0] : res.data;
    if (!row || !row.exists) return antwort(true, null); // frei
    return antwort(true, {
      customCount: Number(row.custom_count) || 0,
      hiddenCount: Number(row.hidden_count) || 0,
      memberCount: Number(row.member_count) || 0,
      updatedAt: row.updated_at ?? null,
    });
  },

  /** Probelauf: Ist dieser Name im Kosmos schon bekannt? Schreibt nichts. */
  async checkName(code, name) {
    const res = await rpc("board_join", { p_code: code, p_name: name, p_dry_run: true });
    if (!res.ok) return res;
    const row = Array.isArray(res.data) ? res.data[0] : res.data;
    return antwort(true, {
      bekannt: Boolean(row?.bekannt),
      seit: row?.seit ?? null,
    });
  },

  /** Vollständigen Stand laden; legt den Kosmos an, falls er noch nicht existiert. */
  async load(code) {
    const res = await rpc("board_load", { p_code: code });
    if (!res.ok) return res;
    const row = Array.isArray(res.data) ? res.data[0] : res.data;
    return antwort(true, row ? formeSnapshot(row) : leer);
  },

  /** Gerichte speichern. Schreibt nur, wenn der Stand nicht fremd überholt wurde. */
  async save(code, { custom, hidden, basedOn }) {
    const res = await rpc("board_save", {
      p_code: code,
      p_custom: custom,
      p_hidden: hidden,
      p_based_on: basedOn ?? null,
    });
    if (!res.ok) return res;
    const row = Array.isArray(res.data) ? res.data[0] : res.data;
    // conflict = true bedeutet: jemand anderes war schneller, Stand neu laden.
    return antwort(true, {
      conflict: Boolean(row?.conflict),
      updatedAt: row?.updated_at ?? null,
    });
  },

  /** Eigenen Namen eintragen bzw. "zuletzt gesehen" aktualisieren. */
  async join(code, name) {
    const res = await rpc("board_join", { p_code: code, p_name: name, p_dry_run: false });
    if (!res.ok) return res;
    const row = Array.isArray(res.data) ? res.data[0] : res.data;
    return antwort(true, {
      members: normalizeMembers(row?.members),
      bekannt: Boolean(row?.bekannt),
    });
  },

  /** Mitglied entfernen (z. B. versehentlich angelegter Name). */
  async removeMember(code, name) {
    const res = await rpc("board_remove_member", { p_code: code, p_name: name });
    if (!res.ok) return res;
    const row = Array.isArray(res.data) ? res.data[0] : res.data;
    return antwort(true, normalizeMembers(row?.members));
  },
};
