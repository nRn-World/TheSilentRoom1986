# Google Play – bildmaterial för step.by.step

Färdiga bilder att ladda upp i Google Play Console. Allt är renderat från appens
egna vyer (samma texter, samma färger, samma ikoner) – inget är påhittat.

## Skärmbilder (telefon) – 1080 × 1920 px, PNG

Ladda upp i den här ordningen. Play tillåter max 8 skärmbilder per enhetstyp.

| Fil | Rubrik i bilden | Appens vy |
| --- | --- | --- |
| `01-start.png` | Gå tillsammans. | Startsidan: logga, språkval (svenska/danska/engelska), "Det börjar med ett steg." + illustrationen |
| `02-tva-satt.png` | Välj er väg. | Lägesvalet: 01 Vi går nära (offline) och 02 Vi går längre (tillsammans · live) |
| `03-offline.png` | Nära varandra. | Offline-läget: "Nära varandra. Bara här." + steg från telefonens hälsotjänst |
| `04-din-dag.png` | Dina steg, din dag. | Offline-statistik: Idag/Vecka/Månad/År, steg, uppskattad sträcka, mål 86 % |
| `05-narheten.png` | Vem är med? | Gruppromenaden i närheten: kod A4F2, 4/6 deltagare, godkänn ny deltagare |
| `06-pepp.png` | Steg och sträcka. | Live-läget: steg, distans, GPS-spårning, mina grupper, topplista |
| `07-topplista.png` | Topplistan – live. | Topplistan med steg, km, live-markering och pepp-hjärtan |
| `08-mal.png` | Gruppens mål. | Gruppkortet + gruppens mål (34 813 av 50 000 steg, 70 %) |

## Övrigt material

- `09-feature.png` – **1024 × 500 px**, "Feature graphic" i Play Console.
- `10-appikon-512.png` – **512 × 512 px**, appikon (den bifogade loggan med de två fotavtrycken).

## Stjärnan är guld

Appens stjärna (`Star` i `src/components/PlayfulIcons.tsx`) är alltid guld –
`#dda63c` – i startsidans rad, i stämpeln, i bildtexten, på lägeskortet och i
sidfoten. Samma färg används i alla butiksbilder (`scripts/store-shots/`), och
stämpelns stjärna i `art/illustration-4-people.png` är omfärgad till guld så att
illustrationen och appen matchar.

## Loggan finns i alla lägen

Samma logga (`public/brand-logo.png`) används i hela appen, oavsett hur man kommer in:

| Var | Fil |
| --- | --- |
| Startsidans sidhuvud | `public/brand-logo.png` via `BrandMark` |
| Inloggningssidan (Google/Apple) | samma fil |
| Offline-läget | samma fil |
| Testläget ("Testa appen utan konto") | samma fil, även i sidomenyn |
| Webbläsarflik och hemskärm | `public/favicon-64.png`, `public/icon-192.png`, `public/apple-touch-icon.png` |
| Android-ikon (även adaptiv) | `android/app/src/main/res/mipmap-*/ic_launcher*.png` |
| iOS-ikon | `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` |

Loggan hämtas alltid lokalt från appen – aldrig från en extern server.

## Så hänger bilderna ihop med appen

Bilderna visar bara funktioner som faktiskt finns i appen: offline-gruppromenad
(inga konton, ingen GPS, steg delas direkt mellan telefoner och allt finns bara i
minnet) och Tillsammans · live (antal aktiva, steg och sträcka – aldrig någons
position). Ingen text om anti-fusk eller manuell inmatning finns med.

Färger: bakgrund `#fbf9f3`–`#f2eee4`, text `#29283b`, korall `#df7658`, grön
`#9eb899`. Typsnitt: Outfit (rubriker) och DM Sans (brödtext) – samma som i appen.

## Vill du ändra en bild?

Alla bilder är vektorbaserade i grunden (SVG via satori + resvg). Redigeraren
ligger i `scripts/store-shots/` – se `scripts/store-shots/README.md`.
