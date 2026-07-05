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
   scenario:{stack:["chute","pod","shield","rcs","tankM","engVac","decoupler","tankL","tankL","engMain"]},
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
   scenario:{stack:["chute","pod","rcs","tankM","tankM","engVac"], orbit:{body:"LEIBNIZ", alt:80000}},
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
   scenario:{stack:["antenna","solar","battery","probe","fairing","pod","rcs","solar","tankM","engVac"], orbit:{body:"LEIBNIZ", alt:90000}},
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
   scenario:{stack:["pod","rcs","tankM","engVac","legs"], orbit:{body:"MONTI", alt:15000}},
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

  {id:"reentry", icon:"🔥", title:"Wiedereintritt überleben", sub:"Stufe abtrennen, Schild ausrichten, Schirm ziehen.",
   scenario:{stack:["chute","pod","shield","rcs","decoupler","tankM","engVac"], orbit:{body:"LEIBNIZ", alt:75000, pe:28000}},
   steps:[
    {text:`Rückkehr vom Orbit! Deine Bahn taucht bereits in die Atmosphäre
      (Periapsis 28 km – sieh in der Karte <b>[M]</b> nach).<br><br>
      Die verbrauchte Antriebsstufe brauchst du nicht mehr – und sie hat keinen
      Hitzeschutz. <b>Trenne sie ab mit der [Leertaste]!</b>`,
     check:(o,F)=>F.v.segs.length===1},
    {text:`Jetzt bist du nur noch Kapsel + Hitzeschild + Fallschirm. 👍<br><br>
      Der <b>Hitzeschild zeigt nach unten</b> – also muss die Kapsel <b>gegen die
      Flugrichtung</b> zeigen: Drücke <b>[T]</b> bis <b>SAS: RETROGRADE</b>.`,
     check:(o,F)=>F.sas==="retro"},
    {text:`Perfekt ausgerichtet! Warte nun auf die Atmosphäre (Zeitraffer <b>[.]</b>,
      bei Bedarf [,] zurück).<br><br>
      Gleich wird es heiß: Der Schild glüht, das Plasma leuchtet – aber er hält stand.
      Überstehe den Feuerritt, bis du unter <b>30 km</b> und langsamer als
      <b>1200 m/s</b> bist!`,
     check:o=>o.alt<30000 && o.speed<1200},
    {text:`Geschafft – das Schlimmste ist vorbei! 🔥➡️💨<br><br>
      Die Luft bremst dich weiter ab. Unter <b>5 km Höhe</b>: Fallschirm mit <b>[P]</b>!`,
     check:(o,F)=>F.chuteOpen},
    {text:`🪂 Sanft schweben… warte auf die Landung.`,
     check:(o,F)=>F.landed},
   ],
   done:`Wiedereintritt gemeistert! 🏅 Merke: <b>Stufe abwerfen → Retrograde mit
     Hitzeschild voraus → unter 5 km Fallschirm</b>. Ohne Schild = 💥, ohne
     Retrograde-Ausrichtung riskierst du die Crew. Jetzt bist du bereit für echte Orbit-Missionen!`},
  {id:"burns", icon:"🧭", title:"Burn-Manöver & SAS verstehen", sub:"Prograde, Retrograde & Co. – die Sprache der Raumfahrt.",
   scenario:{stack:["chute","pod","shield","rcs","tankM","tankM","engVac"], orbit:{body:"LEIBNIZ", alt:100000}},
   steps:[
    {text:`Du bist im 100-km-Orbit. Auf dem <b>Navball</b> siehst du das grüne Symbol:
      das ist <b>PROGRADE</b> – die Richtung, in die du gerade fliegst.<br><br>
      Merksatz: <b>Prograde brennen = schneller werden = Bahn wird GRÖSSER</b>
      (auf der gegenüberliegenden Seite!).<br><br>
      Drücke <b>[T]</b>, bis SAS: PROGRADE aktiv ist.`,
     check:(o,F)=>F.sas==="pro"},
    {text:`Das SAS hält die Nase jetzt automatisch auf Prograde. 🎯<br><br>
      Gib Vollgas <b>[Z]</b> und beobachte links die <b>Apoapsis</b>:
      Sie wächst – aber nicht hier, sondern auf der GEGENSEITE deiner Bahn!
      (Karte [M] zeigt es live.)<br><br>
      Brenne, bis <b>Ap über 200 km</b> liegt, dann Triebwerk aus [X].`,
     check:o=>o.ap>200000},
    {text:`Jetzt das Gegenteil: <b>RETROGRADE</b> = gegen die Flugrichtung brennen
      = langsamer werden = <b>Bahn wird KLEINER</b>.<br><br>
      Drücke <b>[T]</b>, bis SAS: RETROGRADE aktiv ist – die Rakete dreht sich um 180°.`,
     check:(o,F)=>F.sas==="retro"},
    {text:`Vollgas <b>[Z]</b> – und sieh zu, wie die Apoapsis wieder schrumpft!<br><br>
      Brenne, bis <b>Ap wieder unter 130 km</b> liegt, dann [X].<br><br>
      💡 So funktioniert ALLES in der Raumfahrt: höher = prograde, runter = retrograde,
      immer am richtigen Punkt der Bahn.`,
     check:o=>o.ap>0 && o.ap<130000},
    {text:`Die letzten zwei Richtungen (für Profis):<br><br>
      <b>NORMAL</b> (senkrecht zur Bahnebene) kippt deine Bahnneigung –
      wichtig für Minzis geneigte Bahn.<br>
      <b>RADIAL</b> (zum Planeten hin/weg) dreht die Bahn, ohne die Größe stark zu ändern.<br><br>
      Beides stellst du am <b>Manöverknoten [K]</b> ein – dort heißen die Regler genauso!`},
   ],
   done:`Du sprichst jetzt Raumfahrt! 🧭 Prograde = größer, Retrograde = kleiner,
     Normal = Neigung, Radial = Drehung. Mit [T] hält das SAS jede Richtung automatisch –
     und am Manöverknoten brennt das Triebwerk exakt das geplante Δv.`},

  {id:"evatut", icon:"🧑‍🚀", title:"Außeneinsatz (EVA)", sub:"Aussteigen, schweben, sicher zurückkommen.",
   scenario:{stack:["chute","pod","shield","rcs","tankM","engVac"], orbit:{body:"LEIBNIZ", alt:120000}},
   steps:[
    {text:`Du bist im 120-km-Orbit – Zeit für den berühmtesten Moment der Raumfahrt:
      den <b>Weltraumspaziergang</b>!<br><br>
      Öffne die Luke mit <b>[V]</b>.`,
     check:(o,F)=>!!F.eva},
    {text:`Da schwebt deine Pilotin / dein Pilot! 🧑‍🚀<br><br>
      Das <b>Jetpack</b> steuert sich kamera-relativ: <b>W/S</b> = vor/zurück,
      <b>A/D</b> = links/rechts, <b>↑/↓</b> = hoch/runter. Die Maus dreht die Kamera.<br><br>
      Entferne dich mindestens <b>40 m</b> vom Schiff (Abstand oben rechts).`,
     check:(o,F)=>F.eva && F.eva.pos.distanceTo(F.pos)>40},
    {text:`Schau dir dein Schiff von außen an – und Leibniz unter dir! 🌍<br><br>
      Aber Vorsicht: Wer zu weit abdriftet, kommt nicht zurück.
      Flieg jetzt <b>zurück zum Schiff</b> (unter 60 m) und steig mit <b>[V]</b> wieder ein.`,
     check:(o,F)=>!F.eva},
   ],
   done:`Sicher zurück an Bord! 🛰️ Merke: Im Orbit bewegt sich die Astronautin mit
     derselben Bahngeschwindigkeit wie das Schiff – kleine Jetpack-Stöße reichen.
     EVA geht nur mit Crew (Kommandokapsel) und nur im Weltraum.`},

  {id:"rendezvous", icon:"🔗", title:"Rendezvous & Docking", sub:"Triff die Raumstation »Große Pause« – und docke an!",
   scenario:{stack:["dock","pod","rcs","tankS","engT"], nearStation:3000},
   steps:[
    {text:`Vor dir fliegt die Raumstation <b>»Große Pause«</b> – nur 3 km entfernt, im selben
      100-km-Orbit! Rechts im HUD siehst du <b>Abstand</b> und <b>Relativgeschwindigkeit</b>.<br><br>
      Wirf zuerst einen Blick auf die Lage: Öffne die Karte mit <b>[M]</b> –
      die Station ist der hellblaue <b>ISS</b>-Marker direkt neben dir.`,
     check:(o,F)=>F.map},
    {text:`Schließe die Karte wieder <b>[M]</b>. Auf dem Navball zeigt das <b>türkise ◆</b>
      zur Station.<br><br>
      Richte die Nase mit <b>W/A/S/D</b> genau auf das ◆ und gib einen <b>kurzen</b>
      Schubstoß (<b>[↑]</b> antippen, dann <b>[X]</b>) – Ziel: dich mit ~10–20 m/s nähern.
      Dann treiben lassen, bis der Abstand <b>unter 1 km</b> fällt.`,
     check:(o,F)=>!F.map && F.pos.distanceTo(stationPos(F.t))<1000},
    {text:`Unter 1000 m! 🛰 Jetzt wird GEBREMST – wie beim Einparken:<br><br>
      Drücke <b>[T]</b>, bis <b>SAS: ZIEL-BREMSE</b> erscheint. Das Schiff dreht sich
      automatisch <b>gegen</b> die Annäherung. Dann kurz brennen, bis die
      <b>Relativgeschwindigkeit unter 3 m/s</b> liegt.`,
     check:(o,F)=>F.vel.distanceTo(stationVel(F.t))<3 && F.pos.distanceTo(stationPos(F.t))<1500},
    {text:`Sauber abgebremst! Jetzt der Feinanflug – immer im Wechsel:<br><br>
      1. Nase aufs türkise ◆ drehen, Mini-Schubstoß (3–5 m/s).<br>
      2. Treiben lassen, Abstand beobachten.<br>
      3. <b>[T]</b> ZIEL-BREMSE + kurz brennen zum Stoppen.<br><br>
      Wiederhole das, bis du <b>unter 30 m</b> an der Station bist.`,
     check:(o,F)=>F.docked || F.pos.distanceTo(stationPos(F.t))<30},
    {text:`Beinahe berührbar! ✨ Relativgeschwindigkeit unter 3 m/s? Dann:<br><br>
      <b>[L] – ANDOCKEN!</b>`,
     check:(o,F)=>F.docked},
   ],
   done:`🔗 ANGEDOCKT AN DER »GROSSEN PAUSE«! 🎉 Du beherrschst jetzt die schwierigste
     Übung der Raumfahrt: das Rendezvous. Genau so entstand die echte ISS – Modul für Modul.
     In der Karriere wartet dafür die Mission "Rendezvous: »Große Pause«" (+55 🧪).
     Abdocken geht übrigens jederzeit mit [L].`},

  {id:"science", icon:"🔬", title:"Wissenschaft sammeln", sub:"Du startest im Orbit mit Labor an Bord.",
   scenario:{stack:["chute","pod","lab","rcs","tankM","engVac"], orbit:{body:"LEIBNIZ", alt:100000}},
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
     <b>Forschung</b> neue Bauteile frei. Tipp: Nimm das Labor auf JEDE Mission mit.`},

  {id:"booster", icon:"🛬", title:"Booster-Landung (Falcon-Stil)", sub:"Erste Stufe mit Gitterflossen – abtrennen, zuschauen, sparen.",
   scenario:{stack:["chute","pod","rcs","tankM","engVac","decoupler","gridfin","fin","tankL","engMain"]},
   steps:[
    {text:`Diese Rakete hat <b>Gitterflossen</b> an der ersten Stufe (die angelegten
      Gitter oben am großen Tank – wie bei der Falcon 9!). Damit kann der
      <b>Landeautopilot</b> die Stufe nach der Trennung sicher zurückbringen.<br><br>
      Wichtig: Schau auf die <b>TANK-Anzeige</b> unten links – die <b>orange Marke</b>
      zeigt den Restsprit, den der Autopilot für den Landing Burn braucht!<br><br>
      Zünde mit der <b>[Leertaste]</b> und steig senkrecht.`,
     check:(o,F)=>!F.landed && F.flew},
    {text:`Neige die Rakete mit <b>[D]</b> leicht nach Osten (Gravity Turn) und steig
      weiter. Behalte dabei die <b>Tank-Anzeige</b> im Auge – sie sinkt Richtung
      orange Marke!<br><br>Steig über <b>12 km</b>.`,
     check:o=>o.alt>12000},
    {text:`Jetzt kommt der Falcon-Moment! 🚀<br><br>
      Trenne die erste Stufe mit der <b>[Leertaste]</b>, <b>SOLANGE der Tankbalken
      noch ÜBER der orangen Marke ist</b>. Zu spät = kein Sprit für die Landung,
      der Booster zerschellt!`,
     check:(o,F)=>!!F.booster},
    {text:`Der <b>Autopilot</b> hat übernommen – rechts öffnet sich das
      <b>Beobachtungsfenster</b>: Wende-Manöver, Gitterflossen ausklappen,
      Abstieg, Landing Burn. 🍿<br><br>
      Du fliegst währenddessen mit <b>Stufe 2</b> weiter (z. B. prograde Richtung
      Orbit – oder einfach zuschauen). Warte, bis der Booster <b>gelandet</b> ist!`,
     check:(o,F)=>F.booster && F.booster.state==="landed"},
   ],
   done:`🏆 BOOSTER GELANDET – wie bei SpaceX! Merke: <b>Gitterflossen dran, über der
     orangen Marke abtrennen, der Autopilot macht den Rest.</b> Im Karrieremodus
     bekommst du den vollen Wert der Stufe zurückerstattet – Wiederverwendung
     spart richtig Geld! (Mission "Sie landet doch!" wartet.)`},

  {id:"starship", icon:"🤸", title:"Starship: Wiedereintritt & Bellyflop", sub:"Bauchlage, Flip, Landing Burn – wie in Boca Chica.",
   scenario:{stack:["starship"], orbit:{body:"LEIBNIZ", alt:75000, pe:22000}},
   steps:[
    {text:`Du sitzt im <b>Starship</b> auf Wiedereintritts-Kurs (Periapsis 22 km).
      Keine Fallschirme, kein Hitzeschild-Teil – das Starship hat <b>Hitzeschutz-Kacheln</b>
      am Bauch und landet mit dem <b>Bellyflop-Manöver</b>!<br><br>
      Aktiviere den Bellyflop-Autopiloten mit <b>[C]</b>: Das Schiff legt sich flach
      auf den Bauch.`,
     check:(o,F)=>!!F.belly},
    {text:`🤸 Bauchlage! Der riesige Bauch bremst wie ein Fallschirm.<br><br>
      Jetzt Geduld (Zeitraffer <b>[.]</b> hilft): Überstehe den glühenden Wiedereintritt –
      die Kacheln halten das aus – und fall, bis du <b>unter 10 km</b> und
      <b>langsamer als 300 m/s</b> bist.`,
     check:o=>o.alt<10000 && o.speed<300},
    {text:`Schau auf die Geschwindigkeit: Sie pendelt sich bei der
      <b>Terminal-Geschwindigkeit (~70–90 m/s)</b> ein – schneller wird ein fallendes
      Starship nicht, egal wie lange es fällt. Genau wie in echt!<br><br>
      Jetzt NICHTS tun: Der Autopilot zündet den <b>Flip + Landing Burn</b> automatisch
      kurz über dem Boden. (Merke: [C] muss über <b>200 m Höhe</b> gedrückt sein –
      darunter reicht die Zeit für den Flip nicht!)<br><br>Warte auf die Landung …`,
     check:(o,F)=>F.landed},
   ],
   done:`🏆 STARSHIP GELANDET! Bauchlage → Flip → Landing Burn: die spektakulärste
     Landung der Raumfahrt. Tipp für eigene Flüge: Das Tanker-Starship (ohne Flaps)
     parkst du im Orbit und tankst dort wieder auf – so reicht es bis Monti und weiter!`}
];
