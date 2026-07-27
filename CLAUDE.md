# LMG Space Program – Entwickler-Notizen

Browser-KSP für die Raumfahrt-AG des Leibniz-Montessori-Gymnasiums (Klasse 8+).
Läuft per Doppelklick / statischem Hosting, ohne Accounts. UI komplett deutsch,
LMG-Branding (orange `--orange` / blau `--blue`).

## Dateien
- `index.html` – DAS Spiel. Alles inline (CSS, Screens, komplette Logik, Three.js-Szenen).
- `tutorials.js` – `const TUTORIALS`: 14 interaktive Szenario-Tutorials (lädt NACH index.html; in index.html heißt das Alt-Array `TUTORIALS_LEGACY`).
- `three.min.js` – Three.js **r128** UMD, lokal (funktioniert via file://). Kein Modul-Build verwenden!
- `nebulae.js` – `NEBULAE`: 5 Nebel-Fotos als Base64-Data-URIs (file:// erlaubt keine Datei-Bilder als WebGL-Textur!). `NEBULA_DEFS` + `nebulaTextures()` (Canvas mit Radial-Alpha-Maske) + `addNebulae(scene,radius,sizeScale,opacityScale)`: Flug-Szene (Radius 7e10, Opacity via `frame()` an Sternen-Ausblendung gekoppelt, Kamera-Far dafür 2.2e11), AdminCam (1.8e11, ×2.6) und die 2D-Universum-Karte (`universeFrame` zeichnet `tex.image` additiv).
- Assets: `mainmenu.png`, `loading.png`, `space.mp3` (Menü), `hangar*.mp3` / `inspace*.mp3` (Playlists, Rotation via `ended`), **`raptor.mp3`** (Original-Triebwerksmitschnitt, s. »Triebwerksklang«).
- `.claude/launch.json` – Preview: `npx serve -l 8642` (Name `lmg-space-program`). Eintrag `lmgsongrodeo` gehört dem User – nicht anfassen.

## Optionen & Grafikstufen (`Settings` / `GFX_PRESETS` / `applyGraphics`)
Screen `#options` (Hauptmenü »⚙️ Optionen«, im VAB der ⚙️-Knopf), gerendert von
`renderOptions()`. Drei Regler: **Grafik** (niedrig/mittel/hoch), **Musik**, **Geräusche**.
- ⚠️ **Bewusst im localStorage (`lmgSettings`), NICHT im Spielstand.** Einstellungen gehören
  zum RECHNER – die Kinder tauschen Saves als Datei aus, sonst erbt der lahme Schulrechner
  die »Hoch«-Stufe vom Gaming-PC.
- Eine Stufe schaltet ALLE teuren Schrauben gemeinsam: `dpr` (Auflösung), `shadow`
  (Schattenkarte in px, 0 = aus), `trees`, `clouds`.
- **`gfxPixelRatio()` ist der größte Einzelhebel.** Vorher rief niemand `setPixelRatio` auf →
  auf jedem HiDPI-Bildschirm (Simons Rechner: devicePixelRatio 1,75) rendert das Spiel in
  ~57 % Linearauflösung und wird hochskaliert. Das war der »irgendwie matschig«-Eindruck.
  Doppelte dpr = **vierfache** Pixelmenge, deshalb gedeckelt.
- ⚠️⚠️ **Dazu gehört zwingend `width:100%;height:100%` im CSS jedes Renderer-Canvas**
  (`#vab3d canvas`, `#flight3d canvas`). `setSize(w,h,false)` lässt die CSS-Größe absichtlich
  in Ruhe und setzt nur den Zeichenpuffer auf w·dpr – ein `<canvas>` ist aber ein **ersetztes**
  Element: ohne gesetzte Breite gewinnt seine INTRINSISCHE Größe (= Puffergröße in px) gegen
  `inset:0`, `right`/`bottom` werden ignoriert. Folge auf JEDEM HiDPI-Schirm: die Leinwand ist
  dpr-mal zu groß, hängt links oben fest, man sieht nur ihren linken oberen Ausschnitt (Bild
  wirkt herangezoomt und aus der Mitte gerückt) – und in der Halle schob sie sich über das
  rechte Info-Panel (»die rechte Seite ist abgeschnitten«, Bug-Report Simon, 13"). Das
  Lens-Flare-Overlay ist 1:1 groß und lag deshalb auch nicht mehr auf der sichtbaren Sonne.
  Gegenprobe: `canvas.getBoundingClientRect()` MUSS `#vab3d`/`#flight3d` exakt entsprechen.
- Wolkenzahl über `geo.instanceCount` (Puffer bleibt voll, gezeichnet wird nur der Anfang) →
  live umschaltbar ohne Neubau. Bäume über `Settings.q.trees` in `placeTrees`; `applyGraphics`
  ruft `placeTrees` sofort neu auf, wenn eine Bodenszene steht (sonst wirkt der Regler erst
  beim nächsten Verankern und sieht kaputt aus).
- ⚠️ **`shadowMap.enabled` wird NUR am VAB-Renderer geschaltet.** Die Flugszene hat keine
  Schattenwerfer; sie mitzuschalten bringt kein Pixel, erzwingt aber einen Shader-Neubau der
  GANZEN Szene inklusive Ozean-, Himmels- und Wolken-Shader = spürbarer Hänger pro Klick.
- Lautstärke: `music.volume = Settings.music`; `Flight.setRumble` merkt sich den Rohpegel in
  `_rumbleWant` und multipliziert mit `Settings.sfx`, damit der Regler mitten im Brennvorgang
  sofort greift.

### Triebwerksklang: echte Raptor-Aufnahme (`RAPTOR` / `setRaptor` / `updateRaptor`)
Zwei Schichten: `raptor.mp3` (Originalmitschnitt) trägt den Klang, das synthetische Rumpeln
(`ensureRumble`, braunes Rauschen über WebAudio) liegt als Tiefton darunter – deshalb ist es
leiser als früher. Beide hängen an `Settings.sfx` und an Schub × Luftdichte.
Die Aufnahme zerfällt gemessen in drei Abschnitte: **0,00–3,10 s** Turbopumpen-Spin-up und
Zündung (−23 → −6 dB) · **3,15–18,60 s** Volllast bei konstant −6 dB ← das ist der Loop ·
**18,80–19,60 s** Ausklingen (im Loop unbrauchbar). Gespielt wird: Spin-up EINMAL bei der
Zündung, danach endlos das Volllast-Stück, solange gebrannt wird.
- ⚠️⚠️ **ZWEI `<audio>`-Elemente im Wechsel mit 0,35 s Überblendung** – NICHT ein Element mit
  `currentTime`-Sprung: Ein Sprung landet in einer MP3 nur auf Frame-Grenzen (~26 ms) und der
  Decoder braucht danach kurz; das klickt und stockt hörbar, und zwar alle 15 s.
- ⚠️ **Gleich-LEISTUNGS-Überblendung (cos/sin), nicht linear**: Die beiden Elemente spielen
  dieselbe Aufnahme an verschiedenen Stellen, ihr Rauschen ist also unkorreliert. Linear
  überblendet addieren sich die Leistungen nicht auf 1 – man hört mitten im Wechsel ein
  ~3-dB-Loch. Verifiziert: `volA² + volB²` bleibt über die ganze Blende konstant.
- ⚠️⚠️ **KEIN WebAudio-Buffer**: `decodeAudioData` braucht `fetch()`, und das ist per file://
  gesperrt – das Spiel muss aber per Doppelklick laufen. `<audio src="raptor.mp3">` geht dort
  (wie die Musik-Playlists).
- ⚠️ `updateRaptor` läuft in JEDEM Frame, auch nach dem Cutoff (blendet noch ~0,3 s aus).
  Beim Screenwechsel greift `stopRaptor()` hart – ohne laufende Frame-Schleife bliebe der Ton
  sonst stehen. Bei Pause ist `engOn` false.

## Licht & Spiegelungen (`EnvMap` / `applyEnv` / Kontaktschatten)
- ⚠️⚠️ **Ohne envMap ist `metalness` in three.js ein MINUS-Geschäft:** Der diffuse Anteil wird
  um (1−metalness) gekürzt, zurück kommt nur das Glanzlicht der EINEN Richtungslichtquelle.
  Sämtliche Tanks, Türme, die Mechazilla und die Raketenhüllen (metalness .25–.6) sahen
  deshalb nicht metallisch aus, sondern schlicht **dunkler und flacher** als gedacht.
- `EnvMap.build(key, renderer, paint)` backt aus einem 128×64-Canvas (`paintHallEnv` /
  `paintSkyEnv`) per `PMREMGenerator` eine Umgebung. Canvas-Oberkante = Zenit,
  u = atan2(z,x) (three-Konvention). Altes RenderTarget IMMER `dispose()`, sonst leckt
  jeder Neubau eins.
- ⚠️ **`applyEnv` GEZIELT auf Rakete/Rampe/Droneship/Station – NICHT `scene.environment`.**
  Letzteres wirkt wie zusätzliches Umgebungslicht und würde die mühsam austarierte
  Helligkeit von Boden, Meer und Planet mit anheben.
- ⚠️ **`material.needsUpdate` nur beim ERSTEN Anbau** (Flag `had` in `applyEnv`): Es erzwingt
  eine Shader-Neuübersetzung. Die Flugszene backt ihre Umgebung im Tagesverlauf immer wieder
  neu – mit needsUpdate bei jedem Tausch hinge das Spiel bei jedem Sonnenstand-Schritt.
- `Flight.updateEnv(atmo)` baut nur neu, wenn eine grobe **Signatur** (Atmosphäre,
  dayLight, Sonnenrichtung) springt, und höchstens alle 400 ms (auf »Niedrig« 1200 ms).
  Im All wird die Umgebung schwarz – dort spiegelt sich wirklich nur die Sonne.
  Nach `rebuildRocket`/`rebuildStation`/`start()` muss `applySceneEnv()` laufen, sonst haben
  die frischen Meshes keine Umgebung.
- **Hangar-Schatten:** `VAB.renderer.shadowMap` + `sunLight.castShadow`, Ortho-Fenster ±240
  (bei 2048 px = 23 cm/Texel, eine Figur ist ~6 Einheiten hoch). Die Lichtposition wird auf
  Länge 520 normiert, damit das Hallendach vor der near-Ebene liegt. ⚠️ **`normalBias` (0,7)
  statt reinem bias** – auf dem 360 Einheiten großen Boden ist reiner bias entweder zu klein
  (Streifen-Akne) oder hebt die Schatten von den Füßen ab. `setShadowRes(0)` gibt die Karte
  wirklich frei (VRAM auf genau dem Rechner, dem er fehlt).
- **Kontaktschatten** (`shadowBlobTex`): weiche schwarze Radialverlauf-Blasen.
  - VAB: `VAB.blobs` (InstancedMesh, Rakete + Belegschaft) – **nur auf Stufe »Niedrig«**
    sichtbar, wo es keine Schattenkarte gibt; sonst doppelte Verdunklung.
  - Flug: `Flight.shipBlob`, hängt an `scene` (das Schiff IST der Szenen-Ursprung), Position
    `-up·alt`. ⚠️ Für Größe/Deckkraft zählt die Höhe der **Unterkante** (`alt − height()/2`) –
    `alt` ist die Höhe der SchiffsMITTE und auf der Rampe die halbe Raketenlänge, nicht null.

## Architektur (die 5 wichtigsten Muster)
1. **Floating Origin:** Alles Weltfeste hängt in `Flight.world` (THREE.Group), die pro Frame um `-Flight.pos` verschoben wird. Kamera/Schiff bleiben nahe Ursprung → kein Float32-Jitter. `Flight.rocketGroup` und `shipMarker` hängen an `scene`, nicht an `world`.
2. **Rails + N-Body:** Planeten laufen "on rails" (`bodyPos(b,t)`/`bodyVel(b,t)`, rekursiv über `parent`; Leibniz↔Monti als exaktes Baryzentrum via `K_LM`). Schiff/Sats/Debris/EVA spüren ALLE `GRAV_BODIES` gleichzeitig (restricted n-body, `Flight.accel`). Volle Planeten-Integration NICHT einbauen – zerstört Knoten-Vorhersage & Warp.
3. **⚠️ Relativ-Geschwindigkeits-Gotcha:** Leibniz rast mit ~9,3 km/s um die Sonne. JEDE physikalisch sichtbare Geschwindigkeit (SAS-Prograde, Drag/airVel, Reentry-Hitze/Glühen, Navball, Knoten-Frame, Statistiken, Docking) MUSS relativ zum dominanten Körper (`vel - bodyVel(body,t)`) gerechnet werden.
4. **Trajektorien im mitbewegten Frame:** Vorhersagepunkte = `p_abs - bodyPos(frameBody, t_zukunft) + bodyPos(frameBody, jetzt)` – sonst "Fluchtwellen"-Artefakte. **frameBody WECHSELT pro Punkt** via `bodyAt(p,t)` (SOI-Übergang wie KSP): Abschnitte in Montis Sphäre plotten relativ zu Monti-JETZT – gilt für orange UND grüne (Knoten-)Bahn; Ap/Pe-Marker nur auf Punkten im Ursprungs-Frame suchen. Periode aus großer Halbachse, RK2 mit Substeps, Horizont ×1.08. **Linien-Vertices IMMER relativ zu `Flight.pos` in den Float32-Buffer schreiben** und den großen Anteil in `line.position` legen (Float64-Matrixverkettung) – absolute ~1e10-Koordinaten haben in Float32 nur ~1 km Auflösung → Zitter-Bug beim Ranzoomen.
5. **SOI-Hierarchie:** `Flight.bodyAt(p,t)` prüft innerste zuerst: MONTI→LEIBNIZ→MINZI→KEPLER→HUYGENS→NEWTON→SUN.

## Prozedurales Terrain von Leibniz (EINE Quelle für alles)
`landH(x,y,z,oct)` – signierte Landhöhe auf der Einheitskugel, **> 0 = Land**. Fraktales Wertrauschen (`_tNoise`), Lakunarität 2, **Persistenz 0,5**, Oktave 0 = 400-km-Zellen, `TERRAIN_SEA = 0.548` → ~35 % Landanteil. Speist gleichzeitig:
1. `makeBodyTexture(LEIBNIZ)` – 2048×1024, Kontinente + Schelf/Tiefsee + Eiskappen + **Höhenfarben & Schummerung** (~410 ms, gecacht in `_leibnizTex`, weil Flug-Szene UND AdminCam sie brauchen)
2. `leibnizDisc()` – die Scheibe der 2D-Universum-Karte (orthografisch, einmal gebacken; `drawPlanetSurface` macht nur noch `drawImage`, es wird pro Frame gezeichnet!)
3. `buildShoreTable(pad)` – die **Küstenlinie der Bodenszene**
4. `_padLonAt(lat)` – die Längengrade der Rampen

Damit ist der Strand vor der Rampe wirklich derselbe Kontinentrand wie aus dem Orbit; vorher waren das zwei unabhängige Generatoren und der Planet »sprang« beim Aufstieg sichtbar um.
- **Persistenz 0,5 ist kein Zufall:** bei Lakunarität 2 lenkt damit JEDE Oktave die Küste um denselben Bruchteil ihrer Wellenlänge aus (~5 %) – genau das macht eine Küste fraktal statt lineal-gerade. Ändert man sie, wird die Küste entweder glatt oder zerfranst.
- ⚠️ **Permutationstabellen-Hash statt Multiplikations-Hash** (`_tPerm`): 3 Tabellenzugriffe sind ~7× schneller (Textur 100 statt 724 ms bei 1024²). Wiederholung alle 256 Zellen ist selbst bei der feinsten Oktave erst nach ~50 km und dort nur ~25 m Auslenkung wert. Pro Oktave ein eigener Versatz, sonst liegen alle Zellgitter übereinander (sichtbares Rechteckmuster).
- ⚠️⚠️ **UV-Konvention von `THREE.SphereGeometry` EXAKT nachbauen:** `x = −cos(φ)·sin(θ)`, `y = cos(θ)`, `z = sin(φ)·sin(θ)` mit `φ = u·2π`. **Das Minus bei x ist entscheidend** – ohne es liegt der Planet spiegelverkehrt zur Bodenszene und die Küste, an der man startet, ist auf der Kugel nirgends zu finden (Symptom: bei 17 km Höhe nur einfarbiges Grün). Gegenprobe: Textur-Pixel an der Rampen-UV vs. `landH` an mehreren Ost-Abständen – muss überall dasselbe Vorzeichen liefern.
- **Restliche Unschärfe ist gewollt:** 2048×1024 = 1,8 km/Texel. Beim Wechsel Bodenszene→Kugel (16 km) bleibt die FORM gleich, die Schärfe springt. Global feiner ginge nur mit ~50 m/Texel = unbezahlbar.

### Relief: Berge, Täler & Wälder (`terrainH` / `forestMask`)
`landH` sagt nur WO Land ist; wie es AUSSIEHT kommt aus `terrainH(x,y,z,oct,lh?)` → **Meter über Meeresspiegel** (0 auf Wasser und an jeder Küste), Mittel ~1400 m, max ~3450 m (`TERRAIN_MAX_H` 3400).
- `_tRidge` = ridged multifractal (`1−|2n−1|`, quadriert, Oktaven mit der bisherigen Höhe gewichtet) → scharfe GRATE statt runder Hügel. **Startfrequenz 8 = ~470-km-Gebirgszüge**; mit 2,6 gab es global nur ein paar riesige Wölbungen und die Bodenszene sah aus wie eine gewellte Wiese.
- Oktaven an die Verwendung gekoppelt wie bei `landH`: Textur (oct 8) → 6 Ridge-Oktaven ≈ 15-km-Grate, Bodenszene (oct 12) → 9 ≈ 1,8-km-Grate.
- ⚠️⚠️ **Berge wachsen mit dem Abstand von der KÜSTE** (`inland = lh/0.036`, dann smoothstep). Nicht nur geologisch plausibel – es hält vor allem ALLE Rampen und jede Wasserung flach, und **das ist Pflicht: die Physik kennt nur die Kugel** (`alt = |pos| − R`). Gemessen: Rampen h₀ = 0–6 m, Silhouette vom LMG-Startplatz 7,6°, vom Äquator-Raumhafen 2,9°, Polarstation 1,4°. Der Nenner ist der wichtigste Regler – größer = breitere Küstenebene = flacherer Horizont.
- `forestMask(x,y,z,h?,lh?)`: Fleckenrauschen × Höhenband (Baumgrenze `TREE_LINE` 1500 m) × Breitenmaske (ab ~66° nichts mehr). ⚠️ **Frequenz 70 = Waldgröße ~54 km.** Mit 11 (330-km-Zellen) ist eine ganze Weltgegend entweder komplett Wald oder komplett kahl – an den Rampen kam dann gar kein Baum vor.
- ⚠️ **`lh` durchreichen, wo es schon bekannt ist!** `landH` (8–12 Oktaven) ist der teuerste Teil; die Textur rechnete ihn sonst pro Texel dreimal (Farbe/Höhe/Wald) → 700 statt 410 ms. Die Textur macht deshalb Durchgang 1 = `landH` voll auflösen in `lhBuf`, Durchgang 2 = Relief+Wald nur auf LAND und nur halb aufgelöst, Durchgang 3 = Schummerung, Durchgang 4 = Farbe.
- **Schummerung (Hillshading)** aus dem Höhengradienten (Licht aus Nordwest) – der eigentliche Grund, warum der Planet aus dem Orbit plastisch aussieht. ⚠️ Nur ±30 %: die Textur ist ALBEDO, das Sonnenlicht kommt in der Szene noch dazu; mit ±60 % brannten alle besonnten Hänge zu weißen Flecken aus.
- Landfarben nach HÖHE (Tiefland-Grün/Wald → Fels → Firn/Schnee) in `makeBodyTexture` UND `leibnizDisc` UND den Scheitelfarben der Bodenszene – dreimal dieselbe Rampe, sonst zeigt die 2D-Karte einen anderen Planeten als das Fenster.

### Bodenszene: Geländescheibe statt flacher Kreis
`terrainGeometry()` = Ringscheibe r 40 km, **Ringradien quadratisch** (innen ~90 m, außen ~2,4 km Abstand) = LOD ohne Extraaufwand; 128×44 ≈ 11 000 Dreiecke. `Flight.shapeTerrain(up,east,north)` (in `reanchorGround`) hebt die Scheitel auf `terrainH` und schreibt die Scheitelfarben; ~2 ms.
- ⚠️ **Höhe RELATIV ZUM ANKER** (`h − h0`): der Anker liegt immer unter dem Schiff, gelandet wird bei `|pos| = R`. Ohne das schwebt die Rakete überm Tal oder steckt im Hang.
- ⚠️ Zusätzlich blendet `smoothstep(dist, 900, 4200)` das Relief im Nahbereich aus → die Landefläche ist immer eben. An der Küste kostet das nichts, weil `terrainH` dort ohnehin gegen 0 geht.
- **Luftperspektive** (`Flight.groundHaze`, via `onBeforeCompile` NUR in dieses Material injiziert – `scene.fog` wäre fatal, die Szene reicht über 1e10 m): ohne sie hat ein Gipfel in 30 km dieselbe Farbe wie die Wiese vor den Füßen und die Landschaft wirkt flach, obwohl die Geometrie stimmt. ⚠️ Entfernung zur KAMERA (`length(mvPosition.xyz)`), nicht zum Anker – sonst liegt beim Blick aus 5 km Höhe auch der Boden direkt unter dem Schiff im vollen 40-km-Dunst. Farbe = `uHorizonCol` des Meeres, damit ferne Berge und ferne See im selben Dunst verschwinden.
- **Bäume** setzt jetzt `Flight.placeTrees` bei jedem Verankern neu (max. 420 Instanzen, `count` kappen!): Position nur wo `forestMask ≥ 0,30`, Höhe = Geländehöhe. Damit stehen an der **Polarstation 0 Bäume** – das fällt aus dem Terrainmodell, ist kein Sonderfall. Die Polar-Tönung des Bodens kommt ebenfalls aus den Scheitelfarben (Breitengrad des ANKERS), nicht mehr aus der Rampen-ID.

## Himmel: Rayleigh- + Mie-Streuung (`SKY_FRAG` + JS-Zwilling `skyRadiance`)
Vorher war der Himmel EINE Farbe von Nachtschwarz nach Tagblau – deshalb gab es nie eine Morgen-/Abendröte (ein Sonnenuntergang IST ein Farbverlauf über den Himmel). Jetzt echte Einfachstreuung auf einer Himmelskuppel: `L = (β_R·ph_R + β_M·ph_M)/(β_R+β_M) · (1−e^(−τ_Blick)) · e^(−τ_Sonne)`, Rayleigh ∝ 1/λ⁴ (β_blau ≈ 5,7× β_rot), Mie mit Henyey-Greenstein g = 0,76 (weißer Hof um die Sonne). Am Horizont laufen ~38 Luftmassen → Blau ist weggefressen, Rot überlebt.
- ⚠️ Der **`(1−e^(−τ))`-Term trägt die Farbe** – wer ihn wegkürzt, bekommt einen grauen Himmel.
- ⚠️ **`sunPath(czV)` ist Pflicht** (Näherung!): Die Formel behandelt die Luft als gleichmäßig dicht, dann liefe das Sonnenlicht auch für den ZENIT-Himmel durch die vollen Horizont-Luftmassen und der ganze Himmel würde abends olivbraun. In echt kommt das Zenitlicht aus 10–30 km Höhe, wo die Sonne fast unverfinstert steht. Also Zenit = 20 % Sonnenweg, Horizont = 100 %. Ein echter Raymarch entlang des Sehstrahls (wie im Referenz-Repo) wäre exakter, kostet aber pro Pixel ein Vielfaches.
- ⚠️ **Mehrfachstreuungs-Term muss stark BLAUgewichtet sein** (`β/β_blau`, nicht `β/β_gesamt`): Licht, das mehrfach gestreut ankommt, wurde ja gerade deshalb gestreut, weil es blau ist. Sonst wird die Dämmerung grau-braun statt dämmerblau.
- ⚠️ Die Kuppel ist **OPAK** (`depthTest:false`, `renderOrder −1000`, Radius 5e6) und blendet im Shader selbst per `uAlpha` zum All über. Mit `transparent:true` zeichnet three.js sie NACH allen opaken Objekten – der Himmel läge dann vor Rakete und Planet.
- ⚠️ Die Himmelshelligkeit hängt an der **SONNENHÖHE** (`smoothstep(czSun, −0.25, −0.02)`), NICHT an `dayLight`: das ist bei 0° Sonnenstand schon fast aus (0,12), damit wäre der Sonnenuntergang dunkelgrau statt glühend.
- `skyRadiance` (JS-Zwilling) liefert `Flight.skyZenith`/`skyHorizon` für Meer, Wolken und Umgebungslicht – EINE Quelle, sonst passt der Himmel nicht zum Boden. `sunTint(czSun)` = Farbe des DIREKTEN Sonnenlichts (`exp(−β·Luftmasse)`, auf den hellsten Kanal normiert) → färbt `sunLight`, Glitzerpfad und Wolken bei tiefer Sonne rot.

## Himmelskörper
SUN · KEPLER (Glutplanet innen, 5.3e9 m) · LEIBNIZ (R 600 km, Atmo 70 km) + Mond MONTI (Baryzentrum!) · MINZI (2.05e10) · HUYGENS (**Gasriese** mit Ring, 4.1e10, `ring:true` → `buildRingMesh(b)` als Kind des Planeten-Meshes, äquatorial montiert = spinfest; 2D-Karte malt Ring-Ellipse; Mission huygensSoi) + **3 Monde** · NEWTON (gefrorene Eiswelt, 6.9e10). `MOONS` = Meshes/Ringe, `GRAV_BODIES` = Gravitation, **`ORBIT_BODIES`** = alles mit Bahn (period/soi-Loop, AdminCam-Meshes+Bahnen, renderUniverse). Texturen prozedural: `makeBodyTexture(b)`. Neuer Körper = ~10 Stellen anfassen: MOONS/GRAV_BODIES/ORBIT_BODIES/bodyAt/BODY_BY_NAME/BODY_ICON/AdminCam-Fokus-Buttons/universeFrame/moonRings/sciBoden+sciRaum.
- **`kind`** ist die didaktische Zusatzdimension (Universum-Bildschirm, `KIND_LABEL`): `fest` · `eis` · `gas` · `stern`. Bei `gas` ist das **Spielregel, nicht Kosmetik**: `checkContact` lässt bei Kontakt mit der »Oberfläche« IMMER explodieren (kein Boden, nur immer dichteres Gas) – deshalb sind bei Huygens die MONDE die Ziele, genau wie bei Saturn. ⚠️ Newton ist bewusst **fest** geblieben: bei R 900 km ist er kein Riese, und `newtonLand` existiert seit jeher.
- **Huygens-Monde** (`HUYGENS_MOONS`, alle nach Astronom*innen): CASSINI (R 260 km, 1,41 m/s², 3,6e6 m, 8,2 h – der große Felsmond mit Dünen) · HERSCHEL (R 150 km, 0,35 m/s², 6,2e6 m, 18,6 h – **Eismond** mit Ozean unter der Kruste und Tigerstreifen wie Enceladus) · ADA (R 90 km, 0,14 m/s², 1,05e7 m, 41 h – kleiner, dunkler, gesättigt gekraterter Brocken). ⚠️ Nachgerechnet und verifiziert: alle drei liegen **außerhalb des Rings** (endet bei 2,9 R = 1,39e6 m) und weit **innerhalb der Huygens-Sphäre** (2,06e8 m); ihre SOIs überlappen sich nicht (2,56–4,64 / 5,54–6,86 / 9,99–11,01 e6 m) und sind 4–5,7 × so groß wie der jeweilige Körper, also gut umkreisbar. ⚠️ In `bodyAt` **VOR** Huygens prüfen, sonst gewinnt immer der Gasriese (dieselbe Falle wie Monti vor Leibniz). Missionen: huygensMoon → cassiniLand → herschelLand.
- ⚠️ Kosten der drei neuen Körper: `GRAV_BODIES` wächst von 7 auf 10 (+43 % Gravitationsschleife). Gemessen: **7,6 µs je `step`**, 2,54 ms je `predict` (nur bei offener Karte), 0,36 ms je `frame` – unkritisch, aber die Grenze ist damit ungefähr erreicht.

### Prozedurale Planetentexturen (`paintProceduralBody` / `BODY_PAINT`)
Alles außer Leibniz war früher gemalte Ellipsen und waagerechte Farbstreifen – daher der
»8-bit«-Eindruck. Jetzt dasselbe Rezept wie bei Leibniz, nur ohne Meer: **Höhenfeld aus FBM →
Krater ins Höhenfeld gestempelt → Schummerung aus dem Gradienten → Farbrampe.**
- ⚠️⚠️ Das Rauschen wird **in 3D auf der Einheitskugel** abgetastet (gleiche UV-Konvention wie
  bei Leibniz: `x = −cos φ·sin θ`). Nur so gibt es keine Naht an der Datumsgrenze und kein
  Gequetsche an den Polen – die beiden Dinge, die 2D-Planetentexturen sofort verraten.
- ⚠️⚠️ **Rauschen in HALBER Auflösung, Krater und Schummerung in voller.** `_tNoise` ist der
  teure Teil (gemessen 185 von 280 ms bei 1024²); Gebirge und Bänder sind viel glatter als ein
  Texel. Vierfach weniger Abtastungen, ohne sichtbaren Unterschied. Krater müssen scharf
  bleiben, die Schummerung braucht kein Rauschen und kostet fast nichts.
- ⚠️ **Alle Felder, die auch die FARBE braucht** (Mare, Lavarisse, Tigerstreifen …), werden in
  `calc` EINMAL berechnet und im Feldpuffer abgelegt. Sie im Farbdurchgang nachzurechnen hatte
  die Bauzeit glatt verdoppelt – exakt der Fehler, den die Leibniz-Textur mit `lh` schon
  einmal gemacht hat.
- ⚠️ **Schwellen für Risse/Adern liegen bei ~0,80, nicht bei 0,55.** `_pRidge` ist normiert und
  liegt im Mittel schon bei 0,53 (gemessen: 52 % der Fläche über 0,52) – mit der niedrigen
  Schwelle war der halbe Planet schwach eingefärbt statt ein paar Adern kräftig.
- ⚠️ **Keplers Kruste muss DUNKEL und grau sein.** Bei oranger Grundfarbe verschwand die
  additive Lavaglut darin: gemessen leuchteten 10 % der Fläche, zu sehen war nichts.
- ⚠️ **Krater pro KRATER rastern, nicht pro Texel alle Krater prüfen** (500 000 × 200 wären
  100 Mio. Winkelabstände). Profil = abgesenkter Boden + gaußförmiger Wall; die Schummerung
  macht daraus von allein einen beleuchteten Krater mit Schattenrand.
- ⚠️ Der Schummerungs-Gradient wird in Ost-Richtung mit `1/cos(lat)` skaliert – **gedeckelt bei
  cos = 0,35**, sonst brennen die letzten Zeilen an den Polen zu einem hellen Band aus.
- ⚠️ Gasriesen (`spec.gas`) bekommen **keine** Schummerung (Wolken werfen keine Bergschatten).
  Ihr Trick ist **Domain Warping**: der Breitengrad wird vor dem Streifen-Sinus mit Rauschen
  verschoben – ohne das ist ein Gasriese eine gestreifte Tapete.
- Auflösung nach NÄHE im Spiel: Leibniz 2048, **Monti 1024** (dort landet man), Planeten 512,
  Kleinkörper 256. Gemessen (warm, aktives Fenster): 140 ms für alle acht Planeten/Monde
  zusammen, Monti allein 69; die vier Kleinkörper 38–64 ms. Gecacht in `b._tex`, weil
  Flug-Szene UND Admin-Cam dieselben Körper aufbauen.
- ⚠️ Die Halbauflösung gilt nur über 256 px (`sub`-Schalter): bei den 256er-Karten der
  Kleinkörper bliebe ein 128×64-Rauschfeld übrig, und das sah man als grobes 2×2-Blockraster.
- ⚠️ `relief` bei Kleinkörpern **nicht über ~34**: die Schummerung ist auf 0,55–1,35 geklemmt,
  bei 56 lag halb Halley an den Anschlägen und wirkte posterisiert. Gegenprobe: Anteil
  vollständig weißer/schwarzer Texel messen – muss ≈ 0 sein.

### Kleinkörper-Meshes (`makeSmallBodyMesh`, `BODY_PAINT.astC/astM/metDust/comet`)
Vorher `IcosahedronGeometry(R,1)` (80 Flächen) mit Zufallszacken und EINFARBIGEM Material –
aus der Nähe ein grauer Diamant. Jetzt eine verbeulte Kugel mit echter Textur, gemeinsam
gebaut für Flug-Szene und Admin-Cam.
- ⚠️ **`SphereGeometry`, nicht `IcosahedronGeometry`**, obwohl der Brocken alles andere als
  rund ist: nur die Kugel hat äquirektangulare UVs, und nur damit passt `paintProceduralBody`.
- ⚠️ Die Verschiebung hängt an der NORMALISIERTEN Position, nicht am Vertex-Index: an der
  UV-Naht und an den Polen liegen mehrere Vertices auf demselben Punkt und müssen identisch
  verschoben werden, sonst reißt die Kugel auf.
- ⚠️ **`metalness` niedrig halten (Emmy: 0,20)**, auch beim Metall-Asteroiden – ohne envMap
  kürzt three.js den diffusen Anteil um (1−metalness) und lässt nur das Glanzlicht der einen
  Lichtquelle übrig: mit 0,85 wurde der Brocken dunkler und bekam einen grellen weißen Fleck.
  Metallisch wirkt er über die TEXTUR (kühles Hellgrau, Rillen, blanke Stellen).
- ⚠️ Kraterradien im WINKELMASS: bei einem 1,4-km-Brocken deckt ein 300-m-Krater 0,2 rad ab –
  hier also 0,03–0,40 statt der 0,01–0,16 der Planeten.
- ⚠️ Albedo bewusst **aufgehellt**: echte C-Typen (0,05) und Kometenkerne (0,04) sind physikalisch
  fast schwarz; ehrlich gemalt sah man auf dem Brocken gar nichts.
- `AdminCam.setFocus` dreht die Kamera jetzt auf die **Sonnenseite** (`az = atan2(−z,−x)+0,55`,
  el 0,22): Der Winkel blieb sonst vom vorherigen Körper stehen, und wer Pech hatte, landete
  auf der Nachtseite. Der Versatz lässt bewusst etwas Terminator stehen – erst der macht
  Krater plastisch.

### Komet »Whipple« (`ASTEROIDS`-Eintrag mit `ecc`, `buildCometFx`/`updateCometFx`)
Der einzige Kleinkörper auf einer **Ellipse** (a = 4,0e10, e = 0,72, 537 Tage): Perihel 11,2e9 m
(**innerhalb** der Leibniz-Bahn), Aphel 68,8e9 m (bei Newton). `asteroidPos` löst dafür die
Kepler-Gleichung `M = E − e·sin E` per Newton-Verfahren (5 Schritte). `cometActivity` ∝ 1/r²
→ 27 % der Umlaufzeit mit sichtbarem Schweif. Mission comet1, danach astAll (jetzt 4 Körper).
- **Zwei Schweife, beide von der SONNE weg** (nicht nach hinten – das ist die Pointe für die AG):
  bläulicher Ionenschweif kerzengerade im Sonnenwind, heller Staubschweif **quadratisch
  gekrümmt** nach hinten, weil träge Staubkörner die Bahngeschwindigkeit behalten.
- ⚠️ Gerendert als **Kette aus Billboard-Sprites**, nicht als Kegel-Mesh – dieselbe Lehre wie
  beim Plasmaschweif: ein Mesh hat eine harte Silhouette und sieht aus wie ein Plastiktrichter.
  Sprites stehen außerdem immer zur Kamera, also keine Orientierungsmathematik.
- ⚠️ Die Sprites sitzen **nach k^1.35 gestaffelt** (dicht am Kopf, weiter auseinander am Ende)
  und es sind **30 + 32** davon. Gleichmäßig verteilt und in kleiner Zahl war der Schweif eine
  sichtbare Perlenkette: vorne sind die Sprites klein, der Abstand aber genauso groß wie
  hinten, wo sie viermal so breit sind. Faustregel: Sprite-Breite ≳ **2 ×** Nachbarabstand.
  Die Sprites kosten fast nichts (additiv, kein Tiefenschreiben, kein Sortieren).
- ⚠️⚠️ **`AdminCam.setFocus` muss beim Kometen den SCHWEIF einrahmen.** Ein Komet ist zwei
  Objekte in einem: 1,8-km-Kern und 5 Mio. km Schweif – sechs Zehnerpotenzen auseinander. Mit
  der Normalformel `b.R*4.5` stand die Kamera **4 km** am Kern und vom Schweif war nichts zu
  sehen (so gemeldet). Jetzt: aktiv → `2,6e9 × (0,45+0,55·act)`, inaktiv → Kern.
- ⚠️ **`phase` so gewählt, dass er beim Spielstart schon INNEN ist** (Aktivität 0,70, Perihel
  in ~31 Tagen). Mit der alten Phase stand er bei t = 0 satte 62,9 Mio. km draußen: Aktivität 0,
  nächstes Perihel in 362 Spieltagen – in der Admin-Cam bei 1 min/s erst nach sechs Stunden
  Zusehen. Die Statuszeile nennt zusätzlich Aktivität, Sonnenabstand und Perihel-Countdown.
- ⚠️ Bahnlinien mit **512 statt 256 Stützstellen**: die Punkte sind gleichmäßig in der ZEIT
  verteilt, am Perihel rast er – sonst bekommt die Ellipse dort eine sichtbare Ecke.
- 2D-Karte: echte Ellipse (`mapPos` schickt den Bahnradius durch dieselbe stilisierte Skala
  `uniR` wie alle anderen) + gemalte Schweife.

### Entdeckung per Weltraumteleskop (`telescopeUp` / `bodyKnown` / `FAR_BODIES`)
In der Karriere sind Kepler, Huygens (+ Monde), Newton und ALLE Kleinkörper anfangs `???` –
Karten wie 2D-Ansicht zeigen nur einen szintillierenden Lichtpunkt. Freigeschaltet vom Part
`satT` »Weltraumteleskop »Weitblick«« (Tech `fine`, 780 🪙), ausgesetzt [N] in einem
Leibniz-Orbit mit **Pe > 250 km** → `Game.telescope`, Mission `scope1`. Didaktik: Warum steht
Hubble im All? Weil die Luft jedes Bild verwackelt. Sandbox/Tutorial sind immer offen.
⚠️ `migrateGame` schenkt Bestands-Saves die Entdeckung, wenn sie schon bei Minzi waren oder
Kleinkörper gescannt haben – sonst nimmt ein Update ihnen rückwirkend den halben Bildschirm weg.

## Raumstation »Große Pause«
`STATION` + `stationPos(t)`/`stationVel(t)`: exakter 100-km-Kreisorbit um Leibniz (on rails), immer da (Karriere/Sandbox/Tutorial). Docking: Part `dock`, Taste **[L]**: < 30 m & < 3 m/s = sofort; **30–200 m (rel < 25 m/s) = Docking-Autopilot** `autoDock`/`updateAutoDock` (RCS-Magie: Sollgeschw. min(3, d/25) auf die Station zu, dockt < 26 m via `dockNow()`; [L] bricht ab; übersteuert Handsteuerung, Warp≤2, Abbruch > 500 m). Angedockt = `Flight.docked`: Schiff folgt Station on rails (`dockOffset`). SAS-Modus `"tgt"` (ZIEL-BREMSE, < 50 km) bremst relativ zum **gewählten Ziel** (sonst Station). Türkiser ◆-Navball-Marker < 50 km (folgt `Flight.target`), HUD-Zielzeile < 400 km, Kartenmarker »Große Pause«. **Rosa ✛ = Anflug-Assistent** (drawNavball, 40 m–50 km): optimale Brennrichtung `norm(dirZiel·vWant − relVel)` mit `vWant=clamp(d/60, 2, 45)` – Nase draufhalten + Schub = automatisch lenkendes UND bremsendes Rendezvous ohne Vorbeischießen (getestet: 3 km→190 m in ~3,5 min, Ankunft 3,5 m/s). Rendezvous-Tutorial nutzt NUR noch das ✛ (keine ZIEL-BREMSE-Choreografie mehr).
- **Orbit-Ziele & Startfenster:** Auf der Rampe wählt **[Z]** Ziele durch (NUR auf der Äquator-Rampe "eq" – sonst Guard in `cycleTarget` + HUD-Hinweis; `Flight.target` via `targetList()` = Station + geparkte LEIBNIZ-Tanker; im Flug bleibt Z=Vollgas!). `nextLaunchWindow(tg)`: Rampe ist inertial fix, Fenster = Ziel bei **2π−0.52 + `padStationAngle(pad)`** (≈30° hinter der Rampe; seit der prozeduralen Küstensuche liegt die Rampe nicht mehr bei Länge 0! Verifiziert: Ziel steht beim Start auf 330,2°). `clockStr(t)` = Spieluhr ab 08:00 (HUD "Uhrzeit"). `launchWindowMiss` wird in **`stage()`** gesetzt (NICHT im step-landed-Zweig – stage() setzt landed/flew selbst!). HUD rechts: Pad = Countdown/"FENSTER OFFEN", Flug = Phasenwinkel-Tipps (voraus→niedriger fliegen, hinten→höher). `canWarp`: auf der Rampe (landed) voller Warp. Tutorial id "launchwindow" (Start→Fenster→Orbit→Phase→Autopilot-Docking).

## Startrampen
`PADS`: lmg (LMG-Startplatz, 55° N, **max 25 t**) · eq (Raumhafen »Schulhof Süd«, Äquator, ∞, Tech padEq) · polar (Polarstation »Skihütte«, 86° N, ∞, Tech padPolar). Der **Breitengrad ist Didaktik und steht fest**, den **Längengrad sucht `_padLonAt(lat)` beim Laden** – dort, wo das prozedurale Terrain wirklich eine Küste hat (Land im Westen, offenes Meer im Osten, Ufer ~1,5 km östlich der Rampe). Kriterien gestaffelt gelockert, weil am 86°-Breitenkreis der ganze Umfang nur ~260 km lang ist; zusätzlich muss die Küste über ±10 km Nord in einem Band bleiben, sonst steht die Rampe auf einer Landzunge und die Bodenszene sieht chaotisch aus. ⚠️ Die Suche MUSS `TERRAIN_OCT_LOCAL` benutzen (wie die Bodenszene) – mit den groben Textur-Oktaven verschiebt sich die Küste um hunderte Meter und die Rampe landet im Wasser. `padStationAngle(p) = −lon` ist der Rampenwinkel in der Stationsebene (steigende Länge läuft nach WESTEN!) und geht in `nextLaunchWindow` ein. **Breitengrad = echte Physik:** Ost-Start → Inklination = Breitengrad (verifiziert: 55,0°), `Flight.orbitInc()` (0–90° via |h.y|/|h|, HUD-Zeile "Inklination"). `Flight.start(vessel, padId?)`: Default `currentPad()`, Tutorials übergeben `t.scenario.pad || "eq"`, `revert()` behält die Rampe; baut `buildPad(kind)`-Mesh + Pad-Anker aus `padDir(pad)` jedes Mal neu (up/east/north generisch aus Kreuzprodukten), Boden polar = weiß. Startfenster/[Z] nur bei lat 0. Massenlimit prüft `UI.launch` via `VAB.totalMass()`; Rampen-Wähler oben im VAB-Info-Panel (`VAB.setPad`, `Game.pad` im Save). Tech-Ast: padEq (35, basic+struct) → padPolar (70, +heavy). Missionen: padEq1 (`s.pad==="eq"` + Orbit) & polar1 (`s.satPolar` – Sat aussetzen bei inc > 75°, gesetzt in deploySat/deploySpecialSat). `migrateGame`: `Game.pad` Default "lmg"; Saves mit erledigtem dock1 kriegen padEq GRATIS (die starteten de facto vom Äquator – sonst wird die Stations-Kette rückwirkend unfair).
### Optik der Rampen (`padTextures()` + Instanz-Sammler in `buildPad`)
Die Rampen waren ~30 **einfarbige** Boxen und Zylinder – kein einziges Texel. Genau das war
der »90er-Jahre«-Eindruck; die Montagehalle sah nur deshalb besser aus, weil sie prozedurale
Kacheln hat. Dieselbe Rezeptur jetzt hier, gecacht in `_padTex`:
`concreteTex(rx,ry)` (Beton mit Fugen/Flecken/Rissen; **Canvas geteilt**, zwei Texturen für
Plattform 8×8 und Crawlerway 30×3), `makeScorchTex` (Brandfleck), `makePadWallTex` +
`makePadWindowTex` (Trapezblech mit Fensterband / nachts leuchtende Fenster),
`makeBeamTex`, `makePadPuffTex`, `makeHazardTex`.
- ⚠️ **Kleinkram in ZWEI InstancedMeshes** (`box()`/`cyl()`-Sammler wie in der Halle, Flush am
  Ende von `buildPad`). Gitterturm, Geländer, Zaun, Kabelpritschen, Treppen, Rohre wären
  einzeln ~300 Draw-Calls. `strut(x1,y1,z1,x2,y2,z2,r,col)` legt einen Zylinder ZWISCHEN zwei
  Punkte – ⚠️ mit geratenen Euler-Winkeln stehen Abspannseile schief, das braucht
  `setFromUnitVectors`.
- ⚠️ Im Polar-Zweig heißt die Container-Variable `cont`, **nicht `box`** – so heißt der Sammler.
- **Gitterturm statt roter Kiste** (`lattice()`): 4 Eckstiele + Etagenrahmen + Kreuzverbände
  mit etagenweise wechselnder Neigung. Ein echter Turm ist Luft mit Stahl drin, und die
  Silhouette gegen den Himmel macht den Unterschied.
- **Brandfleck.** ⚠️ Der Radialverlauf muss LANGE hoch bleiben: Die Mitte verdeckt die Rakete,
  sichtbar ist der Ring DANEBEN. Gemessen: 26 782 abgedunkelte Pixel gegen 787 ohne.
  ⚠️ Diagnose-Falle: `material.color` MULTIPLIZIERT mit der fast schwarzen Textur – ein
  Test mit `color = rot` zeigt deshalb kein Rot und sieht wie »rendert gar nicht« aus.
- **Versorgungsarm** (`name:"padArm"`, Drehgelenk) schwenkt bei der Zündung weg
  (`Flight.updatePad`, 0 → 1,5 rad). ⚠️ `_padArm`/`_armFold` in `start()` zurücksetzen – die
  Rampe wird pro Start NEU gebaut, der Verweis zeigt sonst auf das alte Mesh.
- **LOX-Abdampf**: 8 Sprites (`g.userData.vents`), steigen auf und treiben nach Osten weg;
  nur `landed && alt < 400`.
- **Nacht** (`g.userData.night` = [{mat,max}], `nightF` aus `dayLight` in `updatePad`):
  Fensterbänder, Lampenlinsen, Lichtpfützen. ⚠️ **KEIN volumetrischer Lichtkegel** – ein
  additiver Kegel ohne Streuungs-Shader behält seine harte Silhouette, liest sich als weißer
  Keil und füllt den Bildschirm, sobald die Kamera hineinfährt. Was ein Flutlicht nachts
  ausmacht, ist die Lichtpfütze am Boden plus das Glühen der Lampe. ⚠️ Die leuchtende Linse
  gehört VOR das Gehäuse, sonst sieht man einen schwarzen Kasten im eigenen Lichthof.
- **Menschlicher Maßstab**: drei `buildAstronaut()`-Figuren (Skalierung 2,4 wie in der Halle)
  am Rand der Sperrzone. Erst daneben sieht man, wie groß die Rakete ist.
- ⚠️ **Die Plattform ist mit dem Boden BÜNDIG** (Oberkante y = 0, damit die Rakete bei
  |pos| = R aufsetzt). Eine Treppe hatte hier nichts zu überwinden und stieg ins Leere –
  jetzt eine flache Betonschürze. Kabelpritschen laufen NEBEN der Rampe nach Westen, nicht
  quer übers Deck (dort schnitten sie durch Warnstreifen und Geländer).
- **Küste:** ALLE Rampen liegen am Meer – `Flight.groundGroup` (Basis **X=Ost/Y=hoch/Z=SÜD** via `makeBasis`; ⚠️ {Ost,hoch,Nord} wäre LINKSHÄNDIG = Spiegelmatrix → setFromRotationMatrix kippt die Rampe! Gilt auch für `padGroup`; Mesh-Koordinaten: +Z=Süd, LZ bei z=−260, Mechazilla bei z=+34) enthält `groundPlane` (Land), `groundBeach` (Sand ab ~1 km Ost), `groundSea` (Ozean ab ~1,5 km Ost – Küste liegt bewusst NAH an den Rampen, Meerblick!) und `seaPatch`. Baum-Sperrzone Richtung Strand: ex < 700. ⚠️ Der Sand wird unter Wasser weggeschnitten (`beachClipU`) und der Seegrund abgesenkt – warum, steht im Ozean-Abschnitt unter »Fünfte Flimmer-Ursache«.
- **⚠️ Die Bodenszene folgt dem SCHIFF, nicht der Rampe** (`Flight.reanchorGround(dir, key)`). Vorher hing sie starr am Startplatz: wer nach einem Wiedereintritt 1000 km entfernt wasserte, sah nur die nackte Planetenkugel – ein flaches türkises Nichts. `frame()` verankert neu, sobald der Bodenpunkt weiter als `max(700, min(12000, alt·0,30))` vom Anker weg ist und alt < 22 km. Drei Ausprägungen (`Flight.groundMode`), aus `landH` bestimmt:
  - ⚠️⚠️ **Die Schwelle MUSS mit der Höhe schrumpfen** – das war die zweite Hälfte des »Bellyflop crasht je nach Landeplatz«-Bugs. `shapeTerrain` legt den ANKER auf y = 0 und zeichnet alles Relief relativ dazu; Physik und Autopiloten messen dagegen die Höhe über der KUGEL. Beides stimmt nur überein, solange der Anker unter dem Schiff sitzt. Mit den alten festen 12 km lag er in hügeligem Gelände im Median **220 m**, im 90. Perzentil **700 m**, im Extremfall **2 km** daneben (gemessen über 300 Zufallspaare auf Land mit Relief). Worst Case verifiziert: Anker im Tal (604 m), Schiff 11 km weiter auf einem Grat (2350 m) → das Starship tauchte schon bei **1743 m** in den sichtbaren Hang, der Flip zündete planmäßig erst bei 240 m über der Kugel = **1,5 km im Berg**. Genau das sah wie »Landing Burn zu spät« aus. Mit 30 % der Höhe ist der Anker unter 3 km Höhe immer näher als 900 m, also **innerhalb der ebenen Zone von `shapeTerrain`** – der sichtbare Boden unter dem Schiff liegt dann exakt auf der Kugel (Raycast gegen das echte Mesh: 243 m bei HUD-Höhe 240 m, vorher 0 Treffer = Schiff unter der Oberfläche).
  - Kosten der engeren Schwelle: 5 statt 2 Neu-Verankerungen pro Wiedereintritt, **31 ms für den ganzen Abstieg** (Binnenland ~4 ms pro Stück, offener Ozean ~0). Der teure Fall ist die Küste (~40 ms, Küstentabelle) – aber dort geht `terrainH` ohnehin gegen 0, weil Berge mit dem Abstand vom Ufer wachsen. Der Fehler war also genau dort groß, wo das Nachführen billig ist.
  - `"coast"` – Küste in ±26 km: Layout wie an der Rampe. ⚠️ Die Basis wird so gedreht, dass **Osten seewärts** zeigt (aus dem Terrain-Gradienten) – nur dann ist die Uferlinie eine Funktion von Nord und die Tabellen-Parametrisierung überhaupt gültig. An der Rampe (`key` beginnt mit `"pad:"`) bleibt die geografische Basis stehen, das garantiert schon die Längengrad-Suche.
  - `"opensea"` – offener Ozean: `groundSea` wird zur schlichten 85-km-Scheibe **um den Anker**, `seaPatch` mittig unters Schiff, `uOrigin` = (0,0), Uniform `uOpenSea = 1` (dShore konstant 20 km → keine Brandung, kein Flachwasser). Wiese/Strand/Bäume aus.
  - `"inland"` – Binnenland: nur Wiese, Meer aus.
  - Kosten gemessen: offener Ozean **0–2 ms** (keine Küstentabelle – das ist der häufige Fall beim Abstieg), Küste 38–71 ms (dort ist man beim Landen langsam).
  - ⚠️ **Pad-Frame und Boden-Frame sind getrennt:** `padEastV/padNorthV/padUpV/padLocal` bleiben an der RAMPE (Landing Zone, Mechazilla, Startfenster, Booster-Autopilot), `gEast/gNorth/gUp/groundLocal` gehören zum Anker (Ozean- und Wolken-Uniforms, `groundSunDir`, `fillLight`, `_padQInv`).
  - ⚠️ Das Booster-Wasser-Urteil und die Droneship-Position nutzen deshalb **`landH` direkt statt `shoreDist`** – die Küstentabelle gehört zum Anker, der beim Booster-Abstieg längst dem Schiff hinterhergewandert sein kann.
- **Küstenlinie aus dem Terrain:** `buildShoreTable(key, up, east, north)` tastet für 1024 Nord-Stützstellen (±42 km, ~82 m Raster) die Nullstelle von `landH` ostwärts ab (Klammer ±26 km) → `SHORE.wob/beach` (+ 16-Bit-DataTexture `SHORE.tex` für den Shader). Gecacht pro `key`. Verifiziert: `landH` an der Wasserkante ≈ 1e-5, Geometrie vs. Shader < 2 mm.
  - ⚠️ Gespeichert wird der **radiale Versatz zur Meeres-Scheibe** (`wob(n) = |SEA_C − Ufer| − SEA_R`), nicht die Ost-Koordinate. Diese Parametrisierung ist exakt (jedes Ost < 42500 darstellbar) und lässt `wobbleRim` und `dShore` unverändert. **Jede Scheibe hat ihren EIGENEN Mittelpunkt** – Meer (42500, r 41000), Strand (41000, r 40000); mit dem falschen stimmt die Kante nur bei Nord = 0.
  - ⚠️ Die Nullstellensuche muss den Übergang nehmen, der der **Nachbarzeile am nächsten** liegt (erst fein rastern, alle sammeln, dann den nächstgelegenen). Eine simple Bisektion über ein Fenster mit mehreren Nullstellen springt zwischen ihnen → dünne Zacken in der Küste.
  - ⚠️ **Änderungsrate auf 300 m/Zeile begrenzt** (`SLEW`): weit draußen dreht die echte Küste nach OSTEN und ist dann keine Funktion von Nord mehr – ohne Bremse knickt die Tabelle rechtwinklig weg. Nahe der Rampe greift sie nie.
  - `shoreDist(east,north)` ist die JS-Kopie von `dShore` im Shader (Brandung, Flachwasser, Abtauchen unter den Strand) und entscheidet auch über »gewassert« UND über die Droneship-Position (die schiebt sich ostwärts, bis sie wirklich auf See liegt – »6 km Ost« ist bei Buchten nicht mehr automatisch Wasser).
  - `SHORE_GLSL` dekodiert die Textur mit **handgeschriebener linearer Interpolation** (NearestFilter, 16 Bit aus R/G). Bewusst keine Float-Textur: die braucht Extensions, die auf Schulrechnern fehlen können.
  - `wobbleRim(geo,R,wob,extra)` verschiebt die Randscheitel einer CircleGeometry radial. ⚠️ **4000 Segmente**, nicht 1200: bei r = 40 km sind das 63 m Scheitelabstand ≈ 8 Stützstellen auf die kürzeste Wobble-Welle (520 m) – mit 1200 sieht die Küste facettiert aus. ⚠️ Die Wobble-Phase hängt von der VERSCHOBENEN Nord-Koordinate ab (so liest sie der Shader), deshalb **Fixpunkt-Iteration** `s = (R + wob(y·s) + extra)/r`; naiv mit dem alten `y` gerechnet driften Geometrie und Shader-Uferlinie am fernen Rand um > 120 m auseinander. Kontraktion dort nur ~0,8/Schritt → 24 Iterationen.
  - Der Fern-Meer-Rand liegt **30 m seewärts** der Uferlinie (`extra:-30`); die eigentliche Wasserkante zeichnet allein der fein aufgelöste `seaPatch`.
- **Boden-Optik (bewusst ~gratis):** `makeGroundTexture("grass"/"sand"/"sea")` – einmalige 256er-Canvas-Kacheln (RepeatWrapping, repeat 220/220/130, anisotropy 4), **fast weiß gemalt, damit `material.color` sie tönt** → Polar-Umschalter braucht keine eigenen Texturen; Formen 3×3 versetzt zeichnen = nahtlos (⚠️ Zufallsparameter EINMAL würfeln, dann an 9 Offsets zeichnen). Flachwasser-Verlauf und Brandungslinie macht seit dem Ozean-Rewrite der Shader (kein `shallowRings`/`groundFoam` mehr).

### Ozean (Rewrite nach github.com/achrefelouafi/WaterThreeJS)
**EIN Shader, zwei Meshes** – `oceanVertex(patch)` + `OCEAN_FRAGMENT` (custom `ShaderMaterial`, Uniforms `Flight.oceanU`):
- `groundSea` = flache Scheibe r 41 km @ (42500, 4, 0), Wellen nur in der Normale.
- `seaPatch` = PlaneGeometry 5000×7200 (218×314 ≈ 23-m-Quads, `frustumCulled=false`), Ost 0,9–5,9 km (reicht bewusst weit nach Westen: die schwingende Uferlinie soll KOMPLETT vom Patch gezeichnet werden), **gleiche Basisebene y=4** – der Hub kommt aus `uLift` (= `swellLift()` ≥ Σ verschobener Amplituden, sonst blitzt in Wellentälern das flache Fern-Meer durch; aktuell 8,33 m bei 7,60 m verschobener Amplitude = 1,08 m Trog-Reserve).
- ⚠️ Die Fade-Zone der Geometrie-Hüllkurve `E` ist **> 1 km lang** (x 1150→2480, y 2280→3580): über sie sinkt `uLift` auf 0 und die Wellen laufen aus, bis der Patch exakt auf der Fern-Meer-Ebene liegt. Kurze Fades (vorher 780 m) zeigen eine sichtbare Kante im Bild.
- ⚠️ **In den GLSL-Template-Literalen NIEMALS Backticks benutzen** (auch nicht in Kommentaren) – sie beenden das JS-Template-Literal und die ganze Datei parst nicht mehr (Symptom: `UI is not defined`, weißer Bildschirm).
- Beide werten `uSwell` über **denselben Ost/Nord-Koordinaten** (`vXw = uOrigin + position.xy`) aus → der Übergang ist unsichtbar. `vFade` (Flachwasser) ist in beiden IDENTISCH; die Patch-Ränder faden nur die GEOMETRIE (`E`), nicht die Schattierung.
- ⚠️ **Objektraum, niemals worldPosition**: das Meer hängt über den Floating Origin an einer ~1e10-Matrix. Objektraum = (x=Ost, y=Nord, z=hoch); Kamera kommt als `uEye` rein (CPU, Float64).
- Physik im Fragment: `OCEAN_WAVES`=8 Gerstner-Wellen (λ 22–434 m, Dispersion ω=√(g·k), **Steilheit k·A ≈ 4,5 % statt fester Gesamt-Amplitude** – sonst ist die lange Dünung < 1° geneigt und das Meer sieht aus wie Tapete; ΣA ≈ 8,4 m) + 3 Detail-Kaskaden derselben Normalmap in 62/17/4,6 m mit **je eigener Drehung** (dreimal gleich orientiert = »Cordhosen«-Streifen). Richtungsstreuung **±55°**: die Wellenzüge kreuzen sich und erzeugen wandernde Buckel statt paralleler Rillen. Schaum/SSS-Schwellen laufen über `uAmpSum` (= ΣA), sind also amplituden-unabhängig – Steilheit ändern erfordert kein Nachjustieren.
- **Geometrie-LOD im Vertex:** nur Wellen ab λ ≈ 85 m werden wirklich verschoben (`smoothstep(55,85,λ)` ≈ 3,7 Stützstellen bei 23-m-Quads), der Rest wirkt ausschließlich über die Fragment-Normale. `swellLift()` muss dieselbe Schwelle benutzen, sonst stimmt die Trog-Reserve nicht. Schlick-Fresnel F0=0.02, Beer-Lambert-Tiefenfarbe (türkise Flachwasserzone), GGX-Sonnenglitzer mit **weicher Sättigung** `D/(1+0.30·D)` (harter Clamp brennt ohne HDR kreidig-weiß aus), SSS an den Kämmen, Schaum aus Kammhöhe×Steilheit + animierte Brandungslinie, Luftperspektive `1−e^(−d·uHaze)` (beim Blick nach unten reduziert).
- **Blick von UNTEN** (`!gl_FrontFacing` im Fragment, Material ist `DoubleSide`): flach = Totalreflexion (dunkel), steil nach oben = Snells Fenster. ⚠️ Ohne das ist der Ozean von unten weggecullt und die **Planetenkugel scheint durch** – genau das »alles nur türkis«-Symptom, sobald die Kamera unter die Wasserlinie taucht. Dazu kommt ein Tiefen-Overlay auf dem `#lensflare`-Canvas (Trübung + Farbstich, Lens-Flare aus).
- **`Flight.seaHeight(ost,nord)`** spiegelt die Höhenrechnung des Vertex-Shaders in JS (gleiche Wellensumme, gleiche Hüllkurve, gleicher Hub) – Grundlage für Unterwasser-Test UND Gischt. `isWaterAt()` sagt, ob dort überhaupt Wasser ist; `toGround()` rechnet Szenenpunkte ins Anker-System.
- **Gischt (`Flight.waterFx`)**: `SPLASH` beim Durchstoßen der Oberfläche (Menge/Wucht ∝ Sinkgeschwindigkeit, einmalig über `_wasUnder`) und `STRAHL` – ein brennendes Triebwerk < 80 m überm Wasser reißt einen Sprühring hoch (Intensität **quadratisch** mit der Nähe, dicht überm Wasser also schlagartig heftig). Nutzt den normalen Partikel-Pool, nur weiß/türkis getönt. ⚠️ Der Szenen-Ursprung ist das SCHIFF: die Partikelhöhe muss um `g.up` versetzt werden, sonst entsteht die Gischt auf Raketenhöhe statt an der Oberfläche.
- ⚠️⚠️ **Die drei Anti-Flimmer-Regeln** (das war die ganze Arbeit am alten »Maschendraht«-Moiré):
  1. **Wellen-LOD**: jede Welle/Kaskade wird ausgeblendet, sobald ihre Wellenlänge unter den Pixel-Fußabdruck `fp` fällt; die verlorene Steigungs-VARIANZ wandert in die Rauheit (`varLost` → `rough`). Analytisches Mipmapping.
  2. **Sicherheitsfaktor 3 auf `fp`**: das Glanzlicht ist stark NICHTLINEAR und erzeugt Oberwellen – reines Nyquist (2 px/Welle) flimmert weiter, erst ab ~7 px ist Ruhe.
  3. **`makeSeaNormalTexture().anisotropy = 2` (NICHT 16!)**: anisotrope Filterung holt entlang der Blickachse Sub-Pixel-Normalen zurück, die das Specular als regelmäßiges Gitter aliasen. Bei Normalmaps ist Weichzeichnen richtig. Spektrum der Kachel: amp ∝ λ^1.8 (viel Energie in den LANGEN Komponenten).
  4. `fp` wird aus `vFlat` (UNverschobene Ebene) gerechnet – aus der verschobenen springt es an jeder Quad-Kante und das Patch-Gitter wird sichtbar.
- ⚠️⚠️ **Fünfte Flimmer-Ursache, aber KEIN Shader-Problem: Tiefenstreit Strand ↔ Fern-Meer.** Symptom: aus 10–20 km Höhe „grieselt" die Wasserfläche und das Muster wandert beim Kameraschwenk. Ursache: `groundBeach` (y=2) und `groundSea` (y=4) sind zwei fast deckungsgleiche 40-km-**Fächer**scheiben (`CircleGeometry`, 4000 Segmente = bis zu 40 km lange Dreiecke) – so grob interpoliert trennt der Log-Z-Puffer 2 m Höhenunterschied nicht mehr.
  - Gemessen (16 km Höhe, Blick auf die Küste, Hochfrequenz-Rauschen im Bild): `depthTest` des Meeres aus → Artefakt weg (⇒ Tiefe, nicht Optik) · erst **~100 m** Höhenabstand beruhigen es · **`polygonOffset` wirkt GAR NICHT**, weil three bei Log-Z `gl_FragDepth` schreibt und die GPU den Offset dann ignoriert · das fein tesselierte Terrain daneben zickt NICHT ⇒ es sind wirklich die Riesendreiecke.
  - Lösung zweiteilig: (1) `beachClipU` / `BEACH_CLIP` = 60 – der Sand wird im Fragment-Shader ab 60 m **seewärts der Wasserkante verworfen** (`onBeforeCompile` + `SHORE_GLSL`, Uniform ist zugleich der Saum in Metern, 0 = aus; nur im `"coast"`-Modus aktiv). Unter dem opaken Meer war er ohnehin unsichtbar, jetzt spart es zusätzlich Füllrate. (2) `shapeTerrain` **senkt den Seegrund um 120 m ab** (`smoothstep(shoreDist, 40, 600)`) – ebenfalls unsichtbar, beendet aber denselben Streit zwischen Terrain und Meeresscheibe.
  - Ergebnis: Rauschmaß **19,99 → 3,12** (Untergrenze der Szene 1,35), sichtbarer Strand ändert sich um 0,6 %, von der Rampe und aus 3 km Höhe pixelidentisch.
- ⚠️ **uTime-Wrap bei `OCEAN_T`=1200 s ist exakt nahtlos**: `makeSwellWaves()` rundet k so, dass ω=√(g·k) ein ganzzahliges Vielfaches von 2π/T ist, alle Kaskaden-Drifts sind n/T, die Brandungsfrequenz ist 286·2π/T. Ohne das springt das Meer bei Zeitraffer auf der Rampe im Sekundentakt.
- Polar-Tönung über `uDeepCol`/`uShallowCol`/`uChop` + `seaHorizonBase` in `start()`. 60 fps, 1 Draw-Call pro Mesh, ~75k Dreiecke Patch.
- Wald: `treeTrunks`/`treeCrowns` = 2 InstancedMeshes (max. 420), platziert von `Flight.placeTrees` nach `forestMask` – s. »Bodenszene« oben. ⚠️ `count = placed` setzen, sonst stehen Identity-Matrix-Bäume auf der Rampe!

### Wolken (Ansatz wie github.com/leoawen/volumetric_cloud_atmosphere_scattering)
Das Repo raymarcht 3D-Texturen mit TAA und God Rays – für Schulrechner zu teuer. Übernommen ist die PHYSIK (HG-Phase, Beer-Lambert, Powder), gerendert wird als **Impostor-Puffs in EINEM Draw-Call**: `Flight.cloudField` = InstancedMesh mit 40 Wolken à **14** Puffs, Attribute `iPos`/`iParam` (Größe, UV-Drehung, Höhe in der Wolke)/`iCloud` (Versatz zum Wolkenmittelpunkt + Wolkenradius); Billboard-Ausrichtung im Vertex über `uCamRight/uCamUp`. Hängt in `Flight.cloudGroup` (Position = `lp+padLocal`, Quaternion = `padQ`, also **Objektraum x=Ost, y=hoch, z=Süd** – Achtung, anders als beim Meer!).
- Optik im Fragment (`CLOUD_FRAG`): Beer-Lambert `1−e^(−σd)`, **Powder-Effekt** `1−e^(−2σd)` (dunkle Kerne, helle Ränder), **Henyey-Greenstein g=0,62** → Silberrand gegen die Sonne, **Impostor-Normale** (Scheibe als Kugel `n_z=√(1−r²)`, mit dem Dichte-Gradienten aus RG der Textur verbeult = Blumenkohl). Beleuchtung: Sonne (Extinktion fast farbneutral!) + Himmelslicht von oben + Bodenlicht von unten; Schattenseiten werden über den `uSkyCol`-Term blau, NICHT über die Extinktion (sonst braune Wolken).
- ⚠️ **Selbstbeschattung auf WOLKEN-Ebene** (`vOfs` aus `iCloud`): Ohne sie wird jeder Puff für sich beleuchtet, alle sehen gleich aus und die Wolke wirkt wie ein Haufen Wattebäusche. Wie tief ein Puff im Wolkenkörper sitzt, sagt seine Lage relativ zum Wolkenmittelpunkt – das ist die Licht-Marschierung eines Raymarchers, nur pro Puff statt pro Sample. 14 statt 8 Puffs, weil die Silhouette erst durchs Überlappen vieler Kugeln entsteht.
- ⚠️ **`uSunI` NICHT an `dayLight` koppeln!** Wolken hängen 1,3–9 km hoch und stehen noch in voller Sonne, wenn es am Boden längst dämmert – GENAU deshalb glühen Wolken beim Sonnenuntergang orange. Mit `dayLight` (bei 0° Sonnenhöhe nur noch 0,12) waren sie stattdessen matschig braun. Also allein `smoothstep(sz, −0.16, 0.02)`. Farbe aus `sunTint` (s. Himmel-Abschnitt).
- `makeCloudPuffTexture()` = 128er-Canvas: A = radialer Abfall × Billow-Turbulenz (|2n−1|, 4 Oktaven Wertrauschen), RG = Dichte-Gradient.
- Sichtbar < 34 km, `uFade` blendet ab 22 km aus. Tiefe Haufenwolken 1,3–2,8 km (75 %), hohe 5,5–9,3 km.
- `makeCloudTexture()` (Wolkendecke des Planeten aus dem Orbit) ist ebenfalls FBM statt gemalter Ellipsen, mit Zonen-Maske über den Breitengrad; Schwelle 0.455/0.17 lässt bewusst Kontinente durchschauen.

### Sonnenstand & Licht bodennah
- ⚠️ `Flight.groundSunDir`: Die Rampen liegen **inertial fest** – ein echter Sonnen-"Tag" über dem Startplatz dauert deshalb ein Leibniz-JAHR (9,2e6 s), und die ECHTE Sonne stand beim Start unter dem Horizont (das Licht kam von UNTEN durch den Planeten, die ganze Bodenszene war reines Ambient-Grau, ohne Glitzern auf dem Meer und ohne Sonnenseite an den Wolken). Deshalb geht die Sonne nach der **Spieluhr** auf und unter: `φ = 2π(dayFrac−0.25)`, `clockSun = padEast·cos φ + padUp·sin φ + padNorth·0,18` → Osten auf, mittags Zenit, Westen unter.
- ⚠️ **Basis ist der FESTE Rampen-Frame `padEastV/padUpV/padNorthV`, NICHT der mitwandernde Boden-Anker `gEast/gUp/gNorth`** – sonst springt die Sonne bei jedem `reanchorGround` ein Stück weiter.
- ⚠️⚠️ **Die Uhr-Sonne gilt im GANZEN Leibniz-Raum, nicht nur bodennah.** Auf die echte Richtung (`−pos`) wird erst weit draußen geblendet: `SUN_CLOCK_R0/R1` (Leibniz-Abstand 2000 → 8000 km Höhe), Zwischenwert `Flight.sunBlend` per **Slerp** (kein lerp+normalize – bei ~180° Trennung springt der sonst) und **ratenbegrenzt auf `SUN_SLEW` = 0,05 rad pro ECHTER Sekunde**, also auch bei Warp 100.000 nie hektisch. Reset `sunBlend = null` in `start()` (erster Frame setzt ihn passend – Tutorials im Monti-Orbit drehen nicht erst herüber).
  - ⚠️ **Genau das war der »Sonne rast im Zeitraffer über den Horizont«-Bug:** Früher wurde zwischen 0 und 40 km Höhe von der Uhr-Sonne auf die echte geblendet – dazwischen liegen bis zu 180° (an der LMG-Rampe um 08:00 **gemessene 128°**), die die Sonne in der knappen Minute Aufstieg durchlief (beim Wiedereintritt rückwärts). Jetzt bleibt sie beim Verlassen der Atmosphäre einfach stehen. Verifiziert: Aufstieg 0 → 1200 km bewegt sie nur um die 8°, die die Spieluhr in 2000 s wirklich weiterläuft; Abstieg 100 km → Boden max. 0,09° pro Sample.
- `Flight.dayLight = 1 − gb·(1−dayL)` mit `gb = 1−alt/40 km` (im Orbit IMMER 1) und `dayL = clamp(czDay·1,7+0,12)`. ⚠️ **`czDay` ist die Sonnenhöhe über dem SCHIFF** (`groundSunDir·(pos−leibnizPos)`), nicht über dem Boden-Anker: der springt bei 22 km unters Schiff und würde die Helligkeit mitreißen. Folge (gewollt, ehrliche Physik): Leibniz hat eine echte **Nachtseite** – wer eine Viertelbahn von der Rampe entfernt landet, landet ggf. im Dunkeln. Weicher machen ginge über die `dayL`-Untergrenze.
- ⚠️⚠️ **ALLE drei Sonnen-Darstellungen müssen zusammen umziehen: Mesh, Glow, Lens-Flare.** `Flight.sunMesh` blieb im Weltursprung stehen, während Glow und Flare am Spieluhr-Stand leuchteten – man sah **zwei Sonnen** (Symptom im Bug-Report: großer Flare oben links + kleine gelbe Scheibe daneben). `sunMesh.position` = `sunGlow.position`.
- ⚠️⚠️ …aber **NUR in der Flugansicht!** In der KARTE ist die Sonne das Zentrum des Sonnensystems, alle Bahnellipsen laufen um sie herum – dort MUSS sie im Weltursprung stehen (`sunScenePos = −pos`). Sonst wandert sie sichtbar zwischen den Bahnen umher, während der gemeinsame Mittelpunkt leer bleibt. Der Bug trat nur bei geöffneter Karte UNTER 40 km auf (darüber ist `gb = 0` und der Spieluhr-Versatz ohnehin null) – also z. B. mitten im Tutorial »Dein erster Start«. Verifiziert: Karte 0 m Abweichung vom Zentrum, Flugansicht bei 19 km 2,1e10 m Versatz (gewollt), Orbit 200 km wieder 0.
- ⚠️ **Die SICHTBARE Sonne muss dort stehen, wo ihr LICHT herkommt.** `Flight.sunScenePos` = `groundSunDir · |pos|` (Szenen-Koordinaten, Schiff = Ursprung); daraus folgt `sunGlow.position = sunScenePos + pos` (Szene → world-lokal, denn `world.position = −pos`) und `drawLensflare` projiziert dieselbe Stelle. Vorher hingen Glow und Flare am Weltursprung = echte Sonne, die bodennah UNTER dem Horizont stand → man sah bis 40 km Höhe überhaupt keine Sonne, obwohl sie schien. Im All (gb=0) ist `groundSunDir = sunReal`, also `sunScenePos + pos = 0` → exakt der Weltursprung wie vorher (verifiziert: 0,0 m Abweichung im Orbit). Sonnenauf-/untergang getestet: 6:00 Horizont Ost, 12:00 Zenit, 19:00 unter dem Horizont West.
- Deshalb neu ausbalanciert: `ambLight.intensity = 0.55 − 0.25·gb·dayLight − 0.40·gb·(1−dayLight)` (Tag 0,30: vorher +0.5 → Strand/Wiese brannten aus, seit die Sonne wirklich scheint · Nacht 0,15: sonst leuchten Strand und Wiese unter sternenklarem Nachthimmel weiter wie am Mittag, was mit der sichtbaren Sonne erst richtig auffiel; Restlicht ist kühl, weil die Farbe bei dayLight→0 auf `ambSpace` zurückfällt) plus `Flight.fillLight` (kühles Himmels-Fülllicht aus der Gegenrichtung, `0.42·gb·dayLight`, im All 0) – ohne das wäre die sonnenabgewandte Raketenseite fast schwarz.
- (`sunWarmth(sunUp)` steht noch in der Datei, wird aber **nirgends mehr aufgerufen** – die Sonnenlichtfarbe kommt seit dem Himmels-Rewrite aus `sunTint(czSun)`. Nicht wieder anschließen, sonst gibt es zwei Quellen.)
- Himmelsfarbe: **Höhe quadratisch, Tageszeit linear** (`f·f·dayLight`). Vorher war beides gemeinsam quadriert – dann ist der Himmel schon um 16 Uhr nachtschwarz, während Boden, Meer und Wolken noch in der Sonne stehen.
- ⚠️ `Flight.setViewUniforms(cam, h)` setzt die kamera-abhängigen Uniforms von Meer & Wolken (`uEye`, `uPixel`, `uCamRight/Up`) und **muss direkt vor JEDEM render() mit der jeweiligen Kamera laufen** – die Booster-PiP rendert dieselbe Szene aus einer anderen Perspektive.

## Booster-Landeplätze (RTLS / Droneship / Mechazilla-Catch)
- **Tech-Kette:** reuse → landZone (40, Landing-Zone-Plattform »LZ-1« an JEDER Rampe, in `buildPad` bei lokal (10,0,260)) → droneship (60). `Game.boosterSite` ("rtls"/"ship", VAB-Wähler »Booster-Landeplatz« erscheint bei Gitterflossen im Stack, `VAB.setBoosterSite`), `Flight.boosterSiteEff()` = rtls/ship/null. **Bergungswert:** LZ 100 % · Droneship 90 % · Gelände 60 % · Wasserung 50 % (ohne Forschung wassert der Booster downrange – reuse1 bleibt erfüllbar!). Missionen lz1 (`s.lzLanded`) → ship1 (`s.shipLanded`), catch1 (`s.caught`, req reuse1). Orange Tankmarke rutscht bei RTLS auf 30 % (Boostback braucht Sprit). ⚠️ Tutorial "booster" hat deshalb 2× tankL in Stufe 1 + Ziel 10 km (getestet: 12 km bei 37 % – die alte 1-Tank-Version lief vor der Marke leer).
- **Autopilot-Zustände:** flip → **boostback** (nur rtls/catch, Sprit > 22 %: brennt horizontal, bis `predictImpactRel(b,tt)` (grobe ballistische Vorhersage im Leibniz-Frame, cdA≈13) < 350/800 m am Ziel) → coast (Droneship positioniert sich beim ERSTEN Impact-Predict auf See, min. 6 km Ost; Gitterflossen-»Lift« zieht die Bahn zum Ziel; **< 8 km: direkte Quergeschwindigkeits-Regelung** `vLat = err/tGo`, cap 45 m/s / 6 m/s² – die Prediction allein streut bei Warp zu sehr!) → burn (Hoverslam relativ zu `b.catchAlt`, Ziel-Kipp + Schubvektor-Lateral-Regler < 2,5 km) → landed/caught/crashed. Getestet: LZ 14–30 m, Droneship 9 m, Catch 7,5 m (auch mit Warp 2).
- **Mechazilla (eq-Pad, Tech starshipT):** Turm+Arme (`name:"mzArm"`, `userData.side`) + Flame Diverter in `buildPad("eq")`; `Flight.catchLocal` = padLocal + Nord·(−20). Superheavy-Stufe (braucht Decoupler drüber!) → `site:"catch"`, `catchAlt = 72 − H + 6` (Arme greifen oben, Unterkante schwebt). Catch-Check VOR dem Boden-Check: alt ≤ catchAlt+2, horizontal < 45 m, < 9 m/s → `state:"caught"` (sackt 2,5 m nach, `b.sink`), 100 % Erstattung, `statCaught`. Arme schließen via `Flight.mzArmFold` in frame(). **Superheavy startet NUR von eq** (Guard in `UI.launch`). Diverter-Extra-Rauch: 4 Partikel/Frame seitlich (Ost/West) bei alt < 100 + superheavy im Stack; Partikel-Pool dafür 170.
- **Booster-Cam:** 380×230, Landing Burn/caught zoomt auf `min(420, 130+0.9·vrel)` raus (geglättet via `b.camDist`, flacher Winkel 0.07) – Cinematic-Shot. Neue States boostback/caught im Label.
- **Droneship-Mesh** `buildDroneship()` (Barge »Lies die Anleitung«), `Flight.droneMesh` + `dsLocal` (folgt dem Planeten pro Frame, erst sichtbar wenn positioniert). Landung auf Deck: `b.local.setLength(R+5.7)`.
- ⚠️ Booster-Tests: Wenn das MUTTERSCHIFF crasht, friert `step()` ein und der Booster hängt – Testflüge müssen die Oberstufe am Fliegen halten (∞-Tank + Schub).

## Tutorial »Orbital Refueling« (id "refuel")
`scenario.tanker:{alt,behind}` (Tut.start): parkt `Flight.tutTanker` (on rails, `spawnTutTanker()`-Mesh, in `targetList()` anvisierbar → rosa ✛ funktioniert) und setzt den Spieler `behind` m dahinter; `scenario.fuelFrac` drosselt alle Tanks (Refuel-Dramaturgie: Start mit 15 %). `checkTanker()` behandelt den Tut-Tanker VOR dem Sandbox-Return: < 60 m & < 4 m/s → Tanks voll, `Flight.refueled = true` (Tutorial-Check), Tanker weg. Reset in `Flight.start()`.

## Langzeit-Systeme (Jahresprojekt für die AG, alles NUR Karriere; Sandbox/Tutorial = neutral)
- **Stationsausbau:** `STATION_MODS` (5 Module, `needs`=Teile-Multiset). Angedockt + Teile an Bord → **[I]** `installModule()`: Teile raus, `Game.stationMods`, `buildStationMesh(stationModsEff())` wächst. Sandbox = Vollausbau (`stationModsEff`). Boni: modLab ×1,5 Experimente · modSolar lädt beim Docken · modHab +2 Crew-XP bei Docking · modScope zeigt Anomalie-Hinweise · modFunk zählt als 2 Relais.
- **Crew-Kader:** `Game.roster` (6 feste Astronaut*innen, `ROLES` pilot/ing/sci, `XP_LEVELS`). Auswahl in `Flight.start` (bereit + wenigste Flüge), Boni via `Flight.crewLvl(role)`: Pilot +8 %/Lvl Agilität, Ing −4 %/Lvl Sprit (`fuelEff`), Sci +10 %/Lvl Experimente. XP in `settleCrewAndAssets()` (endFlight). Im All zurückgelassen → `status:"gestrandet"` + Wrack-Asset.
- **Funknetz:** `commCheck(stack,pos,t)` – bemannt immer ok; Sonde: Leibniz-SOI ok, sonst Antenne nötig + `commRelays()` (1 = inneres System <2.6e10 m Sonnenabstand, 3 = Newton). Ohne Signal: `commDead` blockt Rotation/Schub/Z/X. Relais = Sat mit Antenne+Solar via [N] (`Game.relays`).
- **Anomalien:** `ANOMALIES` (8 Stück, `dir` = Einheitsvektor körperfest). Leuchtfeuer-Meshes (`anomalyMeshes`) pro Frame auf Oberfläche. Entdeckung in `onLanded(b)`: Winkel < 0,25 rad. `Game.anomaliesFound`.
- **Orbit-Inventar:** `Game.assets` ({kind:"sat"|"wreck", body, alt, phase, crew?}) – on rails via `assetPos/assetVel`, gespawnt in `spawnAssets()`. Sats persistieren bei [N] (Cap 12), Wracks mit Crew bei endFlight im All. Rettung `checkRescue()`: Kapsel < 40 m & < 4 m/s → Crew umsteigen; Landung auf Leibniz → `rescueLanded` + Status bereit (in `onLanded`).
- **Missionszentrale:** `renderMissionControl()` hängt an den Missions-Screen Sektionen für Station/Kader/Funknetz/Entdeckungen/Orbit-Inventar an. 10 neue Missionen: relay1/relay3, mod* (5), anomaly1, rescue1.

### Die Sonne selbst (`makeSunMesh` / `SUN_FRAG`)
Statt einfarbiger Kugel eine Photosphäre, alles analytisch (kein Texel Speicher): **Randverdunklung** `I(µ)/I(1) = 1 − 0.62(1−µ) − 0.20(1−µ)²` (am Rand blickt man schräg in kühlere Schichten – der wichtigste Effekt), **Granulation** (Konvektionszellen + Supergranulation, langsam brodelnd), **Sonnenflecken** (Umbra + Penumbra, nur in den Aktivitätsgürteln ±30° Breite), **Chromosphäre** (schmaler roter Saum, `pow(1−µ, 7)`). Farbe interpoliert ~4800 K (Zellränder, orange) ↔ ~5900 K (Zellmitten, weißgelb). AdminCam kriegt zusätzlich ein additives **Korona**-Billboard (`coronaTexture`).
- ⚠️ **Granulation ist FEIN und KONTRASTARM** (Frequenz 110, Kontrast ±20 %). Mit groben, hart kontrastierten Zellen sieht die Sonne aus wie ein Tarnmuster.
- ⚠️ **Randverdunklung trägt vor allem die FARBE**, nicht die Helligkeit – voll auf die Helligkeit multipliziert wird die Scheibe außen schmutzig-braun statt glühend. Und bewusst nicht bis ins reine Weiß aussteuern, sonst sieht man von Granulation und Flecken nichts mehr.
- ⚠️ **Kein `inverse(modelMatrix)` und keine Schleifen mit variabler Grenze** – beides gibt es in GLSL ES 1.00 (WebGL1, alte Schultreiber) nicht. Blickrichtung über `cameraPosition − modelMatrix[3] − position` (die Sonne wird nie gedreht/skaliert), fBm-Oktaven ausgeschrieben.
- ⚠️ `uTime` wrappen (`(t/3600) % 4096`): bei 10 Tagen/s zerlegt float32 sonst die Rauschkoordinaten.
- Korona: **breite, kurze, schwache** Keile. Lange schmale Strahlen sehen aus wie eine Pusteblume – die echte Korona ist ein diffuser Schleier mit ein paar Vorzugsrichtungen.

## Optik & Docking-Details
- **Lens-Flare:** `#lensflare`-Canvas (2D-Overlay über flight3d, VOR den HUD-Divs im DOM = unterm HUD), `Flight.drawLensflare(w,h)` pro Frame nach dem Render: Sonne via `world.position.project(camera)` projizieren, Verdeckungs-Check gegen LEIBNIZ+MOONS (Segment Schiff→Sonne vs. R), Kern+8 Spikes an der Sonnenposition, Ghost-"Blasen" (Radial-Gradient + dünner Ring) entlang der Achse Sonne→Bildmitte, `globalCompositeOperation="lighter"`, in Atmosphäre gedimmt, in der Karte aus. Der In-Szene-`sunGlow` ist dafür klein (SUN.R*9). **Überblendung:** Flare dimmt auf min. 30 %, wenn die Sonne bildschirmnah hinterm Schiff steht (Schiff = Szenen-Ursprung projiziert) – sonst verschwindet die Rakete im Gegenlicht; zusätzlich `dim *= Flight.dayLight` (nachts kein Flare).
- **Tag/Nacht am Boden:** Spieluhr (24-h-Tag, Start 08:00, `clockStr`) steuert Stand UND Helligkeit der Sonne – Details und Gotchas im Abschnitt **»Sonnenstand & Licht bodennah«** (dort auch die Ratenbegrenzung `SUN_SLEW` und warum `dayL` aus der Sonnenhöhe über dem SCHIFF kommt). Wirkt auf sunLight.intensity **und -RICHTUNG** (`groundSunDir`) sowie die **POSITION der sichtbaren Sonne** (`sunScenePos` → sunGlow + Lens-Flare), ambLight/fillLight, Himmelsfarbe/Sterne, sunGlow-Opacity, Meer und Wolken. Wer auf der Rampe vorspult, erlebt Abend/Nacht/Morgen. Rein visuell – Physik unberührt.
- **Portgenaues Docking:** `dockNow()` snappt das Schiff EXAKT Port-an-Port: Stations-Port auf +X (Andockring x≈16.2, Station rotiert nie), `dockPortTop()` = Oberkante des »Klette«-Teils im Stack → `dockOffset = X*(16.2 + dockTop − H/2)`, Nase per `setFromUnitVectors` auf −X. `updateAutoDock` fliegt den ANFLUGPUNKT 8 m vor dem Port an (nicht das Stationszentrum) und dockt bei < 10 m/< 3 m/s – so bleibt der finale Snap unsichtbar klein.

## Satelliten-Aufträge, PEZ-Dispenser & Crew-Auswahl
- **Satelliten-Aufträge (endlos, Geld-Farm):** `Game.satContracts` (immer 2 offen, `topUpSatContracts()`/`genSatContract()`: LEO/MEO/Polar/GEO mit 700–1600 🪙, lustige Firmen aus `SAT_FIRMS`), freigeschaltet mit Tech `payload` (`satContractsUnlocked()`). Erfüllen: **Kommerz-Satellit `satK` »Werbefunk«** (type "sat", 380 🪙, passt in Buchten) im geforderten Band aussetzen [N] → `satContractMet(c,o,inc)` prüft Pe UND Ap im Band (+incMin/GEO), Prämie in `deploySpecialSat`, Auftrag respawnt sofort. Asset kriegt `com:true` → **passives Einkommen** +40 🪙 pro com-Sat bei JEDEM Flugende (`settleCrewAndAssets` → `statComIncome`, Zeile im Flugbericht). Sektion »📡 Satelliten-Aufträge« oben in `renderMissionControl`; Karten-Zielringe der Aufträge erscheinen NUR mit satK an Bord (`buildGoalRings`).
- **PEZ-Dispenser (Starship):** `satInStarship(stack,id)` – liegt ein Starship **mit Frachtraum** im Stack, belegen `type:"sat"`-Teile KEINE Stack-Höhe (`stackHeight`) und werden nicht gemalt (reisen im Frachtraum); `deploySpecialSat` wirft sie dann SEITLICH aus (+Z körperfest, 1,4 m/s, »noch N im Frachtraum«-Meldung) statt nach oben – mehrere [N] = Starlink-Stil.
- ⚠️ **Der Frachtraum ist begrenzt** (`PARTS[..].bay` in kg, geprüft von `VAB.bayError` über `capError`): Starship **2500 kg** (≈ 11 »Werbefunk«), Tanker-Starship **0** – bei ihm sind da die Tanks, Satelliten stapeln sich (mit eigener Fehlermeldung abgelehnt). Vorher war die Kapazität unbegrenzt, weil Sats im Frachtraum weder Höhe noch Masse-Limit sahen. Füllstand steht als Sektion »Frachtraum« im VAB-Info-Panel.
- **Crew-Auswahl im VAB:** Karriere + bemannter Stack → Sektion »Crew-Auswahl (n/cap)« im Info-Panel (`VAB.toggleCrew`, `Game.crewPick`, migrateGame legt Array an; gestrandete ausgegraut). `Flight.start` besetzt ERST die gewählten Namen, Restplätze wie gehabt automatisch (Rollen-Rotation). crewPick wird beim Rendern um nicht-bereite Namen bereinigt.

## Kleinkörper, Zielorbits & Synchronbahn (GEO)
- **Asteroiden/Meteoroid:** `ASTEROIDS` (astGauss »Gauß« 1.72e10 · astEmmy »Emmy« 2.9e10 · metHalley »Halley« 9.2e9, alle geneigt 7–14°; Namen = Wissenschaftler wie bei den Planeten) + `asteroidPos(a,t)`. ⚠️ BEWUSST keine echten Körper: keine Gravitation/SOI, NICHT in MOONS/GRAV_BODIES – nur On-Rails-Punkte. Flug-Szene: `Flight.astObjs` (Fels-Mesh mit Vertex-Noise, Kartenmarker, Sonnen-Bahnlinie; in init()). **Scan** `checkAsteroids()` läuft pro `step`-**Substep** (sonst verpasst hoher Warp den Vorbeiflug!): < `AST_SCAN_DIST` (1000 km) → Karriere `Game.asteroidsScanned` (+Sci, migrateGame legt Array an), Sandbox `Flight._astDone`. HUD rechts zeigt den nächsten ungescannten (< 5e8 m). Universum-2D: gestrichelte Bahnen + Dots (`uniR()` = stückweise lineare Radius-Interpolation zwischen den Anker-Planeten) + Info-Karten in `renderUniverse`. Missionen ast1/comet1/astAll (`s.asteroids`, jetzt 4 Körper). Dazu der **Komet »Whipple«** mit `ecc` – s. eigener Abschnitt bei den Himmelskörpern.
- **Synchronbahn:** `LEIBNIZ.dayT = 14000` (= Wolkendrehung) → `GEO_R`/`GEO_ALT` (≈1998 km), Missions-Band `GEO_MIN/GEO_MAX` (1850–2150 km), `isGeoOrbit(pe,ap)`. Missionen geo1/gps1/gps3 – gps* zählen über `Game.assets` (`s.geoSats`, persistiert über Flüge; Konstellation geht also in mehreren Starts ODER mit 3 Sonden auf einer Rakete).
- **Zielorbit-Ringe (Karte):** Missionen können `orbitGoal:{body,alt,peMin?,peMax?,apMin?,apMax?,incMin?,incMax?,label}` tragen, Tutorials `scenario.goalOrbit`. `Flight.buildGoalRings()` (in start(); Quelle: Tut.active bzw. aktive Karriere-Missionen) baut LineLoops (bei incMin gekippt), `updateGoalRings(o)` pro Frame: **blau → GRÜN** via `orbitGoalMet()` + einmalige showMsg beim Erreichen. Nur in Kartenansicht sichtbar. orbitGoal tragen: dock1, satStrahlung, satSpion, polar1, satLeo, satIncl, satEllip, geo1, gps1, gps3.
- **Satelliten-Orbit-Missionen:** `Flight.satDeploys` (Array `{body,pe,ap,inc,pad}`, gefüllt in deploySat/deploySpecialSat, Reset in start()) → satLeo (70–200 km) / satIncl (45–65°, LMG-Rampe) / satEllip (Molnija) / satSonne (Sonnenorbit) prüfen `s.satDeploys.some(...)`; `s.inc` = aktuelle Inklination. Δv geprüft: GEO-Träger ~5300, GPS×3 ~6050, LMG-Sat-Träger ~4900 bei 10,3 t – alle Missionen machbar (Bedarf: Orbit ~3400 + GEO-Transfer ~1010 + Molnija ~480).
- **Navball-Knoten-✛:** Bei gesetztem Knoten zeichnet drawNavball ein ROSA ✛ auf `nodeDir`; der Anflug-Assistent pausiert solange (ein ✛ zur Zeit). `predict()` liefert `Flight.nodeRelY` (Knotenhöhe über Äquatorebene) und `Flight.nodePlannedInc` (Inklination der geplanten Bahn) – beides fürs Tutorial, nur bei offener Karte aktuell.
- **Tutorial id "inclination":** startet im 20°-Orbit (`scenario.orbit.inc` in Grad, von Tut.start unterstützt; Startpunkt = aufsteigender Knoten), Ablauf: Karte → Knoten → an Kreuzungspunkt schieben (|nodeRelY| < 40 km) → Normal ±780 m/s bis nodePlannedInc < 5° → SAS-Knoten-Burn. Getestet: 20° → 0,56°, Ring wird grün.
- **Universum-2D:** zeigt NUR Planeten + Kleinkörper (bewusst reduziert). Bahnhöfe, Station »Große Pause« und das Orbit-Inventar leben in der **Admin-Cam**: `padObjs` (Dots+Label auf `padDir(p)*R`, inertial fix), `stationObj` (stationPos), `rebuildAssets()` (bei `open()`, farbige Dots grün/gelb/rot), Kleinkörper mit Fels-Mesh + Bahnlinie und eigenen **Fokus-Buttons** (Follow-Cam; `setFocus` erkennt sie via `ASTEROIDS.includes`, `frame()` zentriert dann auf `asteroidPos`).
- **Knoten-Physik (didaktisch korrekt):** `predict()` interpretiert **Normal-Δv als reine Ebenen-DREHUNG** (v um den Ortsvektor rotiert via `applyAxisAngle`, Wert = Bogenlänge) → Ap/Pe der grünen Planbahn bleiben beim Plane-Change unberührt. **Beim Zünden** (SAS Knoten + Schub) friert `Flight.nodeSnap` {pos,vel,t} ein – die grüne Bahn/Marker/nodeDir zeigen den ursprünglichen PLAN statisch, statt während des Burns mitzuwandern (Reset in addNode/removeNode/start).
- **Kartenmarker:** `mkMarker(txt,color)` legt den farbigen Punkt EXAKT ins Sprite-Zentrum (= Objektposition), Label rechts daneben; Breite dynamisch (`userData.aspect`), skalieren NUR über `Flight.scaleMarker(m,ms)`. Stationsmarker heißt »Große Pause« (nicht mehr "ISS").

## Bauteile & Stack
`PARTS` (Reihenfolge im Stack: Index 0 = SPITZE). **Radialteile** (`isRadial`: fin, sb2/sb4) belegen KEINE Stack-Höhe (`stackHeight()` statt Summe!) und werden in `buildRocketGroup` an den benachbarten Tank montiert (`radialHost`: erst darunter, dann darüber; `buildPartMesh(id, {r,h})`). **Sidebooster = Pool PRO STUFE** (`seg.boost` in buildVessel, kein globales v.boost mehr!): zünden mit IHRER Stufe (Zündung/Stufentrennung setzt `n.boost.ignited`) oder [R] (aktive Stufe), [J] wirft NUR die Booster der aktiven Stufe ab (nächstes [J] nach der Trennung = nächste Stufe); abgeworfene Stufen nehmen ihren Pool automatisch mit (hängt am Segment). Physik/HUD/Gauge/Flammen lesen `activeSeg().boost`; Flammen von Oberstufen-Boostern via `bflame.userData.upper` aus (gesetzt in buildRocketGroup, wenn Decoupler darunter). Trümmer-Mesh = `buildStrapOnMesh(strapOnHeight(stack,i))` – NICHT das srb-Mesh (Formwechsel-Bug). Servicebuchten (`bayCoverage()`): `bay` = »M« verkleidet 2 Teile darüber, `bayS` 1 (`PARTS[..].covers`) – aber NUR Typen aus `BAY_FITS` (battery/solar/probe/antenna/lab), sonst "verschluckt" die Bucht z. B. Oberstufen-Triebwerke; geschlossene Bucht schützt Solarpanele vor Fahrtwind, [G] öffnet sie automatisch mit. Oberstufen-Triebwerke (Decoupler darunter) kriegen `flame.userData.idle` – `setFlames` lässt sie aus, bis sie unterste Stufe sind. VAB-Info: Seitenbooster zählen zu Gesamtmasse + TWR IHRER Stufe (nicht Δv, `segBoost[]`); jede Stufe zeigt Leergewicht, Rakete gesamt »Leergewicht (Tanks leer)«. Solarflügel (`name:"wing"`) starten eingefahren (scale.x 0.1) – für Orbit-Sats `deployWings()`. Fairing verkleidet alles darüber.

## Montagehalle (VAB-3D-Szene)
### Layout: passt sich der Fensterbreite an (13"-Laptop bis 27"-Schreibtisch)
Drei Spalten (`#partList` · `#vabCenter` · `#vabInfo`), Breiten und die Größen in der
Werkzeugleiste `#vabTop` per `clamp()` an `vw` gekoppelt.
- ⚠️ **`#vabTop{flex-wrap:wrap}` ist die HARTE Garantie gegen Überlappung.** `#vabCenter` hat
  `min-width:0`; ohne Umbruch ragt die Leiste einfach rechts heraus und legt sich (z-index:2!)
  über `#vabInfo`. In der Karriere braucht sie mit den alten festen Button-Maßen **1340 px**,
  auf einem 1440er Laptop stehen ihr aber nur 965 zu.
- Gemessen nach dem Umbau: 926 von 965 px bei 1440, 853 von 858 bei 1280 (beides einzeilig,
  Leistenhöhe 95 → 49 px), zweizeilig erst unter ~1270 px. Ab ~1900 px ist die Leiste wieder
  so groß wie vorher – die clamp()-Steigungen sind dafür gelegt, nicht für eine feste Stufe.
- ⚠️ `white-space:nowrap` auf Titel/Badge/Buttons: sonst bricht ausgerechnet »🏗️ Montagehalle«
  zweizeilig um und macht die Leiste **höher** statt schmaler.
- Der eigentliche »rechte Seite abgeschnitten«-Bug war aber **nicht** das Layout, sondern die
  Canvas-Größe – s. `gfxPixelRatio()` im Optionen-Abschnitt.
- **Halle:** Betonboden (`makeHallFloorTex`, Kachel 3×3 versetzt gezeichnet; ⚠️ Materialfarbe dunkelt ab – ungetönt brennt der Beton unter Hallen- und Himmelslicht auf ~#b0bdea aus und die Halle sieht aus wie ein Leuchtkasten), Trapezblech-Wände (`makeHallWallTex`), Warnstreifen-Sicherheitszone (`makeHazardTex`), Hallentor + LMG-Schild **mittig über dem Tor**, Fachwerkbinder, Kranbahn, Hochregale, Werkbänke, Servicegerüst neben der Rakete.
- ⚠️ **RingGeometry-UVs sind PLANAR** (u aus x, v aus y) – für die Warnstreifen müssen sie polar neu gesetzt werden, sonst laufen die Streifen quer durchs Bild statt um den Kreis. u aus dem Scheitel-**Index** (nicht aus `atan2`), dann ist die Naht bei 0°/360° mit ganzzahligem `repeat` unsichtbar.
- ⚠️ **Draw-Call-Budget:** ALLES Inventar (Regalpfosten, -böden, Kisten, Werkbänke, Gerüst, Geländer, Wandstützen, Tor) sammeln `box()`/`cyl()` in zwei Arrays; `flushProps()` baut daraus **zwei InstancedMeshes** (Einheitswürfel + Zylinder, Größe und Farbe pro Instanz via Matrix + `setColorAt`). Einzelmeshes wären ~200 Draw-Calls für ein paar Regale; so sind es insgesamt 40–120.
- ⚠️ **Maßstab:** Eine Figur ist **6,2 Einheiten** hoch (Modellhöhe 2,57 × Skalierung 2,4), 1 Einheit ≈ 0,37 m. Werkbankplatte gehört auf ~3,3 (nicht 9 – das wäre über Kopfhöhe!), Regalebenen ~15 auseinander, Geländer 3,4 hoch, Lichtbogen auf Brusthöhe ~2 Einheiten vor der Figur. Erst mit diesen Maßen wirkt die Halle bewohnt statt riesig.
- **Belegschaft** (`buildCrew`/`stepWorker`, 10 Leute): Rollen `walk` (Wegpunkte; Beine schwingen aus Hüftgelenken, Oberkörper wippt, Drehung wird über den KÜRZESTEN Weg eingeschliffen und es wird erst losgelaufen, wenn die Nase ungefähr stimmt) · `weld` (an der Werkbank, zuckendes PointLight + Funken aus einem `THREE.Points`-Pool = 1 Draw-Call) · `carry` (Kiste am Körper, Regal zu Regal) · `talk` (gestikulierendes Duo). Vorher: sechs Figuren, die mit `|sin(t)|·0,5` HÜPFTEN und ihre Blickrichtung pro Frame hart umsprangen.
- ⚠️⚠️ **Schweißen ist EPILEPSIE-relevant und deshalb bewusst selten und weich.** Früher zündete
  jede der zwei Werkbänke alle 2–6 s und die Helligkeit wurde PRO FRAME gewürfelt
  (`0.30 + Math.random()*0.70`) – das sind 60 Hz Stroboskop mit voller Amplitude, im
  Randbereich des Blickfelds, während man auf die Rakete schaut. Jetzt: Pause 62–120 s,
  Bogen 2,4–4,6 s (zusammen ~1,2 Lichtbögen/Minute, 6,7 % der Zeit hell), Helligkeit als
  Schwebung zweier Sinus (~1 Hz, ±26 %, max. 4 % Sprung pro Frame) und weiches Ein-/Ausblenden
  über eine Hüllkurve. Beim Betreten der Halle zündet ~60 s lang nichts, und die beiden
  Bänke sind gegeneinander versetzt. **Nicht wieder hochdrehen.**
- ⚠️ `buildAstronaut()` hat dafür **Gelenk-Gruppen** `name:"arm"` / `name:"leg"` bekommen (mit `userData.side`). Die Ruhepose ist exakt die alte: Der Versatz der Gruppen ist so gewählt, dass die Zylinder wieder bei (±0,48 | 0,70) bzw. (±0,18 | −0,30) sitzen – gilt auch für die EVA-Figur in der Flugszene.
- **`VAB.oops()`** = die Mannschaft zuckt zusammen, 1–2 fallen um (Sturz mit Zappeln und Wiederaufstehen nach ~3 s). Ausgelöst von jedem abgelehnten Start (`UI.launch`: ungültig / zu schwer / Superheavy auf falscher Rampe / zu teuer) und von den Booster-Caps in `VAB.add`; dazu selten ein zufälliger Stolperer beim Laufen.

## CFD-Windkanal (Gadget, Button im VAB-Info-Panel)
`CFD`-Objekt + `#cfd`-Overlay (eigener Renderer/Loop, stoppt bei close()). **Keine echte CFD**, aber Geometrie-ehrlich: `profile(stack)` = Rumpfprofil von der Spitze (Fairing ersetzt Verkleidetes durch Ogive), `aero(stack, mode)` zerlegt Cd in Bug (`bluntOf` je Spitzenteil: Fairing 0.06 … Tank 0.95, quadratisch) + Durchmessersprünge + Heck + Reibung + Flossen + Booster; Modus "reentry" dreht die Segmentfolge um (Heck voran/retrograde) und liefert Thermik via Sutton-Graves (`qdot=1.74e-4·√(ρ/Rn)·v³`, Rn wächst mit Stumpfheit → stumpf = kühl, Strahlungsgleichgewichts-Temp, Brems-g, Schild-Check). Getestet: Fairing senkt Cd um ~37 % ggü. nackter Sonde.

### Optik: Rauchfahnen wie im echten Windkanal (`smokeMat` + `makeSmokeTexture`)
Vorher zeichnete der Windkanal 48 dünne `THREE.Line`-Stromlinien – geometrisch korrekt, sah aber aus wie ein Drahtmodell. Ein echter Windkanal macht die Strömung mit **Rauch** sichtbar: eingeblasene Schnüre, die sich glatt um den Körper legen und im Nachlauf turbulent aufreißen. Die Bahnen sind dieselben wie vorher (Stromröhren-Näherung `r_Linie=√(r_Profil²+z0²)`, 7 Radien × 8 Azimute), gerendert als **kameragerichtete Bänder** mit scrollender Rauch-Kachel.
- ⚠️ **Das Band wird IM VERTEX-SHADER zur Kamera aufgespannt** (`aSide` × halbe Bandbreite quer zur Blickachse, `cross(tangent, viewDir)`). Ein Band mit fester Ebene verschwindet, sobald die Kamera in seine Ebene dreht – bei der frei orbitierenden CFD-Kamera flackert dann die halbe Strömung weg. Fallback auf die radiale Richtung, wenn Blickachse ∥ Fahne.
- ⚠️ **ALLE 56 Fahnen in EINER BufferGeometry** (~19 000 Scheitel, 10 Attribute, 1 Draw-Call). Ein Mesh pro Fahne wären 56 Draw-Calls für nichts. Beim Moduswechsel `geometry.dispose()` – sonst frisst jeder Klick auf »Wiedereintritt« neuen GPU-Speicher.
- **Farbe = `CFD_RAMP_GLSL`**, dieselbe Rampe wie die Rumpfoberfläche (`cpMat`) – EINE Quelle, sonst sprechen Fahne und Oberfläche irgendwann verschiedene Sprachen. Der Druck-Skalar `aP` kommt aus der **Ablenkung der Stromröhre**: `drl/dx > 0` = Strömung wird nach außen gedrängt, staut sich → rot; `< 0` = schließt sich wieder, beschleunigt → blau; gerade = neutral grün. Damit stimmen Fahnenfarbe am Bug und im Lee mit der Rumpffarbe zusammen.
- ⚠️ `dx` der Steigungsableitung (`L*0.05`) muss **größer als der Stützstellenabstand** (`L*3.5/132`) sein – an der Stirnfläche springt `rpEff` von 0 auf r, mit feinerem dx erwischt den Sprung nur ein einziger Scheitel und der Staupunkt ist ein 3-m-Strich statt einer sichtbaren roten Zone.
- ⚠️ **Additive Bänder blenden schnell aus**: mit 8 Azimuten × 8 Radien und `uOp` 1.0 war das Bild eine massive grüne Wand, in der die Rakete verschwand. Jetzt `uOp` 0,40, `wBase = rmax*0.15`, `aDim = 1/(1+z0f*0.45)` (weiter außen = ungestörter = blasser) und ein Kontrast-Boost `0.70+0.75·|p−0.5|·2`, damit die Stau- und Lee-Zonen aus dem neutralen Grün herausleuchten.
- **Turbulenz** wächst stromab (`aTurb`, ab `x > L*0.12`): Bandbreite ×3,4, Wabern quer zur Strömung im Vertex-Shader, und im Fragment wechselt der Rauch von `0.42+0.58·n` (glatte Schnur) auf `n1·n2·2.6` (zerrissene Fetzen).
- `makeSmokeTexture()` = 256er-Kachel, fraktales Wertrauschen im Alphakanal. ⚠️ **Nahtlos ist Pflicht** (die Fahnen scrollen sie entlang ihrer Länge, sonst wandert alle paar Sekunden eine harte Kante durch den Windkanal): jedes Oktavgitter teilt 256 ganzzahlig (4/8/16/32/64) und läuft beim Nachschlagen per Modulo um.
- ⚠️ GLSL ES 1.00 (WebGL1, alte Schultreiber): `attribute`/`varying`/`texture2D`/`gl_FragColor`, kein `inverse()`, keine dynamischen Loop-Grenzen.
- Keine Tracer-Punkte mehr – die scrollende Kachel trägt die Bewegung, leuchtende Perlen auf unsichtbaren Bahnen wirkten daneben wie ein Fehler im Bild.

Dazu weiter: Wirbel-Blobs an Emittern (Heck-Totwasser + Stufen, blähen sich mit life auf) + **rote Ablöse-Ringe** (`seps`, 10er-Ringe an Bugkante/Stufenkanten) + grünes **Staukissen** (`bow`) vor der Stirn + Staupunkt-Glühen ∝ Stumpfheit, Oberflächen-Druck via `cpMat`-ShaderMaterial (`dot(n,−Strömung)` → blau→grün→rot; Anströmung fließt IMMER +X, Modell wird gedreht: ascent rotation.z=+π/2 & pos.x=+H/2 → Spitze bei −L/2 deckungsgleich mit Profil). Konvergenz-Zähler/Momentan-Cd-Rauschen = bewusstes Solver-Theater, die Werte dahinter nicht. Panel-Update alle 6 Frames; **0,25 ms/Frame** gemessen (240 Draw-Calls, 17,5k Dreiecke).

## Wichtige Systeme (Stichworte → Suchbegriff in index.html)
- **Tech-Balancing Energie:** `solar` + `bayS` hängen an `surv` (»Überleben & Forschung«), NICHT an payload – sonst treiben Anfänger stromlos im Orbit. `battery`/`probe`/`bay`/`fairing` bleiben bei payload.
- **Tech-Balancing Erststufe:** Tech `propI` »Flüssigtriebwerke I« (10 🧪, req start) → `engStd` **Triebwerk »Ochse«** (200 kN, Isp 265, 600 kg, Ø 10, 300 🪙, `cat:"lower"`). Davor gab es bis `heavy` (60 🧪) NUR Oberstufen-Triebwerke (`engS` 45 kN / `engVac`) oder Feststoff – man MUSSTE die erste Stufe mit Boostern bauen, was Simon zu Recht als unrealistisch gemeldet hat. Isp 265 ist bewusst die schlechteste Flüssig-Effizienz im Spiel (kurze Meereshöhen-Düse; steht so im Info-Text – Didaktik: große Vakuumdüsen taugen am Boden nicht). `advProp` (»Flüssigtriebwerke II«) hängt jetzt an `["basic","struct","propI"]`, damit die Kette I → II stimmt; `migrateGame` schenkt Bestands-Saves mit advProp den Knoten propI. Verifiziert: Stack `chute/probePod/tankS/engS/decoupler/inter/fin/3×tankS/engStd` = 8,05 t, TWR 2,5, Δv 1917+2666 ≈ 4580 m/s → Orbit (Bedarf ~3400) mit Startkapital + propI + struct + basic erreichbar.
- Karriere: `MISSIONS` (Verträge, nur AKTIVE erfüllbar; `Game.activeMissions` = Array, max. `maxMissions()` = 1 + Tech mission2/mission3; `req`-Ketten), `TECH` (DAG; Layout: 2-Pass mit echten Kartenhöhen, `top{}`-Map für SVG-Äste – NICHT festes Raster, sonst Überlappung), `Game.labDone` (Experimente [B] je `situation()` einmalig).
- Geld (nur Karriere): `Game.funds` (Start 3500), `PART_COSTS`→`PARTS[..].cost`, `stackCost()`, Missionsprämie **`missionCash(m)=300+20·sci`** (⚠️ verdoppelt: Von einer Orbitalrakete kommt nur die OBERSTE Stufe zurück – `settleCrewAndAssets` erstattet `stackCost(v.stack)`, und `stage()` löscht abgeworfene Teile aus `v.stack` – und am Anfang darf man nur EINE Mission annehmen. Mit `150+10·sci` war jeder Orbitalflug ein sicheres Minusgeschäft. Nachgerechnet: Hüpfer 730 🪙 / volle Bergung / +400 Prämie · Orbitrakete 1445 🪙, Bergung 730, Prämie 800 → ±0 · Sat-Träger 2495/1380/900 → −215 · Docking 2865/1750/1400 → +285. Bergung und Wiederverwendung bleiben damit der Hebel für echten Gewinn). **Nebenverdienste** `SIDE_JOBS` (4 einmalige Geld-Aktionen: 2×1000 bei basic+struct »Seminare«; 1500 »Mensa-Deal« braucht KOMPLETTE Spalte 3 (surv+advProp+padEq+mission2); 1500 »Blueprints« komplette Spalte 4 (crewed+payload+heavy+explore)) – Sektion »💰 Nebenverdienste« oben in `renderMissionControl`, `doSideJob(id)`, `Game.jobsDone` (migrateGame legt Array an). Hilft schwächeren Schüler*innen, die sich verbaut haben.
- **Bau-Caps:** `VAB.capError(stack)` – max. ZWEI `sideboost`-Teile, max. EIN `srb` UND max. EIN `superheavy` pro STUFE (sonst Gratis-Δv durch Stapeln; zwei Superheavys in einem Segment waren 52 t geschenkter Treibstoff), dazu `bayError` für den Starship-Frachtraum. Guards in `VAB.add`, `dropAt` (Drag&Drop neu UND move) UND `validate()` (fängt gespeicherte Hangar-Raketen). ⚠️ `VAB.add` prüft `capError` seit dem Superheavy-Cap für **JEDES** Teil (vorher nur für sideboost/srb) – der Probe-Stack muss dabei an der Stelle eingefügt werden, an der das Teil wirklich landet (Kapsel/Schirm oben, Rest unten). Getrennte Stufen bleiben erlaubt: Superheavy + Stufentrenner + Superheavy ist eine legitime zweistufige Rakete. Start zieht Kosten ab (`UI.launch`, `Flight.launchCost`), Bergung nur bei Landung auf LEIBNIZ (`settleCrewAndAssets` → `statRefund`, voller Restwert des übrigen Stacks). Crash/All = Totalverlust. Alte Saves: `migrateGame()`.
- **Wiedereintritts-Hitze (tödlich!):** in `step()`: sinkend + `v>1600` + `heat=rho·v³>1.5e7` → ohne Schutz wächst `heatDmg` um `(0.12 + heat/5e8)/s` → bei 1 verglüht (explode, Crew-Schleudersitz-Meldung). Schutz = `shield`-Teil ODER Starship **in Bauchlage**: die Kacheln sitzen nur am Bauch (+Z körperfest) und schützen nur bei `dot(+Z, airVel) > 0.5` – Nase voran = Tod (eigene Warn-/Crash-Meldungen »Kacheln zeigen nicht in den Wind«, Tutorial "starship" warnt entsprechend). Getestet: Starship nase-voran verglüht bei ~38 km, mit [C] Bauchlage Landung bei heatDmg 0.35. Der Grundschaden 0.12 macht auch flache Aerobraking-Tricks tödlich: **aus dem Orbit ohne Hitzeschild = immer Tod** (getestet: verglüht bei ~37 km; mit Schild + leerem Tank + Schirm sichere Landung bei max. 1537 °C). Suborbitale Hüpfer (<1600 m/s) bleiben safe. Reset `heatDmg` in start(). **Plasma-Glühen (rein visuell, in frame()):** `Flight.plasmaGroup` (lazy, an `scene`): Stoßfront-Sprite windwärts + Halo + Plasmaschweif = **Kette aus 10 Glow-Sprites** (`grp.userData.trail`, nach hinten größer/röter/dünner, Wabern+Flackern via sin – ⚠️ KEIN Kegel-Mesh: harte Silhouettenkanten sehen aus wie ein Plastik-Trichter), Intensität `(shipTemp−600)/900` (= ab roter HUD-Temp), aus bei map/landed/crashed/airVel<600; dazu Funken-Partikel nach hinten (nur warp≤2).
- **Kontext-Buttons:** `Flight.updateButtons()` (in drawHUD, pro Frame): blendet Booster[R/J]/Schirm/Fairing/Satellit/Panele/EVA/Bellyflop/Docken/Modul/Bucht/Experiment aus, wenn das Vehikel die Ausrüstung nicht hat (IDs btnBoostR/btnBoostJ/btnChute/btnFairing/btnSat/btnPanels/btnEva/btnBelly/btnDock/btnModul/btnBay/btnExp). Modul zusätzlich nur Karriere.
- **SRB-Anzeige getrennt:** Tank-Gauge/`fuelPct`/HUD-Zeile »Treibstoff« = NUR Flüssigtreibstoff; Feststoffbooster (inline `srb`, nicht drosselbar – brennen auch bei Schub 0 weiter, Tank bleibt voll!) haben eigene HUD-Zeile + teilen sich die orange Booster-Gauge mit dem Seitenbooster-Pool der aktiven Stufe.
- **Hangar-Dateien:** `VAB.exportRockets()` (Download `lmg-raketen.json`) / `VAB.importRockets(file)` (Merge per Name, filtert unbekannte Teile-IDs) – Buttons im Hangar-Modal + verstecktes `#rocketFile`-Input. Für Schüler*innen, die den PC wechseln.
- Fallschirme: `PARTS[..].chuteA` (Mk1 500 ≈ 2 t, `chute3` Mk2 2000 ≈ 8 t, addieren sich); Drag `cdA += Σ chuteA`. Mk2 = 3 Kappen (Part-Mesh + `attachChute` Fächer-Gruppe). **Abriss:** Öffnen > 200 m/s (airVel, in Atmo) oder offen > 240 m/s unter 30 km → `ripChute()` (`chuteTorn` = dauerhaft kaputt, Mesh weg, [P] meldet nur noch).
- Aero-Instabilität: ohne `fin` an der aktiven Stufe taumelt die Rakete – Pseudo-Rausch-Torque in `step` (amp `0.26·min(1,qDyn/25000)`; nur warp≤2, nicht bei Schirm/Belly/EVA/autoDock). **Komplett AUS** bei: Flossen in aktiver Stufe (`s.hasFins`) · nach der ersten Stufentrennung (`Flight.stagedOnce`, gesetzt in `stage()`, Reset in `start()`) · Superheavy/Starship im aktiven Seg. Alle Tutorial-Stacks haben `fin` in der Unterstufe (Achtung: fin muss UNTER den Decoupler, sonst zählt sie zur Oberstufe – `hasFins` ist pro Segment!).
- Booster-Landung (Falcon-Stil): Radialteil `gridfin` (Tech `reuse`, 4 Fins name:"gfin", angelegt; ausklappen = `rotation.z` bis π/2). `stage()`: abgeworfene Stufe MIT gridfin+Triebwerk+Restsprit (<250 km Höhe) → `Flight.booster` statt Debris; `updateBooster(dt)` (substeps ≤0.05 s, Warp-Cap 50×) = Autopilot flip→coast (Fins raus, cdA 5+8·deploy)→burn (Zielprofil `aDes=1.35·(v²−4)/(2·(alt−4))+g` auf GESAMT-v, Nase fast senkrecht + Anti-Drift-Neigung, Endanflug 0.92·Schwebeschub)→landed (folgt Planet via `b.local`; Karriere: `b.value`·Landeplatz-Faktor-Erstattung, s. »Booster-Landeplätze«; Flag `statBoosterLanded` → Mission reuse1)/crashed. **⚠️ Zeitsync:** `this.t` ist beim Aufruf schon +dt – der Booster integriert mit eigener Zeit `tt=this.t−dt` und sampelt `bodyPos(LEIBNIZ,tt)` pro Substep, sonst ~25 m Höhen-Bias → Crash! PiP-Fenster `#boosterCam` + `updateBoosterCam()` (eigener Renderer, gleiche Szene, schließt 4 s nach Ende). Orange Tankmarke `#fuelMark` (12 %, bei RTLS 30 %) wenn aktive Stufe gridfin hat. Tutorial id "booster".
- ⚠️⚠️ **Bellyflop + Zeitraffer = Absturz (behoben, nicht wieder aufreißen!):** `step()` gibt oberhalb von 2× **gar keinen Schub** (`s.ignited && warp<=2`) – der Autopilot stellte brav Schub 0,3 ein, das Triebwerk blieb kalt und das Schiff fiel mit Terminalgeschwindigkeit in den Boden. Dazu rechnet `frame()` bei Warp mit `maxDt = 1 s` = **71 m Fallweg pro Schritt**, damit verpasst schon der Flip sein 250-m-Fenster. Gemessen vorher: Warp 5 → Burn ab 178 m, Warp 50 → Burn ab 14 m, beides Crash. `updateBelly` begrenzt deshalb **unter 2,5 km hart auf Warp 2** (wie autoDock/Booster-Landung) und meldet das. Der lange Fall darüber bleibt vorspulbar – das Tutorial empfiehlt [.] ausdrücklich. Verifiziert: Warp 1/2/5/10/50 landen alle mit 3,0 m/s.
- **Bellyflop-Gotchas:** Der Autopilot setzt `sas="off"` – die passive Aero-Stabilisierung (retrograde-Drehung bei Sinkflug) MUSS `!this.belly` prüfen, sonst kämpfen beide um die Lage und das Schiff dreht kaum in Bauchlage! [C] in den ersten 3 s der flop-Phase bricht NICHT ab (Doppel-Tipper-Schutz), danach wie dokumentiert. Dreh-Slerp 1.6/s (Flaps, unabhängig von RCS). **Flop = VOLLE Ziel-Lage inkl. Rollwinkel** (makeBasis: Nase=Y horizontal, Kachel-Bauch +Z in den Wind/nach unten) – nur `setFromUnitVectors` auf die Nase lässt den Roll frei und das Schiff liegt 90° verdreht (Flaps senkrecht)! Starship-Flaps sitzen auf `flapPivot`-Groups (Scharnier an der Rumpfkante, `rotation.y = side*fold`): frame() animiert sie (flop: 0.28±0.22 rad wedeln, Bug/Heck gegenphasig · flip/burn: 0.95 angelegt · sonst 0). Tutorial "node" endet jetzt mit Pflicht-Capture (Pe-Retrograde-Burn, Ap < 2000 km) statt Flyby. ⚠️ Deployment: index.html + tutorials.js IMMER zusammen deployen – neue tutorials.js mit alten PARTS (z. B. "inter") wirft sonst Exceptions in stackHeight → wirkt wie wildes Trudeln/Kontrollverlust.
- Titel "LMG Space Program", Favicon `LMGTECHlogo.png` (exakte Groß-/Kleinschreibung – Hosting kann case-sensitiv sein!).
- SpaceX-Endgame (Tech-Kette reuse→raptorSL→raptorVac→starshipT): `engRapSL`/`engRapVac` (effizienteste Triebwerke), `superheavy` + `starship`/`starshipTank` = **Kombi-Typen** (Tank UND Triebwerk: segStats/validate/radialHostIdx/Flammen-idle behandeln "superheavy"/"starship" mit). Starship: bemannt (crewCapacity 6, `isCrewedStack`), Hitzeschutz (zählt als shield), `flaps:true`; Tanker `tanker:true` = unbemannt, keine Flaps. Bellyflop **[C]** (`toggleBellyflop`/`updateBelly`): flop (Nase horizontal, cdA+56 → Terminal ~85 m/s) → Flip (Trigger `alt ≤ vDown·2.6+burnDist·1.4+40`; unter ~200 m aktiviert = Crash) → Hoverslam; übersteuert Handsteuerung+SAS. Tanker: `settleCrewAndAssets` parkt ihn als Asset kind:"tanker", `checkTanker()` betankt <60 m/<4 m/s alle Segs voll & verbraucht ihn. Tutorial id "starship".
- Karriere-Intro: `INTRO_PAGES`/`showIntro()` (Flugleiterin Lotte), einmalig via `Game.introSeen` beim ersten `UI.startCareer()`.
- `Flight.step(dt)`: semi-implizit Euler; Warp `WARPS`, adaptives `maxDt`; Steuereingabe bricht Warp>2 ab; in der Atmosphäre max. 50× (`canWarp` + Auto-Drossel in `step`); Drag-Clamp `min(fd/(m*v), 0.5/dt)`; Auto-Cutoff am Manöverknoten (`nodeBurned`).
- Agilität: `0.12 + 0.78*nRcs` (Rotation UND SAS-Slerp) – ohne RCS bewusst sehr träge.
- **⚠️ Start-Lage der Rakete = `padQ`** (`this.q.copy(padQ)` in `start()`, dieselbe Basis wie Rampe/Boden: **X=Ost, Y=hoch (Nase), Z=Süd**). Die Steuerung dreht im KÖRPERFRAME (`this.q.multiply(dq)`), also legt der Rollwinkel auf der Rampe fest, welche Taste in welche Himmelsrichtung neigt. Damit gilt an JEDER Rampe: **[D] → Osten (90°)** · [A] → Westen · [W] → Süden · [S] → Norden. Verifiziert: Ost-Start nur mit [D] ergibt Inklination 0,0° (Äquator) bzw. 55,0° (LMG). ⚠️ Vorher stand hier `setFromUnitVectors(V3(0,1,0), pd)` – das ist die MINIMAL-Drehung und lässt den Rollwinkel willkürlich; [D] neigte dadurch nach SÜDEN und [S] nach Osten, obwohl Tutorials (`orbit`, `booster`) und der Hilfetext ausdrücklich »[D] nach Osten« sagen. Die NASE zeigt in beiden Varianten senkrecht nach oben – nur der Roll unterscheidet sich, Orbit-Start-Tutorials sind also unberührt.
- Temperatur (didaktisch, HUD): `ambTemp()` (−6,5 °C/km, All −270 °C) + `updateTemps(dt)` → `shipTemp` (Atmo: Staupunkt `amb + v²/2050`, dichtegewichtet `min(1,rho/2e-3)`; Vakuum: Schwarzkörper ∝ 1/√Sonnenabstand, bei Leibniz ≈ +5 °C; träge Annäherung `k=0.03+2rho`).
- Komplett-Satelliten `satW`/`satR`/`satS` (type "sat", passen in Buchten): [N] ruft `deploySpecialSat()` – prüft Orbit-Anforderung (satW stabil · satR Pe>250 km · satS Pe>70/Ap<130 km), setzt Flags `satWeather/satRad/satSpy` für die Missionen satWetter/satStrahlung/satSpion. `probeS` = flacher Sondenbus (type "probe", wird NIE ausgesetzt).
- **Stufenadapter** (`interXS`/`inter`/`interL`, type "inter", Ø 8/10/12): offene Röhre (`shroudH` 10/16/18) wächst von der Unterkante nach OBEN über Stufentrenner + Oberstufen-Triebwerk (belegt selbst nur h≈3 Stack-Höhe, Radius ×1.06 gegen Z-Fighting). Direkt UNTER den Decoupler bauen → gehört zum unteren Segment (segments() teilt NACH dem Decoupler) und bleibt wie der Falcon-9-Interstage auf der abgeworfenen Stufe. Rein strukturell (nur Masse). Tutorials orbit/launchwindow/booster haben ihn im Stack.
- Fairing: `buildFairingShell(r,H,phiStart?,phiLength?)` (Lathe-Ogive); [F] spawnt 2 Halbschalen als Debris (seitlich + Spin).
- Partikel-Pool (110 Sprites, `fresh`-Flag, altern mit Sim-Zeit `simmed`), Rauch nur in Atmosphäre.
- Tutorials: `Tut.start(id)` erzwingt Sandbox + ∞-Strom; Szenario: `stack`, `orbit:{body,alt,pe?}` oder `nearStation:<m hinter Station>`; Checks `check(o,F)` laufen pro Frame.
- Admin-Cam: `AdminCam` (eigene Three-Szene, echte Ephemeriden, Fokus-Buttons, Zeitraffer) – Vollbild aus dem Universum-Screen. Start-Zeitraffer `speedI:0` = **1 min/s** (mit 1 h/s wirbelten die inneren Planeten los, bevor man überhaupt hingesehen hat). ⚠️ **Die Bahnhof-Marker hängen als KINDER am Leibniz-Mesh** und erben dessen sichtbare Drehung (`rotation.y` in `frame()`); als Szenen-Kinder auf `padDir(p)·R` blieben sie stur im Weltraum-Frame stehen und wanderten über fremde Kontinente. Für die Physik sind die Rampen weiterhin inertial fix – die Admin-Cam ist ein Schaukasten, kein Simulationsschritt. Die Station bleibt Szenen-Kind (echter Orbit, on rails).
- localStorage: `lmgAutoSave`, `lmgMusic`, `lmgSettings` (Grafik/Lautstärke, s. Optionen-Abschnitt), `lmgLoadedOnce`, `lmgHint_*`, `tutsDone` im Save, `lmgRockets` (💾/📂-Hangar: gespeicherte Raketen `{name,stack}`; Laden in Karriere nur mit erforschten Teilen).

## Tastenkürzel
Space Stufe · T SAS (off/pro/retro/[node]/[tgt]) · P Schirm · F Fairing · N Satellit · G Panele · O Buchten · **R Booster zünden** · J Booster ab · **L Docken/Autopilot (<200 m)** · **I Modul einbauen** · **C Bellyflop (Starship)** · V EVA · K Knoten · B Experiment · M Karte · U ∞Tank (Sandbox) · H HUD (3-stufig) · Esc Pause · ,/. Warp · WASD/QE drehen · ↑↓ Schub · **Z auf Rampe = Orbit-Ziel wählen (nur Äquator-Rampe)**, im Flug Vollgas · X Schub aus

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
