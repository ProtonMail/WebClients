---
layout: default
title:  "Valentine update: Loading content, drop downs, progress bar and a lot of stuff"
intro:  "New components are here: Loading content, drop downs, progress bar, etc. and a lot of updates for documentation"
date:   2019-02-14 11:37:42 +0100
categories: update
---

<p>V1.3.0 is here, here is the changelog:</p>

## New

- added [loading content](/loading-content/) page/templates (WIP)
- added [drop downs](/drop-down/) (WIP)
- added design for `progress` bar in navigation (remaining size)
- added `information-block` style in [container section](/containers/)
- added aliases for buttons: `pm-button-(primary/link/error/warning/info)`
- added class `.link` (same style as for `a` tag)
- added class `.scroll-if-needed`, to apply `overflow: auto` on an element


## Updated/fixes

- adapted height of buttons/badges/input/table cells (from Keven input)
- updated: default case for `main-area` is without the toolbar, exception is now `main-area--withToolbar`
- increased speed of all animations/transitions
- moved `.rounded` class to global layout
- enhanced [Flexbox documentation section](/flexbox-helpers/) (mention of `flex-item-noshrink`, `flex-item-nogrow` and `flex-self-vcenter` classes)

## Misc

- added meta descriptions and keywords for all pages
- bugfixes: IE11 JS fix (arrow functions are too modern for IE11, f***)
- added another stupid joke on 404 page
- updated license