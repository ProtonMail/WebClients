import { useEffect, useMemo } from 'react';

import { useCalendarModelEventManager } from '@proton/components';
import type { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

const usePauseCalendarEventLoop = (activeCalendars: VisualCalendar[], condition: boolean) => {
    const { start, stop } = useCalendarModelEventManager();
    const calendarIDs = useMemo(() => activeCalendars.map(({ ID }) => ID), [activeCalendars]);

    useEffect(() => {
        if (!calendarIDs.length) {
            return;
        }

        if (condition) {
            // Pause calendar event loop
            stop(calendarIDs);
        } else {
            // Resume calendar event loop
            start(calendarIDs);
        }
    }, [condition, calendarIDs]);
};

export default usePauseCalendarEventLoop;
