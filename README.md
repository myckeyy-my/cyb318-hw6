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

Day 1 prototype: the square test circuit, arcade car physics, a rotating camera, and wall collision. Qualifying, the other two circuits, and the menu flow are not built yet.

## Controls

- Left Arrow — steer left
- Right Arrow — steer right
- Space — accelerate
- D — brake
