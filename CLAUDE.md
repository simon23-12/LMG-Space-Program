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
- ⚠️ **Musik liegt als VBR-Mono (`ffmpeg -q:a 7 -ac 1`) vor, NICHT mehr 256 kbps Stereo.**
  Grund ist Vercels Gratis-Kontingent (100 GB Fast Data Transfer): Die sechs Titel waren
  91,7 MB, jetzt 16,5 MB (−81 %). Eine Schüler-Sitzung kostete damit ~94 MB, jetzt ~19 MB –
  bei 30 Kindern der Unterschied zwischen ~35 und ~175 Sitzungen pro Jahr. `raptor.mp3` ist
  bewusst **unangetastet** (die Loop-Marken 3,15/18,60 s hängen an genau dieser Datei), die
  PNGs ebenfalls (User will keine sichtbare Pixel-Einbuße).
- `vercel.json`: Cache-Header (Medien 1 Woche hart + 4 Wochen `stale-while-revalidate`,
  Spielcode `must-revalidate`). ⚠️ Das Schema erlaubt in einem Header-Eintrag NUR
  `source`/`headers`/`has`/`missing` – ein `comment`-Schlüssel lässt den Deploy scheitern.
- `.claude/launch.json` – Preview: `npx serve -l 8642` (Name `lmg-space-program`). Eintrag `lmgsongrodeo` gehört dem User – nicht anfassen.

## Optionen & Grafikstufen (`Settings` / `GFX_PRESETS` / `applyGraphics`)
Screen `#options` (Hauptmenü »⚙️ Optionen«, im VAB **und im FLUG** der ⚙️-Knopf), gerendert
von `renderOptions()`. Vier Regler: **Grafik** (niedrig/mittel/hoch), **Musik**, **Geräusche**,
**📳 Kamera-Wackeln** – dazu die Karte **⌨️ Tastenbelegung** (`KEYMAP` → `renderKeymap()`).

### 📳 Kamerawackeln (`Settings.shake` / `SHAKE_LIFTOFF` / `applyShake`)
Rein optisch – versetzt wird die KAMERA, nicht das Schiff; Flugbahn, Autopiloten und Physik
bleiben unberührt.
- ⚠️⚠️ **NUR die ersten `SHAKE_LIFTOFF` = 2 Sekunden ab der Zündung AUF DER RAMPE.**
  (Waren bis August 2026 drei – auf Wunsch von Simon verkürzt: Der Effekt soll den SCHLAG
  der Zündung verkaufen, und der ist nach zwei Sekunden erzählt. Alles darüber liest das
  Auge schon wieder als Dauerunruhe, s. u.) Die
  erste Fassung rüttelte durchgehend, solange ein Triebwerk brannte, plus Impulse bei
  Stufentrennung, Aufsetzen, Fallschirm, Fairing und Explosion. Ergebnis: »sieht einfach so
  aus, als würde die Rakete die ganze Zeit wackeln« (Simon) – aus einem Effekt, der den
  Moment des Abhebens verkaufen soll, wurde ein Dauerzustand, den das Auge nach zehn
  Sekunden nur noch als Unruhe liest. **Keine weiteren Quellen** – kein Wackeln bei
  Stufentrennung, keins beim Landen, keins beim Wiedereintritt. Wer das wieder aufmacht,
  macht denselben Fehler nochmal. (`addShake`/`shakeImp` gibt es deshalb nicht mehr.)
- `_shakeT0` wird in `stage()` gesetzt, aber nur wenn `this.landed` – ein Zünden im Orbit
  oder nach einer Stufentrennung rüttelt bewusst nicht. Die letzte Sekunde blendet weich aus
  (`smoothstep`), ein hart abgeschnittener Effekt fällt mehr auf als der Effekt selbst.
  Gemessen (Pegel): vor Zündung 0 · t = 0,5 s und 1,0 s → 0,95 · 1,5 s → 0,475 ·
  1,9 s → 0,027 · **ab 2,0 s → 0** · nach Stufentrennung 0.
- ⚠️ **EIGENER Regler, nicht Teil der Grafikstufe.** Kamerawackeln ist ein Übelkeitsauslöser
  (Motion Sickness), und in der AG sitzen zwei bis drei Kinder vor einem Schirm – wer es
  nicht verträgt, muss es abschalten können, ohne dafür Bildqualität zu opfern. Dieselbe
  Überlegung wie beim entschärften Schweißlicht. Verifiziert: 100 % → Ausschlag 1,43 % der
  halben Bildhöhe, 50 % → 0,60 %, **0 % → exakt 0,00**.
- ⚠️⚠️ Der Pegel läuft über die SIMULIERTE Zeit (`this.t`), damit die `SHAKE_LIFTOFF`
  Sekunden auch Spielsekunden sind. Der Ausschlag wird **nicht pro Frame gewürfelt** – das wäre 60-Hz-Stroboskop wie beim
  alten Schweißlicht; stattdessen drei Sinus mit teilerfremden Frequenzen (6,1 / 11,3 /
  17,7 Hz). Amplitude ∝ `cd` (Kameraabstand), damit der Ausschlag im BILD gleich bleibt.
- ⚠️ In der KARTE und bei Pause aus: dort ist die Kamera ein Kartenausschnitt, und eine
  zitternde Bahnlinie macht das Ablesen von Ap/Pe unmöglich.

### Triebwerksklang: echte Raptor-Aufnahme (`RAPTOR` / `setRaptor` / `updateRaptor`)
⚠️⚠️ **Die Aufnahme läuft NUR, wenn auch wirklich ein Raptor brennt** (`segHasRaptor(seg)` →
Flag `raptor:true` in PARTS: `engRapSL`, `engRapVac`, `superheavy`, `starship`,
`starshipTank`; neues Raptor-Teil = nur das Flag setzen). `raptor.mp3` ist ein
Original-Prüfstandsmitschnitt und lag vorher unter JEDEM Triebwerk – auch unter der
Feststoffbooster-Rakete aus der ersten Stunde und unter dem Ionenantrieb. Zwei Fälle:
- **Raptor brennt** → Aufnahme trägt den Klang, das synthetische Rumpeln (`ensureRumble`,
  braunes Rauschen über WebAudio) liegt nur als LEISER Tiefton darunter: `0,02 + 0,08·Schub`.
- **alles andere** → wie vor der Aufnahme: allein das Rumpeln, im alten, kräftigen Pegel
  `0,04 + 0,14·Schub`. Unter der Aufnahme wäre dieser Pegel zu viel, ohne sie zu wenig –
  deshalb **zwei Formeln, nicht eine**. Verifiziert: Ochse/Zwerg/Donner/Nuklear/Feststoff
  0,18 und keine Aufnahme · Raptor SL/Vac/Superheavy 0,10 + Aufnahme.
- ⚠️ Maßgeblich ist der **FLÜSSIG**-Brand der aktiven Stufe (`liquidBurn`), nicht `burning`:
  Eine Stufe kann gleichzeitig einen Feststoffbooster haben, und wenn nur der noch brennt
  (oder der Raptor-Tank leer ist), klingt das nicht nach Raptor. Die Seitenbooster
  (`boosterBurn`) sind ohnehin immer Feststoff. Getestet: Stufentrennung in BEIDE Richtungen
  schaltet die Aufnahme korrekt an/aus (beim Einschalten mit frischem Spin-up).
Beide Schichten hängen an `Settings.sfx` und an Schub × Luftdichte.
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

## ⚠️⚠️ sRGB-Farbpipeline wurde PROBIERT und wieder entfernt (August 2026)
**Nicht nochmal einbauen, ohne vorher diesen Abschnitt zu lesen.**
Der Renderer läuft bewusst weiter auf three-Standard (`LinearEncoding`,
`NoToneMapping`): Farben gehen roh in den Bildpuffer, obwohl der Bildschirm sie als sRGB
liest. Das ist rechnerisch falsch – Licht wird in der falschen Skala verrechnet, und daher
stammen die vielen »nicht heller als X, sonst brennt es aus«-Deckel in dieser Datei.
Umgestellt war es schon einmal (alle 6 Renderer auf `outputEncoding = sRGBEncoding`, eine
zentrale Umrechnung in `THREE.Color.setHex/setStyle/getHex`, Farbtexturen auf
`sRGBEncoding`, Datentexturen ausgenommen) – und ist auf Bug-Report Simon zurückgebaut
worden.
- **Was es gebracht hat** (gemessen, drei feste Ansichten): ausgebrannte Pixel Rampe
  3,83 → 0,79 % · Orbit 0,56 → 0,02 % · AdminCam 0,06 → 0,01 %. Das »Tipp-Ex-Gebirge«
  zeigte wieder Struktur, Kopfraum vor dem Anschlag **Faktor 2,3**.
- **Was es gekostet hat** (ebenfalls gemessen): **Sättigung −6…−20 %, Kontrast −13…−32 %.**
  Das Bild wirkt flacher und heller – »die Farben waren vorher satter« (Simon), und die
  Messung gibt ihm recht.
- ⚠️⚠️ **Das ist NICHT wegzutunen, und zwar nachgemessen:** Umgebungslicht herunterregeln
  ändert die Sättigung praktisch nicht (Faktor 1,0 → 0,35 bewegt sie von 0,350 auf 0,336,
  also in die FALSCHE Richtung) · Glanzlicht ist es auch nicht (`roughness = 1,
  metalness = 0` liefert exakt dasselbe Pixel) · an den Uniform-Konvertierungen liegt es
  ebenfalls nicht (probeweise unkonvertiert wird es schlechter). Der Grund steckt in der
  Kodierkurve selbst: Sie hebt kleine Kanalwerte viel stärker an als große. Sobald eine
  Fläche mit weniger als voller Stärke beleuchtet wird – also fast überall –, wandert die
  Farbe damit Richtung Grau. Kontrollmessung an der Tiefsee: (33|86|129) → (50|90|112),
  und zwar auch bei abgeschaltetem Umgebungslicht, ohne Lufthülle und ohne Wolken.
- **Die Konsequenz:** Sämtliche Farben des Spiels sind unter der ALTEN Pipeline nach
  Augenmaß ausgesucht worden. In der korrekten Pipeline richtig auszusehen hieße, sie alle
  neu zu wählen – Planetentexturen, Geländerampen, Materialien, Rampen, Halle. Das ist
  keine Nachjustierung von zwei Konstanten, sondern die halbe Bildgestaltung.
- ⚠️ **ACES-Tonemapping macht es nicht besser, sondern schlechter** (auch gemessen):
  Additive Effekte (Flamme, Plasma, Polarlicht, Kometenschweif, Windkanal-Rauch) würden
  Schicht für Schicht durch Trichter und Gamma-Kurve laufen (0,45 → 191 statt 115) und die
  Summe passiert trotzdem im 8-Bit-Puffer. Drei Schichten: heute 255,230,93 (noch Farbe)
  gegen 255,255,255 (reinweiß) mit ACES. Richtig säße der Trichter erst hinter einem
  Float-Renderziel plus Fullscreen-Pass – also genau dem Postprocessing, das für
  Schulrechner verworfen wurde (s. Plasma-Abschnitt), samt Verlust des MSAA auf
  WebGL1-Treibern.
- **Nützlich zu wissen, falls es doch jemand nochmal versucht:** Eigene ShaderMaterials
  laufen NICHT durch den Encoder – three ruft dort weder `toneMapping` noch
  `linearToOutputTexel` auf. Gemessen: ein Custom-Shader, der 0,5 ausgibt, liefert mit und
  ohne `outputEncoding` exakt 128. Meer, Himmel, Sonne, Lufthülle, Polarlicht, Flamme,
  Plasma und Windkanal blieben deshalb pixelgenau (Himmelskuppel: max. Abweichung 0),
  während sich alles andere verschob – genau daraus entsteht der Bruch.
  Ebenfalls gemessen: `scene.background` geht als glClearColor am Shader vorbei, und
  `Color.setStyle` ruft NICHT `setHex` (bei `"#rrggbb"` wird direkt in r/g/b geschrieben).

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
- **Hangar-Schatten:** `VAB.renderer.shadowMap` + `sunLight.castShadow`, Ortho-Fenster ±380
  (bei 2048 px = 0,37 Einheiten ≈ 14 cm/Texel, eine Figur ist ~6 Einheiten hoch). Das Fenster
  muss die GANZE Halle fassen (> HW·√2), sonst brechen die Schatten an den Wänden abrupt ab.
  Die Lichtposition wird auf Länge 700 normiert, damit das Hallendach vor der near-Ebene liegt
  (near 80 / far 1300 umschließen die Hallenecke |(HW,HH,HW)| ≈ 500). ⚠️ **`normalBias` (0,7)
  statt reinem bias** – auf dem 600 Einheiten großen Boden ist reiner bias entweder zu klein
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
4. **Trajektorien als PATCHED CONICS (`Flight.traceOrbit`, EINE Routine für orange UND grün):** Vorhersagepunkte = `p_abs - bodyPos(frameBody, t) + anker`. Periode aus großer Halbachse, RK2 mit Substeps, Horizont ×1.08.
   - ⚠️⚠️ **Der Horizont kommt aus `Flight.orbitHorizon(p,v,t,b)` – EINE Quelle für beide Linien.** Ist die Bahn um `b` HYPERBOLISCH (jeder Ejection-Burn Richtung Nachbarplanet!), gibt es dort keine Umlaufzeit; dann zählt die Bahn um den **MUTTERKÖRPER** nach dem Verlassen der Sphäre (`v∞ = √(2E)` in Richtung der Relativgeschwindigkeit + Bahngeschwindigkeit des Körpers). Vorher fiel die Rechnung auf einen festen Notwert (120 000 s) zurück: Die grüne Linie war ein 1,5-Tage-Stummel neben Leibniz, die Transfer-Ellipse um die Sonne **nirgends zu sehen** (Bug-Report Simon: »der grüne Kreis ist nicht da«). ⚠️ `SUN.soi` gibt es nicht (die Sonne steht nicht in ORBIT_BODIES) – `Math.min(x, undefined)` ist NaN und die alte Rechnung fiel deshalb auch bei jeder Sonnenbahn still auf den Notwert zurück; darum `|| Infinity`.
   - ⚠️⚠️ **Die Bahn ist ein BAND, keine Linie** (`TRAJ_U`/`TRAJ_VERT`/`TRAJ_FRAG`, August
     2026): `LineBasicMaterial.linewidth` ist auf praktisch jeder Grafikkarte wirkungslos
     (ANGLE unter Windows, jedes OpenGL-Core-Profil) – die Vorhersagebahn war deshalb IMMER
     genau ein Pixel breit und vor dem hellen Planeten kaum zu finden (Bug-Report Simon).
     In WebGL1 geht ein dickerer Strich nur als Geometrie: Jeder Bahnpunkt liefert ZWEI
     Scheitel (`aSide` ±1), je zwei Punkte ergeben ein Viereck (Indexpuffer EINMAL gebaut),
     und die Breite spannt der Vertex-Shader in **Bildschirmpixeln** auf – in jeder Zoomstufe
     gleich dick (`TRAJ_W` = 1,7 halbe Breite ⇒ ~3,4 px).
     ⚠️⚠️ Die Laufrichtung kommt als zweiter PUNKT (`aNext`), nicht als addierte
     Weltrichtung: Die Positionen liegen trotz Bezug auf `Flight.pos` bei bis zu 1e9 m, ein
     paar addierte Meter verschwinden in float32 (dieselbe Falle wie bei den Vertices selbst).
     ⚠️ `DoubleSide` ist Pflicht (die Wicklung des Bandes hängt an der Blickrichtung),
     ebenso die logdepthbuf-Chunks mit `common` davor (Log-Z-Puffer). Der letzte Punkt hat
     keinen Nachfolger – seine Richtung wird aus dem vorletzten fortgeschrieben (`finish`).
     ⚠️ `uHalfRes` (pro Frame in `frame()` gesetzt) und `uW` rechnen BEIDE in CSS-Pixeln,
     damit sich das Pixelverhältnis herauskürzt. Kosten gemessen: Schreiben 0,045 ms je
     `predict()` (gegen 3,7 ms Integration), weiterhin 1 Draw-Call je Linie.
   - ⚠️ **HELLIGKEITSVERLAUF statt gleichmäßiger Farbe** (vorn hell → hinten verblassend,
     Wunsch Simon): Eine gleichmäßig gefärbte Ellipse sagt nicht, in welche RICHTUNG man
     fliegt. Gemacht über **Vertex-Farben** (`mkTraj`, Attribut `color`) – kein zusätzlicher
     Draw-Call, und der Verlauf folgt automatisch der adaptiven Schrittweite.
     ⚠️ Das Attribut heißt weiterhin `color`, wird aber im eigenen Shader als
     `attribute vec3 color` deklariert (kein `vertexColors`-Flag – ShaderMaterial). Formel:
     `k = 0,22 + 0,78·(1−f)^1,3` (Sockel 0,22, damit das Ende sich vom schwarzen Hintergrund
     abhebt) plus ein weißer Anteil `0,45·(1−f)^6` nur ganz vorn – das markiert das »jetzt«.
     Gemessen orange: vorn (0,98|0,77|0,51) → Ende (0,21|0,13|0,03).
   - ⚠️⚠️ **Schrittweite adaptiv, aber nur wo nötig:** `dt = total/n`, AUSSER ein solcher Schritt fräße mehr als ein Achtel des örtlichen Umlaufs – dann `clamp(T_lokal/90, dtMax/60, dtMax)`. Ohne das hätte auf einer Fluchtbahn (Horizont 2e7 s ⇒ 33 000 s je Schritt) EIN Schritt im 200-km-Parkorbit mehr Zeit als ein ganzer Umlauf und die Linie wäre frei erfunden. Weil r auf der Hyperbel schnell wächst (T ∝ r^1,5), fängt die Untergrenze das nach ~12 Punkten von allein ein; der Rest des Puffers zeichnet die Ellipse (gemessen: 20 Punkte Hyperbel + 580 Punkte Sonnen-Ellipse). **Die Achtel-Schwelle ist Pflicht:** ohne sie schrumpfte der Schritt auch am Periapsis einer stark elliptischen GEBUNDENEN Bahn (ap 12 000 / pe 200 km) und die gezeichnete Zeitspanne fiel von 108 % auf 93,5 % einer Umlaufzeit – die Ellipse schloss sich gerade noch. Mit Schwelle: 107,7 %, alle Kreis-/Ellipsenbahnen Punkt für Punkt identisch zu vorher.
   - ⚠️ Der örtliche Körper dafür ist `frameBody` (wird unten ohnehin nachgeführt) – ein zweites `bodyAt()` je Punkt wären 600 × 10 `bodyPos()` pro `predict()`. **Linien-Vertices IMMER relativ zu `Flight.pos` in den Float32-Buffer schreiben** und den großen Anteil in `line.position` legen (Float64-Matrixverkettung) – absolute ~1e10-Koordinaten haben in Float32 nur ~1 km Auflösung → Zitter-Bug beim Ranzoomen.
   - ⚠️⚠️ **Der Anker ist NICHT mehr pauschal `bodyPos(frameBody, jetzt)`.** Genau das war der »Orbit schließt sich nicht / ich bin plötzlich auf Fluchtbahn zur Sonne«-Bug: Bei jedem SOI-Wechsel sprang der Anker, und die Linie riss um die Strecke, die der neue Bezugskörper zwischen Wechselzeitpunkt und JETZT zurücklegt. Gemessen: Leibniz↔Monti nach 1 h 1 969 km, nach 17 h 23 511 km (mehr als Montis ganzer Bahnradius von 12 000 km); Leibniz↔Sonne nach 7 d **5 531 491 km**. Der größte Sprung in der grünen Linie lag bei **2 226 735 km** – heute 129 km.
   - **ABSTIEG in einen Mond** (`bHere.parent === frameBody`): Anker = **Geisterposition** `bodyPos(mond,t) − bodyPos(alt,t) + anker_alt` – also dort, wo der Mond bei der ANKUNFT steht. Nachgerechnet exakt stetig (der Übergangspunkt fällt in beiden Rahmen zusammen), und die Begegnungsschleife liegt um ein sichtbares Objekt: `Flight.ghostMesh` + `ghostRing` (türkis) zeigen den »Geister-Monti« (`showGhost`). Beantwortet die eigentliche Frage: *Wo* treffe ich ihn?
   - **AUFSTIEG zum Mutterkörper:** dorthin gibt es keine stetige Linie, also **ZWEITER Linienzug** (`trajLine2` / `nodeTrajLine2`, halbtransparent). Getrennte Objekte, damit three.js keine falsche Verbindung zeichnet. Mehr als zwei Patches werden abgeschnitten (unlesbar).
   - ⚠️ `anchorFor(b,t)` ist die EINE Quelle für den Anker – auch der Δv-Knotenmarker benutzt sie, sonst sitzt der Marker am heutigen Monti und die grüne Bahn an der Begegnungsstelle.
   - ⚠️ **Halbachse für den Horizont auf `body.soi` kappen** (beide Bahnen): Wer nur knapp eingefangen ist, hat rechnerisch eine riesige Ellipse (gemessen nach einem Monti-Einfangbrennen: a = 14 918 km = **6,1× Montis Sphäre**, Periode 1,4e6 s), verlässt die Sphäre aber vorher. Ohne die Kappung lief der Horizont in den 600 000-s-Deckel = 4 Leibniz-Umläufe bei 333-s-Schritten.
   - ⚠️ Bezugskörper der GEPLANTEN Bahn ist der Körper **am Knoten** (`nBody`), nicht `this.body()` unter dem Schiff – sonst falsches µ und falscher Mittelpunkt, sobald Knoten und Schiff in verschiedenen Sphären liegen.
   - Ap/Pe-Marker nur auf Punkten im Ursprungs-Frame des ERSTEN Patches suchen.
   - Der Integrator ist NICHT die Fehlerquelle: 333-s-Substeps ergeben über 7 Tage nur ~40 km Abweichung gegen eine 5-s-Referenz. Wer hier Zeit investiert, investiert sie falsch.
   - ⚠️ **Monti-Orbits schließen sich sichtbar NICHT – das ist korrekt, kein Bug.** Leibniz'
     Gezeitenkraft stört die Bahn, und zwar stark, weil Montis Sphäre klein ist (2430 km).
     Gemessener Anteil an Montis eigener Anziehung: 100 km Höhe 0,2 % · 300 km 0,8 % ·
     500 km 2,2 % · **869 km 7,7 %** · 1500 km 30,8 %. Lücke pro Umlauf entsprechend:
     Monti 308/168 km → 13,5 km, Monti 869/673 km → 71 km; Leibniz 300 km Kreisbahn → 0,1 km.
     Gegenprobe gegen Rechenfehler: dieselbe Bahn mit 20× feinerer Integration ergibt 70,9
     statt 71,1 km – die Lücke ist also Dynamik, nicht Numerik. Didaktisch brauchbar: genau
     deshalb brauchen echte Mondsonden Bahnkorrekturen, und hohe Mondorbits sind instabil.
   - ⚠️ `trajLine2`/`nodeTrajLine2`/Geister in `toggleMap()` mit ausblenden – `predict()` läuft nur bei offener Karte und würde sie sonst nie zurücksetzen.
   - ⚠️⚠️ **Die Fluchtgeschwindigkeits-Warnung nur zeigen, wenn Leibniz auch der DOMINANTE
     Körper ist** (`this.body() === LEIBNIZ`). In Montis Sphäre ist die Leibniz-Zweikörper-
     Energie bedeutungslos: Das Schiff trägt Montis 542 m/s mit sich, Leibniz' Fluchtgeschwindig-
     keit auf Montis Abstand sind nur 767 m/s – die Schwelle reißt damit JEDER normale
     Mondanflug. Die Meldung »Du verlässt Leibniz Richtung Sonnenorbit« kam deshalb mitten im
     Einfanganflug (Bug-Report Simon, Monti-Tutorial).
   - **Periapsis < 0 heißt Aufschlagbahn** – das HUD zeigt dafür den ECHTEN negativen Wert
     in Rot plus 💥 (`fmtPe`), NICHT bloß das Wort »Aufschlag!«. Genau darum hatte Simon
     gebeten: Die Zahl sagt, WIE tief die Bahn in den Körper läuft, man sieht also während
     des Bremsens, wie sie nach oben kriecht – und dass −5 km fast geschafft sind, −180 km
     aber noch lange nicht. Das ist zugleich der Grund, warum ein Einfangbrennen ABSEITS der
     Periapsis »nicht zirkularisiert«: Nachgerechnet im Monti-Anflug – an der Periapsis
     373 m/s → Ap 1988 / Pe 329 km (echter Orbit), dieselbe Bremsung 1500 km zu früh
     603 m/s → Ap 2000 / **Pe −183 km**, also eine Bahn mitten durch den Mond.
     ⚠️ Unterhalb von −0,99·R bleibt es beim »–«: Dort liegt der rechnerische Periapsis-
     Punkt hinter dem Mittelpunkt, die Zahl wäre keine Höhe mehr, sondern Zahlensalat.
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
- ⚠️⚠️ **Die Luftperspektive muss mit der HÖHE dünner werden** (`Flight.hazeScale(alt)`,
  skaliert `groundHaze.k` UND `oceanU.uHaze`). Beide Konstanten waren fest verdrahtet, also
  so stark wie am Meeresspiegel – aus 12 km Höhe ersoff damit die ganze Landschaft in
  weißem Brei, obwohl dort 88 % der Atmosphäre schon UNTER dem Schiff liegen. Gerechnet
  wird der MITTLERE Dichtefaktor entlang eines Sehstrahls von der Kamerahöhe h bis zum
  Meeresspiegel: `(H/h)·(1−e^(−h/H))` mit `H = LEIBNIZ.scaleH` (5600 m). Am Boden exakt 1
  (die alte Optik bleibt unangetastet), 5 km 0,66 · 13 km 0,39 · 16 km 0,33; Untergrenze
  0,10, damit auch oben noch Tiefenstaffelung bleibt (ein völlig dunstfreier 40-km-Blick
  wirkt wie ein Kulissenmodell).
- ⚠️⚠️ **Denselben Dunst bekommt auch die PLANETENKUGEL** (`uGHaze`/`uGHazeK` in
  `planetMaterial`, gesetzt in `frame()`). Das ist der Kitt an der Nahtstelle: Unter 16 km
  liegt die Geländescheibe (r 40 km) über der Kugel, dahinter geht es auf der Kugel weiter.
  Ohne gemeinsamen Dunst endete am Scheibenrand eine gedunstete Nah- und begann übergangslos
  eine gestochen scharfe Fernlandschaft – **das ist der »gewellte Horizont«, den man in
  Wahrheit als KANTE sieht.** `uGHazeK` läuft über 16 → 34 km auf 0 aus, der Wechsel auf die
  »Orbit-Optik« verteilt sich damit auf 18 km Steigflug; aus dem Orbit ist die Kugel wieder
  völlig klar (`uGHazeK = 0` schaltet den Term ganz ab, alle anderen Körper haben ihn nie).
  Gemessener Bildsprung an der 16-km-Grenze: **18,5 → 10,2** von 255 – und damit kleiner als
  die 14,3, um die sich das Bild beim normalen Weiterfliegen (14 → 15,9 km) ohnehin ändert.
- ⚠️ **Eine echte Überblendung der Bodenszene wurde PROBIERT und wieder verworfen.** Sobald
  Wiese/Sand/Meer `transparent` werden, wandern sie in three.js' sortierten Durchgang und die
  Szene zeichnet sich intern anders zusammen – gemessen: schon bei Deckkraft 0,99 änderte
  sich das Bild um Mittel 71 von 255 (gegen 14,2 für den KOMPLETTEN Wechsel auf die Kugel).
  Explizites `renderOrder` hat es nicht geheilt. Wer es nochmal versucht, braucht einen
  eigenen Blend-Pass, keine `transparent`-Flags.
- **Luftperspektive** (`Flight.groundHaze`, via `onBeforeCompile` NUR in dieses Material injiziert – `scene.fog` wäre fatal, die Szene reicht über 1e10 m): ohne sie hat ein Gipfel in 30 km dieselbe Farbe wie die Wiese vor den Füßen und die Landschaft wirkt flach, obwohl die Geometrie stimmt. ⚠️ Entfernung zur KAMERA (`length(mvPosition.xyz)`), nicht zum Anker – sonst liegt beim Blick aus 5 km Höhe auch der Boden direkt unter dem Schiff im vollen 40-km-Dunst. Farbe = `uHorizonCol` des Meeres, damit ferne Berge und ferne See im selben Dunst verschwinden.
- **Bäume** setzt jetzt `Flight.placeTrees` bei jedem Verankern neu (max. 420 Instanzen, `count` kappen!): Position nur wo `forestMask ≥ 0,30`, Höhe = Geländehöhe.
  - ⚠️⚠️ **Die Höhe kommt aus `Flight.terrainMeshH(ost, nord)`, NICHT aus `terrainH`.** `terrainH`
    ist die analytische Funktion, gezeichnet wird aber die Ringscheibe – und deren Dreiecke sind
    bei 10 km Abstand rund **900 m** breit. Dazwischen interpoliert das Mesh LINEAR, die Funktion
    nicht: Ein Baum auf einer kleinen Kuppe steht analytisch hoch, die Dreiecksfläche darunter
    schneidet sie ab. Gemessen am LMG-Startplatz: Median **92 m** zu hoch, Extremwert **887 m**,
    48 von 260 Bäumen hatten überhaupt keinen Boden mehr unter sich (Bug-Report Simon:
    »Bäume schweben in der Luft«). `terrainMeshH` interpoliert **barycentrisch auf dem echten
    Dreieck** – die Gitterlage ist analytisch bekannt (Ring aus `r = GROUND_R·t²`, Segment aus
    dem Azimut), es braucht also weder Raycasts noch eine Suche, und der abgesenkte Seegrund
    ist automatisch mit drin. ⚠️ Bilinear über das Viereck reicht NICHT (die Ringe liegen
    quadratisch gestaffelt und auf Kreisbögen, das Feld ist windschief): damit blieben außen
    bis zu 10 m stehen. Nachher: 419 von 420 Bäumen exakt auf der Fläche, ein Ausreißer 6 m.
  - ⚠️⚠️ **Norden ist im Objektraum der Bodengruppe −z** (`makeBasis(east, up, −north)`, s.
    »Küste«). `placeTrees` benutzte dieselbe Zahl für die Abtastung und fürs Setzen – Höhe UND
    Waldmaske wurden also am **Nordspiegelbild** des Baumes genommen. Deshalb heißt die Variable
    jetzt `nn` (Nord) und gepflanzt wird bei `-nn`. Kostet nichts: 1,6 ms je Aufruf. Damit stehen an der **Polarstation 0 Bäume** – das fällt aus dem Terrainmodell, ist kein Sonderfall. Die Polar-Tönung des Bodens kommt ebenfalls aus den Scheitelfarben (Breitengrad des ANKERS), nicht mehr aus der Rampen-ID.

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

### ⚠️⚠️ Nahfeld-Kachel luftloser Welten (`Flight.updateSurfPatch` / `SURF_PATCH_ALT`)
»Zwischen Schiff und Boden ist ein Spalt« (Bug-Report Simon, Monti-Tutorial) war **kein
Physik-Fehler**: Die Körperkugel ist eine `SphereGeometry(R, 96, 48)`, also ein Vielflach,
dessen ECKEN auf R liegen – die Flächen dazwischen hängen um die Pfeilhöhe
`R·(1−cos(halber Schritt))` durch, bei Monti (R 200 km, Schritt 3,75°) also **107 m**.
Das Schiff setzt bei `|pos| = R` auf (checkContact) und steht damit korrekt; nur die gemalte
Oberfläche liegt bis zu 107 m tiefer. Gemessen am Testpunkt: **118,6 m Spalt** unter einem
59,5 m hohen Lander – das Schiff schwebte zwei Raketenlängen hoch.
- Gegenmittel ist dasselbe wie bei Leibniz (dort deckt die Bodenszene die Kugel ab), nur ohne
  Relief: ein fein aufgelöster **Längen-/Breiten-Ausschnitt derselben SphereGeometry**
  (`phiStart/thetaStart`), gehängt als **KIND des Körper-Meshes**. Damit stimmen UVs,
  Material, Objektraum und Position von selbst – kein zweites Material, keine zweiten
  Shader-Uniforms (`planetMaterial`-Uniforms werden ja pro Frame gesetzt).
- Kein Tiefenstreit: Der Ausschnitt liegt IMMER außerhalb des groben Vielflachs.
- 96×96 Felder auf ~0,04 rad Öffnung ⇒ Durchhang **0,016 m** statt 107 m. Verifiziert per
  Raycast vom Schiffsursprung nach unten: 118,63 m → **0,003 m**.
- Öffnungswinkel `clamp(2,2·√(2h/R), 0,004, 0,30)` (gut das Doppelte des Horizonts), Neubau
  nur bei Körperwechsel, > 0,3·ang Wanderung oder ±35 % Zoomänderung; altes `geometry.dispose()`.
- Sichtbar nur unter `SURF_PATCH_ALT` (8 km) – darüber ist der Durchhang kleiner als ein Pixel.
- Leibniz ist automatisch außen vor (nicht in `MOONS`), Gasriesen per `kind`-Prüfung.

### Feinrelief im Shader (`detailNoiseTex` / `PLANET_GLSL` / `planetMaterial`)
Die Kugeltextur von Leibniz hat 2048×1024 Texel = **1,8 km je Texel**. Aus 200 km Höhe ist
EIN Texel rund 6 Bildschirmpixel groß – genau das war der »sieht aus wie auf dem N64«-Bug-
Report (Simon, Juli 2026): treppige Küsten, matschige Farbflächen, ein Ozean wie blaues
Tonpapier. Global feiner backen hilft kaum (4096² = 32 MB und ~1,6 s Ladezeit und HALBIERT
die Klötzchen nur), also kommt das fehlende Detail aus dem Fragment-Shader – angehängt an
`MeshStandardMaterial` per `onBeforeCompile`, Uniforms liegen in `mat.userData.pU`.
1. **DOMAIN WARPING**: `vUv` wird vor dem Textur-Zugriff um einen tangentialen Rauschversatz
   verschoben. ⚠️ Die Amplitude gehört in die Größenordnung eines TEXELS (aktuell **1100 m**
   grob + 320 m fein): Mit 600 m passierte sichtbar nichts (2 Pixel brechen keine
   Treppenstufe), über ~1,8 km fingen die Kontinente an zu wandern.
2. **ECHTES MEER**: Farbe, Rauheit und Sonnenglanz rechnet der Shader stufenlos aus einem
   **Küsten-Abstandsfeld** (`uAux`, s. u.) – ein Abstandsfeld ist zwischen zwei Texeln
   praktisch linear, die Wasserkante bleibt also bei JEDEM Zoom scharf, während eine gemalte
   Farbkante auf 1,8 km verwäscht. Der Ozean ist ~65 % der Oberfläche, das ist der halbe
   Gewinn. Kantenbreite = `max(240 m, Pixel-Fußabdruck·1,6)` → analytisches Antialiasing.
3. **BUMP**: derselbe Rauschgradient verbiegt die Normale (Reliefhöhe 2600/700 m, an Land mit
   der Hangneigung aus `uAux.b` gewichtet, auf See nur 13 % = Wellenglitzer).
4. **LUFTHÜLLE**: blauer Dunst zum Rand hin, nur auf der Tagseite, und erst ab ~36 km
   Kamerahöhe (darunter macht das die Himmelskuppel).
- ⚠️⚠️ **`pDetail` tastet DREIFACH PLANAR ab** (Projektion auf yz/xz/xy, Gewichte |n|⁴). Nur so
  gibt es weder eine Naht an der Datumsgrenze noch Gequetsche an den Polen. Kosten: 3 Textur-
  zugriffe je Oktave, 2 Oktaven → 6. Auf »Niedrig« schaltet `#define PFINE 0` die feine ab.
- ⚠️⚠️ **Oktaven-LOD ist Pflicht** (`smoothstep(4, 11, 0.25·L/fp)`, fp = Meter je Bildschirm-
  pixel): Eine Kachel WIEDERHOLT sich alle L Meter, und aus der Ferne liest das Auge daraus
  ein regelmäßiges Gitter – im Test ein deutliches Rautenmuster über der ganzen Wolkendecke
  aus 1900 km Höhe. **Mipmapping hilft dagegen NICHT**, es glättet nur INNERHALB der Kachel.
- ⚠️ Der gespeicherte Gradient ist auf **Effektivwert 1** normiert (nicht auf sein Maximum),
  sonst hinge die Stärke aller Effekte an einem einzigen Ausreißer-Texel und die Amplituden
  im Shader wären Rätselraten. Erster Wurf teilte den Gradienten zusätzlich durch die
  Kachelgröße – damit schrumpfte der Warp auf **0,4 m** und man sah exakt nichts.
- ⚠️⚠️ **`customProgramCacheKey` setzen!** three cacht Shader-Programme mit
  `onBeforeCompile.toString()` als Schlüssel – der QUELLTEXT ist bei `sea:true` und
  `sea:false` identisch, nur die Closure-Variable unterscheidet sich. Ohne eigenen Schlüssel
  bekommt der Mond das Ozean-Programm des Planeten. Fehler tritt erst beim ZWEITEN Körper auf.
- ⚠️ `uCam` (Kamera im Objektraum) und `uPx` müssen vor JEDEM render() gesetzt werden – wie
  bei Meer und Wolken, wegen der Booster-PiP: `Flight.setViewUniforms`. In der **Admin-Cam**
  drehen sich die Meshes (Schaukasten!), dort werden Kamera und Sonne mit `-rotation.y`
  zurückgedreht, sonst wandert der Meeresglanz über die Kugel.
- **Wer es noch bekommt:** alle festen Welten (`kind !== "gas"`), also auch Monti – dessen
  1024er Textur sind 1,2 km je Texel und aus 30 km Orbit genauso klotzig. Gasriesen bewusst
  NICHT: kein Relief, und der Warp würde die Bänder ausfransen.
- **`uAux`** (nur Leibniz, 2048×1024, gebaut in `makeBodyTexture`): R = vorzeichenbehafteter
  Küstenabstand ±12 km (`lh/|∇lh|`), G = Tiefe/Höhe (0,5 = Meeresspiegel), B = Hangneigung.
  ⚠️ **Alpha bleibt überall 255** – ein Canvas speichert intern PREMULTIPLIZIERT, mit A < 255
  kämen aus RGB gerundete, zu dunkle Werte zurück und die Daten wären Müll. Gilt genauso für
  die Rausch-Kachel (`detailNoiseTex`, R = Höhe, G/B = Gradient).
- **Kosten gemessen:** Leibniz-Textur 410 → **494 ms** (einmalig, gecacht), Rausch-Kachel
  19 ms, ~11 MB VRAM extra. Rendern bei formatfüllendem Planeten (1792×1007): **0,93 ms je
  Frame** gesamt, davon der Löwenanteil die Wolkenschale.

### Wolkenschale & Lufthülle von Leibniz (`cloudShellMaterial` / `ATMO_FRAG`)
- **Wolken**: `makeCloudTexture` bekam **Domain Warping schon auf der CPU** (das Koordinaten-
  feld wird mit grobem Rauschen verbogen) – ohne das sind die Wolkenbänder gerade Streifen
  statt Wirbel. Der Shader verzieht zusätzlich im Meter-Maßstab und moduliert die Deckung.
  - ⚠️ Der Warp muss **deutlich kleiner als ein Texel der Wolkenkarte** (3,7 km) bleiben:
    Mit 2600 m wurde die Decke nicht feiner, sondern zerschreddert – wie Kratzer im Bild.
  - ⚠️ Die Deckungs-Modulation (`uWisp`) läuft **nur über die grobe Oktave**. Mit der feinen
    bekam die Decke aus 40 km Höhe ein gleichmäßiges Griesel-Muster (»Hüttenkäse«).
  - ⚠️ **Bump sparsam** (1400/340 m): Eine Wolkendecke ist von oben WEISS; jedes Grad
    Normalen-Neigung frisst bei tiefer Sonne Helligkeit, mit 3,4 km sah sie schmutzig-grau aus.
  - **Wolkenschatten** auf der Oberfläche macht der PLANETEN-Shader: Punkt entlang der Sonne
    auf die Schale projizieren, um `-uCloudRot` zurückdrehen, Deckung abtasten.
- **Lufthülle** (`ATMO_FRAG`): statt einer Kugel mit fester Deckkraft wird pro Pixel die
  **Weglänge des Sehstrahls** durch die Atmosphäre gerechnet (Kugelschnitt, am Planeten
  abgeschnitten) plus exponentieller Dichteabfall über den Stoßparameter (Skalenhöhe 30 %).
  - ⚠️ Ohne den Dichteabfall fällt die Deckkraft am Rand wie eine WURZEL ab – sichtbarer
    harter Bogen, der Planet sitzt in einer Seifenblase.
  - ⚠️ Die **Kugel ist 4 % größer als die Lufthülle**, die der Shader rechnet: Ein 64-seitiges
    Polyeder liegt innerhalb seiner Kugel, an seiner Silhouette hätte der Strahl noch ~66 km
    Luftweg vor sich – genau dort schnitt die Geometrie ihn ab (zweiter harter Bogen).
  - ⚠️ `uI` fährt unter ~150 km auf 0: von innen macht die Lufthülle die Himmelskuppel
    (SKY_FRAG), sonst liegen zwei Atmosphären übereinander.

### Polarlicht über Leibniz (`AURORA_*` / `buildAurora` / `updateAurora`)
Ein Polarlicht-**Oval um jeden Pol**, planetenfest und als KIND des Planeten-Meshes
aufgehängt (Ursprung und Achse stimmen damit von selbst, und es wandert mit Leibniz um die
Sonne). EIN Objekt deckt beide gewünschten Fälle ab: von der **Polarstation »Skihütte«**
(86° N) steht es nachts hoch am Südhimmel, **beim Überflug** sieht man es von oben als
leuchtenden Kranz um den Pol – wie auf den ISS-Fotos.
- **Didaktik:** Teilchen des Sonnenwinds laufen entlang der MAGNETFELDLINIEN und treffen die
  Luft dort, wo diese in den Boden tauchen – also in einem Ring um die Pole und nicht am
  Äquator. Deshalb sind die Vorhänge nach außen geneigt (`uTilt`), leuchten unten grün
  (Sauerstoff, ~100 km) und oben rot/violett, und ihre **Unterkante ist scharf** (dort endet
  die Teilchenbahn in der dichteren Luft), die Oberkante fasert aus.
- ⚠️⚠️ **Sichtbar nur auf der Nachtseite, und das entscheidet der SHADER pro Fragment**
  (`uSunDir` gegen die Bodennormale des Punktes), nicht die CPU. Nur so stimmt beides
  gleichzeitig: Der Ring bricht beim Überflug genau am Terminator ab, und an der Polarstation
  geht das Licht mit der Spieluhr an und aus. Verifiziert: 00:00 Uhr Vorhänge am Himmel,
  12:00 Uhr nichts, Äquator-Raumhafen auch nachts nichts (die Pole liegen hinterm Horizont).
- ⚠️⚠️ **`uSunDir` ist `Flight.groundSunDir` – die SPIELUHR-Sonne, nicht die echte Richtung.**
  Bodennah kennt das Spiel zwei Sonnenstände (s. »Sonnenstand & Licht bodennah«); mit der
  echten Richtung leuchtete das Polarlicht an der Rampe mittags und wäre nachts aus. Exakt
  dieselbe Falle wie bei `sunlit()`.
- ⚠️⚠️ **Die Kolatitude ist der wichtigste Regler** (`AURORA_COL0/1` = 0,13…0,33 rad ≈
  7,5°…18,9°). Die Polarstation liegt bei 4° Kolatitude, das Oval MUSS deutlich weiter
  draußen liegen: Der erste Wurf (5,7°…14,9°) legte die Station praktisch mitten hinein, und
  dann sieht man nur noch eine leuchtende DECKE über sich statt eines Vorhangs. Jetzt sind es
  37…156 km Entfernung, der Vorhang steht 21°…58° über dem Südhorizont.
- ⚠️⚠️ **Höhe `AURORA_H0/H1` = 30…95 km über Grund – der wichtigste Regler für die
  SILHOUETTE von außen.** Bis August 2026 standen dort 60…170 km; bei Leibniz' Radius von
  600 km sind das **10 % bis 28 % des Planetenradius**, und beim Überflug ragte das Oval
  damit als **KRONE** über den Horizont (Bug-Report Simon, mit ISS-Foto zum Vergleich: dort
  liegt das Band flach auf der Lufthülle und steht nicht davon ab). Zum Maßstab: Auf der
  Erde leuchtet ein Polarlicht in 100–400 km über 6371 km Radius, also bei 1,6 % bis 6 %.
  Jetzt 5 % bis 15,8 %. Ganz auf Erd-Verhältnisse herunter geht es nicht, ohne das
  Polarlicht in die dichte Luft zu legen – Leibniz' Atmosphäre ist mit 70 km von 600 km
  proportional siebenmal dicker als die der Erde.
  Gemessen als Überstand über den Planetenrand (Sichtwinkel aus 350 km Höhe, Rand bei
  39,2°): Oberkante **15,0° → 7,9°**, Unterkante 4,8° → 2,4° – also **48 % weniger Krone**.
- Dazu gehören zwei weitere Anteile am »Kronen«-Eindruck, beide mit korrigiert:
  **`uTilt` 0,055 → 0,018** (die Neigung nach außen addiert sich beim Blick von außen auf
  die Höhe und ließ die Vorhänge oben auseinanderlaufen wie Zacken) und ein **tiefer
  liegendes, schneller ausblendendes Helligkeitsprofil** (`top` 0,26…0,56 statt 0,35…0,80,
  Ausblenden ab `top·0,45` statt `top·0,55`) plus ein heller Saum an der Unterkante –
  genau die scharfe helle Kante, die das ISS-Bild ausmacht.
- ⚠️ **Grün muss dominieren:** Der Farbwechsel nach Rot/Violett beginnt jetzt bei `vV`
  0,62 statt 0,30. Vorher war der halbe Vorhang rot-violett; auf echten Aufnahmen ist das
  der schwache Saum ganz oben, nicht die halbe Erscheinung.
- ⚠️ Von der Polarstation bleibt es trotzdem ein Vorhang (verifiziert, Bild bei Mitternacht):
  Er steht dort zwischen 11° und 69° über dem Südhorizont (vorher 21°…58°).
- ⚠️ **Gegen die Regelmäßigkeit** (erste Fassung sah aus wie ein Strichcode über dem halben
  Himmel): (a) die Strahlen-Phase wird mit einer groberen Welle verzogen (Domain Warping, wie
  bei Wolken und Planetentextur), (b) zwei langsame Wellen löschen das Band streckenweise ganz
  aus (`cover`), (c) Unter- UND Oberkante wellen entlang des Ovals – bei fester Höhe ist die
  Unterkante ein LINEAL quer über den Himmel.
- ⚠️ **Kantenaufhellung** (`edge = 1/(0,40 + 0,85·µ)`) ist kein Schnickschnack: Ein Vorhang
  ist eine dünne LEUCHTSCHICHT, wer flach hindurchsieht, blickt durch mehr Gas – dieselbe
  Rechnung wie beim Plasma-Nachlauf. Ohne sie sieht das Band aus wie bemaltes Blech.
- ⚠️ Alpha klein halten (additiv, DoubleSide): Endfaktor **0,40**. Dieselbe Lehre wie bei
  Flamme, Plasma und den Windkanal-Rauchfahnen.
- ⚠️ Die Aktivität (`uI`, ~4-min-Schwebung) läuft über die **Effekt-Uhr `Flight.fxT`**
  (Echtzeit), nicht über `this.t`: an der Simulationszeit gekoppelt würde das Polarlicht bei
  Warp 100.000 im Sekundentakt an- und ausblitzen.
- ⚠️ In der Karte aus, und ab 60 Planetenradien Abstand ebenfalls – dort ist der Kranz ein
  Subpixel und kostet nur Füllrate.
- Kosten gemessen (Polarstation, Nacht, Vorhänge formatfüllend): **0,46 ms je `frame()`
  gegen 0,36 ms ohne**, also 0,1 ms. 2 Draw-Calls, Geometrie geteilt (3 Bänder × 168 × 12).
- ⚠️ GLSL-Falle, hier zum zweiten Mal getreten: **`patch` ist ein reserviertes Wort** – eine
  Variable dieses Namens lässt den Fragment-Shader gar nicht erst kompilieren (Symptom:
  `INVALID_OPERATION: useProgram: program not valid` in Endlosschleife, Effekt unsichtbar).

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

### Entdeckung per Teleskop – ZWEI Stufen (`telescopeUp`/`surveyUp` / `bodyKnown` / `smallBodyKnown`)
In der Karriere sind Kepler, Huygens (+ Monde), Newton und ALLE Kleinkörper anfangs `???` –
2D-Karte und Universum-Karten zeigen nur einen szintillierenden Lichtpunkt. Sichtbar bleiben
mit bloßem Auge nur Leibniz, Monti und Minzi. Zwei getrennte Teleskope, zwei Flags,
zwei Missionen – **Planeten und Kleinkörper werden bewusst NICHT gemeinsam aufgedeckt**:
- **`Game.telescope`** ← Part `satT` »Weltraumteleskop »Weitblick«« (Tech `fine`, 780 🪙),
  ausgesetzt [N] in einem Leibniz-Orbit mit **Pe > 250 km**. Mission `scope1`. Deckt
  `FAR_BODIES` auf (Kepler, Huygens + 3 Monde, Newton). Didaktik: Warum steht Hubble im All?
  Weil die Luft jedes Bild verwackelt.
- **`Game.survey`** ← Part `satD` »Durchmusterungs-Teleskop »Rundumblick««(Tech `fine`, 700 🪙),
  ausgesetzt [N] in einem **POLARORBIT** (`SURVEY_PE` 200 km Pe, `SURVEY_INC` 75° Inklination –
  EINE Quelle für Teil-Text, Mission, Zielring und Auswertung). Mission `scope2` (req `scope1`).
  Deckt `ASTEROIDS` auf (Gauß, Emmy, Halley, Komet Whipple). Didaktik: Ein Asteroid ist selbst
  im größten Spiegel nur ein Pünktchen – man findet ihn nicht am Bild, sondern daran, dass er
  zwischen zwei Aufnahmen WANDERT. Dafür muss der Suchstreifen die ganze Himmelskugel
  überstreichen, und das kann nur eine Bahn über die Pole (echte Vorbilder: NEOWISE, NEO
  Surveyor). Am einfachsten von der Polarstation »Skihütte« (Tech `padPolar`, 86° N).
  ⚠️ Der Ost-Start allein reicht nicht – die Bahn muss AUCH hoch genug sein; die
  Fehlermeldung beim Aussetzen unterscheidet »zu tief« und »zu wenig geneigt«.
- ⚠️⚠️ **`Game.sandbox` ist ein SITZUNGS-Zustand, kein Fortschritt.** Es wird beim Wechsel ins
  Hauptmenü (`UI.show("menu")`) und beim Laden (`migrateGame`) auf `false` gesetzt. Sonst
  blieb es nach einem Klick auf »🛠️ Sandbox« stehen, und weil `telescopeUp()`/`surveyUp()`
  in der Sandbox alles aufdecken, war im Universum-Bildschirm anschließend jede ???-Welt
  sichtbar – einmal Sandbox angetippt und der halbe Karriere-Reiz war weg (Bug-Report Simon).
  Zusätzlich schrieb `autoSave()` `sandbox:true` in den Spielstand: Der Nebel kam damit auch
  nach einem Browser-Neustart nicht zurück, deshalb heilt `migrateGame` Alt-Saves mit.
  Gemessen: frische Karriere 50 ???-Einträge → Sandbox 0 → zurück im Menü wieder 50.
- Sandbox/Tutorial sind immer offen. `Flight.scopeUp`/`Flight.surveyUp` sind die Flugflags
  (Reset in `start()`), `state.scopeUp`/`state.surveyUp` die Missions-Checks.
- ⚠️ `migrateGame` schenkt Bestands-Saves die Entdeckung, wenn sie schon bei Minzi waren
  (`telescope`) bzw. schon Kleinkörper gescannt haben (`survey`) – sonst nimmt ein Update
  ihnen rückwirkend den halben Bildschirm weg. **`scope1` allein schaltet `survey` NICHT
  frei**, sonst hätte jeder Bestandsspieler die neue Mission schon bei ihrer Einführung erledigt.

#### ⚠️ Die Admin-Cam darf nicht spoilern (`AdminCam.isKnown` / `refreshFocusBtns`)
Die Admin-Cam hatte den ganzen ???-Nebel unterlaufen: Alle Fokus-Knöpfe waren immer da und
alle Meshes standen in der Szene. Jetzt:
- `refreshFocusBtns()` (bei jedem `open()`, weil zwischen zwei Besuchen ein Teleskop
  ausgesetzt worden sein kann) macht aus unentdeckten Knöpfen ein gesperrtes »❔ ???« mit
  `title`-Hinweis. Der Knopf bleibt bewusst STEHEN – man soll sehen, dass da noch etwas
  wartet, nur nicht was. Dafür merkt sich `this.focusBtns` `[körper, btn, label, hint]` und
  der Grundstil liegt in `btn.dataset.base`.
- `setFocus` hat einen eigenen Guard, und ein Fokus auf einem unbekannten Körper fällt auf
  LEIBNIZ zurück – `AdminCam.focus` überlebt sonst den Wechsel Sandbox → Karriere.
- ⚠️⚠️ **Meshes/Bahnlinien/Kometen-FX werden in `frame()` unsichtbar geschaltet, NICHT in
  `refreshFocusBtns()`**: (a) ein gesperrter Knopf allein genügt nicht, weil die Kamera bis
  2e11 herauszoomt und dann das halbe Sonnensystem im Bild läge; (b) `updateCometFx()` setzt
  `visible` pro Frame selbst – in refreshFocusBtns gesetzt ginge die Sperre sofort wieder auf.
  Deshalb hängen die Kleinkörper-Bahnlinien jetzt als 4. Element in `astMeshes`.
- `#admLocked` unten rechts sagt, WAS noch fehlt und WOMIT man es findet.

## Raumstation »Große Pause«
`STATION` + `stationPos(t)`/`stationVel(t)`: exakter 100-km-Kreisorbit um Leibniz (on rails), immer da (Karriere/Sandbox/Tutorial). Docking: Part `dock`, Taste **[L]**: < 30 m & < 3 m/s = sofort; **30–200 m (rel < 25 m/s) = Docking-Autopilot** `autoDock`/`updateAutoDock` (RCS-Magie: Sollgeschw. min(3, d/25) auf die Station zu, dockt < 26 m via `dockNow()`; [L] bricht ab; übersteuert Handsteuerung, Warp≤2, Abbruch > 500 m). Angedockt = `Flight.docked`: Schiff folgt Station on rails (`dockOffset`). SAS-Modus `"tgt"` (ZIEL-BREMSE, < 50 km) bremst relativ zum **gewählten Ziel** (sonst Station). Türkiser ◆-Navball-Marker < 50 km (folgt `Flight.target`), HUD-Zielzeile < 400 km, Kartenmarker »Große Pause«. **Rosa ✛ = Anflug-Assistent** (drawNavball, 40 m–50 km): optimale Brennrichtung `norm(dirZiel·vWant − relVel)` mit `vWant=clamp(d/60, 2, 45)` – Nase draufhalten + Schub = automatisch lenkendes UND bremsendes Rendezvous ohne Vorbeischießen (getestet: 3 km→190 m in ~3,5 min, Ankunft 3,5 m/s). Rendezvous-Tutorial nutzt NUR noch das ✛ (keine ZIEL-BREMSE-Choreografie mehr).
- **Orbit-Ziele & Startfenster:** Auf der Rampe wählt **[Z]** Ziele durch (NUR auf der Äquator-Rampe "eq" – sonst Guard in `cycleTarget` + HUD-Hinweis; `Flight.target` via `targetList()` = Station + geparkte LEIBNIZ-Tanker, im Flug dazu Planeten/Monde mit Bordcomputer). `nextLaunchWindow(tg)`: Rampe ist inertial fix, Fenster = Ziel bei **2π−0.52 + `padStationAngle(pad)`** (≈30° hinter der Rampe; seit der prozeduralen Küstensuche liegt die Rampe nicht mehr bei Länge 0! Verifiziert: Ziel steht beim Start auf 330,2°). `clockStr(t)` = Spieluhr ab 08:00 (HUD "Uhrzeit"). `launchWindowMiss` wird in **`stage()`** gesetzt (NICHT im step-landed-Zweig – stage() setzt landed/flew selbst!). HUD rechts: Pad = Countdown/"FENSTER OFFEN", Flug = Phasenwinkel-Tipps (voraus→niedriger fliegen, hinten→höher). `canWarp`: auf der Rampe (landed) voller Warp. Tutorial id "launchwindow" (Start→Fenster→Orbit→Phase→Autopilot-Docking).

## Interplanetare Reisen (`transferWindow` / `ejectionWait` / `findEncounter` / `travelPanel`)
### Bordcomputer »Rechenknecht« (Teil `nav`, Tech `navcomp`, Flag `navcomp`)
Die Transferrechnerei ist **an ein Bauteil gebunden**: `Flight.hasNavComp()` prüft, ob im
Stack ein Teil mit `navcomp:true` steckt (`nav` – oder ein **Starship**, dort ist er ab Werk
drin). Nur dann liefert `targetList()` überhaupt `kind:"body"`-Einträge, und nur dann gibt es
Transferfenster, Zündpunkt und Begegnungsanzeige.
- ⚠️ **Bewusst NICHT für Station/Tanker/Leibniz-Orbit.** Wer zur »Großen Pause« will, soll
  nicht an einer Technologie hängen – das ist der Kern des frühen Spiels. Der Computer
  schaltet ausschließlich die *fremden Welten* frei (auch Monti; braucht man dort selten,
  aber die Regel bleibt so einfacher erklärbar).
- Tech `navcomp` (55 🧪, req `advProp`+`mission2`) liegt damit in **Spalte 4**, derselben wie
  »Erkundung« (Spalte = Abhängigkeitstiefe, s. `renderTech`). ⚠️ Der Nebenverdienst
  `jobBlueprints` hängt an der festen id-Liste crewed+payload+heavy+explore – der neue Knoten
  ändert daran nichts (Beschreibung dort meint diese vier, nicht »alles in der Spalte«).
- ⚠️ `type:"computer"` gehört in **`BAY_FITS`** (passt in Servicebuchten) und in
  `CATS`→`elec`. Gegenprobe nach jeder Teile-Änderung: Summe der `CATS[].ids` muss
  `Object.keys(PARTS)` sein (getestet: 51/51). `bluntOf` braucht keinen Eintrag – der
  Standard 0,95 (flache Stirn) stimmt; in einer Bucht wird daraus ohnehin `bayCap`.
- Wer ohne Computer [Z] bis ans Listenende durchdrückt, bekommt den Hinweis, dass es
  Planeten-Ziele gibt und woran es fehlt – sonst wäre die Sperre unsichtbar.

»Ich wollte nach Minzi, blähe den Leibniz-Orbit auf, erreiche Fluchtgeschwindigkeit – und
lande in einem Sonnenorbit, der Minzi nie trifft« (Bug-Report Simon). Das war kein Physik-
Fehler: Der Weg war da, es fehlte jedes WERKZEUG, ihn zu treffen. Vier Bausteine, zusammen
die Antwort auf »wie macht KSP das?«:
1. **Planeten & Monde sind ZIELE** (`targetList()` liefert `kind:"body"`, nur im Flug, nur
   `bodyKnown` und nur mit **Bordcomputer** an Bord; der Körper, in dessen Sphäre man steckt,
   fehlt bewusst). Taste [Z].
2. **`transferWindow(tb)`** – Hohmann: `a=(r1+r2)/2`, Flugzeit `tT=π√(a³/µ)`, Sollphase
   `θ=π−ω_Ziel·tT`, Wartezeit aus der relativen Winkelgeschwindigkeit. Zwei Fälle, EINE
   Formel: Ziel umkreist unseren Körper (Leibniz→Monti, das SCHIFF ist Abflugkörper) bzw.
   Nachbarplanet (Leibniz→Minzi, dann kommt über `√(v∞²+v_flucht²)` die Fluchthyperbel
   dazu). Verifiziert Leibniz→Minzi: Δv 1002 m/s, v∞ 896 m/s, Flugzeit 74,8 d, synodisch
   231,8 d – von Hand nachgerechnet identisch.
3. **`ejectionWait`** – der »Ejection Angle« der KSP-Foren: Zwischen Zündpunkt und
   Sphärenrand dreht das Schiff auf der Hyperbel noch um `ν∞=arccos(−1/e)` weiter, der Burn
   muss also um ν∞ VOR der Bahnrichtung des Planeten liegen. ⚠️ Ohne das zeigt der schönste
   1000-m/s-Burn in die falsche Ecke des Sonnensystems. HUD zeigt daraus EINE Zahl:
   »Zündung in …« (Fenster + Zündpunkt zusammengerechnet).
4. **`findEncounter`** – dichteste Annäherung ans Ziel, türkiser Marker »Begegnung« + HUD.
   Das ist das Werkzeug zum Treffen: Knotenwert drehen, Zahl fallen sehen.

### 🧭 Auto-Knoten: der Bordcomputer setzt den Knoten selbst (`planTransferNode`, **[⇧K]**)
Bis August 2026 rechnete der Computer Zündzeitpunkt und Δv nur AUS – eintragen musste man
beides über die ±-Knöpfe, und 1000 m/s sind 10 Klicks in der richtigen Zeile. Genau dort
scheiterten schwächere Schüler*innen, obwohl sie alles verstanden hatten (Wunsch Simon).
Knopf »🧭 Auto-Knoten [⇧K]« (nur mit Bordcomputer, im Flug, mit Planeten-/Mondziel –
`updateButtons`). Nachjustieren von Hand bleibt möglich, ist nur nicht mehr Pflicht.
- Zwei Fälle, genau die beiden, zu denen auch `travelPanel` rät: **noch im Parkorbit** →
  Hohmann-/Ejection-Burn am Zündpunkt (`tw.wait + ejectionWait`, prograde) · **schon
  unterwegs** → Bahnkorrektur auf halbem Weg zur Begegnung.
- ⚠️⚠️ **Welcher Fall vorliegt, entscheidet `Flight.onTransferTo(tb)` – NICHT
  `this.body() === tb.parent`.** Bei einem MOND des Körpers, den man gerade umkreist
  (Leibniz→Monti), stimmt Letzteres schon im 200-km-Parkorbit: Der Computer plante
  dann eine »Bahnkorrektur« quer zur Bahn (737 m/s, Annäherung 7 635 km) statt des
  Abflug-Burns – »der Computer funktioniert nicht, trifft Monti nicht und packt zu
  wenig Δv rein« (Bug-Report Simon). `onTransferTo` prüft, ob die eigene Bahn die
  ZIELBAHN überhaupt schon erreicht (`rAp > 0,85·orbitR && rPe < 1,15·orbitR`).
  Verifiziert: Monti aus dem Parkorbit → 780 m/s prograde, Annäherung **311 km**
  (Sphäre 2 430 km); schon auf dem Transfer → Korrekturzweig, 11 m/s.
  (Die Annäherung war vor der Zielperiapsis, s. `aimPeriapsis`, 186 km – der
  Computer zielt jetzt bewusst nicht mehr auf den Mittelpunkt.)
- ⚠️ **`Flight.leavingSphereTo(tb)`**: Direkt nach dem Ejection-Burn steckt das Schiff
  noch auf einer Fluchthyperbel IN Leibniz' Sphäre. `transferWindow` rechnet den
  Parkorbit dort als Kreisbahn und schlug ein neues Fenster in **231,8 Tagen** vor.
  Jetzt sagen Auto-Knoten UND Reiseplaner stattdessen: erst mit [.] hinausfliegen.
- ⚠️⚠️ **Optimiert wird NUR die Korrektur unterwegs.** Beim Ejection-Burn ist die dichteste
  Annäherung rund um die 1002 m/s praktisch konstant (gemessen 900 → 4,99 Mio. km, 996 →
  889 351 km, **1002 → 967 636**, 1243 → 901 363, 1400 → 1,06 Mio. km), weil der Rest-Fehler
  Minzis 3°-Bahnneigung ist. Ein Koordinatenabstieg auf diesem flachen, verrauschten Tal
  wanderte im Test auf **1243 m/s = 24 % mehr Treibstoff für nichts** – und im HUD stünde
  eine andere Zahl als im Reiseplaner daneben. Also: analytischer Hohmann-Wert, 11 ms.
  Die Korrektur unterwegs ist der Hebel: gemessen **975 193 km → 238 km** (Minzis Sphäre ist
  6 066 km) mit 432 m/s, ~0,5 s Rechenzeit, Achsen nor/pro/rad in zwei Durchgängen.
- ⚠️⚠️ **Der Abstieg zielt auf `aimPeriapsis(b)`, NICHT auf den Mittelpunkt.** Bewertet wird
  `|d − rAim|` statt `d`. Vorher lief die Korrektur im Minzi-Anflug auf **51 km** herunter –
  bei einem Körperradius von 60 km, also ein Volltreffer statt eines Vorbeiflugs. Solange es
  nur ums Ankommen ging, fiel das nicht auf; mit dem Einfang-Burn (s. u.) wird daraus sofort
  eine Bremsung in den Boden, denn gebremst wird an genau dieser Periapsis. Weit draußen
  ändert sich nichts (|d − rAim| ≈ d, wenn d in Millionen km liegt) – der Zielwert wirkt erst
  im Endanflug. Formel: `max(R·1,5 + Atmo, min(0,08·SOI, R·4))`, also tief genug für den
  Oberth-Effekt und hoch genug für die Anflug-Streuung (~1000 km bei Minzi); der `R·4`-Deckel
  verhindert, dass ein Newton-Anflug (Sphäre 618 000 km) auf 49 000 km Höhe zielt, wo ein
  Bremsburn fast nichts mehr bringt. Ergibt: Minzi 180 km · Monti 100 km · Cassini 130 km ·
  Newton 2700 km. ⚠️ Die angezeigte »Dichteste Annäherung« bleibt die ECHTE Distanz
  (`bDist`), nicht der Bewertungswert – sonst stünde im HUD eine Zahl, die niemand versteht.
- ⚠️⚠️ **`propagateTo(tEnd)` liefert `fine` mit – ohne das optimiert man gegen Müll.** Die
  Schrittzahl ist gedeckelt (2200, sonst friert ein Knopfdruck das Spiel ein), also wächst
  die Schrittweite mit dem Vorhersagefenster. Steht das Schiff im 40-Minuten-Parkorbit und
  der Zündpunkt liegt 35 Tage voraus, sind das 790-s-Schritte auf 570 Umläufe: gemessen
  landet die Bahn **1,4e10 m** daneben, das Schiff ist im Modell längst davongeflogen. Bei
  `!fine` wird der Knoten trotzdem gesetzt (der Zeitpunkt stimmt ja), aber ohne Feinschliff
  und mit dem Hinweis, mit [.] vorzuspulen und [⇧K] dann nochmal zu drücken.
- ⚠️ `propagateTo` benutzt **exakt dieselbe Schrittweiten-Formel** wie die Knoten-Propagation
  in `predict()` (`max(span/2200, min(span/400, T_lokal/150))`). Sonst verspricht der
  Computer eine Annäherung, die im HUD dann nicht auftaucht.
- ⚠️ `Flight.nodeDeltaV(p,v,t,node)` ist die EINE Quelle für »Prograde/Normal/Radial → Welt-
  vektor« (Optimierer UND grüne Vorschau). Normal bleibt eine reine Ebenen-DREHUNG.

### 🛑 Ankunft: Einfang- und Rundungs-Burn (`captureSituation` / `planCaptureNode`, **[⇧K]**)
Der Computer rechnete bisher nur den HINWEG (Ejection + Korrektur). Am Ziel angekommen
stand man mit einer Fluchtbahn da und musste den Bremsburn von Hand bauen – und [⇧K]
antwortete dort sogar »Von hier aus gibt es kein Transferfenster, erst zurück nach
Leibniz« (Wunsch Simon). Jetzt ist [⇧K] durchgehend derselbe Knopf: **erst Kurs, dann
Bremsen.** `planTransferNode` fragt deshalb ZUERST `captureSituation()`.
- **Die Reihenfolge ist die eigentliche Logik**, nicht ein Detail: Einen Bremsburn kann man
  nicht ausrechnen, solange man noch bei Leibniz hängt. Drei Zustände:
  - **`capture`** – Fluchtbahn (oder Ellipse bis fast an den Sphärenrand) um eine fremde
    Welt UND das Schiff fällt auf sie zu (`r·v < 0`). Auch schon von außen, sobald der
    Abstand unter **`CAPTURE_RANGE` = 5 Sphärenradien** liegt und eine Begegnung INNERHALB
    der Sphäre verzeichnet ist. Genau dort setzt der Zeitsprung ⏭ [⇧.] einen ab (gemessen
    bei Minzi: 6 750 km bei 6 066 km Sphäre) – die Kette [⇧.] → [⇧K] greift also ineinander.
  - **`late`** – Periapsis schon passiert. **Bewusst KEIN Knoten**, nur eine Erklärung: Ein
    Einfangbrennen abseits der Periapsis macht die Bahn nicht rund, sondern schief (steht so
    schon bei `fmtPe`: an der Periapsis 373 m/s → Ap 1988 / Pe 329 km, dieselbe Bremsung
    1500 km zu früh 603 m/s → **Pe −183 km**, mitten durch den Mond).
  - **`round`** – eingefangen, aber die Bahn ist noch eine Ellipse (`rAp > rPe·ROUND_RATIO`,
    1,15): an der nächsten Periapsis rund bremsen.
- ⚠️⚠️ **LEIBNIZ ist ausgenommen.** Sonst kollidiert der Rundungs-Fall mit dem Ejection-Fall
  (im Parkorbit soll [⇧K] den ABFLUG planen), und der Zirkularisierungs-Burn nach dem
  Aufstieg gehört didaktisch in die Hand der Schüler*innen – dafür gibt es die Tutorials.
  Verifiziert: Leibniz-Ellipse 80 × 200 km ohne Ziel → kein Knoten.
- ⚠️⚠️ **Ein FREMDES Reiseziel schlägt `late` und `round`.** Wer im Monti-Orbit sitzt und
  Minzi eingestellt hat, will abfliegen und nicht seine Bahn runden; und wer gerade AUS
  Montis Sphäre heraussteigt, darf nicht »Periapsis schon vorbei« lesen. Nur `capture`
  (Zufallen) gilt immer – da ist Bremsen dringlicher als jeder Abflugplan. Verifiziert:
  Monti-Ellipse 60 × 600 km → `round`, dieselbe Bahn mit Ziel Minzi → nichts.
- ⚠️ **Zwei Burns, nicht einer** – wie in echt (Orbit Insertion, dann Zirkularisierung):
  Der Einfang bremst nur auf eine Ellipse mit Apoapsis `CAPTURE_AP_FRAC` (0,25) der Sphäre,
  das Runden holt sie danach herunter. Gemessen bei Monti: 415 + 101 = 516 m/s gegen 201 m/s
  fürs sofortige Zirkularisieren aus DIESER Bahn – der Unterschied ist die viel tiefere
  Endbahn (45 × 47 km statt 400 km). Bei Minzi ist der Einfang fast alles (846 + 3 m/s),
  weil dort die Fluchtgeschwindigkeit an der Periapsis (84 m/s) neben v∞ (889 m/s)
  verschwindet – **eine** Formel deckt beide Extreme ab. Wo die Sphäre eng ist
  (Huygens-Monde: 0,25·SOI liegt fast auf der Oberfläche), fällt sie über `max(rPe, …)` von
  selbst auf »sofort rund« zurück – bei Cassini gemessen genau so.
- ⚠️ **Der Knoten liegt an der PERIAPSIS**, gefunden über `findEncounter` (dieselbe Routine
  wie die Begegnungsanzeige – kein zweiter Integrator). Beim Runden zählt die NÄCHSTE
  Periapsis, wenn die aktuelle unter 180 s voraus liegt: Direkt nach dem Einfang-Burn steht
  das Schiff genau auf ihr, der Knoten lag sonst **4 s** voraus und war unbrennbar.
- ⚠️ **Δv rein analytisch (Vis-Viva), kein Koordinatenabstieg.** Anders als bei der
  Kurskorrektur gibt es hier nichts zu TREFFEN, die Zielgröße ist die eigene Bahn. Gemessen
  weicht die erreichte Apoapsis um < 1 % ab (Minzi: geplant 1457, erreicht 1466 km) – das
  ist die n-Körper-Störung, kein Rechenfehler.
- ⚠️ Ist die Vorhersage bis zur Periapsis nicht `fine` (oder liegt der Knoten gar nicht in
  der Sphäre), wird **kein** Knoten gesetzt, sondern der Hinweis, mit ⏭ näher heranzuspringen.
  Genauso, wenn der Kurs unterwegs schon sitzt: dann korrigiert [⇧K] NICHT weiter (der
  Abstieg würde die Periapsis nur immer tiefer legen – für Treibstoff), sondern nennt den
  nächsten Schritt.
- ⚠️ `updateButtons` und `travelPanel` rufen `captureSituation(**true**)` – ohne eigene
  Begegnungssuche (14 ms), es zählt nur die schon berechnete `this.encounter`. Beide laufen
  pro Frame; gemessen 0,001 ms bzw. 0,041 ms. Der 🧭-Knopf erscheint dadurch auch OHNE
  gewähltes Ziel: In der Sphäre fällt der Körper aus `targetList()`, dort ist der Knopf aber
  am wichtigsten.
- **Ganze Reise gemessen** (Starship, Sandbox, ∞-Tank): Monti 780 → Einfang 415 → Runden 101
  = **1296 m/s**, Endbahn 45 × 47 km · Minzi 1002 → Korrektur 432 → Einfang 846 → Runden 3
  = **2275 m/s**, Endbahn 1042 × 1054 km. Beide Male reine [⇧.]/[⇧K]-Abfolge ohne Handarbeit.

### ⏭ Zeitsprung zum Ereignis (`warpToEvent` / `keplerAdvance`, **[⇧.]**)
⚠️⚠️ **Der Zeitraffer allein REICHT NICHT, und das ist gemessen, nicht gefühlt:** In
einem 200-km-Parkorbit deckelt `frame()` die Schrittweite auf 1 s (`localT/4000`) und
die Schleife auf 400 Schritte pro Bild. Auch bei »100 000×« kommen damit nur 400 s
Spielzeit pro Bild heraus – **effektiv 24 000×**. Das Minzi-Fenster (34,7 Tage) sind
2,1 Minuten Zusehen, seine synodische Periode (232 Tage) 14 Minuten, bei Newton noch
weit mehr (»selbst mit max vorspulen dauert das ewig«, Bug-Report Simon). Die
Schrittweite hochzudrehen ist KEINE Option: Bei 790-s-Schritten auf einem 2 392-s-Umlauf
zerfällt der Parkorbit (gemessen 1,4e10 m daneben).
Also wie in KSP: über die Wartezeit **springen**. Knopf »⏭ Zum Startfenster / Zum
Knoten / [⇧.]«. Ziel ist der Manöverknoten, sonst die Begegnung (wenn schon unterwegs),
sonst das Startfenster – der Sprung hält immer mit etwas Vorlauf davor an.
- ⚠️⚠️ **Zwei Verfahren, und die Wahl ist keine Geschmackssache.** Bevorzugt wird die
  n-Körper-**Integration** (`propagateTo`, `stepsFine`) – das ist exakt die Rechnung,
  gegen die auch der Auto-Knoten optimiert, Vorhersage und Sprung bleiben konsistent.
  Nur wo 2 200 Schritte für Wochen nicht reichen (Parkorbit), springt `keplerAdvance`
  ein: exakte Zweikörper-Ellipse über Lagrange f & g. **Umgekehrt wäre es falsch** –
  on rails fehlen alle Störungen, gemessen laufen Ellipse und n-Körper-Rechnung auf der
  Sonnenbahn binnen 40 Tagen um **88 224 km** auseinander (14 × Minzis Sphäre), der eben
  gesetzte Knoten wäre Makulatur. Im Parkorbit dagegen ist die Bahnform das Wichtige,
  und die bleibt exakt erhalten (gegen eine feine Integration: 0,1 km nach 2 000 s,
  28 km nach 3 Tagen – das ist die echte Störung, nicht Numerik).
- ⚠️ `keplerAdvance` kürzt `dt` zuerst um GANZE Umläufe: Der Zweikörper-Zustand ist
  danach identisch, aber sin/cos von 7 854 rad (34 Tage im 40-Minuten-Orbit) verlieren
  in float64 spürbar Stellen. Der KÖRPER wird trotzdem zur vollen Zielzeit abgefragt.
- ⚠️⚠️ **Nie durch eine fremde Sphäre hindurch** – beide Verfahren kennen nur EINEN
  Körper, ein Vorbeiflug am Ziel würde verschluckt. `propagateTo(tEnd, stopBody)` hält
  am Sphärenwechsel an und liefert den Zustand **VOR** dem Schritt: Ein Schritt ist im
  Sonnenraum bis 7 800 s lang und durchquert Minzis 6 066-km-Sphäre in einem Rutsch –
  wer den Zustand danach nimmt, steht schon mitten drin (so gemessen: 1 412 km statt
  außerhalb). Verifiziert: Sprung endet bei 7 017 km, also knapp vor der Sphäre.
- **Guards:** nur im freien Flug (nicht gelandet/angedockt/EVA/Autopilot/Schub),
  elliptische Bahn (auf einer Fluchtbahn sind es ohnehin nur Stunden bis zum
  Sphärenrand), Pe über der Atmosphäre, Ap unter 0,95·SOI.
- ⚠️ **Strom:** Der Sprung darf weder Energie schenken noch eine Sonde stillschweigend
  töten. SAS geht aus (im Leerlauf braucht es niemand), danach zieht nur die
  Sondensteuerung (0,25 ⚡/s). Mit Panelen im Licht → volle Batterie; ohne Panele wird
  der Sprung **verweigert** und gesagt, wie lange der Strom reicht und was hilft ([G]).
- ⚠️ **Beim Startfenster wird auf das ÖFFNEN gezielt, nicht auf den Zündpunkt**
  (Fenster + Ejection-Winkel): `transferWindow.wait` springt danach sofort auf die
  NÄCHSTE synodische Periode, im HUD stünde also »Zündung in 232 Tage« statt »in 40 s«.
  Der Rest (höchstens ein Parkorbit-Umlauf) ist mit [.] eine Sache von Sekunden.
- ⚠️ **Wer schon unterwegs ist, will zur ANKUNFT** – nicht zum nächsten Fenster. Ohne
  diese Fallunterscheidung sprang der Computer im Test **4,5 Jahre** und flog glatt an
  Minzi vorbei.
- Nach dem Sprung: `warpI = 0` (nicht im 100 000×-Rausch ankommen), `_encAt = 0`,
  `sunBlend = null` (Sonne sofort richtig stellen statt mit `SUN_SLEW` herumzudrehen).
- **Ganze Minzi-Reise gemessen: 5 Tastendrücke, 520 ms Rechenzeit** – [⇧.] zum Fenster,
  [⇧K] Knoten, [⇧.] zum Knoten, [⇧K] Korrektur, [⇧.] zur Ankunft; Endanflug 1 426 km,
  also innerhalb der 6 066-km-Sphäre.

⚠️⚠️ **Ein reiner Hohmann trifft Minzi NICHT – und das ist Physik, kein Bug.** Minzis Bahn
ist 3° geneigt; bei der Ankunft steht der Planet ~950 000 km neben der Ekliptik, das Schiff
aber bei y≈0. Gegenprobe: Ein Normal-Δv beim ABFLUG bringt fast nichts (gemessen 977 000 →
922 000 km), denn nach genau einem halben Umlauf ist die Bahnebenen-Auslenkung wieder null –
Abflug- und Ankunftspunkt liegen beide auf der Knotenlinie. Lösung ist die **Bahnkorrektur
unterwegs** (echte Raumfahrt macht es genauso, »broken plane maneuver«): Knoten auf halbem
Weg, ~430 m/s NORMAL. Nachgemessen über die echte Spiel-Schleife (Knoten + `predict()` +
`this.encounter`, 84 »Klicks« Koordinatenabstieg): 950 606 km → **1 713 km**, also klar
innerhalb der 6 066-km-Sphäre. Budget der Testrakete: 1002 (Ejection) + 405 (Korrektur) +
~800 (Einfang) gegen 3721 m/s Δv.
- Deshalb im HUD zwei verschiedene Tipps, je nachdem ob man noch im Parkorbit sitzt oder
  schon im Sonnenraum unterwegs ist (`travelPanel`, `enRoute`).
- ⚠️ **Dazu gehören die neuen Knopf-Reihen im Knoten-Panel**: **±100 m/s** (1000 m/s in
  10er-Schritten wären 100 Klicks) und **Zeitpunkt ±10 min/±1 h/±1 d/±10 d** – ohne
  Tage-Schritte ist ein Knoten in der Mitte einer 75-Tage-Reise unerreichbar. Panelbreite
  dafür 230 → 268 px.
- ⚠️ `predict()` propagiert bis zum Knoten jetzt mit **an den örtlichen Umlauf gekoppelter**
  Schrittweite (`nloc/150`, Untergrenze `span/2200`): Mit dem alten festen `span/400` wären
  das bei einem Knoten in 37 Tagen 8000-s-Schritte – im 40-Minuten-Parkorbit ist die
  Vorhersage damit reine Fantasie.
- ⚠️⚠️ **`findEncounter` ist bewusst eine EIGENE Integration, kein Nebenprodukt von
  `traceOrbit`.** Die gezeichnete Linie muss den Parkorbit fein auflösen (600 Punkte auf
  40 Minuten), die Suche dagegen 75 TAGE überblicken – mit fester Schrittweite geht beides
  nicht zusammen. Hier wächst die Schrittweite mit dem örtlichen Zweikörper-Umlauf
  (`localT/400`, Deckel `horizon/1200`, max 12 000 s), plus **Feinsuche** (200 Schritte um
  das grobe Minimum): Im Sonnenraum liegen zwei grobe Punkte 200 000 km auseinander, die
  Sphäre ist 6 066 km groß – ohne Nachrechnen meldet die Anzeige »weit daneben«, obwohl der
  Kurs mitten hindurchführt. Gedrosselt auf 5×/s (`_encAt`; `nodeAdj`/`nodeShift` setzen den
  Zeitstempel zurück, damit ein Klick sofort wirkt). Gemessen 14 ms pro Suche.
- **SOI-Wechsel bremst den Zeitraffer** auf 100× und meldet sich. ⚠️ Nur beim ANKOMMEN an
  einem Körper – wer nach außen ins freie Sonnenfeld fliegt, hat Wochen Reise vor sich und
  bekommt nur die Meldung. Bei 100 000× vergehen sonst 28 h pro Bildschirmsekunde und der
  Vorbeiflug (Durchflugzeit durch Minzis Sphäre ~3,6 h) ist in drei Frames vorbei.
- Die Fluchtgeschwindigkeits-Warnung sagt mit gewähltem Reiseziel nicht mehr »RETROGRADE
  bremsen!«, sondern meldet den Kurs – dort ist das Verlassen ja der Plan.

## Sandbox-Direktstart im Orbit (`Game.startMode` / `Flight.spawnInOrbit`)
Wähler »Startart« ganz oben im VAB-Info-Panel, **nur im Sandbox-Modus** sichtbar
(`VAB.setStartMode`): »🏗️ Von der Rampe« oder »🛰️ Direkt im Orbit«. Letzteres setzt die
gebaute Rakete mit vollen Tanks auf eine Kreisbahn um **Leibniz** (`SANDBOX_ORBIT_ALT`
= 200 km, Ap = Pe). Zum Üben von Rendezvous, Aussetzen, Landebeinen und Wiedereintritt spart
das jedes Mal denselben Aufstieg.
- ⚠️ **Bewusst nur LEIBNIZ.** Wer bei Monti oder Huygens anfangen will, soll hinfliegen – der
  Weg dorthin IST die Aufgabe.
- ⚠️ **Nur Sandbox** (`Game.sandbox && Game.startMode==="orbit"`). In der Karriere wäre das ein
  Freifahrtschein: Missionen, Startkosten und der ganze Aufstieg geschenkt. `Game.startMode`
  liegt zwar im Save, ist in der Karriere aber wirkungslos (verifiziert).
- Beim Orbitstart entfallen **Rampen-Massenlimit und Superheavy-Turm-Guard** in `UI.launch` –
  das Schiff berührt die Rampe nie. Verifiziert: 28-t-Rakete am 25-t-LMG-Startplatz wird von
  der Rampe abgelehnt, im Orbit durchgelassen.
- ⚠️ `Flight.spawnInOrbit(b, alt, {pe, inc})` ist die EINE Quelle für »Schiff auf eine Bahn
  setzen« – die Tutorial-Szenarien (`scenario.orbit`) benutzen sie ebenfalls. Muss NACH
  `Flight.start()` laufen, das setzt das Schiff erst auf die Rampe. Gegenprobe nach dem
  Refactor: alle 10 Orbit-Tutorials treffen ihre Sollbahn exakt (inkl. Ellipsen ap 75/pe 22
  und inc 20°).

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
- ⚠️ **KEINE Figuren auf der Rampe** (August 2026, Wunsch Simon: »safety first«). Dort standen
  drei `buildAstronaut()`-Figuren am Rand der Sperrzone als Größenvergleich – aber eine Rakete
  wird nicht gezündet, solange noch jemand auf dem Gelände ist, und in einer Schul-AG ist genau
  das die Botschaft, die auf dem Bild stehen soll. Den Maßstab tragen jetzt die Bauten
  (Gitterturm, Geländer 3,4 hoch, Container, Treppen). In der HALLE bleiben die Figuren – dort
  wird ja auch gearbeitet.
- ⚠️ **Die Plattform ist mit dem Boden BÜNDIG** (Oberkante y = 0, damit die Rakete bei
  |pos| = R aufsetzt). Eine Treppe hatte hier nichts zu überwinden und stieg ins Leere –
  jetzt eine flache Betonschürze. Kabelpritschen laufen NEBEN der Rampe nach Westen, nicht
  quer übers Deck (dort schnitten sie durch Warnstreifen und Geländer).
- **⚠️ FLAME DIVERTER (Flammengraben) an »Schulhof Süd« und Polarstation** (`padHasDiverter`,
  `DIV_VENT_X` = 34): Was passiert eigentlich mit dem Abgasstrahl, wenn er auf den Boden trifft?
  Er muss WEG, sonst prallt er auf die Rakete zurück. Deshalb hat jeder große Startplatz einen
  Graben mit Stahlkeil: Der Keil teilt den Strahl, der Graben führt ihn zu zwei Mündungen
  seitlich der Rampe – dort schießt die Wolke heraus (bei jedem Start von Cape Canaveral im
  Bild). Achse ist OST–WEST (im Rampen-Mesh ±X).
  ⚠️ Der kleine LMG-Schulstartplatz hat KEINEN – dort steht die Rakete auf einer Betonschürze
  und der Rauch quillt rundum hervor. Genau dieser Unterschied macht sichtbar, was ein großer
  Bahnhof mehr kann als ein Schulhof.
  ⚠️ `DIV_VENT_X` ist die EINE Quelle für Mesh (`buildPad`) und Rauch (`Flight.frame`) – laufen
  die auseinander, quillt der Rauch neben der Öffnung aus dem Beton.
  (Der frühere Diverter hing an der Starship-Tech und gehörte nur zum Mechazilla-Turm; jetzt hat
  ihn jede der beiden großen Rampen von Anfang an.)
- **⚠️⚠️ STARTRAUCH: zwei Fälle, und der Unterschied ist Physik** (`PLUME_GROUND` = 170):
  1. **In der Luft**: Die Fahne zieht nach hinten weg und fliegt MIT dem Schiff –
     Basisgeschwindigkeit `this.vel`.
  2. **Am Boden** (Unterkante < `PLUME_GROUND`): Der Strahl trifft auf und wird UMGELENKT. Die
     Wolke entsteht am AUFTREFFPUNKT, breitet sich flach aus und steigt erst dabei auf. Ihre
     Basisgeschwindigkeit ist die des BODENS (`bodyVel`), NICHT die des Schiffs: Eine
     Startwolke bleibt liegen, während die Rakete davonfliegt. Vorher hing sie über `this.vel`
     an der Rakete und zog wie ein Schweif mit nach oben – der auffälligste Fehler am alten
     Start.
  - Mit Graben treten die Partikel an den **Mündungen** aus (`DIV_VENT_X` entlang `padEastV`),
    ohne Graben radial rundum.
  - ⚠️ **Nur an der eigenen Rampe** (Abstand < 200 m): `this.pad` ist der Startplatz, nicht der
    Ort, an dem das Schiff gerade steht – sonst quölle der Rauch auch bei einer Landung 1000 km
    weiter aus Mündungen, die es dort nicht gibt, und entlang der falschen Achse.
  - ⚠️ **Menge gemessen:** Mit 2 + 4·Intensität war der 170-Sprite-Pool nach einer Sekunde
    Dauerbrand leer und das ganze Bild milchig-weiß – man sah weder Rampe noch Rakete. Jetzt
    1 + 2,2·Intensität, kürzere Lebensdauer (1,2–2,4 s), kleinere Sprites, und am Boden nur EIN
    Düsen-Partikel je Frame statt drei. Gemessen: `frame()` an der Rampe 0,53 ms.
- **Küste:** ALLE Rampen liegen am Meer – `Flight.groundGroup` (Basis **X=Ost/Y=hoch/Z=SÜD** via `makeBasis`; ⚠️ {Ost,hoch,Nord} wäre LINKSHÄNDIG = Spiegelmatrix → setFromRotationMatrix kippt die Rampe! Gilt auch für `padGroup`; Mesh-Koordinaten: +Z=Süd, LZ bei z=−260, Mechazilla bei z=+34) enthält `groundPlane` (Land), `groundBeach` (Sand ab ~1 km Ost), `groundSea` (Ozean ab ~1,5 km Ost – Küste liegt bewusst NAH an den Rampen, Meerblick!) und `seaPatch`. Baum-Sperrzone Richtung Strand: ex < 700. ⚠️ Der Sand wird unter Wasser weggeschnitten (`beachClipU`) und der Seegrund abgesenkt – warum, steht im Ozean-Abschnitt unter »Fünfte Flimmer-Ursache«.
- **⚠️ Die Bodenszene folgt dem SCHIFF, nicht der Rampe** (`Flight.reanchorGround(dir, key)`). Vorher hing sie starr am Startplatz: wer nach einem Wiedereintritt 1000 km entfernt wasserte, sah nur die nackte Planetenkugel – ein flaches türkises Nichts. `frame()` verankert neu, sobald der Bodenpunkt weiter als `max(700, min(12000, alt·0,30))` vom Anker weg ist und alt < 22 km. Drei Ausprägungen (`Flight.groundMode`), aus `landH` bestimmt:
  - ⚠️⚠️ **Die Schwelle MUSS mit der Höhe schrumpfen** – das war die zweite Hälfte des »Bellyflop crasht je nach Landeplatz«-Bugs. `shapeTerrain` legt den ANKER auf y = 0 und zeichnet alles Relief relativ dazu; Physik und Autopiloten messen dagegen die Höhe über der KUGEL. Beides stimmt nur überein, solange der Anker unter dem Schiff sitzt. Mit den alten festen 12 km lag er in hügeligem Gelände im Median **220 m**, im 90. Perzentil **700 m**, im Extremfall **2 km** daneben (gemessen über 300 Zufallspaare auf Land mit Relief). Worst Case verifiziert: Anker im Tal (604 m), Schiff 11 km weiter auf einem Grat (2350 m) → das Starship tauchte schon bei **1743 m** in den sichtbaren Hang, der Flip zündete planmäßig erst bei 240 m über der Kugel = **1,5 km im Berg**. Genau das sah wie »Landing Burn zu spät« aus. Mit 30 % der Höhe ist der Anker unter 3 km Höhe immer näher als 900 m, also **innerhalb der ebenen Zone von `shapeTerrain`** – der sichtbare Boden unter dem Schiff liegt dann exakt auf der Kugel (Raycast gegen das echte Mesh: 243 m bei HUD-Höhe 240 m, vorher 0 Treffer = Schiff unter der Oberfläche).
  - Kosten der engeren Schwelle: 5 statt 2 Neu-Verankerungen pro Wiedereintritt, **31 ms für den ganzen Abstieg** (Binnenland ~4 ms pro Stück, offener Ozean ~0). Der teure Fall ist die Küste (~40 ms, Küstentabelle) – aber dort geht `terrainH` ohnehin gegen 0, weil Berge mit dem Abstand vom Ufer wachsen. Der Fehler war also genau dort groß, wo das Nachführen billig ist.
  - `"coast"` – Küste in ±26 km: Layout wie an der Rampe. ⚠️ Die Basis wird so gedreht, dass **Osten seewärts** zeigt (aus dem Terrain-Gradienten) – nur dann ist die Uferlinie eine Funktion von Nord und die Tabellen-Parametrisierung überhaupt gültig. An der Rampe (`key` beginnt mit `"pad:"`) bleibt die geografische Basis stehen, das garantiert schon die Längengrad-Suche.
  - `"opensea"` – offener Ozean: `groundSea` wird zur schlichten 85-km-Scheibe **um den Anker**, `seaPatch` mittig unters Schiff, `uOrigin` = (0,0), Uniform `uOpenSea = 1` (dShore konstant 20 km → keine Brandung, kein Flachwasser). Wiese/Strand/Bäume aus.
  - `"inland"` – Binnenland: nur Wiese, Meer aus.
    - ⚠️⚠️ **Der Sandstrand gehört AUSSCHLIESSLICH zur Küste.** Er hing bis August 2026 mit
      an derselben Zeile wie die Wiese (`groundPlane.visible = groundBeach.visible = (mode
      === "inland")`). Folge: Im Binnenland lag die komplette 40-km-Sandscheibe – noch aus
      dem letzten Küsten-Anker, flach auf y = 2 und ohne `beachClipU` ungeschnitten – über
      der Wiese. Das ergab eine **riesige gelbe Wüste mit ausgefranstem Rand** überall dort,
      wo das Relief durch den flachen Sand stach, dazu einen zackigen »Horizont« aus deren
      Rand (Bug-Report Simon mit Screenshots, Starship-Hop: »gelbe Riesen-Sandlandschaft«,
      »der Horizont ist gewellt«). Ohne Uferlinie gibt es keinen Strand – Punkt.
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

### ⚠️ Die Puff-Wolken sind RAUS (August 2026) – nicht wieder einbauen
Bodennah hingen bis August 2026 zusätzlich 40 Haufenwolken à 14 Impostor-Puffs in der
Szene (`Flight.cloudField`/`cloudGroup`, `CLOUD_VERT`/`CLOUD_FRAG`, `makeCloudPuffTexture`,
`updateClouds`, Grafikstufe `clouds`). Sie sind **komplett entfernt**, mitsamt dem
Wolken-Regler in den Optionen. Grund (Bug-Report Simon): Seit die **Wolkenschale des
Planeten** im Shader nachgeschärft wird (s. »Wolkenschale & Lufthülle von Leibniz«), zeigen
beide dasselbe – man sah unter 34 km Höhe zwei Wolkendecken übereinander, und die Puffs
verrieten sich dabei als flache Billboards, sobald man an ihnen vorbeiflog. Die Schale ist
die bessere Darstellung, deckt den ganzen Planeten ab und kostet keinen eigenen Draw-Call.
Wer bodennah wieder Wolken will, sollte an der SCHALE ansetzen (z. B. sie unter ~20 km
näher an die Kamera holen), nicht ein zweites System danebenstellen.
- Mit rausgeflogen ist `sunWarmth(sunUp)` – die Funktion stand seit dem Himmels-Rewrite
  ohnehin ungenutzt in der Datei (Sonnenlichtfarbe kommt aus `sunTint`).
- `makeCloudTexture()` (Wolkendecke des Planeten aus dem Orbit) bleibt und ist unberührt:
  FBM statt gemalter Ellipsen, Zonen-Maske über den Breitengrad, Schwelle 0.455/0.17 lässt
  bewusst Kontinente durchschauen.

### Landestaub, Gischt & Fußspuren (`dustFx` / `touchdownDust` / `waterFx` / `addFootprint`)
Was passiert, wenn ein Triebwerk auf den Boden zielt oder ein Stiefel ihn berührt.
- **`dustFx(dt)`** – das Land-Gegenstück zur Gischt, zwei Sorten, und der Unterschied ist der
  didaktische Witz:
  - **LUFTLOSE WELT** (Monti, Minzi, Newton, Huygens-Monde …): Der Staub fliegt in FLACHEN,
    GERADEN Bahnen radial davon und verschwindet schlagartig – er wölkt NICHT auf. Genau so
    sehen die Apollo-Filme aus, und der Grund ist, dass keine Luft da ist, die den Staub
    bremsen oder in Wirbeln halten könnte. Deshalb `grow = 0,15`, kaum Aufwärtskomponente,
    kurze Lebensdauer.
  - **LEIBNIZ** (Luft, über Land): eine echte Wolke – breitet sich AM BODEN aus und steigt
    erst dabei auf (`grow` 1,8), staubbraun mit grünen Grasfetzen.
  - ⚠️ **Tempo gemessen, nicht geschätzt:** Der erste Wurf schoss den Staub luftlos mit
    45–115 m/s davon – physikalisch plausibel, aber bei 58 m Kameraabstand war jedes Korn nach
    einem Wimpernschlag außerhalb des Bildes (gemessene Bildschirm-x bis 3877 bei 834 px
    Fensterbreite). Jetzt 20–50 m/s: flach und schnell, aber im Bild.
  - ⚠️ **Auf der RAMPE kein Erdstaub** (Radius 150 m um `padLocal`): Dort ist Beton, und was
    man sieht, sind die umgelenkten Abgase (s. »Flame Diverter«).
  - ⚠️ Über Wasser steigt der Zweig aus – dort macht `waterFx` die Gischt.
  - ⚠️⚠️ `landedBody` gilt nur, SOLANGE das Schiff steht (es bleibt nach dem Abheben stehen):
    ungeprüft übernommen zeigte der Staub beim Monti-Anflug noch auf Leibniz und kam nie.
  - Farbe aus `shade2D[1]/[2]` des Körpers (dieselbe Quelle wie die 2D-Karte), auf Leibniz
    fest Erdbraun/Grasgrün.
- **`touchdownDust(b, vrel)`** – einmaliger Puff beim Aufsetzen, Menge nach
  Aufschlaggeschwindigkeit (ab 0,4 m/s; ein Schwebe-Aufsetzen wirbelt nichts auf).
- ⚠️⚠️ **BUG-FIX GISCHT (August 2026): `waterFx` hat nie etwas gezeigt.** Die Sprites hängen an
  `Flight.world` und brauchen ABSOLUTE Weltkoordinaten (steht seit jeher im Partikel-Abschnitt)
  – `at()` lieferte aber einen Offset RELATIV zum Schiff. Gemessen: Jeder Tropfen landete
  1,36e10 m neben der Szene. Dazu fehlte die Basisgeschwindigkeit: Ein Partikel mit `vel = 0`
  bleibt im Sonnensystem stehen und ist nach einer Sekunde 9,3 km weit weg. Beides korrigiert
  (`this.pos` addieren, `vBase = bodyVel(LEIBNIZ)`), und `dustFx`/`touchdownDust` machen es von
  Anfang an so.
- **`spawnParticle(pos, vel, life, size, color, grow)`** hat dafür einen optionalen
  `grow`-Parameter bekommen (Standard 1,8 wie bisher).
- **Fußspuren im Regolith** (`addFootprint` / `footprintTexture`): das Apollo-Bild – eine Spur
  aus Stiefelabdrücken, die von der Landefähre wegführt. Alle `FOOT_STEP` = 0,85 Einheiten ein
  Abdruck, links/rechts versetzt.
  - ⚠️ **Nur auf luftlosen Welten**: Auf Leibniz' Wiese sieht man keine Abdrücke, und Wind und
    Regen hätten sie in Minuten geglättet.
  - ⚠️ **EIN InstancedMesh als RINGPUFFER** (`FOOT_MAX` = 140): 1 Draw-Call, die ältesten
    Abdrücke werden überschrieben statt zu wachsen.
  - ⚠️⚠️ Die Instanzmatrizen sind KÖRPERFEST (relativ zum Mittelpunkt), die GRUPPE wird pro
    Frame auf `bodyPos(body, t)` gesetzt – absolut gespeichert bliebe die Spur im Sonnensystem
    stehen, während der Mond mit über einem km/s darunter wegfliegt.
  - Die Spuren gehören zum FLUG, nicht zum Spielstand (Reset in `start()`) – anders als die
    Flaggen, die man bewusst »für immer« setzt. Körperwechsel verwirft die alte Spur.
  - Verifiziert: 4 s Laufen auf Monti = 16 Abdrücke, nach 11 s eine deutlich sichtbare Kette.

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
- Himmelsfarbe: **Höhe quadratisch, Tageszeit linear** (`f·f·dayLight`). Vorher war beides gemeinsam quadriert – dann ist der Himmel schon um 16 Uhr nachtschwarz, während Boden, Meer und Wolken noch in der Sonne stehen.
- ⚠️ `Flight.setViewUniforms(cam, h)` setzt die kamera-abhängigen Uniforms von Meer & Wolken (`uEye`, `uPixel`, `uCamRight/Up`) und **muss direkt vor JEDEM render() mit der jeweiligen Kamera laufen** – die Booster-PiP rendert dieselbe Szene aus einer anderen Perspektive.

## Booster-Landeplätze (RTLS / Droneship / Mechazilla-Catch)
- **Tech-Kette:** reuse → landZone (40, Landing-Zone-Plattform »LZ-1« an JEDER Rampe, in `buildPad` bei lokal (10,0,260)) → droneship (60). `Game.boosterSite` ("rtls"/"ship", VAB-Wähler »Booster-Landeplatz« erscheint bei Gitterflossen im Stack, `VAB.setBoosterSite`), `Flight.boosterSiteEff(parts)` = rtls/ship/null. **Bergungswert:** LZ 100 % · Droneship 90 % · Gelände 60 % · Wasserung 50 % (ohne Forschung wassert der Booster downrange – reuse1 bleibt erfüllbar!). Missionen lz1 (`s.lzLanded`) → ship1 (`s.shipLanded`), catch1 (`s.caught`, req reuse1). Orange Tankmarke rutscht bei RTLS auf 30 % (Boostback braucht Sprit) – die Prozentwerte stehen in **`BOOSTER_RESERVE`/`boosterReserve(site)`**, der EINEN Quelle für Tankmarke UND die Δv-Zeile »mit Bergung« in der Halle (s. dort). ⚠️ Tutorial "booster" hat deshalb 2× tankL in Stufe 1 + Ziel 10 km (getestet: 12 km bei 37 % – die alte 1-Tank-Version lief vor der Marke leer).
- ⚠️⚠️ **Der SUPERHEAVY fährt NIE zur See** (Prüfung in `boosterSiteEff`, `launchFee`, `VAB.setBoosterSite` und der Landeplatz-Sektion von `renderInfo`). Ein Mechazilla-Fangturm passt auf keine Barge – bei SpaceX ist es genauso: Falcon-Booster landen auf dem Droneship, Superheavy nicht. Das war **kein Kosmetik-Problem**: `boosterSiteEff()` las nur `Game.boosterSite`, und an DIESER Funktion hing die orange Tankmarke. Mit gewähltem »Droneship« stand sie bei 12 % statt der 30 %, die der Boostback zum Turm braucht – wer nach der Marke trennte, kam nicht zurück und landete »🏞 im Gelände« (60 % statt 100 %), und die Booster-Cam zeigte dabei ins Leere (s. u.). Dazu wurden 50 🪙 Droneship-Gebühr für eine Barge kassiert, die nie ausfährt. `boosterSiteEff` nimmt deshalb die **Teileliste der betroffenen Stufe** (`stage()` reicht `dropped.parts`, die Tankmarke `s.parts`) – nicht den ganzen Stack von `this.v`, sonst zählt ein längst abgeworfener Superheavy weiter mit.
  - ⚠️ Die Tankmarke erscheint jetzt auch **ohne Gitterflossen**, sobald ein Superheavy in der aktiven Stufe sitzt: Ihn fängt der Turm, Flossen braucht er dafür nicht – den Boostback-Sprit schon.
  - Verifiziert: Superheavy+Starship mit `Game.boosterSite="ship"` → Marke 30 %, `site="catch"`, Gebühr 0, VAB zeigt die Droneship-Zeile gesperrt (»🚫 nicht für Superheavy«) · klassische Rakete mit Gitterflossen unverändert (ship → 12 %/`site="ship"`/50 🪙, rtls → 30 %/`site="rtls"`).
- **Startgebühr Droneship:** `DRONESHIP_FEE` = 50 🪙, addiert von `launchFee(stack)` (nur Karriere, nur mit Gitterflossen im Stack, nur bei gewähltem+erforschtem Droneship) auf `stackCost` in `UI.launch` → steckt in `Flight.launchCost`, wird also bei einem ABGEBROCHENEN Start korrekt zurückgebucht (verifiziert: netto ±0), bei erfolgreicher Bergung dagegen nicht (das ist die Dienstleistung). Sichtbar im VAB-Infopanel: Zeile »Kosten (inkl. 🚢 50)« + Notiz am Landeplatz-Wähler.
- **Autopilot-Zustände:** flip → **boostback** (nur rtls/catch, Sprit > 22 %: brennt horizontal, bis `predictImpactRel(b,tt)` (grobe ballistische Vorhersage im Leibniz-Frame, cdA≈13) < 350/800 m am Ziel) → coast (Droneship-Position s. u.; Gitterflossen-»Lift« zieht die Bahn zum Ziel; **< 8 km: direkte Quergeschwindigkeits-Regelung** `vLat = err/tGo`, cap 45 m/s / 6 m/s² – die Prediction allein streut bei Warp zu sehr!) → burn (Hoverslam relativ zu `b.catchAlt`, Ziel-Kipp + Schubvektor-Lateral-Regler < 2,5 km) → landed/caught/crashed. Getestet: LZ 14–30 m, Droneship 10–17 m, Catch 7,5 m (auch mit Warp 2).
- ⚠️⚠️ **Droneship-Position (`b.tgt`/`dsLocal`): drei Fallen, alle drei waren gestellt.** Ergebnis vorher: Der Booster fiel bei JEDEM getesteten Profil 29–40 km neben der Barge ins Wasser, zündete den Landing Burn gar nicht mehr und bekam 50 % statt 90 %. Jetzt 10–17 m in vier Profilen (Trennung 19–34 km / 1200–1900 m/s).
  1. **Nicht EINMAL am Scheitelpunkt festlegen.** Die Position wird bis 25 km Höhe alle 2 s nachgeführt (`b._dsT`) und erst darunter eingefroren. Beim ersten Impact-Predict steht der Booster am Apogäum, wo die grobe ballistische Vorhersage am schlechtesten ist – ein Schiff darf sich aber bewegen, das ist ja sein Vorteil gegenüber der ortsfesten LZ. Unter 25 km muss es stehen, sonst fährt das Deck im Endanflug davon.
  2. **Kein Tangentialebenen-Umweg.** Ziel ist der vorhergesagte Aufschlagpunkt SELBST (`imp.normalize()·R`). Vorher wurde er in Ost/Nord-Koordinaten der RAMPE zerlegt und aus `padLocal` wieder zusammengesetzt: Der Ost-Anteil einer 290-km-Sehne ergibt über `atan(e/R)` nur 268 km Bogen = **22 km zu kurz**. Bei kurzen Strecken identisch, deshalb fiel es nie auf.
  3. **Wassersuche in BEIDE Richtungen.** Östlich des Äquator-Raumhafens liegt Meer nur von ~2 bis ~60 km, dann kommt der nächste Kontinent (gemessen `landH > 0` von 65 bis ~190 km). Die alte Suche schob nur ostwärts und höchstens 40×800 m – bei Aufschlag 130 km downrange lief sie 40-mal ins Leere und das Deck stand am Ende **exakt 32 km** daneben (konstanter Offset = verräterisch). Jetzt ±40 km entlang der Bahnspur, nächstgelegenes Wasser gewinnt, Verschiebung als WINKEL (`s/R`) am Zielpunkt; nach Westen nur, solange das Deck > 6 km östlich der Rampe bleibt.
- **Mechazilla (eq-Pad, Tech starshipT):** Turm+Arme (`name:"mzArm"`, `userData.side`) + Flame Diverter in `buildPad("eq")`; `Flight.catchLocal` = padLocal + Nord·(−20). Superheavy-Stufe (braucht Decoupler drüber!) → `site:"catch"`, `catchAlt = 72 − H + 6` (Arme greifen oben, Unterkante schwebt). Catch-Check VOR dem Boden-Check: alt ≤ catchAlt+2, horizontal < 45 m, < 9 m/s → `state:"caught"` (sackt 2,5 m nach, `b.sink`), 100 % Erstattung, `statCaught`. Arme schließen via `Flight.mzArmFold` in frame(). **Superheavy startet NUR von eq** (Guard in `UI.launch`). Diverter-Extra-Rauch: 4 Partikel/Frame seitlich (Ost/West) bei alt < 100 + superheavy im Stack; Partikel-Pool dafür 170.
- ⚠️⚠️ **Realitätscheck im Abstieg (`BOOSTER_GIVEUP` = 7000 m, `b.missed`):** Der
  Boostback-Burn bricht nicht nur ab, wenn das Ziel erreicht ist, sondern auch, wenn schlicht
  der Sprit ausgeht (< 12 %). Danach hielt der Autopilot trotzdem an `b.tgt` fest und
  »zielte« auf den Mechazilla-Turm, der 28–50 km entfernt lag: Der Booster setzte irgendwo im
  leeren Gelände auf, während Meldung, Statuszeile und Kamera so taten, als liefe ein Catch –
  die **»Catch-Animation im Nichts«** (Bug-Report Simon: tritt genau dann auf, wenn man kurz
  vor der Tankmarke trennt). Jetzt gibt der Autopilot das Ziel ehrlich auf: `tgt = null`,
  `catchAlt = 0`, Klartext-Meldung mit der Restentfernung und dem Hinweis, früher zu trennen;
  die Statuszeile der PiP zeigt **»⚠️ NOTLANDUNG downrange«** statt »ANFLUG AUF DEN TURM«.
  - ⚠️⚠️ **Die Schwelle ist GEMESSEN, nicht geschätzt.** Der erste Wurf stand auf 2,5 km
    (überschlagen aus »45 m/s quer über 40 s Sinkzeit«) und brach damit einen Anflug ab, der
    sauber gecatcht hätte. Restabweichung über den Abstieg, Superheavy ab eq-Rampe:
    **30 % Trennung (gelingt):** 25 km → 4,13 · 10 km → 4,13 · 7 km → 0,32 km ⇒ caught, 10 m ·
    **20 %:** 25 km → 10,9 · 10 km → 9,43 ⇒ 7,8 km daneben ·
    **10 %:** 25 km → 27,0 · 10 km → 37,4 ⇒ 34,9 km daneben.
    Der Endanflug-Regler schließt die Lücke also erst zwischen 10 und 7 km Höhe, und zwar aus
    über 4 km heraus – die Überschlagsrechnung hat seine Reichweite um mehr als die Hälfte
    unterschätzt. 7 km trennt beide Gruppen mit Reserve nach beiden Seiten.
  - ⚠️ Geprüft wird erst **unter 25 km** und nur einmal pro Sekunde – darüber ist
    `predictImpactRel` am Scheitelpunkt bis zu 40 km daneben (s. Droneship-Kommentar).
  - Verifiziert nach der Korrektur: **30 %** → `caught`, 0,01 km, `missed=false` · **20 %** →
    `missed`, 20,8 km · **10 %** → `missed`, 49,9 km; der Booster ist in allen
    Landing-Burn-Frames im Bild. Die Mechazilla-Arme schnappen weiterhin nur bei
    `state==="caught"` zu, bleiben bei einer Notlandung also offen.
- **Booster-Cam:** 380×230, Landing Burn/caught zoomt auf `min(420, 130+0.9·vrel)` raus (geglättet via `b.camDist`, flacher Winkel 0.07) – Cinematic-Shot. Neue States boostback/caught im Label.
  - ⚠️ **Beim Landing Burn gehört das ZIEL mit ins Bild.** Die Kamera blickt dann nicht mehr auf die Booster-Mitte, sondern auf `lerp(booster, b.tgt, 0.55)`, und der Abstand wächst auf mindestens `Abstand·1,25 + 50` (50° Bildhöhe ⇒ Spanne/0,93, plus Rand), gedeckelt bei 600. Vorher lag die Barge bei 204 m Resthöhe knapp UNTER dem Bildrand: Man sah eine Rakete über leerem Wasser schweben, und im nächsten Moment stand sie – genau der Moment, für den das Fenster da ist, fiel heraus. Gilt genauso für LZ und Mechazilla-Arme.
  - ⚠️⚠️ **…aber NUR, solange das Ziel auch hineinpasst** (`f = 1 − clamp((Abstand−260)/260)`, blendet die Ziel-Einrahmung über 260 → 520 m aus). Der 600er-Deckel trägt bei 50° Bildhöhe rund **440 m** Spanne; wer zu spät trennt, landet aber kilometerweit daneben. Dann schaute die Kamera auf einen Punkt weit VOR dem Booster: leerer Boden, Rakete außerhalb des Bildes, während die Statuszeile »LANDING BURN · Höhe 12 m« meldete (Bug-Report Simon mit Screenshot). Nachgerechnet für den gemessenen Fall (Ziel 28,1 km weg): Blickpunkt 15,4 km vor dem Booster, Winkel Booster↔Kameraachse **87,8°** bei 37,7° halbem Öffnungswinkel – der Booster war also wirklich draußen, kein Auflösungsproblem. Verifiziert über die echte Frustum-Prüfung: Fehlanflug 28 km → 5/5 Landing-Burn-Frames zeigen den Booster (camDist 144–147 m); Normalanflug → 3/3 Frames zeigen **Booster UND Ziel** (camDist 202–210 m), also unverändert der alte Cinematic-Shot.
- **Droneship-Mesh** `buildDroneship()` (Barge »Lies die Anleitung«), `Flight.droneMesh` + `dsLocal` (folgt dem Planeten pro Frame, erst sichtbar wenn positioniert). Landung auf Deck: `b.local.setLength(R+5.7)`.
- ⚠️ Booster-Tests: Wenn das MUTTERSCHIFF crasht, friert `step()` ein und der Booster hängt – Testflüge müssen die Oberstufe am Fliegen halten (∞-Tank + Schub).

## Tutorial »Orbital Refueling« (id "refuel")
`scenario.tanker:{alt,behind}` (Tut.start): parkt `Flight.tutTanker` (on rails, `spawnTutTanker()`-Mesh, in `targetList()` anvisierbar → rosa ✛ funktioniert) und setzt den Spieler `behind` m dahinter; `scenario.fuelFrac` drosselt alle Tanks (Refuel-Dramaturgie: Start mit 15 %). `checkTanker()` behandelt den Tut-Tanker VOR dem Sandbox-Return: < 60 m & < 4 m/s → Tanks voll, `Flight.refueled = true` (Tutorial-Check), Tanker weg. Reset in `Flight.start()`.

## Langzeit-Systeme (Jahresprojekt für die AG, alles NUR Karriere; Sandbox/Tutorial = neutral)
- **Stationsausbau:** `STATION_MODS` (5 Module, `needs`=Teile-Multiset). Angedockt + Teile an Bord → **[I]** `installModule()`: Teile raus, `Game.stationMods`, `buildStationMesh(stationModsEff())` wächst. Sandbox = Vollausbau (`stationModsEff`). Boni: modLab ×1,5 Experimente · modSolar lädt beim Docken · modHab +2 Crew-XP bei Docking · modScope zeigt Anomalie-Hinweise · modFunk zählt als 2 Relais.
- **Crew-Kader:** `Game.roster` (6 feste Astronaut*innen, `ROLES` pilot/ing/sci, `XP_LEVELS`). Auswahl in `Flight.start` (bereit + wenigste Flüge), Boni via `Flight.crewLvl(role)`: Pilot +8 %/Lvl Agilität, Ing −4 %/Lvl Sprit (`fuelEff`), Sci +10 %/Lvl Experimente. XP in `settleCrewAndAssets()` (endFlight). Im All zurückgelassen → `status:"gestrandet"` + Wrack-Asset.
- **Funknetz:** `commCheck(stack,pos,t)` – bemannt immer ok; Sonde: Leibniz-SOI ok, sonst Antenne nötig + `commRelays()` (1 = inneres System <2.6e10 m Sonnenabstand, 3 = Newton). Ohne Signal: `commDead` blockt Rotation/Schub/Z/X. Relais = Sat mit Antenne+Solar via [N] (`Game.relays`).
- **Anomalien:** `ANOMALIES` (8 Stück, `dir` = Einheitsvektor körperfest). Leuchtfeuer-Meshes (`anomalyMeshes`) pro Frame auf Oberfläche. Entdeckung in `onLanded(b)`: Winkel < 0,25 rad. `Game.anomaliesFound`.
- **LMG-Flaggen (»erobern«):** `Game.flags` = `[{body:<SCHLÜSSEL>, dir:[x,y,z]}]`. ⚠️ Gespeichert wird der Schlüssel aus `BODY_BY_NAME()` ("MONTI"), NICHT `b.name` – sonst findet `start()` den Körper beim Laden nicht wieder; dafür gibt es `bodyKey(b)`. `Flight.start()` baut alle Meshes neu (`flagObjs`, positioniert pro Frame wie die Anomalien), Sandbox/Tutorial bekommen eine leere Liste. Mission `flagMonti` (req montiLand), Sektion »🚩 LMG-Flaggen« in der Missionszentrale.
- **Orbit-Inventar:** `Game.assets` ({kind:"ship"|"sat"|"tanker"|"wreck", body, alt, phase, name, crew?, **stack, fuel[], srb[], charge**}) – on rails via `assetPos/assetVel`, gespawnt in `spawnAssets()` (jedes Objekt bekommt dort auch einen **Kartenmarker** via `Flight.mkMarker`, sichtbar nur in der Karte – vorher war ein geparkter Tanker dort ein unsichtbarer Punkt im Nichts). Sats persistieren bei [N] (Cap 12), **Schiffe** (Cap 8) / Tanker / Wracks bei endFlight im All. Rettung `checkRescue()`: Kapsel < 40 m & < 4 m/s → Crew umsteigen; Landung auf Leibniz → `rescueLanded` + Status bereit (in `onLanded`).

### Orbitale Tankstellen (`checkTanker` / `pumpFromAsset` / `pumpToAsset`)
Ein geparkter Tanker heißt **»Tanker ⛽ #1«, »#2« …** (`nextTankerName()` vergibt die
KLEINSTE freie Nummer, ein verbrauchter gibt seine Nummer wieder her) und ist wie die
Station über `targetList()` anwählbar: **[Z]** (überall – Vollgas liegt seit August 2026 auf
⇧X, s. Tastenkürzel); dazu der Knopf »🎯 Ziel«. `targetInfo(tg)` liefert Ap/Pe (⚠️ alles läuft on rails auf KREISBAHNEN,
Ap = Pe – die Zeile sagt das auch so) und beim Tanker den **Restsprit, live aus
`Game.assets`** statt aus dem targetList-Schnappschuss.
- ⚠️⚠️ **Umgepumpt wird, was wirklich da ist.** Vorher machte JEDER Tanker die Tanks
  pauschal voll und verschwand – egal, wie viel er selbst noch hatte: Ein halb leer
  geflogener Tanker betankte damit eine 26-t-Superheavy-Stufe, und »Tanker mit Tanker
  laden« war sinnlos, weil Treibstoff aus dem Nichts kam. Ein Tanker mit Restsprit bleibt
  jetzt im Orbit stehen. Verifiziert: Treibstoff-Bilanz über drei Umpump-Vorgänge exakt
  ±0 kg, Dauerkontakt (40 Aufrufe) pumpt nicht doppelt.
- **Richtung: wer BRAUCHT, bekommt.** Steht drüben ein Tanker mit Vorrat und wir haben
  Platz → zapfen. Sonst gibt der geflogene TANKER ab (`isTanker()` = `PARTS[..].tanker`) –
  an andere Tanker genauso wie an geparkte Schiffe. ⚠️ Die Abgabe darf NICHT an »eigene
  Tanks randvoll« hängen: Nach der ersten Lieferung ist ein Tanker nie mehr voll und
  hätte nie wieder etwas abgeben können.
- ⚠️ Die Stufen-Kapazitäten in `pumpToAsset` kommen aus `VAB.vesselFrom(a.stack)` – exakt
  dieselbe Zerlegung, die `startFromAsset` beim Übernehmen wieder ausliest. Mit
  geschätzten Anteilen liefe `a.fuel` gegen die echten Segmente aus dem Takt.
- ⚠️ `checkTanker` läuft pro SUBSTEP: `pumpToAsset` steigt deshalb mit der billigen
  Prüfung `assetFuel >= tankCapacity` aus, bevor es ein Fahrzeug zerlegen lässt.
- ⚠️ `FUEL_TYPES` = tank/superheavy/starship – **Feststoff (`srb`) zählt NICHT**: Ein
  Feststoffbooster lässt sich weder anzapfen noch nachfüllen.
- `migrateGame` nummeriert Bestands-Tanker nach und gibt ihnen einen vollen
  `fuel[]`-Schnappschuss (unter der alten Regel wurden sie ja auch voll geparkt).

### »🛰️ Objekte im All« – zurückgelassenes wieder fliegen
Was im All bleibt, verschwand früher spurlos (außer Tanker & bemannte Wracks). Jetzt schreibt
`Flight.vesselSnapshot()` **Bauteile, Tankfüllung JE STUFE und Batteriestand** ins Asset, und der
zweite Reiter im 📂-Hangar-Modal (`VAB.hangarTab` / `renderAssets`) listet alles auf.
`Flight.startFromAsset(a)` übernimmt ein Objekt: `VAB.vesselFrom(stack)` baut die Rakete,
`assetPos/assetVel(a,0)` setzen sie auf ihre Bahn, Füllstände kommen aus dem Schnappschuss,
aktive Stufe `ignited=true` bei `throttle=0`, `launchCost=0`.
- ⚠️⚠️ **Asset VOR `Flight.start()` aus `Game.assets` entfernen** – `start()` ruft `spawnAssets()`,
  sonst schwebt das Schiff als Geister-Doppelgänger direkt neben sich selbst.
- ⚠️⚠️ **Die Füllstände MÜSSEN mitgespeichert werden**, sonst ist »Flug beenden + später
  weiterfliegen« ein Gratis-Tankstopp: das leergeflogene Schiff käme mit vollen Tanks zurück.
- ⚠️⚠️ **`this.fromAsset` schaltet die Werbeeinnahmen ab** (`settleCrewAndAssets`). Sonst ist
  »übernehmen → sofort beenden → übernehmen« eine Gelddruckmaschine: zwei Klicks, keine Kosten,
  +40 🪙 je Kommerz-Sat pro Runde. Reset in `start()`.
- Nur **stabile** Bahnen (`pe > atmoH && ap > 0`) werden zum Objekt – `assetPos` kennt nur
  Kreisbahnen, ein Schiff auf Flucht-/Absturzbahn wäre dort eine Lüge. Bemannte Wracks
  persistieren trotzdem immer, sonst wären die Leute unrettbar.
- `assetFlyReason(a)` = "" oder Klartext-Grund (Kommandoeinheit? Triebwerk? Bauteil-Daten?);
  ein nackter Satellit bleibt sichtbares Inventar, aber kein Fahrzeug. Alt-Saves ohne `stack`
  sind »nur beobachten« – nur Tanker bekommen in `migrateGame` `["starshipTank"]` untergeschoben
  (eindeutig), Wracks bewusst NICHTS (geratene Teile = geschenkte Hardware).
- Wrack übernehmen = die gestrandete Crew fliegt sich selbst heim: `rescued` wird gesetzt,
  Landung auf Leibniz zählt als Rettung. Bergung erstattet `stackCost` – unterm Strich also
  genau das zurück, was der Flug gekostet hat, kein Exploit.
- Cap 8 für `kind:"ship"`, weil `spawnAssets` jedem Objekt ein **echtes** `buildRocketGroup`-Mesh
  gibt (Ursprung = Unterkante → `position.y = -stackHeight/2`, sonst hängt der Marker am Fuß).
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
- ⚠️⚠️ **[N] setzt den OBERSTEN Satelliten im Stack aus** (`Flight.nextSatToDeploy()`), also genau den, der in der Montagehalle ganz oben steht. Vorher lief die Suche über `this.v.segs`, und `VAB.segments()` baut die Segmente von UNTEN nach oben – `sg.parts.find(...)` lieferte damit den UNTERSTEN. Wer »Wolkengucker« über »Werbefunk« baute, bekam auf [N] den Werbefunk; die Wetter-Mission blieb offen und sah aus, als würde sie nicht auslösen (Bug-Report Simon). Die Methode bildet die Stack-Position auf die Segment-Nummer ab (Zählweise von `segments()` nachgebaut), damit bei Satelliten in VERSCHIEDENEN Stufen die Leermasse vom richtigen Segment abgezogen wird.
- ⚠️ **Der »noch N an Bord«-Hinweis steht ganz am ENDE von `deploySpecialSat`**, nach allen Zweigen: Teleskop, Durchmusterung und erfüllter Kommerz-Auftrag ERSETZEN `msg` komplett und hätten ihn sonst verschluckt. Genau so verschwand er im Bug-Report – der Werbefunk meldete seine Prämie, dass der Wettersatellit noch an Bord war, stand nirgends.
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
- **Knoten-Physik (didaktisch korrekt):** `predict()` interpretiert **Normal-Δv als reine Ebenen-DREHUNG** (v um den Ortsvektor rotiert via `applyAxisAngle`, Wert = Bogenlänge) → Ap/Pe der grünen Planbahn bleiben beim Plane-Change unberührt. **Beim Zünden** friert `Flight.nodeSnap` {pos,vel,t} ein – die grüne Bahn/Marker/nodeDir zeigen den ursprünglichen PLAN statisch, statt während des Burns mitzuwandern (Reset in addNode/removeNode/start).
  - ⚠️⚠️ **Ob ein Brand »zum Knoten gehört«, entscheidet die RICHTUNG, nicht der SAS-Modus.**
    Die Bedingung war `this.sas==="node" && thrust>0`; wer von Hand auf das rosa ✛ zielte
    (völlig legitim, gerade ohne RCS), bekam WEDER Schnappschuss NOCH Auto-Cutoff. Grüne
    Bahn, Knoten-Marker und `nodeDir` rechneten sich dann bei offener Karte pro Frame neu
    aus dem LAUFENDEN Zustand: gemessen 6,1° Wanderung in 3 s, geplante Inklination lief
    17,4° → 22,7° davon – man jagt sein eigenes Ziel und trifft die Wunsch-Inklination nie.
    Bei GESCHLOSSENER Karte fiel es nicht auf, weil `predict()` dort gar nicht läuft.
    Jetzt: `sas==="node" || nase·nodeDir > 0.5`. **0,5 ≈ 60°** ist bewusst großzügig
    (Handsteuerung) und trotzdem eng genug, dass ein völlig anderer Brand (Landing Burn bei
    einem Knoten in 40 Minuten) den Plan nicht einfriert und den Cutoff nicht auslöst.
    Verifiziert: SAS-Knoten unverändert · Hand auf dem ✛ und 30° daneben = 0,00° Wanderung,
    Auto-Cutoff bei exakt 600 von 600 m/s · 90° daneben friert korrekt NICHT ein.
    ⚠️ `nodeDir` kann null sein, wenn nie eine Karte offen war – Guard nicht entfernen.
- **Kartenmarker:** `markerCanvas(txt,color)` (Canvas) → `mkMarker(txt,color)` (neues Sprite) bzw. `setMarkerLabel(m,txt,color)` (Beschriftung eines BESTEHENDEN Markers tauschen). Der farbige Punkt sitzt EXAKT im Sprite-Zentrum (= Objektposition), Label rechts daneben; Breite dynamisch (`userData.aspect`), skalieren NUR über `Flight.scaleMarker(m,ms)`. Stationsmarker heißt »Große Pause« (nicht mehr "ISS").
  - ⚠️ **Schriftgröße = `MARKER_FONT` (27 px), und das ist der EINZIGE Hebel dafür.** Die
    Canvas-Höhe (48) wird von `scaleMarker` auf `ms/2` Weltmeter gestreckt, die Schrift wächst
    also mit ihrem ANTEIL daran. Am Skalierungsfaktor (`cd*0.042` etc.) zu drehen macht auch
    den Positionspunkt größer – und der markiert die Objektposition, der soll genau bleiben.
    20 → 27 px = +35 % (Bug-Report Simon: »zu klein«). `textBaseline="middle"` statt einer
    von Hand gesetzten Grundlinie, sonst muss der y-Wert bei jeder Größenänderung neu
    ausgerechnet werden.
  - ⚠️ `setMarkerLabel` muss die alte Textur **disposen** – sonst leckt jeder Zielwechsel
    eine Canvas-Textur (verifiziert: 20 Zielwechsel = 0 zusätzliche GPU-Texturen).
- **Begegnungs-Marker trägt den ZIELNAMEN** (»Begegnung mit 🍬 Minzi«, `updateEncounter`):
  »Begegnung« allein sagt nicht, WEN man da trifft – bei mehreren Bahnen im Bild ist das die
  eigentliche Frage (Bug-Report Simon). ⚠️ Nur bei WECHSEL neu zeichnen (`_encFor`), nicht
  pro Frame – das wäre ein Canvas + Textur-Upload alle 16 ms.
  - ⚠️⚠️ **Und er sagt die WAHRHEIT: »Begegnung« nur INNERHALB der Sphäre**, sonst
    »nächster Punkt zu …« (grau). Vorher hieß jede noch so weite Annäherung »Begegnung«.
- ⚠️⚠️ **`findEncounter` liefert `full` – ohne das erfindet die Karte Begegnungen.** Die
  Schrittweite ist an den örtlichen Umlauf gekoppelt (`localT/400`), die Schrittzahl aber auf
  4 200 gedeckelt: In einem 5 300-s-Parkorbit sind das 13-s-Schritte, die Suche kommt damit
  **0,29 von 120 Tagen** weit (Horizont = 1,6 × Hohmann-Flugzeit nach Minzi). Sie verließ den
  Parkorbit also nie und meldete als »dichteste Annäherung« den Punkt der eigenen Kreisbahn,
  der Minzi zufällig am nächsten lag – gemessen **25,94 Mio. km**, mit Marker mitten im Nichts:
  »eine Begegnung, die physikalisch nicht sein kann« (Bug-Report Simon, Screenshot aus dem
  Leibniz-Orbit mit Ziel Minzi). `full` ist false, wenn die Schleife am Schrittzähler endet
  statt am Horizont (ein Einschlag zählt als vollständig). Ausgewertet in `updateEncounter`
  (Marker + HUD-Zahl), `warpToEvent` (sonst springt man auf einen erfundenen Zeitpunkt),
  im `miss()`-Abstieg des Auto-Knotens und in `captureSituation`. Statt der Zahl steht im
  HUD jetzt, WARUM es noch keine gibt. Verifiziert: Parkorbit → kein Marker · nach dem
  Ejection-Burn wieder da (966 272 km, `full` true) · Auto-Knoten-Kette unverändert
  (Monti 1296, Minzi 2275 m/s).
- ⚠️ **Die Bahnlinie des GEWÄHLTEN Reiseziels leuchtet KNALLIG MAGENTA** (`RING_TGT_COL`
  0xff2fb8, Deckkraft 0,95; alle anderen `RING_COL` 0x8fa0c0 / 0,4), gesetzt pro Frame in
  `frame()` – wie in KSP. Zwischen neun gleich grauen Ellipsen war sonst nicht zu erkennen,
  welche davon die eigene Reise meint (Wunsch Simon). ⚠️ Das frühere Hell-Lila (0xc9a0ff) war
  dafür zu nah am blaugrauen Grundton – Magenta kommt im Spiel sonst nirgends vor (Vorbild:
  Principia-Bahnfarben, Bildvorlage Simon). Kostet nichts: Jeder Ring hat sein EIGENES
  `LineBasicMaterial`, und Farbe/Opacity lösen keine Shader-Neuübersetzung aus. Verifiziert:
  genau ein magenta Ring, folgt [Z] sofort, wird bei Ziel »Station« wieder grau.
- **🔭 Kartenfilter »Nur Ziel« (`Flight.mapFocus` / `focusKeeps`, [⇧M] + Knopf):** blendet in
  der Karte alles aus außer der eigenen Bahn, der Bahn des Ziels und der des Körpers, in
  dessen Sphäre man steckt (Wunsch Simon). Weg sind: fremde Planetenringe und -marker,
  Kleinkörper samt Bahnen UND Kometenschweif (⚠️ `updateCometFx` setzt `visible` selbst –
  erst rechnen lassen, dann ausblenden), Station, geparkte Objekte, Missions-Zielringe.
  ⚠️ Die Bahn des eigenen Bezugskörpers bleibt bewusst stehen: Startbahn und Zielbahn
  NEBENEINANDER sind der ganze Sinn, daran liest man den Phasenwinkel ab.
- **Δ Bahnebene im Ziel-Infofenster** (`Flight.relInc`, in `targetInfo`): Winkel zwischen den
  Bahnnormalen von eigener und Zielbahn – die Zahl, ohne die kein Rendezvous und kein
  Transfer klappt (Wunsch Simon). Grün < 0,5°, orange < 5°, sonst rot.
  - ⚠️⚠️ **Auf 0…90° gefaltet, und das ist kein Schönheitsfehler-Fix:** Beim Nachmessen kam
    heraus, dass die beiden Umlaufsinne im Spiel GEGENLÄUFIG definiert sind – Planeten laufen
    um die Sonne mit Bahnnormale **−Y** (Leibniz gemessen: (0,−1,0)), jeder Orbit um Leibniz
    dagegen mit **+Y** (Station: (0,1,0)). Der rohe Winkel meldete für einen normalen
    20°-Parkorbit deshalb **157°** statt 23°. Gefaltet stimmen alle Fälle: äquatorial → 3° zu
    Minzi (dessen echte Bahnneigung!), 20° → 23°, polar → 87°.
  - ⚠️ Für Station und Tanker (gemeinsamer Bezugskörper) bleibt »GEGENLÄUFIG!« erhalten – dort
    ist ein retrograder Orbit eine echte Warnung, kein Konventions-Artefakt. Verifiziert:
    umgekehrte Bahn → 0,0° + GEGENLÄUFIG.
- ⚠️ **Sonne, Planeten und Monde haben eigene Marker** (`Flight.bodyMarkers`, Farbe aus
  `shade2D[0]`, Faktor `cd*0.042`). Vorher zeigte die Karte von einem Planeten nur die
  BAHNLINIE – wo er darauf gerade steht, ist bei 1e11 Zoom nicht zu sehen (seine Kugel ist
  ein Zehntelpixel). Damit ließ sich kein Flug timen, und genau das ist die Kernfrage jeder
  interplanetaren Reise (Bug-Report Simon). Gezeigt wird nur, was auch ENTDECKT ist
  (`bodyKnown`) – der ???-Nebel gilt hier wie im Universum-Bildschirm; die Bahnlinien
  (`moonRings`) bleiben bewusst unverändert sichtbar, sonst verschwände die Anflughilfe der
  Kleinkörper-Missionen.
  ⚠️ **Entklumpen:** Ein Mond, der aus der aktuellen Entfernung optisch auf seinem Planeten
  sitzt (Abstand < 1,3 Markerhöhen), bekommt KEINEN eigenen Marker – sonst kleben in der
  Gesamtsystem-Ansicht »Huygens«, »Cassini«, »Herschel« und »Ada« auf einem Punkt. Beim
  Ranzoomen tauchen sie von allein auf.
- ⚠️⚠️ **Sterne und Nebel müssen mit dem Zoom MITWACHSEN** (`starField.scale`,
  `Flight.nebGroup.scale`, gesetzt in `frame()`). Beide hängen an `scene`, also am
  SCHIFF – in der Flugansicht genau richtig (Himmel dreht sich mit dem Blick). In der
  KARTE wird daraus ein Objekt: Die Sternenkugel hat nur **4e7 m** Radius, beim
  Herauszoomen auf das Sonnensystem ist sie ein sichtbarer PUNKTEBALL, der neben
  Leibniz herfliegt und am Schiff klebt (Bug-Report Simon); die Nebel hängen dann
  zwischen den Planetenbahnen. Also Radius an `camDist` koppeln (Sterne ×40 bis
  1,6e11, Nebel ×80 bis 1,89e11 – beides unter der Far-Ebene 2,2e11). ⚠️ In der
  Flugansicht ist camDist ein paar hundert Meter ⇒ beide Faktoren sind exakt 1, dort
  ändert sich kein Pixel. ⚠️ Die Nebel brauchen dafür eine eigene GRUPPE: Bei Sprites
  multipliziert eine Gruppenskalierung Position UND Bildgröße, und beides muss
  zusammen wachsen.
- ⚠️ **Kleinkörper-Marker tragen den NAMEN, nicht nur das Symbol** (`mkMarker(a.icon+" "+a.name)`).
  Vorher standen Gauß, Emmy, Halley und Whipple als unbeschriftete Pünktchen zwischen den
  beschrifteten Planeten – man sah, dass da etwas ist, konnte es aber nicht zuordnen
  (Bug-Report Simon: »manche Planeten sind benannt und manche nicht«).
  ⚠️ Dafür hängt der Marker jetzt an `smallBodyKnown()`, die **BAHNLINIE aber nicht**: Ohne
  »Rundumblick« sieht man in der Karte weiterhin, dass da eine Bahn läuft – nur nicht, was
  darauf fliegt. Genau so wollte Simon es, und es hält den ???-Nebel der Karriere dicht
  (vorher unterlief die Kartenbeschriftung ihn). Verifiziert: frische Karriere = 4 Ringe
  sichtbar, 0 Namen.

## Bauteile & Stack
`PARTS` (Reihenfolge im Stack: Index 0 = SPITZE; die Zuordnung zu den Rubriken der Teileliste steht in `CATS[].ids`, NICHT mehr als `cat`-Feld am Teil – s. »Teileauswahl im KSP-Stil«). **Radialteile** (`isRadial`: fin, sb2/sb4, gridfin, **legs**) belegen KEINE Stack-Höhe (`stackHeight()` statt Summe!) und werden in `buildRocketGroup` an den benachbarten Tank montiert (`radialHost`: erst darunter, dann darüber; `buildPartMesh(id, {r,h})`). **Sidebooster = Pool PRO STUFE** (`seg.boost` in buildVessel, kein globales v.boost mehr!): zünden mit IHRER Stufe (Zündung/Stufentrennung setzt `n.boost.ignited`) oder [R] (aktive Stufe), [J] wirft NUR die Booster der aktiven Stufe ab (nächstes [J] nach der Trennung = nächste Stufe); abgeworfene Stufen nehmen ihren Pool automatisch mit (hängt am Segment). Physik/HUD/Gauge/Flammen lesen `activeSeg().boost`; Flammen von Oberstufen-Boostern via `bflame.userData.upper` aus (gesetzt in buildRocketGroup, wenn Decoupler darunter). Trümmer-Mesh = `buildStrapOnMesh(strapOnHeight(stack,i))` – NICHT das srb-Mesh (Formwechsel-Bug). Servicebuchten (`bayCoverage()`): `bay` = »M« verkleidet 2 Teile darüber, `bayS` 1 (`PARTS[..].covers`) – aber NUR Typen aus `BAY_FITS` (battery/solar/probe/antenna/lab), sonst "verschluckt" die Bucht z. B. Oberstufen-Triebwerke; geschlossene Bucht schützt Solarpanele vor Fahrtwind, [G] öffnet sie automatisch mit. Oberstufen-Triebwerke (Decoupler darunter) kriegen `flame.userData.idle` – `setFlames` lässt sie aus, bis sie unterste Stufe sind. VAB-Info: Seitenbooster zählen zu Gesamtmasse, TWR **und Δv** IHRER Stufe (`segBoost[]` trägt dafür `dry`/`fuel`/`isp` mit, s. »Δv einer Stufe MIT Seitenboostern«); jede Stufe zeigt Leergewicht, **Kosten (🪙 + Anteil an der Rakete, plus Notiz »mit Gitterflossen bergbar«)** und Δv/TWR, Rakete gesamt »Leergewicht (Tanks leer)«. Die Stufenkosten sind die entscheidende Zahl für Reusability-Builds: Erstattet wird immer nur der gelandete Reststack (`settleCrewAndAssets`) bzw. der geborgene Booster (`b.value = stackCost(debrisStack)`). Solarflügel (`name:"wing"`) starten eingefahren (scale.x 0.1) – für Orbit-Sats `deployWings()`. Fairing verkleidet alles darüber.

### Raketenhülle: prozedurale Textur (`hullTexture` / `SKIN` / `skinPart`)
Die Rakete war das einzige Objekt im Spiel **ohne eine einzige Textur** – Halle, Rampen,
Planeten, Meer und Kleinkörper haben alle prozedurale Kacheln, ausgerechnet das Ding, auf
das man den ganzen Flug schaut, bestand aus zehn einfarbigen `MAT.*`-Materialien.
`hullTexture()` (256², gecacht) malt Blechstöße, Nietreihen, Schweißnähte, Walzflecken und
ein paar technische Marken; `skinPart(g)` zieht sie am Ende von `buildPartMesh` und
`buildStrapOnMesh` über das fertige Mesh.
- ⚠️ **FAST WEISS gemalt** (Basis 250), damit `material.color` sie TÖNT – dasselbe Muster wie
  bei `makeGroundTexture`. Nur so kommt **eine** Kachel für Weiß, Orange, Grau, Rot, Blau und
  Gold aus statt sechs Varianten.
- ⚠️⚠️ **Skaliert wird die UV der GEOMETRIE, nicht `texture.repeat`.** Sonst bräuchte jede
  Bauteilgröße ihre eigene Texturinstanz und damit ihren eigenen VRAM-Upload. Maß ist die
  Bounding-Box (`HULL_TEX_M` = 8 Einheiten ≈ 3 m je Kachel): bei allen Rotationskörpern läuft
  u um den Umfang und v über die Höhe, das trifft Cylinder, Cone, Lathe und Sphere generisch.
  Damit ist ein Niet am Mini-Triebwerk genauso groß wie am Superheavy – gemessen engT 2,8×0,4
  Kacheln, tankL 4,7×5,3, superheavy 5,5×7,9. `geo.userData.skinned` verhindert doppeltes
  Skalieren.
- ⚠️⚠️ **`MAT.*` sind SINGLETONS und tabu – es werden KLONE texturiert** (`SKIN.*`). Sie
  hängen auch in Halle, Station und Rampe; mutiert man sie, bekommen Hallenwände
  Raketennieten. Der erste Wurf hatte genau dieses Leck: `MAT.panel` (Solarzellen) ist ein
  MeshStandardMaterial und lief in den »unbekannt → bestücken«-Zweig – gemessen hatte es nach
  einem einzigen `buildPartMesh` eine map. Deshalb ein `taboo`-Set über **alle**
  MAT-Einträge, nicht nur über die geklonten. Solarzellen bleiben bewusst blank (14 Meshes).
- ⚠️ Materialien, die `buildPartMesh` INLINE erzeugt (Stahl von Superheavy/Starship,
  Sondenhülle, Hitzeschutzkacheln), werden direkt bestückt – die entstehen pro Aufruf neu,
  Mutieren ist dort gefahrlos. `MeshBasicMaterial` (Fenster, Augen, Leuchtflächen) bleibt
  einfarbig.
- ⚠️⚠️ **`buildPartMesh` hat DREI frühe `return g;`** (probePod, probeS, solar) neben dem am
  Ende – wer nur den letzten umstellt, lässt Sonden und Satelliten untexturiert. So gefunden:
  44 blanke Meshes statt 14.
- ⚠️ **Marken sehr blass halten** (Deckkraft 0,10–0,23) und die vier Blechstöße
  UNTERSCHIEDLICH kräftig, Nieten nur an jedem zweiten: Die Kachel wiederholt sich 4–5 mal um
  den Rumpf, und mit den ersten Werten (0,28–0,58) las das Auge sofort ein Gitter – dieselbe
  Falle wie beim Oktaven-LOD des Planeten-Feinreliefs.
- ⚠️ **Kein lesbarer Schriftzug**: bei 4–5 Wiederholungen rundum stünde »LMG SPACE PROGRAM«
  fünfmal nebeneinander. Ein Decal-Band als eigener Zylinder wurde verworfen – auf 0,02
  Einheiten Abstand ist das ein Tiefenstreit-Kandidat (s. Formeltafel).
- Regression: alle 51 Teile bauen fehlerfrei, alle 51 PartIcons rendern (431–2508 nicht-
  transparente Pixel von 5184 – deckt sich mit dem alten Referenzwert 432…2500, die geteilte
  Textur kommt also auch im fremden Icon-GL-Kontext an). `frame()` 0,54 ms.

### Kondensstreifen an den Flossenspitzen (`TRAIL_*` / `addFinTrails`)
Die Wirbelkerne an Flossen- und Gitterflossenspitzen saugen den Druck herunter; die Luft kühlt
ab und die Feuchtigkeit kondensiert zu dünnen weißen Fäden, die nach hinten wegziehen.
Geometrie ist `plumeGeometry()` (dieselbe wie bei der Flamme), die weiche Silhouette entsteht
über `dot(n,V)`, EIN geteiltes Material für alle Streifen (`TRAIL_U.uI` steuert alle).
- Einsatz ab **Mach 0,55** (Wirbelkerne gibt es auch subsonisch) × Staudruck-Faktor
  (`q/22000`): in dünner Luft ist keine Feuchte mehr da, die kondensieren könnte.
- ⚠️ `uOp` 0,22 – additiv + DoubleSide + weiß vor hellem Himmel brennt sonst aus (mit 0,42
  waren es weiße Glasstäbe statt Kondensfäden).
- ⚠️⚠️ Sie müssen in `PartIcons.make` auf die `drop`-Liste (wie die Flammen): In three r128
  zählt `Box3.setFromObject` unsichtbare Kinder mit, ein 20 Einheiten langer Trail an einer
  15 Einheiten großen Flosse schrumpft das Icon sonst auf ein Drittel.

#### ⚠️⚠️ Vapor Cone und Wolkendurchstoß bleiben RAUS
Die beiden anderen Kondensations-Effekte (»Lufthose« um Mach 1 und der Nebel beim Queren der
Wolkenschicht) waren im August 2026 kurz da und sind auf Bug-Report Simon wieder entfernt
worden (»sieht aus wie Feenzauber, und da ist ne Lufthose um das Schiff rum«) – die
Flossenstreifen kamen auf seinen Wunsch zurück, die Hüllen nicht.
- **Warum der Unterschied:** Beide waren additiv gezeichnete RÖHREN um den Rumpf. Physikalisch
  stimmte alles (Mach-Glocke × Staudruck), im BILD liest das Auge aber keine
  Kondensationsfront, sondern einen weißen Schlauch, der die Rakete verschluckt – und zwar
  genau in den Sekunden, in denen man beim Aufstieg auf sie schaut. Ein Faden AN EINER KANTE
  hat dieses Problem nicht. Dieselbe Falle wie beim »Plastiktrichter«-Plasmaschweif, nur ist
  sie bei einer Hülle nicht durch eine weichere Silhouette zu heilen: Ein Vapor Cone IST eine
  Hülle um das Fahrzeug.
- Wer es nochmal versucht, braucht einen volumetrischen Ansatz (Raymarch oder ein Partikelfeld,
  das an der Rakete VORBEIzieht) – und sollte vorher fragen, ob der Aufstieg das braucht.
- Mit entfernt und nicht wiedergekommen: `cloudCoverHere()` (Wolkendeckung aus dem Alpha der
  Wolkentextur).

### Abgasstrahl (`makeFlame` / `FLAME_U` / `FLAME_VERT` / `FLAME_FRAG`)
Vorher ein opaker `ConeGeometry` mit `MeshBasicMaterial` – also genau die harte Silhouette,
die beim Plasmaschweif und beim Kometenschweif schon zweimal als »Plastiktrichter« verworfen
wurde; die Flamme war der letzte Ort, wo der alte Ansatz noch stand. Jetzt eine Mantelfläche,
deren **Form und Deckkraft der Shader rechnet**.
- ⚠️⚠️ **Weiche Silhouette über `dot(n, V)`.** Eine Flamme ist ein leuchtendes VOLUMEN, ihre
  Helligkeit ist die Weglänge des Sehstrahls durch das Gas – und für einen Zylinder ist diese
  Sehne exakt der Kosinus des Winkels zwischen Flächennormale und Blickrichtung: in der Mitte
  lang (hell), an der Silhouette null (unsichtbar). Zusammen mit `DoubleSide` + additivem
  Blending zählt die Rückwand mit, was die Weglänge noch besser trifft. Deshalb hat die Fahne
  keine sichtbare Kante mehr.
- ⚠️⚠️ **Höhenabhängige Form (`uVac = 1 − e^(−h/H)`).** Am Boden drückt der Luftdruck den
  Strahl schlank zusammen, im Vakuum fächert er glockenförmig auf – genau darum taugen
  Vakuumdüsen am Boden nichts, was als Text im »Ochsen« steht, aber nirgends zu SEHEN war.
  Gemessene Halbbreite entlang der Achse (Düse → Ende): **Boden 18 → 0** (verjüngt monoton),
  **Vakuum 18 → 26** (Maximum bei t ≈ 0,5). 0 km → 0 · 5,6 km → 0,63 · 20 km → 0,97.
- ⚠️⚠️ **Der Ursprung gehört an die DÜSENMÜNDUNG, nicht in die Glocke hinein.** Der Strahl
  ist bei t = 0 am BREITESTEN (`R` = 0,7·r beim Triebwerk), die Glocke verjüngt sich nach
  oben: Bei den alten `h·0,2` hatte sie dort nur noch 0,57·r – der helle Anfangsring stach
  also **seitlich durch die Glockenwand**, und genau das sah aus, als setze der Strahl »ein
  Stück zu weit in der Düse« an (Bug-Report Simon). Jetzt liegt er knapp innerhalb des
  Austrittsrings: kein Durchstoßen und trotzdem kein Spalt. Werte: engine `h·0,02` ·
  srb/Strap-on `0` · superheavy `h·0,005` · starship `h·0,008`. Gemessen als Überstand über
  die Unterkante des Bauteils (vorher → nachher): »Ochse« 2,0 → **0,20** · »Böller« 2,4 →
  0 · Superheavy 4,4 → **0,34** · Starship 2,6 → **0,42**. ⚠️ Wer ein Triebwerk umbaut,
  prüft es genauso nach: Plume-Radius (`fl.userData.rad`) gegen den Düsenradius an der
  Ursprungshöhe – der Radius der Düse dort MUSS größer sein.
- **Mach-Diamanten**: `sin(t·f)^6`, nur bei dichter Luft, nur vorn, nur achsennah, mit dem
  Schub enger gestaffelt. Gemessener Kontrast gegen dieselbe Stelle im Vakuum: **+39 %**.
- ⚠️⚠️ **`op` niedrig halten (0,26–0,58).** Additiv UND DoubleSide heißt: jedes Fragment zählt
  doppelt, und ohne Tonemapping ist bei 1,0 Schluss. Mit den ersten Werten (0,55–0,78) war der
  Düsenhals ein 255er-Plateau – und in einer ausgebrannten Fläche sieht man von den Diamanten
  naturgemäß nichts. Nach der Korrektur brennt nur noch **1 von 15** Abtastpunkten aus (der
  Düsenhals selbst, dort ist es wirklich weißglühend). Dieselbe Lehre wie bei den Plasmabändern.
- **Farbe je Triebwerksart** (`FLAME_KIND`): `raptor` bläulich (Methan brennt fast unsichtbar)
  · `kero` gelb-orange · `srb` grell und rußig (`uSoot` schluckt am Ende Licht) · `ion`
  blassblau. Zuordnung in `buildPartMesh` über `p.raptor` bzw. die Teile-ID.
- ⚠️⚠️ **EINE Geometrie und EIN Material-Satz für ALLE Flammen.** `plumeGeometry()` ist ein
  reiner Parameterraum (Radius 1, Länge 1, Düse bei y=0, Ende bei y=−1) und wird von
  Triebwerksflamme, Vapor Cone UND Kondensstreifen geteilt – die echte Größe macht
  `mesh.scale`, die Form der jeweilige Vertex-Shader. Die Uniform-OBJEKTE werden zwischen den
  Farbvarianten geteilt (`Object.assign({}, FLAME_U, …)` kopiert Referenzen, nicht Werte), ein
  `FLAME_U.uVac.value = …` wirkt also überall. Verifiziert: 2 Flammen im Stack → 1 Geometrie.
- ⚠️ **`setFlames` multipliziert mit `userData.len`**, weil die Geometrie normalisiert ist.
- ⚠️ **Die Booster-PiP setzt `uVac`/`uThr` vor ihrem EIGENEN render() neu** (s.
  `updateBoosterCam`): Der Booster brennt dicht überm Wasser, während das Schiff schon im
  Orbit steht – mit den Uniforms des Hauptbildes fächerte seine Fahne auf wie im Vakuum.
- ⚠️⚠️ **`#include <common>` MUSS vor die logdepthbuf-Chunks** – dort liegen
  `isPerspectiveMatrix()` und `EPSILON`. Bei einem ShaderMaterial fügt three das nicht von
  selbst ein; ohne den Chunk scheitert die Vertex-Shader-Kompilierung (so gemessen).
- ⚠️⚠️ **Und beim Kommentieren im GLSL-Template-Literal KEINE Backticks** – auch nicht um
  Bezeichner. Genau das ist beim Bau passiert: ein Backtick beendet das JS-Template-Literal,
  die ganze Datei parst nicht mehr, Symptom `UI is not defined` und weißer Bildschirm. Steht
  seit dem Ozean-Rewrite in dieser Datei und ist trotzdem wieder passiert.

### ⚠️⚠️ Stufengrenzen: Trenner ODER Superheavy/Starship-Naht (`autoSepIdx`)
Ein Stufentrenner ist seit August 2026 nicht mehr die einzige Stufengrenze: **Starship auf
Superheavy trennt sich ohne Trenner** (Wunsch Simon). Bei SpaceX sitzt der Mechanismus im
Interstage-Gitterring oben am Booster – den malt `buildPartMesh("superheavy")` ohnehin schon –,
ein extra Bauteil dazwischen gibt es dort nicht. **Superheavy unter einer SELBST GEBAUTEN
Oberstufe braucht den Trenner weiterhin**: dort ist keine passende Naht, und die Regel »eine
Stufengrenze sieht man am Bauteil« soll sichtbar bleiben.
- **Drei Funktionen, EINE Quelle:** `autoSepIdx(stack)` → Index des OBERSTEN Teils der
  Booster-Stufe (oder −1) · `isStageBreak(stack, i, sep)` → ist `i` das oberste Teil seiner
  Stufe? · `hasStageBelow(stack, i)` → liegt darunter eine Grenze (⇒ Oberstufen-Flammen bleiben
  aus). Benutzt von `VAB.segments()`, `segBottomY()` (Beinlänge), `buildRocketGroup`
  (`flame.userData.idle` + `bflame.userData.upper`) und `nextSatToDeploy()` – alle vier lasen
  vorher selbst nach `type==="decoupler"`.
- ⚠️⚠️ **Der Index wird am STARSHIP festgemacht, nicht am Superheavy** (`return j+1`, wobei `j`
  der Starship-Index ist): Radialteile dazwischen – vor allem die **Gitterflossen** – gehören
  zum Booster. Am Superheavy festgemacht landen sie im Starship-Segment, fliegen bei der
  Trennung mit nach oben und der Booster hat auf dem Rückweg nichts mehr zum Steuern.
  Verifiziert: `[starship, gridfin, superheavy]` → Segmente `[superheavy+gridfin]`,
  `[starship]`; `v.stack` nach [Leertaste] = `["starship"]`.
- Kein Sonderfall im Flug: `stage()` wirft das Segment wie immer ab, `canCatch` greift
  (`site="catch"`), die neue Stufe zündet. Gemessen (Sandbox, eq-Rampe, Trennung bei 30 %
  Restsprit in 8,4 km / 1345 m/s): Superheavy **gecatcht, 10 m vom Turm**.
- ⚠️ Ein trotzdem gebauter Stufentrenner dazwischen schaltet `autoSepIdx` ab (er ist ja das
  nächste Teil über dem Superheavy) – Alt-Raketen aus dem Hangar verhalten sich unverändert.
- Das VAB weist im Info-Panel darauf hin (Kasten »🔗 Starship & Superheavy trennen sich
  automatisch«, nur wenn `autoSepIdx >= 0`). **Nebenbei stimmt damit endlich das Δv**: vorher
  war das Gespann EIN Segment, `segStats` addierte beide Tanks und mittelte die Isp. Jetzt
  Stufe 1 ≈ 2847 m/s (TWR 10,6) · Stufe 2 ≈ 3721 m/s (TWR 10,1).
- Regression geprüft: alle 15 Tutorial-Stacks ergeben weiterhin `Trenner+1` Segmente,
  `autoSepIdx` überall −1, `capError` überall null.

### Ausfahrbare Landebeine – RADIALTEIL ([Y] / `legDrop`/`legClearance`)
⚠️⚠️ **Beine sind seit Juli 2026 ein RADIALTEIL** (`isRadial` kennt jetzt auch `"legs"`),
hängen also seitlich am Nachbartank und belegen KEINE Stack-Höhe – wie Flossen und
Seitenbooster. Vorher waren sie eine eigene Scheibe MITTEN im Stack: Die Beine endeten auf der
Unterkante ihres BAUTEILS, also mitten am Rumpf und weit ÜBER der Triebwerksglocke, und das
Schiff stand trotzdem auf der Glocke. »Die Landebeine machen den Build unsinnig« (Bug-Report
Simon) – zu Recht.
- **Die Beinlänge ist NICHT fest**, sondern wächst mit dem, was unter dem Wirtstank noch
  kommt (`legDrop`): Die Füße stehen immer `LEG_CLEAR` (4 Einheiten ≈ 1,5 m) UNTER der
  Unterkante. Verifiziert für alle Triebwerke: Funke/Terrier/Ochse/Hauptstufe → Fuß-Y −4,
  Fußkreis Ø 23–29 gegen Ø 10–12 Hülle (Falcon-9-Proportion).
- ⚠️⚠️ **Maßgeblich ist die Unterkante der eigenen STUFE** (`segBottomY`), nicht die des
  ganzen Stacks: Ein Lander sitzt beim Bauen auf einem Booster, gelandet wird aber erst NACH
  der Trennung. Ohne das maßen die Beine gegen die 54 Einheiten Booster darunter, rissen
  `LEG_DROP_MAX` und fielen auf die Normallänge zurück – ausgerechnet der klassische
  Lander-auf-Oberstufe bekam Beine, die nicht bis zum Boden reichen. Gegenprobe: Bodenfreiheit
  4 vor UND nach der Stufentrennung (kein Sprung, `rebuildRocket` baut gleich lang).
- ⚠️ Über `LEG_DROP_MAX` (22) hinaus wird NICHT gestreckt, sondern auf `LEG_DROP_DEF` (12)
  zurückgefallen. Mit bloßer Kappung bekamen Beine an der Raketenspitze 52 Einheiten Länge,
  eingefahren 120 hoch und Fußkreis Ø 56 – das sah nach Fehler aus, nicht nach Fehlbedienung.
- ⚠️ **`checkContact` setzt bei ausgefahrenen Beinen `surf += legClearance()`** – das Schiff
  steht auf den Fußtellern, die Unterkante bleibt 4 Einheiten über dem Boden. Sonst steckten
  die Beine im Boden. `toggleLegs` setzt ein bereits stehendes Schiff entsprechend nach.
- ⚠️ Der 12-m/s-Bonus hängt jetzt an `legsOut && clear > 0`, nicht mehr an `seg.hasLegs`:
  Letzteres prüfte `segs[segs.length-1]`, und `segments()` zählt von UNTEN – bei einem noch
  zweistufigen Lander also das falsche Ende der Rakete. Beine, die nicht bis zum Boden
  reichen, tragen nichts (8 m/s) und [Y] sagt das auch.
- ⚠️ `LEG_OUT` ist mit 0,45 rad (25,8°) bewusst FLACH: Der Spreizwinkel geht über
  `legL = Spannweite/cos` in die Beinlänge ein; mit den alten 0,9 rad wäre ein Bein, das am
  Triebwerk vorbeireicht, doppelt so lang und der Stand dreimal so breit wie die Rakete.
  `LEG_IN` liegt nahe an π, damit das eingefahrene Bein FLACH am Tank liegt (Radius 5,9 bei
  Hülle 5) und weiter unter eine Nutzlastverkleidung passt.
- `stackYBot(stack)` ist die EINE Quelle für die Unterkanten-Höhen (buildRocketGroup und die
  Bein-Geometrie).

#### Bein-Mechanik im Betrieb
**Gebaut und gestartet wird EINGEFAHREN** – nur so passt ein Lander unter eine
Nutzlastverkleidung, und genau dafür war der Wunsch da. Die 3 Beine hängen an Gelenk-Gruppen
`name:"landleg"`; `foot.rotation.z = −LEG_OUT` ⇒ der Teller liegt ausgefahren flach auf.
- ⚠️ Der Winkel wird in **JEDEM Frame** gesetzt (`legsAnim`, Einschwingen 0,09/Frame), nicht
  nur beim Umschalten: `rebuildRocket()` (Stufentrennung, Fairing, Aussetzen) baut die Gruppe
  neu und die frischen Beine kämen sonst in der Bau-Pose (eingefahren) zurück.
- Warnung beim Sinkflug unter 3 km (`_legMsg`, scharf ab 5 km wieder).
- Tutorial "land" nennt [Y] im ersten Schritt – sonst landet die AG mit 8-m/s-Limit,
  ohne zu wissen warum.

## Montagehalle (VAB-3D-Szene)
### ⚠️ Hallenmaße hängen an der Kamera (`HW`/`HH` ↔ `camDist`-Deckel)
`const HW = 300, HH = 260` (halbe Breite / Höhe, Halle also 600×600×260). **`HW` MUSS größer
bleiben als der `camDist`-Deckel im wheel-Handler (250)** – sonst steht die Kamera beim
Rauszoomen in der Wand, und bei einer hohen Rakete sieht man statt der Rakete nur Trapezblech
(so gemeldet: »bei komplexeren Raketen ist die Hallenwand im Weg«). Faustregel: HW ≈ camDist_max + 50.
Wer hier dreht, muss mitziehen: Stützen-/Binder-/Lampen-Loops (laufen über `HW`), die
Textur-`repeat` (an `HW`/`HH` gekoppelt, sonst ziehen die Betonkacheln lang) und das
Schatten-Ortho-Fenster (s. Licht-Abschnitt).
- ⚠️⚠️ **`VAB.rebuild()` MUSS denselben Deckel benutzen** (`clamp(h·1,7, 45, 250)`). Die
  automatische Einpassung kannte ihn nicht: Gemessen bei 11 Teilen (h = 182) landete sie bei
  **camDist 309** – also außerhalb der 300 Einheiten Halbbreite, die Kamera stand IM
  Trapezblech (Bug-Report Simon mit Screenshot).
- ⚠️⚠️ **Und sie läuft nur bei ECHTER Änderung** (`this._fitH`, Toleranz 0,5): `refresh()`
  wird nicht nur beim Bauen aufgerufen, sondern bei JEDEM Wechsel auf den Hallen-Bildschirm
  (`UI.show("vab")`). Wer kurz in die ⚙️ Optionen schaut und zurückkommt, bekam sonst seinen
  Zoom zurückgesetzt. Verifiziert: heranzoomen (90) → Optionen → zurück = 90 · Rakete wächst
  (h 182 → 224) = wieder eingepasst.
### Ausblick durchs offene Hallentor (Südwand)
Durch das offene Tor sieht man hinaus auf den **LMG-Startplatz** – die Rakete steht damit beim
Bauen sichtbar in dem Zusammenhang, für den sie gebaut wird (Wunsch Simon).
- Bewusst IMMER der LMG-Startplatz, egal welche Rampe gewählt ist: Er ist der Heimatbahnhof der
  AG, und ein wechselnder Ausblick würde die Halle jedes Mal anders aussehen lassen, ohne etwas
  zu erklären.
- ⚠️⚠️ Die Rampe kommt aus DERSELBEN `Flight.buildPad("lmg")` wie im Flug – kein zweites
  Modell, das auseinanderlaufen kann. Die Funktion benutzt kein `this`, ist also eine reine
  Fabrik und aus dem VAB heraus aufrufbar.
- ⚠️⚠️ **Die VAB-Szene hat FOG** (320…900) für die Hallenatmosphäre. Alles draußen bekommt
  deshalb Materialien mit `fog = false`, sonst versinkt der Startplatz im dunkelblauen
  Hallennebel, obwohl draußen Tag ist. Für die Rampe werden die Materialien dafür GEKLONT: Es
  sind dieselben `MAT.*`-Singletons, die auch Hallenwände und Kisten benutzen (dieselbe Falle
  wie bei den Teile-Icons), und die sollen ihren Nebel behalten.
- ⚠️ Eine PlaneGeometry kann kein Loch – die Südwand ist deshalb eine `Shape` mit `holes`.
  ⚠️ `ShapeGeometry` legt die UVs in SHAPE-Koordinaten an (0…600), nicht 0…1 wie eine Plane:
  Die Trapezblech-Kachel braucht dafür einen eigenen Textur-Klon mit entsprechend kleinem
  `repeat`, sonst ist die ganze Wand eine einzige riesige Kachel.
- ⚠️ **Stützen und Sockelleiste im Torbereich weglassen** – sonst steht ein Stahlgitter im
  Ausblick und das offene Tor sieht aus wie ein vergittertes Fenster (so passiert).
- Das Torblatt ist nach oben gefahren (Paket über dem Sturz + Führungsschienen); Himmel, Wiese
  und Betonvorfeld draußen sind unbeleuchtete Flächen (`MeshBasicMaterial`) – draußen ist Tag,
  drinnen düster, und das kostet kein Licht. Dazu ein schwaches Richtungslicht, das durchs Tor
  hereinfällt.
- ⚠️ Kamera-`far` von 2000 auf **4000** – der Himmel steht 2400 Einheiten vor dem Tor. Auf die
  Tiefengenauigkeit wirkt das praktisch nicht (die hängt bei far ≫ near fast nur an `near`).

### Formeltafel an der Nordwand (`makeFormulaBoardTex`)
Die Wand gegenüber dem Tor war die einzige leere – und dorthin schaut man, sobald man um die
Rakete dreht. 2048×960-Canvas, Schiefergrün, 8 Formeln mit den **echten** Konstanten des
Spiels (Leibniz/Monti), damit die AG nachschlagen kann, was das HUD anzeigt.
- ⚠️ Die Wand entsteht mit `mkWall(0,HW,Math.PI)`, zeigt also nach **−z**; Tafel und Rahmen
  brauchen dieselbe Drehung (PlaneGeometry zeigt ungedreht nach +z).
- ⚠️ **Tief-/Hochstellung wird selbst gesetzt** (Markup `_{sp}` / `^{2}`, Mini-Parser in `chalk`).
  Unicode ₀₁₂ ist kein Ersatz: Georgia hat dafür keine echten Glyphen, der Browser setzt
  Ersatzzeichen auf die Grundlinie – aus `g₀` wird sichtbar »go«, aus `m₁` ein »m1«.
  Underscores wie `v_f` zu schreiben sieht dagegen nach Quellcode aus.
- ⚠️ **`emissiveMap` mit derselben Textur (0.35)**: Die Halle ist absichtlich düster, rein
  diffus beleuchtet ist die Kreide aus 300 Einheiten nicht mehr lesbar.
- ⚠️⚠️ **Der Rahmen ist ein echter RAHMEN aus vier Leisten, KEINE Platte hinter der Tafel.**
  Als Platte lag seine Vorderseite 0,2 Einheiten hinter der Tafelebene – auf 400 Einheiten
  Entfernung sind das nur ~2 Tiefenstufen. Folge (Bug-Report Simon): schwarze Kacheln in der
  Rahmenfarbe wanderten bei jeder Mausbewegung über die Formeln. Vier Leisten AUSSERHALB der
  Tafelfläche haben keine gemeinsame Ebene – unabhängig von der Tiefengenauigkeit der
  Grafikkarte. Aus demselben Grund steht die Tafel 6 Einheiten vor der Wand.
- ⚠️ Dazu **VAB-Kamera `near` von 0,1 auf 1** gesetzt: Die Tiefengenauigkeit hängt fast nur an
  der Nahebene (`Δz ≈ z²·(far−near)/(near·far·2^bits)`), 0,1 verschenkte in einer 600 Einheiten
  großen Halle Faktor 10. Näher als ~14 Einheiten kommt die Kamera nie an Geometrie (kleinster
  `camDist` 20, Raketenradius ~6). **Nicht wieder senken** – Schulrechner mit 16-Bit-Tiefenpuffer
  sind hier nochmal 256× empfindlicher.
- Schreibschrift nur für Überschriften (Fallback-Kette bis `cursive` – auf Schulrechnern ist
  ungewiss, welche Font existiert); Formeln in einer Serifen-Font.
### Teileauswahl im KSP-Stil (`CATS` / `VAB.renderParts` / `PartIcons`)
Links steht nur noch eine schmale **Kategorien-Leiste** (`#partRail`), daneben die
ausklappbare **Teileliste** (`#partList`). Klick auf eine Kategorie öffnet sie, Klick auf die
OFFENE fährt die Liste ein – dann hat die Halle die volle Breite. Genau dafür ist das da:
gemessen bei 1440 px 929 → **1130 px Halle**, bei 1280 px 818 → **1004 px**.
- ⚠️⚠️ **Sortiert wird nach HARDWARE, nicht nach Raketenstufe.** Vorher hießen die Rubriken
  »1. Stufe« / »2. Stufe«, und dadurch lagen Tanks in DREI davon verstreut (S/M oben, L/XL
  unten, Mini bei den Satelliten) – wer einen Tank suchte, musste raten, für welche Stufe die
  Rakete ihn wohl braucht (Bug-Report Simon). Jetzt: Kapseln · Tanks · Antrieb · Booster ·
  Struktur · Aero & Landung · Elektrik · Nutzlast.
- ⚠️ **`CATS[].ids` ist die EINZIGE Quelle der Zuordnung** und zugleich die Reihenfolge in der
  Liste (klein → groß). Das alte `cat:"…"`-Feld in `PARTS` ist ersatzlos weg – sonst pflegt
  man dieselbe Information zweimal. Gegenprobe nach jeder Teile-Änderung: Summe der `ids`
  muss `Object.keys(PARTS)` sein, ohne Dubletten (getestet: 50/50).
- `short` ist der Text auf der schmalen Leiste (max ~8 Zeichen, sonst bricht er zweizeilig um),
  `name`/`sub` stehen über der offenen Liste.
- Gesperrte Teile bleiben SICHTBAR, grau (`filter:grayscale(1)`) und nennen den fehlenden
  Tech-Knoten im Klartext (»🔒 Erst erforschen: Flüssigtriebwerke I«) – man soll sehen, was
  es noch gibt, und wo es herkommt.
- ⚠️ **`renderParts()` baut nur neu, wenn sich wirklich etwas ändert** (`_partsKey` aus
  Kategorie + Sandbox/Karriere + Zahl der erforschten Knoten). `VAB.refresh()` läuft bei
  JEDEM Anbauen und Verschieben – ohne den Schlüssel würden dabei jedes Mal zehn
  Bauteil-Meshes weggeworfen und neu gebaut.
- ⚠️ **Preis der neuen Leiste: bei 1280 px bricht `#vabTop` zweizeilig um, solange die Liste
  offen ist** (Rail 52 + Liste 186 = 238 px gegen früher 198 px, und die Werkzeugleiste
  brauchte dort schon 853 von 858 px). Bei **1440 px bleibt sie einzeilig** – dafür sind die
  clamp()-Werte gelegt, nicht enger. Wer daran dreht, misst beides nach.

#### Die 3D-Icons (`PartIcons`)
Jede Karte zeigt das Bauteil als langsam drehendes 3D-Modell – gebaut mit DEMSELBEN
`buildPartMesh`, das auch die Rakete in der Halle baut. Was im Icon steht, ist garantiert das,
was man bekommt.
- ⚠️⚠️ **EIN Offscreen-Renderer für ALLE Icons** (72×72, `preserveDrawingBuffer:true`), das
  Bild wandert per `drawImage` in das 2D-Canvas der Karte. Ein WebGL-Kontext pro Kachel wäre
  nach ~16 Stück am Browser-Limit. Ohne `preserveDrawingBuffer` darf der Browser den
  Zeichenpuffer nach dem Render verwerfen und drawImage liefert je nach Treiber Schwarz.
- ⚠️⚠️ **Materialien werden GEKLONT.** `buildPartMesh` verteilt die gemeinsamen
  `MAT.*`-Singletons, die auch in der Hallenszene hängen. Bekämen die hier eine envMap
  verpasst, hätte die Halle eine Umgebungskarte aus einem FREMDEN WebGL-Kontext – das kann
  three.js nicht abfangen. Klonen ist billig (Texturen bleiben geteilt), `clear()` gibt die
  Klone beim Kategoriewechsel wieder frei.
- ⚠️ **Flammen (`name:"flame"/"bflame"`) fliegen raus, BEVOR die Bounding-Box gemessen wird.**
  In three r128 zählt `Box3.setFromObject` auch unsichtbare Kinder mit – sonst wäre jedes
  Triebwerk auf ein Zehntel geschrumpft, weil sein Abgasstrahl mitgemessen wird.
- ⚠️ Sonderfall **Fairing**: `buildPartMesh` liefert nur den Montagering, die Ogive baut erst
  `buildFairingShell` beim Zusammensetzen. Als Icon wäre das eine gelbe Scheibe, die niemand
  erkennt – deshalb stellt `make()` die Hülle fürs Bild dazu.
- Gerendert wird aus `VAB.frame()` heraus, gedrosselt auf ~30 fps, und nur für Karten, die
  wirklich sichtbar sind (`offsetParent`). Bei eingefahrener Liste läuft gar nichts.
- Gegenprobe nach Teile-Änderungen: alle 50 Icons einmal rendern und die Zahl der
  nicht-transparenten Pixel zählen – 0 heißt kaputtes Mesh (gemessen: 432…2500 von 5184,
  die dünnen Teile Antenne/Beine/Solarpanel am unteren Ende).

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
- ⚠️⚠️ **`profile()` kennt ALLE Verkleidungen, nicht nur das Fairing.** Der Fahrtwind
  sieht die HÜLLE, nicht das Teil darunter:
  - **Stufenadapter** (`type:"inter"`): Die Röhre ragt `shroudH − eigene Höhe` nach OBEN
    (Falcon-9-Interstage). Jedes Teil, das mehrheitlich darin steckt, bekommt den
    Adapter-Radius. Ohne das meldete der Windkanal an der **richtig** gebauten Rakete
    einen Durchmessersprung, den es in der Szene gar nicht gibt: Der Ø-10-Stufentrenner
    zwischen zwei Ø-12-Teilen steckt komplett im Adapter, kostete in der Rechnung aber
    **33 % des Widerstands** (Cd 0,653 statt 0,435). Genau das trieb die AG dazu, das
    Fairing UNTER den Adapter zu bauen – wo es beim Stufentrennen mit abfliegt und
    architektonisch Unsinn ist (Bug-Report Simon). Verifiziert: beide Bauweisen jetzt
    Cd 0,435 · ohne Adapter bleibt der Sprung erhalten (0,90–0,95).
  - **Servicebuchten** (`bayCoverage`): Inhalt bekommt den Buchtradius, und das OBERSTE
    verkleidete Teil zusätzlich den Typ **`bayCap`** (Stumpfheit 0,35). ⚠️ Nur den Radius
    anzuheben und die Stumpfheit des Satelliten zu behalten machte die Bucht in der
    Rechnung SCHLECHTER als gar keine (Cd 1,04 gegen 0,89) – obwohl ihr Teiletext »senkt
    den Luftwiderstand« verspricht und `buildRocketGroup` oben einen KEGEL zeichnet
    (`lid` von r·0,35 auf r/2). Jetzt 0,59 gegen 0,89 = −34 %.

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
### ⚠️ Δv einer Stufe MIT Seitenboostern (`VAB.stageDeltaV`)
Die Anzeige war mit und ohne Booster **identisch** (Bug-Report Simon): `renderInfo`
rechnete Ziolkowski nur über den Kern, der Booster-Pool ging ausschließlich in
Gesamtmasse und TWR ein. Physikalisch falsch – Booster tragen Treibstoff UND schieben.
Parallelstufung sind **zwei Abschnitte**, nicht einer:
1. Booster + Kern brennen gemeinsam → Rechnung mit GESAMTSCHUB und gemeinsamem
   Massenstrom, also einem **effektiven Isp**. ⚠️ NICHT der Mittelwert der Isp-Werte:
   Ein 220-s-Feststoffbooster frisst bei gleichem Schub deutlich mehr Masse als ein
   345-s-Vakuumtriebwerk.
2. Die leeren Booster werden **abgeworfen** (ihre Leermasse fliegt mit weg – genau das
   ist der Sinn), der Kern brennt allein weiter.
Wessen Tank zuerst leer ist, entscheidet die Rechnung selbst; brennen die Booster
länger als der Kern, schieben sie den Rest allein.
- ⚠️ **EINE Funktion für Halle UND Flug** (`VAB.stageDeltaV`, reine Zahlen als
  Argumente): Das HUD zog vorher `mDry = mNow − fuelLeft − srbLeft` und ließ den noch
  hängenden Booster-Sprit stehen – Halle und Cockpit zeigten verschiedene Zahlen.
  Verifiziert: VAB 5540 = HUD 5540 · nach [J] 4360 · mit halb leeren Boostern 5031.
- **Gegen eine numerische Integration des Brennverlaufs auf 1 m/s genau geprüft**
  (5 Fälle, inkl. Booster+SRB in derselben Stufe und Kern, der VOR den Boostern leer
  ist). Beispiel Sondenkapsel + Tank M + »Floh«: ohne Booster 4360 · ×2 5540 · ×4 6077 –
  der abnehmende Zugewinn ist die mitgeschleppte Leermasse, didaktisch genau richtig.

#### ♻️ Zweite Zeile: Δv MIT Bergung (`BOOSTER_RESERVE` / `boosterReserve`)
Die Δv-Zahl einer Stufe war immer der **Wegwerf-Wert** – sie verheizt den Tank bis auf den
letzten Tropfen. Eine bergbare Erststufe darf das nicht: Boostback und Landung kosten Sprit,
und genau der fehlt beim Aufstieg. Deshalb steht bei jeder Stufe mit **Gitterflossen oder
Superheavy** eine zweite, grüne Zeile »♻️ mit Bergung« samt Verlust und Landeplatz
(Wunsch Simon).
- Gerechnet mit derselben `stageDeltaV`, nur zwei Änderungen: Der Kern verbrennt nur
  `(1 − Reserve)` seines FLÜSSIG-Tanks, und die Reserve hängt am Brennschluss noch als
  MASSE mit dran (`mEnd`). ⚠️ Feststoff (`srbFuel`) wird NICHT reserviert – ein
  Feststoffbooster lässt sich nicht abstellen. Gegen Ziolkowski von Hand geprüft
  (3987,7 / 2070,2 m/s, auf 0,1 m/s identisch).
- ⚠️⚠️ **`BOOSTER_RESERVE` (rtls 0,30 · ship 0,12) ist die EINE Quelle** – für die orange
  Tankmarke im Flug (`#fuelMark`) UND für diese Zeile. Laufen sie auseinander, zeigt die
  Halle eine andere Zahl als das Cockpit. Der Landeplatz kommt aus `Flight.boosterSiteEff`
  (der Superheavy fährt nie zur See ⇒ immer RTLS-Reserve, s. »Booster-Landeplätze«).
- Gemessen an derselben Rakete (Δv 3587 expendable): Droneship/Wasserung 2793 (−793) ·
  RTLS 1929 (−1658) · Superheavy+Starship 2862 → 1713 (−1149). Genau dieser Unterschied ist
  der Grund, warum SpaceX für schwere Nutzlasten aufs Droneship geht statt zur Rampe.
- **Bau-Caps:** `VAB.capError(stack)` – **max. EIN Triebwerk (`type:"engine"`) pro
  STUFE** (zwei Düsen übereinander gibt es an keiner Rakete, die obere säße im Tank der
  unteren – und `buildRocketGroup` malt genau das; gemeldet von Simon. Die Regel greift
  auch bei Triebwerk/Tank/Triebwerk in derselben Stufe, denn ein Triebwerk mitten im
  Stack ist genauso Unfug. Verifiziert: alle 15 Tutorial-Stacks bleiben gültig),
  max. EIN `sideboost`-Paket, max. EIN `srb` UND max. EIN `superheavy` pro STUFE (⚠️ Seitenbooster waren bis Juli 2026 zwei pro Stufe – ein Δv-Cheat, den Simon gemeldet hat: Ein Paket IST schon der ganze Kranz (»×2« = 2 Booster, »×4« = 4, alle zünden und trennen gemeinsam), zwei Pakete waren also 4 bzw. 8 Booster mit doppeltem Treibstoff – und `buildRocketGroup` malt trotzdem nur EINEN Kranz, man sah den Cheat der Rakete nicht einmal an. Gewollt sind 2 bzw. 4 Booster insgesamt je Stufe) (sonst Gratis-Δv durch Stapeln; zwei Superheavys in einem Segment waren 52 t geschenkter Treibstoff), dazu `bayError` für den Starship-Frachtraum. Guards in `VAB.add`, `dropAt` (Drag&Drop neu UND move) UND `validate()` (fängt gespeicherte Hangar-Raketen). ⚠️ `VAB.add` prüft `capError` seit dem Superheavy-Cap für **JEDES** Teil (vorher nur für sideboost/srb) – der Probe-Stack muss dabei an der Stelle eingefügt werden, an der das Teil wirklich landet (Kapsel/Schirm oben, Rest unten). Getrennte Stufen bleiben erlaubt: Superheavy + Stufentrenner + Superheavy ist eine legitime zweistufige Rakete. Start zieht Kosten ab (`UI.launch`, `Flight.launchCost`), Bergung nur bei Landung auf LEIBNIZ (`settleCrewAndAssets` → `statRefund`, voller Restwert des übrigen Stacks). Crash/All = Totalverlust. Alte Saves: `migrateGame()`.
- **Wiedereintritts-Hitze (tödlich!):** in `step()`: sinkend + `v>1600` + `heat=rho·v³>2e5` → ohne Schutz wächst `heatDmg` um `(0.12·sev + heat/5e8)/s` mit `sev = min(1, heat/1.5e7)` → bei 1 verglüht (explode, Crew-Schleudersitz-Meldung). Die Warn-MELDUNG kommt weiterhin erst ab 1.5e7, sonst stünde sie minutenlang in dünner Luft im Bild. Suborbitale Hüpfer (<1600 m/s) bleiben safe – diese Grenze ist die didaktische und unverändert (echte Testflüge: Apogäum 17/22 km, vmax 314/560 m/s, heatDmg 0.00).
  - ⚠️⚠️ **Der Grundschaden darf NICHT an einer harten Schwelle hängen** (früher: nur bei `heat>1.5e7`, dann volle `0.12/s`). `cdA` ist FEST (4, unabhängig von der Raketengröße), also entscheidet allein die MASSE, wie hoch ein Schiff abbremst – und ein LEICHTES Schiff verliert seine Bahngeschwindigkeit so weit oben, dass es die Schwelle nie reißt. Gemessen an einer 0,9-t-Kapsel aus 500 km: Spitzenwert `rho·v³` = **1,3e7**, und dort war v schon bei 1260 m/s ⇒ heatDmg **0,00**, heile Landung ohne jeden Hitzeschild (Bug-Report Simon). Ausgerechnet die Anfänger-Sonde kam durch, die schwere Rakete starb. A/B auf identischer Bahn (heatDmg beeinflusst die Bahn nicht, also einfach pro Schritt zurücksetzen und beide Formeln mitintegrieren): leichte Kapsel ALT 0,00 → NEU verglüht bei 49 km · schwer ALT 39 km → NEU 48 km · flaches Aerobraking Pe 55/65 km ALT 0,00 → NEU 57/54 km.
  - ⚠️ **NICHT die Schrittweite/der Zeitraffer war schuld** (naheliegende Vermutung): 1×/5×/50×/500× liefern dasselbe Ergebnis, und dieselbe Bahn mit dt 0,02 gegen dt 0,83 stimmt überein. Auch `maxDt` ist nahe am Planeten fein (bei 600 km Höhe schon 1,3 s) – die 600-s-Schritte gibt es nur weit draußen.
  - Schutz = `shield`-Teil ODER Starship **in Bauchlage**: Kacheln nur am Bauch (+Z körperfest), `dot(+Z, airVel) > 0.5` – Nase voran = Tod (eigene Warn-/Crash-Meldungen »Kacheln zeigen nicht in den Wind«, Tutorial "starship" warnt entsprechend).
  - ⚠️⚠️ **Dazu gehört zwingend der Zweig `belly.state==="flop" && wind > 0`:** `updateBelly` legt die Nase WAAGERECHT, der Bauch zeigt also nach UNTEN – beim flachen Wiedereintritt kommt der Wind aber noch fast von vorn. Gemessen: `Bauch·Wind` = **0,10** durchgehend von 74 bis 50 km, über 0,5 steigt es erst im steilen Endfall. Solange der Schaden erst ab ~33 km begann, fiel das nie auf; mit dem Start bei ~57 km verglüht ein KORREKT geflogenes Starship in Bauchlage sonst bei 48 km. Verifiziert: [C]-Bauchlage heatDmg 0,00 · Nase voran verglüht bei 48 km.
  - **Aus dem Orbit ohne Hitzeschild = immer Tod**, jetzt auch für leichte Schiffe und für flache Aerobraking-Tricks. Mit Schild: sichere Landung (flach, steil und aus 5000 km Apogäum getestet, heatDmg 0,00). Reset `heatDmg` in start().

#### Plasma-Optik beim Wiedereintritt (`buildPlasma` / `PLASMA_*_VERT/FRAG`)
Rein visuell, gesteuert in `frame()`; die Hitze-PHYSIK bleibt in `step()` (heatDmg).
`Flight.plasmaGroup` wird **einmal lazy** gebaut und hängt an `scene` (das Schiff IST der
Szenen-Ursprung); +Y der Gruppe = windabgewandt. Intensität `gI = (shipTemp−600)/900`
(= ab roter HUD-Temperatur), aus bei map/landed/crashed/`alt > atmoH`/airVel < 600.
Alles danach läuft über **Uniforms** – kein Puffer wird je neu hochgeladen (3 Draw-Calls,
5688 + 1440 Dreiecke, gemessen **0,07 ms/Frame**). Drei Bestandteile:
1. **Stoßfront** (`PLASMA_CAP_*`): Paraboloid-**Schale**, kein gefüllter Kegel. Deckkraft
   läuft am Rand auf 0 (nur so keine Silhouette – daran war der alte Kegel-Versuch als
   »Plastiktrichter« gescheitert). Die Sichel entsteht durch **Limb-Brightening** `1/µ`:
   eine dünne leuchtende Schale ist dort am hellsten, wo man flach durch sie hindurchsieht.
2. **Nachlauf** (`PLASMA_WAKE_*`): 132 feine Streifen (tragen die Striation) + 26 sehr
   breite, weiche Bänder (die zusammenhängende Leuchtschicht) im SELBEN Puffer, Flag
   `aCore`. Nur die feinen = nasse Haare, nur die Schicht = Fackel, erst beide zusammen
   = strömendes Plasma. Die Mittellinie kommt aus `curve()` IM SHADER, das Band wird im
   Vertex-Shader zur Kamera aufgespannt (wie die Windkanal-Rauchfahnen – ein Band mit
   fester Ebene verschwindet, sobald die Kamera in seine Ebene dreht).
3. **Blend-Sprites** (`glare` breit + `hotSpot` an der Staukante, `depthTest:false`) als
   Bloom-Ersatz. Postprocessing wäre auf Schulrechnern der teuerste Posten überhaupt.
- **Farbfolge** `plasmaRamp` = echte Emissionsfolge heißer Luft: violett → magenta → rot →
  orange → gelb → weißglühend → blauweiß. Das Violett am Schweifende ist der Grund, warum
  echte Aufnahmen nicht wie Feuer aussehen – es ist angeregter Stickstoff, kein Feuer.
- ⚠️⚠️ **EIN Band darf für sich NICHT hell sein.** Additiv summieren sich alle Bänder auf dem
  Sehstrahl, und alles über 1 ist weiß; quer im Wind liegen ein Dutzend übereinander. Mit dem
  naheliegenden Faktor 1,35 war ein einzelnes Band schon bei 1,09 – der Nachlauf eines quer
  liegenden Starships war eine weiße Fläche, von der Farbfolge nichts zu sehen. 0,45 lässt ein
  Band bei 0,52 und erst das Bündel weiß werden.
- ⚠️⚠️ **Der Querschnitt geht als FLÄCHE ein** (flächengleicher Kreis `√(A/π)`), nicht als
  Kante: Quer im Wind ist die Silhouette eines Starships ein 124×14-Rechteck – nimmt man die
  halbe LÄNGE als Radius (62), steht um das Schiff eine Glocke von 124 Einheiten Durchmesser
  und die Verfolgerkamera hängt mitten darin (gemessen: reiner Weißabriss). Die Fläche liefert
  23,5. `half` (Ausdehnung LÄNGS des Windes) bleibt die lineare Interpolation.
- ⚠️ **Die Nachlauf-LÄNGE hängt an `height()`, nicht am Stoßfront-Radius.** Die Kamera steht
  bei 2,2·H, also ist H das einzige Maß, das zum Bildausschnitt passt. Über den Radius
  gerechnet war die Fahne eines quer liegenden Starships 400 Einheiten lang bei 150 Einheiten
  Kameraabstand.
- ⚠️ **Nahausblendung** (`uNear`, Fragmente dicht vor der Linse verschwinden) – ohne sie ist
  der Bildschirm weiß, sobald man die Kamera hinter das Schiff in den Nachlauf dreht. Die
  Blend-Sprites werden dafür über `nearF` (aus `camDist`) gedimmt.
- ⚠️ Der Radius-Exponent in `curve()` ist **> 1** (1,25): Die Fahnen müssen am Kopf noch am
  Rumpf kleben und erst weiter hinten auffächern – mit 0,8 stand um den Bug ein Besen.
- ⚠️ **Länge pro Fahne stark streuen** – gleich lange Fahnen sehen aus wie ein Kamm, erst die
  ausgefransten Enden lesen sich als Strömung.
- ⚠️ Der Flug-Renderer hat `logarithmicDepthBuffer` → die `logdepthbuf`-Chunks sind in beiden
  Shadern PFLICHT. GLSL ES 1.00 (kein `inverse()`, keine dynamischen Loop-Grenzen).
- Dazu weiterhin Funken-Partikel nach hinten (nur warp ≤ 2), ~28 % davon magenta.
- **Kontext-Buttons:** `Flight.updateButtons()` (in drawHUD, pro Frame): blendet Booster[R/J]/Schirm/Fairing/Satellit/Panele/EVA/Bellyflop/Docken/Modul/Bucht/Experiment aus, wenn das Vehikel die Ausrüstung nicht hat (IDs btnBoostR/btnBoostJ/btnChute/btnFairing/btnSat/btnPanels/btnEva/btnBelly/btnDock/btnModul/btnBay/btnExp). Modul zusätzlich nur Karriere.
- **SRB-Anzeige getrennt:** Tank-Gauge/`fuelPct`/HUD-Zeile »Treibstoff« = NUR Flüssigtreibstoff; Feststoffbooster (inline `srb`, nicht drosselbar – brennen auch bei Schub 0 weiter, Tank bleibt voll!) haben eigene HUD-Zeile + teilen sich die orange Booster-Gauge mit dem Seitenbooster-Pool der aktiven Stufe.
- **Hangar-Dateien:** `VAB.exportRockets()` (Download `lmg-raketen.json`) / `VAB.importRockets(file)` (Merge per Name über `VAB.mergeRockets`, filtert unbekannte Teile-IDs) – Buttons im Hangar-Modal + verstecktes `#rocketFile`-Input. Für Schüler*innen, die den PC wechseln.
- **Der Spielstand-Download (`UI.saveGame`) nimmt den Hangar mit** (Feld `rockets`), `UI.loadGame` mischt ihn per `VAB.mergeRockets` zurück in den localStorage. Bewusst NUR in der Datei, nicht in `Game` – sonst schleppt jeder `autoSave()` eine zweite, veraltende Kopie aller Raketen mit; `loadGame` löscht das Feld deshalb vor `Object.assign`. Alte Saves ohne `rockets` lassen den Hangar in Ruhe (kein Leeren!).
  - ⚠️ **Bautisch ≠ Hangar.** Was in `VAB.stack` liegt, reist als `Game.design` mit und ist nach dem Laden wieder auf dem Bautisch – es taucht aber NICHT im 📂 Hangar auf. In den Hangar (`lmgRockets`) kommt eine Rakete erst per 💾 mit Namen. `saveGame` meldet deshalb per `alert`, was wirklich in der Datei steckt (Namensliste bzw. Hinweis auf 💾): Vorher passierte beim Speichern sichtbar GAR NICHTS, und ein leeres `rockets: []` sah zwangsläufig nach einem Fehler aus (Bug-Report Simon).
- ⚠️ **`lmgRockets` beim Testen NICHT löschen** – das ist der ECHTE Hangar des Users, nicht Testmüll. Aufzuräumen ist nur `lmgAutoSave`.
- Fallschirme: `PARTS[..].chuteA` (Mk1 500 ≈ 2 t, `chute3` Mk2 2000 ≈ 8 t, addieren sich); Drag `cdA += Σ chuteA`. Mk2 = 3 Kappen (Part-Mesh + `attachChute` Fächer-Gruppe). **Abriss:** Öffnen > 200 m/s (airVel, in Atmo) oder offen > 240 m/s unter 30 km → `ripChute()` (`chuteTorn` = dauerhaft kaputt, Mesh weg, [P] meldet nur noch).
- Aero-Instabilität: ohne `fin` an der aktiven Stufe taumelt die Rakete – Pseudo-Rausch-Torque in `step` (amp `0.26·min(1,qDyn/25000)`; nur warp≤2, nicht bei Schirm/Belly/EVA/autoDock). **Komplett AUS** bei: Flossen in aktiver Stufe (`s.hasFins`) · nach der ersten Stufentrennung (`Flight.stagedOnce`, gesetzt in `stage()`, Reset in `start()`) · Superheavy/Starship im aktiven Seg. Alle Tutorial-Stacks haben `fin` in der Unterstufe (Achtung: fin muss UNTER den Decoupler, sonst zählt sie zur Oberstufe – `hasFins` ist pro Segment!).
- Booster-Landung (Falcon-Stil): Radialteil `gridfin` (Tech `reuse`, 4 Fins name:"gfin", angelegt; ausklappen = `rotation.z` bis π/2). `stage()`: abgeworfene Stufe MIT gridfin+Triebwerk+Restsprit (<250 km Höhe) → `Flight.booster` statt Debris; `updateBooster(dt)` (substeps ≤0.05 s, Warp-Cap 50×) = Autopilot flip→coast (Fins raus, cdA 5+8·deploy)→burn (Zielprofil `aDes=1.35·(v²−4)/(2·(alt−4))+g` auf GESAMT-v, Nase fast senkrecht + Anti-Drift-Neigung, Endanflug 0.92·Schwebeschub)→landed (folgt Planet via `b.local`; Karriere: `b.value`·Landeplatz-Faktor-Erstattung, s. »Booster-Landeplätze«; Flag `statBoosterLanded` → Mission reuse1)/crashed. **⚠️ Zeitsync:** `this.t` ist beim Aufruf schon +dt – der Booster integriert mit eigener Zeit `tt=this.t−dt` und sampelt `bodyPos(LEIBNIZ,tt)` pro Substep, sonst ~25 m Höhen-Bias → Crash! PiP-Fenster `#boosterCam` + `updateBoosterCam()` (eigener Renderer, gleiche Szene, schließt 4 s nach Ende). Orange Tankmarke `#fuelMark` (12 %, bei RTLS 30 %) wenn aktive Stufe gridfin hat. Tutorial id "booster".
- ⚠️⚠️ **Bellyflop + Zeitraffer = Absturz (behoben, nicht wieder aufreißen!):** `step()` gibt oberhalb von 2× **gar keinen Schub** (`s.ignited && warp<=2`) – der Autopilot stellte brav Schub 0,3 ein, das Triebwerk blieb kalt und das Schiff fiel mit Terminalgeschwindigkeit in den Boden. Dazu rechnet `frame()` bei Warp mit `maxDt = 1 s` = **71 m Fallweg pro Schritt**, damit verpasst schon der Flip sein 250-m-Fenster. Gemessen vorher: Warp 5 → Burn ab 178 m, Warp 50 → Burn ab 14 m, beides Crash. `updateBelly` begrenzt deshalb **unter 2,5 km hart auf Warp 2** (wie autoDock/Booster-Landung) und meldet das. Der lange Fall darüber bleibt vorspulbar – das Tutorial empfiehlt [.] ausdrücklich. Verifiziert: Warp 1/2/5/10/50 landen alle mit 3,0 m/s.
- **Bellyflop-Gotchas:** Der Autopilot setzt `sas="off"` – die passive Aero-Stabilisierung (retrograde-Drehung bei Sinkflug) MUSS `!this.belly` prüfen, sonst kämpfen beide um die Lage und das Schiff dreht kaum in Bauchlage! [C] in den ersten 3 s der flop-Phase bricht NICHT ab (Doppel-Tipper-Schutz), danach wie dokumentiert. Dreh-Slerp 1.6/s (Flaps, unabhängig von RCS). **Flop = VOLLE Ziel-Lage inkl. Rollwinkel** (makeBasis: Nase=Y horizontal, Kachel-Bauch +Z in den Wind/nach unten) – nur `setFromUnitVectors` auf die Nase lässt den Roll frei und das Schiff liegt 90° verdreht (Flaps senkrecht)! Starship-Flaps sitzen auf `flapPivot`-Groups (Scharnier an der Rumpfkante, `rotation.y = side*fold`): frame() animiert sie (flop: 0.28±0.22 rad wedeln, Bug/Heck gegenphasig · flip/burn: 0.95 angelegt · sonst 0). Tutorial "node" endet jetzt mit Pflicht-Capture (Pe-Retrograde-Burn, Ap < 2000 km) statt Flyby. ⚠️ Deployment: index.html + tutorials.js IMMER zusammen deployen – neue tutorials.js mit alten PARTS (z. B. "inter") wirft sonst Exceptions in stackHeight → wirkt wie wildes Trudeln/Kontrollverlust.
- Titel "LMG Space Program", Favicon `LMGTECHlogo.png` (exakte Groß-/Kleinschreibung – Hosting kann case-sensitiv sein!).
- SpaceX-Endgame (Tech-Kette reuse→raptorSL→raptorVac→starshipT): `engRapSL`/`engRapVac` (effizienteste Triebwerke), `superheavy` + `starship`/`starshipTank` = **Kombi-Typen** (Tank UND Triebwerk: segStats/validate/radialHostIdx/Flammen-idle behandeln "superheavy"/"starship" mit); **Starship auf Superheavy braucht keinen Stufentrenner** – s. »Stufengrenzen: Trenner ODER Superheavy/Starship-Naht«, und aufs Droneship darf der Superheavy nicht (s. »Booster-Landeplätze«). Starship: bemannt (crewCapacity 6, `isCrewedStack`), Hitzeschutz (zählt als shield), `flaps:true`; Tanker `tanker:true` = unbemannt, keine Flaps. Bellyflop **[C]** (`toggleBellyflop`/`updateBelly`): flop (Nase horizontal, cdA+56 → Terminal ~85 m/s) → Flip (Trigger `alt ≤ vDown·2.6+burnDist·1.4+40`; unter ~200 m aktiviert = Crash) → Hoverslam; übersteuert Handsteuerung+SAS. Tanker: `settleCrewAndAssets` parkt ihn als Asset kind:"tanker", `checkTanker()` betankt <60 m/<4 m/s alle Segs voll & verbraucht ihn. Tutorial id "starship".
- Karriere-Intro: `INTRO_PAGES`/`showIntro()` (Flugleiterin Lotte), einmalig via `Game.introSeen` beim ersten `UI.startCareer()`.
- `Flight.step(dt)`: semi-implizit Euler; Warp `WARPS`, adaptives `maxDt`; Steuereingabe bricht Warp>2 ab; in der Atmosphäre max. 50× (`canWarp` + Auto-Drossel in `step`); Drag-Clamp `min(fd/(m*v), 0.5/dt)`; Auto-Cutoff am Manöverknoten (`nodeBurned`).
- Agilität: `0.12 + 0.78*nRcs` (Rotation UND SAS) – ohne RCS bewusst sehr träge.
  - ⚠️⚠️ **SAS dreht mit GENAU derselben Rate wie die Handsteuerung.** Der Slerp-Faktor ist
    `agility*dt / Restwinkel`, nicht `agility*1.6*dt`: ein Slerp-Faktor ist ein ANTEIL der
    Reststrecke, kein Winkel – bei 180° Abweichung waren das π·1,6 ≈ **5×** die
    WASD-Rate, eine Rakete ohne RCS ruderte per [T] also flott herum und per Hand zäh.
    Restwinkel steckt im w-Anteil (`2·acos|w|`; **`|w|`, weil ±q dieselbe Drehung meinen**).
    Verifiziert: Hand 2 s = SAS 2 s = 13,75° ohne RCS; aus 180° konvergiert SAS mit RCS in
    < 5 s auf 0,003° ohne Überschwingen.
- ⚠️⚠️ **Der Strom-Haushalt läuft VOR dem Steuerblock in `step()`, nicht danach.** Vorher richtete
  SAS bei leerer Batterie noch EINEN Schritt lang aus, bevor die Bilanz es abschaltete – wer [T]
  erneut drückte (oder aus dem Warp auf 1× zurückging, wo der Steuerblock überhaupt erst wieder
  anläuft), bekam beliebig viel Gratis-Ausrichtung: **gemessen 161° in 5 s mit 0 ⚡**. Dazu die
  zweite Sicherung `this.charge > 0` am SAS-Zweig und ein Guard in `toggleSAS()`.
  Gegenprobe: 0 ⚡ → 0,000° in 300 Schritten, auch über den Warp-Umweg.
  (Bewusst **nicht** geändert: eine bemannte Kapsel darf bei 0 ⚡ weiter mit WASD drehen –
  `powerDead` gilt nach wie vor nur für Sonden. Sonst wäre ein leerer Akku im Orbit ein
  garantiertes Todesurteil, weil auch der Retro-Burn unmöglich würde.)
- **⚠️ Start-Lage der Rakete = `padQ`** (`this.q.copy(padQ)` in `start()`, dieselbe Basis wie Rampe/Boden: **X=Ost, Y=hoch (Nase), Z=Süd**). Die Steuerung dreht im KÖRPERFRAME (`this.q.multiply(dq)`), also legt der Rollwinkel auf der Rampe fest, welche Taste in welche Himmelsrichtung neigt. Damit gilt an JEDER Rampe: **[D] → Osten (90°)** · [A] → Westen · [W] → Süden · [S] → Norden. Verifiziert: Ost-Start nur mit [D] ergibt Inklination 0,0° (Äquator) bzw. 55,0° (LMG). ⚠️ Vorher stand hier `setFromUnitVectors(V3(0,1,0), pd)` – das ist die MINIMAL-Drehung und lässt den Rollwinkel willkürlich; [D] neigte dadurch nach SÜDEN und [S] nach Osten, obwohl Tutorials (`orbit`, `booster`) und der Hilfetext ausdrücklich »[D] nach Osten« sagen. Die NASE zeigt in beiden Varianten senkrecht nach oben – nur der Roll unterscheidet sich, Orbit-Start-Tutorials sind also unberührt.
- Temperatur (didaktisch, HUD): `ambTemp()` (−6,5 °C/km, All −270 °C) + `updateTemps(dt)` → `shipTemp` (Atmo: Staupunkt `amb + v²/2050`, dichtegewichtet `min(1,rho/2e-3)`; Vakuum: Schwarzkörper ∝ 1/√Sonnenabstand, bei Leibniz ≈ +5 °C; träge Annäherung `k=0.03+2rho`).
- Komplett-Satelliten `satW`/`satR`/`satS`/`satT`/`satD` (type "sat", passen in Buchten): [N] ruft `deploySpecialSat()` – prüft Orbit-Anforderung (satW stabil · satR Pe>250 km · satS Pe>70/Ap<130 km · satT Pe>250 km · **satD Pe>200 km UND Inklination>75°**), setzt Flags `satWeather/satRad/satSpy/scopeUp/surveyUp` für die Missionen satWetter/satStrahlung/satSpion/scope1/scope2. `probeS` = flacher Sondenbus (type "probe", wird NIE ausgesetzt). ⚠️ Der Mesh-Zweig in `buildPartMesh` ist eine if/else-Kette; wer keinen eigenen Zweig hat, landet im `else` und bekommt den dunklen Späh-Tubus (so teilen sich satS und satT einen Look). `satD` hat bewusst den Gegenentwurf: kurz und WEIT statt lang und dünn, mit offener Spiegel-Öffnung und halb offener Sonnenhaube (⚠️ offener Zylinder = `side:DoubleSide`, sonst fehlt die Innenseite).
- **Stufenadapter** (`interXS`/`inter`/`interL`, type "inter", Ø 8/10/12): offene Röhre (`shroudH` 10/16/18) wächst von der Unterkante nach OBEN über Stufentrenner + Oberstufen-Triebwerk (belegt selbst nur h≈3 Stack-Höhe, Radius ×1.06 gegen Z-Fighting). Direkt UNTER den Decoupler bauen → gehört zum unteren Segment (segments() teilt NACH dem Decoupler) und bleibt wie der Falcon-9-Interstage auf der abgeworfenen Stufe. Rein strukturell (nur Masse). Tutorials orbit/launchwindow/booster haben ihn im Stack.
- Fairing: `buildFairingShell(r,H,phiStart?,phiLength?)` (Lathe-Ogive); [F] spawnt 2 Halbschalen als Debris (seitlich + Spin).
  - ⚠️⚠️ **`stage()` muss `v.fairingIntact` löschen, wenn das Fairing in der ABGEWORFENEN
    Stufe saß** (Flag `fairingGone`). Vorher blieb es stehen, obwohl das Teil aus `v.stack`
    verschwunden war: Die Hülle war nicht mehr zu sehen, **halbierte aber weiter den
    Luftwiderstand** (`cdA *= 0.5`), [N] verweigerte mit »Erst das Fairing absprengen!«,
    und [F] »sprengte« eine Hülle ab, die es gar nicht mehr gab (`jettisonFairing` findet
    kein Teil → keine Halbschalen, nur die Meldung). Genau so gemeldet (Bug-Report Simon).
    Es gibt dazu eine eigene Flug-Meldung UND einen Hinweis im VAB-Info-Panel (Fairing
    unter einem Stufentrenner), denn architektonisch gehört es über den Trenner.
    Verifiziert: unten gebaut → nach der Trennung `fairingIntact=false`, Teil weg,
    Knopf aus · oben gebaut → überlebt die Trennung, [N] bleibt gesperrt, [F] wirft
    weiterhin 2 Halbschalen.
- Partikel-Pool (110 Sprites, `fresh`-Flag, altern mit Sim-Zeit `simmed`), Rauch nur in Atmosphäre.
- ⚠️⚠️ **Partikel-Sprites hängen an `Flight.world`, nicht an der Szene.** Position UND
  Geschwindigkeit müssen deshalb ABSOLUT übergeben werden (`this.pos` bzw. `this.vel`
  aufaddieren, s. Abgasstrahl). Rein schiffsrelativ übergeben landen sie um den Floating-Origin-
  Versatz (~1,4e10 m) daneben und man sieht schlicht nichts. (`explode()` macht es anders –
  dort ist es egal, weil das Schiff in dem Moment ohnehin weg ist.)

### RCS-Steuerdüsen: Gasstöße & Zischen (`rcsPuff` / `ensureRcsAudio` / `setRcsHiss`)
Nur wenn `type:"rcs"` im Stack liegt – ohne Düsen dreht die Rakete über Flossen und
Reaktionsräder und darf nicht pusten (verifiziert: 0 Partikel, Zischen 0).
- ⚠️⚠️ **Und NUR IM VAKUUM** (`leibnizAlt(...) >= LEIBNIZ.atmoH` am Ende der &&-Kette von
  `_rcsWasRot`, Wunsch Simon): In der Lufthülle lenkt eine Rakete über Gitterflossen und das
  schwenkbare Triebwerk, die kleinen Kaltgasdüsen kämen gegen den Fahrtwind kaum an, und ihr
  Gas wäre sofort verweht – ein Weißnebel-Stoß auf der Rampe sah entsprechend falsch aus.
  ⚠️ Das ist **bewusst nur Optik + Ton**: `agility` bleibt unangetastet, sonst fiele die
  Wendigkeit im Aufstieg von 0,90 auf 0,12 rad/s (7,5× träger) und jedes Aufstiegs-Tutorial
  flöge sich anders. Verifiziert: Drehrate 103,13°/2 s bodennah **und** im Orbit identisch;
  Stöße 0,1/30/69 km aus · 71/200 km an · Monti-Orbit an (luftlos, `leibnizAlt` dort riesig).
  ⚠️ Die Höhenabfrage steht am ENDE der Kette, damit sie nur bei tatsächlicher Drehung
  ausgewertet wird und nicht in jedem Substep.
- ⚠️⚠️ **Erzeugt wird in `frame()`, nicht in `step()`.** In step() ist `this.pos` der Zustand
  VOR der Integration – die Fahnen säßen konstant ein Frame hinter dem Schiff (gemessen 178 m
  bei 11 km/s). Außerdem läuft step() im Zeitraffer mehrfach pro Frame und würde den Pool
  leerpusten. step() merkt sich nur die Drehachse (`_rcsAxis`/`_rcsWasRot`).
- ⚠️ Die Ausstoßrate hängt an der **echten** Zeit (1/60), nicht an `frameT` – das ist die
  simulierte Zeit und wächst mit dem Warp.
- ⚠️⚠️ **Die Stöße kommen aus dem RCS-BAUTEIL** (`rcsPorts()`), nicht aus Spitze und Heck.
  Der erste Wurf setzte sie auf ±0,85·(halbe Höhe) – dann quoll das Gas aus der Nasenspitze
  und aus der Triebwerksglocke (Bug-Report Simon). `rcsPorts()` rechnet die Y-Lage exakt wie
  `buildRocketGroup` (Unterkanten von unten aufsummieren, Radialteile und Fracht im Starship
  belegen keine Höhe) und zieht am Ende `H/2` ab – **der Schiffsursprung ist die MITTE**.
  Mehrere RCS-Teile im Stack pusten alle.
- ⚠️ Ein reines Drehmoment ist ein **Kräftepaar**: Für die Drehachse t ist `d = t × Y` die
  Kraftrichtung (Y = Nase). Die **Düse sitzt auf der −d-Seite** und bläst nach −d, sonst
  schießen die Fahnen quer durch den Rumpf (gemessen: 5 m statt 25 m von der Achse).
  Beim NICKEN/GIEREN feuert EINE Düse des Blocks, und **welche, hängt vom Vorzeichen von
  `port.y` ab** – ein Block im Heck muss andersherum schieben als einer im Bug.
  Beim ROLLEN (t ∥ Y) entartet das Kreuzprodukt – eigener Zweig mit zwei tangentialen Düsen.
- ⚠️ Radius und Größe der Stöße kommen aus `w/2` des RCS-Teils (`w` ist der DURCHMESSER):
  eine feste Zahl sitzt bei einem 58-Einheiten-Träger mitten im Rumpf.
- Klang: eigene WebAudio-Kette (weißes Rauschen → Hochpass 1400 Hz → Bandpass 3200 Hz),
  ⚠️ im **selben** AudioContext wie `ensureRumble` – ein zweiter Context pro Seite scheitert
  auf manchen Browsern still. Anstieg schnell, Ausklingen träge (hart abgeschnitten klickt es).
  `setRcsHiss` steigt bei unverändertem Pegel früh aus; der SFX-Regler muss `_rcsWant`
  deshalb vorher auf `null` setzen, sonst greift er erst beim nächsten Wechsel.
- Tutorials: `Tut.start(id)` erzwingt Sandbox + ∞-Strom; Szenario: `stack`, `orbit:{body,alt,pe?}` oder `nearStation:<m hinter Station>`; Checks `check(o,F)` laufen pro Frame.
- Admin-Cam: `AdminCam` (eigene Three-Szene, echte Ephemeriden, Fokus-Buttons, Zeitraffer) – Vollbild aus dem Universum-Screen. Start-Zeitraffer `speedI:0` = **1 min/s** (mit 1 h/s wirbelten die inneren Planeten los, bevor man überhaupt hingesehen hat). ⚠️ **Die Bahnhof-Marker hängen als KINDER am Leibniz-Mesh** und erben dessen sichtbare Drehung (`rotation.y` in `frame()`); als Szenen-Kinder auf `padDir(p)·R` blieben sie stur im Weltraum-Frame stehen und wanderten über fremde Kontinente. Für die Physik sind die Rampen weiterhin inertial fix – die Admin-Cam ist ein Schaukasten, kein Simulationsschritt. Die Station bleibt Szenen-Kind (echter Orbit, on rails). ⚠️ **Ambient + PointLight zusammen unter 1,5 halten** (jetzt 0,30 + 1,12): Mit den alten 0,45 + 1,5 = 1,95 brannte alles mit einer Albedo über ~0,5 zu reinem Weiß aus – Leibniz' Gebirge sah aus, als hätte jemand mit Tipp-Ex Adern über die Kontinente gezogen, und auf Newtons Eiswelt war überhaupt keine Struktur mehr zu sehen.
- localStorage: `lmgAutoSave`, `lmgMusic`, `lmgSettings` (Grafik/Lautstärke, s. Optionen-Abschnitt), `lmgLoadedOnce`, `lmgHint_*`, `tutsDone` im Save, `lmgRockets` (💾/📂-Hangar: gespeicherte Raketen `{name,stack}`; Laden in Karriere nur mit erforschten Teilen).
- ⚠️⚠️ **Solarstrom gibt es NUR im Sonnenlicht** (`Flight.sunlit()`, Faktor 0…1 auf die
  3 ⚡/s je Panel). Vorher lud ein Panel auch mitten im Planetenschatten weiter – damit war
  die Batterie komplett überflüssig und die Nachtseite folgenlos (Bug-Report Simon).
  Der Schatten ist der **Zylinderschatten des dominanten Körpers** (Halbschatten ist bei
  diesen Größenverhältnissen nur ein schmaler Saum), dazu bodennah der Faktor `dayLight` –
  sonst lädt ein Panel auf der nachtschwarzen Rampe munter weiter (im Orbit ist `dayLight`
  immer 1, dort stört er nicht). Bewusst nur der dominante Körper: In seiner Sphäre ist er
  der einzige, der groß genug am Himmel steht – und die Prüfung läuft in JEDEM Substep.
  - ⚠️⚠️ **Gerechnet wird gegen `groundSunDir`, NICHT gegen die echte Richtung (`−pos`).**
    Das Spiel kennt zwei Sonnen (s. »Sonnenstand & Licht bodennah«), und unter 2000 km
    Höhe steht am Himmel die SPIELUHR-Sonne – die von der echten um bis zu 180° abweicht.
    Mit der echten Geometrie war die Prüfung im ganzen Leibniz-Raum spiegelverkehrt: Im
    200-km-Orbit entlud das Schiff, während die Sonne sichtbar im Bild stand, und lud
    ausgerechnet im Planetenschatten (Bug-Report Simon, Screenshot mit Lens-Flare +
    »🌑 Schatten«). Erst weit draußen fällt `groundSunDir` auf die echte Richtung zurück.
  - Verifiziert über einen ganzen 200-km-Umlauf: `lit` kippt exakt am sichtbaren
    Terminator (Sonnenhöhe −0,66 = Rand der Kugel aus 200 km), Tagseite +2,75 ⚡/s,
    Nachtseite −0,25 ⚡/s. `Flight.solarLit` treibt zugleich die HUD-Anzeige
    (☀️ ↔ 🌑 Schatten), Reset in `start()`.
- ⚠️⚠️ **Das Starship hat FEST EINGEBAUTE Panele** (`solarPanels(stack)` ist die EINE Quelle):
  Flag **`solar:<n>`** an einem Teil = n fest verbaute Panel-Einheiten (à 3 ⚡/s), genau wie
  `navcomp`/`raptor` – `starship` 2 (6 ⚡/s), `starshipTank` 1. Sie sitzen INNEN: kein [G],
  kein `panelsOut`, kein Abriss im Fahrtwind, kein `PANEL_SAFE_ALT`. Ohne sie war ein
  Starship auf einer Interplanetarreise nach ein paar Wochen schlicht tot – 900 ⚡ Batterie,
  kein Nachschub, und [G] antwortete »Keine Solarpanele an Bord!« (Bug-Report Simon,
  Screenshot: ⚡ 0/900 auf dem Weg nach Minzi, Missionszeit 26,8 Tage).
  - `solarPanels()` liefert `{deploy, fixed, total}`; **`deploy`** (Teile mit `type:"solar"`)
    zählt nur ausgefahren und heil, **`fixed`** immer. Beide gehen durch dasselbe `sunlit()`.
    Wer eine der drei Stellen anfasst (Bilanz in `step()`, Guard in `warpToEvent`,
    `togglePanels`), fasst sie über diese Funktion an – vorher stand dreimal ein eigenes
    `filter(type==="solar")` da, und genau eine davon kannte den Sonderfall nicht.
  - ⚠️ `btnPanels` hängt weiter an `has("solar")` – der Knopf ist zum AUSFAHREN da, und beim
    Starship gibt es nichts auszufahren. [G] sagt das dort auch (»fest eingebaut«) statt
    »keine an Bord«; ganz ohne Panele bleibt die alte Meldung.
  - ⚠️ Die HUD-Anzeige (☀️ / 🌑 Schatten) hängt jetzt an `Flight.solarOn` (aktive Einheiten,
    gesetzt in `step()`, Reset in `start()`), NICHT mehr an `panelsOut` – sonst zeigt ein
    Starship seinen Ladezustand nie an.
  - Verifiziert: Starship im Sonnenraum (dominanter Körper SONNE, 14,4 Mio. km) lädt mit
    exakt **6 ⚡/s**, 0 → 900 ⚡ in 150 s; Zeitsprung [⇧.] mit 5 ⚡ Restladung springt 34,7 Tage
    und kommt voll an (vorher verweigert). Regression klassische Sonde unverändert:
    eingeklappt −0,25 · ausgefahren +2,75 · ausgefahren im Schatten −0,25 ⚡/s.
- **Solarpanele nur im Vakuum** (`PANEL_SAFE_ALT` = 50 km über Leibniz): `togglePanels` verweigert
  das Ausfahren darunter, `step()` klappt sie beim Sinkflug automatisch ein. Der alte
  Abriss-Mechanismus (`panelsBroken` bei `rho·v² > 12000`, greift ~35–40 km) bleibt als letzte
  Instanz stehen, ist im Normalbetrieb aber nicht mehr erreichbar – dafür bräuchte es > 8700 m/s
  oberhalb von 50 km (Rückkehr aus dem interplanetaren Raum). Einklappen geht IMMER.
- ⚠️ **Ein Start, der nie stattfand, kostet nichts.** `settleCrewAndAssets` stieg früher bei
  `!this.flew` sofort aus – die in `UI.launch` abgebuchten Startkosten verfielen damit
  ersatzlos: einmal auf der Rampe versehentlich »Flug beenden« (oder Rakete anschauen und
  doch umbauen wollen) und ein gutes Stück Budget war weg, ohne dass irgendetwas passiert
  wäre. Jetzt wird exakt `launchCost` zurückgebucht (garantiert netto ±0) und `showSummary`
  zeigt statt des Flugberichts ein kurzes »🏗️ Start abgebrochen«. Gegenprobe: wer wirklich
  startet und die Rakete im All verliert, zahlt weiterhin voll.
- ⚠️ **»↩ Neustart« gibt es nur in Sandbox/Tutorial** (`updateButtons` blendet `#btnRevert` aus,
  `revert()` hat einen eigenen Guard). In der Karriere war er ein Freifahrtschein: Rakete
  verglüht, Mission verpatzt, Booster zerschellt → Neustart, und die abgebuchten Startkosten
  waren wieder da.
- ⚠️ **`step()` prüft Missionen auch am BODEN.** Der `landed`-Zweig kehrt vorzeitig zurück, der
  `checkMissions()`-Aufruf am Ende von `step()` wird also nie erreicht, solange das Schiff steht –
  die Prüfung lief bisher nur in genau dem Frame, in dem `checkContact()` die Landung meldete.
  Folge: ein Experiment [B] auf der Oberfläche füllte `Game.labDone`, aber »Wissenschaft
  unterwegs« (`lab1`) schnappte erst beim nächsten Abheben zu – wer danach den Flug beendete
  (z. B. auf Monti gelandet), ging leer aus.

## Außeneinsatz zu Fuß & Flagge (`toggleEVA` / `stepEVA` / `plantFlag`)
EVA gibt es jetzt in zwei Spielarten: schwerelos im All (wie bisher) **oder zu Fuß auf einer
Oberfläche** – auf Monti genauso wie auf Leibniz. Verboten bleibt nur der Ausstieg im Flug
innerhalb der Atmosphäre. Auf dem Boden: W/A/S/D laufen (kamerarelativ, 3,5 m/s), [↑] hüpfen,
[F] Flagge, [V] einsteigen.
- ⚠️⚠️ **`stepEVA` ist eine eigene Methode und wird ZWEIMAL aufgerufen** – einmal regulär und
  einmal im `landed`-Zweig von `step()`, der vorzeitig `return`t (dort laufen pos/vel des
  Schiffs on rails). Ohne den zweiten Aufruf steht die Astronaut*in im Inertialraum still,
  während der Mond unter ihr wegfliegt: gemessen **312 km** Abstand zum eigenen Schiff nach
  2 Sekunden.
- ⚠️ Der Bodenmodus setzt die **Geschwindigkeit direkt** (Radialanteil behalten,
  Tangentialanteil aus den Tasten). Ein Kraftmodell bräuchte Haftreibung, sonst schlittert man
  bei Montis 1,6 m/s² wie auf Eis davon. Die Schwerkraft bleibt echt – Hüpfen trägt weit.
  Bodenkontakt klemmt auf `R + EVA_FOOT` (0,65 = Fußhöhe von `buildAstronaut`) und schluckt
  die einwärts gerichtete Geschwindigkeit.
- ⚠️ **Lage über `makeBasis(x, up, face)`**, nicht `setFromUnitVectors`: Letzteres legt nur die
  Kopfachse fest und lässt den Drehwinkel um sie offen – die Figur schlurft dann seitwärts
  über den Mond. Modell schaut nach **+Z** (Gesicht bei z = +0,17), rechtshändig ⇒ `x = up × face`.
  Gang: `legs`/`arms`-Gruppen gegenläufig, Ausschlag nach Tempo.
- ⚠️ Absetzpunkt aus der **breitesten Stelle** der Rakete (`max(PARTS.w)/2 + 9`), nicht aus der
  Höhe – sonst steht die Crew bei einem 200-m-Träger 70 m entfernt. Einstiegs-Schwelle
  entsprechend `max(60, H/2 + 40)`: gemessen wird zur Schiffs-MITTE, mit den alten festen
  60 m käme man von einem großen Träger nie wieder an Bord.

### 🫁 Sauerstoff im Anzug (`EVA_O2` / `Flight.evaO2` / `evaO2Out`)
**5 Minuten draußen** (Wunsch Simon) – lang genug für Flagge, Rundgang oder den Weg zu einem
zweiten Schiff, kurz genug, dass der Anzug spürbar eine Flasche ist und kein Zuhause.
- ⚠️⚠️ **Der Vorrat gehört zum SCHIFF, nicht zum einzelnen Ausstieg:** `evaO2` überlebt Ein-
  und Aussteigen und füllt sich NUR an Bord wieder auf (`EVA_O2_REFILL` 90 s von leer auf
  voll, gerechnet im Strom-Block von `step()`). Sonst wäre »kurz rein, kurz raus« ein
  Gratis-Nachschub und die Anzeige bedeutungslos. Unter 30 s Rest verweigert [V] den
  Ausstieg und nennt die Nachfüllzeit.
- ⚠️⚠️ **Zeitraffer bei EVA hart auf 2×** (`canWarp` + Deckel in `toggleEVA`, wie bei
  Docking- und Booster-Autopilot): Bei 1000× wären die 5 Minuten in 0,3 Bildschirmsekunden
  weg – die Person stürbe, bevor irgendeine Warnung lesbar ist.
- Warnkette `EVA_O2_WARN` bei 2 min / 1 min / 30 s, Balken 🫁 in der Anzeigenleiste (unter
  60 s rot) und eine mm:ss-Zeile im linken HUD. `_o2Warned` wird an Bord wieder scharf gestellt.
- **Bei 0 ist die Person verloren** (`evaO2Out`): raus aus `crew`/`crewObjs`, im Kader Status
  **`verschollen`** (rot, gesperrt – dieselbe Mechanik wie »gestrandet«, nur ohne
  Rettungsmission: hier gibt es kein Wrack zum Anfliegen). Ehrliche Physik wie überall im
  Spiel; davor stehen drei Warnungen, der Balken und der Warp-Deckel. Verifiziert: 6 → 5
  Crew, EVA beendet, Nachfüllen an Bord 0 → voll in 90 s.
- ⚠️ **Die Knopfleiste wird bei EVA gefiltert** (Block am Ende von `updateButtons`): Als
  Astronaut*in steuert man kein Schiff – Stufen, SAS, Bellyflop, ∞-Tank, Knoten, Ziel,
  Zeitraffer & Co. sind dort Quatsch (Bug-Report Simon, Screenshot mit »Bellyflop« neben dem
  laufenden Männchen). Übrig bleiben [V] einsteigen, 🚩 Flagge (am Boden), Karte, ⚙️ und
  »Flug beenden«. ⚠️ Der Block steht am ENDE und überschreibt die Zeilen darüber; da
  `updateButtons` pro Frame läuft, stellt sich nach dem Einsteigen alles von selbst wieder
  her – nur `infBtn` braucht die explizite Sandbox-Zeile, weil es sonst niemand zurücksetzt.
- **Flagge** `buildFlagMesh()` + `flagTexture()`: ⚠️ Das Logo wird auf ein Canvas GEMALT und
  nicht aus `LMGTECHlogo.png` geladen – per file:// darf WebGL keine Datei-Bilder als Textur
  benutzen (derselbe Grund wie bei `nebulae.js`). ⚠️ Die Fahne hängt an einer **Querstrebe**,
  genau wie bei Apollo 11: ohne Luft fällt ein Tuch am Mast schlaff herunter. Beliebte
  AG-Nachfrage – deshalb bewusst so gebaut.
- [F] ist doppelt belegt: bei EVA am Boden Flagge, sonst Fairing (beides gleichzeitig gibt es
  nie). `updateButtons` blendet `btnFlag`/`btnFairing` gegenseitig aus.

## 📸 Fotomodus [⇧F] (`Flight.photo` / `photoPan` / `savePhoto` / `fxT`)
Drei Dinge zusammen, sonst ist es kein Fotomodus:
1. **Die Szene steht** – Physik (`frameT = 0`) UND die Effekt-Uhr `fxT`. Ein Bild von einer
   Rakete, die während des Komponierens weiterfällt, ist Glückssache, kein Foto.
2. **Die Kamera ist frei**: Maus dreht, Rad zoomt (bis 100 km statt 5 km, Minimum 1,5 statt
   4 m), **WASD/QE schieben den Blickpunkt** (`photoPan`, Tempo ∝ Zoom, ⇧ = 4×). Ohne das
   Schieben kreist man ewig um die eigene Rakete und bekommt Planet, Rampe oder Mechazilla
   nie mit ins Bild.
3. **Kein HUD** – CSS-Klasse `#flight.photo` blendet ALLE direkten Kinder aus außer
   `#flight3d`, `#lensflare` und der Foto-Leiste `#photoBar`.
- ⚠️ **Über die Klasse, nicht per Inline-Style:** Jeder HUD-Knopf hat schon ein eigenes
  `style.display`, das `updateButtons()` pro Frame setzt – ein Inline-Versteck bliebe beim
  Verlassen falsch stehen.
- ⚠️ **Die Effekt-Uhr `fxT` ist neu und ersetzt `performance.now()` bei der Flamme.** Meer,
  Sonne und Plasma hingen ohnehin an `this.t` (steht im Foto still), der Abgasstrahl war die
  letzte Ausnahme und hätte im »eingefrorenen« Bild weitergeflackert. `fxT` läuft in Echtzeit
  (1/60 pro Frame) und pausiert bei `paused || photo` – deshalb ist sie auch die richtige
  Quelle für das Polarlicht (bei Warp darf Optik nicht mitrasen).
- ⚠️ **Im Fotomodus fängt der keydown-Handler ALLE Tasten ab** (früher Rücksprung nach
  `this.keys[...]`): Wer ein Bild aufbaut, will nicht mit [Leertaste] eine Stufe abwerfen
  oder mit [W] die Rakete kippen. Verifiziert: [Leertaste] im Foto → Stack unverändert.
  Übrig bleiben ⇧F (zurück), [Esc] (zurück) und [⏎] (speichern).
- ⚠️ **Kein Kamerawackeln** im Fotomodus (`applyShake` übersprungen): Die Zeit steht, der
  Pegel bliebe sonst eingefroren stehen und die Kamera zitterte endlos.
- ⚠️ Der Kameraabstand wird beim BETRETEN nicht angefasst – in der Karte ist er 1e9 und mehr,
  ein 5-km-Deckel würde die Kartenansicht zerreißen. Beim Verlassen kommt der gemerkte Wert
  zurück (`_photoCd`). Verifiziert: Karte 1,92e6 → Foto → zurück 1,92e6.
### Das Bild speichern (`savePhoto`)
- ⚠️⚠️ Der Flug-Renderer läuft **ohne `preserveDrawingBuffer`** (das kostet auf Schulrechnern
  jeden Frame eine Kopie). Der Browser darf den Zeichenpuffer nach dem Frame verwerfen –
  also im Klick-Handler **neu rendern und im selben Aufruf auslesen**; zwischen `render()`
  und `drawImage` darf nichts liegen (kein await, kein setTimeout).
- ⚠️ Der **Lens-Flare ist ein eigenes 2D-Canvas** über der Szene und wird mitkopiert, sonst
  fehlt im Foto genau der Effekt, der das Bild macht. Das HUD ist DOM und kann gar nicht
  hinein – die Foto-Leiste taucht deshalb nie im PNG auf.
- ⚠️⚠️ **Per `file://` (Doppelklick-Betrieb!) `toDataURL`, sonst `toBlob`:** Bei file:// hat
  die Seite den Ursprung »null«, eine Blob-URL gehört dann niemandem und der Download
  scheitert je nach Browser still. Über den Webserver bleibt es beim Blob (kein
  Megabyte-langer String). Das ZWISCHEN-Canvas ist 2D, behält sein Bild – `toBlob` darf dort
  asynchron sein.
- Dateiname `lmg-foto-JJJJMMTT-hhmmss.png`, Auflösung = Puffergröße des Renderers (mit
  Pixel-Ratio, gemessen 1167×999 auf einem 800×684-Fenster). Rückmeldung steht in der
  Foto-Leiste, nicht in `showMsg` – das HUD ist ja aus.
- Erreichbar per **⇧F**, über den Knopf »📸 Foto [⇧F]« in der Knopfleiste (bleibt auch bei
  EVA stehen) und in der Tastentabelle unter »Ansicht«.

## 🧭 Navball (echte 3D-Kugel, `NAV_*` / `navballTexture` / `renderNavball` / `drawNavball`)
Der Navball war ein gemalter Kreis mit waagerechtem Horizontstrich – flach, und Kurs/Neigung
standen nur als Zahlen daneben. Jetzt eine texturierte KUGEL wie in KSP (Wunsch Simon, mit
KSP-Screenshot als Vorlage), drumherum das Instrumentenbrett: links der Schubregler, rechts
der G-Kraft-Bogen, oben die Geschwindigkeit MIT Bezugssystem, unten Kurs/Neigung.
- ⚠️⚠️ **KEIN eigener WebGL-Kontext.** Die Kugel zeichnet der SCHON VORHANDENE Flug-Renderer
  nach dem Hauptbild in einen eigenen Bildausschnitt (`setViewport` + `setScissor` +
  `clearDepth`, `autoClear = false` – sonst löscht der zweite `render()` das Bild). Ein
  weiterer Kontext wäre auf dem Flug-Bildschirm der dritte (Szene, Booster-PiP, Navball) und
  im VAB gibt es schon drei; Browser geben bei ~16 auf und werfen den ÄLTESTEN weg – dann ist
  die Flugszene schwarz. Rahmen, Marker und Zeiger malt weiter das 2D-Canvas `#navball`, das
  transparent GENAU über diesem Ausschnitt liegt (kein `background`, kein `border-radius`!).
- ⚠️⚠️ **Die Beschriftung der Kugel ist SPIEGELVERKEHRT aufgemalt – das ist die Definition
  eines Navballs, kein Fehler.** Was in der Welt rechts von der Nase liegt, muss auf der Kugel
  rechts von der Mitte erscheinen (sonst zeigt der Prograde-Marker in die falsche Richtung).
  Das Tripel (rechts, Rücken, Nase) eines Fahrzeugs ist aber LINKSHÄNDIG – eine starre Drehung
  einer normalen Weltkugel kann das nie leisten. Also: Kugel-+X trägt die Beschriftung OST,
  +Y ZENIT, +Z NORD (Determinante −1), die Blickbasis `V = (bodyX, bodyZ, bodyY)` ebenfalls,
  und `Q = Vᵀ·L` ist damit wieder eine echte Rotation.
  Daraus folgt die Textur-Zuordnung (SphereGeometry-UV, s. »UV-Konvention«):
  **x = B·((Kurs + 90°)/360°)** (Kurs wächst nach RECHTS) · **y = H·(0,5 − Neigung/180°)**.
  Verifiziert: Nase nach Norden ⇒ Texturpunkt (0,25 | 0,5) = »N« in der Mitte, Osten exakt am
  rechten Rand (x = cx + R), Zenit oben, Süden hinter dem Ball.
- ⚠️ **`navProject(richtung)` ist die EINE Quelle für alle Marker** (Prograde ⊕, Ziel ◆,
  Knoten/Anflug ✛). Vorher rechnete jeder Marker Kurs- und Neigungsdifferenzen mit `clamp`
  auf einen 2D-Kreis – jetzt sitzt jeder exakt auf seiner Weltrichtung. Liegt die Richtung
  HINTER dem Ball, wandert der Marker blass (34 %) an den Rand und zeigt weiter die Drehrich-
  tung; steht sie exakt hinter dem Schiff (Projektion < 0,08), wird gar nichts gezeichnet –
  dort gibt es keine hilfreiche Richtung mehr.
- ⚠️ **Die Textur bleibt HELL, auch an den Polen.** Der erste Wurf lief zum Zenit hin auf ein
  sehr dunkles Blau: Auf der Rampe zeigt der Ball genau diesen Punkt, und die Kugel war vor
  dem dunklen HUD praktisch unsichtbar. Schrift wird mit `cos(Neigung)` vorgestaucht (die
  Kugel streckt sie zu den Polen hin um 1/cos) und an der Naht (Kurs 270° = x 0) doppelt
  gezeichnet.
- ⚠️⚠️ **Der schräge Horizont beim Ost-Aufstieg ist KORREKT, kein Bug.** [A]/[D] drehen um die
  Rücken-Achse (`apply(V3(0,0,1))`), der Rücken bleibt beim Gravity Turn also nach Süden
  zeigen – die Bahnebene steht damit quer zum »Bildschirm-oben« des Balls, und der Horizont
  läuft senkrecht. Das war beim alten 2D-Navball genauso (nur weniger auffällig). Level ginge
  nur, wenn der Ost-Schwenk ein NICKEN wäre – dann müsste [D] etwas anderes tun, und das steht
  in Tutorials, Hilfetexten und `padQ`. Wer den Ball roll-stabilisieren will (Bildschirm-oben
  = Zenit statt Schiffsrücken), verliert dafür die Rollanzeige (Bauchlage, Andocken).
- **Schubregler links** (`this.throttle`): aus der Gauge-Leiste hierher gewandert; dort stehen
  nur noch die VORRÄTE (Tank, Booster, ⚡, 🫁). **G-Kraft rechts** (`this.gLoad`, Bogen bis 5 g,
  grün/gelb/rot): ⚠️ Am BODEN ist das die Stützkraft des Untergrunds, nicht null – auf der
  Rampe 1,0 g, auf Monti 0,17 g (`this.gLoad = g/G0` im `landed`-Zweig von `step()`). Genau
  das würde eine Waage anzeigen.
- **Geschwindigkeit oben MIT Bezugssystem** (`navRef`): Eine Geschwindigkeit ohne Bezug ist im
  Weltraum eine sinnlose Zahl – deshalb steht der Bezugskörper darüber, und die Zeile
  »Geschwindigkeit« ist aus der Info-Tafel oben links VERSCHWUNDEN. Ist ein Ziel gewählt und
  näher als 50 km (dieselbe Schwelle wie der ◆-Marker), zählt automatisch die RELATIV-
  geschwindigkeit zu ihm – die Zahl, auf die es beim Andocken ankommt. ⚠️ Lange Namen werden
  gekürzt (»Raumstation »Große Pause«« → »Große Pause«, danach notfalls mit »…«), sonst läuft
  der Text aus dem Kasten.
- ⚠️ **Position: der Navball weicht der KNOPFLEISTE aus** (`this.navBottom`, alle 400 ms aus
  `getBoundingClientRect()`). Die Leiste bricht je nach Fensterbreite auf zwei bis vier Reihen
  um; mit festem Abstand lag der Ball auf einem schmalen Laptop mitten unter den Knöpfen.
  `#hudMsg` wird im selben Schritt darüber gesetzt – sonst deckt die Meldung die
  Geschwindigkeitsanzeige zu.
- ⚠️ Gezeichnet wird NICHT im Fotomodus und nicht ab HUD-Stufe 2 (`renderNavball` steigt
  vorher aus): Die Kugel steckt im Bild des Renderers und stünde sonst mitten im
  gespeicherten Foto bzw. bliebe trotz ausgeblendetem Overlay sichtbar.
- Kosten gemessen: **0,175 ms je `frame()`** (Kugel + Overlay zusammen), 1 Draw-Call extra.
- **Bewusst NICHT übernommen** (aus dem KSP-Vorbild): SAS-/RCS-Schalter und der Knopfkranz der
  SAS-Modi. Die Marker AUF dem Ball bleiben – auf sie zeigen die Tutorials ausdrücklich
  (»Nase aufs rosa ✛«).

## HUD-Kleinkram
- ⚠️⚠️ **`#hudRight` braucht ein `max-width`** (`min(640px, calc(100vw − 380px))`): Sobald ein
  Reiseziel gewählt ist, hängt `travelPanel` unten einen langen Tipp an (»Ziel: unter 6.066 km
  (Einflusssphäre) …«). Ohne Deckel wächst das rechte Panel einzeilig nach LINKS und schiebt
  sich über die Info-Tafel oben links (Bug-Report Simon, Screenshot Minzi-Anflug). Die 380 px
  sind die Breite der linken Tafel plus Rand, der zweite Wert deckelt die Zeilenlänge auf
  breiten Schirmen. Gemessene Lücke zwischen beiden Tafeln: 1000 px → 142 · 1280 px → 402 ·
  1440 px → 562.
- **Crew-Porträts (`#crewCam` / `drawCrew`) sitzen UNTEN RECHTS und klein** (`CREW_ICON_SCALE`
  0,62; darunter wird aus »Dr. Luca« ein grauer Strich). Oben rechts lagen sie über dem
  Reiseplaner – auf einem 13"-Laptop war von Transferfenster, Δv und Begegnung nichts mehr
  zu lesen (Bug-Report Simon). ⚠️ Gezeichnet wird weiter im alten 84×92-Raster, verkleinert
  wird per `setTransform` – so bleibt jede Koordinate im Zeichencode unangetastet.
  ⚠️ `#nodeUI` sitzt zwar auch unten rechts, ist aber NUR in der Karte sichtbar, und dort
  blendet `drawCrew` die Porträts ohnehin aus. ⚠️ Die Leiste wird zusätzlich in den freien
  Platz neben der (mittig stehenden, umbrechenden) Knopfleiste gequetscht: bei 1280 px ragte
  sie sonst 19 px hinein. `_crewS` cacht das Ergebnis 500 ms – `getBoundingClientRect`
  erzwingt ein Layout und `drawCrew` läuft in JEDEM Frame.
- **`fmtDur` kennt Jahre** (ab 2 Jahren, bewusst 365 ERD-Tage – die Spieluhr zählt
  24-Stunden-Tage, ein Leibniz-Jahr wären 107 Tage und niemand rechnet das im Kopf um).
  Das Knoten-Panel zeigt »Zeit bis Knoten« damit als min/h/Tage/Jahre statt in **Sekunden** –
  bei einem Knoten 35 Tage voraus stand dort vorher »3002461 s«.
  ⚠️ `fmtDur` rundet ERST auf die kleinste angezeigte Einheit und zerlegt DANN: aus 599,9 s
  wurde sonst »9 min 60 s«, und das fällt in jeder vollen Minute eines Countdowns auf.

## Tastenkürzel
(Im Spiel nachschlagbar: ⚙️ Optionen → **⌨️ Tastenbelegung**, `KEYMAP` in index.html.
Wer hier etwas ändert, ändert es dort UND in tutorials.js mit.)
Space Stufe · T SAS (off/pro/retro/[node]/[tgt]) · P Schirm · **F Fairing – bei EVA am Boden: 🚩 Flagge, ⇧F 📸 Fotomodus** · N Satellit · G Panele · **Y Landebeine ein/aus** · O Buchten · **R Booster zünden** · J Booster ab · **L Docken/Autopilot (<200 m)** · **I Modul einbauen** · **C Bellyflop (Starship)** · **V EVA (im All ODER gelandet – zu Fuß: WASD laufen, ↑ hüpfen)** · **K Knoten, ⇧K Auto-Knoten (Bordcomputer setzt den Transfer-Knoten selbst)** · B Experiment · **M Karte, ⇧M Kartenfilter »nur Ziel«** · U ∞Tank (Sandbox) · **H HUD (4-stufig: alles → Knopfleiste weg → Instrumente weg (Navball/Balken/Crew) → alles weg)** · **⇧F Fotomodus (Bild einfrieren, freie Kamera, [⏎] speichert PNG)** · Esc Pause · ,/. Warp, **⇧. = Zeitsprung zum Knoten/Startfenster** · WASD/QE drehen · ↑↓ Schub · **X Schub aus, ⇧X Vollgas** · **Z = Ziel wählen (IMMER: auf der Rampe das Startfenster, im Flug Station/Tanker/Planeten)**
- ⚠️⚠️ **[Z] war bis August 2026 im Flug VOLLGAS und die Zielwahl brauchte ⇧Z** – »zu
  umständlich und verwirrend« (Simon), weil dieselbe Taste je nach Flugzustand etwas völlig
  anderes tat. Jetzt liegt der Schub komplett auf **[X]** (aus / ⇧ voll) und [Z] ist überall
  die Zielwahl. Ein freier Buchstabe für Vollgas existiert nicht – **alle 26 sind belegt** –,
  deshalb die Umschalt-Variante auf dem natürlichen Partner. Wer das nochmal anfasst: Die
  Tastenhinweise stehen in `hudRight`, am `btnTarget`, in den INTRO/HINT-Texten von
  index.html UND in tutorials.js (dort 7 Stellen »Vollgas«).

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
