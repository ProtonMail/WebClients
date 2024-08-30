## August 2024

### Improvements

-   Added the ability to minimize the left side panel for a more customizable interface.

### Fixes

-   Fixed issue with deleted occurrence in an event serie

## July 2024

### Improvements

-   Adjusted font sizes for improved readability across the platform.

## June 2024

### Improvements

-   Implemented general UI updates for a more streamlined user experience.
-   Enhanced functionality for managing recurring events.

## Release 5.0.21 — Feb 14th, 2024

### Improvements

-   Minor accessibility improvements

## Release 5.0.20 — Jan 31st, 2024

### Improvements

-   Minor UX improvements for edition/deletion of holidays calendars
-   Improved the behavior of the time input when time is entered manually

### Fixes

-   Fixed issues that prevented importing events with time zone Australia/Hobart

## Release 5.0.19 — Jan 10th, 2024

### Improvements

-   Small improvements in the import flow

## Release 5.0.18 — Dec 18th, 2023

### New features

-   An event organizer now has the ability to cancel a single event occurrence of a recurring event with participants

### Fixes

-   Fixed wrong event duration that was displayed for multiple-day events ending on midnight

### Improvements

-   Minor accessibility improvements

## Release 5.0.17 — Nov 21st, 2023

### Improvements

-   Fixed an issue where event invitations from the Deutsche Bahn would have the wrong dates due to an invalid format in the ICS file
-   Updates to your calendar events are now visible in the search results immediately

### Fixes

-   Fixed an issue where certain events imported from the Android Proton Calendar app would not be readable

## Release 5.0.16 — Nov 1st, 2023

### New features

-   You can now reply to external invitations that were forwarded to you

### Improvements

-   Implemented a mechanism to auto-reload events that we fail to load when there are network issues

### Fixes

-   Stability fixes for some rare conditions that would cause events to not be rendered properly

## Release 5.0.15 — Sep 26, 2023

### New features

-   You can now securely search your calendar events (beta users only)

### Improvements

-   Improved the performance when loading the app and exporting calendars

### Fixes

-   Fixed incorrect display of event ending on midnight created in time zones with negative offset

## Release 5.0.14 — Aug 23, 2023

### Improvements

-   The settings button has moved from the top right to the sidebar on the right-hand side
-   Improved the app layout and increased the space for calendar events

## Release 5.0.13 — Aug 9, 2023

### Improvements

-   Added the ability to easily see the addresses of events' participants, copy them and create or view linked contacts

### Fixes

-   Small fixes when sending or replying to invitations

## Release 5.0.12 — July 12, 2023

### New features

-   Public holidays are here!

### Improvements

-   Added app languages: Finnish, Hindi and Swedish

### Fixes

-   Minor bug fixes

### Other

-   Our Terms and Conditions have been updated https://proton.me/legal/terms

## Release 5.0.11 — June 14, 2023

### Improvements

-   Optimized events loading at app startup
-   Improved sidebar spacing and app switcher design
-   Added support for invitations with an empty organiser field in the ICS
-   Allowed importing events with alarm components with invalid duration

### Fixes

-   Refactored logic for updating favicon, which stopped working for Chromium-based browsers
-   Added RFC-mandatory fields for alarms when exporting calendar

## Release: 5.0.10 — April 12, 2023

### New features

-   You can now share your calendar with family and friends that own a Proton account with view or editing permissions. Sharing a calendar with Proton users enables real-time updates of the calendar modifications

### Improvements

-   Updated time zone offsets to the IANA time zone database 2022g
-   Updated spelling of Europe/Kiev time zone to Europe/Kyiv
-   Enabled the possibility to interact with the contacts in the side panel while creating an event in your calendar

## Release: 5.0.9 — March 8, 2023

### New features

-   Lifted restrictions for the number of calendars you can create by category. Create up to 3 calendars as a free user and 25 if you have a Mail subscription

### Fixes

-   Proactively fix sequence properties outside the valid value range (established on the RFC 5545 standard) when importing and exporting events

## Release: 5.0.8 — February 15, 2023

### Improvements

-   Increased support for importing ICS files with dates that do not follow the RFC 5545 standard (including dates missing seconds and ISO-formatted dates)
-   Redesigned of app notifications
-   Minor UI improvements

## Release: 5.0.7 — January 25, 2023

### Improvements

-   Added a reload mechanism for events that failed to be decrypted because of network issues
-   Improved notification update system for all calendar types

### Fixes

-   Updated some time zones conversion to canonical time zones

## Release: 5.0.6 — December 14, 2022

### New features

-   Manage your contacts from the new side panel

### Improvements

-   Better display on mobile view

### Fixes

-   Fixed issue where some white spaces in event details could be trimmed when saving

## Release: 5.0.5 — October 5, 2022

### Improvements

-   Minor UI and UX improvements

## Release: 5.0.4 — August 24, 2022

### New features

-   Added invitations from the inbox to the calendar and mark as pending

### Improvements

-   Reorganisation of the calendar settings
-   Improved the performance and security of crypto operations
-   Use account primary time zone when importing events without time zone (floating time)

## Release: 5.0.3 — July 20, 2022

### New features

-   Draggable popover on event creation
-   Reminders for events in subscribed calendars

### Improvements

-   Validate calendar subscription links as soon as the URL is entered
-   Added possibility to disable the setting for time zone auto-detection directly from the pop-up

### Fixes

-   Fixed issue where the app would not load because of calendars with a broken setup

## Release: 5.0.2 — June 22, 2022

### Improvements

-   Made ICS parsing more robust
-   Made displayed GMT offset more representative of the date range in view

# Introducing Proton's refreshed look.

## Release: 5.0.0 — May 25, 2022

As we continue to make privacy accessible to everyone, we've updated our apps to provide you with an even better experience with our services.

Proton - Privacy by default.

## Release: 4.0.9 — Mar 30, 2022

### Improvements

-   Improved the visibility of today indicator
-   Improved calendar creation

### Fixes

-   Improved support for invalid ICS formats that other providers sometimes use (Office Holidays Ltd.)
-   Fixed wrong conversion of some localized time zones that Microsoft Exchange 2010 uses

## Release: 4.0.8 — Feb 9, 2022

### New features

-   Duplicate event to quickly create the same event on another date

### Improvements

-   Updated modals designs
-   Reactivate calendar keys automatically when opening an invitation in mail

### Fixes

-   Fixed time zone aliases conversion

## Release: 4.0.7 — Jan 13, 2022

### New features

-   Drag and drop an ICS file into calendar view to import it
-   Select language in which event invites and RSVPs are sent
-   Allow organiser to add participants replying to forwarded invitations directly from Mail

### Improvements

-   Improved the browser print rendering of calendar
-   Differentiate invitation emails with calendar icons in the mailbox
-   Extended supported time zone formats (Bluejeans, Mozilla and others using globally defined time zone registries)
-   Support certain ICS formats that would result in the error "File does not have the right format" when trying to import them
-   Better handling of large ICS files import
-   Minor UI and accessibility improvements

### Fixes

-   Do not display Calendar invitation information header for bounced emails

## Release: 4.0.6 — Dec 1, 2021

### New features

-   Enable email notifications option for events and calendar default settings

### Improvements

-   Added shortcuts in the sidebar to import and subscribe to calendars
-   Support ICS files with no version
-   Fit more text in event cells for events with long duration
-   Reduced width of event popover to block less space in the UI
-   Other minor UI and accessibility improvements

## Release: 4.0.5 — November 3, 2021

### Improvements

-   Allow importing invitations
-   Do not leak event title in the email subject when replying to invitations from Calendar
-   Fixed "not synced" status that could be displayed erroneously for subscribed calendars under some circumstances
-   Support events with DURATION field via import
-   Improved support for non-standard replies sent by Yahoo Calendar
-   Updated favicon without reloading the tab when day changes
-   Minor UI and accessibility improvements

### Fixes

-   Fixed faulty keyboard navigation in time zone selector
-   Allow adding invitations with unsupported email addresses to Calendar when replying to them
-   Fixed issue where editing multiple times a recurring event with the "this and following" option would result in an error

## Release: 4.0.4 — September 22, 2021

### Improvements

-   Added participants from reduced event creation form
-   Redesigned of event popover

### Fixes

-   Ask for confirmation when opening a link in an event if setting is on for emails
-   Answer invitation from alias email address when invited

## Release: 4.0.3 — August 25, 2021

### New features

-   Subscribe to external calendar via link

### Improvements

-   Inverted day name and date in calendar view

### Fixes

-   Redirect Myanmar time zone to Indian/Cocos
-   Handle case where an email address is disabled under one user and active under another in the same organisation
-   Extended support to recognize invitations formatted with floating times

## Release: 4.0.2 — July 28, 2021

### Improvements

-   Added shortcuts for calendar creation, edition and sharing from the calendar sidebar
-   Allow import of events with missing UID
-   Design improvements in mini calendar
-   Made the calendar linked address more obvious in the settings list of calendars
-   Added calendar color in the calendar select when creating or editing an event

### Fixes

-   Trigger browser notifications at the right time after computer sleep mode
-   Various small bug fixes

## Release: 4.0.1 — June 30, 2021

### New features

-   Enable the search of time zones

### Improvements

-   Minor UI improvements

### Fixes

-   Fixed the display of sent invitations with specific security settings that would show as encrypted in the sent folder

# Proton Calendar for web is live!

## Release: 4.0.0 — June 8, 2021

Proton Calendar for web is now out of beta and available to everyone. Integrated with your ProtonMail account, our fully encrypted calendar lets you easily stay on top of your schedule while keeping your data secure.

### Key features

-   **Invite anyone**: Send calendar invitations to everyone, including those not using ProtonMail.
-   **Integrate with ProtonMail**: Accept invitations and add events to Calendar from your Proton inbox.
-   **Import from anywhere**: Import your calendars from other service providers.
-   **Manage invitations**: Accept or reject invitations directly from Calendar.
-   **Share with anyone**: Share your calendar via link to non-Proton Calendar users.
-   **Make it yours**: Customize your calendar with new themes and configure the layout so it works for your needs.
-   **Access it all**: Quickly select and switch between different Proton services (Calendar, Mail, Drive, VPN).
-   **Stay signed in**: Stay signed in without losing your user session, even after closing your browser.

A big thank you to all our beta users! Your invaluable feedback makes it possible for us to go live. Please continue to let us know what you like about Proton Calendar and how we can improve it to make it the best and most secure calendar service available. You can also report an issue or request a feature under “Help” in the top menu bar.
