import { c } from 'ttag';
import { SectionConfig } from '@proton/components';
import { CALENDAR_APP_NAME } from '@proton/shared/lib/constants';

export const getCalendarAppRoutes = (hasSubscribedCalendars: boolean, showInvitationSettings: boolean) => {
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
                        id: 'my-calendars',
                    },
                    {
                        text: c('Title').t`Subscribed calendars`,
                        id: 'other-calendars',
                        available: hasSubscribedCalendars,
                    },
                    {
                        text: c('Title').t`Import`,
                        id: 'import',
                    },
                    {
                        text: c('Title').t`Share outside Proton`,
                        id: 'share',
                    },
                ],
            },
        },
    };
};
