import React, { useRef, useState, useEffect } from 'react';
import {
    SmallButton,
    PrimaryButton,
    Input,
    Icon,
    Loader,
    useApi,
    useEventManager,
    useGetAddresses,
    useGetAddressKeys,
    useGetCalendarBootstrap,
    useGetCalendarKeys,
    useLoading,
    useNotifications,
    useModals,
    ConfirmModal,
    Alert
} from 'react-components';
import PropTypes from 'prop-types';
import { noop } from 'proton-shared/lib/helpers/function';
import { c } from 'ttag';
import { deleteEvent } from 'proton-shared/lib/api/calendars';
import createOrUpdateEvent from 'proton-shared/lib/calendar/integration/createOrUpdateEvent';

import usePopoverPlacement from './usePopoverPlacement';
import { getI18N } from '../eventModal/eventForm/i18n';
import { useReadCalendarEvent, useReadEvent } from './useReadCalendarEvent';

import { modelToVeventComponent } from '../eventModal/eventForm/modelToProperties';
import { getEmptyModel, getExistingEvent } from '../eventModal/eventForm/state';
import PopoverEventContent from './PopoverEventContent';

const PopoverEvent = ({
    tzid,
    formatTime,
    setSelectedEventID,
    onEditEvent,
    onClose,
    style,
    layout,
    event: targetEvent
}) => {
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const [loadingAction, withLoadingAction] = useLoading();
    const ref = useRef();
    const otherStyle = usePopoverPlacement(ref, style, layout);
    const { createModal } = useModals();

    const [tmpTitle, setTmpTitle] = useState('');

    const getCalendarKeys = useGetCalendarKeys();
    const getAddresses = useGetAddresses();
    const getCalendarBootstrap = useGetCalendarBootstrap();
    const getAddressKeys = useGetAddressKeys();

    const targetEventData = (targetEvent && targetEvent.data) || {};
    const { id, isAllDay, start, end } = targetEvent;
    const { Calendar, Event } = targetEventData;

    const isTmpEvent = id === 'tmp';
    const isCreateEvent = isTmpEvent && !Event;
    const isMoveEvent = isTmpEvent && !!Event;

    const [value, isLoading, error] = useReadCalendarEvent(targetEventData);
    const model = useReadEvent(value);
    const [errors, setErrors] = useState({});

    const handleDelete = async () => {
        if (!Event) {
            return;
        }
        await new Promise((resolve, reject) => {
            createModal(
                <ConfirmModal
                    confirm={c('Action').t`Delete`}
                    title={c('Info').t`Delete event`}
                    onClose={reject}
                    onConfirm={resolve}
                >
                    <Alert>{c('Info').t`Would you like to delete this event?`}</Alert>
                </ConfirmModal>
            );
        });
        await api(deleteEvent(Event.CalendarID, Event.ID));
        await call();
        const i18n = getI18N('event');
        createNotification({ text: i18n.deleted });
    };

    const handleEdit = () => {
        setSelectedEventID();
        onEditEvent({
            Event: Event || undefined,
            ...(isCreateEvent || isMoveEvent
                ? {
                      start,
                      end
                  }
                : undefined),
            ...(isCreateEvent && tmpTitle
                ? {
                      title: tmpTitle
                  }
                : undefined),
            ...(isCreateEvent
                ? {
                      isAllDay,
                      calendarID: Calendar.ID
                  }
                : undefined),
            onClose: () => {
                // When the modal closes, close this popover too.
                onClose();
            }
        });
    };

    const getModel = async () => {
        const actualCalendarID = Event ? Event.CalendarID : Calendar.ID;

        const [CalendarBootstrap, Addresses, [veventComponent, personalMap]] = await Promise.all([
            getCalendarBootstrap(actualCalendarID),
            getAddresses(),
            Event ? value : []
        ]);

        const emptyModel = getEmptyModel({
            title: (tmpTitle || '').trim(),
            calendarID: actualCalendarID,
            CalendarBootstrap,
            Addresses,
            isAllDay,
            start,
            end,
            tzid
        });

        const eventModel = veventComponent
            ? getExistingEvent({
                  veventComponent,
                  veventValarmComponent: personalMap[emptyModel.memberID],
                  start,
                  end,
                  tzid
              })
            : {};

        return {
            ...emptyModel,
            ...eventModel
        };
    };

    useEffect(() => {
        if (errors.title) {
            setErrors({});
        }
    }, [tmpTitle]);

    const handleSave = async () => {
        const model = await getModel();

        const { calendarID, addressID, memberID } = model;
        const [addressKeys, calendarKeys] = await Promise.all([getAddressKeys(addressID), getCalendarKeys(calendarID)]);
        const veventComponent = modelToVeventComponent(model, tzid);

        if (!veventComponent.summary.value) {
            return setErrors({ title: c('Error').t`Title required` });
        }

        await createOrUpdateEvent({
            Event: Event ? Event : undefined,
            veventComponent,
            memberID,
            calendarID,
            addressKeys,
            calendarKeys,
            api
        });

        await call();

        const i18n = getI18N('event');
        createNotification({ text: isCreateEvent ? i18n.created : i18n.updated });
        onClose();
    };

    if (error) {
        const errorMessage = error.message || '';
        return (
            <div style={otherStyle} className="eventpopover p1" ref={ref}>
                <header>
                    <h1 className="h3">{c('Error').t`Error`}</h1>
                    <button
                        type="button"
                        className="pm-modalClose"
                        title={c('Action').t`Close popover`}
                        onClick={onClose}
                    >
                        <Icon className="pm-modalClose-icon" name="close" />
                        <span className="sr-only">{c('Action').t`Close popover`}</span>
                    </button>
                </header>
                <Alert type="error">
                    {errorMessage.includes('decrypt')
                        ? c('Error').t`Decryption error: Decryption of this event's content failed.`
                        : c('Error').t`Error: ${errorMessage}`}
                </Alert>
                <footer>
                    <SmallButton
                        onClick={loadingAction ? noop : () => withLoadingAction(handleDelete())}
                        loading={loadingAction}
                        className="mr1"
                    >{c('Action').t`Delete`}</SmallButton>
                </footer>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div style={otherStyle} className="eventpopover p1" ref={ref}>
                <Loader />
            </div>
        );
    }

    return (
        <form
            style={otherStyle}
            onSubmit={(e) => {
                e.preventDefault();
                withLoadingAction(handleSave());
            }}
            className="eventpopover p1"
            ref={ref}
        >
            <header className="">
                {isCreateEvent ? (
                    <div className="mb1 w95">
                        <Input
                            placeholder={c('Placeholder').t`Add an event title`}
                            aria-label={c('Info').t`Add an event title`}
                            type="text"
                            value={tmpTitle}
                            autoFocus={true}
                            required={true}
                            error={errors.title}
                            onChange={({ target: { value } }) => setTmpTitle(value)}
                        />
                    </div>
                ) : (
                    <h1 className="eventpopover-title lh-standard ellipsis-four-lines cut" title={model.title}>
                        {model.title}
                    </h1>
                )}
                <button type="button" className="pm-modalClose" title={c('Action').t`Close popover`} onClick={onClose}>
                    <Icon className="pm-modalClose-icon" name="close" />
                    <span className="sr-only">{c('Action').t`Close popover`}</span>
                </button>
            </header>
            <div className="pb0-5">
                <PopoverEventContent
                    Calendar={Calendar}
                    event={targetEvent}
                    model={model}
                    formatTime={formatTime}
                    tmpTitle={tmpTitle}
                    setTmpTitle={setTmpTitle}
                />
            </div>
            <footer className="flex flex-nowrap flex-spacebetween">
                {isCreateEvent || isMoveEvent ? (
                    <>
                        <SmallButton onClick={onClose}>{c('Action').t`Cancel`}</SmallButton>
                        <div>
                            <SmallButton className="mr1" onClick={handleEdit}>{c('Action').t`More`}</SmallButton>
                            <PrimaryButton type="submit" className="pm-button--small" loading={loadingAction}>{c(
                                'Action'
                            ).t`Save`}</PrimaryButton>
                        </div>
                    </>
                ) : (
                    <>
                        <SmallButton
                            onClick={loadingAction ? noop : () => withLoadingAction(handleDelete())}
                            loading={loadingAction}
                            className="mr1"
                        >{c('Action').t`Delete`}</SmallButton>
                        <PrimaryButton className="pm-button--small" onClick={handleEdit}>{c('Action')
                            .t`Edit`}</PrimaryButton>
                    </>
                )}
            </footer>
        </form>
    );
};

PopoverEvent.propTypes = {
    tzid: PropTypes.string,
    formatTime: PropTypes.func,
    style: PropTypes.object.isRequired,
    onClose: PropTypes.func.isRequired,
    onEditEvent: PropTypes.func,
    event: PropTypes.object,
    layout: PropTypes.object
};

export default PopoverEvent;
