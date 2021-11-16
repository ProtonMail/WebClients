import { CSSProperties, Ref, useMemo, forwardRef, ComponentPropsWithoutRef } from 'react';
import { classnames, Icon } from '@proton/components';

import { getEventStatusTraits } from '../../helpers/event';

import useReadEvent from './useReadEvent';
import { getEventStyle } from '../../helpers/color';
import { getEventErrorMessage, getEventLoadingMessage } from './error';
import { CalendarViewEvent, CalendarViewEventTemporaryEvent } from '../../containers/calendar/interface';
import getEventInformation from './getEventInformation';

interface PartDayEventViewProps extends ComponentPropsWithoutRef<'div'> {
    isSelected?: boolean;
    isUnanswered?: boolean;
    isCancelled?: boolean;
    isPast?: boolean;
    isLoaded?: boolean;
}
export const PartDayEventView = forwardRef<HTMLDivElement, PartDayEventViewProps>(
    ({ isSelected, isUnanswered, isCancelled, isPast, isLoaded, className, children, ...rest }, ref) => {
        return (
            <div
                role="button"
                tabIndex={0}
                className={classnames([
                    'calendar-eventcell no-scroll',
                    isLoaded && 'isLoaded',
                    isPast && 'isPast',
                    isSelected && 'isSelected',
                    isUnanswered && 'isUnanswered',
                    isCancelled && 'isCancelled',
                    className,
                ])}
                ref={ref}
                {...rest}
            >
                {children}
            </div>
        );
    }
);

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
                    <Icon name="lock-filled" className="calendar-eventcell-lock-icon" />
                    <span className="flex-item-fluid text-ellipsis">&nbsp;</span>
                </div>
            );
        }

        return (
            <>
                <div data-test-id="calendar-day-week-view:part-day-event" className="calendar-eventcell-title">
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
        <PartDayEventView
            style={eventStyle}
            isLoaded={!isEventReadLoading}
            isPast={!isEventReadLoading && isBeforeNow}
            isSelected={isSelected}
            isUnanswered={isUnanswered}
            isCancelled={isCancelled}
            ref={eventRef}
            title={expandableTitleString}
        >
            {content}
        </PartDayEventView>
    );
};

export default PartDayEvent;
