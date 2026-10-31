# Google Play image material for step.by.step

Finished images to upload in the Google Play Console. Everything is rendered from the app's own views, with the same words, colours and icons. Nothing is invented.

## Screenshots (phone), 1080 × 1920 px, PNG

Upload them in this order. Play allows up to 8 screenshots per device type.

| File | Headline in the image | App view |
| --- | --- | --- |
| `01-start.png` | Walk together. | Landing page: logo, language choice (Swedish, Danish, English), "It starts with one step." and the illustration |
| `02-tva-satt.png` | Choose your way. | The mode choice: 01 Close by and 02 Together live |
| `03-offline.png` | Close together. | The offline mode: steps from the phone health store |
| `04-din-dag.png` | Your steps, your day. | Offline statistics: Today, Week, Month, Year, steps, estimated distance, goal 86% |
| `05-narheten.png` | Who is in? | The group walk close by: code A4F2, 4 of 6 walkers, approving a new walker |
| `06-pepp.png` | Steps and distance. | The live mode: steps, distance, GPS tracking, my groups, leaderboard |
| `07-topplista.png` | The leaderboard. | The group leaderboard with steps, kilometres, crowns and cheer hearts |
| `08-mal.png` | Group goals. | The group card and the group goal (34,813 of 50,000 steps, 70%) |

## Other material

- `09-feature.png`, 1024 × 500 px, the Feature graphic in the Play Console.
- `10-appikon-512.png`, 512 × 512 px, the app icon (the attached logo with the two footprints).

## The star is gold

The app's star (`Star` in `src/components/PlayfulIcons.tsx`) is always gold, `#dda63c`, in the row on the landing page, in the stamp, in the caption, on the mode card and in the footer. The same colour is used in every store image (`scripts/store-shots/`), and the stamp star in `art/illustration-4-people.png` is recoloured to gold so the illustration and the app match.

## The logo is everywhere

The same logo (`public/brand-logo.png`) is used across the app, however you enter it:

| Where | File |
| --- | --- |
| Header on the landing page | `public/brand-logo.png` via `BrandMark` |
| The sign in page (Google and Apple) | the same file |
| The offline mode | the same file |
| The test mode (try the app without an account) | the same file, also in the side menu |
| Browser tab and home screen | `public/favicon-64.png`, `public/icon-192.png`, `public/apple-touch-icon.png` |
| Android icon, also adaptive | `android/app/src/main/res/mipmap-*/ic_launcher*.png` |
| iOS icon | `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` |

The logo is always loaded locally from the app, never from an external server.

## How the images match the app

The images show only features that exist in the app: the offline group walk (no accounts, no GPS, steps shared directly between phones and everything held only in memory) and Together live (active count, steps and distance, never anyone's location). No text about anti cheating or manual entry appears anywhere.

The interface text in these images is English. The app itself ships in Swedish, Danish and English and looks the same in all three.

Colours: background `#fbf9f3` to `#f2eee4`, text `#29283b`, coral `#df7658`, green `#9eb899`. Typefaces: Outfit for headings and DM Sans for body text, the same as in the app.

## Want to change an image?

Every image is vector based from the start (SVG through satori and resvg). The code is in `scripts/store-shots/`, see `scripts/store-shots/README.md`.
