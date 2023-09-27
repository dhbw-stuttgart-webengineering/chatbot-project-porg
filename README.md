# README.md - Projekt Porg Chatbot

## Übersicht

Projekt Porg Chatbot. Der Chatbot wurde entwickelt, um mit Benutzern zu interagieren und auf ihre Anfragen zu antworten. 
Dieses Dokument bietet eine Übersicht über die Hauptfunktionalitäten und die Verwendung des Codes.

## Funktionen

### 1. Chat-Schnittstelle

- Der Chatbot bietet eine Benutzeroberfläche, über die Benutzer Nachrichten senden können.
- Die Nachrichten werden in einer Chat-History angezeigt.

### 2. Konfiguration und Cookies

- Der Chatbot speichert Benutzereinstellungen wie Jahrgang und Username in Cookies.
- Es gibt die Möglichkeit, die Einstellungen für den Chatbot über ein Einstellungsfenster anzupassen.

### 3. Themenwechsel

- Benutzer können zwischen einem hellen und einem dunklen Thema wechseln.
- Das Chatbot-Design ändert sich entsprechend dem gewählten Thema.

### 4. Spieleintegration

- Der Chatbot ermöglicht es Benutzern, verschiedene Spiele zu spielen, indem sie spezielle Befehle eingeben.
- Es gibt eine Liste von verfügbaren Spielen, die im Code definiert sind und gestartet werden können.

### 5. Nachrichtenverlauf

- Der Chatbot kann Nachrichten aus einer Datenbank abrufen und in der Chat-History anzeigen.
- Die Nachrichten können von einem Benutzer oder vom Chatbot selbst stammen.

### 6. Benutzerinteraktion

- Der Chatbot reagiert auf Benutzereingaben, einschließlich Befehlen und normalen Nachrichten.
- Benutzer können Nachrichten eingeben und Enter drücken, um sie zu senden.

### 7. Fehlerberichterstattung

- Benutzer können Fehler melden, indem sie eine spezielle Option auswählen.
- Der Chatbot sendet dann den Chatverlauf an das Entwicklungsteam zur Überprüfung.

## Verwendung

### Voraussetzungen

- OpenAI API Key
- Pinecone API Key und Index
- Python

### Installation

1. Das Backend deployen: `Auf Zeet deployen`

### Ausführung

1. Die Chatbot-Anwendung auf `main.html` öffnen.

### Anpassung

- Entwickler können den Code anpassen, um neue Funktionen hinzuzufügen oder bestehende Funktionen zu erweitern.
- Die Datenbank mit den UUIDs der Nutzer und deren Chatverlauf wird auch bei Zeet gespeichert. Die Datenbank ist im Repository unter database.db abgespeichert.

## Autoren

- Claudius Laur
- Kagan Demirer
- Niklas Werthmann
- Sohail Ramin


## Dank

- OpenAI
- Pinecone