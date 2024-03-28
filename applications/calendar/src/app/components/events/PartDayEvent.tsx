import { CSSProperties, ComponentPropsWithoutRef, ReactNode, Ref, forwardRef } from 'react';

import { MINUTE } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import {
    CalendarViewBusyEvent,
    CalendarViewEvent,
    CalendarViewEventTemporaryEvent,
} from '../../containers/calendar/interface';
import { isBusyTimesSlotEvent } from '../../helpers/busyTimeSlots';
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
    return isBusyTimesSlotEvent(event) ? (
        <PartDayBusyEvent event={event} {...rest} />
    ) : (
        <PartDayRegularEvent event={event} {...rest} />
    );
};

export default PartDayEvent;
