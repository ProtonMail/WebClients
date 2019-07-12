---
layout: default
title:  "v1.7.0 is here: wizard, progress, meters, notifications, etc."
intro:  "Tons of updates for this summer release: new helpers, new components, new icons, etc. "
date:   2019-07-12 9:35:00 +0100
categories: update
---



<p>V1.7.0 is here, here is the changelog since v1.6.0:</p>

## New

### New components/elements

- `toolbar-separator` styles + `toolbar` design details
- added `progress` styles for exporting contacts: [export contacts](/loading-content/)
- added Logout dropdown :)
- added `meter` bars styles for settings: [bars](/settings/)
- wizard component: [wizard](/containers/#wizard)
- manage a list of [notifications](/notifications/)
- added password revealer in [forms](/forms/)

### Icons

- added `android`, `apple`, `facebook`, `github`, `instagram`, `linkedin`, `mastodon`, `reddit`, `youtube` (updated `twitter` one): [icons](/icons/)
- added `icon-w40p` size
- added design for checkbox for “select all”
- added icon `shape-contract-window` (for composer)
- added `fill-currentColor` class for SVG
- fix icon positionning in aside bar
- added icon `shape-lock`

### Helpers

- added `w15` width helper
- added `break` helper
- added `no-pointer-events-children` helper
- added `rotateZ-90` and `rotateZ-270` helpers
- added helper `flex-row`
- added helper `underline`
- added cursor helper classes
- added `alignbaseline` helper class
- added helpers `opacity-30`, `lh100`, `bordered` container
- add `capitalize` helper
- added `no-pointer-events` helper class
- added `border-bottom` helper class
- added `block-info-success`/`block-info-standard-success` in containers
- add `shadow-container` class
- add `650` value to `$list-max-width`
- added flexbox helper `flex-items-center`


### Animations

Updated/standardized animations and classnames:

- update notifications/modals after discussion with @mmso
- documentated in namespacing classes
- added mention of modifier convention
- documented modal modifier `pm-modal--inBackground` and animation names for modals

### Modals

- added scroll inside modal
- centering checked
- added shadows in case of long content
- added anim out
- cleanup, positionning, RTL tests, comments

### Other stuff

- added `dropDown-content--wide` modifier (super large drop down, for advanced search)
- added Sass variables for `max-width` in percentages
- added modifier `pm-modal--wider` for… wider modals.
- added `border-bottom--dashed` modifier
- commented some stuff (`q` styles)
- updated “How to use the Design system” (new partials)
- added `--width-sidebar`, `--width-subnav` and `--body-fontsize` CSS variables
- added `pm-field--highlight` modifier
- added state class `is-disabled` for buttons
- increased tooltips width
- sticky header for settings (using `.sticky-title` class, and `sticky-title--onTop` modifier to remove `box-shadow` at the top, has to be managed via JS)
- added container `container-section-sticky` class for pages using sticky header (for each section)
- also added modifier `container-section-sticky--fullwidth` modifier class to remove `max-width` if needed.
- updated smooth scrolling feature on Design System website (used https://github.com/zengabor/zenscroll)



## Updated/fixes

- removed `padding-left/right` for `pm-button--link`
- fixed `dropDown-item` border display
- add exception for `pm-button` with `p0` (needed for dropdowns)
- remove `margin` for `item-icon` (more reusable), replaced by a helper (`mr1-5`)
- fixed some button designs for more stability for hover states
- fixed notification container positionning
- updated top nav responsive behaviour for better matching v4’s one.
- removed `.toolbar svg` for `.toolbar-icon` selector (limit depth of applicability for styles, always)
- update selector for modal button display
- fixed `pm-label` to accept `auto` helper (`width: auto`)
- updated reset for `progress`
- added Sass variable for `meter` tag (space bar)
- vertical alignment for checkboxes and radios
- fix for logout dropdown (if there is only one letter inside)
- exception for applying `pt0` to `pm-label`
- updated `hr` color
- updated `flex-items-end` helper and added example (renamed it, was `flex-item-end`, not consistent)
- fixed color of ProtonMail version text
- fixed navigation padding (added partial `exceptions` ONLY for Design System website)
- fixed logout expand on Design system website
- updated drop downs (`max-height` limit, plus shadows/etc.)
- updated classnames for conversation lists (for `item-`, more generic, as it is used in contacts)
- fixed `viewbox` for some icons/simplified documentation
- renamed some classes for CSS multicolumns (consistency)
- renamed some Sass variables for better consistency
- added documentation about width helpers
- fixed big screen adaptation
- updated fake checkbox in conversations (WIP)
- reseted `figure` default browsers styles
- update modal positionning (WIP for Safari bugs)
- updated `pm-label` class (set up to `width` to avoid bad alignments and add `padding` to the right)
- removed decoration from `pm-buttons` (except for `.pm-button--link`)
- added examples of vertical centering in forms
- fixed bug on button group with 2 buttons `last/first-of-type`
- revamped drop down code (removed class, simplified, choosed classname more generic)
- also moved button classes to drop down and generalised `focus-within` 
- added group button example with colors
- fixed color management for caret
- updated leftArrow/rightArrow to modifier classes
- added modifier `wizard-container--noTextDisplayed` for wizard (hides the current step)
- fixed button--link modifier (background transparent
- documentation for drop down in button groups
- add `block-info-standard-warning` class
- fix `aligncenter` helper on `th`
- update reduce motion MQ (compatibility with `animationEnd` listener)
- set search image as content image
- removed CSS variable for it
- fix RTL adaptation
- updated blue and light theme
- updated theme config
- updated documentation
- update theme scss files for WebPack.
- fix documentation of Sass partials


## Misc

- added subsections for containers and helpers pages
- enhanced responsive of Design System website
- missing scroll in conversations on Design System website
- add SVG illustrations
- wish you a nice summer because you’ve read this long changelog ☀️🏄😎