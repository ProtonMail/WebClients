import { useMemo } from 'react';

import { Icon, useUser } from '@proton/components';
import { MINUTE } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import { CalendarViewEvent, CalendarViewEventTemporaryEvent } from '../../containers/calendar/interface';
import { getEventStyle } from '../../helpers/color';
import { getEventStatusTraits } from '../../helpers/event';
import { PartDayEventProps, PartDayEventView } from './PartDayEvent';
import { getEventErrorMessage, getEventLoadingMessage } from './error';
import getEventInformation from './getEventInformation';
import useReadEvent from './useReadEvent';

interface PartDayRegularEventProps extends PartDayEventProps {
    event: CalendarViewEvent | CalendarViewEventTemporaryEvent;
}

const PartDayRegularEvent = ({
    size,
    style,
    formatTime,
    event,
    isSelected,
    isBeforeNow,
    eventRef,
    tzid,
    eventPartDuration,
}: PartDayRegularEventProps) => {
    const [{ hasPaidMail }] = useUser();
    const { start, end, data: targetEventData } = event;
    const model = useReadEvent(targetEventData.eventReadResult?.result, tzid);

    const { isEventReadLoading, color, eventReadError, eventTitleSafe } = getEventInformation(
        event,
        model,
        hasPaidMail
    );
    const { isUnanswered, isCancelled } = getEventStatusTraits(model);

    const eventStyle = useMemo(() => {
        return getEventStyle(color, style);
    }, [color, style]);

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
    const shouldHideTime = isEventReadLoading || (eventPartDuration < 50 * MINUTE && titleString);

    return (
        <PartDayEventView
            size={size}
            style={eventStyle}
            isLoaded={!isEventReadLoading}
            isPast={!isEventReadLoading && isBeforeNow}
            isSelected={isSelected}
            isUnanswered={isUnanswered}
            isCancelled={isCancelled}
            ref={eventRef}
            title={expandableTitleString}
            eventPartDuration={eventPartDuration}
        >
            {eventReadError ? (
                <div className="flex flex-nowrap items-center">
                    <Icon name="lock-filled" className="calendar-eventcell-lock-icon" />
                    <span className="flex-1 text-ellipsis">&nbsp;</span>
                </div>
            ) : (
                <>
                    <div data-testid="calendar-day-week-view:part-day-event" className="calendar-eventcell-title">
                        {titleString}
                    </div>
                    <div className={clsx(['text-ellipsis calendar-eventcell-timestring', shouldHideTime && 'sr-only'])}>
                        {timeString}
                    </div>
                </>
            )}
        </PartDayEventView>
    );
};

export default PartDayRegularEvent;
