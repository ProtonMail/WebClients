import { c } from 'ttag';

import { SectionConfig } from '@proton/components';
import { CALENDAR_SETTINGS_ROUTE, CALENDAR_SETTINGS_SECTION_ID } from '@proton/shared/lib/calendar/constants';
import { APPS, APP_NAMES, CALENDAR_APP_NAME } from '@proton/shared/lib/constants';

/**
 * Calendar config is coupled to CalendarSidebar.
 * Any additional section must also be added to CalendarSidebar.
 */
export const getCalendarAppRoutes = ({ app }: { app: APP_NAMES }) => {
    return <const>{
        available: app === APPS.PROTONCALENDAR,
        header: CALENDAR_APP_NAME,
        routes: {
            desktop: <SectionConfig>{
                text: c('Title').t`Get the apps`,
                to: CALENDAR_SETTINGS_ROUTE.GET_APPS,
                icon: 'arrow-down-line',
                subsections: [
                    { id: CALENDAR_SETTINGS_SECTION_ID.MOBILE_APP, text: c('Title').t`Download the mobile apps` },
                    { id: CALENDAR_SETTINGS_SECTION_ID.DESKTOP_APP, text: c('Title').t`Download the desktop app` },
                ],
            },
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
                        text: c('Title').t`Other calendars`,
                        id: CALENDAR_SETTINGS_SECTION_ID.OTHER_CALENDARS,
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
