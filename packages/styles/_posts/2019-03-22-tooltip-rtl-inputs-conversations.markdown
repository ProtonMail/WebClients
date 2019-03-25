---
layout: default
title:  "v1.5.0 is here: tooltips, RTL documentation, input styles, etc."
intro:  "New components are here: Tooltips, RTL documentation, input styles, conversations, icons, etc. "
date:   2019-03-25 18:35:00 +0100
categories: update
---

<p>V1.5.0 is here, here is the changelog:</p>

## New

- detect scroll on main navigation/display gradient
- add `disabled` style for toggle
- add `indeterminate` style for checkbox
- added carret icon
- Tooltips styles
- RTL documentation: design system more RTL-friendly 
- added class `.mirror` in `sprite-for-css-only.svg` and in `_design-system-layout-modules.scss`
- conversation styles (WIP)
- added new images useful in settings (in `assets/img/pm-images`)
- added disabled styles for `radio`/`checkbox`
- added new color on `block-info-standard`: `block-info-standard-error`
- added ProtonMail icon with “native” viewbox of 16×16
- added class `dash2x` to make path bigger on SVGs
- added class `rounded50` (`border-radius: 50%`)
- added examples of integration in icons
- added one DO/DONT


## Updated/fixes

- Update button aliases to modifiers.
- Update toggle component, also fixed it in RTL version
- Missing paths `$path-images` in `_pm-loadingcontent.scss`
- added example/fix on icons in `button`/`a`.
- removed duplicate SVG icon
- moved some classes that are specific to design system website
- indentation fixes
- used relative path for images (for webpack)
- added documentation for variables
- added missing `!default` on variables of the design system
- updated `styles-pm` comments and “how to use design system” for variables
- indentation fixes


## Misc

- Fixed CSP issue on SVG sprite for CSS (Firefox... you really start to stress me up!)