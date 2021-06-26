import React, { CSSProperties, Ref, useMemo } from 'react';
import { classnames, Icon } from 'react-components';

import { getEventStatusTraits } from '../../helpers/event';

import useReadEvent from './useReadEvent';
import { getEventStyle } from '../../helpers/color';
import { getEventErrorMessage, getEventLoadingMessage } from './error';
import { CalendarViewEvent, CalendarViewEventTemporaryEvent } from '../../containers/calendar/interface';
import getEventInformation from './getEventInformation';

interface Props {
    style: CSSProperties;
    formatTime: (date: Date) => string;
    event: CalendarViewEvent | CalendarViewEventTemporaryEvent;
    isSelected: boolean;
    isBeforeNow: boolean;
    eventRef?: Ref<HTMLDivElement>;
    tzid: string;
    isEventPartLessThanAnHour: boolean;
}
const PartDayEvent = ({
    style,
    formatTime,
    event,
    isSelected,
    isBeforeNow,
    eventRef,
    tzid,
    isEventPartLessThanAnHour,
}: Props) => {
    const { start, end, data: targetEventData } = event;
    const model = useReadEvent(targetEventData.eventReadResult?.result, tzid);

    const { isEventReadLoading, calendarColor, eventReadError, eventTitleSafe } = getEventInformation(event, model);
    const { isUnanswered, isCancelled } = getEventStatusTraits(model);

    const eventStyle = useMemo(() => {
        return getEventStyle(calendarColor, style);
    }, [calendarColor, style]);

    const titleString = (() => {
        if (eventReadError) {
            return '';
        }
        if (isEventReadLoading) {
            return '…';
        }
        return eventTitleSafe;
    })();

    const expandableTitleString = (() => {
        if (eventReadError) {
            return getEventErrorMessage(eventReadError);
        }
        if (isEventReadLoading) {
            return getEventLoadingMessage();
        }
        return titleString;
    })();

    const timeString = useMemo(() => {
        const timeStart = formatTime(start);
        const timeEnd = formatTime(end);
        return `${timeStart} - ${timeEnd}`;
    }, [start, end]);
    const shouldHideTime = isEventReadLoading || (isEventPartLessThanAnHour && titleString);

    const content = (() => {
        if (eventReadError) {
            return (
                <div className="flex flex-nowrap flex-align-items-center">
                    <Icon name="lock" className="calendar-eventcell-lock-icon" />
                    <span className="flex-item-fluid text-ellipsis">&nbsp;</span>
                </div>
            );
        }

        return (
            <>
                <div
                    data-test-id="calendar-day-week-view:part-day-event"
                    className="text-ellipsis calendar-eventcell-title"
                >
                    {titleString}
                </div>
                <div
                    className={classnames(['text-ellipsis calendar-eventcell-timestring', shouldHideTime && 'hidden'])}
                >
                    {timeString}
                </div>
            </>
        );
    })();

    return (
        <div
            role="button"
            tabIndex={0}
            style={eventStyle}
            className={classnames([
                'calendar-eventcell no-scroll pl0-5 pr0-5',
                !isEventReadLoading && 'isLoaded',
                !isEventReadLoading && isBeforeNow && 'isPast',
                isSelected && 'isSelected',
                isUnanswered && 'isUnanswered',
                isCancelled && 'isCancelled',
            ])}
            ref={eventRef}
            title={expandableTitleString}
        >
            {content}
        </div>
    );
};

export default PartDayEvent;
