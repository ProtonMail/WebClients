import { useEffect, useRef } from 'react';

import { getUnixTime } from 'date-fns';

import { useBusySlotsAvailable } from '@proton/components';
import { VIEWS } from '@proton/shared/lib/calendar/constants';

import type { CalendarViewEventTemporaryEvent } from '../containers/calendar/interface';
import { busySlotsActions, busySlotsSliceName } from '../store/busySlots/busySlotsSlice';
import { useCalendarDispatch, useCalendarStore } from '../store/hooks';

interface Props {
    temporaryEvent: CalendarViewEventTemporaryEvent | undefined;
    dateRange: [Date, Date];
    tzid: string;
    view: VIEWS;
}

const useBusySlots = ({ temporaryEvent, dateRange, tzid, view }: Props) => {
    const preventFetchRef = useRef(false);
    const isBusySlotsAvailable = useBusySlotsAvailable();
    const store = useCalendarStore();
    const dispatch = useCalendarDispatch();

    const updateMetadata = () => {
        if (isBusySlotsAvailable) {
            dispatch(
                busySlotsActions.setMetadata({
                    viewStartDate: getUnixTime(dateRange[0]),
                    viewEndDate: getUnixTime(dateRange[1]),
                    tzid,
                    view,
                })
            );
        }
    };

    useEffect(() => {
        updateMetadata();
    }, [view, dateRange[0], dateRange[1], tzid]);

    useEffect(() => {
        if (!isBusySlotsAvailable) {
            return;
        }

        const attendees = temporaryEvent?.tmpData?.attendees || [];
        if (attendees.length > 0) {
            if (preventFetchRef.current) {
                preventFetchRef.current = false;
                return;
            }

            if (!store.getState()[busySlotsSliceName].metadata && view !== VIEWS.MONTH) {
                updateMetadata();
            }
            dispatch(busySlotsActions.setAttendees(attendees.map((attendee) => attendee.email)));
        }

        if (!temporaryEvent) {
            dispatch(busySlotsActions.reset());
            preventFetchRef.current = false;
        }
    }, [temporaryEvent?.tmpData.attendees.join(',')]);

    return preventFetchRef;
};

export default useBusySlots;
