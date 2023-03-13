import { getPersonalCalendars } from '@proton/shared/lib/calendar/calendar';
import { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

import CalendarContainerViewBlurred from '../calendar/CalendarContainerViewBlurred';
import UnlockCalendarsModal from './UnlockCalendarsModal';

interface Props {
    calendars: VisualCalendar[];
    calendarsToUnlock: VisualCalendar[];
    onDone: () => void;
}
const UnlockCalendarsContainer = ({ calendars, calendarsToUnlock, onDone }: Props) => {
    // Don't take into account subscribed calendars to decide whether to show a partial list of the calendars that need reset.
    // Although we do need to reset the calendar keys for those, they will be immediately re-synced so the users should not see them "locked"
    const numberOfPersonalCalendars = getPersonalCalendars(calendars).length;
    const numberOfPersonalCalendarsToUnlock = getPersonalCalendars(calendarsToUnlock).length;
    const hasOnlySubscribedCalendarsToUnlock = numberOfPersonalCalendarsToUnlock === 0;
    const unlockAll =
        hasOnlySubscribedCalendarsToUnlock || numberOfPersonalCalendars === numberOfPersonalCalendarsToUnlock;

    return (
        <>
            <UnlockCalendarsModal calendars={calendarsToUnlock} unlockAll={unlockAll} onDone={onDone} />
            <CalendarContainerViewBlurred />
        </>
    );
};

export default UnlockCalendarsContainer;
