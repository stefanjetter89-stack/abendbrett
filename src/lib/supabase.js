/**
 * Supabase-Client — bewusst per dynamischem Import geladen.
 *
 * Grund: Die Bibliothek macht rund zwei Drittel des Bundles aus. Wer die App
 * ohne geteilte Ablage nutzt, soll sie gar nicht erst herunterladen müssen.
 */
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config.js";

const istPlatzhalter =
  !SUPABASE_URL ||
  !SUPABASE_ANON_KEY ||
  SUPABASE_URL.includes("DEIN-PROJEKT") ||
  SUPABASE_ANON_KEY.includes("DEIN-ANON-KEY");

/** Ist die geteilte Ablage überhaupt konfiguriert? */
export const supabaseAktiv = !istPlatzhalter;

let clientPromise = null;

/** Liefert den Client (einmalig initialisiert) oder null, wenn nicht konfiguriert. */
export function getSupabase() {
  if (!supabaseAktiv) return Promise.resolve(null);
  if (!clientPromise) {
    clientPromise = import("@supabase/supabase-js")
      .then(({ createClient }) =>
        createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          auth: { persistSession: false }, // keine Anmeldung, kein Token-Handling nötig
        })
      )
      .catch((err) => {
        console.error("Supabase konnte nicht geladen werden:", err);
        clientPromise = null;
        return null;
      });
  }
  return clientPromise;
}
