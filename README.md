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

`src/App.jsx` kapselt die Ablage in einem kleinen `store`-Objekt: im Browser
`localStorage`, in einer Claude-Artefakt-Umgebung `window.storage`. Wer stattdessen
ein echtes Backend anbinden will, tauscht nur diese beiden Funktionen aus.

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
