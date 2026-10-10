# www-tribute: the journey pages

Flow: `/youtube` → (60s) Zoom invite → `/call` → (90s) lag → `/google` → `/google/search` → `/apple` → (30s) screen breaks for 7s → `/` (landing page, made by your duo partner).

## Install
```bash
npm install three
npm install -D @types/three
```
Then unzip into the project root (it only adds new folders, it doesn't touch `app/page.tsx` or `app/layout.tsx`).

## Files
| Route | Entry | Main component |
|---|---|---|
| `/youtube` | `app/youtube/page.tsx` | `components/youtube/YouTubePage.tsx` |
| `/call` | `app/call/page.tsx` | `components/zoom/ZoomCall.tsx` |
| `/google` | `app/google/page.tsx` | `components/google/GoogleHome.tsx` |
| `/google/search` | `app/google/search/page.tsx` | `components/google/GoogleResults.tsx` |
| `/apple` | `app/apple/page.tsx` | `components/apple/ApplePage.tsx` |

All timings, routes and the caller's name are in **`lib/experience.ts`**.

## Things to drop into `/public`
- `models/macbook.glb` — your Meshy laptop (already included). If it faces the wrong way, change `BASE_ROTATION` in `components/apple/LaptopScene.tsx`.
- `videos/call.mp4` — the recorded caller video. **Until it exists, the call runs in placeholder mode** (browser text-to-speech + captions) so you can test the flow now.
- `brand/` — logos exported from your Figma: `youtube-logo.png`, `google-logo.png`, `google-doodle.png`, `apple-logo.svg`, `zoom-logo.png`. Missing files fall back to plain text, so nothing looks broken.
- `sounds/zoom-ring.mp3` (optional) — otherwise a ringtone is synthesised.
- `images/broken-screen.jpg` — your cracked-screen reference, blended into the screen break (included).

## Recording the call video
Open `components/zoom/callScript.ts`. Record one video where the person asks each question, then fill in the `start`/`end` seconds per line:
- After each question with `waitForAnswer: true`, the video pauses and listens to the mic. When the user talks and then goes quiet for ~1.2s, the next question plays.
- `FILLERS` are short reactions ("haha yeah") used after the script runs out.
- `MUTED_SEGMENT` plays if the user is muted while they should answer.
- `LAG_SEGMENT` is the "damn, holy lag, get a new laptop" clip. When it ends, the call ends.
- Optional `LISTENING_LOOP`: ~5s of nodding/smiling that loops (muted) while waiting, so they don't look frozen.
- For testing: Space/Enter counts as "answered".

## Adding YouTube videos
`components/youtube/videos.ts`: give each video a `youtubeId` (plays via the official embed) or a `src` like `/videos/clip.mp4` for your own files. Likes, comments etc. are all editable there.

## Notes
- The mic needs HTTPS or `localhost`.
- Navigation between pages uses client-side routing on purpose: it keeps the browser's "user clicked something" permission, so the call video can play with sound.
