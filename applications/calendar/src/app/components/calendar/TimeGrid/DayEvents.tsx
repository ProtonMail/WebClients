import React, { Ref, useMemo } from 'react';
import { isNextDay } from '@proton/shared/lib/date-fns-utc';
import { HOUR } from '@proton/shared/lib/constants';

import { layout, LayoutEvent } from '../layout';
import { toPercent } from '../mouseHelpers/mathHelpers';
import getIsBeforeNow from '../getIsBeforeNow';
import PartDayEvent from '../../events/PartDayEvent';
import { CalendarViewEvent, TargetEventData } from '../../../containers/calendar/interface';

/**
 * Splits 2-day events into parts that represent the actual length in the UI
 * and determines whether those parts are less than an hour in length or not
 */
const getIsEventPartLessThanAnHour = ({ start, end, colEnd }: { start: Date; end: Date; colEnd: number }) => {
    const eventPartEnd = new Date(end);
    const eventPartStart = new Date(start);

    if (isNextDay(start, end)) {
        // The event part ends at the end of the day
        if (colEnd === 24 * 60) {
            eventPartEnd.setUTCHours(0, 0, 0, 0);
        } else {
            eventPartStart.setUTCDate(end.getUTCDate());
            eventPartStart.setUTCHours(0, 0, 0, 0);
        }
    }

    return +eventPartEnd - +eventPartStart < HOUR;
};

interface Props {
    tzid: string;
    now: Date;
    events: CalendarViewEvent[];
    eventsInDay: LayoutEvent[];
    totalMinutes: number;
    targetEventData?: TargetEventData;
    targetEventRef?: Ref<HTMLDivElement>;
    formatTime: (date: Date) => string;
    dayIndex: number;
}
const DayEvents = ({
    tzid,
    now,
    events,
    eventsInDay,
    totalMinutes,
    targetEventData,
    targetEventRef,
    formatTime,
    dayIndex,
}: Props) => {
    const eventsLaidOut = useMemo(() => {
        return layout(eventsInDay).map(({ column, columns }, i) => {
            const { start, end } = eventsInDay[i];

            const top = start / totalMinutes;
            const height = (end - start) / totalMinutes;

            const width = 1 / columns;
            const left = column * width;

            return {
                top: toPercent(top),
                left: toPercent(left),
                height: toPercent(height),
                width: toPercent(width),
            };
        });
    }, [eventsInDay, totalMinutes]);

    if (!Array.isArray(eventsInDay)) {
        return null;
    }

    const result = eventsInDay.map((eventTimeDay, i) => {
        const { idx, end: colEnd } = eventTimeDay;
        const event = events[idx];
        const { start, end } = event;

        const style = eventsLaidOut[i];

        const isTemporary = event.id === 'tmp';
        const isSelected = targetEventData ? event.id === targetEventData.id : false;
        const isThisSelected =
            (isSelected && isTemporary) || (isSelected && targetEventData && dayIndex === targetEventData.idx);

        const eventRef = isThisSelected ? targetEventRef : undefined;

        const isEventPartLessThanAnHour = getIsEventPartLessThanAnHour({ start, end, colEnd });
        const isBeforeNow = getIsBeforeNow(event, now);

        return (
            <PartDayEvent
                isEventPartLessThanAnHour={isEventPartLessThanAnHour}
                event={event}
                style={style}
                key={event.id}
                formatTime={formatTime}
                eventRef={eventRef}
                isSelected={isSelected}
                isBeforeNow={isBeforeNow}
                tzid={tzid}
            />
        );
    });

    return <>{result}</>;
};

export default DayEvents;
