import type { Ref } from 'react';
import { useMemo } from 'react';

import type { CalendarViewBusyEvent, CalendarViewEvent, TargetEventData } from '../../../containers/calendar/interface';
import { isBusySlotEvent } from '../../../helpers/busySlots';
import PartDayBusyEvent from '../../events/PartDayBusyEvent';
import type { EventSize } from '../../events/PartDayEvent';
import PartDayEvent from '../../events/PartDayEvent';
import getIsBeforeNow from '../getIsBeforeNow';
import type { LayoutEvent } from '../layout';
import { layout } from '../layout';
import { toPercent } from '../mouseHelpers/mathHelpers';
import { getEventPartDuration } from './dayEventsHelpers';

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

interface LaidOutEvent {
    height: number;
    size?: EventSize;
    style: React.CSSProperties;
}

const getEventsLaidOut = (layoutEvents: LayoutEvent[], totalMinutes: number): LaidOutEvent[] => {
    return layout(layoutEvents).map(({ column, columns }, i) => {
        const { start, end } = layoutEvents[i];

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
};

interface Props {
    tzid: string;
    now: Date;
    events: (CalendarViewEvent | CalendarViewBusyEvent)[];
    eventsInDay: LayoutEvent[];
    rangeInDay: LayoutEvent[];
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
    rangeInDay,
    totalMinutes,
    targetEventData,
    targetEventRef,
    formatTime,
    dayIndex,
    colHeight,
    partDayEventViewStyleValues,
}: Props) => {
    const eventsLaidOut = useMemo(() => {
        return getEventsLaidOut(eventsInDay, totalMinutes);
    }, [eventsInDay, totalMinutes]);

    const rangesLaidOut = useMemo(() => {
        return getEventsLaidOut(rangeInDay, totalMinutes);
    }, [rangeInDay, totalMinutes]);

    if (eventsInDay.length === 0 && rangeInDay.length === 0) {
        return null;
    }

    const displayEvents = (inputEvents: LayoutEvent[], eventsLaidOut: LaidOutEvent[]) => {
        return inputEvents.map((eventTimeDay, i) => {
            const { id, end: colEnd } = eventTimeDay;
            const event = events.find((event) => event.uniqueId === id);
            if (!event) {
                return null;
            }
            const { start, end } = event;

            const { style, height: eventHeight, size } = eventsLaidOut[i];

            const isTemporary = !!event?.isTemporary;
            const isSelected = targetEventData ? event.uniqueId === targetEventData.uniqueId : false;
            const isThisSelected =
                (isSelected && isTemporary) || (isSelected && targetEventData && dayIndex === targetEventData.idx);

            const eventRef = isThisSelected ? targetEventRef : undefined;

            const eventPartDuration = getEventPartDuration({ start, end, colEnd });
            const isBeforeNow = getIsBeforeNow(event, now);

            const lineNumber =
                colHeight === undefined
                    ? undefined
                    : Math.floor(
                          (colHeight * eventHeight - partDayEventViewStyleValues.padding) /
                              partDayEventViewStyleValues.lineHeight
                      );

            return isBusySlotEvent(event) ? (
                <PartDayBusyEvent
                    event={event}
                    eventPartDuration={eventPartDuration}
                    style={{
                        ...style,
                        '--line-number': lineNumber || 1,
                        '--line-height': size && colHeight ? colHeight * eventHeight : undefined,
                    }}
                    key={event.uniqueId}
                    formatTime={formatTime}
                    eventRef={eventRef}
                    isSelected={isSelected}
                    isBeforeNow={isBeforeNow}
                    size={size}
                />
            ) : (
                <PartDayEvent
                    event={event}
                    eventPartDuration={eventPartDuration}
                    style={{
                        ...style,
                        '--line-number': lineNumber || 1,
                        '--line-height': size && colHeight ? colHeight * eventHeight : undefined,
                    }}
                    key={event.uniqueId}
                    formatTime={formatTime}
                    eventRef={eventRef}
                    isSelected={isSelected}
                    isBeforeNow={isBeforeNow}
                    size={size}
                    tzid={tzid}
                />
            );
        });
    };

    if (rangeInDay.length > 0) {
        return (
            <>
                {displayEvents(rangeInDay, rangesLaidOut)}
                {displayEvents(eventsInDay, eventsLaidOut)}
            </>
        );
    }

    return <>{displayEvents(eventsInDay, eventsLaidOut)}</>;
};

export default DayEvents;
