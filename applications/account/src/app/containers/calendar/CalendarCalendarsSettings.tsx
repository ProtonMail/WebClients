import { getIsPersonalCalendar } from 'proton-shared/lib/calendar/subscribe/helpers';
import React from 'react';
import {
    ButtonLike,
    CalendarImportSection,
    CalendarShareSection,
    Card,
    FeatureCode,
    PersonalCalendarsSection,
    SettingsLink,
    SettingsPropsShared,
    SettingsSection,
    SubscribedCalendarsSection,
    useFeature,
} from 'react-components';
import { c } from 'ttag';

import { Address, UserModel } from 'proton-shared/lib/interfaces';
import { Calendar } from 'proton-shared/lib/interfaces/calendar';

import { partition } from 'proton-shared/lib/helpers/array';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';
import PrivateMainSettingsAreaWithPermissions from '../../content/PrivateMainSettingsAreaWithPermissions';

const generalSettingsConfig = (showCalendarSubscription: boolean) => ({
    to: '/calendar/calendars',
    icon: 'calendar',
    text: c('Link').t`Calendars`,
    subsections: [
        {
            text: c('Title').t`My calendars`,
            id: 'my-calendars',
        },
        showCalendarSubscription && {
            text: c('Title').t`Other calendars`,
            id: 'other-calendars',
        },
        {
            text: c('Title').t`Import`,
            id: 'import',
        },
        {
            text: c('Title').t`Share outside Proton`,
            id: 'share',
        },
    ].filter(isTruthy),
});

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
    const [personalCalendars, otherCalendars] = partition<Calendar>(calendars, getIsPersonalCalendar);
    const [personalActiveCalendars] = partition<Calendar>(activeCalendars, getIsPersonalCalendar);
    const [personalDisabledCalendars] = partition<Calendar>(disabledCalendars, getIsPersonalCalendar);
    const { feature: featureUsedCalendarSubscription, loading: loadingUsedCalendarSubscription } = useFeature(
        FeatureCode.CalendarSubscription
    );
    const showCalendarSubscription = !loadingUsedCalendarSubscription && !!featureUsedCalendarSubscription?.Value;

    return (
        <PrivateMainSettingsAreaWithPermissions
            config={generalSettingsConfig(showCalendarSubscription)}
            location={location}
        >
            <PersonalCalendarsSection
                activeAddresses={activeAddresses}
                calendars={personalCalendars}
                activeCalendars={personalActiveCalendars}
                disabledCalendars={personalDisabledCalendars}
                defaultCalendar={defaultCalendar}
                user={user}
            />
            {showCalendarSubscription && (
                <SubscribedCalendarsSection activeAddresses={activeAddresses} calendars={otherCalendars} user={user} />
            )}
            <CalendarImportSection
                activeCalendars={personalActiveCalendars}
                defaultCalendar={defaultCalendar}
                user={user}
            />

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
                <CalendarShareSection calendars={personalCalendars} defaultCalendar={defaultCalendar} user={user} />
            )}
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default CalendarCalendarsSettings;
