# step.by.step

En lekfull gruppapp för promenader: välj ett visningsnamn per grupp (minst tre tecken), skapa flera grupper eller anslut via inbjudningslänk, välj gruppmål redan när gruppen skapas och följ en topplista som uppdateras var tionde sekund. Alla grupper som användaren är med i visas i en tydlig gruppöversikt. Medlemmar kan lämna en grupp efter bekräftelse och ansluta igen via länk; om skaparen lämnar övergår ansvaret till nästa medlem, och om den sista medlemmen lämnar tas gruppen bort. Skaparen kan lägga till/ta bort mål för dag, vecka, helg, månad och år, samt ta bort och spärra befintliga deltagaridentiteter. Deltagare kan ge varandra hjärtan för dagens resultat. Skaparen kan även para ihop den egna gruppen med andra lag via en kod på sex tecken: då syns endast gruppernas gemensamma mål och antal medlemmar, aldrig personliga mål, namn eller steg per person, och kopplingen kan tas bort när som helst. Sektionen har en animerad analyskarta som rangordnar de ihopkopplade grupperna för dag, vecka eller månad, med krona och försprång för den som leder och en rad som säger hur många steg ni ligger före eller efter. Svenska, danska och engelska samt ljust/mörkt tema finns i gränssnittet.

## Licens

step.by.step är gratis att ladda ner, använda, ändra och dela för utbildning och annat icke kommersiellt bruk. Du får inte sälja projektet eller tjäna pengar på det, varken direkt eller indirekt. Vill du använda det kommersiellt, till exempel i en betalapp, i en verksamhet eller i en tjänst du tar betalt för, krävs en betald licens som du kommer överens om med nrnworld.one via [nrnworld.one](https://nrnworld.one) eller bynrnworld@gmail.com. Kredit till nrnworld.one krävs alltid, och ändrade versioner ska märkas och behålla samma villkor.

Hela licenstexten finns i [LICENSE](LICENSE) och är skriven på engelska. Licensen är källkodstillgänglig men inte en OSI godkänd open source licens, eftersom kommersiellt bruk kräver ett avtal.

## Köra lokalt

```bash
npm install
npm run dev
```

Öppna http://localhost:3000. Vite kör på port 3000 och Node-API:t på port 3001. För produktion: `npm run build && PORT=3000 npm start` på en server med beständig disk, HTTPS och en betrodd domän. Serverns data sparas i `data/steps.json` (ignoreras av Git). **Statisk hosting som GitHub Pages kan inte köra gruppfunktionerna.**

## Så fungerar mätningen

- När användaren aktiverar GPS används `watchPosition` automatiskt medan sidan är öppen. Servern uppskattar steg från accepterad GPS-sträcka med 0,75 m per steg. Dåliga GPS-fixar, hopp och orimliga hastigheter filtreras bort. Ingen manuell steg-inmatning eller redigering finns.
- Gruppkortet visar antal GPS-baserade promenadaktiviteter från **andra medlemmar** per dag under den senaste veckan. Rörelse inom 15 minuter hör till samma aktivitet; en aktivitet räknas först vid minst 100 meter accepterad sträcka. Äldre stegdata från innan denna funktion infördes räknas inte om till aktiviteter.
- Webbläsar-GPS kan inte mäta faktiska fotsteg eller fortsätta spåra tillförlitligt i bakgrunden. Klienten kan manipuleras; detta är **inte** ett verifierat, fuskfritt aktivitetsmått. För riktiga sensordata och robust verifiering behövs en native-app med telefonens hälso-API och ytterligare serverkontroller.
- Positionskoordinater lämnar aldrig telefonen: klienten räknar ut sträckan själv och skickar bara antal meter och mätnoggrannhet, och `/api/track` avvisar anrop som innehåller `lat`/`lon`. Andra medlemmar ser aldrig position eller rutt. Serverns datumindelning använder Europe/Stockholm.
- Utan inloggning identifieras varje person av en slumpmässig token sparad lokalt i webbläsaren. Gruppskaparen har administrationsrätt genom sin token. En spärr hindrar **samma identitet** från att återansluta, men kan kringgås genom ny webbläsarprofil eller rensad lagring. Länken är en inbjudningsnyckel: den som får länken kan ansluta. Använd inte detta som säker identitetskontroll.

## Mobil kontroll

Gränssnittet är kontrollerat för 320, 360 och 390 px bredd. Texternas bredd är mätt med appens egna typsnitt (DM Sans och Outfit) mot de ytor de faktiskt har, och följande gäller:

- Rubrikens accentryck (`ett steg.`, `ét skridt.`, `one step.`) krymper med `clamp(40px, 11.5vw, 74px)` så att det aldrig klipps på 320 px.
- Stegsiffror i statistikrutorna visas med enheten på egen rad under 540 px, så sexsiffriga tal inte trycker ut `steg`.
- Fält är minst 16 px på pekskärm, annars zoomar iOS hela sidan vid fokus.
- Tryckytor är minst 42 px (ikonknappar, hjärtan, stäng-kryss, språkväljare).
- `viewport-fit=cover` och `env(safe-area-inset-*)` håller innehåll borta från notch och hemindikator; höjder använder `100dvh`.
- Sidomenyn kan scrollas, så alla grupper går att nå även på en liten telefon.
- Alla texter i sidfoten visas även i mobil (tre staplade rader).
- Sidhuvudets tagline (”En bättre bit på vägen.”), undertiteln vid lägesvalet och medlemmarnas kilometer i topplistan visas också på mobil – taglinen som egen rad under loggan, kilometern som en liten rad under varje toppliste­rad i stället för att gömas.
- Endast rent dekorativa element göms under 540 px (toppfältets dubblerade avatar-knapp).

En riktig webbläsare fanns inte i byggmiljön, så kontrollen är gjord med typsnittsmätning på riktiga glyfbredder plus genomläsning av varje mediequery – inte med skärmdumpar. Ta en sista titt på en fysisk iPhone och Android-telefon före lansering.

## Två användarlägen (under utveckling)

En ny användare väljer först mellan **Offline · utan GPS** (”Vi går nära”) och **Tillsammans · live** (”Vi går längre”).

- **Ihopkopplade team:** `POST /api/groups/:id/pair-code` ger gruppens kod, `POST /api/groups/:id/partners` med `{code}` kopplar ihop två grupper och `DELETE /api/groups/:id/partners/:partnerId` tar bort kopplingen. Bara skaparen får koppla, högst fem grupper per grupp, och svaret innehåller endast motpartens namn, medlemsantal och gemensamma mål.
- **Offline · utan GPS:** Ingen inloggning, GPS eller API-anrop. Den installerade iOS-/Android-appen läser enbart aggregerade steg från HealthKit/Health Connect efter tillstånd. Steg × 0,75 m visas som uppskattad sträcka. Mål och mätvärden hålls endast i minnet tills vyn stängs; befintliga steg ligger kvar i telefonens hälsolagring och administreras där. En vanlig webbläsare kan inte läsa dessa steg, så den visar ett tydligt meddelande i stället för påhittade värden. En liten grupp i närheten (upp till sex personer) kan dela namn och stegsummor **direkt via Bluetooth**, utan server eller GPS. Värden blir synliga först när värden godkänner deltagare; grupplistan och namnen hålls bara i minnet och försvinner när vyn stängs. Håll appen öppen och var inom Bluetooth-räckvidd. Detta är inte molnsynk och fungerar inte för grupper på distans.
- **Tillsammans · live:** Google/Apple-inloggning via Supabase Auth när projektets nycklar och OAuth-leverantörer konfigurerats. API:t verifierar JWT hos Supabase på varje anrop. GPS-positioner används för distansberäkningen **på enheten**; endast antal meter och mätkvalitet skickas. Servern accepterar inte koordinater, rensar gamla `lastFix`-positioner vid uppstart och visar antal medlemmar med godkänd rörelse under de senaste 90 sekunderna. Övriga medlemmar ser aldrig position eller rutt. Vyn uppdateras för närvarande var 10:e sekund medan den är öppen, inte med kontinuerlig bakgrundsspårning. Distansbaserade steg är uppskattade, inte uppmätta fotsteg.

**Viktigt inför produktion:** Gruppdata lagras fortfarande i serverns `data/steps.json`. Den är inte en produktionsdatabas och har ingen säker backup, gallring eller självbetjänad radering/export. Supabase används för inloggning, **inte** för gruppdatalagring. Gamla anonyma API-identiteter hålls tillgängliga för befintliga testgrupper; stäng det äldre API-flödet inför offentlig drift. En klient kan manipulera metersiffror; uppgifter kan inte säkerhetsverifieras utan ytterligare kontroller. Nuvarande implementation ska inte beskrivas som färdig GDPR-granskad tjänst.

### Konfigurera OAuth

1. Skapa ett Supabase-projekt och konfigurera **Google** och **Apple** som OAuth-leverantörer i Auth. Behöriga redirect-URL:er är webbappens HTTPS-URL och `app.stegvis.mobile://auth/callback` för den installerade appen. Apple kräver egen Apple Developer-konfiguration.
2. Ange variablerna från `.env.example` i din driftmiljö (utan att checka in verkliga nycklar). `VITE_*` byggs in i klienten: endast publicerbar/anon-nyckel får användas där. Både app och server måste peka på samma Supabase-projekt. Konfigurera serverns `APP_ORIGINS` och en publik HTTPS-adress för det native API:t.
3. Utan denna konfiguration syns valen Google/Apple men är avaktiverade med en förklaring. De är **inte** ersatta med låtsasinloggning.

### Prova appen utan konto

Längst ner på inloggningssidan finns **Testa appen utan konto**. Den öppnar de uppkopplade skärmarna med exempeldata i ett tydligt märkt testläge (`TESTLÄGE · Ingen inloggning`), så att appen kan provas innan OAuth är konfigurerat. Testläget skickar inga förfrågningar, kräver inget konto, rensar eventuell gammal token och försvinner när du klickar **Avsluta test** eller stänger fliken. Det är alltså varken inloggning eller låtsasinloggning – bara en förhandsvisning av gränssnittet.

### Mobilbygge

`npm run build && npx cap sync` kopierar webbappen till `android/` och `ios/`. Bygg Android i Android Studio eller iOS i Xcode med egna signeringsidentiteter. Ingen signerad mobilapp har byggts eller testats på fysisk telefon i denna miljö. Verifiera HealthKit-entitlement, Health Connect-behörighet, OAuth-returlänkar, platsbehörighet och bakgrundsbeteende på riktiga enheter före publicering. Native appens paketidentifierare är tills vidare `app.stegvis.mobile` och måste bytas till ett du kontrollerar. `android/variables.gradle` kräver minst API 26. Begränsa hälsoåtkomst till läsning av steg; andra tillstånd från det generella pluginet tas bort i huvudmanifestet.

Typsnitten levereras från appen själv; privat läge gör inga fontförfrågningar till Google. Android Health Connect kan begränsa historiken till cirka 30 dagar; appen märker då månad/år som tillgänglig historik och ska inte uppfattas som en fullständig årsrapport. `public/privacypolicy.html` är **ett utkast**, inte en färdig juridisk integritetspolicy.

### Offline-grupper och integritet

Den som startar promenaden annonserar en tillfällig kod med Bluetooth. Andra telefoner upptäcker koden, skickar sitt valda visningsnamn och antal steg direkt till värdens telefon, och läser en tillfällig topplista först efter godkännande. Ingen plats eller rutt delas. Ingen gruppdata skrivs till server, lokal lagring eller en databas. Telefonens hälsotjänst sparar fortfarande sina egna stegdata. **Visningsnamn i stället för identitet:** appen frågar aldrig efter riktiga namn, e-post eller personnummer och föreslår ett påhittat namn. Den som ändå skriver sitt riktiga namn gör det själv, men det innebär inte att ansvaret försvinner – step.by.step är fortfarande personuppgiftsansvarig och det kan inte avtalas bort i en apptext. Därför är designen dataminimerad: pseudonymt visningsnamn, frivillig grupp, inget krav på identitet, och rekommendationen att inte skriva känsliga uppgifter. Namn och steg som andra kan se är personuppgifter om personerna går att identifiera, även utan serverlagring. Bluetooth-stöd/behörigheter och kompatibilitet mellan iPhone och Android måste provas på riktiga telefoner före lansering. På äldre Android kan operativsystemet kräva platsbehörighet för att *upptäcka Bluetooth-enheter*, trots att appen inte läser någon GPS-position i offline-läget. Läs och godkänn endast de behörigheter som behövs. Språk (svenska, danska, engelska) väljs på första sidan med flagga och namn; privat läge sparar inte valet.
