import React from 'react';
import { SettingsPropsShared, CalendarsSection, CalendarImportSection } from 'react-components';
import { c } from 'ttag';

import { Address, UserModel } from 'proton-shared/lib/interfaces';
import { Calendar } from 'proton-shared/lib/interfaces/calendar';

import PrivateMainSettingsAreaWithPermissions from '../../content/PrivateMainSettingsAreaWithPermissions';

const generalSettingsConfig = {
    to: '/calendar/calendars',
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
    ],
};

interface Props extends SettingsPropsShared {
    activeAddresses: Address[];
    calendars: Calendar[];
    disabledCalendars: Calendar[];
    activeCalendars: Calendar[];
    defaultCalendar?: Calendar;
    user: UserModel;
}

const CalendarCalendarsSettings = ({
    location,
    activeAddresses,
    calendars,
    activeCalendars,
    disabledCalendars,
    defaultCalendar,
    user,
}: Props) => {
    return (
        <PrivateMainSettingsAreaWithPermissions config={generalSettingsConfig} location={location}>
            <CalendarsSection
                activeAddresses={activeAddresses}
                calendars={calendars}
                activeCalendars={activeCalendars}
                disabledCalendars={disabledCalendars}
                defaultCalendar={defaultCalendar}
                user={user}
            />
            <CalendarImportSection activeCalendars={activeCalendars} defaultCalendar={defaultCalendar} user={user} />
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default CalendarCalendarsSettings;
