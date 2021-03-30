# [2.0.0] - 2020-xx-xx

## New

### Brand new 🎉

- calendar invitation styles
- shortcuts helpers
- storyBook styles
- refactor all design system arbo ^^
- refactor numerous namespaces ^^
- new input fields!
- new buttons API!
- new toggle!
- new themes coming soon
- new `modal--tiny` modifier for Signup
- add table new style `alternate-table-bg-row-rounded`
- styles for new phone input
- styles for theming/new taxonomy 
- email items styling update - remove CSS SVG sprite

### New helpers

- added `z-index`, `min-w7e`, `onmobile-min-h0`, `mr-2e`, `flex-flex-items-center`, `w3e` helpers
- added `tv`, `broken-link`, `keyboard`, `netshield`, `nologs`, `world`, `sort`, `parent-folder-filled`, `folder-filled`, `exclamation-circle-filled`, `stop` icons
- added `pm-field-icon-container-empty` class (to avoid layout shift for Drive)
- added `bg-global-muted-dm-on-hover` class
- added `on-mobile-center` helper
- added `on-hover-opacity-100` and `opacity-65` helpers
- added negative margin helpers: `mt-0-5` and `mb-0-5`
- added `on-tinymobile-p(l/r/b/t)0`, `on-tinymobile-w100` `on-tinymobile-text-left` helpers

## Updated/fixes

- fix variable override
- fix `mirror` helper
- fix vocalisation of toggle
- fix minicalendar range border radius
- fix focus style for radio/checkboxes in dark mode
- hotfix for Drive - `icon-110p`
- fix failing specificity for Drive
- extract `item-icon` for Calendar
- hotfix - back to mailbox button in Dark mode
- change `is-thin` meterbar class
- fixes for new select
- add sizing values
- updated logos
- hotfixed `text-capitalize` helper
- udpated `hover-same-color` to work with `color-currentColor`
- fixed tab header layout 
- added `remote-content` icons
- fixed `select` with centered content for Chrome
- fix toggle for VPN

### Misc 

- fix SVGO temporary issue

# [1.8.6] - 2020-12-18

## New

### Brand new 🎉

- added Android CSS reset
- added `pm-editableSection` fragment (Mail autoreply & filters)
- Bf stuff
- added `pm-select`
- limit nested blockquote to 5 levels
- Feat - attachment preview rework

### New helpers

- added new typographic helper `strike`
- added `onmobile-list-1column` helpers and made `list-2columns` more flexible (accepts any child type now)
- added `borderColor-primary` helper
- added `sticky-top` and `sticky-bottom` helpers
- added `hyphens` helper (only hyphenation, no `word-break`)
- added `bg-global-muted-dm` (dark-mode-friendly alias of `bg-global-muted`) + custom prop
- added `onmobile-no-border` helper
- added inline-grid helper

### Misc

- added `--width-conversation-column` CSS custom property
- added Gmail and Yahoo logos
- added some images for Import
- added new icons `globe`, `caret-double-left`, `tour`, `outbox`, `scheduled-box`, `attention-circle`, `chrome`, `calendar-today`


## Updated/fixes

- fixed overflow for `select`s in Safari 🤪
- fixed padding around `.appsDropdown-button` to make it square
- events participants in the calendar event popover
- fixed text cut off in navigation
- fix for Firefox strange behaviour around `input checkboxes`
- updated height of row view in compact mode
- fix hover over area around item in compact mode
- added white border to qr codes for dark mode
- fixed warning badge - contrast color issue
- added `pm-button--primaryborderEvenInDarkMode`: a `pm-button--primaryborder` that stays the same even on Dark mode
- fixed display on Design system website
- fixed double border for quotes
- display of past unanswered events in month view
- update list view and message view layouts
- changed event popover sizes
- added a testcase for `optgroup`s
- fixed attachment icon in dark mode
- hotfixed `pm-field--tiny`, `pm-field--small`, `pm-field--large`/textarea and account fields that were broken
- fixed icon list to make it more maintanable
- added icon size of `60`
- fixed template to get rid of `vh`, thanks Safari
- debug flags
- factorised some mixins
- added `max-width` values
- fixed `eventpopover` `z-index`
- cleaned up CSS custom props references
- fixed account display
- remove mime icons sprite because they aren’t used
- Hotfix - loading state of conversations
- fixed display on website (modal page was broken)


# [1.8.5] - 2020-09-30

## New

### Brand new 🎉

- new label stack component/rework transitions
- add helper in `LabelStack` to remove max width
- new overview page design  🎉
- new event styles for Calendar
- added SSO login styles + multi-account support

### New helpers

- added `ellipsis-two-lines` helper
- added `semibold` helper
- added `tiny-shadow-container` helper, made it dark mode friendly
- added `button-showOnHover` and `.button-showOnHover-element` helper (to display something when hovering a parent)
- added `flex-flex-children` helper
- added `bottom` and `centered-absolute-horizontal` helpers
- added `min-h5e`, `w11e` helpers

### New fixes/reset

- tiny reset for `mark` tag
- fix meterBar component background color in dark mode
- fix links default underline style
- improve buttons loading state
- hover effect for conversation row
- added `.pm-button--pill` modifier
- fix - `table` reset for Mail - added a Sass variable to trigger it or not (Mail is the special case, newsletter compatibility ftw)
- remove italic for placeholders text in fields

### Misc

- documentation for responsive helpers, 2-columns list and sizing helpers
- add “broken file” image
- add “TOR”, “P2P”, `empty-folder`, `proton-account`, `contact-full` icons 


## Updated/bugfixes

### Safari 🤪

- fix Safari dumb and 💩 behaviour (scrolling caused by `sr-only` 🤪 🤪 🤪 )
- fix Safari 💩 and crazy behaviour on `main-area--noHeader`
- fix Safari bug on modal footers

### Others

- fix - cursor on scroll track in Chrome with textarea
- revamped a bit `pm-field--linkSelect` stuff
- fix `item-weight` display in row mode
- fix - notifications display on mobile
- fix autogrid margin behaviour on mobile
- fix - delete action in dropdown should be red - added modifier for it
- remove duplicate code
- fix - firefox multi-selection of emails
- fix - attachment icon display
- update - documentation for label stack component
- update conversation display
- update appsDropdown sizing way and values
- updated tooltip fragment to allow creating colored tooltips easily
- fixed `pm-button--small` loading state
- fixed fields with text positionned above (@protonmail.com)
- fix several regressions: overflow on some fields (`field-icon-container`), composer, etc.
- fix display of attachment size
- improve button backgrounds management to avoid conflicts between states
- Drive - move the fab a little higher when the transfer manager is there
- added new type of media-query to `respond-to` mixin
- cursor pointer on select fields
- add `onmobile-w33` helper and fixed `onmobile-aligncenter` for some `th`


# [1.8.4] - 2020-07-28

## New

- list MIME icons
- add `swipe`, `pause`, `resume`, `question-nocircle` icons
- added helper `onmobile-flex-self-start` and `onmobile-p0-5/pl0-5/pt0-5/etc.` stuff
- new app switcher!
- new tab switcher component
- global structure change (for banners)
- added new minor breakpoint (medium-landscape, ~1100, will be documented soon)
- add Sass variable for default height fields
- added “initial hover over circle” styles (Mail)
- added `shape-file-txt` mime icon
- added `.caret-like` helper for icons inside buttons
- added `no-wrap` helper
- added `pre` helper and example
- added some mobile helpers
- better element list with placeholders
- new design for header links
- add scss fragment dedicated to mail reset styles
- fix - `td` and `img` reset for Mail - added some Sass variables to trigger them or not (Mail is the special case, newsletter compatibility)
- huge fix - vocalization of all checkboxes/radios/toggle
- signup styles!
- new ellipsis-loader component
- new loading placeholders in discussion view


## Updated/fixes

- added shadow and bold text for unread/collapsed mail
- fixed style for circle-bar chart
- updated Drive icon 🎉
- update of event popover layout
- fix bigger shape examples doc for icons (thanks @mmiskinis !)
- hotfixed navigation icon styles
- hotfixed and reworked meter and progress elements next to Chrome 83 update
- remove gradient in navigation
- remove pointer-events on disabled buttons
- fix selected/last element border in dropDown
- fix unread message selected
- fix - unread item in row mode
- fix - limitated modal full-width for very big screens.
- fix - some missing `!default`
- hotfix - warning and attention buttons didn’t keep their color in dark mode
- fix loading (dark mode)
- fixes for transfer manager
- added some exceptions for iframe challenge
- updated container sticky behaviour/values
- fix - event modal redesign
- fix - icon alignment
- fix dropdown sizes on search
- fix - remove Safari padding-fix on Calendar
- fix - calendar popover tweaks
- fix - star button custom property
- fix - `z-index` on `main` for Safari 🤪 and 💩-fixed positionning
- fix - badge borders and row view
- fix - navigation on laaaaarge viewports
- fix - mail list in dark mode
- fix - increase clickable area around list checkbox
- hotfix - primary button in disabled state in dark mode
- fix - `.trashed-messages` styles added
- fix modal scroll shadow! (not yet fixed on Design system website)
- fix - crazy combination of `.pm-button--redborder` mixed with `.pm-button--link` and `.pm-button`
- fix - bgcolor of read messages/labels/again
- fix - move file preview styles from proton-drive
- fix - added possibility to hide arrow for dropdown
- moved breadcrumbs component from drive to shared
- fix - added `input type="number"` for Design team
- hotfix - `checkbox` issue with Safari (need a `relative` container)
- fix - meterbars in Chrome
- fix dropdowns
- fix - dark mode “primaryborders-buttons”


## Misc

- fix some stuff on Design system website, shame on me for not taking care of you, my dear website.


# [1.8.3] - 2020-05-18

## New

- add `pre-wrap` text helper
- added styles for printed version react
- add `protondrive`, `nospam`, `attention-plain` icon
- add new lock icons (18×18)
- add new selected state on calendar events
- new URL for accessing Design System: https://design-system.protontech.ch/  🎉
- enabled custom scrollbar design everywhere (can be activated/not via `$custom-scroll`)
- added `pm-modal--heightAuto` modifier for modals
- added `width`s helpers in `rem`
- compact/comfort view styles
- added `bordered-container--error` modifier
- add `min-w1-4e` helper
- drop down rework!
- added `$use-ie-calc-font-fallback` Sass variable to remove IE11 font-reset fix
- added some examples for vertical centering with flex 🎉
- added group button for primary colors
- fix icons sizing from 25px to 24px
- remove fixed width for tooltips, min and max width instead
- added `boxes-placeholder-container` container (well, took it back from Angular)
- added new conversation styles and moved some CSS stuff here
- added new `.pm-simple-table--isHoverable` flag to enable row hovering effect
- added new `.pm-simple-table-stickyRow` flag settable on any table row to enable itself to stick the top when scrolling
- added `covered-absolute` helper
- added `flex-self-end` helper
- added collapsed label styles
- added easing functions
- added helpers `ontablet-hideTd2`, `ontablet-hideTd3`, `onmobile-hideTd2` to `onmobile-hideTd5` (on a `tr`) to hide `td`s
- primary buttons now keep their color when disabled


## Updated/fixes

- add variable for composer autocomplete hover
- close button modal font size
- fix placeholder and add class for it
- fixed redirections for Netlify update: https://community.netlify.com/t/changed-behavior-in-redirects/10084
- hotfix print version on Firefox
- fixed `optgroup` styling in dark mode
- moved link reset styles to reset (to avoid color bug in Mail button/links)
- fixed blockquote print version (allowed page-break inside, for Mail)
- fixed harmonization between Chrome/Firefox for monospace-d elements
- hotfixed `pm-button--currentColor` with `pm-button--link`
- fix em width helper
- fix labels max-width
- fixed contrast colour for email in dark mode (added `--bgcolor-unread-item-column-list` CSS custom property)
- fixed loading state for SVG icons
- fixed dark mode notification links
- fixed print version in dark mode
- fixed date size in mail extra-details
- updated `circle-bar--` modifiers class names
- fixed decoration of topnav links
- updated icon `calendar-repeat` to `repeat`


# [1.8.2] - 2020-03-19

## New

- Treeview
- Quill Sass files + Dark mode for it and bugfixes at the same time 🎉
- add Sass variable `$input-shadow-color` for input shadow color
- add `parent-folder` icon
- add `size-40` helper (card layout)
- add `0.4` margin helpers
- add helper for rtl mirroring content `on-rtl-mirror` (icons mostly)
- add placeholder images
- revamped sections and FE helpers
- add `ratio-container-5-1` helper and improved doc for it
- add `border-bottom--currentColor` helper
- add dark-mode friendly bank logos/icons
- add `fill-white-dm` and `fill-global-highlight` aliases (dark mode)
- refactor `<Icon/>` fill
- set default color of labels, buttons, inputs and selects to `currentColor`
- added `shape-file-edit`, `shape-file-upload`, `shape-folder-new`, `shape-folder-upload` icons
- loader animation rework for less blury effect and more customization / random feeling
- added new responsive helpers: `ontinymobile-flex-self-start`/`ontinymobile-flex-column` and `ontinymobile-m1/mt1/mr1/mb1/ml1`
- new animation for Calendar event loading
- drag and drop image for Drive
- add `min-h16e` helper (`min-height` in em helper)
- add `react-intl-tel-input` styles


## Updated/fixes

- fix for recurring frequency in popover
- remove dirty fix for SVGs in `button`s
- fix Quill editor in Dark mode (placeholder)
- fix subnavigation links in dark mode
- fix elliptical shape for `dropDown-logout-text`
- fix horizontal scrolling case for `customScrollBar-container`
- fix `row--orderable` helper to be dark-mode friendly
- fix `--paddingFix` stuff (for iOS/VPN settings)
- fix `tree-view` stuff
- add hover state for `dropDown-item`
- fixed dark mode stuf
- fixed Angular star issue
- fixed `.toolbar-select` issue in Dark Mode
- fix arrow colors (mini-calendar)
- add exception for `pm-button--link` and `nodecoration`
- fix import/export icons
- increase dropdown width on default and narrow states, for time options


# [1.8.1] - 2020-01-31

## New

- added `gift` and `calendar-repeat` icons
- made `bg-global-border` dark-mode friendly
- add `progress-contact--success`/`progress-contact--error`/`progress-contact--warning` modifiers
- add new subnav styles
- add `w120e`, `w140e`, `w220e` helpers
- add `ontablet-w25`, `ontablet-mw100`, `ontablet-wauto`, `onmobile-w25`, `ontinymobile-wauto` helpers
- add `--bgcolor-highlight` CSS custom property
- added Assets section (with list of images/flags/etc.)
- add new margin helpers
- add `pm-simple-table--bordered` modifier (for tables)
- add `pm-radio--onTop` modifier (alignment)
- add `flex-noMinChildren` class
- add `pm-modal--auto` modifier
- add `flex-self-start` helper
- add helpers for display/hide on dark mode and doc about it in helpers
- add arrow for dark mode and rtl in CSS sprite
- add helper `color-global-grey-dm` (dark-mode friendly)
- add `day-checkbox` component (for Calendar)
- add label styles for React
- add `mt0-5r` and `mr0-5r` helpers
- add `w14e` class

## Updated/fixes

- fix mobile week selectors
- fix caret icon positionning for alignment when rotated
- fix time indicator display
- fix display event on Safari Mac
- update time-indicator in Calendar
- fix `pm-button--warning`/`pm-button--error` display when used with `pm-button`
- fix conversation item selector hover state
- fix display of conversations
- fix `pm-button--primaryborder`
- fix `disabled` state for `pm-button--primary`
- update calendar now hour line indicator and added CSS variable `--bgcolor-calendar-now-indicator`
- fixed toggle dark mode design
- fixed calendar selected/current day display
- fix `fill-currentColor` in dark mode
- fix selective/current day on mini-calendar/calendar
- fix `pm-label` for credit card autogrid issue (`width` was too large for small modals)
- fix inconsistency for mini-calendar colors (current/selected day)
- fix display of outside modifier (calendar)
- fix `pm-label`
- first round of updates for placeholder images
- fix modal close button position
- second round of updates for placeholder images
- fix advanced search (clear button)
- increased `container-section-sticky` max-width
- fix expand caret in toolbar-button--dropdown
- fix `day-icon` on tiny breakpoint (recurring)

## Misc

- Readme/doc update


# [1.8.0] - 2019-12-20

## New

- added css-arrow-right in css svg sprite
- hover styles for minicalendar
- added `pm-modal--full` modifier
- added `minus` icon
- padding fix for settings/calendar
- added `pm-form--iconLabels` modifier (for Calendar)
- added `border-top--dashed` modifier
- added `fixed` (`position: fixed`)
- added `onmobile-static` (`position: static` on… mobile!!!)
- added `lock-alone`, `lock-check`, `lock-warning`, `lock-write`, `pen` icons (for composer)
- added `pm-simple-table--alternate-bg-row` modifier to have alternate background colors for rows in a table
- added alias for `bg-global-light`, `bg-white`: `bg-global-highlight`, `bg-white-dm` (dark mode friendly)
- added `ontablet-flex-column` helper
- added `blocked-content`, `payments-type-amex`, `payments-type-cash`, `payments-type-discover`, `payments-type-mastercard`, `payments-type-visa`, `p2p`, `servers-country`, `speed-fast`, `speed-low`, `speed-medium`, `vpn-connx`
- Dark Mode!

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


# [1.7.7] - 2019-11-21

## New

- added `circle`, `calendar`, `clock` and `target` icons
- added mini-calendar styles
- added `toolbar-select` styles
- added `mw8e` helper
- added `filter-blur` helper
- added `w50p` helper
- added `.pm-modal--shorterLabels` modifier
- added `calendar-grid` fragment
- added `atomLoader-text` styles
- added calendar event loader/skeleton loading anim styles
- added `bg-inherit` helper class
- added `w95` helper
- added mini calendar range selection styles
- added `flex-justify-center` helper
- added `border-currentColor` helper
- added `onmobile-remain-sticky` modifier for sticky title
- added `blackfriday` icon
- added `ellipsis-four-lines` helper
- added `alignsub` helper

## Updated/fixes

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


## New

# [1.7.6] - 2019-10-24

## New

- added `pm-button--currentColor` modifier (used in notification area for example)
- added `navigation__refresh` classes (for mail)
- added `pm-button--for-smallicon` modifier
- added placeholder images (no result)
- added helper `color-currentColor` (for notification zone)
- added CSS custom property `--label-width`
- added more border and max width options
- hover state for conversations
- add protoncontacts icon
- new icons
- added new responsive navigation styles
- added rem margin-top helper (will enhance it later)
- added FAB styles
- added option on `respond-to` (`$query-type == "height"`)
- added `plus` icon
- added `0.75` margin helpers
- added `selectall` icon

## Updated/fixes

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


# [1.7.5] - 2019-09-27

## New

- added `flex-item-start` helper
- added modifier `pm-button--whiteborder`
- added `right-icon` helper
- added “field with icon” container styles (`pm-field-icon-container` and `pm-field-icon-container--invalid`)
- added circle bar styles (see in dropdown to see the bigger version)
- added storage dropdown styles
- added `smallest` helper (~9px)
- added some bank icons
- added `flex-item-noflex` helper (`flex: 0`)

## Updated/fixes

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


# [1.7.4] - 2019-09-12

## New

- added `$list-max-width-ch` Sass variable, ex. `.mw70ch`: `max-width: 70ch`
- added `flex-justify-start` helper
- added `onmobile-wauto` and `min-w5e` helper classes
- added `scroll-horizontal-if-needed` for horizontal scrolling
- hamburger color
- padding helper with `3`: `pt3`, etc.
- added `h100v` helper
- added `ontablet-mw100` helper
- added aliases `pm-button--primaryborder`, `pm-button--primaryborder-dark` (based on `$pm-primary` value)
- added `header-height-anchor` for scrolling issues
- added `badgeLabel-primary` and set this one by default
- added `flex-item-fluid-auto` helper: `flex: 1 1 auto`
- added `onmobile-flex-wrap` and `onmobile-min-w100` helpers
- added `rounded0`, `rounded0-left` and `rounded0-right` helpers
- added title style for VPN signup

## Updated/fixes

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


# [1.7.3] - 2019-08-30

## New

- added `$vpnplus` and `$vpnbasic` plan colors
- added `pm-simple-table--has-actions` modifier to right-align “action” column (design rule)
- added `stroke-*` classes (for SVG `stroke` properties)
- added paypal logo in bank images
- added `$pm-primary`, `$pm-primary-light`, `$pm-primary-dark` Sass variables (aliases for main colors)
- added class aliases for primary colors: `color-primary`, `bg-primary`, `fill-primary`, `stroke-primary`
- added styles for toolbar elements (and clean up a bit this mess)
- added `flex-justify-end` helper
- added plans tables
- updated searchbar styles: if there is no search bar, the next element (navigation) is pushed to the right (VPN/settings/etc.)
- login page in responsive
- added svg illustrations
- added `fill-beta` color and styles

## Updated/fixes

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


# [1.7.2] - 2019-08-15

## New

- new loading images/animations
- fixed toggle “slow `aria-busy`” state animation
- custom scrollbar
- added small toggle: add `pm-toggle-label--small` to `pm-toggle-label` and maaaagic
- added class `container-section-sticky-section` to increase margin between sections
- added tabs styles
- added documentation for square container/`ratio-container-*` helpers (padding-hack technique, use it wisely young jedis)
- added documentation for `nodecoration`, `underline` and `underline-hover`


## Updated/fixes

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


# [1.7.1] - 2019-08-06

## New

- added `dashed` and `dashed-container` containers
- added `language`, `timezone1`, `timezone2`, `linux`, `windows`, `alias`, `calendar`, `cc`, `check-circle`, `key`, `user-storage` icons
- added bank icon images (discover/jcb to clean up)
- added `pm-button--noborder` modifier
- add plan colors/classes
- add `no-outline` helper (god, please forgive me for having created this)
- add class `mw100` on `navigation` element (fixes ellipsis bug in some cases)
- fixed “button” active state when applied to `div` and triggered by dropdowns inside
- updated logo
- added react dedicated styles (and notes/documentation about them)
- added `lh-standard` class (standard `line-height`)
- added `$list-max-width-em` feature (needed for composer)
- added flags files in `assets/img/shared/flags`
- added `pv-indicator` css file (and notes/documentation about `pv-styles`)
- added `.underline-hover` helper

## Updated/fixes

- added exception on `main-area` with `no-scroll`

## Misc

- added icons in left bar
- has to change CSP policies (Firefox, when do you will fix this CSP bug for CSS in SVG images?)


# [1.7.0] - 2019-07-12

## New

- added `android`, `apple`, `facebook`, `github`, `instagram`, `linkedin`, `mastodon`, `reddit`, `youtube` (updated `twitter` one)
- added design for checkbox for “select all”
- added `w15` width helper
- added icon `shape-contract-window` (for composer)

## Updated/fixes

- fixed `dropDown-item` border display
- add exception for `pm-button` with `p0` (needed for dropdowns)
- remove `margin` for `item-icon` (more reusable), replaced by a helper (`mr1-5`)
- fixed some button designs for more stability for hover states
- fixed notification container positionning
- updated top nav responsive behaviour for better matching v4’s one.
- removed `padding-left/right` for `pm-button--link`


## Misc

- added subsections for containers and helpers pages
- enhanced responsive of Design System website


# [1.6.18] - 2019-06-27

## New

- `toolbar-separator` styles + `toolbar` design details

## Updated/fixes

- removed `.toolbar svg` for `.toolbar-icon` selector (limit depth of applicability for styles, always)
- update selector for modal button display


# [1.6.18] - 2019-06-27

## New

- added `dropDown-content--wide` modifier (super large drop down, for advanced search)
- added `break` helper
- added `no-pointer-events-children` helper

## Updated/fixes

- fixed `pm-label` to accept `auto` helper (`width: auto`)


# [1.6.17] - 2019-06-25

## New

- added `rotateZ-90` and `rotateZ-270` helpers
- added Sass variables for `max-width` in percentages
- added helper `flex-row`
- added modifier `pm-modal--wider` for… wider modals.


# [1.6.16] - 2019-06-19

## New

- added `progress` styles for exporting contacts
- added `fill-currentColor` class for SVG

## Updated/fixes

- updated reset for `progress`
- added Sass variable for `meter` tag (space bar)
- vertical alignment for checkboxes and radios
- fix for logout dropdown (if there is only one letter inside)


# [1.6.15] - 2019-06-07

## New

- added `border-bottom--dashed` modifier
- added helper `underline`
- added `icon-w40p` size
- added cursor helper classes

## Updated/fixes

- exception for applying `pt0` to `pm-label`
- missing scroll in conversations on Design System website


# [1.6.14] - 2019-06-05

## Updated/fixes

- updated `hr` color
- updated `flex-items-end` helper and added example (renamed it, was `flex-item-end`, not consistent)
- fixed color of ProtonMail version text
- fixed navigation padding (added partial `exceptions` ONLY for Design System website)
- fixed logout expand on Design system website


# [1.6.13] - 2019-06-04

## New

Logout dropdown

- added it :)
- added helpers `opacity-30`, `lh100`, `bordered` container
- commented some stuff (`q` styles)
- updated “How to use the Design system” (new partial)


## Updated/fixes

- updated drop downs (`max-height` limit, plus shadows/etc.)
- updated classnames for conversation lists (for `item-`, more generic, as it is used in contacts)
- fixed `viewbox` for some icons/simplified documentation
- renamed some classes for CSS multicolumns (consistency)
- renamed some Sass variables for better consistency
- added documentation about width helpers


# [1.6.12] - 2019-05-29

## New

- added `alignbaseline` helper class

## Updated/fixes

- fixed big screen adaptation

## Misc

- Add SVG illustrations


# [1.6.11] - 2019-05-28

## New

- added `--width-sidebar`, `--width-subnav` and `--body-fontsize` CSS variables
- added `pm-field--highlight` modifier
- added `meter` bars styles for settings
- POC screen adaptation for very large screens (to test)

## Updated/fixes

- added state class `is-disabled` for buttons
- increased tooltips width
- fix icon positionning in aside bar


# [1.6.10] - 2019-05-23

## New

- added icon `shape-lock`
- added `block-info-success`/`block-info-standard-success` in containers

## Updated/fixes

- Updated fake checkbox in conversations (WIP)
- Reseted `figure` default browsers styles


# [1.6.9] - 2019-05-22

## New

- sticky header for settings (using `.sticky-title` class, and `sticky-title--onTop` modifier to remove `box-shadow` at the top, has to be managed via JS)
- added container `container-section-sticky` class for pages using sticky header (for each section)
- also added modifier `container-section-sticky--fullwidth` modifier class to remove `max-width` if needed.
- updated smooth scrolling feature on Design System website (used https://github.com/zengabor/zenscroll)

## Updated/fixes

- update modal positionning (WIP for Safari bugs)
- updated `pm-label` class (set up to `width` to avoid bad alignments and add `padding` to the right)
- removed decoration from `pm-buttons` (except for `.pm-button--link`)
- added examples of vertical centering in forms


# [1.6.8] - 2019-05-19

## New

- add `capitalize` helper


# [1.6.7] - 2019-05-14

## Updated/fixes

- fixed bug on button group with 2 buttons `last/first-of-type`
- revamped drop down code (removed class, simplified, choosed classname more generic)
- also moved button classes to drop down and generalised `focus-within`
- added group button example with colors
- fixed color management for caret
- updated leftArrow/rightArrow to modifier classes

Bonuses:
- added modifier `wizard-container--noTextDisplayed` for wizard (hides the current step)
- fixed button--link modifier (background transparent
- documentation for drop down in button groups


# [1.6.6] - 2019-05-13

## New

- wizard component
- add `shadow-container` class
- updated/standardized animations and classnames
  - update notifications/modals after discussion with @mmso
  - documentated in namespacing classes
  - added mention of modifier convention
  - documented modal modifier `pm-modal--inBackground` and animation names for modals

## Updated/fixes

- add `block-info-standard-warning` class
- fix `aligncenter` helper on `th`
- update reduce motion MQ (compatibility with `animationEnd` listener)


# [1.6.5] - 2019-05-08

## New

- add `650` value to `$list-max-width`

## Updated/fixes

- set search image as content image
- removed CSS variable for it
- fix RTL adaptation
- updated blue and light theme
- updated theme config
- updated documentation


# [1.6.4] - 2019-05-07

## New

### Revamped modals:

- added scroll inside modal
- centering checked
- added shadows in case of long content
- added anim out
- cleanup, positionning, RTL tests, comments

### Others:

- added `no-pointer-events` helper class
- added `border-bottom` helper class


# [1.6.3] - 2019-05-03

## New

- manage a list of notifications
- added flexbox helper `flex-items-center`


# [1.6.2] - 2019-05-03

## Updated/fixes

- Update theme scss files for WebPack.


# [1.6.1] - 2019-05-02

## New

- added password revealer in forms
- new icons

## Updated/fixes

- Fix documentation of Sass partials


# [1.6.0] - 2019-05-01

## New

- added CSS custom properties
- added generation of static CSS files for themes surcharge
- added previsualisation in Design system website
- added documentation for all of these
- added `pm-field--tiny` modifier

## Updated/fixes

- Fix mismatch for `pm-button--link` when used with `pm-button`
- also fixed layout of top nav #95


## Misc

- remove inline-styles for space bar (this is bad)
- removed 'unsafe-inline' for CSS for design system website



# [1.5.18] - 2019-04-25

## New

- added pagination drop down
- added button drop down
- added class `.increase-surface-click` class (needed for pagination drop down, and could be used for other cases, to increase tap zone)
- add `rotateX-180` helper

## Updated/fixes

- fixed documentation in group buttons


# [1.5.17] - 2019-04-24

## New

- add `prefers-reduced-motion: reduce` MQ (for vestibular disorder)

## Updated/fixes

- set up max width for input/select/textarea
- fix select text overflow
- updated `ng-valid` to `is-valid` (byebye Angular)
- fix `pm-label` alignment


# [1.5.16] - 2019-04-18

## New

- add warning styles for input (contrast to enhance)


# [1.5.15] - 2019-04-17

## New

- add error styles (using `aria-invalid="true"` and CSS transforms)
- add `details`/`summary` styles
- add `scroll-smooth-touch` class

## Updated/fixes

- fixed a minification issue with `::placeholder` for `searchbox-container` styles
- updated reference for CSS icons `css-caret-close`
- fix topnav “shrink” icons in rwd

## Misc

- had to activate `unsafe-inline` for CSP `style-src` for design system website (bugs on Firefox/inline style)


# [1.5.14] - 2019-04-10

## Updated/fixes

- remove `flex-item-grow-1-5` item to `flex-item-grow-2`.


# [1.5.11] - 2019-04-10

## Updated/fixes

- update badge height (Chrome bug)
- add `flex-item-grow-1-5` item.
- fix sticky subnav


# [1.5.11] - 2019-04-10

## Updated/fixes

- conversation row class


# [1.5.10] - 2019-04-09

## Updated/fixes

- add missing CSS fragment in how to use the design system.
- fix print version


# [1.5.9] - 2019-04-05

## New

- add selected state for conversation styles
- add a DO/DON’T

## Updated/fixes

- fixed a display bug in code sections with Prism
- fixed a display bug in conversations


# [1.5.8] - 2019-04-05

## New

- conversation styles
- add class `w0` (`width: 0`)

## Updated/fixes

- reordered padding/margin helpers


# [1.5.7] - 2019-04-04

## New

- add color rules

## Updated/fixes

- fix small bug/cleanup
- fixed color wrong values


# [1.5.6] - 2019-04-03

## New

- add example of settings layout
- add `aria-busy="true"` state to toggle

## Updated/fixes

- fixed RTL for top search and navigation
- fixed logo plan with RTL
- fixed sidebar display
- splitted/cleanup some SCSS files
- fixed white mode poc

# [1.5.5] - 2019-04-02

## New

- top search bar styles
- top navigation styles

## Updated/fixes

- splitted main template in several files for Design System website
- update documentation page on Sass variables


# [1.5.4] - 2019-04-01

## New

- put variables in `design-system-config`
- rewamped color pages
- add `h100` class
- added documentation page on Sass variables

## Updated/fixes

- add missing color in icons
- fix 404 page


# [1.5.3] - 2019-03-29

## New

- Plan under logo


# [1.5.2] - 2019-03-27

## New

- styles for conversations

## Updated/fixes

- “caret” has a single “r”.
- added modifier `.pm-button--for-icon` (for group button made of icons)
- add missing ` !default` to some variables
- add `shape-burger` icon (for design system website)


# [1.5.1] - 2019-03-26

## Updated/fixes

- remove `progress` tag to `meter` (for space used)
- added `white` classes (`fill-white` & `bg-white`)
- added `opacity-50` class (=> `opacity: .5`)
- doc for `flex-nowrap` class


# [1.5.0] - 2019-03-25

## New

- detect scroll on main navigation/display gradient
- add `disabled` style for toggle
- add `indeterminate` style for checkbox

## Updated/fixes

- Update button aliases to modifiers.

# [1.4.9] - 2019-03-22

## New

- added caret icon
- WIP: detect scroll on main navigation

## Updated/fixes

- Update toggle component, also fixed it in RTL version

# [1.4.7] - 2019-03-21

## New

- Tooltips styles
- RTL documentation
- added class `.mirror` in `sprite-for-css-only.svg` and in `_design-system-layout-modules.scss`

## Updated/fixes

- Missing paths `$path-images` in `_pm-loadingcontent.scss`

## Misc

- Fixed CSP issue on SVG sprite for CSS (Firefox… you really start to stress me up!)

# [1.4.6] - 2019-03-19

## New

- conversation styles (WIP)

# [1.4.5] - 2019-03-18

## New

- added new images useful in settings (in `assets/img/pm-images`)

## Updated/fixes

- added disabled styles for `radio`/`checkbox`
- added new color on `block-info-standard`: `block-info-standard-error`
- added ProtonMail icon with “native” viewbox of 16×16

# [1.4.4] - 2019-03-15

## New

- added class `dash2x` to make path bigger on SVGs

## Updated/fixes

- added example/fix on icons in `button`/`a`.

# [1.4.3] - 2019-03-12

## New

- added class `rounded50` (`border-radius: 50%`)
- made design system more RTL-friendly (WIP)
- added examples of integration in icons
- added one DO/DONT

## Updated/fixes

- removed duplicate SVG icon
- moved some classes that are specific to design system website
- indentation fixes

# [1.4.2] - 2019-03-11

## Updated/fixes

- used relative path for images (for webpack)
- added documentation for variables
- added missing `!default` on variables of the design system
- updated `styles-pm` comments and “how to use design system” for variables
- indentation fixes


# [1.4.1] - 2019-03-08

## New

- added “domain breadcrumb” styles (in containers)
- added “Information panels” styles (in containers)
- added `#shape-drag` and `#shape-reload` icons (not definitive icons)

## Updated/fixes

- updated asset structure
- fixed overflow on Chrome
- also “fixed” a iOS Safari bug


# [1.3.8] - 2019-03-07

## Updated/fixes

- fixed `padding`s on `block-info-warning`

## Misc

- Added documentation for `unstyled` class

# [1.3.6] - 2019-03-04

## New

- added `.italic` class
- added SVG sprite for CSS use only (with doc)
- added `.bold` alias for `.strong`
- added animation on `radio`/`checkbox`

## Misc

- Fixed CSP issue on SVG sprite for CSS (Firefox)


# [1.3.5] - 2019-03-01

## New

- added `input type="radio/checkbox/search"` in forms
- added SVG sprite for CSS use only
- added `.strong` and reset for `b` and `strong`

## Updated/fixes

- `select` enhanced but WIP

## Misc

- moved to Github
- created templates for issues/PR, labels, etc.


# [1.3.4] - 2019-02-18

## New

- added alias `.pm-button-redborder` in buttons
- added all icons
- added `pm-modal--smaller` class and example

## Updated/fixes

- remove margin on `textarea`


# [1.3.3] - 2019-02-18

## New

- added simple horizontal `flex-autogrid` examples in flexbox helpers


# [1.3.2] - 2019-02-15

## New

- added `block-info-*` examples in containers
- added `ratio-container-*` examples (in "icons tests", also useful for responsive `iframes`/etc. with keeping ratios)


## Updated/fixes

- mentionned new `scss` files in “how to use the design system”


# [1.3.0] - 2019-02-14

## New

- added loading content page/templates
- added drop downs (WIP)
- added design for `progress` bar in navigation (remaining size)
- added `information-block` style in container section
- added aliases for buttons: `pm-button-(primary/link/error/warning/info)`
- added class `.link` (same style as for `a` tag)
- added class `.scroll-if-needed`, to apply `overflow: auto` on an element


## Updated/fixes

- adapted height of buttons/status/input/table cells (from Keven input)
- updated: default case for `main-area` is without the toolbar, exception is now `main-area--withToolbar`
- increased speed of all animations/transitions
- moved `.rounded` class to global layout
- enhanced Flexbox documentation section (mention of `flex-item-noshrink`, `flex-item-nogrow` and `flex-self-vcenter` classes)

## Misc

- added meta descriptions and keywords for all pages
- bugfixes: IE11 JS fix (arrow functions are too modern for IE11, f***)
- added another stupid joke on 404 page
- updated license


# [1.2.0] - 2019-01-24

## New

- added login page/template
- added class `main-area--noToolbar` (main area without toolbar)
- added class `main-full` (full-height page for login)
- splitted `pm-layout` into separate components
- added list/documentation on each module in “How to use the Design System”


## Fixed

- renamed status to badges (including classes)
- tables (used more `extend`s to factorise)
- add cache buster for JS file
- bugfixes (links)

# [1.1.0] - 2019-01-22

## New

- added sub navigation (buttons + IntersectionObserver stuff)
- refactored group buttons
- added classes `is-hover` and `is-active` for buttons
- added exception for main content without toolbar (`main-area--noToolbar`)
- styled buttons in left toolbar (PM, PVPN, Burger, etc.)


## Fixed

- renamed svg sprite
- updated modal code
- fixed print version
- reordered import to have helper working properly on `Hx` stuff
- bugfixes

# [1.0.0] - 2019-01-14

The design system for Proton projects is here. A quick look?

## Features of the Design System

- A global reference for design: colors, SVG icons available, buttons styles, etc.
- A documentation to share front-end best practices (conventions, DOs/DONTs, etc.)
- Some sets of re-usable classes (helpers) for front-end: typographic/hiding/etc. helpers, positionning helpers, etc.
- A mini Flexbox micro-framework for achieving most common positionning.
- To be notified of updates, a RSS is available.

## Goals

Here are goals of this tool:

- Having a more consistent experience for users
- Having a consistent reference for all the teams, and mutualizing some elements on all Proton projects in order to save time
- Improving/simplifying work discussions between design and devs, and between all front-end team (same language, same conventions, same objectives)
- Improving/simplifying Front-End maintenability/scalability, by not reinventing the wheel: the goal is to reduce drastically the CSS weight on PM V4 - target is to reduce it by half
- Facilitating the onboarding of newcomers in the team.

## Roadmap

This will be first the main place to implement design of the V4 of PM. Real assets will come quickly, and project will be updated on a regular basis.

In a near future, there will be other projects (click on the VPN icon to get a nice message)
