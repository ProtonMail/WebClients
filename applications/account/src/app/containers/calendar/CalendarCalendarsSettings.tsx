import React from 'react';
import {
    SettingsPropsShared,
    CalendarsSection,
    CalendarImportSection,
    CalendarShareSection,
    Card,
    ButtonLike,
    SettingsLink,
    SettingsSection,
} from 'react-components';
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
        {
            text: c('Title').t`Share outside Proton`,
            id: 'share',
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
            {user.isFree ? (
                <SettingsSection>
                    <Card className="mb1">
                        <div className="flex flex-nowrap flex-align-items-center">
                            <p className="flex-item-fluid mt0 mb0 pr2">
                                {c('Upgrade notice')
                                    .t`Upgrade to a paid plan to share your calendar with anyone with a link.`}
                            </p>
                            <ButtonLike as={SettingsLink} path="/dashboard" color="norm" shape="solid" size="small">
                                {c('Action').t`Upgrade`}
                            </ButtonLike>
                        </div>
                    </Card>
                </SettingsSection>
            ) : (
                <CalendarShareSection calendars={calendars} defaultCalendar={defaultCalendar} user={user}/>
            )}
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default CalendarCalendarsSettings;
