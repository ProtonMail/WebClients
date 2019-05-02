---
layout: default
title:  "v1.6.0 is here: theming, prefers-reduced-motion, drop downs, details/summary, etc."
intro:  "A lot of updates/features/new components: theming, CSS custom properties, prefers-reduced-motion, drop downs, interface elements styles, conversations, icons, etc. "
date:   2019-05-02 9:35:00 +0100
categories: update
---

<p>V1.6.0 is here, here is the changelog since v1.5.0:</p>

## New

### Themes

- added CSS custom properties
- added generation of static CSS files for themes surcharge
- added previsualisation in Design system website: [Themes](/themes/)
- added documentation for all of these: [CSS Custom properties](/sass-variables/#css-custom-properties/)
- and added Sass files/flat CSS files in repo

Basically, these CSS custom properties are a way to abstract the color/properties set, in order to simplify/harmonize theming of interface. This can be extended in a near future.

### New features

- add `prefers-reduced-motion: reduce` MQ (for vestibular disorder)
- added pagination/button drop down: [Drop downs](/drop-down/)
- top search bar styles
- top navigation styles
- add `details`/`summary` styles: [Containers](/containers/)
- styles for conversations (WIP): [Conversations](/conversations/)
- add example of settings layout: [Settings](/settings/)
- plan under logo
- rewamped color pages: [Colors](/colors/)

### New helpers/modifiers

- added class `.increase-surface-click` class (needed for pagination drop down, and could be used for other cases, to increase tap zone)
- add `rotateX-180` helper
- add class `w0` (`width: 0`)
- add `scroll-smooth-touch` class
- add `h100` class

See them in [Helpers](/helpers/).

### Forms

- added `pm-field--tiny` modifier
- add warning styles for input (contrast to enhance)
- add error styles (using `aria-invalid="true"` and CSS transforms)
- add `aria-busy="true"` state to toggle

See them in [Forms](/forms/).

### Others

- add a [DO/DON’T](/dos-dont/)
- add color rules
- put variables in `design-system-config`
- added documentation page on Sass variables


## Updated/fixes

### Buttons/forms

- fix mismatch for `pm-button--link` when used with `pm-button`
- fixed documentation in group buttons
- set up max width for input/select/textarea
- fix select text overflow
- fix `pm-label` alignment
- updated `ng-valid` to `is-valid` (byebye Angular)
- added modifier `.pm-button--for-icon` (for group button made of icons)

### Layout/helpers

- fixed layout of top nav
- add `flex-item-grow-2` item.
- update badge height (Chrome bug)
- fix topnav “shrink” icons in rwd
- fix sticky subnav
- conversation row class
- reordered padding/margin helpers
- fixed color wrong values
- add missing color in icons
- fixed sidebar display
- remove `progress` tag to `meter` (for space used)
- added `white` classes (`fill-white` & `bg-white`)
- added `opacity-50` class (= `opacity: .5`)
- doc for `flex-nowrap` class

### RTL

- fixed RTL for top search and navigation
- fixed logo plan with RTL

### Sass/CSS

- fixed a minification issue with `::placeholder` for `searchbox-container` styles
- splitted/cleanup some SCSS files
- splitted main template in several files for Design System website
- update documentation page on Sass variables
- add missing `!default` to some variables

### Other fixes

- updated reference for CSS icons `css-caret-close`
- add missing CSS fragment in “how to use the design system”.
- fix print version
- fixed a display bug in code sections with Prism
- fixed a display bug in conversations
- “caret” has a single “r”.
- add `shape-burger` icon (for design system website)

## Misc

- remove IE11 support for space bar (fuck off inline-styles 🎉 )
- removed 'unsafe-inline' for CSS for design system website 🎉
- we’re back to 100% at Dareboost tests 🎉🎉