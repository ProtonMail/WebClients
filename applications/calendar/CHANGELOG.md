## Release 5.0.13.0 — Aug 9, 2023

### Improvements

-   Add the ability to easily see the addresses of events' participants, copy them and create or view linked contacts  

### Fixes

-   Small fixes when sending or replying to invitations

## Release 5.0.12.0 — July 12, 2023

### New features

-   Public holidays are here!

### Improvements

-   Add app languages: Finnish, Hindi and Swedish

### Fixes

-   Minor bug fixes

### Other

-   Our Terms and Conditions have been updated https://proton.me/legal/terms

## Release 5.0.11.0 — June 14, 2023

### Improvements

-   Optimize events loading at app startup
-   Improve sidebar spacing and app switcher design
-   Support invitations with an empty organiser field in the ICS
-   Allow importing events with alarm components with invalid duration

### Fixes

-   Refactor logic for updating favicon, which stopped working for Chromium-based browsers
-   Add RFC-mandatory fields for alarms when exporting calendar

## Release: 5.0.10 — April 12, 2023

### New features

-   You can now share your calendar with family and friends that own a Proton account with view or editing permissions. Sharing a calendar with Proton users enables real-time updates of the calendar modifications

### Improvements

-   Update time zone offsets to the IANA time zone database 2022g
-   Update spelling of Europe/Kiev time zone to Europe/Kyiv
-   Enable the possibility to interact with the contacts in the side panel while creating an event in your calendar

## Release: 5.0.9 — March 8, 2023

### New features

-   Lift restrictions for the number of calendars you can create by category. Create up to 3 calendars as a free user and 25 if you have a Mail subscription

### Fixes

-   Proactively fix sequence properties outside the valid value range (established on the RFC 5545 standard) when importing and exporting events

## Release: 5.0.8 — February 15, 2023

### Improvements

-   Increase support for importing ICS files with dates that do not follow the RFC 5545 standard (including dates missing seconds and ISO-formatted dates)
-   Redesign of app notifications
-   Minor UI improvements

## Release: 5.0.7 — January 25, 2023

### Improvements

-   Add reload mechanism for events that failed to be decrypted because of network issues
-   Improve notification update system for all calendar types

### Fixes

-   Update for some time zones conversion to canonical time zones

## Release: 5.0.6 — December 14, 2022

### New features

-   Manage your contacts from the new side panel

### Improvements

-   Better display on mobile view

### Fixes

-   Fix issue where some white spaces in event details could be trimmed when saving

## Release: 5.0.5 — October 5, 2022

### Improvements

-   Minor UI and UX improvements

## Release: 5.0.4 — August 24, 2022

### New features

-   Add invitations from the inbox to the calendar and mark as pending

### Improvements

-   Reorganisation of the calendar settings
-   Improve the performance and security of crypto operations
-   Use account primary time zone when importing events without time zone (floating time)

## Release: 5.0.3 — July 20, 2022

### New features

-   Draggable popover on event creation
-   Reminders for events in subscribed calendars

### Improvements

-   Validate calendar subscription links as soon as the URL is entered
-   Add possibility to disable the setting for time zone auto-detection directly from the pop-up

### Fixes

-   Fix issue where the app would not load because of calendars with a broken setup

## Release: 5.0.2 — June 22, 2022

### Improvements

-   Make ICS parsing more robust
-   Make displayed GMT offset more representative of the date range in view

# Introducing Proton's refreshed look.

## Release: 5.0.0 — May 25, 2022

As we continue to make privacy accessible to everyone, we've updated our apps to provide you with an even better experience with our services.

Proton - Privacy by default.

## Release: 4.0.9 — Mar 30, 2022

### Improvements

-   Improve the visibility of today indicator
-   Improve calendar creation

### Fixes

-   Improve support for invalid ICS formats that other providers sometimes use (Office Holidays Ltd.)
-   Fix wrong conversion of some localized time zones that Microsoft Exchange 2010 uses

## Release: 4.0.8 — Feb 9, 2022

### New features

-   Duplicate event to quickly create the same event on another date

### Improvements

-   Update modals designs
-   Reactivate calendar keys automatically when opening an invitation in mail

### Fixes

-   Fix time zone aliases conversion

## Release: 4.0.7 — Jan 13, 2022

### New features

-   Drag and drop an ICS file into calendar view to import it
-   Select language in which event invites and RSVPs are sent
-   Allow organiser to add participants replying to forwarded invitations directly from Mail

### Improvements

-   Improve the browser print rendering of calendar
-   Differentiate invitation emails with calendar icons in the mailbox
-   Extend supported time zone formats (Bluejeans, Mozilla and others using globally defined time zone registries)
-   Support certain ICS formats that would result in the error "File does not have the right format" when trying to import them
-   Better handling of large ICS files import
-   Minor UI and accessibility improvements

### Fixes

-   Do not display Calendar invitation information header for bounced emails

## Release: 4.0.6 — Dec 1, 2021

### New features

-   Enable email notifications option for events and calendar default settings

### Improvements

-   Add shortcuts in the sidebar to import and subscribe to calendars
-   Support ICS files with no version
-   Fit more text in event cells for events with long duration
-   Reduce width of event popover to block less space in the UI
-   Other minor UI and accessibility improvements

## Release: 4.0.5 — November 3, 2021

### Improvements

-   Allow importing invitations
-   Do not leak event title in the email subject when replying to invitations from Calendar
-   Fix "not synced" status that could be displayed erroneously for subscribed calendars under some circumstances
-   Support events with DURATION field via import
-   Improve support for non-standard replies sent by Yahoo Calendar
-   Update favicon without reloading the tab when day changes
-   Minor UI and accessibility improvements

### Fixes

-   Fix faulty keyboard navigation in time zone selector
-   Allow adding invitations with unsupported email addresses to Calendar when replying to them
-   Fix issue where editing multiple times a recurring event with the "this and following" option would result in an error

## Release: 4.0.4 — September 22, 2021

### Improvements

-   Add participants from reduced event creation form
-   Redesign of event popover

### Fixes

-   Ask for confirmation when opening a link in an event if setting is on for emails
-   Answer invitation from alias email address when invited

## Release: 4.0.3 — August 25, 2021

### New features

-   Subscribe to external calendar via link

### Improvements

-   Invert day name and date in calendar view

### Fixes

-   Redirect Myanmar time zone to Indian/Cocos
-   Handle case where an email address is disabled under one user and active under another in the same organisation
-   Extend support to recognize invitations formatted with floating times

## Release: 4.0.2 — July 28, 2021

### Improvements

-   Add shortcuts for calendar creation, edition and sharing from the calendar sidebar
-   Allow import of events with missing UID
-   Design improvements in mini calendar
-   Make the calendar linked address more obvious in the settings list of calendars
-   Add calendar color in the calendar select when creating or editing an event

### Fixes

-   Trigger browser notifications at the right time after computer sleep mode
-   Various small bug fixes

## Release: 4.0.1 — June 30, 2021

### New features

-   Enable the search of time zones

### Improvements

-   Minor UI improvements

### Fixes

-   Fix the display of sent invitations with specific security settings that would show as encrypted in the sent folder

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
