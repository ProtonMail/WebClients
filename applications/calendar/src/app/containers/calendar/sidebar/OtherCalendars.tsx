import { c } from 'ttag';

import { useAddresses } from '@proton/account/addresses/hooks';
import { useUser } from '@proton/account/user/hooks';
import { changeCalendarVisiblity } from '@proton/calendar/calendars/actions';
import SidebarList from '@proton/components/components/sidebar/SidebarList';
import SimpleSidebarListItemHeader from '@proton/components/components/sidebar/SimpleSidebarListItemHeader';
import useLocalState from '@proton/components/hooks/useLocalState';
import { useLoadingByKey } from '@proton/hooks/useLoading';
import type { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import noop from '@proton/utils/noop';

import { useCalendarDispatch } from '../../../store/hooks';
import CalendarSidebarListItems from '../CalendarSidebarListItems';

interface Props {
    calendars: VisualCalendar[];
    otherCalendars: VisualCalendar[];
    headerRef: React.RefObject<HTMLDivElement>;
    loadingSubscribedCalendars: boolean;
}

export const OtherCalendars = ({ calendars, otherCalendars, headerRef, loadingSubscribedCalendars }: Props) => {
    const [user] = useUser();
    const [displayOtherCalendars, toggleOtherCalendars] = useLocalState(
        true,
        `${user.ID || 'item'}-display-otherCalendars`
    );

    const dispatch = useCalendarDispatch();
    const [addresses = []] = useAddresses();
    const [loadingVisibility, withLoadingVisibility] = useLoadingByKey();

    const handleChangeVisibility = async (calendarID: string, display: boolean) => {
        dispatch(changeCalendarVisiblity({ calendarID, display })).catch(noop);
    };

    return otherCalendars.length ? (
        <SidebarList>
            <SimpleSidebarListItemHeader
                toggle={displayOtherCalendars}
                onToggle={toggleOtherCalendars}
                text={c('Link').t`Other calendars`}
                testId="calendar-sidebar:other-calendars-button"
                headerRef={headerRef}
            />
            {displayOtherCalendars && (
                <CalendarSidebarListItems
                    loadingSubscriptionParameters={loadingSubscribedCalendars}
                    calendars={otherCalendars}
                    allCalendars={calendars}
                    onChangeVisibility={(calendarID, value) =>
                        withLoadingVisibility(calendarID, handleChangeVisibility(calendarID, value))
                    }
                    addresses={addresses}
                    loadingVisibility={loadingVisibility}
                />
            )}
        </SidebarList>
    ) : null;
};
