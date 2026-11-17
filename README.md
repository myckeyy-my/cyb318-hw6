# cyb318-hw6

Apex Rush — F1 Arcade Qualifying. A browser racing game for CYB318.

The playable build is static HTML, CSS, and JavaScript. Track shape data lives in `data/tracks.json`. There is no Python in this project.

## Run locally

ES modules do not load from a `file://` page. Serve this folder over HTTP, then open the URL the server prints.

From this folder, with Node installed:

```
npx --yes serve .
```

Cursor's Live Server extension works as well. Open `index.html` through that server.

## What is playable

The current prototype includes the square test circuit, arcade car physics, a rotating camera, trackside runoff, outer barriers, corner kerbs, static-obstacle collisions, and a five-attempt qualifying session. The player car uses `elements/car.png`; its four wheel sprites are separated at runtime so the front wheels steer with the keyboard. The lap timer starts and stops on forward start/finish crossings; collisions and all-four-wheel track-limit violations invalidate an active lap. Driving with any wheel on runoff adds drag and reduces acceleration. Kerbs are treated as part of the track for limits and retain normal handling. Track configuration can override the default runoff and barrier dimensions; the other circuits, championship progression, and menu flow are not built yet.

## Controls

- Left Arrow — steer left
- Right Arrow — steer right
- Space — accelerate
- D — brake
- R — restart the qualifying session
