# Abendbrett

Ein Abendessen-Entscheider für zwei Personen. Vier Regler, fünf Vorschläge, fertige
Einkaufsliste. Gegen die tägliche Frage „Was kochen wir heute Abend?".

- **219 Gerichte** quer durch Mittelmeer, Asien, gutbürgerlich, Orient & Streetfood,
  leicht & proteinbetont – plus 12 Bestell-Optionen
- **Vier Regler**: Zeit · Küche · Kochen oder Bestellen · Anpassen
- **Fünf Kacheln pro Runde**: je eine schnelle, leichte, wohlige, neue und eine Lieferung
- **Einkaufsliste** aus allen ausgewählten Gerichten, kopierbar
- **Eigene Gerichte** anlegen und löschen, dauerhaft gespeichert
- Keine Konten, kein Backend, keine Tracker

## Loslegen

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # statischer Build nach dist/
```

Node 18 oder neuer.

## Aufbau

```
src/
  dishes.js   Gerichte-Datenbank (der Teil, den man am häufigsten anfasst)
  App.jsx     Komponente, Filterlogik, Styles
  main.jsx    Einstiegspunkt
```

### Ein Gericht ergänzen

In `src/dishes.js` eine Zeile im Array `EXTRA` anlegen:

```js
D("Spaghetti Carbonara", "Italienisch", "schnell", 20, "fp",
  ["250 g Spaghetti", "150 g Guanciale", "3 Eigelb", "60 g Pecorino"],
  "Pfanne vom Herd, bevor das Ei dazukommt."),
```

| Feld | Bedeutung |
|---|---|
| Name | Anzeigename der Kachel |
| Küche | z. B. `Italienisch`, `Thai`, `Gutbürgerlich` – steuert die Gruppenzuordnung |
| Kategorie | `schnell`, `leicht`, `komfort`, `neu` oder `bestellen` |
| Minuten | Zubereitungszeit; `0` bei Lieferungen |
| Flags | `v` vegetarisch · `f` Fleisch · `s` Fisch · `k` kalt · `p` Vorratskammer · `x` scharf |
| Zutaten | Liste für zwei Personen |
| Tipp | optional, erscheint unter den Zutaten |

Tags („Vegetarisch", „Unter 20 Min", „Wochenendprojekt") entstehen automatisch aus
Flags und Minuten. Neue Küchen brauchen einen Eintrag in `GRUPPE` in `App.jsx`,
sonst tauchen sie nur unter „Alle" auf.

Gerichte lassen sich auch direkt in der Oberfläche anlegen und löschen
(„Gerichte verwalten"). Diese landen im Browser-Speicher, nicht im Repository –
wer sie dauerhaft im Projekt haben will, trägt sie in `dishes.js` nach.

## Speicherung

Eigene und gelöschte Gerichte lassen sich **lokal** oder **geteilt** speichern:

- **Ohne Einrichtung:** Änderungen landen nur im Browser dieses einen Geräts
  (`localStorage`). Ein anderes Gerät sieht sie nicht.
- **Mit Supabase eingerichtet:** Jede Gruppe (Familie, Paar, WG) vergibt beim
  ersten Öffnen einen eigenen **Kosmos-Namen** und den eigenen **persönlichen
  Namen**. Nur Geräte mit demselben Kosmos-Namen teilen sich die Liste — sogar
  live, ohne Neuladen. Im Verwaltungs-Tab seht ihr, wer bereits im Kosmos ist.

### Gemeinsame Ablage einrichten (einmalig, kostenlos)

1. Kostenloses Konto auf [supabase.com](https://supabase.com) anlegen, neues
   Projekt erstellen (Region z. B. Frankfurt).
2. Im Projekt: **SQL Editor → New query** → Inhalt von
   [`supabase-setup.sql`](supabase-setup.sql) einfügen → **Run**.
   Das legt die Tabelle an und schaltet Live-Sync ein.
3. **Settings → API** öffnen. Dort stehen zwei Werte:
   - **Project URL**
   - **anon public key** (auf der Legacy-Ansicht der API-Keys-Seite zu finden,
     falls Supabase inzwischen "Publishable key" als Standard zeigt)
4. Beide Werte in `src/config.js` eintragen:

   ```js
   export const SUPABASE_URL = "https://xxxxxxxx.supabase.co";
   export const SUPABASE_ANON_KEY = "eyJhbGci...";
   ```

5. Datei committen und pushen (oder im GitHub-Web-Editor speichern) — der
   nächste automatische Build übernimmt die Werte.

Der `anon key` ist zum Veröffentlichen gedacht; die Absicherung übernimmt die
Row-Level-Security-Regel aus dem SQL-Skript. Die Trennung zwischen Gruppen läuft
über den selbst gewählten Kosmos-Namen — kein Login nötig, aber auch kein
Passwortschutz: wer einen Kosmos-Namen errät, käme technisch heran. Für den
privaten Familien-/Partnergebrauch reicht das; ein möglichst uneindeutiger
Name (z. B. nicht "test" oder "familie") erhöht die faktische Privatsphäre.

Tippt jemand einen bereits vergebenen Namen ein, fragt die App vor dem
Beitreten nach ("Unter diesem Namen liegen schon X Gerichte — ist das eurer?")
statt stillschweigend zwei fremde Gruppen zusammenzulegen. Eine Garantie für
Eindeutigkeit ist das nicht, aber es verhindert die versehentliche Kollision.

Ohne diesen Schritt läuft die App unverändert weiter — nur eben mit lokaler
statt geteilter Speicherung, ganz ohne Kosmos-Abfrage.

## Deployment

Der Workflow unter `.github/workflows/deploy.yml` baut bei jedem Push auf `main`
und veröffentlicht nach GitHub Pages. Einmalig in den Repository-Einstellungen
unter **Settings → Pages → Source** auf **GitHub Actions** stellen.

Alternativ läuft der Build unverändert auf Netlify, Vercel oder jedem Webspace –
`dist/` enthält nur statische Dateien.

## Ideen für später

- Portionsrechner statt fester Mengen für zwei
- Wochenplan mit Einkaufsliste über mehrere Abende
- Saisonfilter (Spargel im Mai, Kürbis im Oktober)
- Import und Export der eigenen Gerichte als JSON

## Lizenz

MIT – siehe [LICENSE](LICENSE).
