import React from 'react';
import { SmallButton, PrimaryButton, Loader, useLoading, Alert, Icon, classnames } from 'react-components';
import { noop } from 'proton-shared/lib/helpers/function';
import { getIsCalendarDisabled } from 'proton-shared/lib/calendar/calendar';
import { c } from 'ttag';

import { useReadCalendarEvent, useReadEvent } from './useReadCalendarEvent';

import PopoverEventContent from './PopoverEventContent';
import PopoverHeader from './PopoverHeader';
import PopoverFooter from './PopoverFooter';
import PopoverContent from './PopoverContent';
import { getEventErrorMessage } from './error';
import { CalendarViewEvent, CalendarViewEventTemporaryEvent, WeekStartsOn } from '../../containers/calendar/interface';
import { CalendarEvent } from 'proton-shared/lib/interfaces/calendar';

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
    isNarrow
}: Props) => {
    const [loadingAction, withLoadingAction] = useLoading();

    const targetEventData = (targetEvent && targetEvent.data) || {};
    const { Calendar, Event } = targetEventData;

    const isCalendarDisabled = getIsCalendarDisabled(Calendar);

    const [value, isLoading, error] = useReadCalendarEvent(targetEventData);
    const model = useReadEvent(value, tzid);

    const handleDelete = () => {
        Event && withLoadingAction(onDelete(Event));
    };

    const handleEdit = () => {
        Event && onEdit(Event);
    };

    const deleteButton = (
        <SmallButton
            data-test-id="event-popover:delete"
            onClick={loadingAction ? noop : handleDelete}
            loading={loadingAction}
            className="mr1"
        >
            {c('Action').t`Delete`}
        </SmallButton>
    );

    const mergedClassName = classnames(['eventpopover', isNarrow && 'eventpopover--full-width']);
    const mergedStyle = isNarrow ? undefined : style;

    if (error) {
        return (
            <div style={mergedStyle} className={mergedClassName} ref={popoverRef}>
                <PopoverHeader onClose={onClose}>
                    <h1 className="h3">{c('Error').t`Error`}</h1>
                </PopoverHeader>
                <PopoverContent>
                    <Alert type="error">{getEventErrorMessage(error)}</Alert>
                </PopoverContent>
                <footer>{deleteButton}</footer>
            </div>
        );
    }

    if (isLoading) {
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
                        color={Calendar.Color}
                        size={16}
                    />
                    <h1 className="eventpopover-title lh-standard ellipsis-four-lines cut" title={model.title}>
                        {model.title}
                    </h1>
                </div>
            </PopoverHeader>
            <PopoverContent>
                <PopoverEventContent
                    Calendar={Calendar}
                    isCalendarDisabled={isCalendarDisabled}
                    event={targetEvent}
                    tzid={tzid}
                    weekStartsOn={weekStartsOn}
                    model={model}
                    formatTime={formatTime}
                />
            </PopoverContent>
            <PopoverFooter>
                {deleteButton}
                <PrimaryButton
                    data-test-id="event-popover:edit"
                    className="pm-button--small"
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
