# DRMD video guides

Videos that show how to work with the Digital Reference Material Document (DRMD), step by step.

**Website:** <https://punitharumilli.github.io/DRMD_Videos/>

---

## Videos

| Video | Length | Link |
|---|---|---|
| How to use the DRMD AI Generator | 12:32 | <https://punitharumilli.github.io/DRMD_Videos/?v=drmd-ai-generator> |

Each video has chapters and a transcript, and can be downloaded as an MP4 file.

---

## Player

The player is part of this site and works without external services: no tracking, no advertising and no cookies. It offers:

- play and pause, back and forward 10 seconds
- a seek bar with chapter marks that shows the time and chapter under the mouse
- sound on and off, and a volume slider
- playback speed from 0.75× to 2×
- picture-in-picture, which plays the video in a small window while you work in another program
- full screen
- a chapter list that shows the current chapter and starts any chapter with one click
- resuming where you stopped, and links that start at a given time, for example `?v=drmd-ai-generator&t=88`
- keyboard shortcuts, listed on the page

The player works in current versions of Chrome, Edge, Firefox and Safari. If the player script cannot run, the browser's own video controls are used instead.

---

## Adding a video

1. Create a folder for the video under `videos/`, for example `videos/drmd-schema/`.
2. Put the MP4 file and a poster picture (`poster.jpg`, 16:9) into the folder. A WebVTT file for the transcript or for captions is optional.
3. Open `videos.js`, copy the existing entry, add it to the list and change the values: title, description, file, poster, length, size and chapters. The fields are explained at the top of the file.
4. Push the change. The workflow publishes the site again within about a minute.

As soon as there is more than one video, an "All videos" list appears below the player. Each video can be opened directly with `?v=` followed by its `id`.

A video file must be smaller than 100 MB to be stored on GitHub. For screen recordings, H.264 at about 250 to 500 kbit/s keeps a 15-minute video well below that.

Videos, posters and transcripts must be stored in this repository. For security, the page only loads files from this site (see the security policy at the top of `index.html`), so a video hosted elsewhere is not played; link to it instead.

---

## Contents of this repository

```
index.html                     the page
videos.js                      the list of videos
assets/
├── site.css                   layout and colours
├── player.js                  the video player
├── bam-logo.png, drmd-logo.png, favicon-32.png, favicon-64.png, apple-touch-icon.png
└── fonts/                     Inter typeface (WOFF2) and its licence
videos/
└── drmd-ai-generator/         video, poster picture and transcript
.github/workflows/pages.yml    publishes the site on GitHub Pages
```

---

## Publishing

The site is published with GitHub Actions.

1. In the repository, open **Settings → Pages** and set **Source** to **GitHub Actions**.
2. Push a change on the `main` branch. The workflow publishes it within about a minute.

A publication can also be started by hand: **Actions → Publish on GitHub Pages → Run workflow**.

GitHub Pages allows about 100 GB of traffic per month, which is roughly 3,000 complete views of a 30 MB video. If the videos are watched much more often, a video archive such as the TIB AV-Portal (with DOI and long-term preservation) can host them, and this site can link to it.

---

## Licences

- **Inter** typeface: SIL Open Font License 1.1, see `assets/fonts/LICENSE.txt`.
- The **BAM** name and logo belong to the Bundesanstalt für Materialforschung und -prüfung (BAM).

---

## Contact

drmd@bam.de

© 2026 [Bundesanstalt für Materialforschung und -prüfung (BAM)](https://bam.de/en/)
