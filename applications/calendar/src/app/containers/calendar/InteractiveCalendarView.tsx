import { c } from 'ttag';
import { Prompt } from 'react-router';
import { noop } from 'proton-shared/lib/helpers/function';
import React, { RefObject, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import {
    useApi,
    useEventManager,
    useGetAddressKeys,
    useGetCalendarKeys,
    useModals,
    useNotifications,
} from 'react-components';
import { useReadCalendarBootstrap } from 'react-components/hooks/useGetCalendarBootstrap';

import { format, isSameDay } from 'proton-shared/lib/date-fns-utc';
import { dateLocale } from 'proton-shared/lib/i18n';
import { getFormattedWeekdays } from 'proton-shared/lib/date/date';
import { getIsCalendarProbablyActive } from 'proton-shared/lib/calendar/calendar';

import { omit } from 'proton-shared/lib/helpers/object';
import { Calendar, CalendarBootstrap, CalendarEvent } from 'proton-shared/lib/interfaces/calendar';
import { Address } from 'proton-shared/lib/interfaces';
import { getExistingEvent, getInitialModel } from '../../components/eventModal/eventForm/state';
import { getTimeInUtc } from '../../components/eventModal/eventForm/time';
import { ACTIONS, TYPE } from '../../components/calendar/interactions/constants';
import { sortEvents, sortWithTemporaryEvent } from '../../components/calendar/sortLayout';

import CreateEventModal from '../../components/eventModal/CreateEventModal';
import Popover, { PopoverRenderData } from '../../components/calendar/Popover';
import CreateEventPopover from '../../components/eventModal/CreateEventPopover';
import EventPopover from '../../components/events/EventPopover';
import MorePopoverEvent from '../../components/events/MorePopoverEvent';

import { getCreateTemporaryEvent, getEditTemporaryEvent, getTemporaryEvent, getUpdatedDateTime } from './eventHelper';
import CalendarView from './CalendarView';
import useUnload from '../../hooks/useUnload';
import { findUpwards } from '../../components/calendar/mouseHelpers/domHelpers';
import CloseConfirmationModal from './confirmationModals/CloseConfirmation';
import DeleteConfirmModal from './confirmationModals/DeleteConfirmModal';
import DeleteRecurringConfirmModal from './confirmationModals/DeleteRecurringConfirmModal';
import {
    DELETE_CONFIRMATION_TYPES,
    MAXIMUM_DATE_UTC,
    MINIMUM_DATE_UTC,
    RECURRING_TYPES,
    SAVE_CONFIRMATION_TYPES,
} from '../../constants';

import getMemberAndAddress from '../../helpers/getMemberAndAddress';
import EditRecurringConfirmModal from './confirmationModals/EditRecurringConfirmation';
import handleSaveEventHelper from './eventActions/handleSaveEvent';
import handleDeleteEventHelper from './eventActions/handleDeleteEvent';
import { getHasDoneChanges } from '../../components/eventModal/eventForm/getHasEdited';
import withOccurrenceEvent from './eventActions/occurrenceEvent';
import {
    CalendarViewEvent,
    CalendarViewEventData,
    CalendarViewEventTemporaryEvent,
    InteractiveRef,
    InteractiveState,
    SharedViewProps,
    TargetEventData,
    TimeGridRef,
    WeekStartsOn,
} from './interface';
import { DateTimeModel, EventModel } from '../../interfaces/EventModel';
import { DecryptedEventTupleResult } from './eventStore/interface';
import {
    isCreateDownAction,
    isEventDownAction,
    isMoreDownAction,
    MouseDownAction,
    MouseUpAction,
} from '../../components/calendar/interactions/interface';
import useGetCalendarEventPersonal from './eventStore/useGetCalendarEventPersonal';
import useGetCalendarEventRaw from './eventStore/useGetCalendarEventRaw';

const getNormalizedTime = (isAllDay: boolean, initial: DateTimeModel, dateFromCalendar: Date) => {
    if (!isAllDay) {
        return dateFromCalendar;
    }
    const result = new Date(dateFromCalendar);
    // If it's an all day event, the hour and minutes are stripped from the temporary event.
    result.setUTCHours(initial.time.getHours(), initial.time.getMinutes());
    return result;
};

interface Props extends SharedViewProps {
    isLoading: boolean;
    weekStartsOn: WeekStartsOn;
    onChangeDate: (date: Date) => void;
    onInteraction: (active: boolean) => void;
    activeCalendars: Calendar[];
    addresses: Address[];
    activeAddresses: Address[];
    defaultCalendar?: Calendar;
    defaultCalendarBootstrap?: CalendarBootstrap;
    containerRef: HTMLDivElement | null;
    timeGridViewRef: RefObject<TimeGridRef>;
    interactiveRef: RefObject<InteractiveRef>;
}
const InteractiveCalendarView = ({
    view,
    isLoading,
    isNarrow,

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
    onInteraction,

    addresses,
    activeAddresses,

    activeCalendars,
    defaultCalendar,
    defaultCalendarBootstrap,

    interactiveRef,
    containerRef,
    timeGridViewRef,
}: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const { createModal, getModal, hideModal, removeModal } = useModals();
    const { createNotification } = useNotifications();

    const [eventModalID, setEventModalID] = useState();

    const readCalendarBootstrap = useReadCalendarBootstrap();
    const getCalendarKeys = useGetCalendarKeys();
    const getAddressKeys = useGetAddressKeys();
    const getCalendarEventPersonal = useGetCalendarEventPersonal();
    const getCalendarEventRaw = useGetCalendarEventRaw();

    const getEventDecrypted = (eventData: CalendarEvent): Promise<DecryptedEventTupleResult> => {
        return Promise.all([getCalendarEventRaw(eventData), getCalendarEventPersonal(eventData)]);
    };

    const [interactiveData, setInteractiveData] = useState<InteractiveState>();

    const { temporaryEvent, targetEventData, targetMoreData } = interactiveData || {};

    const { tmpData, tmpDataOriginal, data } = temporaryEvent || {};
    const tmpEvent = data?.eventData;

    const isCreatingEvent = !!tmpData && !tmpEvent;
    const isEditingEvent = !!tmpData && !!tmpEvent;
    const isInTemporaryBlocking =
        tmpData && tmpDataOriginal && getHasDoneChanges(tmpData, tmpDataOriginal, isEditingEvent);
    const isScrollDisabled = !!interactiveData && !temporaryEvent;

    useEffect(() => {
        onInteraction?.(!!temporaryEvent);
    }, [!!temporaryEvent]);

    useUnload(isInTemporaryBlocking ? c('Alert').t`By leaving now, you will lose your event.` : '');

    const sortedEvents = useMemo(() => {
        return sortEvents(events.concat());
    }, [events]);

    const sortedEventsWithTemporary = useMemo(() => {
        return sortWithTemporaryEvent(sortedEvents, temporaryEvent);
    }, [temporaryEvent, sortedEvents]);

    const handleSetTemporaryEventModel = (model: EventModel) => {
        if (!temporaryEvent) {
            return;
        }
        const newTemporaryEvent = getTemporaryEvent(temporaryEvent, model, tzid);

        // If you select a date outside of the current range.
        const newStartDay = newTemporaryEvent.start;
        const isInRange = isNarrow
            ? isSameDay(date, newStartDay)
            : newStartDay >= dateRange[0] && dateRange[1] >= newStartDay;
        if (!isInRange) {
            onChangeDate(newTemporaryEvent.start);
        }

        setInteractiveData({
            ...interactiveData,
            temporaryEvent: newTemporaryEvent,
        });
    };

    const getInitialDate = () => {
        return new Date(
            Date.UTC(
                date.getUTCFullYear(),
                date.getUTCMonth(),
                date.getUTCDate(),
                now.getUTCHours(),
                now.getUTCMinutes()
            )
        );
    };

    const getCreateModel = (isAllDay: boolean) => {
        if (!defaultCalendar || !defaultCalendarBootstrap) {
            return;
        }

        const initialDate = getInitialDate();

        const { Members = [], CalendarSettings } = defaultCalendarBootstrap;
        const [Member] = Members;
        const Address = activeAddresses.find(({ Email }) => Member?.Email === Email);
        if (!Member || !Address) {
            return;
        }
        return getInitialModel({
            initialDate,
            CalendarSettings,
            Calendar: defaultCalendar,
            Calendars: activeCalendars,
            Addresses: activeAddresses,
            Members,
            Member,
            Address,
            isAllDay,
            tzid,
        });
    };

    const getUpdateModel = ({
        calendarData,
        eventData,
        eventReadResult,
        eventRecurrence,
    }: CalendarViewEventData): EventModel | undefined => {
        if (!eventData || !eventReadResult || eventReadResult.error || !eventReadResult.result) {
            return;
        }
        const initialDate = getInitialDate();

        const { Members = [], CalendarSettings } = readCalendarBootstrap(calendarData.ID);
        const [Member, Address] = getMemberAndAddress(activeAddresses, Members, eventData.Author);

        const createResult = getInitialModel({
            initialDate,
            CalendarSettings,
            Calendar: calendarData,
            Calendars: activeCalendars,
            Addresses: activeAddresses,
            Members,
            Member,
            Address,
            isAllDay: false,
            tzid,
        });
        const [veventComponent, personalMap] = eventReadResult.result;
        const originalOrOccurrenceEvent = eventRecurrence
            ? withOccurrenceEvent(veventComponent, eventRecurrence)
            : veventComponent;
        const eventResult = getExistingEvent({
            veventComponent: originalOrOccurrenceEvent,
            veventValarmComponent: personalMap[Member.ID],
            tzid,
        });
        return {
            ...createResult,
            ...eventResult,
        };
    };

    const handleMouseDown = (mouseDownAction: MouseDownAction) => {
        if (isEventDownAction(mouseDownAction)) {
            const { event, type } = mouseDownAction.payload;

            // If already creating something in blocking mode and not touching on the temporary event.
            if (temporaryEvent && event.id !== 'tmp' && isInTemporaryBlocking) {
                return;
            }

            const targetCalendar = (event && event.data && event.data.calendarData) || undefined;

            const isAllowedToTouchEvent = true;
            let isAllowedToMoveEvent = getIsCalendarProbablyActive(targetCalendar);

            if (!isAllowedToTouchEvent) {
                return;
            }

            let newTemporaryModel = temporaryEvent && event.id === 'tmp' ? temporaryEvent.tmpData : undefined;
            let newTemporaryEvent = temporaryEvent && event.id === 'tmp' ? temporaryEvent : undefined;
            let initialModel = newTemporaryModel;

            return (mouseUpAction: MouseUpAction) => {
                if (mouseUpAction.action === ACTIONS.EVENT_UP) {
                    const { idx } = mouseUpAction.payload;

                    setInteractiveData({
                        temporaryEvent: temporaryEvent && event.id === 'tmp' ? temporaryEvent : undefined,
                        targetEventData: { id: event.id, idx, type },
                    });
                    return;
                }

                if (!isAllowedToMoveEvent) {
                    return;
                }

                if (!newTemporaryModel) {
                    newTemporaryModel = getUpdateModel(event.data);
                    if (!newTemporaryModel) {
                        isAllowedToMoveEvent = false;
                        return;
                    }
                    initialModel = newTemporaryModel;
                }

                if (!newTemporaryEvent) {
                    newTemporaryEvent = getEditTemporaryEvent(event, newTemporaryModel, tzid);
                }

                if (mouseUpAction.action !== ACTIONS.EVENT_MOVE && mouseUpAction.action !== ACTIONS.EVENT_MOVE_UP) {
                    return;
                }

                const {
                    result: { start, end },
                } = mouseUpAction.payload;

                const isBeforeMinBoundary = start < MINIMUM_DATE_UTC;
                const isAfterMaxBoundary = end > MAXIMUM_DATE_UTC;
                const isOutOfBounds = isBeforeMinBoundary || isAfterMaxBoundary;
                if (isOutOfBounds && mouseUpAction.action === ACTIONS.EVENT_MOVE_UP) {
                    const minDateString = format(MINIMUM_DATE_UTC, 'P');
                    const maxDateString = format(MAXIMUM_DATE_UTC, 'P');
                    createNotification({
                        text: c('Error')
                            .t`It is only possible to move events between ${minDateString} - ${maxDateString}`,
                        type: 'error',
                    });
                    setInteractiveData(undefined);
                    return;
                }

                if (!initialModel) {
                    return;
                }
                const { start: initialStart, end: initialEnd } = initialModel;

                const normalizedStart = getNormalizedTime(newTemporaryModel.isAllDay, initialStart, start);
                const normalizedEnd = getNormalizedTime(newTemporaryModel.isAllDay, initialEnd, end);

                newTemporaryModel = getUpdatedDateTime(newTemporaryModel, {
                    isAllDay: newTemporaryModel.isAllDay,
                    start: normalizedStart,
                    end: normalizedEnd,
                    tzid,
                });
                newTemporaryEvent = getTemporaryEvent(newTemporaryEvent, newTemporaryModel, tzid);

                if (mouseUpAction.action === ACTIONS.EVENT_MOVE) {
                    setInteractiveData({
                        temporaryEvent: newTemporaryEvent,
                    });
                }
                if (mouseUpAction.action === ACTIONS.EVENT_MOVE_UP) {
                    const { idx } = mouseUpAction.payload;

                    setInteractiveData({
                        temporaryEvent: newTemporaryEvent,
                        targetEventData: { id: 'tmp', idx, type },
                    });
                }
            };
        }

        if (isCreateDownAction(mouseDownAction)) {
            if (!defaultCalendar || !defaultCalendarBootstrap) {
                return;
            }

            const { type } = mouseDownAction.payload;
            const isFromAllDay = type === TYPE.DAYGRID;

            // If there is any popover or temporary event
            if (interactiveData && !isInTemporaryBlocking) {
                setInteractiveData(undefined);
                return;
            }

            let newTemporaryModel =
                temporaryEvent && isInTemporaryBlocking ? temporaryEvent.tmpData : getCreateModel(isFromAllDay);

            const isAllowed = !!newTemporaryModel;

            if (!isAllowed) {
                return;
            }

            if (!newTemporaryModel) {
                return;
            }
            const { start: initialStart, end: initialEnd } = newTemporaryModel;
            let newTemporaryEvent = temporaryEvent || getCreateTemporaryEvent(defaultCalendar, newTemporaryModel, tzid);

            const eventDuration = +getTimeInUtc(initialEnd, false) - +getTimeInUtc(initialStart, false);

            return (mouseUpAction: MouseUpAction) => {
                if (
                    mouseUpAction.action !== ACTIONS.CREATE_UP &&
                    mouseUpAction.action !== ACTIONS.CREATE_MOVE &&
                    mouseUpAction.action !== ACTIONS.CREATE_MOVE_UP
                ) {
                    return;
                }

                const { action, payload } = mouseUpAction;
                const {
                    result: { start, end },
                    idx,
                } = payload;

                const isBeforeMinBoundary = start < MINIMUM_DATE_UTC;
                const isAfterMaxBoundary = end > MAXIMUM_DATE_UTC;
                const isOutOfBounds = isBeforeMinBoundary || isAfterMaxBoundary;
                if (isOutOfBounds && (action === ACTIONS.CREATE_UP || action === ACTIONS.CREATE_MOVE_UP)) {
                    const minDateString = format(MINIMUM_DATE_UTC, 'P');
                    const maxDateString = format(MAXIMUM_DATE_UTC, 'P');
                    createNotification({
                        text: c('Error')
                            .t`It is only possible to create events between ${minDateString} - ${maxDateString}`,
                        type: 'error',
                    });
                    setInteractiveData(undefined);
                    return;
                }

                const normalizedStart = start;
                const normalizedEnd =
                    action === ACTIONS.CREATE_UP
                        ? isFromAllDay
                            ? start
                            : new Date(normalizedStart.getTime() + eventDuration)
                        : end;

                if (!newTemporaryModel || !newTemporaryEvent) {
                    return;
                }
                newTemporaryModel = getUpdatedDateTime(newTemporaryModel, {
                    isAllDay: isFromAllDay,
                    start: normalizedStart,
                    end: normalizedEnd,
                    tzid,
                });
                newTemporaryEvent = getTemporaryEvent(newTemporaryEvent, newTemporaryModel, tzid);

                if (action === ACTIONS.CREATE_MOVE) {
                    setInteractiveData({ temporaryEvent: newTemporaryEvent });
                }
                if (action === ACTIONS.CREATE_UP || action === ACTIONS.CREATE_MOVE_UP) {
                    setInteractiveData({
                        temporaryEvent: newTemporaryEvent,
                        targetEventData: { id: 'tmp', idx, type },
                    });
                }
            };
        }

        if (isMoreDownAction(mouseDownAction)) {
            const { idx, row, events, date } = mouseDownAction.payload;

            // If there is any temporary event, don't allow to open the more popover so that
            // 1) this event is not shown in more, and 2) the confirmation modal is shown
            if (temporaryEvent) {
                return;
            }

            return (mouseUpAction: MouseUpAction) => {
                if (mouseUpAction.action === ACTIONS.MORE_UP) {
                    setInteractiveData({
                        targetMoreData: { idx, row, events, date },
                    });
                }
            };
        }
    };

    const handleClickEvent = ({ id, idx, type }: TargetEventData) => {
        setInteractiveData({
            ...interactiveData,
            targetEventData: { id, idx, type },
        });
    };

    const handleCloseConfirmation = () => {
        return new Promise((resolve, reject) => {
            createModal(<CloseConfirmationModal onClose={reject} onConfirm={resolve} />);
        });
    };

    const handleSaveConfirmation = ({
        type,
        data,
    }: {
        type: SAVE_CONFIRMATION_TYPES;
        data?: {
            types: RECURRING_TYPES[];
            hasSingleModifications: boolean;
        };
    }): Promise<RECURRING_TYPES> => {
        return new Promise((resolve, reject) => {
            if (type === SAVE_CONFIRMATION_TYPES.RECURRING && data) {
                return createModal(
                    <EditRecurringConfirmModal
                        types={data.types}
                        hasSingleModifications={data.hasSingleModifications}
                        onClose={reject}
                        onConfirm={resolve}
                    />
                );
            }
            return reject(new Error('Unknown type'));
        });
    };

    const handleDeleteConfirmation = ({
        type,
        data,
    }: {
        type: DELETE_CONFIRMATION_TYPES;
        data?: RECURRING_TYPES[];
    }): Promise<RECURRING_TYPES> => {
        return new Promise((resolve, reject) => {
            if (type === DELETE_CONFIRMATION_TYPES.SINGLE) {
                return createModal(<DeleteConfirmModal onClose={reject} onConfirm={resolve} />);
            }
            if (type === DELETE_CONFIRMATION_TYPES.RECURRING && data) {
                return createModal(<DeleteRecurringConfirmModal types={data} onClose={reject} onConfirm={resolve} />);
            }
            return reject(new Error('Unknown type'));
        });
    };

    const closeAllPopovers = () => {
        setInteractiveData(undefined);
    };

    const handleCloseMorePopover = closeAllPopovers;

    const handleCloseEventPopover = () => {
        // If both a more popover and an event is open, first close the event
        if (interactiveData && interactiveData.targetMoreData && interactiveData.targetEventData) {
            setInteractiveData(omit(interactiveData, ['targetEventData']));
            return;
        }
        closeAllPopovers();
    };

    const handleConfirmDeleteTemporary = ({ ask = false } = {}) => {
        if (isInTemporaryBlocking) {
            if (!ask) {
                return Promise.reject(new Error('Keep event'));
            }
            return handleCloseConfirmation().catch(() => Promise.reject(new Error('Keep event')));
        }
        return Promise.resolve();
    };

    const handleEditEvent = (temporaryEvent: CalendarViewEventTemporaryEvent) => {
        // Close the popover only
        setInteractiveData({ temporaryEvent });
        setEventModalID(createModal());
    };

    const handleCreateEvent = () => {
        if (!defaultCalendar) {
            return;
        }
        const startModel = getCreateModel(false);
        if (!startModel) {
            throw new Error('Unable to get create model');
        }
        const newTemporaryEvent = getTemporaryEvent(
            getCreateTemporaryEvent(defaultCalendar, startModel, tzid),
            startModel,
            tzid
        );
        handleEditEvent(newTemporaryEvent);
    };

    const handleSaveEvent = async (temporaryEvent: CalendarViewEventTemporaryEvent) => {
        return handleSaveEventHelper({
            temporaryEvent,
            weekStartsOn,

            addresses,
            calendars: activeCalendars,

            onSaveConfirmation: handleSaveConfirmation,

            api,
            call,
            getAddressKeys,
            getCalendarKeys,
            getEventDecrypted,
            getCalendarBootstrap: readCalendarBootstrap,
            createNotification,
        });
    };

    const handleDeleteEvent = async (targetEvent: CalendarViewEvent) => {
        return handleDeleteEventHelper({
            targetEvent,

            addresses,

            onDeleteConfirmation: handleDeleteConfirmation,

            api,
            call,
            getAddressKeys,
            getCalendarKeys,
            getEventDecrypted,
            getCalendarBootstrap: readCalendarBootstrap,
            createNotification,
        });
    };

    useImperativeHandle(interactiveRef, () => ({
        createEvent: () => {
            handleCreateEvent();
        },
    }));

    const [targetEventRef, setTargetEventRef] = useState<HTMLDivElement | null>(null);
    const [targetMoreRef, setTargetMoreRef] = useState<HTMLDivElement | null>(null);

    const targetEvent = useMemo(() => {
        if (!targetEventData) {
            return;
        }
        return sortedEventsWithTemporary.find(({ id }) => id === targetEventData.id);
    }, [targetEventData, sortedEventsWithTemporary]);

    const autoCloseRef = useRef<({ ask }: { ask: boolean }) => void>();
    autoCloseRef.current = ({ ask }) => {
        handleConfirmDeleteTemporary({ ask }).then(closeAllPopovers).catch(noop);
    };

    useEffect(() => {
        if (!containerRef) {
            return;
        }
        // React bubbles event through https://github.com/facebook/react/issues/11387 portals, so set up a click
        // listener to prevent clicks on the popover to be interpreted as an auto close click
        const handler = (e: MouseEvent) => {
            // Only ask to auto close if an action wasn't clicked.
            if (
                e.target instanceof HTMLElement &&
                e.currentTarget instanceof HTMLElement &&
                findUpwards(e.target, e.currentTarget, (el: HTMLElement) => {
                    return ['BUTTON', 'A', 'SELECT', 'INPUT'].includes(el.nodeName);
                })
            ) {
                autoCloseRef.current?.({ ask: false });
                return;
            }
            autoCloseRef?.current?.({ ask: true });
        };
        containerRef.addEventListener('click', handler);
        return () => containerRef.removeEventListener('click', handler);
    }, [containerRef]);

    const formatDate = useCallback(
        (utcDate) => {
            return format(utcDate, 'PP', { locale: dateLocale });
        },
        [dateLocale]
    );

    const formatTime = useCallback(
        (utcDate) => {
            return format(utcDate, 'p', { locale: dateLocale });
        },
        [dateLocale]
    );

    const weekdaysLong = useMemo(() => {
        return getFormattedWeekdays('cccc', { locale: dateLocale });
    }, [dateLocale]);

    return (
        <>
            <CalendarView
                view={view}
                isNarrow={isNarrow}
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
                isScrollDisabled={isScrollDisabled}
            />
            <Popover
                containerEl={document.body}
                targetEl={targetEventRef}
                isOpen={!!targetEvent}
                once
                when={targetEvent ? targetEvent.start : undefined}
            >
                {({ style, ref }: PopoverRenderData) => {
                    if (!targetEvent) {
                        return null;
                    }
                    if (targetEvent.id === 'tmp' && tmpData) {
                        return (
                            <CreateEventPopover
                                isNarrow={isNarrow}
                                style={style}
                                popoverRef={ref}
                                model={tmpData}
                                displayWeekNumbers={displayWeekNumbers}
                                weekStartsOn={weekStartsOn}
                                setModel={handleSetTemporaryEventModel}
                                onSave={() => {
                                    if (!temporaryEvent) {
                                        return Promise.reject(new Error('Undefined behavior'));
                                    }
                                    return handleSaveEvent(temporaryEvent).then(closeAllPopovers).catch(noop);
                                }}
                                onEdit={() => {
                                    if (!temporaryEvent) {
                                        return;
                                    }
                                    handleEditEvent(temporaryEvent);
                                }}
                                onClose={() => {
                                    return handleConfirmDeleteTemporary({ ask: true })
                                        .then(closeAllPopovers)
                                        .catch(noop);
                                }}
                                isCreateEvent={isCreatingEvent}
                            />
                        );
                    }
                    return (
                        <EventPopover
                            isNarrow={isNarrow}
                            style={style}
                            popoverRef={ref}
                            event={targetEvent}
                            tzid={tzid}
                            weekStartsOn={weekStartsOn}
                            formatTime={formatTime}
                            onDelete={() => {
                                return (
                                    handleDeleteEvent(targetEvent)
                                        // Also close the more popover to avoid this event showing there
                                        .then(closeAllPopovers)
                                        .catch(noop)
                                );
                            }}
                            onEdit={() => {
                                if (!targetEvent) {
                                    return;
                                }
                                const newTemporaryModel = getUpdateModel(targetEvent.data);
                                if (!newTemporaryModel) {
                                    return;
                                }
                                const newTemporaryEvent = getTemporaryEvent(
                                    getEditTemporaryEvent(targetEvent, newTemporaryModel, tzid),
                                    newTemporaryModel,
                                    tzid
                                );
                                return handleEditEvent(newTemporaryEvent);
                            }}
                            onClose={handleCloseEventPopover}
                        />
                    );
                }}
            </Popover>
            <Popover containerEl={document.body} targetEl={targetMoreRef} isOpen={!!targetMoreData} once>
                {({ style, ref }: PopoverRenderData) => {
                    if (!targetMoreData) {
                        return null;
                    }
                    return (
                        <MorePopoverEvent
                            tzid={tzid}
                            isNarrow={isNarrow}
                            style={style}
                            popoverRef={ref}
                            now={now}
                            date={targetMoreData.date}
                            events={events.filter(({ id }) => targetMoreData?.events.has(id))}
                            targetEventRef={setTargetEventRef}
                            targetEventData={targetEventData}
                            formatTime={formatTime}
                            onClickEvent={handleClickEvent}
                            onClose={handleCloseMorePopover}
                        />
                    );
                }}
            </Popover>
            <Prompt
                message={(location) => {
                    if (isInTemporaryBlocking && location.pathname.includes('settings')) {
                        handleConfirmDeleteTemporary({ ask: true }).then(closeAllPopovers).catch(noop);
                        return false;
                    }
                    return true;
                }}
            />

            {eventModalID && tmpData ? (
                <CreateEventModal
                    isNarrow={isNarrow}
                    displayWeekNumbers={displayWeekNumbers}
                    weekStartsOn={weekStartsOn}
                    tzid={tzid}
                    model={tmpData}
                    setModel={handleSetTemporaryEventModel}
                    onSave={() => {
                        if (!temporaryEvent) {
                            return Promise.reject(new Error('Undefined behavior'));
                        }
                        return handleSaveEvent(temporaryEvent)
                            .then(() => hideModal(eventModalID))
                            .catch(noop);
                    }}
                    onDelete={() => {
                        if (!temporaryEvent?.data?.eventData || !temporaryEvent.tmpOriginalTarget) {
                            return;
                        }
                        return handleDeleteEvent(temporaryEvent.tmpOriginalTarget)
                            .then(() => hideModal(eventModalID))
                            .catch(noop);
                    }}
                    onClose={() => {
                        return handleConfirmDeleteTemporary({ ask: true })
                            .then(() => hideModal(eventModalID))
                            .catch(noop);
                    }}
                    onExit={() => {
                        removeModal(eventModalID);
                        setEventModalID(undefined);
                        closeAllPopovers();
                    }}
                    isCreateEvent={isCreatingEvent}
                    {...getModal(eventModalID)}
                />
            ) : null}
        </>
    );
};

export default InteractiveCalendarView;
