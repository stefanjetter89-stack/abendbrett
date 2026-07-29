import { createClient } from "@supabase/supabase-js";

/**
 * Zugangsdaten kommen aus src/config.js (siehe README, Abschnitt
 * "Gemeinsame Ablage einrichten"). Ohne gültige Werte läuft das
 * Abendbrett trotzdem weiter — nur eben ohne geteilte Speicherung
 * zwischen Geräten, dann speichert jedes Gerät nur für sich selbst.
 */
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

const eingerichtet =
  SUPABASE_URL && SUPABASE_ANON_KEY &&
  !SUPABASE_URL.includes("DEIN-PROJEKT");

export const supabase = eingerichtet
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

export const supabaseAktiv = Boolean(supabase);
