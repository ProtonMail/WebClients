---
layout: default
title:  "v1.8.0 is here: dark mode, tons of new styles/modifiers, calendar, etc."
intro:  "Christmas update: dark mode, tons of new styles/modifiers/helpers, calendar styles, etc."
date:   2019-12-20 11:37:00 +0100
categories: update
---



<p>V1.8.0 is here, here is the changelog since v1.7.0:</p>

## New

### Dark mode

- __Dark mode available in styles!__
- on design system website, the Dark mode will be applied based on your system preferences
- added dark mode friendly aliases for `bg-global-light`, `bg-white`: `bg-global-highlight`, `bg-white-dm`
- added some documentation about CSS custom properties used.


### New components/elements

- `minicalendar` styles
- added `calendar-grid` fragment
- added `atomLoader-text` styles
- added `toolbar-select` styles
- added `navigation__refresh` classes (for mail)
- hover state for conversations
- added new responsive navigation styles
- added FAB styles
- added “field with icon” container styles (`pm-field-icon-container` and `pm-field-icon-container--invalid`)
- added circle bar styles (see in dropdown to see the bigger version)
- added storage dropdown styles
- added plans tables
- updated searchbar styles: if there is no search bar, the next element (navigation) is pushed to the right (VPN/settings/etc.)
- login page in responsive
- new loading images/animations
- custom scrollbar
- added small toggle: add `pm-toggle-label--small` to `pm-toggle-label` and maaaagic
- added class `container-section-sticky-section` to increase margin between sections
- added tabs styles
- added `dashed` and `dashed-container` containers 
- added styles for toolbar elements (and clean up a bit this mess)
- added `$list-max-width-em` feature (needed for composer)


### Icons

- added `lock-alone`, `lock-check`, `lock-warning`, `lock-write`, `pen` icons (for composer) icons
- added `blocked-content`, `payments-type-amex`, `payments-type-cash`, `payments-type-discover`, `payments-type-mastercard`, `payments-type-visa`, `p2p`, `servers-country`, `speed-fast`, `speed-low`, `speed-medium`, `vpn-connx` icons
- added `circle`, `calendar`, `clock` and `target` icons
- added `css-arrow-right` in css svg sprite
- added `blackfriday`, `plus`, `minus`, `selectall` icons
- added `language`, `timezone1`, `timezone2`, `linux`, `windows`, `alias`, `calendar`, `cc`, `check-circle`, `key`, `user-storage` icons 
- added bank icon images (discover/jcb to clean up)

See full list here: [icons](/icons/)


### Colors

- added `$vpnplus` and `$vpnbasic` plan colors
- added `stroke-*` classes (for SVG `stroke` properties)
- added `$pm-primary`, `$pm-primary-light`, `$pm-primary-dark` Sass variables (aliases for main colors)
- added class aliases for primary colors: `color-primary`, `bg-primary`, `fill-primary`, `stroke-primary`
- added `fill-beta` color and styles
- added aliases `pm-button--primaryborder`, `pm-button--primaryborder-dark` (based on `$pm-primary` value)

See updates here: [colors](/colors/)


### New modifiers

- added `pm-modal--full` modifier
- added `pm-form--iconLabels` modifier (for Calendar)
- added `border-top--dashed` modifier
- added `pm-simple-table--alternate-bg-row` modifier to have alternate background colors for rows in a table
- added `.pm-modal--shorterLabels` modifier
- added `pm-simple-table--has-actions` modifier to right-align “action” column (design rule)
- added `onmobile-remain-sticky` modifier for sticky title
- added `pm-button--currentColor` modifier (used in notification area for example)
- added `pm-button--for-smallicon` modifier
- added rem margin-top helper (will enhance it later)
- added modifier `pm-button--whiteborder`
- added `right-icon` helper
- added `pm-button--noborder` modifier


### Helpers

- added `fixed` (`position: fixed`)
- added `onmobile-static` (`position: static` on… mobile!!!)
- added `mw8e` helper
- added `filter-blur` helper
- added `w50p` helper
- added `bg-inherit` helper class
- added `ontablet-flex-column` helper
- added `w95` helper
- added `flex-justify-center` helper
- added `border-currentColor` helper
- added `ellipsis-four-lines` helper
- added `alignsub` helper
- added helper `color-currentColor` (for notification zone)
- added more border and max width options
- added `0.75` margin helpers
- added `flex-item-start` helper
- added `smallest` helper (~9px)
- added `flex-item-noflex` helper (`flex: 0`)
- added `$list-max-width-ch` Sass variable, ex. `.mw70ch`: `max-width: 70ch`
- added `flex-justify-start` helper
- added `onmobile-wauto` and `min-w5e` helper classes
- added `scroll-horizontal-if-needed` for horizontal scrolling
- padding helper with `3`: `pt3`, etc.
- added `h100v` helper
- added `ontablet-mw100` helper
- added `flex-item-fluid-auto` helper: `flex: 1 1 auto`
- added `onmobile-flex-wrap` and `onmobile-min-w100` helpers
- added `rounded0`, `rounded0-left` and `rounded0-right` helpers
- added `flex-justify-end` helper
- added `no-outline` helper (god, please forgive me for having created this)
- added `lh-standard` class (standard `line-height`)
- added `.underline-hover` helper


### Other stuff

- added option on `respond-to` (`$query-type == "height"`)
- added documentation for square container/`ratio-container-*` helpers (padding-hack technique, use it wisely young jedis)
- added documentation for `nodecoration`, `underline` and `underline-hover`
- added `badgeLabel-primary` and set this one by default
- added react dedicated styles (and notes/documentation about them) 
- added `pv-indicator` css file (and notes/documentation about `pv-styles`) 
- added `header-height-anchor` for scrolling issues
- added title style for VPN signup
- add class `mw100` on `navigation` element (fixes ellipsis bug in some cases)
- fixed “button” active state when applied to `div` and triggered by dropdowns inside
- updated logo


## Updated/fixes

- fix selected element in contact
- fix dropdown link display
- hover styles for minicalendar
- a lot of fixes for calendar styles
- fix shorter labels display on mobile
- update tiny-breakpoint value
- fixed selected conversation item
- fix modal display in case of low viewport height
- fix `z-index`es for Calendar
- add `min-width` to `pm-checkbox-fakecheck`
- removed `bg-global-light` class in table examples for `pm-plans-table-row--highlighted` (more darkmode-friendly)
- updated Calendar/Contacts icon
- fixed mini-calendar range display in responsive view
- fixed disabled buttons
- added custom scrollbar in Firefox.
- fixed text cut off in user drop down
- fix `main-area-withToolbar` stuff ^^
- fix `protonmail_quote` styles
- fix `no-result-folder` image (removed artifact)
- added a fix for Angular bug with Safari
- removed “global” hover state for conversations
- updated `protoncalendar`/`protoncontacts` icon
- fixed mini calendar icon color/removed transitions
- fixes for (mini) calendar display
- fix issue with `pm-button--link`
- fix for Safari slow perf (filter CSS)
- fix modal icons
- fix flags
- fix Chrome bug for selects
- fix standard modal width
- added a `max-width` on user drop down display name
- fix path not closed properly in SVG (thanks @johBerlin !)
- fix special case for `block-info`
- fixed conversations and `main-area--withToolbar`
- fixed cursor value for modals (Edge bug)
- fixed header structure of website
- fixed top navigation
- fixed selected conversation state
- fixed settings icon
- fixed toggle margins
- increased width of `pm-label`
- fixed padding of `item-container`/added some flex for proper rendering in conversations
- fixed `line-height` of text in user dropdown
- fixed drop down example on design system website
- splitted `global-structure` into several fragments
- hotfix form error with AngularJS
- fixed special case of long inputs in modal (rich text edition, etc.) using `pm-field-container--full`
- fixed notification display on mobile
- added `compose-fab--inBackground` modifier
- fixed height issues on contact containers (`items-column-list--mobile`, `view-column-detail`)
- fix tooltip background color
- updated `reload` icon
- added a modifier for invalid password container `.password-revealer-container--invalid`
- fixed some bugs with Firefox error zone display
- updated `loadingAnimation-circle--pm-blue` class to `loadingAnimation-circle--pm-primary`
- fixed flicker effect when tapping on modal
- fixed a display bug on Safari for password revealer
- added modifier `pm-field-container--address` (container for address on contacts) 
- fixed vertical centering of logo/added modifier for logo without plan
- fixed password revealer outline issue
- removed outline on `pm-field`s
- removed password revealer code (same behaviour as `pm-field-icon-container`)
- fixed navigation icon hover color (for blue theme)
- fixed color image `upgrade.svg`
- fixed `hover-same-color`/`primary-link` helpers
- fixed `navigation__counterItem` padding 
- updated badges CSS code to better fit to mail constraints
- fixed searchbar layout 
- fixed `height` of `select` (alignment in settings)
- rwd adaptation for sticky title/space between sections
- rwd adaptation of navigation
- added some margin helpers on mobile
- fixed `textarea` with `pristine` class (Firefox bug)
- updated `pm-buttons` (replaced `@extend .nodecoration` to `text-decoration: none`) to fix a crazy bug on Edge 🥴
- update table plan responsive behaviour
- fixed contrasts of placeholder, yeah!
- fixed blurry modals/updated modal positionning/fixed on design system website
- fixed `meter` display on Chrome
- fixed password revealer
- updated `.pm-field-container` with use case of `auto`
- fixed `error-zone` display (with `password-revealer` container and classic `pm-field`)
- fixed drop down logout display
- fixed `pm-toggle` `aria-busy="true"` and `disabled` states
- fixed responsive issues with flex helpers
- increased mobile breakpoint value
- increased `z-index` of notifications, in order for them to be on the top of modals :)
- added styles for “info” notification 
- moved some styles to exceptions (only for Design System)
- fixed `checked` state of `item-icon`
- fixed logout dropdown display
- increased small modal width
- fixed password revealer (added a `background-color`)
- if `searchbox-container` is empty, set up its `width` to 0
- removed `z-index` from active `pm-group-button`
- fixed badge `font-size` to use rem to avoid inheritance on mail
- fixed `padding-right` value on `navigation__link` (alignment with compose button)
- fixed navigation icons/display 
- fixed star button color
- fixed a bug for `caption` tag on Firefox
- removed responsive adaptation for top navigation (might add it only for Mail or project that do really need it)
- fixed issue in `pm-simple-table--has-actions`
- fixed some RTL stuff
- fixed password revealer
- fixed active state for error/warning button aliases
- update `disabled` state for buttons
- added `max-width` to modals and fixed !*%*!!$* safari mobile bugs 
- remove `settings` icons in left sidebar
- fixed Chrome bug with `.spacebar` (autoprefixer issue)
- updated DropDown react styles
- added disabled state for toolbar button
- added alias `question` for `what-is-it` icon (to merge)
- added example of image in conversations
- fixed `.cut` class for Chrome
- added `cursor-row-resize` helper
- added `1.25` value to `padding` helpers
- updated top nav design
- add state `disabled` to `pm-button--link`
- documentation for absolute/relative helpers + `opacity` helpers
- fixed `alignright` helper of `th` element
- added `max-width` to sidebar (equiv 220px max)
- fixed `background-color` of search field
- updated logout dropdown layout (with caret icon on hover, etc.)
- added exception on `main-area` with `no-scroll`


## Misc

- added placeholder images (no result)
- added svg illustrations
- hamburger color (god what did I mean by writing this????)
- added flags files in `assets/img/shared/flags`
- has to change CSP policies on this website (Firefox, when do you will fix this CSP bug for CSS in SVG images?)
- wish you a merry Christmas and hug you, because you’ve read this long changelog ❄️🎄🎁 