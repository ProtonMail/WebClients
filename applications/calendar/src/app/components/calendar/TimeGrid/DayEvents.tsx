import { Ref, useMemo } from 'react';
import { isNextDay } from '@proton/shared/lib/date-fns-utc';
import { HOUR } from '@proton/shared/lib/constants';

import { layout, LayoutEvent } from '../layout';
import { toPercent } from '../mouseHelpers/mathHelpers';
import getIsBeforeNow from '../getIsBeforeNow';
import PartDayEvent, { EventSize } from '../../events/PartDayEvent';
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

/**
 * Returns a size flag only for small sizes, meaning below 30 minutes events
 * to decrease font size
 */
const getSize = (duration: number): EventSize | undefined => {
    if (duration < 30 && duration >= 25) {
        return 'sm';
    }
    if (duration < 25 && duration >= 20) {
        return 'xs';
    }
    if (duration < 20) {
        return '2xs';
    }
    // MIN_DURATION is 15, so don't need to get lower
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
    colHeight?: number;
    partDayEventViewStyleValues: { lineHeight: number; padding: number };
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
    colHeight,
    partDayEventViewStyleValues,
}: Props) => {
    const eventsLaidOut = useMemo(() => {
        return layout(eventsInDay).map(({ column, columns }, i) => {
            const { start, end } = eventsInDay[i];

            const top = start / totalMinutes;
            const duration = end - start;
            const height = duration / totalMinutes;

            const width = 1 / columns;
            const left = column * width;

            return {
                height,
                size: getSize(duration),
                style: {
                    top: toPercent(top),
                    left: toPercent(left),
                    height: toPercent(height),
                    width: toPercent(width),
                },
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

        const { style, height: eventHeight, size } = eventsLaidOut[i];

        const isTemporary = event.id === 'tmp';
        const isSelected = targetEventData ? event.id === targetEventData.id : false;
        const isThisSelected =
            (isSelected && isTemporary) || (isSelected && targetEventData && dayIndex === targetEventData.idx);

        const eventRef = isThisSelected ? targetEventRef : undefined;

        const isEventPartLessThanAnHour = getIsEventPartLessThanAnHour({ start, end, colEnd });
        const isBeforeNow = getIsBeforeNow(event, now);

        const lineNumber =
            colHeight === undefined
                ? undefined
                : Math.floor(
                      (colHeight * eventHeight - partDayEventViewStyleValues.padding) /
                          partDayEventViewStyleValues.lineHeight
                  );

        return (
            <PartDayEvent
                isEventPartLessThanAnHour={isEventPartLessThanAnHour}
                event={event}
                style={{
                    ...style,
                    '--line-number': lineNumber || 1,
                    '--line-height': size && colHeight ? colHeight * eventHeight : undefined,
                }}
                key={event.id}
                formatTime={formatTime}
                eventRef={eventRef}
                isSelected={isSelected}
                isBeforeNow={isBeforeNow}
                size={size}
                tzid={tzid}
            />
        );
    });

    return <>{result}</>;
};

export default DayEvents;
