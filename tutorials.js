/* =================================================================
   LMG SPACE PROGRAM – Interaktive Tutorials
   Jedes Tutorial wirft den Spieler in ein vorbereitetes Szenario.
   scenario.stack  = vorgebaute Rakete (oben → unten)
   scenario.orbit  = startet direkt im Orbit {body, alt}
   (ohne orbit: Start auf der Rampe)
   steps: {text, check} – check(o, F) hakt den Schritt automatisch ab
   (o = Flight.orbit(), F = Flight). Ohne check: "Weiter"-Button.
   ================================================================= */
const TUTORIALS = [
  {id:"first", icon:"🚀", title:"Dein erster Start", sub:"Vorgebaute Rakete – zünden, steigen, landen.",
   scenario:{stack:["chute","pod","tankS","engS"]},
   steps:[
    {text:`Deine erste Rakete steht startklar auf der Rampe: Fallschirm, Kapsel, Tank, Triebwerk.<br><br>
      Zünde die erste Stufe mit der <b>[Leertaste]</b>!`,
     check:(o,F)=>!F.landed && F.flew},
    {text:`Liftoff! 🔥 Die Rakete steigt senkrecht. Links siehst du Höhe und Geschwindigkeit,
      unten links Schub und Tank.<br><br>Steig auf <b>5 km Höhe</b>!`,
     check:o=>o.alt>5000},
    {text:`5 km! 🏆 Gleich ist der Tank leer und die Rakete fällt zurück.<br><br>
      Warte, bis sie wieder <b>fällt</b> (Geschwindigkeit zeigt nach unten), und öffne dann
      den Fallschirm mit <b>[P]</b>.`,
     check:(o,F)=>F.chuteOpen},
    {text:`Fallschirm offen! 🪂 Jetzt schwebst du mit ~7 m/s zu Boden.
      Unter 8 m/s Aufprall ist die Landung sicher.<br><br>Warte auf die Landung …`,
     check:(o,F)=>F.landed && F.flew}
   ],
   done:`Sicher gelandet! 🛬 Du beherrschst Start, Steigen und Fallschirm.
     Nächster Schritt: das Tutorial <b>In den Orbit</b>!`},

  {id:"orbit", icon:"🛰️", title:"In den Orbit", sub:"Zweistufige Rakete steht bereit – flieg den Gravity Turn.",
   scenario:{stack:["chute","pod","shield","tankM","engVac","decoupler","tankL","tankL","engMain"]},
   steps:[
    {text:`Diese zweistufige Rakete hat genug Δv für einen Orbit (~3400 m/s) – und einen
      <b>Hitzeschild</b> unter der Kapsel für die Rückkehr!<br><br>
      Ein Orbit heißt: <b>so schnell zur Seite fliegen</b>, dass man beim Fallen immer an der
      Erde vorbeifällt!<br><br>Zünde mit <b>[Leertaste]</b> und steig senkrecht.`,
     check:(o,F)=>!F.landed && F.flew},
    {text:`Ab jetzt der <b>Gravity Turn</b>: Neige die Rakete mit <b>[D]</b> langsam nach Osten
      (Navball: Richtung 90°).<br><br>Faustregel: 10 km → 20° Neigung, 30 km → 60°.<br>
      Wenn die 1. Stufe leer ist: <b>[Leertaste]</b> trennt und zündet Stufe 2.<br><br>
      Steig erstmal über <b>20 km</b>.`,
     check:o=>o.alt>20000},
    {text:`Öffne die Karte mit <b>[M]</b>: Der blaue <b>Ap</b>-Marker ist der höchste Punkt
      deiner Bahn.<br><br>Brenne weiter Richtung Osten, bis <b>Ap über 75 km</b> liegt –
      dann Triebwerk aus mit <b>[X]</b>.`,
     check:o=>o.ap>75000},
    {text:`Perfekt! Jetzt der entscheidende Trick:<br><br>
      ⏩ Mit <b>[.]</b> Zeit raffen, bis du kurz vor dem Ap bist (Höhe ≈ Apoapsis).<br>
      Dann <b>[T]</b> für SAS PROGRADE und Vollgas <b>[Z]</b> –
      brenne, bis die <b>Periapsis über 70 km</b> steigt!`,
     check:o=>o.pe>70000},
   ],
   done:`DU BIST IM ORBIT! 🎉 Du fliegst jetzt ohne Treibstoff für immer im Kreis.
     Heimweg: SAS Retrograde, brennen bis Pe < 35 km – dein <b>Hitzeschild</b> übersteht
     das Feuer des Wiedereintritts (ohne ihn: 💥!), dann Fallschirm [P].`},

  {id:"node", icon:"◆", title:"Manöverknoten: Reise nach Monti", sub:"Du startest direkt im Orbit – plane den Transfer.",
   scenario:{stack:["chute","pod","tankM","tankM","engVac"], orbit:{body:"LEIBNIZ", alt:80000}},
   steps:[
    {text:`Du bist bereits in einem 80-km-Orbit – mit vollen Tanks (~2600 m/s Δv).
      Ziel: der Mond <b>Monti</b>!<br><br>Öffne zuerst die Karte mit <b>[M]</b>.`,
     check:(o,F)=>F.map},
    {text:`Erstelle mit <b>[K]</b> einen Manöverknoten auf deiner Bahn.`,
     check:(o,F)=>!!F.node},
    {text:`Im Panel rechts: Klicke bei <b>Prograde</b> auf +10, bis etwa <b>+860 m/s</b>
      eingestellt sind. Beobachte, wie die <b>grüne geplante Bahn</b> wächst – sie muss bis zur
      Umlaufbahn von Monti reichen!`,
     check:(o,F)=>F.node && F.node.pro>=800},
    {text:`Die grüne Bahn kreuzt Montis Orbit – aber trifft sie Monti? Verschiebe den
      <b>Zeitpunkt</b> (±60s-Buttons), bis die grüne Bahn nahe an Monti vorbeiführt.<br><br>
      Dann: <b>[T]</b> mehrmals, bis "SAS: auf Manöverknoten" – und zünde bei
      <b>T minus halbe Brenndauer</b> (steht im Panel) mit <b>[Z]</b>.
      Brenne ungefähr die angegebene Dauer, bis deine echte Bahn (orange) der grünen entspricht
      (Ap > 11.000 km).`,
     check:o=>o.ap<0 || o.ap>1.1e7},
    {text:`Transferbahn liegt an! 🚀 Triebwerk aus mit <b>[X]</b>.<br><br>
      Jetzt Geduld im Schnelldurchlauf: Zeitraffer <b>[.]</b> bis 1000× und zuschauen,
      wie du zu Monti fliegst (dauert ein paar Sekunden Echtzeit).`,
     check:o=>o.body && o.body.name==="Monti"},
   ],
   done:`Willkommen in Montis Gravitationssphäre! 🌗 Bonus-Aufgabe: Brenne am tiefsten Punkt
     RETROGRADE, bis Ap unter Montis SOI fällt – dann bist du eingefangen (Monti-Orbit)!`},

  {id:"sat", icon:"📡", title:"Satellit aussetzen", sub:"Du startest im Orbit – mit Satellit unter dem Fairing.",
   scenario:{stack:["antenna","solar","battery","probe","fairing","pod","solar","tankM","engVac"], orbit:{body:"LEIBNIZ", alt:90000}},
   steps:[
    {text:`Du bist im 90-km-Orbit. An der Spitze deiner Rakete sitzt ein kompletter Satellit
      (Antenne + Solar + Sondenkern) unter einem weißen <b>Nutzlast-Fairing</b>.<br><br>
      Im Vakuum braucht es das Fairing nicht mehr: Spreng es ab mit <b>[F]</b>!`,
     check:(o,F)=>!F.v.fairingIntact},
    {text:`Da kommt der Satellit zum Vorschein! ✨<br><br>
      Setze ihn jetzt mit <b>[N]</b> aus.`,
     check:(o,F)=>F.sats.length>0},
    {text:`📡 Der Satellit fliegt ab jetzt selbstständig weiter!<br><br>
      Wichtig für eigene Missionen: Sonden brauchen <b>Strom</b> (⚡-Balken links unten).
      Fahre die Solarpanele mit <b>[G]</b> aus – aber nur im Vakuum, im Fahrtwind reißen sie ab!`,
     check:(o,F)=>F.panelsOut},
    {text:`☀️ Die Panele laden die Batterie (+3 ⚡/s). Öffne noch die Karte <b>[M]</b>:
      Dein Satellit erscheint als grüner Punkt auf seiner Bahn.`,
     check:(o,F)=>F.map},
   ],
   done:`Mission erfüllt! In der Karriere gibt es dafür die Mission "Erster Satellit" (+30 🧪).
     Profi-Ziel: ein Satellit im Orbit um Monti oder Minzi!`},

  {id:"land", icon:"🛬", title:"Mondlandung auf Monti", sub:"Du startest im tiefen Monti-Orbit – setz den Lander auf.",
   scenario:{stack:["pod","tankM","engVac","legs"], orbit:{body:"MONTI", alt:15000}},
   steps:[
    {text:`Du umkreist Monti in 15 km Höhe. Dein Lander hat Landebeine (verzeihen bis 12 m/s)
      – aber Monti hat <b>keine Atmosphäre</b>: kein Fallschirm, nur Triebwerksbremsen!<br><br>
      Schalte SAS mit <b>[T]</b> auf <b>RETROGRADE</b> und brenne mit <b>[Z]</b>,
      bis die Periapsis <b>unter 0</b> fällt (Bahn zeigt in den Boden).`,
     check:o=>o.pe<0},
    {text:`Du fällst jetzt auf Monti zu. Lass SAS auf Retrograde – so bremst du immer genau
      gegen die Fallrichtung.<br><br>Faustregel: über 2000 m fallen lassen, dann kräftig
      bremsen. Sink unter <b>5000 m</b> Höhe.`,
     check:o=>o.alt<5000},
    {text:`Endphase! 🔥 Brenne so, dass die Geschwindigkeit beim Sinken klein bleibt:<br>
      bei 1000 m → unter 100 m/s · bei 200 m → unter 20 m/s · Aufsetzen → <b>unter 12 m/s</b>.<br><br>
      Mit <b>[↑/↓]</b> fein dosieren. Du schaffst das!`,
     check:(o,F)=>F.landed},
   ],
   done:`DER ADLER IST GELANDET! 🦅 Mondlandung gemeistert – die Königsdisziplin.
     (Crash gehabt? <b>↩ Neustart</b> setzt das Szenario zurück.)`},

  {id:"science", icon:"🔬", title:"Wissenschaft sammeln", sub:"Du startest im Orbit mit Labor an Bord.",
   scenario:{stack:["chute","pod","lab","tankM","engVac"], orbit:{body:"LEIBNIZ", alt:100000}},
   steps:[
    {text:`Dein Schiff hat ein <b>Materiallabor »Curie«</b> an Bord (das Modul mit den
      leuchtenden Fenstern). Du bist im nahen Weltraum über Leibniz.<br><br>
      Führe ein Experiment durch: <b>[B]</b>!`,
     check:(o,F)=>F.expCount>0},
    {text:`🔬 Im Karrieremodus gibt jeder <b>neue Ort</b> einmalig Wissenschaft:
      Atmosphäre (6) · naher Weltraum (12) · hoher Orbit (15) · bei Monti (20) ·
      auf Monti (30) · bei Minzi (25) · auf Minzi (40).<br><br>
      Steig in einen höheren Orbit: Brenne PROGRADE (SAS [T] hilft), bis die
      <b>Apoapsis über 250 km</b> liegt, raffe die Zeit bis dorthin – das wäre der
      nächste neue Forschungsort! Brenne jetzt bis <b>Ap > 250 km</b>.`,
     check:o=>o.ap>250000},
    {text:`Warte mit Zeitraffer <b>[.]</b>, bis du über <b>250 km Höhe</b> bist
      (= neuer Ort "hoher Orbit"), und drücke dann wieder <b>[B]</b>.`,
     check:(o,F)=>F.expCount>1},
   ],
   done:`So funktioniert Forschung! 🧪 Im Karrieremodus schaltest du mit den Punkten unter
     <b>Forschung</b> neue Bauteile frei. Tipp: Nimm das Labor auf JEDE Mission mit.`}
];
