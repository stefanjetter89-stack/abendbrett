/**
 * Zugangsdaten für die gemeinsame Ablage (Supabase).
 *
 * Bevorzugt werden Build-Variablen (.env / GitHub-Actions-Secret) gelesen,
 * ersatzweise die Konstanten unten. Wichtig zur Einordnung: Vite backt beide
 * Varianten in das ausgelieferte JavaScript ein — eine .env-Datei ist also
 * ordentlicher, aber kein Geheimnisschutz. Der anon key IST öffentlich; die
 * Absicherung passiert ausschließlich serverseitig (siehe supabase-setup.sql).
 */
const env = import.meta.env ?? {};

export const SUPABASE_URL =
  env.VITE_SUPABASE_URL || "https://wotxkkbzhmygemwywnxa.supabase.co";

export const SUPABASE_ANON_KEY =
  env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvdHhra2J6aG15Z2Vtd3l3bnhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzMzIzMzksImV4cCI6MjEwMDkwODMzOX0.YHT9PRKFehwftRK5rEMi2imeNltpLBaOq7HRlDZdifk";

/** Mindestlänge des Kosmos-Codes — erschwert Raten spürbar. */
export const MIN_CODE_LENGTH = 8;

/** Abstand der Hintergrund-Synchronisation in Millisekunden. */
export const SYNC_INTERVAL_MS = 15000;
