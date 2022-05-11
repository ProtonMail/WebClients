import { c } from 'ttag';
import { SectionConfig } from '@proton/components';
import {APPS, CALENDAR_APP_NAME} from '@proton/shared/lib/constants';
import {getSlugFromApp} from "@proton/shared/lib/apps/slugHelper";
import {validateBase64string} from "@proton/shared/lib/helpers/encoding";
import { CALENDAR_SETTINGS_SUBSECTION_ID } from '@proton/shared/lib/calendar/constants';

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
                to: '/general',
                icon: 'grid-2',
                subsections: [
                    {
                        text: c('Title').t`Time zone`,
                        id: 'time',
                    },
                    {
                        text: c('Title').t`Layout`,
                        id: 'layout',
                    },
                    {
                        text: c('Title').t`Invitations`,
                        id: 'invitations',
                        available: showInvitationSettings,
                    },
                    {
                        text: c('Title').t`Theme`,
                        id: 'theme',
                    },
                ],
            },
            calendars: <SectionConfig>{
                text: c('Link').t`Calendars`,
                to: '/calendars',
                icon: 'calendar-grid',
                subsections: [
                    {
                        text: c('Title').t`My calendars`,
                        id: CALENDAR_SETTINGS_SUBSECTION_ID.PERSONAL_CALENDARS,
                    },
                    {
                        text: c('Title').t`Subscribed calendars`,
                        id: CALENDAR_SETTINGS_SUBSECTION_ID.SUBSCRIBED_CALENDARS,
                        available: showSubscribedCalendars,
                    },
                ],
            },
            interops: <SectionConfig>{
                text: c('Link').t`Import/export`,
                title: c('Title').t`Import and export`,
                to: '/import-export',
                icon: 'arrow-right-arrow-left',
                subsections: [
                    {
                        text: c('Title').t`Import`,
                        id: CALENDAR_SETTINGS_SUBSECTION_ID.IMPORT,
                    },
                    {
                        text: c('Title').t`Export`,
                        id: CALENDAR_SETTINGS_SUBSECTION_ID.EXPORT,
                    },
                ],
            },
        },
    };
};

export const getIsSingleCalendarSection = (pathname: string, calendarsSectionTo: string) => {
    // The single calendar section is accessed via /calendar/calendars/calendarId
    const calendarsSectionPath = `/${getSlugFromApp(APPS.PROTONCALENDAR)}${calendarsSectionTo}`;

    const regexString = `^${calendarsSectionPath}/(.*)`.replaceAll('/', '\\/');
    const match = ((new RegExp(regexString)).exec(pathname) || [])[1];
    if (!match) {
        return false;
    }

    return validateBase64string(match, true);
};
