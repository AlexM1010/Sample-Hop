# Website and desktop source sync

The landing page is `index.html`. The original Freesound library is preserved
at `explore.html`; `producer_graph.py` now rebuilds that file, so it cannot
overwrite the showcase.

## Shared source

`scripts/build_preview.py --desktop ../desktop` embeds the desktop repository's
`viewer.html` directly. No separately maintained web viewer exists. The public
300-sound demo payload and CC0 MP3 previews live in `demo/`; `demo/adapter.js`
connects the showcase buttons to the viewer. The builder adds one small event
hook for opening Kit without first selecting a sound. Product behavior stays
in desktop source. The app icon, favicon and Signalsmith Stretch JS/WASM engine
are copied from that same checkout, so branding and pitch tools stay in sync too.
`demo/source.json` records the exact source commit and hash.

To preview locally, run the builder, then `python -m http.server 8973` from this
repository and open `http://127.0.0.1:8973/`.

## GitHub pipeline

`Desktop preview and Pages` checks out this repository and the desktop repo's
current default branch. It rebuilds the viewer, checks all public paths and
audio files, parses the viewer scripts, and runs browser smoke checks for boot,
search, layouts, Kit, pads and three screen widths. Only then does it package
and deploy GitHub Pages. The old deployment stays live if checks fail.

Runs occur on website pushes to `main`, PRs (validation only), manual dispatch,
`desktop-viewer-updated` repository dispatches, and hourly at minute 17. GitHub
scheduled runs can be delayed. Because the desktop repository is private,
add `DESKTOP_SOURCE_TOKEN` to the website repository's Actions secrets: a
fine-grained token limited to `visualise-music-desktop` with **Contents: read**.
Without the secret, builds validate and publish the committed demo preview.
Automatic updates from private desktop source require the secret; missing access
is reported in the workflow so a manual website publication can still succeed.
The checkout never persists the credential. Pages must use **GitHub Actions** as its source
(already configured on this repository).

For immediate desktop-triggered rebuilds, the desktop workflow
`.github/workflows/website-preview.yml` sends the dispatch after viewer/version
changes on `master` or a published release. Optional setup: add a fine-grained
token as the desktop repository's `SITE_DISPATCH_TOKEN`, scoped to the website
repository with Contents: write (GitHub's repository-dispatch requirement).
Without it, the desktop workflow reports the hourly fallback and succeeds.
No token is exposed to website code or the deployed artifact.

The website always builds the desktop default branch, ignoring untrusted
dispatch refs. Deployable releases should update that branch. A viewer contract
change fails the build explicitly instead of shipping an empty preview.

## Data and boundaries

Demo metadata comes from the app's bundled demo pack v2. Audio was transcoded
to 128 kbps MP3 for broad browser playback; originals and analysis are not
modified. Creator credits are in `demo/CREDITS.md`. IBM Plex's font licence is
in `assets/OFL.txt`.

Browser features use the viewer's existing fallbacks. Native folder analysis,
new model inference, filesystem watching, native DAW dragging and Ableton Link
require the desktop app. New inference is not simulated. A future demo pack
change can replace the payload and audio without porting the viewer.

The artifact contains only HTML, public assets and the demo. Harvest caches,
local scripts, desktop checkouts, credentials and analysis databases are never
included. The demo has a stable library ID for browser-local saved state.
