import React, { useMemo } from 'react';
import { Button, Loader, useLoading, Alert, classnames } from 'react-components';
import { noop } from 'proton-shared/lib/helpers/function';
import { getIsCalendarDisabled } from 'proton-shared/lib/calendar/calendar';
import { c } from 'ttag';

import { format as formatUTC } from 'proton-shared/lib/date-fns-utc';
import { dateLocale } from 'proton-shared/lib/i18n';
import { CalendarEvent } from 'proton-shared/lib/interfaces/calendar';
import useReadEvent from './useReadEvent';

import PopoverEventContent from './PopoverEventContent';
import PopoverHeader from './PopoverHeader';
import PopoverFooter from './PopoverFooter';
import { getEventErrorMessage } from './error';
import { CalendarViewEvent, CalendarViewEventTemporaryEvent, WeekStartsOn } from '../../containers/calendar/interface';
import { getIsCalendarEvent } from '../../containers/calendar/eventStore/cache/helper';
import getEventInformation from './getEventInformation';
import { EnDash } from '../EnDash';

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
}: Props) => {
    const [loadingAction, withLoadingAction] = useLoading();

    const targetEventData = targetEvent?.data || {};
    const { eventReadResult, eventData, calendarData } = targetEventData;

    const isCalendarDisabled = getIsCalendarDisabled(calendarData);

    const model = useReadEvent(eventReadResult?.result, tzid);
    const { eventReadError, isEventReadLoading, eventTitleSafe } = getEventInformation(targetEvent, model);

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
            if (dateStart === dateEnd) return dateStart;
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

    const mergedClassName = classnames(['eventpopover', isNarrow && 'eventpopover--full-width']);
    const mergedStyle = isNarrow ? undefined : style;

    if (eventReadError) {
        return (
            <div style={mergedStyle} className={mergedClassName} ref={popoverRef}>
                <PopoverHeader onClose={onClose}>
                    <h1 className="h3">{c('Error').t`Error`}</h1>
                </PopoverHeader>
                <Alert type="error">{getEventErrorMessage(eventReadError)}</Alert>
                <PopoverFooter>{deleteButton}</PopoverFooter>
            </div>
        );
    }

    if (isEventReadLoading) {
        return (
            <div style={mergedStyle} className={mergedClassName} ref={popoverRef}>
                <Loader className="center flex mb2 mt2 pb2" />
            </div>
        );
    }

    return (
        <div style={mergedStyle} className={mergedClassName} ref={popoverRef}>
            <PopoverHeader className="ml0-5" onClose={onClose}>
                <div className="color-subheader">{dateHeader}</div>
                <h1 className="eventpopover-title lh-standard ellipsis-four-lines cut mb0-5" title={eventTitleSafe}>
                    {eventTitleSafe}
                </h1>
            </PopoverHeader>
            <PopoverEventContent
                Calendar={calendarData}
                isCalendarDisabled={isCalendarDisabled}
                event={targetEvent}
                tzid={tzid}
                weekStartsOn={weekStartsOn}
                model={model}
                formatTime={formatTime}
            />
            <PopoverFooter>
                {deleteButton}
                <Button
                    data-test-id="event-popover:edit"
                    onClick={handleEdit}
                    disabled={loadingAction || isCalendarDisabled}
                >
                    {c('Action').t`Edit`}
                </Button>
            </PopoverFooter>
        </div>
    );
};

export default EventPopover;
