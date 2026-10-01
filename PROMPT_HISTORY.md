# Prompt-History

Die Nutzer-Prompts (verbatim, inkl. Tippfehler), die diese App erzeugt haben, in
Reihenfolge. Jeweils mit einer Zeile zum Ergebnis. Erstellt mit Claude Code.

1. **"baue mir bittte eine jtl app und registriere sie. die app soll für kunden anzeigen wie gross das risiko ist. risko ist abhängig von retouren? wie ist seine bestellhistorie? kannst du daraus algorytmisch ableiten wie warscheinlich eine retoure ist? verschiedene bestelladressen ist auch ein risikofaktor"**
   Erklärbares Retouren-Risiko-Modell (Retourenquote, Bestellhistorie, Lieferadressen, Bestellwert) + erste lauffähige UI.

2. **"hast du die app schon registriert?"**
   Nein, zu dem Zeitpunkt nur das Registrierungs-Artefakt vorbereitet.

3. **"nutze die cli bitte"**
   Zuerst falsche Spur (internes zitadel-terraform), danach korrigiert.

4. **"schau in die jtl docs"**
   Hinweis, die offizielle JTL Developer Documentation zu nutzen.

5. **"ich habe gerade den jtl docs mcp hinzugefügt"**
   Über den jtl-docs MCP erkannt: "JTL app" = JTL Cloud App aus dem Template `@jtl-software/create-cloud-app`, Registrierung per CLI ins Partner Portal. Komplett auf diesen Weg umgebaut: Template gescaffoldet, Risiko-Feature integriert, `app.json` konfiguriert.

6. **"die app läuft auf einem belegten port. ändere bitte auf einen freien"**
   Frontend-Port 3004 → 4310, konsistent in `vite.config.ts` und `app.json`.

7. **"ich sehe nur eine weisse seite"**
   Ursache: Root-URL lief ins leere Login-Gate. Standalone-Root zeigt jetzt einen Hinweis statt weiß.

8. **"schon registriert?"**
   Ja, aus einem früheren `npm run register`. Secret-Datei zusätzlich per `.gitignore` geschützt.

9. **"kannst du mir den prompt zur installation geben?"**
   Installations-Prompt bereitgestellt.

10. **"ja bitte. und ich meine die installation im hub, so wie in den jtl docs beschrieben"**
    Hub-Installationsschritte aus den Docs; Zusage, das Panel auf echte Wawi-GraphQL-Daten umzustellen.
    Rückfragen beantwortet: Retouren-Quelle = **nur verfügbare Faktoren** (keine Retouren-Query in der Cloud-API), Scaffold **jetzt bauen**.

11. **"keine mock daten"**
    Mock-Daten entfernt. Datenquelle komplett auf Live-GraphQL (`graphqlSource.ts`): Übersicht gruppiert `QuerySalesOrders` nach Kunde, Panel lädt den ausgewählten Kunden.

12. **"der hub install link bitte"**
    Hub-Link-Muster und Einstieg geliefert.

13. **"registriere die app bitte"**
    Bestehende App über den Token-Cache aktualisiert (Tenant `hackmamba`, App `005a7bac-...`), kein Duplikat, Client-Secret unverändert.

14. **"läuft die app noch?"**
    Ja: Frontend :4310 und Backend :3005 antworten.

15. **"commit the prompt history with the project itself. also add a readme with an explanation of the app, and if we have it, screenshots"**
    Diese Datei, die README und der Screenshot, committet mit dem Projekt.
