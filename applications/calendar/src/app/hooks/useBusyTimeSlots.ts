import { useEffect, useRef } from 'react';

import { getUnixTime } from 'date-fns';

import useBusyTimeSlotsAvailable from '@proton/components/containers/calendar/hooks/useBusyTimeSlotsAvailable';
import { VIEWS } from '@proton/shared/lib/calendar/constants';

import { CalendarViewEventTemporaryEvent } from '../containers/calendar/interface';
import { busyTimeSlotsActions } from '../store/busyTimeSlots/busyTimeSlotsSlice';
import { useCalendarDispatch, useCalendarStore } from '../store/hooks';

interface Props {
    temporaryEvent: CalendarViewEventTemporaryEvent | undefined;
    dateRange: [Date, Date];
    tzid: string;
    view: VIEWS;
    now: Date;
}

const useBusyTimeSlots = ({ temporaryEvent, dateRange, now, tzid, view }: Props) => {
    const preventFetchRef = useRef(false);
    const isBusyTimeSlotsAvailable = useBusyTimeSlotsAvailable();
    const store = useCalendarStore();
    const dispatch = useCalendarDispatch();

    const updateMetadata = () => {
        if (isBusyTimeSlotsAvailable) {
            dispatch(
                busyTimeSlotsActions.setMetadata({
                    viewStartDate: getUnixTime(dateRange[0]),
                    viewEndDate: getUnixTime(dateRange[1]),
                    now: getUnixTime(now),
                    tzid,
                    view,
                })
            );
        }
    };

    useEffect(() => {
        updateMetadata();
    }, [view, dateRange[0], dateRange[1]]);

    useEffect(() => {
        if (!isBusyTimeSlotsAvailable) {
            return;
        }

        const attendees = temporaryEvent?.tmpData?.attendees || [];
        if (attendees.length > 0) {
            if (preventFetchRef.current) {
                preventFetchRef.current = false;
                return;
            }

            if (!store.getState().busyTimeSlots.metadata && view !== VIEWS.MONTH) {
                updateMetadata();
            }
            dispatch(busyTimeSlotsActions.setAttendees(attendees.map((attendee) => attendee.email)));
        }

        if (!temporaryEvent) {
            dispatch(busyTimeSlotsActions.reset());
            preventFetchRef.current = false;
        }
    }, [temporaryEvent?.tmpData.attendees.join(',')]);

    return preventFetchRef;
};

export default useBusyTimeSlots;
