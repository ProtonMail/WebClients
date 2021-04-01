# [4.0.0-beta.16] - 2021-04-08

## Added
- Open ProtonCalendar to free users

## Updated
- Color taxonomy for buttons
- Optimizations for changing answer or updating notifications of invited events

## Fixed
- End date for all-day events was not properly changed when start date changed
- Reset participation status only if necessary when changing answer for complex recurring invitations

# [4.0.0-beta.15] - 2021-03-24

## Updated
- Add event weekday to mail invitations

## Fixed
- Correctly display invitation update when the ICS does not contain attendee part-stat
- Various small fixes

# [4.0.0-beta.14] - 2021-02-25
## Added
- Add plain text body for invitations 
- Recognise secure links in event description

## Updated
- Keep notifications when changing the calendar of an event
- Improve participation status design
- Improve selectors design

## Fixed
- Merge event duplicate notifications

# [4.0.0-beta.13] - 2021-02-09
## Updated
- Add participants to events without pressing enter

## Fixed
- Recognize properly capitalized email addresses in invites

# [4.0.0-beta.12] - 2021-01-21
## Added
- Send invitations from ProtonCalendar

## Updated
- Harmonise answer for recurring events with single edits for all other calendar providers
- Speed-up email replies
- Align today icon with mobile

## Fixed
- Add more timezones support
---
# [4.0.0-beta.11] - 2020-12-03
## Updated
- Improve display of participants in event popover
- Hide email notifications for imported events until they are supported

## Fixed
- Fix creation of badly formatted events from Apple Calendar when answering an invite
- Add invite organiser to contacts when answering if automatic creation of contacts is on
- Fix responsive display of event popover
- Fix incorrect confirmation modal when deleting an invite from the edit modal
---
# [4.0.0-beta.10] - 2020-11-18
## Fixed
- Add fields SUMMARY, RRULE and LOCATION to ics when replying invites for a better display of the answer by other providers
- Add organiser to contacts when "Automatically save contacts" is enabled
- Fix alignment of notifications in event creation form
---
# [4.0.0-beta.9] - 2020-11-12
## Added

- Display answered invitation
- Change answer of invitation
- Edit invitation notifications and calendar
- Update automatically answered invitations
- Delete invitations from calendar

## Fixed
- Disable clicking in calendar view when event is being saved
- Fix link for showing timezones selector during event creation when start and end timezones are different
- Fix display of special format links in event description
---
# [4.0.0-beta.8] - 2020-09-29

## Added

-   Add sequence to events

## Updated

-   Update design of event creation form
-   Update import (overwrite events on import; restrict importing certain unsupported events; ability to import files with non-standard line-break formatting)

## Fixed

-   Bug hiding timezones in event modal

---

# [4.0.0-beta.7] - 2020-07-27

## Updated

-   Update the header and navigation menu

---

# [4.0.0-beta.6] - 2020-07-09

## Updated

-   Update of the event fetching flow

---

# [4.0.0-beta.5] - 2020-06-30

## Added

-   Import of calendars from a .ics file
-   Change the calendar for all the events of a recurring event

## Updated

-   Redesign of event details popover

---

# [4.0.0-beta.4] - 2020-06-15

## Updated

-   Update API calls
-   Improvement of recurring events edit warning
-   Redesign of event creation small modal

---

# [4.0.0-beta.3] - 2020-05-28

## Fixed

-   Remove reminders after event start time

---

# [4.0.0-beta.2] - 2020-05-13

## Added

-   Update recurring events:
    -   Add option to delete all events of a series
    -   Add edit one occurrence of a series
    -   Add edit selected and all future occurrences of a series
    -   Add edit all occurrences of a series
-   Display push notification state in settings
-   Set reminders before, after or at the same time of the event

## Updated

-   Increase limit of events description to 3000 characters
-   Update of events lazy load state
-   Allow calendar name length starting from 1 character
-   Suffix event UID with proton domain

## Fixed

-   Remove fields populated with whitespaces in event display
-   Close only selected event when list of events is displayed
-   Take into account DST changes for event reminders
-   Load the user-selected default view after calendar creation

---

# [4.0.0-beta.1] - 2020-03-11

## Added

-   Creation of multiple calendars (up to 10 per user)
-   Set and modify default calendar
-   Change calendar of existing event
-   Create and view event with custom daily occurrence
-   Custom recurrence of events (custom monthly, weekly & daily)
-   Edit recurring events:
    -   Delete this event
    -   Delete this and future events
-   Disable calendar when e-mail address disabled
-   Delete calendar

## Fixed

-   Design fix on Safari and for responsive displays

---

# Beta launch [4.0.0-beta.0] - 2019-12-30

Release of ProtonCalendar on Beta https://protonmail.com/blog/protoncalendar-beta-announcement/

## Added

-   Display Calendar with a day, week, month and multi-days views
-   Generate calendar keys
-   Create and delete single events
-   Create recurrent events weekly, monthly, yearly
-   Setup of primary and secondary timezones
-   Detect automatically time zone changes
-   Trigger desktop notifications for calendar events
-   Calendar basic settings (name, color, description...)
