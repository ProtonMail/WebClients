import { useCalendars } from '@proton/components/hooks';
import {
    getIsPersonalCalendar,
    getProbablyActiveCalendars,
    getVisualCalendars,
    sortCalendars,
} from '@proton/shared/lib/calendar/calendar';
import { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import partition from '@proton/utils/partition';

const useUserCalendars = () => {
    const [calendars, loading] = useCalendars();
    const activeCalendars = getProbablyActiveCalendars(sortCalendars(getVisualCalendars(calendars || [])));
    const [personalActiveCalendars] = partition<VisualCalendar>(activeCalendars, getIsPersonalCalendar);

    return [personalActiveCalendars, loading] as const;
};

export default useUserCalendars;
