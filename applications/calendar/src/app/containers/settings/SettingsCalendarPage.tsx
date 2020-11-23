import React, { MutableRefObject } from 'react';
import { PrivateMainSettingsArea, SettingsPropsShared, RelatedSettingsSection, AppLink } from 'react-components';
import { Address } from 'proton-shared/lib/interfaces';
import { Calendar } from 'proton-shared/lib/interfaces/calendar';
import { c } from 'ttag';
import { APPS } from 'proton-shared/lib/constants';

import { CalendarsEventsCache } from '../calendar/eventStore/interface';
import CalendarsSection from './section/CalendarsSection';
import ImportSection from './section/ImportSection';

export const getCalendarSettingsPage = () => {
    return {
        to: '/settings/calendars',
        icon: 'calendar',
        text: c('Link').t`Calendars`,
        subsections: [
            {
                text: c('Title').t`Calendars`,
                id: 'calendars',
            },
            {
                text: c('Title').t`Import`,
                id: 'import',
            },
            {
                text: c('Title').t`Related features`,
                id: 'related-features',
                hide: true,
            },
        ],
    };
};

interface Props extends SettingsPropsShared {
    activeAddresses: Address[];
    calendars: Calendar[];
    disabledCalendars: Calendar[];
    activeCalendars: Calendar[];
    defaultCalendar?: Calendar;
    calendarsEventsCacheRef: MutableRefObject<CalendarsEventsCache>;
}
const SettingsCalendarPage = ({
    calendarsEventsCacheRef,
    activeAddresses,
    calendars,
    disabledCalendars,
    activeCalendars,
    defaultCalendar,
    setActiveSection,
    location,
}: Props) => {
    const { text, subsections } = getCalendarSettingsPage();
    return (
        <PrivateMainSettingsArea
            title={text}
            location={location}
            setActiveSection={setActiveSection}
            subsections={subsections}
        >
            <CalendarsSection
                activeAddresses={activeAddresses}
                calendars={calendars}
                activeCalendars={activeCalendars}
                disabledCalendars={disabledCalendars}
                defaultCalendar={defaultCalendar}
            />
            <ImportSection
                activeCalendars={activeCalendars}
                defaultCalendar={defaultCalendar}
                calendarsEventsCacheRef={calendarsEventsCacheRef}
            />
            <RelatedSettingsSection
                list={[
                    {
                        icon: 'email',
                        text: c('Info').t`Import your old messages and folders into ProtonMail.`,
                        link: (
                            <AppLink
                                to="/settings/import#start-import"
                                toApp={APPS.PROTONMAIL}
                                className="pm-button--primary mtauto"
                            >
                                {c('Action').t`Import mailbox`}
                            </AppLink>
                        ),
                    },
                    {
                        icon: 'contacts',
                        text: c('Info').t`Import your address book or individual contacts into ProtonContacts.`,
                        link: (
                            <AppLink
                                to="/settings/import"
                                toApp={APPS.PROTONCONTACTS}
                                className="pm-button--primary mtauto"
                            >
                                {c('Action').t`Import contacts`}
                            </AppLink>
                        ),
                    },
                ]}
            />
        </PrivateMainSettingsArea>
    );
};

export default SettingsCalendarPage;
