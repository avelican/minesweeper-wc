# minesweeper-wc

Have you always wanted to sweep mines, but with Web Components?

## Live Demo

https://minesweeper-wc.onrender.com/

## Build

```
npm install
npm run build
```

Note: `tsc -w` should also work after initial setup.

Note: build command copies `tests/test.html` to `dist/index.html`

I liked being able to edit it in the tests folder before. Now you need to run a build step every time. #TODO

## To do:

- [ ] `MineSweeper.render()` is atrocious. I think making a Cell component would clear things up a lot.
- [ ] `MineSweeper`'s `<template>` is currently in `test.html`, which doesn't make sense. I could move it into MineSweeper, but having it in JS seems to defeat the purpose of having a template?
- [ ] Component styles are in`test.html`, which again doesn't seem right. These could be moved to a css file, but the whole point of WebComponents is that things are self-contained. I need to look into styling WebComponents. Examples put a `<style>` node directly in the custom element (with Shadow DOM), is that really the right solution?
- [ ] UX: Red mines being red on win is confusing
- [ ] UX: Apply `.glow` to HighScore when it increases
- [ ] Aesthetics? Not happy with the current layout
- [ ] Shadow DOM? (May be necessary for sane styling)
- [ ] Nicer dev workflow. (See complaint about editing html files in build section)