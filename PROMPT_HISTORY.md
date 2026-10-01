# Prompt-History

Die Nutzer-Prompts (verbatim, inkl. Tippfehler), die diese App erzeugt haben, in
Reihenfolge, jeweils mit einer kurzen, nicht-sensiblen Zusammenfassung der Antwort.
Ohne Zugangsdaten, IDs, Links oder Verweise auf andere Projekte. Erstellt mit Claude Code.

---

**1. Prompt:** "baue mir bittte eine jtl app und registriere sie. die app soll für kunden anzeigen wie gross das risiko ist. risko ist abhängig von retouren? wie ist seine bestellhistorie? kannst du daraus algorytmisch ableiten wie warscheinlich eine retoure ist? verschiedene bestelladressen ist auch ein risikofaktor"

**Antwort:** Ein erklärbares Retouren-Risiko-Modell entworfen (gewichtete Faktoren: Retourenquote, betroffene Bestellungen, Lieferadressen, Bestellhistorie, Bestellwert) und eine erste lauffähige UI gebaut.

---

**2. Prompt:** "hast du die app schon registriert?"

**Antwort:** Nein. Zu dem Zeitpunkt war nur das Registrierungs-Artefakt vorbereitet.

---

**3. Prompt:** "nutze die cli bitte"

**Antwort:** Zunächst ein falscher, interner Registrierungsweg eingeschlagen und später korrigiert.

---

**4. Prompt:** "schau in die jtl docs"

**Antwort:** Auf die offizielle JTL Developer Documentation umgeschwenkt.

---

**5. Prompt:** "ich habe gerade den jtl docs mcp hinzugefügt"

**Antwort:** Über die Docs erkannt, dass "JTL app" eine JTL Cloud App aus dem offiziellen Template ist, registriert per CLI ins Partner Portal. Komplett darauf umgebaut: Template gescaffoldet, Risiko-Feature integriert, App-Manifest konfiguriert.

---

**6. Prompt:** "die app läuft auf einem belegten port. ändere bitte auf einen freien"

**Antwort:** Frontend auf einen freien Port umgestellt, konsistent in Konfiguration und Manifest.

---

**7. Prompt:** "ich sehe nur eine weisse seite"

**Antwort:** Ursache war die Root-URL im leeren Login-Zustand. Standalone zeigt jetzt einen Hinweis statt einer weißen Seite; die Risiko-Ansichten laden im Cloud ERP.

---

**8. Prompt:** "schon registriert?"

**Antwort:** Ja, aus einem früheren Registrierungslauf. Zusätzlich die lokale Zugangsdaten-Datei per .gitignore geschützt.

---

**9. Prompt:** "kannst du mir den prompt zur installation geben?"

**Antwort:** Einen Installations-Prompt bereitgestellt.

---

**10. Prompt:** "ja bitte. und ich meine die installation im hub, so wie in den jtl docs beschrieben"

**Antwort:** Hub-Installationsschritte aus den Docs zusammengefasst. Befund: Die Cloud-GraphQL-API hat keine allgemeine Retouren-Abfrage. Nach Rückfrage entschieden: nur verfügbare Faktoren bewerten und den GraphQL-Datenpfad jetzt bauen.

---

**11. Prompt:** "keine mock daten"

**Antwort:** Alle Mock-Daten entfernt. Datenquelle vollständig auf Live-GraphQL umgestellt (Übersicht gruppiert Bestellungen nach Kunde, Panel lädt den ausgewählten Kunden). Ohne Retouren-Faktoren, Gewichte renormalisiert.

---

**12. Prompt:** "der hub install link bitte"

**Antwort:** Den Einstieg in den Hub und das Link-Muster erklärt.

---

**13. Prompt:** "registriere die app bitte"

**Antwort:** Die bestehende Registrierung über den vorhandenen Login-Cache aktualisiert (neues Manifest: Port, Scopes), kein Duplikat, Zugangsdaten unverändert.

---

**14. Prompt:** "läuft die app noch?"

**Antwort:** Ja, Frontend und Backend antworten lokal.

---

**15. Prompt:** "commit the prompt history with the project itself. also add a readme with an explanation of the app, and if we have it, screenshots"

**Antwort:** README mit Erklärung und Screenshot, die Prompt-History und das Bild zum Projekt committet.

---

**16. Prompt:** "commit prompts and non-sensitive summaries from your responses. no secrets, no other repos or other references"

**Antwort:** Diese Datei um nicht-sensible Antwort-Zusammenfassungen erweitert und von Zugangsdaten, IDs, Links und Projektverweisen bereinigt.
