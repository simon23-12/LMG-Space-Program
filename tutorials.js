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
   scenario:{stack:["chute","pod","fin","tankS","engS"]},
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
   scenario:{stack:["chute","pod","shield","rcs","tankM","engVac","decoupler","inter","fin","tankL","tankL","engMain"]},
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
   scenario:{stack:["chute","pod","rcs","fin","tankM","tankM","engVac"], orbit:{body:"LEIBNIZ", alt:80000}},
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
    {text:`Willkommen in Montis Gravitationssphäre! 🌗 Aber Achtung: Ohne Bremsung ist das
      nur ein <b>Vorbeiflug</b> – Monti lässt dich wieder ziehen!<br><br>
      Zum <b>EINFANGEN</b> bremst du am tiefsten Punkt (Oberth-Trick – dort wirkt jeder
      m/s am stärksten): Raffe die Zeit bis kurz vor die <b>Periapsis</b> (oranger
      Pe-Marker in der Karte), dann <b>[T]</b> auf SAS RETROGRADE und Vollgas <b>[Z]</b>,
      bis die <b>Apoapsis unter 2000 km</b> fällt – deine Bahn wird zur Ellipse um Monti!`,
     check:o=>o.body && o.body.name==="Monti" && o.ap>0 && o.ap<2e6},
   ],
   done:`EINGEFANGEN – du bist im MONTI-ORBIT! 🌗🎉 Genau so fliegt man zu jedem Mond:
     Transferknoten → Vorbeiflug-Feintuning → Capture-Burn an der Periapsis.
     Nächster Schritt: das Tutorial <b>Mondlandung auf Monti</b>!`},

  {id:"sat", icon:"📡", title:"Satellit aussetzen", sub:"Du startest im Orbit – mit Satellit unter dem Fairing.",
   scenario:{stack:["antenna","solar","battery","probe","fairing","pod","rcs","solar","fin","tankM","engVac"], orbit:{body:"LEIBNIZ", alt:90000}},
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
   scenario:{stack:["pod","rcs","fin","tankM","engVac","legs"], orbit:{body:"MONTI", alt:15000}},
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
   scenario:{stack:["chute","pod","shield","rcs","decoupler","fin","tankM","engVac"], orbit:{body:"LEIBNIZ", alt:75000, pe:28000}},
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
   scenario:{stack:["chute","pod","shield","rcs","fin","tankM","tankM","engVac"], orbit:{body:"LEIBNIZ", alt:100000}},
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

  {id:"inclination", icon:"📐", title:"Inklination ändern", sub:"Satellit im schiefen Orbit – kippe die Bahnebene mit einem Normal-Burn.",
   scenario:{stack:["probe","solar","antenna","rcs","tankM","engVac"],
     orbit:{body:"LEIBNIZ", alt:150000, inc:20},
     goalOrbit:{body:"LEIBNIZ", alt:150000, incMax:5, label:"Äquator-Orbit (Inklination < 5°)"}},
   steps:[
    {text:`Dein Satellit ist im 150-km-Orbit – aber die Bahn ist um <b>20° geneigt</b>
      (HUD links: "Inklination"). Der Auftraggeber will einen <b>Äquator-Orbit</b>!
      Zum Glück ist die Oberstufe noch dran: volle Tanks für das Manöver.<br><br>
      Öffne die Karte mit <b>[M]</b>: Der <b>blaue Ring</b> ist der Ziel-Orbit –
      deine orange Bahn liegt schief dazu und kreuzt ihn an genau <b>zwei Punkten</b>.`,
     check:(o,F)=>F.map},
    {text:`Die Bahnebene kippen kann man <b>nur an diesen Kreuzungspunkten</b>
      (dort schneiden sich alte und neue Ebene).<br><br>
      Erstelle mit <b>[K]</b> einen Manöverknoten.`,
     check:(o,F)=>!!F.node},
    {text:`Verschiebe jetzt den <b>Zeitpunkt</b> des Knotens (±10s/±60s-Buttons rechts),
      bis der grüne <b>Δv-Marker</b> genau auf einem <b>Kreuzungspunkt</b> von orangener
      Bahn und blauem Ring sitzt.<br><br>
      💡 Von der Seite betrachtet (Kamera ziehen!) siehst du am besten, wo deine Bahn
      die Äquatorebene durchstößt.`,
     check:(o,F)=>F.node && F.nodeRelY!==undefined && Math.abs(F.nodeRelY)<40000},
    {text:`Perfekt platziert! Jetzt der <b>NORMAL-Burn</b> (senkrecht zur Bahnebene):<br><br>
      Klicke im Panel bei <b>Normal</b> auf −10/+10, bis etwa <b>±780 m/s</b> eingestellt
      sind. Beobachte die <b>grüne geplante Bahn</b>: Sie muss sich <b>flach auf den
      blauen Ring</b> legen!<br><br>
      ⚠️ Kippt sie stattdessen noch STEILER, hast du die falsche Richtung erwischt –
      nimm einfach das andere Vorzeichen.`,
     check:(o,F)=>F.node && F.nodePlannedInc!==undefined && F.nodePlannedInc<5},
    {text:`Die grüne Bahn liegt in der Äquatorebene – jetzt fliegen wir sie!<br><br>
      Drücke <b>[T]</b>, bis <b>SAS: Manöverknoten</b> aktiv ist – die Nase dreht sich
      automatisch aufs <b style="color:#ff6ad5">rosa ✛</b> auf dem Navball (dein
      Brennrichtungs-Zeiger).<br><br>
      Warte mit Zeitraffer <b>[.]</b> bis <b>T minus halbe Brenndauer</b> (steht im
      Panel) und gib dann Vollgas <b>[Z]</b> – das Triebwerk stoppt automatisch,
      wenn das Δv verbrannt ist. Bring die <b>Inklination unter 5°</b>!`,
     check:(o,F)=>F.orbitInc()<5 && o.pe>70000 && o.ap>0},
   ],
   done:`📐 BAHNEBENE GEKIPPT – der Ring in der Karte leuchtet GRÜN! 🎉 Merke:
     Inklination ändert man <b>am Kreuzungspunkt der Ebenen</b> mit einem
     <b>Normal-Burn</b> – und das ist teuer (hier ~780 m/s!). Profis starten deshalb
     gleich von der richtigen Rampe: Der Breitengrad des Startplatzes wird zur
     Bahnneigung. In der Karriere warten Orbit-Missionen mit genau solchen Zielringen!`},

  {id:"evatut", icon:"🧑‍🚀", title:"Außeneinsatz (EVA)", sub:"Aussteigen, schweben, sicher zurückkommen.",
   scenario:{stack:["chute","pod","shield","rcs","fin","tankM","engVac"], orbit:{body:"LEIBNIZ", alt:120000}},
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
   scenario:{stack:["dock","pod","rcs","fin","tankS","engT"], nearStation:3000},
   steps:[
    {text:`Vor dir fliegt die Raumstation <b>»Große Pause«</b> – nur 3 km entfernt, im selben
      100-km-Orbit! Rechts im HUD siehst du <b>Abstand</b> und <b>Relativgeschwindigkeit</b>.<br><br>
      Wirf zuerst einen Blick auf die Lage: Öffne die Karte mit <b>[M]</b> –
      die Station ist der hellblaue <b>»Große Pause«</b>-Marker direkt neben dir.`,
     check:(o,F)=>F.map},
    {text:`Schließe die Karte wieder <b>[M]</b>. Auf dem Navball siehst du zwei Marker:
      das <b>türkise ◆</b> (da IST die Station) und das <b style="color:#ff6ad5">rosa ✛</b>
      – deinen <b>Anflug-Assistenten</b>!<br><br>
      Das ✛ zeigt immer die <b>perfekte Brennrichtung</b>: Es lenkt dich zur Station
      UND bremst dich automatisch ab, je näher du kommst.<br><br>
      Also ganz einfach: Nase mit <b>W/A/S/D</b> aufs <b style="color:#ff6ad5">rosa ✛</b>
      drehen und <b>Schub geben</b> (<b>[↑]</b>). Wandert das ✛, folge ihm!
      Ran bis <b>unter 1 km</b>.`,
     check:(o,F)=>!F.map && F.pos.distanceTo(stationPos(F.t))<1000},
    {text:`Unter 1000 m! 🛰 Einfach weiter so:<br><br>
      Nase aufs <b style="color:#ff6ad5">rosa ✛</b> halten und in <b>kurzen Stößen</b>
      schubgeben – das ✛ bremst dich von selbst immer weiter ab
      (schau auf die <b>Relativgeschwindigkeit</b> rechts: sie sinkt mit dem Abstand).<br><br>
      Driftet das ✛ zur Seite, Nase nachführen und wieder kurz brennen.
      Ran bis <b>unter 200 m</b> – ab da hilft dir der Autopilot!`,
     check:(o,F)=>F.docked || F.pos.distanceTo(stationPos(F.t))<200},
    {text:`Unter 200 m! ✨ Jetzt drücke:<br><br>
      <b>[L] – der DOCKING-AUTOPILOT übernimmt!</b><br><br>
      Er regelt den Feinanflug mit den RCS-Düsen und dockt sanft an –
      genau wie bei Crew Dragon in echt. Zurücklehnen und zuschauen! 🤖`,
     check:(o,F)=>F.docked},
   ],
   done:`🔗 ANGEDOCKT AN DER »GROSSEN PAUSE«! 🎉 Du beherrschst jetzt die schwierigste
     Übung der Raumfahrt: das Rendezvous. Genau so entstand die echte ISS – Modul für Modul.
     In der Karriere wartet dafür die Mission "Rendezvous: »Große Pause«" (+55 🧪).
     Abdocken geht übrigens jederzeit mit [L].`},

  {id:"launchwindow", icon:"⏰", title:"Raumstation: Von Start bis Docking", sub:"Startfenster abpassen, Phase angleichen, andocken – die Königsdisziplin.",
   scenario:{stack:["dock","pod","rcs","tankS","tankS","engVac","decoupler","inter","fin","tankL","engMain"]},
   steps:[
    {text:`Diesmal machst du ALLES selbst: von der Rampe bis zur Stationsluke!<br><br>
      Die Station rast mit 2,2 km/s um Leibniz – wer einfach "irgendwann" startet,
      kommt Tausende Kilometer daneben raus. Profis warten aufs <b>Startfenster</b>.<br><br>
      Wähle zuerst das Ziel: Drücke <b>[Z]</b> → 🎯 Raumstation »Große Pause«.`,
     check:(o,F)=>!!F.target},
    {text:`Rechts im HUD steht jetzt die <b>Startfenster-Uhrzeit</b> ⏰ – der Moment,
      in dem die Station ~30° <b>hinter</b> der Rampe steht. Während dein Aufstieg
      läuft, holt sie genau diese 30° auf: Ihr trefft euch oben!<br><br>
      Spule mit <b>[.]</b> vor (mit <b>[,]</b> zurückschalten), bis dort
      <b style="color:#5fc46a">STARTFENSTER OFFEN</b> aufleuchtet.`,
     check:(o,F)=>{ if(!F.target || !F.landed) return false;
       const tw = F.nextLaunchWindow(F.target)-F.t, per = 2*Math.PI/F.target.w;
       return tw<30 || tw>per-15; }},
    {text:`<b style="color:#5fc46a">FENSTER OFFEN – STARTE JETZT!</b> 🚀 [Leertaste]!<br><br>
      Dann wie gewohnt: Bei ~2 km langsam nach <b>OSTEN</b> neigen (das <b>O</b> auf dem
      Navball), Gravity Turn fliegen und die <b>Apoapsis auf ~100 km</b> bringen
      (Karte [M] hilft). Oben angekommen: prograde brennen, bis die
      <b>Periapsis über 70 km</b> steigt.`,
     check:(o,F)=>F.flew && o.alt>69000 && o.pe>68000},
    {text:`Im Orbit! 🛰 Schau rechts auf die <b>💡 Phasen-Tipps</b>: Sie sagen dir, ob die
      Station voraus oder hinter dir fliegt.<br><br>
      Merksatz: <b>NIEDRIGER = schneller, HÖHER = langsamer.</b> Wer hinterherhängt,
      fliegt etwas tiefer und holt auf. Passe deine Bahn an und nähere dich, bis der
      Abstand <b>unter 50 km</b> liegt. (Zeitraffer [.] nutzen!)`,
     check:(o,F)=>F.pos.distanceTo(stationPos(F.t))<50000},
    {text:`Unter 50 km – jetzt erscheinen die Navball-Marker: türkises <b>◆</b> = Station,
      <b style="color:#ff6ad5">rosa ✛</b> = dein Anflug-Assistent!<br><br>
      Feinanflug wie im Rendezvous-Tutorial: Nase aufs <b style="color:#ff6ad5">rosa ✛</b>
      halten und in kurzen Stößen schubgeben – es lenkt UND bremst dich automatisch.
      Ran bis <b>unter 200 m</b>!`,
     check:(o,F)=>F.docked || F.pos.distanceTo(stationPos(F.t))<200},
    {text:`Geschafft – Autopilot-Reichweite! Drücke <b>[L]</b>: Der
      <b>Docking-Autopilot</b> übernimmt den letzten Anflug. 🤖`,
     check:(o,F)=>F.docked},
   ],
   done:`🏆 VON DER RAMPE BIS ZUR LUKE – die komplette Königsdisziplin! Genau so plant
     SpaceX jeden Crew-Dragon-Flug: Startfenster abwarten, Phase angleichen, andocken.
     Übrigens: Auch geparkte Tanker-Starships kannst du auf der Rampe mit [Z] als Ziel
     wählen – so klappt das Auftanken im Orbit beim ersten Anlauf.`},

  {id:"science", icon:"🔬", title:"Wissenschaft sammeln", sub:"Du startest im Orbit mit Labor an Bord.",
   scenario:{stack:["chute","pod","lab","rcs","fin","tankM","engVac"], orbit:{body:"LEIBNIZ", alt:100000}},
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
   scenario:{stack:["chute","pod","rcs","tankM","engVac","decoupler","inter","gridfin","fin","tankL","engMain"]},
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
     parkst du im Orbit und tankst dort wieder auf – so reicht es bis Monti und weiter!`},

  {id:"refuel", icon:"⛽", title:"Starship: Orbital Refueling", sub:"Tanks fast leer? Im Orbit wartet ein Tanker – flieg ran und tanke auf!",
   scenario:{stack:["starship"], tanker:{alt:120000, behind:3000}, fuelFrac:0.15},
   steps:[
    {text:`Dein Starship ist im 120-km-Orbit – aber die Tanks sind <b>fast leer</b>
      (schau auf die Anzeige: nur noch ~15 %!). Für Monti oder weiter reicht das nie.<br><br>
      Die Lösung von SpaceX: <b>Orbital Refueling</b>. 3 km voraus wartet ein geparktes
      <b>Tanker-Starship ⛽</b> – es ist bereits als Ziel markiert.<br><br>
      Wirf einen Blick auf die Karte <b>[M]</b>: Da vorne fliegt es!`,
     check:(o,F)=>F.map},
    {text:`Karte wieder zu <b>[M]</b>. Auf dem Navball siehst du den Anflug-Assistenten:
      das <b style="color:#ff6ad5">rosa ✛</b>.<br><br>
      Wie beim Stations-Rendezvous: <b>Nase mit W/A/S/D aufs ✛ drehen</b> und in
      <b>kurzen Stößen</b> Schub geben <b>[↑]</b> – das ✛ lenkt UND bremst dich
      automatisch ein.<br><br>
      ⚠️ Sparsam brennen, dein Sprit ist knapp! Ran bis <b>unter 500 m</b>.`,
     check:(o,F)=>F.refueled || (F.tutTanker && !F.map && F.pos.distanceTo(F.assetPos(F.tutTanker,F.t))<500)},
    {text:`Unter 500 m! Jetzt der Feinanflug – ganz ruhig:<br><br>
      Nase aufs <b style="color:#ff6ad5">rosa ✛</b>, kleine Schubstöße. Die Betankung
      startet automatisch, sobald du <b>näher als 60 m</b> bist und <b>langsamer als
      4 m/s</b> relativ zum Tanker fliegst – wie zwei aneinanderliegende Schiffe.<br><br>
      Schau auf die Relativgeschwindigkeit rechts und taste dich ran!`,
     check:(o,F)=>F.refueled},
    {text:`⛽ <b>VOLLGETANKT!</b> Alle Tanks wieder auf 100 % – der leere Tanker
      verglüht kontrolliert in der Atmosphäre.<br><br>
      Fühl den Unterschied: Eben warst du gestrandet, jetzt hast du Δv für eine
      <b>Monti-Reise</b> übrig. Brenn zur Feier kurz prograde und hebe deine
      <b>Apoapsis über 300 km</b>!`,
     check:o=>o.ap>300000},
   ],
   done:`🏆 ORBITAL REFUELING GEMEISTERT! Genau so plant SpaceX Mond- und Mars-Flüge:
     Das Starship startet fast leer in den Orbit und wird dort von Tankern aufgefüllt –
     erst dann geht's auf die große Reise. In der Karriere gilt: Tanker-Starship mit [Z]
     auf der Rampe als Ziel wählen, hinfliegen, auftanken (der Tanker wird verbraucht).`}
];
