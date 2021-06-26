import { MutableRefObject } from 'react';
import { differenceInCalendarDays } from 'proton-shared/lib/date-fns-utc';
import { EventTargetAction } from './interface';
import { TYPE } from '../../components/calendar/interactions/constants';

export const getInitialTargetEventData = (
    eventTargetActionRef: MutableRefObject<EventTargetAction | undefined>,
    dateRange: [Date, Date]
) => {
    const eventTargetAction = eventTargetActionRef.current;
    if (!eventTargetAction) {
        return;
    }

    const { id, isAllDay, isAllPartDay, startInTzid } = eventTargetAction;

    const isDayGrid = isAllDay || isAllPartDay;
    const [startDateRange, endDateRange] = dateRange;

    const getTimeGridIdx = () => {
        if (startDateRange > startInTzid || startInTzid > endDateRange) {
            return 0;
        }
        return differenceInCalendarDays(startInTzid, startDateRange);
    };

    return {
        targetEventData: {
            id,
            type: isDayGrid ? TYPE.DAYGRID : TYPE.TIMEGRID,
            // Assuming week view is always displayed, so not trying to calculate the idx
            idx: isDayGrid ? 0 : getTimeGridIdx(),
        },
    };
};
