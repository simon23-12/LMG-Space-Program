# LMG Space Program

> Vollständige 3D-Simulation: `index.html` öffnen (benötigt die mitgelieferte
> `three.min.js` im selben Ordner). Navball-Steuerung:
> W/S = nicken, A/D = gieren, Q/E = rollen, ↑/↓ = Schub, Maus = Kamera.
>
> **Features (v3):** Manöverknoten [K] mit Δv-Editor und Bahnvorschau ·
> SAS [T] (Prograde/Retrograde/Knoten) · zweiter Mond **Minzi** (geneigte Bahn) ·
> Materiallabor-Experimente [B] · physische Stufen-Trümmer · Wiedereintritts-Glühen ·
> Flug-Neustart ↩ · LMG Space Center am Startplatz · **6 interaktive Tutorials**
> (`tutorials.js`): jedes wirft den Spieler in ein fertiges Szenario – z. B. direkt
> im 80-km-Orbit für Manöverknoten oder im tiefen Monti-Orbit für die Mondlandung –
> mit Live-Schritten, die sich automatisch abhaken.
>
> **Musik:** `space.mp3` (Menü) · `hangar.mp3` (Montagehalle) · `inspace.mp3`
> (sobald der Weltraum erreicht ist).

Eine 2D-Raumfahrtsimulation im Stil von Kerbal Space Program für den Browser.
Für die Raumfahrt-AG des Leibniz-Montessori-Gymnasiums Düsseldorf.

**Komplett ohne Installation, Accounts oder Server** – eine einzige `index.html`,
läuft auf jedem Schulrechner mit Browser (Doppelklick genügt).

## Features
- **Montagehalle (VAB):** Raketen aus Bauteilen zusammenstellen – Kapsel, Tanks,
  Triebwerke, Feststoffbooster, Stufentrenner, Fallschirm, Flossen, Landebeine.
  Live-Anzeige von Δv und Schub-Gewichts-Verhältnis pro Stufe (Ziolkowski-Gleichung!).
- **Echte Orbitalphysik:** Newtonsche Gravitation, Apoapsis/Periapsis, Atmosphäre
  mit Luftwiderstand, Planet *Leibniz* und Mond *Monti* mit eigener Gravitationssphäre.
- **Karrieremodus:** 15 Missionen/Meilensteine bringen Wissenschaftspunkte,
  damit werden 6 Tech-Tree-Stufen freigeschaltet. Sandbox-Modus für freies Bauen
  (dort: Endlos-Treibstoff per [U] für Testflüge).
- **Satelliten:** Sondenkern, Solarpanele und Antenne unter einem Nutzlast-Fairing
  starten ([F] = Fairing absprengen, [N] = Satellit aussetzen). Ausgesetzte
  Satelliten fliegen physikalisch korrekt weiter.
- **Kartenansicht** mit Bahnvorhersage, **Zeitraffer** bis 1000×.
- **Universum-Ansicht:** animiertes Leibniz-Monti-System mit Schwerkraft- und
  Δv-Vergleich – ideal als Physik-Gesprächsanlass in der AG.
- **Willkommens-Hinweise** in jedem Modus (abschaltbar per „Nicht wieder anzeigen“).
- **Speichern/Laden** als JSON-Download – keine Accounts, keine Cloud.

## Steuerung
| Taste | Funktion |
|---|---|
| Leertaste | Stufe zünden / trennen |
| ← / → (A/D) | Rakete drehen |
| ↑ / ↓ (W/S) | Schub regeln, Z = voll, X = aus |
| P | Fallschirm |
| M | Kartenansicht |
| , / . | Zeitraffer (nur außerhalb der Atmosphäre) |
| Mausrad | Zoom |

## So erreicht man einen Orbit (Tipp für die AG)
1. Senkrecht starten, ab ~1 km langsam nach Osten (rechts) neigen („Gravity Turn“).
2. Bei Apoapsis > 75 km Schub abschalten und bis zur Apoapsis warten (Zeitraffer).
3. Dort horizontal (90°) brennen, bis die Periapsis über 70 km liegt. Orbit! 🛰️

## Hosting
Lokal: Datei doppelklicken. Schulweit: `index.html` auf einen beliebigen
statischen Webspace legen (z. B. Vercel, GitHub Pages oder den Schulserver).
