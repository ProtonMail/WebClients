import { c } from 'ttag';
import { Prompt } from 'react-router';
import { noop } from 'proton-shared/lib/helpers/function';
import React, { useImperativeHandle, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    ConfirmModal,
    ResetButton,
    useApi,
    useEventManager,
    useGetAddressKeys,
    useGetCalendarKeys,
    useModals
} from 'react-components';
import { useReadCalendarBootstrap } from 'react-components/hooks/useGetCalendarBootstrap';

import { format, isSameDay } from 'proton-shared/lib/date-fns-utc';
import { dateLocale } from 'proton-shared/lib/i18n';
import { getFormattedWeekdays } from 'proton-shared/lib/date/date';
import createOrUpdateEvent from 'proton-shared/lib/calendar/integration/createOrUpdateEvent';
import { deleteEvent } from 'proton-shared/lib/api/calendars';

import {
    getExistingEvent,
    getInitialModel,
    getTimeInUtc, hasDoneChanges,
    hasEditedDateTime, hasEditedText
} from '../../components/eventModal/eventForm/state';
import { ACTIONS, TYPE } from '../../components/calendar/interactions/constants';
import { modelToVeventComponent } from '../../components/eventModal/eventForm/modelToProperties';
import { sortEvents, sortWithTemporaryEvent } from '../../components/calendar/layout';

import CreateEventModal from '../../components/eventModal/CreateEventModal';
import Popover from '../../components/calendar/Popover';
import CreateEventPopover from '../../components/eventModal/CreateEventPopover';
import EventPopover from '../../components/events/EventPopover';
import MorePopoverEvent from '../../components/events/MorePopoverEvent';

import {
    getCreateTemporaryEvent,
    getEditTemporaryEvent,
    getTemporaryEvent,
    getUpdatedDateTime
} from './eventHelper';
import CalendarView from './CalendarView';
import useUnload from '../../hooks/useUnload';
import { findUpwards } from '../../components/calendar/mouseHelpers/domHelpers';

const getNormalizedTime = (isAllDay, initial, dateFromCalendar) => {
    if (!isAllDay) {
        return dateFromCalendar;
    }
    const result = new Date(dateFromCalendar);
    // If it's an all day event, the hour and minutes are stripped from the temporary event.
    result.setUTCHours(initial.time.getHours(), initial.time.getMinutes());
    return result;
};

const InteractiveCalendarView = ({
    view,
    isLoading,

    tzid,
    primaryTimezone,
    secondaryTimezone,
    secondaryTimezoneOffset,

    displayWeekNumbers,
    displaySecondaryTimezone,
    weekStartsOn,

    now,
    date,
    dateRange,
    events,

    onClickDate,
    onChangeDate,

    calendars,
    addresses,
    defaultCalendar,
    defaultCalendarBootstrap,

    interactiveRef,
    containerRef,
    timeGridViewRef,
}) => {
    const api = useApi();
    const { call } = useEventManager();
    const { createModal, getModal, hideModal, removeModal } = useModals();

    const [eventModalID, setEventModalID] = useState();
    const readCalendarBootstrap = useReadCalendarBootstrap();
    const getCalendarKeys = useGetCalendarKeys();
    const getAddressKeys = useGetAddressKeys();

    const [interactiveData, setInteractiveData] = useState();
    const { temporaryEvent, targetEventData, targetMoreData } = interactiveData || {};

    const { tmpData, tmpDataOriginal, data: { Event: tmpEvent } = {} } = temporaryEvent || {};

    const isCreatingEvent = tmpData && !tmpEvent;
    const isEditingEvent = tmpData && !!tmpEvent;
    const isInTemporaryBlocking = tmpData && hasDoneChanges(tmpData, tmpDataOriginal, isEditingEvent);

    useUnload(isInTemporaryBlocking ? c('Alert').t`By leaving now, you will lose your event.` : undefined);

    const sortedEvents = useMemo(() => {
        return sortEvents(events.concat());
    }, [events]);

    const sortedEventsWithTemporary = useMemo(() => {
        return sortWithTemporaryEvent(sortedEvents, temporaryEvent);
    }, [temporaryEvent, sortedEvents]);

    const handleSetTemporaryEventModel = (model) => {
        const newTemporaryEvent = getTemporaryEvent(temporaryEvent, model, tzid);

        // If you select a date outside of the current range.
        const isInRange = newTemporaryEvent.start >= dateRange[0] && dateRange[1] >= newTemporaryEvent.start;
        if (!isInRange) {
            onChangeDate(newTemporaryEvent.start);
        }
        setInteractiveData({
            ...interactiveData,
            temporaryEvent: newTemporaryEvent
        });
    };

    const getCreateModel = ({ isAllDay }) => {
        const { Members = [], CalendarSettings } = defaultCalendarBootstrap;
        const [Member = {}] = Members;
        const Address = addresses.find(({ Email }) => Member.Email === Email);
        if (!Member || !Address) {
            return;
        }
        return getInitialModel({
            CalendarSettings,
            Calendar: defaultCalendar,
            Calendars: calendars,
            Addresses: addresses,
            Members,
            Member,
            Address,
            isAllDay,
            tzid
        });
    };

    const getUpdateModel = ({ Calendar, Event, readEvent }) => {
        const calendarBootstrap = readCalendarBootstrap(Calendar.ID);
        const { Members = [], CalendarSettings } = calendarBootstrap;
        const [Member = {}] = Members;
        const Address = addresses.find(({ Email }) => Member.Email === Email);
        if (!Member || !Address) {
            return;
        }
        const createResult = getInitialModel({
            CalendarSettings,
            Calendar,
            Calendars: calendars,
            Addresses: addresses,
            Members,
            Member,
            Address,
            isAllDay: false,
            tzid
        });
        const [[veventComponent, personalMap] = [], promise, error] = readEvent(Calendar.ID, Event.ID);
        if (!veventComponent || !personalMap || promise || error) {
            return;
        }
        const eventResult = getExistingEvent({
            veventComponent,
            veventValarmComponent: personalMap[Member.ID],
            tzid
        });
        return {
            ...createResult,
            ...eventResult
        };
    };

    const handleMouseDown = ({ action: originalAction, payload: originalPayload }) => {
        if (originalAction === ACTIONS.EVENT_DOWN) {
            const { event, type } = originalPayload;

            // If already creating something in blocking mode and not touching on the temporary event.
            if (temporaryEvent && event.id !== 'tmp' && isInTemporaryBlocking) {
                return;
            }

            let isAllowed = true;

            if (!isAllowed) {
                return;
            }

            let newTemporaryModel = temporaryEvent && event.id === 'tmp'
                ? temporaryEvent.tmpData
                : undefined;

            let newTemporaryEvent = temporaryEvent && event.id === 'tmp'
                ? temporaryEvent
                : undefined;

            let initialModel = newTemporaryModel;

            return ({ action, payload }) => {
                if (action === ACTIONS.EVENT_UP) {
                    const { idx } = payload;

                    setInteractiveData({
                        temporaryEvent: temporaryEvent && event.id === 'tmp' ? temporaryEvent : undefined,
                        targetEventData: { id: event.id, idx, type }
                    });
                    return;
                }

                if (!isAllowed) {
                    return;
                }

                if (!newTemporaryModel) {
                    newTemporaryModel = getUpdateModel(event.data);
                    if (!newTemporaryModel) {
                        isAllowed = false;
                        return;
                    }
                    initialModel = newTemporaryModel;
                }

                if (!newTemporaryEvent) {
                    newTemporaryEvent = getEditTemporaryEvent(event, newTemporaryModel);
                }

                const {
                    result: { start, end }
                } = payload;

                const { start: initialStart, end: initialEnd } = initialModel;

                const normalizedStart = getNormalizedTime(newTemporaryModel.isAllDay, initialStart, start);
                const normalizedEnd = getNormalizedTime(newTemporaryModel.isAllDay, initialEnd, end);

                newTemporaryModel = getUpdatedDateTime(newTemporaryModel, {
                    isAllDay: newTemporaryModel.isAllDay,
                    start: normalizedStart,
                    end: normalizedEnd,
                    tzid
                });
                newTemporaryEvent = getTemporaryEvent(newTemporaryEvent, newTemporaryModel, tzid);

                if (action === ACTIONS.EVENT_MOVE) {
                    setInteractiveData({
                        temporaryEvent: newTemporaryEvent
                    });
                }
                if (action === ACTIONS.EVENT_MOVE_UP) {
                    const { idx } = payload;

                    setInteractiveData({
                        temporaryEvent: newTemporaryEvent,
                        targetEventData: { id: 'tmp', idx, type }
                    });
                }
            };
        }

        if (originalAction === ACTIONS.CREATE_DOWN) {
            const { type } = originalPayload;
            const isFromAllDay = type === TYPE.DAYGRID;

            // If there is any popover or temporary event
            if (interactiveData && !isInTemporaryBlocking) {
                setInteractiveData();
                return;
            }

            let newTemporaryModel = (temporaryEvent && isInTemporaryBlocking)
                ? temporaryEvent.tmpData
                : getCreateModel({ isAllDay: isFromAllDay });

            const isAllowed = !!newTemporaryModel;

            if (!isAllowed) {
                return;
            }

            const { start: initialStart, end: initialEnd } = newTemporaryModel;
            let newTemporaryEvent = temporaryEvent || getCreateTemporaryEvent(defaultCalendar);

            const eventDuration = getTimeInUtc(initialEnd) - getTimeInUtc(initialStart);

            return ({ action, payload }) => {
                const {
                    result: { start, end }, idx
                } = payload;

                const normalizedStart = getNormalizedTime(isFromAllDay, initialStart, start);
                const normalizedEnd =
                    action === ACTIONS.CREATE_UP
                        ? new Date(normalizedStart.getTime() + eventDuration)
                        : getNormalizedTime(isFromAllDay, initialEnd, end);

                newTemporaryModel = getUpdatedDateTime(newTemporaryModel, {
                    isAllDay: isFromAllDay,
                    start: normalizedStart,
                    end: normalizedEnd,
                    tzid
                });
                newTemporaryEvent = getTemporaryEvent(newTemporaryEvent, newTemporaryModel, tzid);

                if (action === ACTIONS.CREATE_MOVE) {
                    setInteractiveData({ temporaryEvent: newTemporaryEvent });
                }
                if (action === ACTIONS.CREATE_UP || action === ACTIONS.CREATE_MOVE_UP) {
                    setInteractiveData({
                        temporaryEvent: newTemporaryEvent,
                        targetEventData: { id: 'tmp', idx, type }
                    });
                }
            };
        }

        if (originalAction === ACTIONS.MORE_DOWN) {
            const { idx, row, events, date } = originalPayload;
            return ({ action }) => {
                if (action === ACTIONS.MORE_UP) {
                    setInteractiveData({
                        targetMoreData: { idx, row, events, date }
                    });
                }
            };
        }
    };

    const handleClickEvent = ({ id, idx, type }) => {
        setInteractiveData({
            ...interactiveData,
            targetEventData: { id, idx, type }
        });
    };

    const handleSaveEvent = async ({ tmpData, data: { Event }}) => {
        const { calendar: { id: calendarID }, member: { memberID, addressID } } = tmpData;
        const [addressKeys, calendarKeys] = await Promise.all([getAddressKeys(addressID), getCalendarKeys(calendarID)]);
        const veventComponent = modelToVeventComponent(tmpData, tzid);
        await createOrUpdateEvent({
            Event,
            veventComponent,
            memberID,
            calendarID,
            addressKeys,
            calendarKeys,
            api
        });
        await call();
    };

    const handleCloseConfirmation = () => {
        return new Promise((resolve, reject) => {
            createModal(
                <ConfirmModal
                    title={c('Info').t`Discard unsaved changes?`}
                    close={<ResetButton autoFocus={true}>{c('Action').t`Cancel`}</ResetButton>}
                    confirm={c('Action').t`Discard`}
                    onClose={reject}
                    onConfirm={resolve}
                >
                </ConfirmModal>
            );
        });
    };

    const handleDeleteConfirmation = () => {
        return new Promise((resolve, reject) => {
            createModal(
                <ConfirmModal
                    confirm={c('Action').t`Delete`}
                    title={c('Info').t`Delete event`}
                    close={<ResetButton autoFocus={true}>{c('Action').t`Cancel`}</ResetButton>}
                    onClose={reject}
                    onConfirm={resolve}
                >
                    <Alert>{c('Info').t`Would you like to delete this event?`}</Alert>
                </ConfirmModal>
            );
        });
    };

    const handleDeleteEvent = async ({ CalendarID, ID: EventID }) => {
        await handleDeleteConfirmation();
        await api(deleteEvent(CalendarID, EventID));
        await call();
    };

    const safeCloseTemporaryEventAndPopover = () => {
        setInteractiveData();
    };

    const handleConfirmDeleteTemporary = ({ ask = false } = {}) => {
        if (isInTemporaryBlocking) {
            if (!ask) {
                return Promise.reject(new Error('Keep event'));
            }
            return handleCloseConfirmation()
                .catch(() => Promise.reject(new Error('Keep event')));
        }
        return Promise.resolve();
    };

    const handleEditEvent = (temporaryEvent) => {
        // Close the popover only
        setInteractiveData({ temporaryEvent });
        setEventModalID(createModal());
    };

    const handleCreateEvent = () => {
        const newTemporaryEvent = getTemporaryEvent(
            getCreateTemporaryEvent(defaultCalendar),
            getCreateModel({ isAllDay: false }),
            tzid
        );
        handleEditEvent(newTemporaryEvent);
    };

    useImperativeHandle(
        interactiveRef,
        () => ({
            closePopover: () => {
                handleConfirmDeleteTemporary({ ask: true })
                    .then(safeCloseTemporaryEventAndPopover)
                    .catch(noop);
            },
            createEvent: () => {
                handleCreateEvent()
            },
        }),
    );

    const [targetEventRef, setTargetEventRef] = useState();
    const [targetMoreRef, setTargetMoreRef] = useState();

    const targetEvent = useMemo(() => {
        if (!targetEventData) {
            return;
        }
        return sortedEventsWithTemporary.find(({ id }) => id === targetEventData.id);
    }, [targetEventData, sortedEventsWithTemporary]);

    const autoCloseRef = useRef();
    autoCloseRef.current = ({ ask }) => {
        handleConfirmDeleteTemporary({ ask })
            .then(safeCloseTemporaryEventAndPopover)
            .catch(noop);
    };

    useEffect(() => {
        if (!containerRef) {
            return;
        }
        // React bubbles event through https://github.com/facebook/react/issues/11387 portals, so set up a click
        // listener to prevent clicks on the popover to be interpreted as an auto close click
        const handler = (e) => {
            // Only ask to auto close if an action wasn't clicked.
            if (findUpwards(e.target, e.currentTarget, (el) => {
                return ['BUTTON', 'A', 'SELECT', 'INPUT'].includes(el.nodeName);
            })) {
                autoCloseRef.current({ ask: false });
                return;
            }
            autoCloseRef.current({ ask: true });
        };
        containerRef.addEventListener('click', handler);
        return () => containerRef.removeEventListener('click', handler);
    }, [containerRef]);

    const formatDate = useCallback((utcDate) => {
        return format(utcDate, 'PP', { locale: dateLocale });
    }, [dateLocale]);

    const formatTime = useCallback((utcDate) => {
        return format(utcDate, 'p', { locale: dateLocale });
    }, [dateLocale]);

    const weekdaysLong = useMemo(() => {
        return getFormattedWeekdays('cccc', { locale: dateLocale });
    }, [dateLocale]);

    return (
        <>
            <CalendarView
                view={view}

                isInteractionEnabled={!isLoading}
                onMouseDown={handleMouseDown}

                tzid={tzid}
                primaryTimezone={primaryTimezone}
                secondaryTimezone={secondaryTimezone}
                secondaryTimezoneOffset={secondaryTimezoneOffset}

                targetEventData={targetEventData}
                targetEventRef={setTargetEventRef}
                targetMoreRef={setTargetMoreRef}
                targetMoreData={targetMoreData}

                displayWeekNumbers={displayWeekNumbers}
                displaySecondaryTimezone={displaySecondaryTimezone}

                now={now}
                date={date}
                dateRange={dateRange}
                events={sortedEventsWithTemporary}
                onClickDate={onClickDate}

                formatTime={formatTime}
                formatDate={formatDate}
                weekdaysLong={weekdaysLong}

                timeGridViewRef={timeGridViewRef}
            />
            <Popover containerRef={document.body} targetRef={targetEventRef} isOpen={!!targetEvent} once={true} when={targetEvent ? targetEvent.start : undefined}>
                {({ style, ref }) => {
                    if (targetEvent.id === 'tmp') {
                        return (
                            <CreateEventPopover
                                style={style}
                                popoverRef={ref}
                                tzid={tzid}
                                model={tmpData}
                                displayWeekNumbers={displayWeekNumbers}
                                weekStartsOn={weekStartsOn}
                                setModel={handleSetTemporaryEventModel}
                                onSave={() => handleSaveEvent(temporaryEvent)}
                                onEdit={() => handleEditEvent(temporaryEvent)}
                                onClose={({ safe = false } = {}) => {
                                    if (safe) {
                                        return safeCloseTemporaryEventAndPopover();
                                    }
                                    handleConfirmDeleteTemporary({ ask: true })
                                        .then(safeCloseTemporaryEventAndPopover)
                                        .catch(noop);
                                }}
                                isCreateEvent={isCreatingEvent}
                            />
                        );
                    }
                    return (
                        <EventPopover
                            style={style}
                            popoverRef={ref}
                            event={targetEvent}
                            tzid={tzid}
                            formatTime={formatTime}
                            onDelete={() => handleDeleteEvent(targetEvent.data.Event)}
                            onEdit={() => {
                                const newTemporaryModel = getUpdateModel(targetEvent.data);
                                const newTemporaryEvent = getTemporaryEvent(
                                    getEditTemporaryEvent(targetEvent, newTemporaryModel),
                                    newTemporaryModel,
                                    tzid
                                );
                                handleEditEvent(newTemporaryEvent);
                            }}
                            onClose={safeCloseTemporaryEventAndPopover}
                        />
                    );
                }}
            </Popover>
            <Popover containerRef={document.body} targetRef={targetMoreRef} isOpen={!!targetMoreData} once={true}>
                {({ style, ref }) => {
                    return (
                        <MorePopoverEvent
                            style={style}
                            popoverRef={ref}
                            date={targetMoreData.date}
                            events={targetMoreData.events}
                            targetEventRef={setTargetEventRef}
                            targetEventData={targetEventData}
                            formatTime={formatTime}
                            onClickEvent={handleClickEvent}
                            onClose={safeCloseTemporaryEventAndPopover}
                        />
                    );
                }}
            </Popover>
            <Prompt
                message={(location) => {
                    if (isInTemporaryBlocking && location.pathname.includes('settings')) {
                        handleConfirmDeleteTemporary({ ask: true })
                            .then(safeCloseTemporaryEventAndPopover)
                            .catch(noop);
                        return false;
                    }
                    return true;
                }}
            />

            {eventModalID && tmpData ? (
                <CreateEventModal
                    displayWeekNumbers={displayWeekNumbers}
                    weekStartsOn={weekStartsOn}
                    tzid={tzid}
                    model={tmpData}
                    setModel={handleSetTemporaryEventModel}
                    onSave={() => handleSaveEvent(temporaryEvent)}
                    onDelete={() => temporaryEvent.data && temporaryEvent.data.Event && handleDeleteEvent(temporaryEvent.data.Event)}
                    onClose={({ safe = false } = {}) => {
                        if (safe) {
                            return hideModal(eventModalID);
                        }
                        handleConfirmDeleteTemporary({ ask: true })
                            .then(() => hideModal(eventModalID))
                            .catch(noop);
                    }}
                    onExit={() => {
                        removeModal(eventModalID);
                        setEventModalID();
                        safeCloseTemporaryEventAndPopover();
                    }}
                    isCreateEvent={isCreatingEvent}
                    {...getModal(eventModalID)}
                />
            ): null}
        </>
    );
};

export default InteractiveCalendarView;

