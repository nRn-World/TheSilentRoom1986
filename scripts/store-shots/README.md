# store-shots – hur bilderna i `/store` skapas

Bilderna i `store/` är renderade med **satori** (JSX → SVG) och **@resvg/resvg-js**
(SVG → PNG). Ingen webbläsare behövs.

## Filer

| Fil | Gör vad |
| --- | --- |
| `base.cjs` | Typsnitt, `h`/`box`/`T`/`img`-hjälpare, logga, illustration, färgtokens. Läser `public/brand-logo.png`, `art/illustration-4-people.png` och `icons.json` från repot |
| `assets.cjs` | Appens egna SVG-ikoner (från `src/components/PlayfulIcons.tsx`), flaggor, pilar, asterisk |
| `landing.cjs` | Renderar startsidan (hela sidan, sparas som `screen-landing.png`) |
| `screens.cjs` | Renderar de övriga appvyerna: `choices`, `offlineStart`, `offlineStats`, `nearby`, `dashboard`, `leaderboard`, `goals` |
| `compose.cjs` | Sätter en appvy i telefonram på 1080 × 1920 med rubrik, underrubrik och varumärkesbakgrund |
| `make.cjs` | Listan med de åtta skärmbilderna (texter, ordning, accentfärg) |
| `feature.cjs` | Feature graphic 1024 × 500 |
| `icons.json` | SVG för appens ikoner (exporteras med `scripts/export-icons.tsx`) |

## Köra om

Skripten skriver mellanfiler till `/tmp/store` (`STORE_OUT` ändrar det), läser
typsnitt från `/tmp/fonts` (`STORE_FONTS`) och verktygsmoduler (`satori`,
`@resvg/resvg-js`, `pngjs`) från appens `node_modules` eller `/tmp/pw/node_modules`
(`STORE_DEPS`). Inga sökvägar är hårdkodade till en maskin.

```bash
# 1. typsnitt (DM Sans + Outfit som TTF)
npm i --prefix /tmp/pw @fontsource/dm-sans @fontsource/outfit wawoff2 satori @resvg/resvg-js pngjs

# 2. exportera appens ikoner till scripts/store-shots/icons.json
npx tsx scripts/export-icons.tsx

# 3. rendera appvyerna och sedan skärmbilderna
node scripts/store-shots/landing.cjs
for s in choices offlineStart offlineStats nearby dashboard leaderboard goals; do node scripts/store-shots/screens.cjs $s; done
node scripts/store-shots/make.cjs          # alla åtta, eller t.ex. ... make.cjs 03-offline
node scripts/store-shots/feature.cjs
```

`make.cjs` läser appvyerna från `/tmp/store/<namn>.png` (startsidan från
`/tmp/store/screen-landing.png`) och skriver `/tmp/store/01-start.png` osv.
Kopiera de färdiga PNG-filerna till `store/`.

## Bra att veta

- satori ritar bara text som finns i de inlästa typsnitten, och inte symboler som
  `→`, `↗`, `✳` – använd hjälparna i `assets.cjs` (`arrowRight`, `arrowUpRight`,
  `asterisk`, `icon(...)`) i stället.
- Varje `div` med barn måste ha `display: 'flex'`.
- Långa sidor (t.ex. startsidan) klipps till en telefonviewport (390 × 844) av
  `slide()` i `compose.cjs`, precis som på en riktig telefon.
