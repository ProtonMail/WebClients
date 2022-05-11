import {
    PersonalCalendarsSection,
    PrivateMainAreaLoading,
    PrivateMainSettingsArea,
    SectionConfig,
    SubscribedCalendarsSection,
} from '@proton/components/containers';
import { useCalendarShareInvitations } from '@proton/components/hooks';
import { filterOutExpiredInvitations, getPendingInvitations } from '@proton/shared/lib/calendar/share';
import { Address, UserModel } from '@proton/shared/lib/interfaces';
import { SubscribedCalendar, VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

interface Props {
    config: SectionConfig;
    user: UserModel;
    addresses: Address[];
    personalCalendars: VisualCalendar[];
    subscribedCalendars: SubscribedCalendar[];
    defaultCalendar?: VisualCalendar;
    calendarSubscribeUnavailable: boolean;
}

const CalendarsSettingsSection = ({
    config,
    user,
    addresses,
    personalCalendars,
    subscribedCalendars,
    defaultCalendar,
    calendarSubscribeUnavailable,
}: Props) => {
    const { invitations: calendarInvitations, loading } = useCalendarShareInvitations();

    if (loading) {
        return <PrivateMainAreaLoading />;
    }

    return (
        <PrivateMainSettingsArea config={config}>
            <PersonalCalendarsSection
                addresses={addresses}
                user={user}
                calendars={personalCalendars}
                calendarInvitations={filterOutExpiredInvitations(getPendingInvitations(calendarInvitations))}
                defaultCalendar={defaultCalendar}
            />
            <SubscribedCalendarsSection
                addresses={addresses}
                calendars={subscribedCalendars}
                user={user}
                unavailable={calendarSubscribeUnavailable}
            />
        </PrivateMainSettingsArea>
    );
};

export default CalendarsSettingsSection;
