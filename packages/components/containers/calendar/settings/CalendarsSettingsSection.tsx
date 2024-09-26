import { getHasUserReachedCalendarsLimit } from '@proton/shared/lib/calendar/calendarLimits';
import {
    filterOutExpiredInvitations,
    getPendingInvitations,
} from '@proton/shared/lib/calendar/sharing/shareProton/shareProton';
import { getActiveAddresses } from '@proton/shared/lib/helpers/address';
import type { Address, Subscription, UserModel } from '@proton/shared/lib/interfaces';
import type {
    HolidaysDirectoryCalendar,
    SubscribedCalendar,
    VisualCalendar,
} from '@proton/shared/lib/interfaces/calendar';

import useCalendarShareInvitations from '../../../hooks/useCalendarShareInvitations';
import MyCalendarsSection from '../../calendar/settings/MyCalendarsSection';
import PrivateMainAreaLoading from '../../layout/PrivateMainAreaLoading';
import PrivateMainSettingsArea from '../../layout/PrivateMainSettingsArea';
import type { SectionConfig } from '../../layout/interface';
import OtherCalendarsSection from '../settings/OtherCalendarsSection';

export interface CalendarsSettingsSectionProps {
    config: SectionConfig;
    user: UserModel;
    subscription?: Subscription;
    addresses: Address[];
    calendars: VisualCalendar[];
    myCalendars: VisualCalendar[];
    subscribedCalendars: SubscribedCalendar[];
    sharedCalendars: VisualCalendar[];
    holidaysCalendars: VisualCalendar[];
    holidaysDirectory?: HolidaysDirectoryCalendar[];
    unknownCalendars: VisualCalendar[];
    defaultCalendar?: VisualCalendar;
}

const CalendarsSettingsSection = ({
    config,
    user,
    subscription,
    addresses,
    calendars,
    myCalendars,
    subscribedCalendars,
    sharedCalendars,
    holidaysCalendars,
    holidaysDirectory,
    unknownCalendars,
    defaultCalendar,
}: CalendarsSettingsSectionProps) => {
    const { invitations: calendarInvitations, loading: loadingCalendarInvitations } = useCalendarShareInvitations();
    const { isCalendarsLimitReached, isOtherCalendarsLimitReached } = getHasUserReachedCalendarsLimit(
        calendars,
        !user.hasPaidMail
    );
    const canAddCalendar = user.hasNonDelinquentScope && getActiveAddresses(addresses).length > 0;

    if (loadingCalendarInvitations) {
        return <PrivateMainAreaLoading />;
    }

    return (
        <PrivateMainSettingsArea config={config}>
            <MyCalendarsSection
                myCalendars={myCalendars}
                defaultCalendar={defaultCalendar}
                addresses={addresses}
                user={user}
                subscription={subscription}
                canAdd={canAddCalendar}
                isCalendarsLimitReached={isCalendarsLimitReached}
            />
            <OtherCalendarsSection
                subscribedCalendars={subscribedCalendars}
                sharedCalendars={sharedCalendars}
                calendarInvitations={filterOutExpiredInvitations(getPendingInvitations(calendarInvitations))}
                holidaysCalendars={holidaysCalendars}
                holidaysDirectory={holidaysDirectory}
                unknownCalendars={unknownCalendars}
                addresses={addresses}
                subscription={subscription}
                user={user}
                canAdd={canAddCalendar}
                isCalendarsLimitReached={isOtherCalendarsLimitReached}
            />
        </PrivateMainSettingsArea>
    );
};

export default CalendarsSettingsSection;
