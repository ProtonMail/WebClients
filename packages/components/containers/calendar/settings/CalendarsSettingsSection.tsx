import { getHasUserReachedCalendarsLimit } from '@proton/shared/lib/calendar/calendarLimits';
import {
    filterOutExpiredInvitations,
    getPendingInvitations,
} from '@proton/shared/lib/calendar/sharing/shareProton/shareProton';
import { getActiveAddresses } from '@proton/shared/lib/helpers/address';
import { Address, UserModel } from '@proton/shared/lib/interfaces';
import { SubscribedCalendar, VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

import { useCalendarShareInvitations } from '../../../hooks';
import { PersonalCalendarsSection, PrivateMainAreaLoading, PrivateMainSettingsArea, SectionConfig } from '../../index';
import OtherCalendarsSection from '../settings/OtherCalendarsSection';

interface Props {
    config: SectionConfig;
    user: UserModel;
    addresses: Address[];
    calendars: VisualCalendar[];
    myCalendars: VisualCalendar[];
    subscribedCalendars: SubscribedCalendar[];
    sharedCalendars: VisualCalendar[];
    unknownCalendars: VisualCalendar[];
    defaultCalendar?: VisualCalendar;
    calendarSubscribeUnavailable: boolean;
}

const CalendarsSettingsSection = ({
    config,
    user,
    addresses,
    calendars,
    myCalendars,
    subscribedCalendars,
    sharedCalendars,
    unknownCalendars,
    defaultCalendar,
    calendarSubscribeUnavailable,
}: Props) => {
    const { invitations: calendarInvitations, loading } = useCalendarShareInvitations();
    const { isCalendarsLimitReached, isOtherCalendarsLimitReached } = getHasUserReachedCalendarsLimit(
        calendars,
        !user.hasPaidMail
    );
    const canAddCalendar = user.hasNonDelinquentScope && getActiveAddresses(addresses).length > 0;

    if (loading) {
        return <PrivateMainAreaLoading />;
    }

    return (
        <PrivateMainSettingsArea config={config}>
            <PersonalCalendarsSection
                user={user}
                calendars={myCalendars}
                defaultCalendar={defaultCalendar}
                canAdd={canAddCalendar}
                isCalendarsLimitReached={isCalendarsLimitReached}
            />
            <OtherCalendarsSection
                addresses={addresses}
                user={user}
                subscribedCalendars={subscribedCalendars}
                sharedCalendars={sharedCalendars}
                calendarInvitations={filterOutExpiredInvitations(getPendingInvitations(calendarInvitations))}
                unknownCalendars={unknownCalendars}
                canAdd={canAddCalendar}
                isCalendarsLimitReached={isOtherCalendarsLimitReached}
                unavailable={calendarSubscribeUnavailable}
            />
        </PrivateMainSettingsArea>
    );
};

export default CalendarsSettingsSection;
