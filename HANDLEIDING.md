# Vogels App - Gebruikershandleiding

Welkom bij de Vogels App! Dit is een applicatie voor het beheren van vogelgegevens, koppels en stambomen. Deze handleiding helpt je door alle functies van de app.

---

## 📋 Inhoudsopgave

1. [App Starten](#app-starten)
2. [Hoofdinterface](#hoofdinterface)
3. [Het Tabblad Vogels](#het-tabblad-vogels)
4. [Het Tabblad Koppels](#het-tabblad-koppels)
5. [Het Tabblad Stamboom](#het-tabblad-stamboom)
6. [Gegevensopslag](#gegevensopslag)
7. [Tips & Trucs](#tips--trucs)

---

## App Starten

### Op Mac
Double-click op het bestand `Start-Webapp-mac.command` in de hoofdmap van de app.

### Op Windows
Double-click op het bestand `Start-Webapp.bat` in de hoofdmap van de app.

De app opent automatisch in je standaardbrowser op `http://localhost:5173`.

---

## Hoofdinterface

De app heeft drie hoofdtabbladen bovenaan:

- **Vogels** - Individuele vogels toevoegen en beheren
- **Koppels** - Vogelkoppels en hun nakomelingen beheren
- **Stamboom** - Genealogie en stambomen visualiseren

Onderaan zie je de **Statusbalk** met informatie over je gegevens.

---

## Het Tabblad Vogels

### Vogel Toevoegen

1. Klik op de knop **"Nieuwe Vogel"** aan de linkerkant
2. Vul het formulier in met de volgende gegevens:

#### Verplichte velden:
- **Stamnummer**: Uniek identificatienummer voor de vogel
- **Geslacht**: Mannetje (♂) of Vrouwtje (♀)

#### Optionele velden:
- **Ringnummer**: Identificatie ring op de poot
- **Ringmaat**: Grootte van de ring (bijv. 2.5mm, 3mm)
- **Mutatie**: Kleur- of tekenmuutatie (vul uit voorgedefinieerde lijst)
- **Gezoomd**: Of de vogel gezoomd is
- **Factor**: Genetische factor
- **Split**: Split-informatie (kan meerdere waarden hebben)
- **Status**: Huidige status van de vogel (actief, verkocht, etc.)
- **Herkomst**: Waar de vogel vandaan komt
- **Kooi**: Kooilocatie
- **Kweekjaar**: Het jaar waarin de vogel gefokt is

### Vogel Bewerken

1. Zoek de vogel in de lijst links
2. Klik op de vogel om deze te selecteren
3. Bewerk de velden in het formulier
4. Klik **"Opslaan"** om de wijzigingen op te slaan

### Vogel Verwijderen

1. Selecteer de vogel
2. Klik **"Verwijderen"** in het formulier
3. Bevestig het verwijderen

### Zoeken en Filteren

- Typ in het zoekbalk bovenaan voor snelle zoekresultaten
- De lijst filtert automatisch op alle vogelgegevens

### Afdrukken

- Klik **"Vogels afdrukken"** om een overzicht van alle vogels af te drukken
- Klik **"Exporteer PDF"** om een PDF-bestand te maken van het overzicht

---

## Het Tabblad Koppels

### Koppel Aanmaken

1. Klik op **"Nieuw Koppel"** aan de linkerkant
2. Selecteer in het formulier:
   - **Vader**: Mannetje (uit je vogellijst)
   - **Moeder**: Vrouwtje (uit je vogellijst)
3. Klik **"Opslaan"** om het koppel te registreren

### Nakomelingen Toevoegen

1. Selecteer het koppel uit de lijst
2. In het paneel **"Nakomelingen"** onderaan:
   - Selecteer een vogel uit de keuzelijst
   - Klik **"Nageslacht toevoegen"**
3. De vogel wordt nu gekoppeld aan dit koppel

### Nakomelingen Verwijderen

1. In het paneel **"Nakomelingen"**:
   - Klik op de rode **X** knop naast de vogel die je wilt verwijderen

### Koppelgegevens Bekijken

Het paneel **"Vogeloverzicht"** toont:
- Foto of afbeelding van de vogel (indien beschikbaar)
- Alle gegevens van vader en moeder
- Volledige nakomelingenlijst

### Voortplantingskaarten

- Selecteer meerdere koppels door checkboxes aan te vinken
- Klik **"Voortplantingskaarten afdrukken"** om kaarten voor alle geselecteerde koppels af te drukken
- Dit is handig voor het bijhouden van fokgegevens

### Afdrukken & Exporteren

- **"Dit koppel afdrukken"**: Print de huidige koppelgegevens
- **"Exporteer PDF"**: Maak een PDF van het koppel

---

## Het Tabblad Stamboom

### Stamboom Visualiseren

1. Selecteer een vogel uit het invoerveld
2. Kies een weergavetype:
   - **Voorouders**: Toont alle ouders, grootouders, etc. van de vogel
   - **Nakomelingen**: Toont alle kinderen, kleinkinderen, etc. van de vogel
   - **Volledige stamboom**: Toont alles: voorouders EN nakomelingen

### De Stamboom Gebruiken

- **Klik op een naam**: Vouwt de tak in of uit
- **Navigeer**: Gebruik de scrollbalk om door grotere stambomen te navigeren
- **Afdrukken**: Klik **"Afdrukken"** om de stamboom af te drukken
- **PDF exporteren**: Klik **"Exporteer PDF"** voor een PDF-bestand

---

## Gegevensopslag

### Automatisch Opslaan

Alle gegevens worden automatisch opgeslagen in de volgende JSON-bestanden:

- `vogels.json` - Alle vogelgegevens
- `koppels.json` - Alle koppelgegevens
- `mutaties.json`, `factor.json`, etc. - Referentiedata

### Handmatig Opslaan

Gegevens worden realtime opgeslagen. Je hoeft niet handmatig te bewaren.

### Back-up Maken

Voor veiligheid is het verstandig regelmatig een back-up te maken van:
- `vogels.json`
- `koppels.json`

Kopieër deze bestanden naar een backup-locatie.

---

## Tips & Trucs

### ✨ Efficiënt Werken

1. **Stamnummers**: Gebruik een consistent systeem (bijv. 2024-001, 2024-002)
2. **Ringnummers**: Deze helpen vogels in het echt te identificeren
3. **Status**: Houd statussen up-to-date zodat je weet welke vogels actief zijn
4. **Mutaties**: Registreer mutaties nauwkeurig voor fokdoeleinden

### 🔍 Zoektips

- Zoek op Stamnummer, Ringnummer, of Geslacht
- Gebruik de volle naam of gedeeltelijke namen
- De zoekfunctie is real-time

### 📊 Stamboom Analyse

- Controleer verwantschappen voordat je koppels aanmaakt
- Gebruik het **Volledige stamboom** tabblad om genetische lijnen te volgen
- Print stambomen voor dossiers

### 🖨️ Afdrukken

- **Voor papieren dossiers**: Gebruik "Afdrukken"
- **Voor digitale archivering**: Gebruik "Exporteer PDF"
- PDF's kunnen gemakkelijk gemaild of gearchiveerd worden

### ⚠️ Voorkomen van Fouten

- **Controleer Stamnummers**: Zorg dat ze uniek zijn
- **Controleer Geslacht**: Dit is belangrijk voor koppels
- **Test eerst**: Voeg enkele testgegevens toe voordat je grote hoeveelheden invoert

---

## Veelgestelde Vragen (FAQ)

**Q: Kan ik vogels uit een oud systeem importeren?**  
A: Momenteel moet dit handmatig gebeuren via het formulier. Neem contact op als je hulp nodig hebt met bulk-import.

**Q: Kan ik mijn gegevens exporteren naar Excel?**  
A: De gegevens zijn opgeslagen in JSON-bestanden. Je kunt deze openen in Excel via "Open > Als tekst".

**Q: Wat gebeurt er als ik de browser sluit?**  
A: Je gegevens zijn veilig opgeslagen. Ze zijn beschikbaar zodra je de app opnieuw start.

**Q: Kan ik meerdere apparaten gebruiken?**  
A: Zolang je dezelfde gegevensbestanden gebruikt, ja. Zorg ervoor dat je back-ups maakt om conflicten te voorkomen.

---

## Ondersteuning

Voor vragen of problemen:
- Controleer de `todo.txt` voor geplande verbeteringen
- Bekijk de logbestanden voor technische fouten
- Maak regelmatig back-ups van je gegevens

Veel plezier met het beheren van je vogels! 🐦

