import { c } from 'ttag';

import { SectionConfig } from '@proton/components';
import {CALENDAR_SETTINGS_ROUTE, CALENDAR_SETTINGS_SECTION_ID} from '@proton/shared/lib/calendar/constants';
import { CALENDAR_APP_NAME } from '@proton/shared/lib/constants';

/**
 * Calendar config is coupled to CalendarSidebar.
 * Any additional section must also be added to CalendarSidebar.
 */
export const getCalendarAppRoutes = (showSubscribedCalendars: boolean, showInvitationSettings: boolean) => {
    return <const>{
        header: CALENDAR_APP_NAME,
        routes: {
            general: <SectionConfig>{
                text: c('Link').t`General`,
                to: CALENDAR_SETTINGS_ROUTE.GENERAL,
                icon: 'grid-2',
                subsections: [
                    {
                        text: c('Title').t`Time zone`,
                        id: CALENDAR_SETTINGS_SECTION_ID.TIME_ZONE,
                    },
                    {
                        text: c('Title').t`Layout`,
                        id: CALENDAR_SETTINGS_SECTION_ID.LAYOUT,
                    },
                    {
                        text: c('Title').t`Invitations`,
                        id: CALENDAR_SETTINGS_SECTION_ID.INVITATIONS,
                        available: showInvitationSettings,
                    },
                    {
                        text: c('Title').t`Theme`,
                        id: CALENDAR_SETTINGS_SECTION_ID.THEME,
                    },
                ],
            },
            calendars: <SectionConfig>{
                text: c('Link').t`Calendars`,
                to: CALENDAR_SETTINGS_ROUTE.CALENDARS,
                icon: 'calendar-grid',
                subsections: [
                    {
                        text: c('Title').t`My calendars`,
                        id: CALENDAR_SETTINGS_SECTION_ID.PERSONAL_CALENDARS,
                    },
                    {
                        text: c('Title').t`Subscribed calendars`,
                        id: CALENDAR_SETTINGS_SECTION_ID.SUBSCRIBED_CALENDARS,
                        available: showSubscribedCalendars,
                    },
                ],
            },
            interops: <SectionConfig>{
                text: c('Link').t`Import/export`,
                title: c('Title').t`Import and export`,
                to: CALENDAR_SETTINGS_ROUTE.INTEROPS,
                icon: 'arrow-right-arrow-left',
                subsections: [
                    {
                        text: c('Title').t`Import`,
                        id: CALENDAR_SETTINGS_SECTION_ID.IMPORT,
                    },
                    {
                        text: c('Title').t`Export`,
                        id: CALENDAR_SETTINGS_SECTION_ID.EXPORT,
                    },
                ],
            },
        },
    };
};
