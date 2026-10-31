<div align="center">

<img src="public/brand-logo.png" alt="step.by.step" width="148" />

### Ett steg i taget, tillsammans.

En liten promenad kan förändra en hel dag.<br />
Steg, sträcka, mål och topplista för hela gruppen, utan att någon behöver lämna ut sin position.

<img src="https://img.shields.io/badge/React-19-149ECA?style=flat-square&logo=react&logoColor=white" alt="React 19" />
<img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript 5.8" />
<img src="https://img.shields.io/badge/Vite-6-BD34FE?style=flat-square&logo=vite&logoColor=white" alt="Vite 6" />
<img src="https://img.shields.io/badge/Capacitor-8-53B9FF?style=flat-square&logo=capacitor&logoColor=white" alt="Capacitor 8" />
<img src="https://img.shields.io/badge/Spr%C3%A5k-Svenska%20%7C%20Dansk%20%7C%20English-9eb899?style=flat-square" alt="Språk: svenska, danska, engelska" />
<img src="https://img.shields.io/badge/Licens-Educational%20License-dda63c?style=flat-square" alt="Licens: Educational License" />

</div>

<br />

<table align="center">
<tr>
<td align="center" width="160"><img src="store/01-start.png" alt="Startsidan med språkval" width="150" /><br /><sub><b>Startsidan</b><br />Välj språk direkt</sub></td>
<td align="center" width="160"><img src="store/02-tva-satt.png" alt="Lägesval" width="150" /><br /><sub><b>Två sätt att gå</b><br />Nära eller tillsammans</sub></td>
<td align="center" width="160"><img src="store/05-narheten.png" alt="Gruppromenaden i närheten" width="150" /><br /><sub><b>Närheten</b><br />Grupp utan server</sub></td>
<td align="center" width="160"><img src="store/07-topplista.png" alt="Topplistan" width="150" /><br /><sub><b>Topplistan</b><br />Steg och pepp</sub></td>
<td align="center" width="160"><img src="store/08-mal.png" alt="Gruppens mål" width="150" /><br /><sub><b>Målen</b><br />Dag, vecka, år</sub></td>
</tr>
</table>

<br />

**step.by.step** är en gruppapp för promenader. Gruppen samlas, går var sin väg eller tillsammans, och ser hur det går för alla. Inga e postadresser, inga kartor över personer, ingen poängjakt som kräver att telefonen ligger framme hela dagen.

<div align="center">
<img src="art/illustration-4-people.png" alt="Fyra personer och en hund på promenad" width="720" />
</div>

## Två sätt att gå

| Läge | Vad det är | Vad som delas |
| :--- | :--- | :--- |
| **Vi går nära** <br /> Gruppromenad utan konto | En grupp i närheten går tillsammans. Stegen läses från telefonens eget hälsolager i den installerade appen. Ingen GPS, ingen server, inga konton. | Visningsnamn och stegsumma direkt mellan telefonerna. Grupplistan finns bara i minnet och försvinner när vyn stängs. |
| **Vi går längre** <br /> Tillsammans live | Gruppen är utspridd och alla vill se läget. Visar antal aktiva, steg och sträcka för gruppen. | Antal aktiva personer, steg och uppskattad sträcka. Aldrig namn på kartan, aldrig någons rutt. |

Båda lägena använder samma logga, samma typsnitt, samma färger och samma språkval. Ett smeknamn räcker, ingen e postadress behövs.

## Det här finns i appen

| Funktion | Så fungerar den |
| :--- | :--- |
| **Språk från första sekunden** | Svenska, danska och engelska med flagga och språknamn redan på startsidan. Hela gränssnittet byter språk, även felmeddelanden och sidfot. |
| **Egen logga överallt** | Samma ordmärke i sidhuvudet, i inloggningen, i offline läget, i testläget, som webbläsarikon, som Android ikon och som iOS ikon. |
| **Flera grupper samtidigt** | Skapa hur många grupper du vill, bjud in med länk eller sex tecken kod, och lämna en grupp efter bekräftelse. Sista medlemmen som lämnar tar bort gruppen. |
| **Namn per grupp** | Appen frågar vad du vill bli kallad i just den gruppen, så samma person kan heta olika i olika lag. |
| **Mål för alla perioder** | Dag, vecka, helg, månad och år. Gruppen kan dessutom sätta ett gemensamt mål som alla steg räknas mot. |
| **Topplista per grupp** | Varje grupp har sin egen topplista med steg, kilometer och pepphjärtan. Medaljer och krona delas ut på hela prispallen. |
| **Firande när målet nås** | När ett mål är uppnått spelas en animerad scen som tydligt visar vilket mål gruppen klarade. Egen scen för dag, vecka, helg, månad, år och för det gemensamma målet. |
| **Para ihop två grupper** | Dela en kod eller en länk. Den andra gruppen ser bara gemensamt mål och antal medlemmar, aldrig personliga mål, namn eller steg per person. |
| **Analyskarta** | När två grupper är ihopkopplade visas en animerad karta som rangordnar grupperna för dag, vecka eller månad, med krona på ledaren och en rad som säger hur många steg ni ligger före eller efter. |
| **Smeknamnskonto** | Konto med bara smeknamn, utan e post. Lösenordet sparas som scrypt hash med salt. |
| **Testläge** | **Testa appen utan konto** öppnar skärmarna med exempeldata i ett tydligt märkt testläge. Ingen låtsasinloggning, inga anrop, inget sparas. |
| **Ljust och mörkt** | Två kompletta teman med samma färgskala, plus mobilanpassning ned till 320 px. |

## Integritet

| Fråga | Svar |
| :--- | :--- |
| Delas min position? | Nej. Positionen används bara på telefonen för att räkna ut sträcka. Servern tar emot antal meter och mätkvalitet, och avvisar anrop som innehåller koordinater. |
| Sparas offlinegruppen? | Nej. Namn, steg och topplista lever bara i minnet medan vyn är öppen. |
| Vilka uppgifter finns om mig? | Ett visningsnamn du väljer själv och dina steg. Ingen e post, inget telefonnummer, ingen adress. |
| Kan jag försvinna? | Ja. Lämna gruppen, eller radera kontot, så tas dina uppgifter bort. |

## Så mäts stegen

1. I den installerade appen hämtas steg från telefonens hälsolager, HealthKit på iOS och Health Connect på Android, först efter att du godkänt läsbehörighet.
2. Sträcka räknas som steg gånger 0,75 meter och visas som en uppskattning.
3. I live läget räknar telefonen själv ut sträckan medan sidan är öppen. Dåliga fixar, hopp och orimliga hastigheter filtreras bort innan något skickas.
4. Gruppkortet visar antal promenadaktiviteter från andra medlemmar per dag. Rörelse inom 15 minuter räknas som samma aktivitet, och en aktivitet kräver minst 100 meter accepterad sträcka.
5. Datum och perioder räknas i tidszonen Europe/Stockholm, så veckan börjar på måndag och helgen består av lördag och söndag.

En webbläsare kan inte läsa telefonens steg och kan inte spåra pålitligt i bakgrunden. Därför visar webbversionen ett tydligt besked i stället för påhittade siffror. Riktiga steg och robust mätning kräver den installerade appen.

## Teknik

| Del | Val |
| :--- | :--- |
| Gränssnitt | React 19, TypeScript 5.8, Vite 6, Motion för animationer |
| Typsnitt och färg | Outfit för rubriker, DM Sans för text, allt paketerat lokalt |
| Ikoner och illustration | Egna SVG komponenter, ingen ikonfont och inga externa hämtningar |
| Server | Express med TypeScript, data i `data/steps.json` |
| Mobil | Capacitor 8 för Android och iOS, Health Connect och HealthKit för steg |
| Delning i närheten | Bluetooth Low Energy direkt mellan telefoner, egen tjänst `e672a300-c4be-429e-89ec-df1477a51101` |
| Inloggning | Supabase Auth med Google och Apple, plus smeknamnskonto med scrypt |
| Tester | Vitest med Testing Library, 42 tester i 7 filer |

## Kom igång

```bash
npm install
npm run dev
```

Öppna **http://localhost:3000**. Vite serverar gränssnittet på port 3000 och API:t lyssnar på port 3001.

```bash
npm run build        # produktionsbygge
PORT=3000 npm start  # servera bygget med API:t
npm test             # 42 tester
npm run lint         # typkontroll med tsc
```

För mobil:

```bash
npm run build && npx cap sync
npx cap open android
npx cap open ios
```

Android kräver API 26 eller högre. Health Connect och HealthKit behöver egna behörighetsbeskrivningar och ska provas på fysiska telefoner före publicering.

Statisk hosting, som GitHub Pages, kan inte köra gruppfunktionerna eftersom de behöver API:t och en beständig disk. Servern behöver HTTPS och en domän du kontrollerar.

## API

| Metod | Väg | Gör |
| :--- | :--- | :--- |
| `POST` | `/api/accounts` | Skapar smeknamnskonto |
| `POST` | `/api/accounts/login` | Loggar in med smeknamn och kod |
| `POST` | `/api/groups` | Skapar grupp |
| `POST` | `/api/groups/:id/join` | Går med via kod |
| `POST` | `/api/groups/:id/leave` | Lämnar gruppen |
| `POST` | `/api/track` | Skickar meter och mätkvalitet, aldrig koordinater |
| `POST` | `/api/groups/:id/goals` | Lägger till mål |
| `PATCH` | `/api/groups/:id/goals/:goalId` | Ändrar mål |
| `POST` | `/api/groups/:id/like` | Peppar en medlem |
| `POST` | `/api/groups/:id/pair-code` | Ger gruppens parningskod |
| `GET` | `/api/pair/:code` | Visar vad koden leder till |
| `POST` | `/api/groups/:id/partners` | Kopplar ihop två grupper |
| `GET` | `/api/state` | Hämtar gruppens läge |

## Projektstruktur

```text
step.by.step
├── src
│   ├── App.tsx              gruppvy, topplista, mål och parning
│   ├── ModeGate.tsx         valet mellan de två lägena
│   ├── OfflineGroup.tsx     gruppromenaden i närheten
│   ├── PrivateMode.tsx      offline statistik och hälsodata
│   ├── Celebration.tsx      animerade scener när mål nås
│   ├── components           logga, ikoner, språkval, illustration
│   └── *.test.tsx           tester med Vitest
├── server.ts                API, konton, grupper och mål
├── public                   logga, ikoner och integritetstext
├── art                      illustrationer för webb och butik
├── store                    skärmbilder och material för Google Play
├── scripts                  ikonexport, scenrendering och butiksbilder
├── android                  Capacitorprojekt för Android
└── ios                      Capacitorprojekt för iOS
```

## Bra att veta

1. Gruppdata sparas i `data/steps.json`. Det är inte en produktionsdatabas och saknar backup, gallring och självbetjänad export. Sätt upp en riktig databas före offentlig drift.
2. En klient kan skicka fel metersiffror. Utan ytterligare serverkontroller är siffrorna ett uppskattat mått, inte ett verifierat resultat.
3. Bluetooth mellan iPhone och Android, bakgrundsspårning och hälsobehörigheter måste provas på riktiga telefoner innan lansering.
4. `public/privacypolicy.html` är ett utkast och inte en färdig juridisk integritetstext.
5. Paketidentifieraren i mobilprojekten är tillfällig och ska bytas till en du själv kontrollerar.

## Licens

step.by.step är gratis att ladda ner, använda, ändra och dela för utbildning och annat icke kommersiellt bruk. Du får inte sälja projektet eller tjäna pengar på det, varken direkt eller indirekt.

Vill du använda step.by.step kommersiellt, till exempel i en betalapp, i en verksamhet eller i en tjänst du tar betalt för, krävs en betald licens som du kommer överens om med nrnworld.one via [nrnworld.one](https://nrnworld.one) eller [bynrnworld@gmail.com](mailto:bynrnworld@gmail.com).

Kredit till nrnworld.one krävs alltid, och ändrade versioner ska märkas och behålla samma villkor. Hela licenstexten finns i [LICENSE](LICENSE) och är skriven på engelska. Licensen är källkodstillgänglig men inte en OSI godkänd open source licens, eftersom kommersiellt bruk kräver ett avtal.

```text
step.by.step by nrnworld.one, used for education under the step.by.step Educational License.
https://nrnworld.one
```

<div align="center">
<br />
<sub>Skapad av <a href="https://nrnworld.one">nrnworld.one</a> · <a href="mailto:bynrnworld@gmail.com">bynrnworld@gmail.com</a></sub>
</div>

<details>
<summary><b>In English</b></summary>

<br />

**step.by.step** is a walking app for groups. One step at a time, together.

Two modes. **Close by** is an offline group walk with no account, no GPS and no server: steps come from the phone health store in the native app, and names and step totals travel directly between phones over Bluetooth, held only in memory while the view is open. **Together live** shows how many people are active plus group steps and distance. Positions never leave the device, and the server rejects coordinates.

Groups keep their own leaderboard, their own goals for day, week, weekend, month and year, a shared group goal, animated celebrations when a goal is reached, and an optional pairing with one other group that reveals only the partner group shared goal and member count.

Swedish, Danish and English are chosen on the first screen, with flags. The interface ships its own fonts and icons and never calls an external font service.

Run it with `npm install` and `npm run dev`, then open http://localhost:3000. The API listens on port 3001.

Free for education and other non commercial use. Commercial use requires a paid agreement with nrnworld.one. See [LICENSE](LICENSE) for the full terms, in English.

</details>
