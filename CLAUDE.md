# LMG Space Program – Entwickler-Notizen

Browser-KSP für die Raumfahrt-AG des Leibniz-Montessori-Gymnasiums (Klasse 8+).
Läuft per Doppelklick / statischem Hosting, ohne Accounts. UI komplett deutsch,
LMG-Branding (orange `--orange` / blau `--blue`).

## Dateien
- `index.html` – DAS Spiel. Alles inline (CSS, Screens, komplette Logik, Three.js-Szenen).
- `tutorials.js` – `const TUTORIALS`: 10 interaktive Szenario-Tutorials (lädt NACH index.html; in index.html heißt das Alt-Array `TUTORIALS_LEGACY`).
- `three.min.js` – Three.js **r128** UMD, lokal (funktioniert via file://). Kein Modul-Build verwenden!
- Assets: `mainmenu.png`, `loading.png`, `space.mp3` (Menü), `hangar*.mp3` / `inspace*.mp3` (Playlists, Rotation via `ended`).
- `.claude/launch.json` – Preview: `npx serve -l 8642` (Name `lmg-space-program`). Eintrag `lmgsongrodeo` gehört dem User – nicht anfassen.

## Architektur (die 5 wichtigsten Muster)
1. **Floating Origin:** Alles Weltfeste hängt in `Flight.world` (THREE.Group), die pro Frame um `-Flight.pos` verschoben wird. Kamera/Schiff bleiben nahe Ursprung → kein Float32-Jitter. `Flight.rocketGroup` und `shipMarker` hängen an `scene`, nicht an `world`.
2. **Rails + N-Body:** Planeten laufen "on rails" (`bodyPos(b,t)`/`bodyVel(b,t)`, rekursiv über `parent`; Leibniz↔Monti als exaktes Baryzentrum via `K_LM`). Schiff/Sats/Debris/EVA spüren ALLE `GRAV_BODIES` gleichzeitig (restricted n-body, `Flight.accel`). Volle Planeten-Integration NICHT einbauen – zerstört Knoten-Vorhersage & Warp.
3. **⚠️ Relativ-Geschwindigkeits-Gotcha:** Leibniz rast mit ~9,3 km/s um die Sonne. JEDE physikalisch sichtbare Geschwindigkeit (SAS-Prograde, Drag/airVel, Reentry-Hitze/Glühen, Navball, Knoten-Frame, Statistiken, Docking) MUSS relativ zum dominanten Körper (`vel - bodyVel(body,t)`) gerechnet werden.
4. **Trajektorien im mitbewegten Frame:** Vorhersagepunkte = `p_abs - bodyPos(frameBody, t_zukunft) + bodyPos(frameBody, jetzt)` – sonst "Fluchtwellen"-Artefakte. Periode aus großer Halbachse, RK2 mit Substeps, Horizont ×1.08. **Linien-Vertices IMMER relativ zu `Flight.pos` in den Float32-Buffer schreiben** und den großen Anteil in `line.position` legen (Float64-Matrixverkettung) – absolute ~1e10-Koordinaten haben in Float32 nur ~1 km Auflösung → Zitter-Bug beim Ranzoomen.
5. **SOI-Hierarchie:** `Flight.bodyAt(p,t)` prüft innerste zuerst: MONTI→LEIBNIZ→MINZI→KEPLER→NEWTON→SUN.

## Himmelskörper
SUN · KEPLER (Glutplanet innen, 5.3e9 m) · LEIBNIZ (R 600 km, Atmo 70 km) + Mond MONTI (Baryzentrum!) · MINZI (2.05e10) · NEWTON (Eisriese, 6.9e10). `MOONS` = Meshes/Ringe, `GRAV_BODIES` = Gravitation. Texturen prozedural: `makeBodyTexture(b)`.

## Raumstation »Große Pause«
`STATION` + `stationPos(t)`/`stationVel(t)`: exakter 100-km-Kreisorbit um Leibniz (on rails), immer da (Karriere/Sandbox/Tutorial). Docking: Part `dock`, Taste **[L]**, Bedingungen < 30 m & < 3 m/s rel. Angedockt = `Flight.docked`: Schiff folgt Station on rails (`dockOffset`). SAS-Modus `"tgt"` (ZIEL-BREMSE, nur < 50 km Entfernung im Zyklus) richtet gegen Relativgeschwindigkeit aus. Türkiser ◆-Navball-Marker < 50 km, HUD-Zielzeile < 400 km, Kartenmarker "ISS".

## Langzeit-Systeme (Jahresprojekt für die AG, alles NUR Karriere; Sandbox/Tutorial = neutral)
- **Stationsausbau:** `STATION_MODS` (5 Module, `needs`=Teile-Multiset). Angedockt + Teile an Bord → **[I]** `installModule()`: Teile raus, `Game.stationMods`, `buildStationMesh(stationModsEff())` wächst. Sandbox = Vollausbau (`stationModsEff`). Boni: modLab ×1,5 Experimente · modSolar lädt beim Docken · modHab +2 Crew-XP bei Docking · modScope zeigt Anomalie-Hinweise · modFunk zählt als 2 Relais.
- **Crew-Kader:** `Game.roster` (6 feste Astronaut*innen, `ROLES` pilot/ing/sci, `XP_LEVELS`). Auswahl in `Flight.start` (bereit + wenigste Flüge), Boni via `Flight.crewLvl(role)`: Pilot +8 %/Lvl Agilität, Ing −4 %/Lvl Sprit (`fuelEff`), Sci +10 %/Lvl Experimente. XP in `settleCrewAndAssets()` (endFlight). Im All zurückgelassen → `status:"gestrandet"` + Wrack-Asset.
- **Funknetz:** `commCheck(stack,pos,t)` – bemannt immer ok; Sonde: Leibniz-SOI ok, sonst Antenne nötig + `commRelays()` (1 = inneres System <2.6e10 m Sonnenabstand, 3 = Newton). Ohne Signal: `commDead` blockt Rotation/Schub/Z/X. Relais = Sat mit Antenne+Solar via [N] (`Game.relays`).
- **Anomalien:** `ANOMALIES` (8 Stück, `dir` = Einheitsvektor körperfest). Leuchtfeuer-Meshes (`anomalyMeshes`) pro Frame auf Oberfläche. Entdeckung in `onLanded(b)`: Winkel < 0,25 rad. `Game.anomaliesFound`.
- **Orbit-Inventar:** `Game.assets` ({kind:"sat"|"wreck", body, alt, phase, crew?}) – on rails via `assetPos/assetVel`, gespawnt in `spawnAssets()`. Sats persistieren bei [N] (Cap 12), Wracks mit Crew bei endFlight im All. Rettung `checkRescue()`: Kapsel < 40 m & < 4 m/s → Crew umsteigen; Landung auf Leibniz → `rescueLanded` + Status bereit (in `onLanded`).
- **Missionszentrale:** `renderMissionControl()` hängt an den Missions-Screen Sektionen für Station/Kader/Funknetz/Entdeckungen/Orbit-Inventar an. 10 neue Missionen: relay1/relay3, mod* (5), anomaly1, rescue1.

## Bauteile & Stack
`PARTS` (Reihenfolge im Stack: Index 0 = SPITZE). **Radialteile** (`isRadial`: fin, sb2/sb4) belegen KEINE Stack-Höhe (`stackHeight()` statt Summe!) und werden in `buildRocketGroup` an den benachbarten Tank montiert (`radialHost`: erst darunter, dann darüber; `buildPartMesh(id, {r,h})`). Sidebooster = eigener Treibstoff-Pool `v.boost` mit eigener Zündung `bo.ignited` ([R] separat oder automatisch mit Stufe 1), eigene Tank-Gauge `boostGauge`, Abwurf [J]; Trümmer-Mesh = `buildStrapOnMesh(strapOnHeight(stack,i))` – NICHT das srb-Mesh (Formwechsel-Bug). Servicebuchten verkleiden das Teil DARÜBER; Fairing verkleidet alles darüber.

## Wichtige Systeme (Stichworte → Suchbegriff in index.html)
- Karriere: `MISSIONS` (Verträge, nur `Game.activeMission` erfüllbar, `req`-Ketten), `TECH` (DAG, SVG-Äste), `Game.labDone` (Experimente [B] je `situation()` einmalig).
- `Flight.step(dt)`: semi-implizit Euler; Warp `WARPS`, adaptives `maxDt`; Steuereingabe bricht Warp>2 ab; Drag-Clamp `min(fd/(m*v), 0.5/dt)`; Auto-Cutoff am Manöverknoten (`nodeBurned`).
- Agilität: `0.35 + 0.65*nRcs` (Rotation UND SAS-Slerp).
- Partikel-Pool (110 Sprites, `fresh`-Flag, altern mit Sim-Zeit `simmed`), Rauch nur in Atmosphäre.
- Tutorials: `Tut.start(id)` erzwingt Sandbox + ∞-Strom; Szenario: `stack`, `orbit:{body,alt,pe?}` oder `nearStation:<m hinter Station>`; Checks `check(o,F)` laufen pro Frame.
- Admin-Cam: `AdminCam` (eigene Three-Szene, echte Ephemeriden, Fokus-Buttons, Zeitraffer) – Vollbild aus dem Universum-Screen.
- localStorage: `lmgAutoSave`, `lmgMusic`, `lmgLoadedOnce`, `lmgHint_*`, `tutsDone` im Save.

## Tastenkürzel
Space Stufe · T SAS (off/pro/retro/[node]/[tgt]) · P Schirm · F Fairing · N Satellit · G Panele · O Buchten · **R Booster zünden** · J Booster ab · **L Docken** · **I Modul einbauen** · V EVA · K Knoten · B Experiment · M Karte · U ∞Tank (Sandbox) · H HUD (3-stufig) · Esc Pause · ,/. Warp · WASD/QE drehen · ↑↓ Schub · Z/X Vollgas/aus

## Test-Workflow (immer so!)
1. Preview: `preview_start` mit `lmg-space-program` (Port 8642).
2. Programmgesteuerte Evals statt Handsteuerung: Zustand direkt setzen (`Flight.pos/vel = …`), Physik mit `for(...) Flight.step(0.02)` laufen lassen, Werte zurückgeben. Gravity-Turn-Autopilot: `Flight.q.setFromUnitVectors(V3(0,1,0), up*cosθ + east*sinθ)`.
3. Konsole auf Fehler prüfen, Screenshots für Optik.
4. **Nach jedem Testlauf `localStorage.removeItem('lmgAutoSave')`** – sonst verwirren Test-Reste den User (z. B. Rakete im "leeren" Hangar).

## User-Präferenzen (Simon, Lehrer)
- Keine vorgebauten Raketen im Hangar (VAB.stack=[] bei jedem Einstieg).
- Forschung/Missionen NUR als Karriere-Untermenü, nicht im Hauptmenü.
- Didaktik zuerst: Tutorials werfen in fertige Szenarien, Fachbegriffe (Prograde, Δv, TWR) erklären, Physik ehrlich (echte Ziolkowski/Kepler-Rechnung).
- Autonom weiterbauen ist erwünscht; Bug-Reports kommen präzise mit Screenshots.
