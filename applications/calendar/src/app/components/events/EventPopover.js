import React from 'react';
import {
    SmallButton,
    PrimaryButton,
    Loader,
    useLoading,
    useNotifications,
    Alert,
    Icon,
    classnames
} from 'react-components';
import PropTypes from 'prop-types';
import { noop } from 'proton-shared/lib/helpers/function';
import { c } from 'ttag';

import { getI18N } from '../eventModal/eventForm/i18n';
import { useReadCalendarEvent, useReadEvent } from './useReadCalendarEvent';

import PopoverEventContent from './PopoverEventContent';
import PopoverHeader from './PopoverHeader';
import PopoverFooter from './PopoverFooter';
import PopoverContent from './PopoverContent';

const EventPopover = ({ formatTime, onEdit, onDelete, onClose, style, popoverRef, event: targetEvent, isNarrow }) => {
    const { createNotification } = useNotifications();
    const [loadingAction, withLoadingAction] = useLoading();

    const targetEventData = (targetEvent && targetEvent.data) || {};
    const { Calendar, Event, title: tmpTitle } = targetEventData;

    const [value, isLoading, error] = useReadCalendarEvent(targetEventData);
    const model = useReadEvent(value);

    const handleDelete = () => {
        if (!Event) {
            return;
        }
        const run = async () => {
            await onDelete(Event);
            onClose();
            const i18n = getI18N('event');
            createNotification({ text: i18n.deleted });
        };
        withLoadingAction(run());
    };

    const handleEdit = () => {
        onEdit(Event);
    };

    const deleteButton = (
        <SmallButton onClick={loadingAction ? noop : handleDelete} loading={loadingAction} className="mr1">{c('Action')
            .t`Delete`}</SmallButton>
    );

    const mergedClassName = classnames(['eventpopover', isNarrow && 'eventpopover--full-width']);
    const mergedStyle = isNarrow ? undefined : style;

    if (error) {
        const errorMessage = error.message || '';
        return (
            <div style={mergedStyle} className={mergedClassName} ref={popoverRef}>
                <PopoverHeader onClose={onClose}>
                    <h1 className="h3">{c('Error').t`Error`}</h1>
                </PopoverHeader>
                <PopoverContent>
                    <Alert type="error">
                        {errorMessage.includes('decrypt')
                            ? c('Error').t`Decryption error: Decryption of this event's content failed.`
                            : c('Error').t`Error: ${errorMessage}`}
                    </Alert>
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
                <h1 className="eventpopover-title lh-standard ellipsis-four-lines cut" title={model.title}>
                    <Icon name="circle" color={Calendar.Color} size={25} /> {model.title}
                </h1>
            </PopoverHeader>
            <PopoverContent>
                <PopoverEventContent
                    Calendar={Calendar}
                    event={targetEvent}
                    model={model}
                    formatTime={formatTime}
                    tmpTitle={tmpTitle}
                />
            </PopoverContent>
            <PopoverFooter>
                {deleteButton}
                <PrimaryButton className="pm-button--small" onClick={handleEdit} disabled={loadingAction}>
                    {c('Action').t`Edit`}
                </PrimaryButton>
            </PopoverFooter>
        </div>
    );
};

EventPopover.propTypes = {
    tzid: PropTypes.string,
    formatTime: PropTypes.func,
    style: PropTypes.object.isRequired,
    onClose: PropTypes.func.isRequired,
    onEdit: PropTypes.func,
    onDelete: PropTypes.func,
    event: PropTypes.object,
    layout: PropTypes.object
};

export default EventPopover;
