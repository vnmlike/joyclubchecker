<h1>JCPa Check – Chrome-Erweiterung - von vnmlike</h1>

<p><strong>JCPa Check</strong> ist eine Chrome-Erweiterung von <strong>vnmlike</strong>, 
die automatisch die „Dates &amp; Partys“-Sektion von 
<a href="https://www.joyclub.de/dates_partys/" target="_blank">Joyclub.de</a> überwacht und neue Einträge erkennt. 
Sie benachrichtigt den Nutzer in Echtzeit über neue Events oder Date-Angebote, filtert unerwünschte Nutzer 
und kann die Ergebnisse lokal speichern.</p>

<h2>Version</h2>
<p>Dies ist die <strong>erste Version</strong> der Erweiterung.  
Ich weiß noch nicht genau, welche zusätzlichen Funktionen in Zukunft sinnvoll wären.  
Wer Ideen hat oder die Erweiterung verbessern möchte, kann mir gerne seine Vorschläge mitteilen  
oder direkt eigene Updates einreichen und hier hochladen.</p>

<h2>Voraussetzungen & Funktionsweise</h2>
<ul>
  <li>Man muss <strong>eingeloggt</strong> auf Joyclub.de sein, damit die Erweiterung funktioniert.</li>
  <li>Die Ergebnisse <strong>übernehmen automatisch die Filter</strong>, die man auf Joyclub in der Suche eingestellt hat.<br>
      Beispielsweise:
      <ul>
        <li>100 km oder 150 km Umkreis um den eigenen Standort</li>
        <li>Deutschlandweit, wenn die Suche deutschlandweit eingestellt ist</li>
        <li>Weltweit, falls der Filter entsprechend gesetzt ist</li>
      </ul>
  </li>
  <li>Die Erweiterung zeigt nur Einträge, die man auch manuell sehen würde,  
      überprüft diese aber regelmäßig automatisch und meldet neue Funde.</li>
</ul>

<h2>Funktionen</h2>
<ul>
  <li><strong>Automatische Überwachung</strong><br>
      Durchsucht regelmäßig die Seite nach neuen Events und Dates, ohne dass der Nutzer aktiv werden muss.</li>
  <li><strong>Benachrichtigungen in Echtzeit</strong><br>
      Informiert sofort über neue Einträge per Chrome-Notification.</li>
  <li><strong>Direkte Profil-Links</strong><br>
      Im Popup werden die gefundenen Nutzer als klickbare Links angezeigt.  
      Ein Klick auf den Namen öffnet direkt das entsprechende Profil in einem neuen Tab.</li>
  <li><strong>Banliste zur Filterung</strong><br>
      Nutzer, die in der <code>banlist.txt</code> stehen, werden automatisch ignoriert.</li>
  <li><strong>Speicherung und Export</strong><br>
      Neue Einträge werden im lokalen Speicher gesichert und können als Textdateien heruntergeladen werden.</li>
  <li><strong>Popup mit Eintragsübersicht</strong><br>
      Zeigt die zuletzt gefundenen Einträge an und bietet die Möglichkeit, den Speicher zu leeren.</li>
</ul>

<h2>Erkannte Date-Typen</h2>
<p>Aktuell erkennt die Erweiterung nur folgende Arten von Einträgen:</p>
<ul>
  <li><strong>Date</strong> – Private Verabredungen und persönliche Treffen</li>
  <li><strong>Event-Date</strong> – Veranstaltungen und Partys, die als Date gelistet sind</li>
</ul>
<p>Andere Einträge (z. B. Gruppenaktivitäten ohne diese Kennzeichnung) werden derzeit ignoriert.</p>

<h2>Hinweis zu Interaktionen</h2>
<p>Die Erweiterung ist auf maximale Unauffälligkeit (<em>stealth</em>) ausgelegt.  
Eine direkte Funktion zum Anschreiben von Nutzern könnte leicht von Joyclub erkannt werden,  
daher ist diese Funktion <strong>bewusst nicht integriert</strong>.  
Wer dies ergänzen möchte, sollte sich der Risiken bewusst sein.</p>

<h2>Bekannte Probleme</h2>
<ul>
  <li><strong>Das Tab <a href="https://www.joyclub.de/dates_partys/" target="_blank">https://www.joyclub.de/dates_partys/</a> 
      muss immer offen bleiben</strong>,  
      sonst stoppt die automatische Überwachung.</li>
  <li>Hintergrundmodus ist zwar implementiert, aber Chrome Manifest V3 blockiert dauerhafte Hintergrundprozesse.</li>
  <li>Schließt man alle Browserfenster, werden keine weiteren Scans ausgeführt.</li>
</ul>

<h2>Installation für Neulinge</h2>
<ol>
  <li>Dieses Repository als ZIP-Datei herunterladen und entpacken.</li>
  <li>Google Chrome öffnen und <strong>chrome://extensions</strong> in die Adressleiste eingeben.</li>
  <li>Oben rechts <strong>Entwicklermodus</strong> aktivieren.</li>
  <li>Auf <strong>Entpackte Erweiterung laden</strong> klicken.</li>
  <li>Den Ordner auswählen, in dem sich die entpackten Dateien befinden.</li>
  <li>Die Erweiterung wird nun installiert und ist sofort aktiv.</li>
</ol>

<h2>Aufbau</h2>
<ul>
  <li><code>content.js</code>: Scannt die Webseite nach neuen Einträgen, filtert gebannte Nutzer und meldet Funde an den Hintergrunddienst.</li>
  <li><code>background.js</code>: Speichert Einträge, erstellt Benachrichtigungen und übernimmt den automatischen Export.</li>
  <li><code>popup.html</code> / <code>popup.js</code>: Zeigt eine Übersicht der gefundenen Einträge und erlaubt das Zurücksetzen oder Leeren der Liste.  
      <br>Hier sind die Nutzernamen klickbar und führen direkt zum jeweiligen Profil.</li>
  <li><code>banlist.txt</code>: Enthält eine Liste von Nutzern, die ignoriert werden sollen.</li>
  <li><code>manifest.json</code>: Definiert die Chrome-Extension-Struktur und Berechtigungen.</li>
</ul>

<h2>Vorteile</h2>
<ul>
  <li>Spart Zeit durch vollautomatisches Monitoring.</li>
  <li>Verhindert doppelte Benachrichtigungen dank intelligentem Speicher.</li>
  <li>Ermöglicht gezieltes Filtern von unerwünschten Nutzern.</li>
  <li>Direkte Weiterleitung zu den relevanten Profilen.</li>
  <li>Ergebnisse passen sich automatisch an die eigenen Joyclub-Suchfilter an.</li>
</ul>

<h2>Feedback und Beiträge</h2>
<p>Jede Hilfe ist willkommen!  
Wer Ideen oder Verbesserungsvorschläge hat, kann sie gerne teilen oder das Projekt direkt erweitern und die Änderungen hier hochladen.</p>

<h2>Disclaimer / Haftungsausschluss</h2>
<p>
  Diese Erweiterung ist ein <strong>privates, eigenes Tool</strong> und steht in <strong>keiner Verbindung zu Joyclub</strong>.  
  Alle Namen, Logos und Marken, die eventuell im Zusammenhang mit dieser Erweiterung erscheinen,  
  gehören den jeweiligen Inhabern.
</p>
<p>
  Die Nutzung erfolgt <strong>auf eigene Verantwortung</strong>.  
  Für etwaige Profilsperren, Einschränkungen oder sonstige Konsequenzen  
  durch die Nutzung dieser Erweiterung wird keine Haftung übernommen.
</p>
<p>
  Die Erweiterung dient rein zu Informationszwecken und wird ohne jede Garantie bereitgestellt.
</p>

<p style="margin-top: 20px;"><strong>Erstellt von:</strong> vnmlike</p>
