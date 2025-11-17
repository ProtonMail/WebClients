import type { CSSProperties, ComponentPropsWithoutRef, ReactNode, Ref } from 'react';
import { forwardRef } from 'react';

import { MINUTE } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import { PartDayBookingEvent } from '../../containers/bookings/timeGridView/PartDayBookingEvent';
import { TemporaryPartDayBookingEvent } from '../../containers/bookings/timeGridView/TemporaryPartDayBookingEvent';
import {
    isBookingSlotEvent,
    isTemporaryBookingSlotEvent,
} from '../../containers/bookings/utils/calendar/calendarHelper';
import type {
    CalendarViewBusyEvent,
    CalendarViewEvent,
    CalendarViewEventTemporaryEvent,
} from '../../containers/calendar/interface';
import { isBusySlotEvent } from '../../helpers/busySlots';
import PartDayBusyEvent from './PartDayBusyEvent';
import PartDayRegularEvent from './PartDayRegularEvent';

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
    const canDisplayOnlyOneLine = eventPartDuration ? eventPartDuration < 75 * MINUTE : false;

    return (
        // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
        <div
            role="button"
            tabIndex={0}
            className={clsx([
                'calendar-eventcell overflow-hidden',
                isLoaded && 'isLoaded',
                isPast && 'isPast',
                isSelected && 'isSelected',
                isUnanswered && 'isUnanswered',
                isCancelled && 'isCancelled',
                size && `calendar-eventcell--${size}`,
                canDisplayOnlyOneLine && 'calendar-eventcell--title-small-fit',
                className,
            ])}
            ref={ref}
            {...rest}
        >
            {children}
        </div>
    );
});

export interface PartDayEventProps {
    size?: EventSize;
    style: CSSProperties;
    formatTime: (date: Date) => string;
    event: CalendarViewEvent | CalendarViewEventTemporaryEvent | CalendarViewBusyEvent;
    eventPartDuration: number;
    isSelected: boolean;
    isBeforeNow: boolean;
    eventRef?: Ref<HTMLDivElement>;
    tzid: string;
}
const PartDayEvent = ({ event, ...rest }: PartDayEventProps) => {
    if (isBookingSlotEvent(event)) {
        return <PartDayBookingEvent event={event} {...rest} />;
    }

    if (isTemporaryBookingSlotEvent(event)) {
        return <TemporaryPartDayBookingEvent event={event} {...rest} />;
    }

    if (isBusySlotEvent(event)) {
        return <PartDayBusyEvent event={event} {...rest} />;
    }

    return <PartDayRegularEvent event={event} {...rest} />;
};

export default PartDayEvent;
