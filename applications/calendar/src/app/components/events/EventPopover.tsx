import { getIsCalendarDisabled } from 'proton-shared/lib/calendar/calendar';
import { WeekStartsOn } from 'proton-shared/lib/calendar/interface';

import { format as formatUTC } from 'proton-shared/lib/date-fns-utc';
import { noop } from 'proton-shared/lib/helpers/function';
import { dateLocale } from 'proton-shared/lib/i18n';
import { CalendarEvent } from 'proton-shared/lib/interfaces/calendar';
import { ContactEmail } from 'proton-shared/lib/interfaces/contacts';
import { SimpleMap } from 'proton-shared/lib/interfaces/utils';
import React, { useMemo } from 'react';
import { Alert, Badge, Button, classnames, Loader, useLoading } from 'react-components';
import { c } from 'ttag';
import { getIsCalendarEvent } from '../../containers/calendar/eventStore/cache/helper';
import { CalendarViewEvent, CalendarViewEventTemporaryEvent } from '../../containers/calendar/interface';
import { EnDash } from '../EnDash';
import { getEventErrorMessage } from './error';
import getEventInformation from './getEventInformation';

import PopoverEventContent from './PopoverEventContent';
import PopoverFooter from './PopoverFooter';
import PopoverHeader from './PopoverHeader';
import useReadEvent from './useReadEvent';

interface Props {
    formatTime: (date: Date) => string;
    onEdit: (event: CalendarEvent) => void;
    onDelete: (event: CalendarEvent) => Promise<void>;
    onClose: () => void;
    style: any;
    popoverRef: any;
    event: CalendarViewEvent | CalendarViewEventTemporaryEvent;
    tzid: string;
    weekStartsOn: WeekStartsOn;
    isNarrow: boolean;
    contactEmailMap: SimpleMap<ContactEmail>;
}
const EventPopover = ({
    formatTime,
    onEdit,
    onDelete,
    onClose,
    style,
    popoverRef,
    event: targetEvent,
    event: { start, end, isAllDay, isAllPartDay },
    tzid,
    weekStartsOn,
    isNarrow,
    contactEmailMap,
}: Props) => {
    const [loadingAction, withLoadingAction] = useLoading();

    const targetEventData = targetEvent?.data || {};
    const { eventReadResult, eventData, calendarData } = targetEventData;

    const isCalendarDisabled = getIsCalendarDisabled(calendarData);

    const model = useReadEvent(eventReadResult?.result, tzid, eventData?.Author);
    const {
        eventReadError,
        isEventReadLoading,
        eventTitleSafe,
        isCancelled,
        isRecurring,
        isSingleEdit,
    } = getEventInformation(targetEvent, model);
    const allowEdit = !model.isInvitation || !(isRecurring || isSingleEdit);

    const handleDelete = () => {
        if (eventData && getIsCalendarEvent(eventData)) {
            withLoadingAction(onDelete(eventData)).catch(noop);
        }
    };

    const handleEdit = () => {
        if (eventData && getIsCalendarEvent(eventData)) {
            onEdit(eventData);
        }
    };

    const dateHeader = useMemo(() => {
        const [dateStart, dateEnd] = [start, end].map((date) => formatUTC(date, 'cccc PPP', { locale: dateLocale }));
        const timeStart = formatTime(start);
        const timeEnd = formatTime(end);

        if (isAllDay && !isAllPartDay) {
            if (dateStart === dateEnd) {
                return dateStart;
            }
            return (
                <>
                    {dateStart}
                    <EnDash />
                    {dateEnd}
                </>
            );
        }
        if (dateStart === dateEnd) {
            return (
                <>
                    {dateStart} | {timeStart}
                    <EnDash />
                    {timeEnd}
                </>
            );
        }
        return (
            <>
                {dateStart} {timeStart}
                <EnDash />
                {dateEnd} {timeEnd}
            </>
        );
    }, [start, end, isAllDay]);

    const deleteButton = (
        <Button
            data-test-id="event-popover:delete"
            onClick={loadingAction ? noop : handleDelete}
            loading={loadingAction}
            className="mr1"
        >
            {c('Action').t`Delete`}
        </Button>
    );
    const editButton = (
        <Button data-test-id="event-popover:edit" onClick={handleEdit} disabled={loadingAction || isCalendarDisabled}>
            {c('Action').t`Edit`}
        </Button>
    );

    const mergedClassName = classnames([
        'eventpopover pt2 pl1-5 pr1-5 pb1 flex flex-column flex-nowrap',
        isNarrow && 'eventpopover--full-width',
    ]);
    const mergedStyle = isNarrow ? undefined : style;

    if (eventReadError) {
        return (
            <div style={mergedStyle} className={mergedClassName} ref={popoverRef}>
                <PopoverHeader onClose={onClose} className="flex-item-noshrink">
                    <h1 className="h3">{c('Error').t`Error`}</h1>
                </PopoverHeader>
                <Alert type="error">{getEventErrorMessage(eventReadError)}</Alert>
                <PopoverFooter>{deleteButton}</PopoverFooter>
            </div>
        );
    }

    if (isEventReadLoading) {
        return (
            <div style={mergedStyle} className="eventpopover p1" ref={popoverRef}>
                <Loader />
            </div>
        );
    }

    return (
        <div style={mergedStyle} className={mergedClassName} ref={popoverRef}>
            <PopoverHeader className="ml0-5 flex-item-noshrink" onClose={onClose}>
                <div className="color-subheader">{dateHeader}</div>
                <h1 className="eventpopover-title lh-standard ellipsis-four-lines cut mb0-5" title={eventTitleSafe}>
                    {eventTitleSafe}
                </h1>
                {isCancelled && (
                    <Badge type="error" tooltip={c('Calendar invite info').t`This event has been cancelled`}>
                        {c('Title').t`CANCELLED`}
                    </Badge>
                )}
            </PopoverHeader>
            <div className="scroll-if-needed mb1">
                <PopoverEventContent
                    Calendar={calendarData}
                    isCalendarDisabled={isCalendarDisabled}
                    event={targetEvent}
                    tzid={tzid}
                    weekStartsOn={weekStartsOn}
                    model={model}
                    formatTime={formatTime}
                    contactEmailMap={contactEmailMap}
                />
            </div>
            <PopoverFooter className="flex-item-noshrink">
                {deleteButton}
                {allowEdit && editButton}
            </PopoverFooter>
        </div>
    );
};

export default EventPopover;
