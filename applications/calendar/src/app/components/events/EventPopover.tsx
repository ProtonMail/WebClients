import React from 'react';
import { PrimaryButton, Loader, useLoading, Alert, Icon, classnames, Button } from 'react-components';
import { noop } from 'proton-shared/lib/helpers/function';
import { getIsCalendarDisabled } from 'proton-shared/lib/calendar/calendar';
import { c } from 'ttag';

import { CalendarEvent } from 'proton-shared/lib/interfaces/calendar';
import useReadEvent from './useReadEvent';

import PopoverEventContent from './PopoverEventContent';
import PopoverHeader from './PopoverHeader';
import PopoverFooter from './PopoverFooter';
import { getEventErrorMessage } from './error';
import { CalendarViewEvent, CalendarViewEventTemporaryEvent, WeekStartsOn } from '../../containers/calendar/interface';
import { getIsCalendarEvent } from '../../containers/calendar/eventStore/cache/helper';
import getEventInformation from './getEventInformation';

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
                <footer>{deleteButton}</footer>
            </div>
        );
    }

    if (isEventReadLoading) {
        return (
            <div style={mergedStyle} className={mergedClassName} ref={popoverRef}>
                <Loader />
            </div>
        );
    }

    return (
        <div style={mergedStyle} className={mergedClassName} ref={popoverRef}>
            <PopoverHeader onClose={onClose}>
                <div className="flex flex-nowrap">
                    <Icon
                        name="circle"
                        className="mr1 mb1 mt0-75 flex-item-noshrink"
                        color={calendarData.Color}
                        size={16}
                    />
                    <h1 className="eventpopover-title lh-standard ellipsis-four-lines cut" title={eventTitleSafe}>
                        {eventTitleSafe}
                    </h1>
                </div>
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
                <PrimaryButton
                    data-test-id="event-popover:edit"
                    onClick={handleEdit}
                    disabled={loadingAction || isCalendarDisabled}
                >
                    {c('Action').t`Edit`}
                </PrimaryButton>
            </PopoverFooter>
        </div>
    );
};

export default EventPopover;
