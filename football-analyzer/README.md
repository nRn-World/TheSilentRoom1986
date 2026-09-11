# ⚽ FotbollsVideoAnalys (FVA)

Analysera fotbollsvideor från **YouTube** (eller lokala filer) och räkna
händelser: **mål, målchanser, domarpip, kort-kandidater, halvtid** – plus
snabb **manuell märkning** av assist, hörnor, tacklingar med mera i ett
interaktivt webbgränssnitt med tidslinje, signalkurvor och export till
CSV/JSON.

```
┌──────────┐   ┌──────────────┐   ┌───────────────────┐   ┌────────────────┐
│ YouTube/ │ → │  🎞 Bildanalys │ → │  🔀 Fusion        │ → │ 📊 Webb­rapport  │
│ lokal fil │   │  🔊 Ljudanalys │   │  händelser + conf │   │ granska & tagga│
└──────────┘   └──────────────┘   └───────────────────┘   └────────────────┘
```

## 🚀 Kom igång

```bash
cd football-analyzer
bash setup.sh                          # skapar .venv och installerar beroenden
.venv/bin/python -m fva serve          # webbgränssnitt på http://localhost:8000
```

I webbgränssnittet: klistra in en YouTube-länk, ladda upp en videofil,
eller klicka på **Exempel** för en syntetisk demomatch med kända händelser.

### Kommandorad

```bash
.venv/bin/python -m fva analyze "https://www.youtube.com/watch?v=VIDEOID"
.venv/bin/python -m fva analyze match.mp4 -o utdata-mapp --fps 2
.venv/bin/python -m fva demo --out samples/demo.mp4   # skapa testvideo
```

`analyze` skriver `report.json` + `report.html` (fristående rapport som kan
delas) och skriver ut en händelselista i terminalen.

## 🧠 Hur detekteringen fungerar

| Signal | Metod | Ger |
|---|---|---|
| 🔊 Ljud | RMS-nivå 2 ggr/s, rullande 1-min-baslinje. Måljour = snabb attack + hög topp (≥12 dB över baslinjen) + långsam avklingning ≥5 s | Mål-kandidater, målchanser, publikreaktioner |
| 🖥 Score-tavla | Hittar den statiga överläggsrutan i bildens övre del (förändringsstatistik per 16 px-celler). Beständiga förändringar upptäcks genom att jämföra medelbilder före/efter – ingen OCR behövs | Målsifferbyten, rött/gult kort (färganalys) |
| 📣 Pip | Energi i 2,2–3,3 kHz som sticker ut ≥9 dB över bredbandet | Domarpip (avspark, foul, hörna, avbrott) |
| 📈 Bild | Grön planmask (HSV) + rörelseenergi per bildruta | Aktivitetskurva, halvtidsdetektering |

**Fusion:** tavlebyte ±35 s kring en målliknande publikrush → **Mål (92 %)**.
Rush utan tavle → "troligt mål" (62 %). Tavlebyte med rött/gult → kort-kandidat.
Halvtid = längsta lågaktivitetsperioden nära videons mitt (bara för videor > 25 min).

### Ärlighet om begränsningar
* **Mål** detekteras bäst när videon har en **score-tavla i bild** och 
  **matchljud** (inte enbart musik/kommentator utan publik).
* **Assist, hörnor och tacklingar** kräver egentligen spelarspårning/djupa
  modeller – de **märker du upp manuellt** med ett klick i gränssnittet medan
  du tittar (allt sparas automatiskt i rapporten).
* Höjdpunktsklipp (5–20 min) ger oftast tydligast signaler; hela 90-minuters-
  matcher fungerar också men tar längre tid (ca 3–8 min analys beroende på dator).

## 🖥 Gränssnittet

* **Statistikkort** – antal per kategori (auto-detekterat vs. ditt antal).
* **Tidslinje/diagram** – ljudnivå, baslinje, planrörelse + händelsemarkörer.
  Klicka i diagrammet för att hoppa i videon.
* **Händelselista** – ändra typ (t.ex. omklassa "publikreaktion" → "målchans"),
  skriv anteckningar, lägg till egna händelser (knappen **＋ Händelse här**
  använder videons aktuella tidpunkt), radera.
* **Export** – CSV och JSON. I webbgränssnittet sparas dina ändringar
  automatiskt på servern (`jobs/<id>/report.json`).

## ⚙️ Finjustering

Alla trösklar ligger i `fva/config.py`, t.ex.:

| Parameter | Standard | Betydelse |
|---|---|---|
| `goal_db` | 12 dB | hur hög rushen måste vara för "målliknande" |
| `goal_min_decay_s` | 5 s | avklingning som krävs (lång = sjungande publik) |
| `bug_roar_window_s` | 35 s | tid mellan tavlebyte och rush för mål-fusion |
| `whistle_ratio_db` | 9 dB | hur tydlig pipsin tonen måste vara |
| `sample_fps` | 2 | bildrutor/s som analyseras (lägre = snabbare) |

## 📁 Struktur

```
football-analyzer/
├── fva/
│   ├── config.py     # alla trösklar och inställningar
│   ├── fftools.py    # ffmpeg-hjälp + demovideo-generator
│   ├── audio.py      # publikrush + pip-detektering
│   ├── vision.py     # plan, rörelse, score-tavla
│   ├── fusion.py     # signaler → händelser + halvleker
│   ├── pipeline.py   # orkestrering
│   ├── report.py     # fristående HTML-rapport
│   ├── webtpl.py     # CSS/JS för webb-UI och rapport
│   └── server.py     # lokal webbserver (stdlib)
├── static/           # genererat gränssnitt
├── samples/          # demovideo (genereras)
├── jobs/             # analysjobb (genereras)
├── requirements.txt
└── setup.sh
```

## ❓ Felsökning

* **"Kunde inte ladda ner YouTube-videon"** – YouTube blockerar ofta
  nedladdning från servrar/datumcenter. Kör programmet på din egen dator,
  eller ladda upp filen i webbgränssnittet.
* **Ingen tavla hittad** – videon saknar score-bug i bild (t.ex. endast
  närbildsklipp). Måldetekteringen faller då tillbaka på enbart ljud.
* **För många falska pip** – höj `whistle_ratio_db` till 11–12.
* **Långsam analys** – sänk `sample_fps` till 1 eller kör `--fps 1`.

## Licens

Samma som repot (MIT).
