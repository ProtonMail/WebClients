import { CSSProperties, ComponentPropsWithoutRef, ReactNode, Ref, forwardRef, useMemo } from 'react';

import { Icon, classnames } from '@proton/components';
import { HOUR } from '@proton/shared/lib/constants';

import { CalendarViewEvent, CalendarViewEventTemporaryEvent } from '../../containers/calendar/interface';
import { getEventStyle } from '../../helpers/color';
import { getEventStatusTraits } from '../../helpers/event';
import { getEventErrorMessage, getEventLoadingMessage } from './error';
import getEventInformation from './getEventInformation';
import useReadEvent from './useReadEvent';

export type EventSize = 'sm' | 'xs' | '2xs';

interface PartDayEventViewProps extends ComponentPropsWithoutRef<'div'> {
    size?: EventSize;
    isSelected?: boolean;
    isUnanswered?: boolean;
    isCancelled?: boolean;
    isPast?: boolean;
    isLoaded?: boolean;
    className?: string;
    children?: ReactNode;
    eventPartDuration?: number;
}
export const PartDayEventView = forwardRef<HTMLDivElement, PartDayEventViewProps>(function PartDayEventViewComponent(
    {
        size,
        isSelected,
        isUnanswered,
        isCancelled,
        isPast,
        isLoaded,
        className,
        children,
        eventPartDuration,
        ...rest
    }: PartDayEventViewProps,
    ref: Ref<HTMLDivElement>
) {
    const isEventPartNotGreaterThanAnHour = eventPartDuration ? eventPartDuration <= HOUR : false;

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
                size && `calendar-eventcell--${size}`,
                isEventPartNotGreaterThanAnHour && 'calendar-eventcell--title-small-fit',
                className,
            ])}
            ref={ref}
            {...rest}
        >
            {children}
        </div>
    );
});

interface Props {
    size?: EventSize;
    style: CSSProperties;
    formatTime: (date: Date) => string;
    event: CalendarViewEvent | CalendarViewEventTemporaryEvent;
    eventPartDuration: number;
    isSelected: boolean;
    isBeforeNow: boolean;
    eventRef?: Ref<HTMLDivElement>;
    tzid: string;
}
const PartDayEvent = ({
    size,
    style,
    formatTime,
    event,
    isSelected,
    isBeforeNow,
    eventRef,
    tzid,
    eventPartDuration,
}: Props) => {
    const { start, end, data: targetEventData } = event;
    const model = useReadEvent(targetEventData.eventReadResult?.result, tzid);

    const { isEventReadLoading, calendarColor, eventReadError, eventTitleSafe } = getEventInformation(event, model);
    const { isUnanswered, isCancelled } = getEventStatusTraits(model);
    const isEventPartLessThanAnHour = eventPartDuration < HOUR;

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
                    className={classnames(['text-ellipsis calendar-eventcell-timestring', shouldHideTime && 'sr-only'])}
                >
                    {timeString}
                </div>
            </>
        );
    })();

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
            {content}
        </PartDayEventView>
    );
};

export default PartDayEvent;
