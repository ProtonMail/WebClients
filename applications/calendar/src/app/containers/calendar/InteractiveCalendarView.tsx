import { updateAttendeePartstat, updateCalendar, updatePersonalEventPart } from '@proton/shared/lib/api/calendars';
import { processApiRequestsSafe } from '@proton/shared/lib/api/helpers/safeApiRequests';
import { toApiPartstat } from '@proton/shared/lib/calendar/attendees';
import { getIsCalendarProbablyActive } from '@proton/shared/lib/calendar/calendar';
import {
    DELETE_CONFIRMATION_TYPES,
    ICAL_ATTENDEE_STATUS,
    MAXIMUM_DATE_UTC,
    MINIMUM_DATE_UTC,
    SAVE_CONFIRMATION_TYPES,
} from '@proton/shared/lib/calendar/constants';
import { reformatApiErrorMessage } from '@proton/shared/lib/calendar/helper';
import getMemberAndAddress from '@proton/shared/lib/calendar/integration/getMemberAndAddress';
import { withDtstamp } from '@proton/shared/lib/calendar/veventHelper';
import { WeekStartsOn } from '@proton/shared/lib/date-fns-utc/interface';
import { getProdId } from '@proton/shared/lib/calendar/vcalHelper';
import { API_CODES, SECOND } from '@proton/shared/lib/constants';
import { format, isSameDay } from '@proton/shared/lib/date-fns-utc';
import { getFormattedWeekdays } from '@proton/shared/lib/date/date';
import { unique } from '@proton/shared/lib/helpers/array';
import { canonizeEmailByGuess, canonizeInternalEmail } from '@proton/shared/lib/helpers/email';
import { noop } from '@proton/shared/lib/helpers/function';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { omit, pick } from '@proton/shared/lib/helpers/object';
import { dateLocale } from '@proton/shared/lib/i18n';
import { Address } from '@proton/shared/lib/interfaces';
import {
    AttendeeModel,
    Calendar,
    CalendarBootstrap,
    CalendarEvent,
    DateTimeModel,
    EventModel,
    SyncMultipleApiResponse,
    UpdateEventPartApiResponse,
} from '@proton/shared/lib/interfaces/calendar';
import { ContactEmail } from '@proton/shared/lib/interfaces/contacts';
import { SimpleMap } from '@proton/shared/lib/interfaces/utils';
import { EncryptionPreferencesError } from '@proton/shared/lib/mail/encryptionPreferences';
import {
    MutableRefObject,
    RefObject,
    useCallback,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    FeatureCode,
    useApi,
    useBeforeUnload,
    useConfig,
    useContactEmails,
    useEventManager,
    useFeature,
    useGetAddressKeys,
    useGetCalendarEventRaw,
    useModals,
    useNotifications,
} from '@proton/components';
import { useReadCalendarBootstrap } from '@proton/components/hooks/useGetCalendarBootstrap';
import useGetCalendarEventPersonal from '@proton/components/hooks/useGetCalendarEventPersonal';
import { useGetCanonicalEmailsMap } from '@proton/components/hooks/useGetCanonicalEmailsMap';
import { useGetCalendarKeys } from '@proton/components/hooks/useGetDecryptedPassphraseAndCalendarKeys';
import { useGetVtimezonesMap } from '@proton/components/hooks/useGetVtimezonesMap';
import useSendIcs from '@proton/components/hooks/useSendIcs';
import { Prompt } from 'react-router';
import { c } from 'ttag';
import { serverTime } from 'pmcrypto';

import { ACTIONS, TYPE } from '../../components/calendar/interactions/constants';
import {
    isCreateDownAction,
    isEventDownAction,
    isMoreDownAction,
    MouseDownAction,
    MouseUpAction,
} from '../../components/calendar/interactions/interface';
import { findUpwards } from '../../components/calendar/mouseHelpers/domHelpers';
import Popover, { PopoverRenderData } from '../../components/calendar/Popover';
import { sortEvents, sortWithTemporaryEvent } from '../../components/calendar/sortLayout';

import CreateEventModal from '../../components/eventModal/CreateEventModal';
import CreateEventPopover from '../../components/eventModal/CreateEventPopover';
import { getHasDoneChanges } from '../../components/eventModal/eventForm/getHasEdited';
import { getExistingEvent, getInitialModel } from '../../components/eventModal/eventForm/state';

import { getTimeInUtc } from '../../components/eventModal/eventForm/time';
import EventPopover from '../../components/events/EventPopover';
import MorePopoverEvent from '../../components/events/MorePopoverEvent';

import { modifyEventModelPartstat } from '../../helpers/attendees';
import useGetMapSendIcsPreferences from '../../hooks/useGetSendIcsPreferencesMap';
import {
    CleanSendIcsActionData,
    INVITE_ACTION_TYPES,
    InviteActions,
    RecurringActionData,
    SendIcsActionData,
    UpdatePartstatOperation,
    UpdatePersonalPartOperation,
} from '../../interfaces/Invite';
import CalendarView from './CalendarView';
import SendWithErrorsConfirmationModal from './confirmationModals/SendWithErrorsConfirmationModal';
import CloseConfirmationModal from './confirmationModals/CloseConfirmation';
import DeleteConfirmModal from './confirmationModals/DeleteConfirmModal';
import DeleteRecurringConfirmModal from './confirmationModals/DeleteRecurringConfirmModal';

import EditRecurringConfirmModal from './confirmationModals/EditRecurringConfirmation';
import EditSingleConfirmModal from './confirmationModals/EditSingleConfirmModal';
import { useContactEmailsCache } from './ContactEmailsProvider';
import getDeleteEventActions from './eventActions/getDeleteEventActions';
import getSaveEventActions from './eventActions/getSaveEventActions';
import { getSendIcsAction } from './eventActions/inviteActions';
import withOccurrenceEvent from './eventActions/occurrenceEvent';

import { getCreateTemporaryEvent, getEditTemporaryEvent, getTemporaryEvent, getUpdatedDateTime } from './eventHelper';
import getComponentFromCalendarEvent from './eventStore/cache/getComponentFromCalendarEvent';
import { getIsCalendarEvent } from './eventStore/cache/helper';
import {
    upsertSyncMultiActionsResponses,
    upsertUpdateEventPartResponses,
} from './eventStore/cache/upsertResponsesArray';
import { CalendarsEventsCache, DecryptedEventTupleResult } from './eventStore/interface';
import getSyncMultipleEventsPayload, { SyncEventActionOperations } from './getSyncMultipleEventsPayload';
import getUpdatePersonalEventPayload from './getUpdatePersonalEventPayload';
import {
    CalendarViewEvent,
    CalendarViewEventData,
    CalendarViewEventTemporaryEvent,
    DisplayNameEmail,
    EventTargetAction,
    InteractiveRef,
    InteractiveState,
    OnDeleteConfirmationArgs,
    OnSaveConfirmationArgs,
    SharedViewProps,
    TargetEventData,
    TimeGridRef,
} from './interface';
import { getInitialTargetEventData } from './targetEventHelper';
import DuplicateAttendeesModal from './confirmationModals/DuplicateAttendeesModal';

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
    calendarsEventsCacheRef: MutableRefObject<CalendarsEventsCache>;
    eventTargetActionRef: MutableRefObject<EventTargetAction | undefined>;
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
    calendarsEventsCacheRef,
    eventTargetActionRef,
}: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const { createModal, getModal, hideModal, removeModal } = useModals();
    const { createNotification } = useNotifications();
    const { contactEmailsMap } = useContactEmailsCache();
    const sendIcs = useSendIcs();
    const getVTimezonesMap = useGetVtimezonesMap();
    const config = useConfig();
    const isSavingEvent = useRef(false);

    const [eventModalID, setEventModalID] = useState();

    const contacts = (useContactEmails()[0] as ContactEmail[]) || [];
    const displayNameEmailMap = useMemo(() => {
        const result = contacts.reduce<SimpleMap<DisplayNameEmail>>((acc, { Email, Name }) => {
            const canonicalEmail = canonizeEmailByGuess(Email);
            if (!acc[canonicalEmail]) {
                acc[canonicalEmail] = { displayName: Name, displayEmail: Email };
            }
            return acc;
        }, {});
        addresses.forEach(({ DisplayName, Email }) => {
            const normalizedEmail = canonizeInternalEmail(Email);
            if (!result[normalizedEmail]) {
                result[normalizedEmail] = { displayName: DisplayName, displayEmail: Email };
            }
        });
        return result;
    }, [contacts]);

    const readCalendarBootstrap = useReadCalendarBootstrap();
    const getCalendarKeys = useGetCalendarKeys();
    const getAddressKeys = useGetAddressKeys();
    const getCalendarEventPersonal = useGetCalendarEventPersonal();
    const getCalendarEventRaw = useGetCalendarEventRaw();
    const getCanonicalEmailsMap = useGetCanonicalEmailsMap();
    const getSendIcsPreferencesMap = useGetMapSendIcsPreferences();

    const emailNotificationsEnabled = !!useFeature(FeatureCode.CalendarEmailNotification)?.feature?.Value;

    const getEventDecrypted = (eventData: CalendarEvent): Promise<DecryptedEventTupleResult> => {
        return Promise.all([
            getCalendarEventRaw(eventData),
            getCalendarEventPersonal(eventData),
            pick(eventData, ['Permissions', 'IsOrganizer', 'IsProtonProtonInvite']),
        ]);
    };

    const [interactiveData, setInteractiveData] = useState<InteractiveState | undefined>(() =>
        getInitialTargetEventData(eventTargetActionRef, dateRange)
    );
    useEffect(() => {
        const eventTargetAction = eventTargetActionRef.current;
        if (!eventTargetAction) {
            return;
        }
        eventTargetActionRef.current = undefined;
        if (eventTargetAction.isAllDay || eventTargetAction.isAllPartDay) {
            return;
        }
        timeGridViewRef.current?.scrollToTime(eventTargetAction.startInTzid);
    }, []);

    const { temporaryEvent, targetEventData, targetMoreData } = interactiveData || {};

    const { tmpData, tmpDataOriginal, data } = temporaryEvent || {};
    const tmpEvent = data?.eventData;

    const isCreatingEvent = !!tmpData && !tmpEvent;
    const isEditingEvent = !!tmpData && !!tmpEvent;
    const isInTemporaryBlocking =
        tmpData && tmpDataOriginal && getHasDoneChanges(tmpData, tmpDataOriginal, isEditingEvent);
    const isScrollDisabled = !!interactiveData && !temporaryEvent;
    const prodId = getProdId(config);

    useEffect(() => {
        onInteraction?.(!!temporaryEvent);
    }, [!!temporaryEvent]);

    useBeforeUnload(isInTemporaryBlocking ? c('Alert').t`By leaving now, you will lose your event.` : '');

    const sortedEvents = useMemo(() => {
        return sortEvents(events.concat());
    }, [events]);

    const sortedEventsWithTemporary = useMemo(() => {
        return sortWithTemporaryEvent(sortedEvents, temporaryEvent);
    }, [temporaryEvent, sortedEvents]);

    const handleSetTemporaryEventModel = (model: EventModel) => {
        if (!temporaryEvent || isSavingEvent.current) {
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

    const getCreateModel = (isAllDay: boolean, attendees?: AttendeeModel[]) => {
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
            attendees,
            emailNotificationsEnabled,
        });
    };

    const getVeventComponentParent = (uid: string, calendarID: string) => {
        const recurrenceCache = calendarsEventsCacheRef.current.getCachedRecurringEvent(calendarID, uid);
        const parentEventID = recurrenceCache?.parentEventID;
        const parentEvent = parentEventID
            ? calendarsEventsCacheRef.current.getCachedEvent(calendarID, parentEventID)
            : undefined;
        if (!parentEvent) {
            return undefined;
        }
        return getComponentFromCalendarEvent(parentEvent);
    };

    const getUpdateModel = (
        { calendarData, eventData, eventReadResult, eventRecurrence }: CalendarViewEventData,
        partstat?: ICAL_ATTENDEE_STATUS
    ): EventModel | undefined => {
        if (
            !eventData ||
            !eventReadResult ||
            eventReadResult.error ||
            !eventReadResult.result ||
            !getIsCalendarEvent(eventData)
        ) {
            return;
        }
        const initialDate = getInitialDate();

        const { Members = [], CalendarSettings } = readCalendarBootstrap(calendarData.ID);
        const [Member, Address] = getMemberAndAddress(activeAddresses, Members, eventData.Author);

        const [{ veventComponent, verificationStatus, selfAddressData }, personalMap] = eventReadResult.result;

        const veventComponentParentPartial = veventComponent['recurrence-id']
            ? getVeventComponentParent(veventComponent.uid.value, eventData.CalendarID)
            : undefined;
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
            verificationStatus,
            tzid,
            emailNotificationsEnabled,
        });
        const originalOrOccurrenceEvent = eventRecurrence
            ? withOccurrenceEvent(veventComponent, eventRecurrence)
            : veventComponent;
        const eventResult = getExistingEvent({
            veventComponent: originalOrOccurrenceEvent,
            veventValarmComponent: personalMap[Member.ID]?.veventComponent,
            veventComponentParentPartial,
            tzid,
            isOrganizer: !!eventData.IsOrganizer,
            isProtonProtonInvite: !!eventData.IsProtonProtonInvite,
            selfAddressData,
        });
        if (partstat) {
            return {
                ...createResult,
                ...modifyEventModelPartstat(eventResult, partstat, CalendarSettings, emailNotificationsEnabled),
            };
        }
        return {
            ...createResult,
            ...eventResult,
        };
    };

    const handleMouseDown = (mouseDownAction: MouseDownAction) => {
        if (isSavingEvent.current) {
            return;
        }
        if (isEventDownAction(mouseDownAction)) {
            const { event, type } = mouseDownAction.payload;

            // If already creating something in blocking mode and not touching on the temporary event.
            if (temporaryEvent && event.id !== 'tmp' && isInTemporaryBlocking) {
                return;
            }

            const targetCalendar = (event && event.data && event.data.calendarData) || undefined;

            const isAllowedToTouchEvent = true;
            const isInvitation = event.data.eventData ? !event.data.eventData.IsOrganizer : false;
            let isAllowedToMoveEvent = getIsCalendarProbablyActive(targetCalendar) && !isInvitation;

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

    const handleSendPrefsErrors = async ({ inviteActions, vevent, cancelVevent, noCheck }: SendIcsActionData) => {
        const sendPreferencesMap = await getSendIcsPreferencesMap({
            inviteActions,
            vevent,
            cancelVevent,
            contactEmailsMap,
        });
        const hasErrors = Object.values(sendPreferencesMap).some((sendPref) => !!sendPref?.error);
        if (!hasErrors || noCheck) {
            return { sendPreferencesMap, inviteActions, vevent, cancelVevent };
        }
        return new Promise<CleanSendIcsActionData>((resolve, reject) => {
            createModal(
                <SendWithErrorsConfirmationModal
                    sendPreferencesMap={sendPreferencesMap}
                    inviteActions={inviteActions}
                    vevent={vevent}
                    cancelVevent={cancelVevent}
                    onClose={reject}
                    onConfirm={resolve}
                />
            );
        });
    };

    const handleSendIcs = async ({ inviteActions, vevent, cancelVevent, noCheck }: SendIcsActionData) => {
        const onRequestError = () => {
            throw new Error(c('Error').t`Invitation failed to be sent`);
        };
        const onReplyError = (error: Error) => {
            if (error instanceof EncryptionPreferencesError) {
                const apiErrorMessage = reformatApiErrorMessage(error.message);
                const errorMessage = c('Reply to calendar invitation')
                    .t`Cannot send to organizer address: ${apiErrorMessage}`;
                throw new Error(errorMessage);
            }
            throw new Error(c('Error').t`Answer failed to be sent`);
        };
        const onCancelError = () => {
            throw new Error(c('Error').t`Cancellation failed to be sent`);
        };
        const {
            sendPreferencesMap,
            inviteActions: cleanInviteActions,
            vevent: cleanVevent,
            cancelVevent: cleanCancelVevent,
        } = await handleSendPrefsErrors({ inviteActions, vevent, cancelVevent, noCheck });
        // generate DTSTAMPs for the ICS
        const currentTimestamp = +serverTime();
        const cleanVeventWithDtstamp = cleanVevent
            ? withDtstamp(omit(cleanVevent, ['dtstamp']), currentTimestamp)
            : undefined;
        const cleanCancelVeventWithDtstamp = cleanCancelVevent
            ? withDtstamp(omit(cleanCancelVevent, ['dtstamp']), currentTimestamp)
            : undefined;
        const sendIcsAction = getSendIcsAction({
            vevent: cleanVeventWithDtstamp,
            cancelVevent: cleanCancelVeventWithDtstamp,
            inviteActions: cleanInviteActions,
            sendIcs,
            sendPreferencesMap,
            contactEmailsMap,
            getVTimezonesMap,
            prodId,
            onRequestError,
            onReplyError,
            onCancelError,
        });
        await sendIcsAction();
        return {
            veventComponent: cleanVevent,
            inviteActions: cleanInviteActions,
            timestamp: currentTimestamp,
        };
    };

    const handleCloseConfirmation = () => {
        return new Promise<void>((resolve, reject) => {
            createModal(<CloseConfirmationModal onClose={reject} onConfirm={resolve} />);
        });
    };

    const handleSaveConfirmation = ({
        type,
        data,
        isInvitation,
        inviteActions,
    }: OnSaveConfirmationArgs): Promise<RecurringActionData> => {
        return new Promise<RecurringActionData>((resolve, reject) => {
            if (type === SAVE_CONFIRMATION_TYPES.RECURRING && data) {
                return createModal(
                    <EditRecurringConfirmModal
                        types={data.types}
                        hasSingleModifications={data.hasSingleModifications}
                        hasSingleModificationsAfter={data.hasSingleModificationsAfter}
                        hasRruleModification={data.hasRruleModification}
                        hasCalendarModification={data.hasCalendarModification}
                        isInvitation={isInvitation}
                        inviteActions={inviteActions}
                        onClose={reject}
                        onConfirm={resolve}
                    />
                );
            }
            if (type === SAVE_CONFIRMATION_TYPES.SINGLE) {
                return createModal(
                    <EditSingleConfirmModal inviteActions={inviteActions} onClose={reject} onConfirm={resolve} />
                );
            }
            return reject(new Error('Unknown type'));
        });
    };

    const handleDeleteConfirmation = ({
        type,
        data,
        isInvitation,
        inviteActions,
    }: OnDeleteConfirmationArgs): Promise<RecurringActionData> => {
        return new Promise<RecurringActionData>((resolve, reject) => {
            if (type === DELETE_CONFIRMATION_TYPES.SINGLE) {
                return createModal(
                    <DeleteConfirmModal onClose={reject} onConfirm={resolve} inviteActions={inviteActions} />
                );
            }
            if (type === DELETE_CONFIRMATION_TYPES.RECURRING && data) {
                return createModal(
                    <DeleteRecurringConfirmModal
                        types={data.types}
                        isInvitation={isInvitation}
                        hasNonCancelledSingleEdits={data.hasNonCancelledSingleEdits}
                        inviteActions={inviteActions}
                        onClose={reject}
                        onConfirm={resolve}
                    />
                );
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
        if (isSavingEvent.current) {
            return Promise.reject(new Error('Keep event'));
        }
        if (isInTemporaryBlocking) {
            if (!ask) {
                return Promise.reject(new Error('Keep event'));
            }
            return handleCloseConfirmation().catch(() => Promise.reject(new Error('Keep event')));
        }
        return Promise.resolve();
    };

    const handleEditEvent = (temporaryEvent: CalendarViewEventTemporaryEvent) => {
        if (isSavingEvent.current) {
            return;
        }
        // Close the popover only
        setInteractiveData({ temporaryEvent });
        setEventModalID(createModal());
    };

    const handleCreateEvent = (attendees: AttendeeModel[]) => {
        if (!defaultCalendar) {
            return;
        }
        const startModel = getCreateModel(false, attendees);
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

    const handleCreateNotification = (texts?: { success: string }) => {
        if (!texts) {
            return;
        }
        createNotification({ text: texts.success });
    };

    const handleUpdateVisibility = async (calendarIds: string[]) => {
        const hiddenCalendars = calendarIds.filter((calendarID) => {
            const calendar = activeCalendars.find(({ ID }) => ID === calendarID);
            return !calendar?.Display;
        });

        // TODO: Remove when optimistic
        if (hiddenCalendars.length > 0) {
            await Promise.all(
                hiddenCalendars.map((calendarID) => {
                    return api({
                        ...updateCalendar(calendarID, { Display: 1 }),
                        silence: true,
                    });
                })
            );
            await call();
        }
    };

    const handleSyncActions = async (multiActions: SyncEventActionOperations[]) => {
        if (!multiActions.length) {
            return [];
        }
        const multiResponses: SyncMultipleApiResponse[] = [];
        for (const actions of multiActions) {
            const payload = await getSyncMultipleEventsPayload({
                getAddressKeys,
                getCalendarKeys,
                sync: actions,
            });
            const result = await api<SyncMultipleApiResponse>({ ...payload, silence: true });
            const { Responses: responses } = result;
            const errorResponses = responses.filter(({ Response }) => {
                return 'Error' in Response || Response.Code !== API_CODES.SINGLE_SUCCESS;
            });
            if (errorResponses.length > 0) {
                const firstError = errorResponses[0].Response;
                throw new Error(firstError.Error || 'Unknown error');
            }
            multiResponses.push(result);
        }

        return multiResponses;
    };

    const handleUpdatePartstatActions = async (updatePartstatOperations: UpdatePartstatOperation[] = []) => {
        if (!updatePartstatOperations.length) {
            return [];
        }
        const requests = updatePartstatOperations.map(
            ({ data: { eventID, calendarID, attendeeID, updateTime, partstat } }) =>
                () =>
                    api<UpdateEventPartApiResponse>({
                        ...updateAttendeePartstat(calendarID, eventID, attendeeID, {
                            Status: toApiPartstat(partstat),
                            UpdateTime: updateTime,
                        }),
                        silence: true,
                    })
        );
        // Catch errors silently
        try {
            // the routes called in requests do not have any specific jail limit
            // the limit per user session is 25k requests / 900s
            return processApiRequestsSafe(requests, 25000, 900 * SECOND);
        } catch (e) {
            return [];
        }
    };

    const handleUpdatePersonalPartActions = async (
        updatePersonalPartOperations: UpdatePersonalPartOperation[] = []
    ) => {
        if (!updatePersonalPartOperations.length) {
            return [];
        }
        const requests = updatePersonalPartOperations.map(
            ({ data: { addressID, memberID, eventID, calendarID, eventComponent } }) =>
                async () => {
                    const payload = await getUpdatePersonalEventPayload({
                        eventComponent,
                        addressID,
                        memberID,
                        getAddressKeys,
                    });
                    return api<UpdateEventPartApiResponse>({
                        ...updatePersonalEventPart(calendarID, eventID, payload),
                        silence: true,
                    });
                }
        );
        // Catch errors silently
        try {
            // the routes called in requests do not have any specific jail limit
            // the limit per user session is 25k requests / 900s
            return processApiRequestsSafe(requests, 25000, 900 * SECOND);
        } catch (e) {
            return [];
        }
    };

    const handleDuplicateAttendees = async (duplicateAttendees: string[][]) => {
        return new Promise<void>((_resolve, reject) =>
            createModal(<DuplicateAttendeesModal duplicateAttendees={duplicateAttendees} onClose={reject} />)
        );
    };

    const handleSaveEvent = async (temporaryEvent: CalendarViewEventTemporaryEvent, inviteActions: InviteActions) => {
        try {
            isSavingEvent.current = true;
            const {
                syncActions,
                updatePartstatActions = [],
                updatePersonalPartActions = [],
                texts,
            } = await getSaveEventActions({
                temporaryEvent,
                weekStartsOn,
                addresses,
                inviteActions,
                api,
                onSaveConfirmation: handleSaveConfirmation,
                onDuplicateAttendees: handleDuplicateAttendees,
                getEventDecrypted,
                getCalendarBootstrap: readCalendarBootstrap,
                getCanonicalEmailsMap,
                sendIcs: handleSendIcs,
                onSendPrefsErrors: handleSendPrefsErrors,
                handleSyncActions,
                getCalendarKeys,
            });
            const [syncResponses, updatePartstatResponses, updatePersonalPartResponses] = await Promise.all([
                handleSyncActions(syncActions),
                handleUpdatePartstatActions(updatePartstatActions),
                handleUpdatePersonalPartActions(updatePersonalPartActions),
            ]);
            const calendarsEventCache = calendarsEventsCacheRef.current;
            if (calendarsEventCache) {
                upsertUpdateEventPartResponses(updatePartstatActions, updatePartstatResponses, calendarsEventCache);
                upsertUpdateEventPartResponses(
                    updatePersonalPartActions,
                    updatePersonalPartResponses,
                    calendarsEventCache
                );
                upsertSyncMultiActionsResponses(syncActions, syncResponses, calendarsEventCache);
            }
            const uniqueCalendarIDs = unique([
                ...syncActions.map(({ calendarID }) => calendarID),
                ...updatePartstatActions.map(({ data: { calendarID } }) => calendarID),
                ...updatePersonalPartActions.map(({ data: { calendarID } }) => calendarID),
            ]);
            await handleUpdateVisibility(uniqueCalendarIDs);
            calendarsEventCache.rerender?.();
            handleCreateNotification(texts);
        } catch (e) {
            createNotification({ text: e.message, type: 'error' });
        } finally {
            isSavingEvent.current = false;
        }
    };

    const handleDeleteEvent = async (targetEvent: CalendarViewEvent, inviteActions: InviteActions) => {
        try {
            const {
                syncActions,
                updatePartstatActions = [],
                updatePersonalPartActions = [],
                texts,
            } = await getDeleteEventActions({
                targetEvent,
                addresses,
                onDeleteConfirmation: handleDeleteConfirmation,
                api,
                getEventDecrypted,
                getCalendarBootstrap: readCalendarBootstrap,
                getCalendarKeys,
                inviteActions,
                sendIcs: handleSendIcs,
            });
            // some operations may refer to the events to be deleted, so we execute those first
            const [updatePartstatResponses, updatePersonalPartResponses] = await Promise.all([
                handleUpdatePartstatActions(updatePartstatActions),
                handleUpdatePersonalPartActions(updatePersonalPartActions),
            ]);
            const syncResponses = await handleSyncActions(syncActions);
            const calendarsEventCache = calendarsEventsCacheRef.current;
            if (calendarsEventCache) {
                upsertUpdateEventPartResponses(updatePartstatActions, updatePartstatResponses, calendarsEventCache);
                upsertUpdateEventPartResponses(
                    updatePersonalPartActions,
                    updatePersonalPartResponses,
                    calendarsEventCache
                );
                upsertSyncMultiActionsResponses(syncActions, syncResponses, calendarsEventCache);
            }
            calendarsEventCache.rerender?.();
            handleCreateNotification(texts);
        } catch (e) {
            createNotification({ text: e.message, type: 'error' });
        }
    };

    useImperativeHandle(interactiveRef, () => ({
        createEvent: (attendees) => {
            handleCreateEvent(attendees);
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

    const targetMoreEvents = useMemo(() => {
        const eventsSet = targetMoreData?.events;
        if (!eventsSet) {
            return [];
        }
        // Do this to respect the order in which they were inserted
        const latestEvents = events
            .filter(({ id }) => eventsSet.has(id))
            .reduce<{ [key: string]: CalendarViewEvent }>((acc, result) => {
                acc[result.id] = result;
                return acc;
            }, {});
        return [...eventsSet.keys()].map((eventId) => latestEvents[eventId]).filter(isTruthy);
    }, [targetMoreData?.events, events]);

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
                {({ style, ref, textareaMaxHeight }: PopoverRenderData) => {
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
                                addresses={addresses}
                                displayWeekNumbers={displayWeekNumbers}
                                weekStartsOn={weekStartsOn}
                                setModel={handleSetTemporaryEventModel}
                                onSave={(inviteActions: InviteActions) => {
                                    if (!temporaryEvent) {
                                        return Promise.reject(new Error('Undefined behavior'));
                                    }
                                    return handleSaveEvent(temporaryEvent, inviteActions)
                                        .then(closeAllPopovers)
                                        .catch(noop);
                                }}
                                onEdit={() => {
                                    if (!temporaryEvent) {
                                        return;
                                    }
                                    handleEditEvent(temporaryEvent);
                                }}
                                textareaMaxHeight={textareaMaxHeight}
                                onClose={() => {
                                    return handleConfirmDeleteTemporary({ ask: true })
                                        .then(closeAllPopovers)
                                        .catch(noop);
                                }}
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
                            displayNameEmailMap={displayNameEmailMap}
                            formatTime={formatTime}
                            onDelete={(inviteActions) => {
                                return (
                                    handleDeleteEvent(targetEvent, inviteActions)
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
                            onChangePartstat={async (partstat: ICAL_ATTENDEE_STATUS) => {
                                if (!targetEvent) {
                                    return;
                                }
                                const newTemporaryModel = getUpdateModel(targetEvent.data, partstat);
                                if (!newTemporaryModel) {
                                    return;
                                }
                                const inviteActions = {
                                    isProtonProtonInvite: newTemporaryModel.isProtonProtonInvite,
                                    type: INVITE_ACTION_TYPES.CHANGE_PARTSTAT,
                                    partstat,
                                    selfAddress: newTemporaryModel.selfAddress,
                                    selfAttendeeIndex: newTemporaryModel.selfAttendeeIndex,
                                };

                                const newTemporaryEvent = getTemporaryEvent(
                                    getEditTemporaryEvent(targetEvent, newTemporaryModel, tzid),
                                    newTemporaryModel,
                                    tzid
                                );
                                return handleSaveEvent(newTemporaryEvent, inviteActions);
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
                            events={targetMoreEvents}
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
                    onSave={(inviteActions: InviteActions) => {
                        if (!temporaryEvent) {
                            return Promise.reject(new Error('Undefined behavior'));
                        }
                        return handleSaveEvent(temporaryEvent, inviteActions)
                            .then(() => hideModal(eventModalID))
                            .catch(noop);
                    }}
                    onDelete={(inviteActions) => {
                        if (!temporaryEvent?.data?.eventData || !temporaryEvent.tmpOriginalTarget) {
                            return;
                        }
                        return handleDeleteEvent(temporaryEvent.tmpOriginalTarget, inviteActions)
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
                    addresses={addresses}
                    {...getModal(eventModalID)}
                />
            ) : null}
        </>
    );
};

export default InteractiveCalendarView;
