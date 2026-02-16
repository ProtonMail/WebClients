import type { Dispatch, MutableRefObject, RefObject, SetStateAction } from 'react';
import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Prompt, useLocation } from 'react-router';

import { addMinutes, differenceInMinutes, isBefore } from 'date-fns';
import { c, msgid } from 'ttag';

import { useGetAddressKeys } from '@proton/account/addressKeys/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { useGetCalendarBootstrap, useReadCalendarBootstrap } from '@proton/calendar/calendarBootstrap/hooks';
import { useGetCalendarKeys } from '@proton/calendar/calendarBootstrap/keys';
import { changeCalendarVisiblity } from '@proton/calendar/calendars/actions';
import { validateDeepLinkParams } from '@proton/calendar/utils';
import { VIDEO_CONF_API_ERROR_CODES } from '@proton/calendar/videoConferencing/constants';
import { VideoConferenceZoomIntegration, useVideoConfTelemetry } from '@proton/calendar/videoConferencing/telemetry';
import Dropzone from '@proton/components/components/dropzone/Dropzone';
import ImportModal from '@proton/components/containers/calendar/importModal/ImportModal';
import { useContactEmailsCache } from '@proton/components/containers/contacts/ContactEmailsProvider';
import { useCalendarModelEventManager } from '@proton/components/containers/eventManager/calendar/CalendarModelEventManagerProvider';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import useApi from '@proton/components/hooks/useApi';
import useBeforeUnload from '@proton/components/hooks/useBeforeUnload';
import useConfig from '@proton/components/hooks/useConfig';
import useGetCalendarEventRaw from '@proton/components/hooks/useGetCalendarEventRaw';
import { useGetCanonicalEmailsMap } from '@proton/components/hooks/useGetCanonicalEmailsMap';
import useGetEncryptionPreferences from '@proton/components/hooks/useGetEncryptionPreferences';
import useGetVerificationPreferences from '@proton/components/hooks/useGetVerificationPreferences';
import { useGetVtimezonesMap } from '@proton/components/hooks/useGetVtimezonesMap';
import { useModalsMap } from '@proton/components/hooks/useModalsMap';
import useNotifications from '@proton/components/hooks/useNotifications';
import usePreventCloseTab from '@proton/components/hooks/usePreventCloseTab';
import useRelocalizeText from '@proton/components/hooks/useRelocalizeText';
import useSendIcs from '@proton/components/hooks/useSendIcs';
import { type SessionKey, serverTime } from '@proton/crypto';
import { useContactEmails } from '@proton/mail/store/contactEmails/hooks';
import { useGetMailSettings } from '@proton/mail/store/mailSettings/hooks';
import {
    attendeeDeleteSingleEdit,
    updateAttendeePartstat,
    updatePersonalEventPart,
} from '@proton/shared/lib/api/calendars';
import { processApiRequestsSafe } from '@proton/shared/lib/api/helpers/safeApiRequests';
import { fetchPaginatedAttendeesInfo } from '@proton/shared/lib/calendar/attendeeInfos';
import { NO_CANONICAL_EMAIL_ERROR, toApiPartstat } from '@proton/shared/lib/calendar/attendees';
import { getAuthorPublicKeysMap } from '@proton/shared/lib/calendar/author';
import {
    getIsCalendarDisabled,
    getIsCalendarProbablyActive,
    getIsCalendarWritable,
    getIsOwnedCalendar,
    getVisualCalendar,
} from '@proton/shared/lib/calendar/calendar';
import {
    ATTENDEE_COMMENT_ENCRYPTION_TYPE,
    ATTENDEE_MORE_ATTENDEES,
    DELETE_CONFIRMATION_TYPES,
    ICAL_ATTENDEE_STATUS,
    MAXIMUM_DATE_UTC,
    MINIMUM_DATE_UTC,
    RECURRING_TYPES,
    SAVE_CONFIRMATION_TYPES,
    TMP_UID,
    TMP_UNIQUE_ID,
    VIEWS,
} from '@proton/shared/lib/calendar/constants';
import {
    getDecryptedRSVPComment,
    getEncryptedRSVPCommentWithSignature,
} from '@proton/shared/lib/calendar/crypto/helpers';
import { getCalendarEventDecryptionKeys, getSharedSessionKey } from '@proton/shared/lib/calendar/crypto/keys/helpers';
import { readSessionKeys } from '@proton/shared/lib/calendar/deserialize';
import { getIcsMessageWithPreferences } from '@proton/shared/lib/calendar/mailIntegration/invite';
import { getMemberAndAddress } from '@proton/shared/lib/calendar/members';
import { reencryptCalendarSharedEvent } from '@proton/shared/lib/calendar/sync/reencrypt';
import { getProdId } from '@proton/shared/lib/calendar/vcalConfig';
import { buildVcalOrganizer, propertyToUTCDate } from '@proton/shared/lib/calendar/vcalConverter';
import { withDtstamp } from '@proton/shared/lib/calendar/veventHelper';
import { API_CODES, SECOND } from '@proton/shared/lib/constants';
import { format, isSameDay } from '@proton/shared/lib/date-fns-utc';
import type { WeekStartsOn } from '@proton/shared/lib/date-fns-utc/interface';
import { getFormattedWeekdays } from '@proton/shared/lib/date/date';
import { convertUTCDateTimeToZone, fromUTCDate, toLocalDate, toUTCDate } from '@proton/shared/lib/date/timezone';
import { canonicalizeEmailByGuess, canonicalizeInternalEmail } from '@proton/shared/lib/helpers/email';
import { getNonEmptyErrorMessage } from '@proton/shared/lib/helpers/error';
import { omit, pick } from '@proton/shared/lib/helpers/object';
import { wait } from '@proton/shared/lib/helpers/promise';
import { SentryCalendarInitiatives, traceError, traceInitiativeError } from '@proton/shared/lib/helpers/sentry';
import { dateLocale } from '@proton/shared/lib/i18n';
import type { Address } from '@proton/shared/lib/interfaces';
import type { ModalWithProps } from '@proton/shared/lib/interfaces/Modal';
import type {
    AttendeeComment,
    AttendeeDeleteSingleEditResponse,
    AttendeeModel,
    CalendarBootstrap,
    CalendarEvent,
    CalendarEventSharedData,
    DateTimeModel,
    EventModel,
    SyncMultipleApiResponse,
    UpdateEventPartApiResponse,
    VcalVeventComponent,
    VisualCalendar,
} from '@proton/shared/lib/interfaces/calendar';
import type { SendPreferences } from '@proton/shared/lib/interfaces/mail/crypto';
import type { SimpleMap } from '@proton/shared/lib/interfaces/utils';
import getSendPreferences from '@proton/shared/lib/mail/send/getSendPreferences';
import eventImport from '@proton/styles/assets/img/illustrations/event-import.svg';
import { useFlag } from '@proton/unleash';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';
import unique from '@proton/utils/unique';

import type { PopoverRenderData } from '../../components/calendar/Popover';
import Popover from '../../components/calendar/Popover';
import { ACTIONS, ADVANCED_SEARCH_OVERLAY_OPEN_EVENT, TYPE } from '../../components/calendar/interactions/constants';
import type { MouseDownAction, MouseUpAction } from '../../components/calendar/interactions/interface';
import {
    isCreateDownAction,
    isEventDownAction,
    isMoreDownAction,
} from '../../components/calendar/interactions/interface';
import { findUpwards } from '../../components/calendar/mouseHelpers/domHelpers';
import { sortEvents, sortWithTemporaryEvent } from '../../components/calendar/sortLayout';
import CreateEventModal from '../../components/eventModal/CreateEventModal';
import CreateEventPopover from '../../components/eventModal/CreateEventPopover';
import { getHasDoneChanges } from '../../components/eventModal/eventForm/getHasEdited';
import { modelToDateProperty } from '../../components/eventModal/eventForm/modelToProperties';
import {
    getExistingEvent,
    getInitialFrequencyModel,
    getInitialModel,
} from '../../components/eventModal/eventForm/state';
import { getTimeInUtc } from '../../components/eventModal/eventForm/time';
import EventPopover from '../../components/events/EventPopover';
import MorePopoverEvent from '../../components/events/MorePopoverEvent';
import { modifyEventModelPartstat } from '../../helpers/attendees';
import { formatShortTime } from '../../helpers/date';
import { getCanEditSharedEventData } from '../../helpers/event';
import { extractInviteEmails } from '../../helpers/invite';
import { getCleanSendDataFromSendPref, getSendPrefErrorMap } from '../../helpers/sendPreferences';
import { getIsCalendarAppInDrawer } from '../../helpers/views';
import useBusySlots from '../../hooks/useBusySlots';
import type { OpenedMailEvent } from '../../hooks/useGetOpenedMailEvents';
import { useOpenCalendarEvents } from '../../hooks/useOpenCalendarEvents';
import { useOpenEventsFromMail } from '../../hooks/useOpenEventsFromMail';
import usePauseCalendarEventLoop from '../../hooks/usePauseCalendarEventLoop';
import type {
    AttendeeDeleteSingleEditOperation,
    InviteActions,
    OnSendPrefsErrors,
    RecurringActionData,
    ReencryptInviteActionData,
    SendIcs,
    UpdatePartstatOperation,
    UpdatePersonalPartOperation,
} from '../../interfaces/Invite';
import { useCalendarEALMetric } from '../../metrics/useCalendarEALMetric';
import { useCalendarNESTMetric } from '../../metrics/useCalendarNESTMetric';
import { getCurrentPartstat } from '../../store/events/eventsCache';
import { pendingUniqueIdsSelector, selectIsTmpEventSaving } from '../../store/events/eventsSelectors';
import { type CalendarViewEventStore, eventsActions } from '../../store/events/eventsSlice';
import { useCalendarDispatch, useCalendarSelector } from '../../store/hooks';
import { useBookings } from '../bookings/bookingsProvider/BookingsProvider';
import { BOOKING_SLOT_ID, TEMPORARY_BOOKING_SLOT } from '../bookings/interface';
import { BookingErrorMessages } from '../bookings/utils/bookingCopy';
import { getTemporaryBookingEvents } from '../bookings/utils/provider/getTemporaryBookingEvents';
import CalendarView from './CalendarView';
import { EscapeTryBlockError } from './EscapeTryBlockError';
import CloseConfirmationModal from './confirmationModals/CloseConfirmation';
import DeleteConfirmModal from './confirmationModals/DeleteConfirmModal';
import DeleteRecurringConfirmModal from './confirmationModals/DeleteRecurringConfirmModal';
import EquivalentAttendeesModal from './confirmationModals/EquivalentAttendeesModal';
import SendWithErrorsConfirmationModal from './confirmationModals/SendWithErrorsConfirmationModal';
import EditRecurringConfirmModal from './confirmationModals/editRecurring/EditRecurringConfirmation';
import EditSingleConfirmModal from './confirmationModals/editSingleModal/EditSingleConfirmModal';
import getDeleteEventActions from './eventActions/getDeleteEventActions';
import getSaveEventActions from './eventActions/getSaveEventActions';
import { getSendIcsAction } from './eventActions/inviteActions';
import withOccurrenceEvent from './eventActions/occurrenceEvent';
import {
    deleteConferenceData,
    getCreateTemporaryEvent,
    getEditTemporaryEvent,
    getTemporaryEvent,
    getUpdatedDateTime,
} from './eventHelper';
import getComponentFromCalendarEventUnencryptedPart from './eventStore/cache/getComponentFromCalendarEventUnencryptedPart';
import { getIsCalendarEvent } from './eventStore/cache/helper';
import {
    upsertAttendeeDeleteSingleEditResponses,
    upsertSyncMultiActionsResponses,
    upsertUpdateEventPartResponses,
} from './eventStore/cache/upsertResponsesArray';
import type { CalendarsEventsCache, DecryptedEventTupleResult } from './eventStore/interface';
import getAttendeeDeleteSingleEditPayload from './getAttendeeDeleteSingleEditPayload';
import type {
    CreateEventActionOperation,
    SyncEventActionOperations,
    UpdateEventActionOperation,
} from './getSyncMultipleEventsPayload';
import getSyncMultipleEventsPayload, { getIsUpdateSyncOperation } from './getSyncMultipleEventsPayload';
import getUpdatePersonalEventPayload from './getUpdatePersonalEventPayload';
import type {
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
import { openEventInEditMode } from './openEventInEditMode';
import { useCalendarSearch } from './search/CalendarSearchProvider';
import { getInitialTargetEventData } from './targetEventHelper';
import { useCalendarActionsOnLoad } from './useCalendarActionsOnLoad';

const getNormalizedTime = (isAllDay: boolean, initial: DateTimeModel, dateFromCalendar: Date) => {
    if (!isAllDay) {
        return dateFromCalendar;
    }
    const result = new Date(dateFromCalendar);
    // If it's an all day event, the hour and minutes are stripped from the temporary event.
    result.setUTCHours(initial.time.getHours(), initial.time.getMinutes());
    return result;
};

type ModalsMap = {
    sendWithErrorsConfirmationModal: ModalWithProps<{
        sendPreferencesMap: SimpleMap<SendPreferences>;
        vevent: VcalVeventComponent;
        inviteActions: InviteActions;
        cancelVevent?: VcalVeventComponent;
    }>;
    deleteConfirmModal: ModalWithProps<{
        inviteActions: InviteActions;
    }>;
    createEventModal: ModalWithProps<{
        isDuplicating: boolean;
    }>;
    confirmModal: ModalWithProps;
    editRecurringConfirmModal: ModalWithProps<{
        data: {
            types: RECURRING_TYPES[];
            hasSingleEdits: boolean;
            hasSingleDeletes: boolean;
            hasSingleEditsAfter: boolean;
            hasSingleDeletesAfter: boolean;
            hasRruleModification: boolean;
            hasCalendarModification: boolean;
            isBreakingChange: boolean;
        };
        inviteActions: InviteActions;
        isOrganizer: boolean;
        isAttendee: boolean;
        canEditOnlyPersonalPart: boolean;
    }>;
    editSingleConfirmModal: ModalWithProps<{
        inviteActions: InviteActions;
    }>;
    equivalentAttendeesModal: ModalWithProps<{
        equivalentAttendees: string[][];
    }>;
    deleteRecurringConfirmModal: ModalWithProps<{
        inviteActions: InviteActions;
        types: RECURRING_TYPES[];
        isAttendee: boolean;
        hasNonCancelledSingleEdits: boolean;
    }>;
    importModal: ModalWithProps<{
        files: File[];
        initialCalendar: VisualCalendar;
    }>;
};

interface Props extends SharedViewProps {
    isLoading: boolean;
    isEventCreationDisabled: boolean;
    weekStartsOn: WeekStartsOn;
    inviteLocale?: string;
    onBackFromSearch: () => void;
    onChangeDate: (date: Date) => void;
    onChangeDateAndRevertView: (date: Date) => void;
    onInteraction: (active: boolean) => void;
    activeCalendars: VisualCalendar[];
    calendars: VisualCalendar[];
    addresses: Address[];
    activeAddresses: Address[];
    createEventCalendar?: VisualCalendar;
    createEventCalendarBootstrap?: CalendarBootstrap;
    containerRef: RefObject<HTMLDivElement>;
    timeGridViewRef: RefObject<TimeGridRef>;
    interactiveRef: RefObject<InteractiveRef>;
    calendarsEventsCacheRef: MutableRefObject<CalendarsEventsCache>;
    eventTargetAction: EventTargetAction | undefined;
    setEventTargetAction: Dispatch<SetStateAction<EventTargetAction | undefined>>;
    getOpenedMailEvents: () => OpenedMailEvent[];
}

const InteractiveCalendarView = ({
    view,
    isLoading,
    isEventCreationDisabled,

    tzid,
    primaryTimezone,
    secondaryTimezone,
    secondaryTimezoneOffset,

    displayWeekNumbers,
    displaySecondaryTimezone,
    weekStartsOn,
    inviteLocale,

    now,
    date,
    dateRange,
    events,

    onClickDate,
    onChangeDate,
    onChangeDateAndRevertView,
    onClickToday,
    onInteraction,
    onBackFromSearch,

    calendars,
    addresses,
    activeAddresses,

    activeCalendars,
    createEventCalendar,
    createEventCalendarBootstrap,

    interactiveRef,
    containerRef,
    timeGridViewRef,
    calendarsEventsCacheRef,
    eventTargetAction,
    setEventTargetAction,
    getOpenedMailEvents,
}: Props) => {
    const api = useApi();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const [userSettings] = useUserSettings();
    const isTmpEventSaving = useCalendarSelector(selectIsTmpEventSaving);
    const pendingUniqueIds = useCalendarSelector(pendingUniqueIdsSelector);
    const hasPendingEvents = useMemo(() => {
        return pendingUniqueIds.length > 0;
    }, [pendingUniqueIds]);
    usePreventCloseTab(hasPendingEvents);
    usePauseCalendarEventLoop(activeCalendars, hasPendingEvents);
    const dispatch = useCalendarDispatch();
    const getVerificationPreferences = useGetVerificationPreferences();
    const { call: calendarCall } = useCalendarModelEventManager();
    const { createNotification, removeNotification } = useNotifications();
    const { contactEmailsMap } = useContactEmailsCache();
    const sendIcs = useSendIcs();
    const getVTimezonesMap = useGetVtimezonesMap();
    const getMailSettings = useGetMailSettings();
    const relocalizeText = useRelocalizeText();
    const config = useConfig();
    const [{ hasPaidMail }] = useUser();
    const isSavingEvent = useRef(false);
    const isEditSingleOccurrenceEnabled = useFlag('EditSingleOccurrenceWeb');
    const [targetEventElement, setTargetEventElement] = useState<HTMLElement | null>(null);
    const [targetMoreElement, setTargetMoreElement] = useState<HTMLDivElement | null>(null);
    const eventInPopoverUniqueIdRef = useRef<string | undefined>(undefined);
    const isDrawerApp = getIsCalendarAppInDrawer(view);
    const isSearchView = view === VIEWS.SEARCH;
    const cancelClosePopoverRef = useRef(false);
    const { startNESTMetric, stopNESTMetric } = useCalendarNESTMetric();
    const { startEALMetric, stopEALMetric } = useCalendarEALMetric();

    const [mustConnectToZoom, setMustConnectToZoom] = useState(false);

    const { viewportWidth } = useActiveBreakpoint();

    const { sentEventZoom } = useVideoConfTelemetry();

    const { modalsMap, closeModal, updateModal } = useModalsMap<ModalsMap>({
        createEventModal: { isOpen: false },
        confirmModal: { isOpen: false },
        editRecurringConfirmModal: { isOpen: false },
        editSingleConfirmModal: { isOpen: false },
        equivalentAttendeesModal: { isOpen: false },
        deleteConfirmModal: { isOpen: false },
        deleteRecurringConfirmModal: { isOpen: false },
        sendWithErrorsConfirmationModal: { isOpen: false },
        importModal: { isOpen: false },
    });

    const {
        importModal,
        sendWithErrorsConfirmationModal,
        deleteConfirmModal,
        deleteRecurringConfirmModal,
        equivalentAttendeesModal,
        confirmModal,
        editRecurringConfirmModal,
        editSingleConfirmModal,
        createEventModal,
    } = modalsMap;

    const confirm = useRef<{ resolve: (param?: any) => void; reject: (error: EscapeTryBlockError) => void }>();

    const contacts = useContactEmails()[0] || [];
    const displayNameEmailMap = useMemo(() => {
        const result = contacts.reduce<SimpleMap<DisplayNameEmail>>((acc, { Email, Name }) => {
            const canonicalEmail = canonicalizeEmailByGuess(Email);
            if (!acc[canonicalEmail]) {
                acc[canonicalEmail] = { displayName: Name, displayEmail: Email };
            }
            return acc;
        }, {});
        addresses.forEach(({ DisplayName, Email }) => {
            const normalizedEmail = canonicalizeInternalEmail(Email);
            if (!result[normalizedEmail]) {
                result[normalizedEmail] = { displayName: DisplayName, displayEmail: Email };
            }
        });
        return result;
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-757AAE
    }, [contacts]);

    const readCalendarBootstrap = useReadCalendarBootstrap();
    const getCalendarBootstrap = useGetCalendarBootstrap();
    const getCalendarKeys = useGetCalendarKeys();
    const getAddressKeys = useGetAddressKeys();
    const getCalendarEventRaw = useGetCalendarEventRaw(contactEmailsMap);
    const getCanonicalEmailsMap = useGetCanonicalEmailsMap();
    const getEncryptionPreferences = useGetEncryptionPreferences();

    const getEventDecrypted = (eventData: CalendarEvent): Promise<DecryptedEventTupleResult> => {
        return Promise.all([getCalendarEventRaw(eventData), pick(eventData, ['Permissions', 'IsProtonProtonInvite'])]);
    };

    const [interactiveData, setInteractiveData] = useState<InteractiveState | undefined>(() =>
        getInitialTargetEventData(eventTargetAction, dateRange, view)
    );

    // Open event handlers for opening events from search view
    const { goToEvent, goToOccurrence } = useOpenCalendarEvents({
        onChangeDate: onChangeDateAndRevertView,
        tzid,
        setEventTargetAction,
    });

    const { isBookingActive, addBookingRange, formData, isIntersectingBookingRange, updateBookingRange } =
        useBookings();

    // Handle events coming from outside if calendar app is open in the drawer
    useOpenEventsFromMail({
        calendars,
        addresses,
        onChangeDate,
        tzid,
        setEventTargetAction,
    });

    useEffect(
        () => {
            if (!eventTargetAction) {
                return;
            }
            setInteractiveData(getInitialTargetEventData(eventTargetAction, dateRange, view));
            if (eventTargetAction.isAllDay || eventTargetAction.isAllPartDay) {
                return;
            }
            timeGridViewRef.current?.scrollToTime(eventTargetAction.startInTzid);
        },
        // omitting dateRange on purpose as we only want a re-render on eventTargetAction changes
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-AC3FB3
        [eventTargetAction]
    );

    const { temporaryEvent, targetEventData, targetMoreData, searchData } = interactiveData || {};
    const tmpEvent = temporaryEvent?.data?.eventData;

    const isCreatingEvent = !!temporaryEvent?.tmpData && !tmpEvent;
    const isEditingEvent = !!temporaryEvent?.tmpData && !!tmpEvent;
    const isInvitation = !!temporaryEvent?.tmpDataOriginal?.organizer;
    const isDuplicatingEvent = !!modalsMap.createEventModal.props?.isDuplicating;
    const isInTemporaryBlocking =
        temporaryEvent && getHasDoneChanges(temporaryEvent.tmpData, temporaryEvent.tmpDataOriginal, isEditingEvent);
    // If opening the event from mail in the drawer (when preventPopover is true), do not disable scroll
    const isScrollDisabled = !!interactiveData && !temporaryEvent && !targetEventData?.preventPopover;
    const prodId = getProdId(config);

    useEffect(() => {
        onInteraction?.(!!temporaryEvent);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-5CCEDD
    }, [!!temporaryEvent]);

    useBeforeUnload(isInTemporaryBlocking ? c('Alert').t`By leaving now, you will lose your event.` : '');

    const sortedEvents = useMemo(() => {
        return sortEvents(events.concat());
    }, [events]);

    const isProcessing = useCallback(
        (uniqueId: string) => {
            if (isTmpEventSaving) {
                return true;
            }
            const selectedEvent: CalendarViewEventStore | undefined = events.find(
                (event) => event.uniqueId === uniqueId
            );

            if (!selectedEvent) {
                return false;
            }

            if (selectedEvent.isSaving || selectedEvent.isDeleting) {
                return true;
            }

            return events.some((event: CalendarViewEventStore) => {
                const UID = (event.data?.eventData as CalendarEvent)?.UID;
                const selectedUID = (selectedEvent.data?.eventData as CalendarEvent)?.UID;

                if (UID && UID === selectedUID) {
                    return event.isSaving || event.isDeleting;
                }

                return false;
            });
        },
        [events, isTmpEventSaving]
    );

    const sortedEventsWithTemporary = useMemo(() => {
        return sortWithTemporaryEvent(sortedEvents, temporaryEvent);
    }, [temporaryEvent, sortedEvents]);

    const changeDate = (start: Date, hasStartChanged = true) => {
        const isInRange = viewportWidth['<=small']
            ? isSameDay(date, start)
            : start >= dateRange[0] && dateRange[1] >= start;

        if (!isInRange && hasStartChanged) {
            onChangeDate(start);
        }
    };

    const handleSetTemporaryEventModel = (model: EventModel) => {
        if (!temporaryEvent || isSavingEvent.current) {
            return;
        }

        // We reset the Zoom error state when we delete the Zoom meeting
        if (model.isConferenceTmpDeleted) {
            setMustConnectToZoom(false);
        }

        const newTemporaryEvent = getTemporaryEvent(temporaryEvent, model, tzid);

        // For the modal, we handle this on submit instead
        if (!createEventModal.isOpen) {
            const newStartDate = toUTCDate(
                modelToDateProperty(newTemporaryEvent.tmpData.start, newTemporaryEvent.tmpData.isAllDay).value
            );

            const previousStartDate = toUTCDate(
                modelToDateProperty(temporaryEvent.tmpData.start, temporaryEvent.tmpData.isAllDay).value
            );

            const hasStartChanged = +previousStartDate !== +newStartDate;
            changeDate(newStartDate, hasStartChanged);
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
        if (!createEventCalendar || !createEventCalendarBootstrap) {
            return;
        }

        const initialDate = getInitialDate();
        const { Members = [], CalendarSettings } = createEventCalendarBootstrap;
        const [Member] = Members;
        const Address = activeAddresses.find(({ Email }) => Member?.Email === Email);

        if (!Member || !Address) {
            return;
        }

        return getInitialModel({
            initialDate,
            CalendarSettings,
            Calendar: createEventCalendar,
            Calendars: activeCalendars,
            Addresses: activeAddresses,
            Members,
            Member,
            Address,
            isAllDay,
            tzid,
            attendees,
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
        return getComponentFromCalendarEventUnencryptedPart(parentEvent);
    };

    const getUpdateModel = ({
        viewEventData: { calendarData, eventData, eventReadResult, eventRecurrence },
        duplicateFromNonWritableCalendarData,
        partstat,
        shouldDropColor,
    }: {
        viewEventData: CalendarViewEventData;
        duplicateFromNonWritableCalendarData?: { calendar: VisualCalendar };
        partstat?: ICAL_ATTENDEE_STATUS;
        shouldDropColor?: boolean;
    }): EventModel | undefined => {
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
        const targetCalendar = duplicateFromNonWritableCalendarData?.calendar || calendarData;
        const calendarBootstrap = readCalendarBootstrap(targetCalendar.ID);
        if (!calendarBootstrap) {
            throw new Error('Missing calendar bootstrap');
        }
        const { Members = [], CalendarSettings } = calendarBootstrap;
        const [Member, Address] = getMemberAndAddress(addresses, Members, eventData.Author);

        const [
            {
                veventComponent: existingVeventComponent,
                hasDefaultNotifications,
                verificationStatus,
                selfAddressData: existingSelfAddressData,
            },
        ] = eventReadResult.result;

        const existingVeventComponentParentPartial = existingVeventComponent['recurrence-id']
            ? getVeventComponentParent(existingVeventComponent.uid.value, eventData.CalendarID)
            : undefined;
        const createResult = getInitialModel({
            initialDate,
            CalendarSettings,
            Calendar: targetCalendar,
            Calendars: activeCalendars,
            Addresses: addresses,
            Members,
            Member,
            Address,
            isAllDay: false,
            verificationStatus,
            tzid,
        });

        const veventComponent = eventRecurrence
            ? withOccurrenceEvent(existingVeventComponent, eventRecurrence)
            : { ...existingVeventComponent };
        let selfAddressData = existingSelfAddressData;

        if (duplicateFromNonWritableCalendarData) {
            /**
             * When duplicating from a disabled calendar, we artificially changed the calendar. In that case we need to:
             * * change organizer to that of the new calendar
             * * reset the self address data (otherwise we would have disabled address data in there)
             */
            selfAddressData = {
                isOrganizer: !!veventComponent.attendee?.length,
                isAttendee: false,
                selfAddress: Address,
            };
            if (existingVeventComponent.organizer) {
                veventComponent.organizer = buildVcalOrganizer(Address.Email, Address.DisplayName);
            }
        }
        if (shouldDropColor) {
            veventComponent.color = undefined;
        }

        const eventResult = getExistingEvent({
            veventComponent,
            hasDefaultNotifications,
            veventComponentParentPartial: existingVeventComponentParentPartial,
            tzid,
            isProtonProtonInvite: !!eventData.IsProtonProtonInvite,
            selfAddressData,
            calendarSettings: CalendarSettings,
        });
        if (partstat) {
            // The user attends the event and is changing the partstat
            return {
                ...createResult,
                ...modifyEventModelPartstat(eventResult, partstat, CalendarSettings),
            };
        }
        return {
            ...createResult,
            ...eventResult,
            hasDefaultNotifications,
            [eventResult.isAllDay ? 'hasFullDayDefaultNotifications' : 'hasPartDayDefaultNotifications']:
                hasDefaultNotifications,
        };
    };

    const handleMouseDown = (mouseDownAction: MouseDownAction) => {
        // Reset Zoom connection error state when starting any drag operation
        setMustConnectToZoom(false);

        // Manually dispatch a mousedown event, since it has been blocked by our custom mouse handlers
        containerRef.current?.dispatchEvent(new Event('mousedown'));

        if (isEventDownAction(mouseDownAction)) {
            const { event, type } = mouseDownAction.payload;

            if (isProcessing(event.uniqueId)) {
                return;
            }

            const targetCalendar = event.data.calendarData;

            const isAllowedToTouchEvent = true;
            const canEditSharedEventData = getCanEditSharedEventData({
                isOwnedCalendar: getIsOwnedCalendar(targetCalendar),
                isCalendarWritable: getIsCalendarWritable(targetCalendar),
                isOrganizer: !!event.data.eventReadResult?.result?.[0].selfAddressData.isOrganizer,
                isAttendee: !!event.data.eventReadResult?.result?.[0].selfAddressData.isAttendee,
                isInvitation: !!event.data.eventReadResult?.result?.[0].veventComponent.organizer,
                selfAddress: event.data.eventReadResult?.result?.[0].selfAddressData.selfAddress,
            });
            let isAllowedToMoveEvent =
                getIsCalendarProbablyActive(targetCalendar) &&
                getIsCalendarWritable(targetCalendar) &&
                canEditSharedEventData;

            if (!isAllowedToTouchEvent) {
                return;
            }

            let newTemporaryModel = temporaryEvent && event.isTemporary ? temporaryEvent.tmpData : undefined;
            let newTemporaryEvent = temporaryEvent && event.isTemporary ? temporaryEvent : undefined;
            let initialModel = newTemporaryModel;

            return (mouseUpAction: MouseUpAction) => {
                const isBookingEvent =
                    event.uniqueId.startsWith(TEMPORARY_BOOKING_SLOT) || event.uniqueId.startsWith(BOOKING_SLOT_ID);

                if (isBookingActive && !isBookingEvent) {
                    return;
                }

                // When doing an action on a booking ranges, we need to bypas the temporary event logic
                if (isBookingEvent) {
                    // Don't handle EVENT_UP for booking events (no popover)
                    if (mouseUpAction.action === ACTIONS.EVENT_UP) {
                        return;
                    }

                    if (mouseUpAction.action !== ACTIONS.EVENT_MOVE && mouseUpAction.action !== ACTIONS.EVENT_MOVE_UP) {
                        return;
                    }

                    const {
                        result: { start, end },
                    } = mouseUpAction.payload;

                    // We prevent dragging past the duration in the form
                    if (differenceInMinutes(end, start) < formData.duration) {
                        return;
                    }

                    if (mouseUpAction.action === ACTIONS.EVENT_MOVE) {
                        // To get visual feedback on the interface when moving or resizing an event,
                        // we need to create a "fake" temporary event

                        const minimalModel = getTemporaryBookingEvents(event, start, end, tzid);

                        const previewEvent: CalendarViewEventTemporaryEvent = {
                            ...event,
                            start,
                            end,
                            tmpData: minimalModel,
                            tmpDataOriginal: minimalModel,
                        };

                        setInteractiveData({
                            temporaryEvent: previewEvent,
                        });
                        return;
                    }

                    // On mouse up, we can save the change the user made
                    if (mouseUpAction.action === ACTIONS.EVENT_MOVE_UP) {
                        const rangeId = event.uniqueId;

                        const localStart = toLocalDate(fromUTCDate(start));
                        const localEnd = toLocalDate(fromUTCDate(end));

                        updateBookingRange(rangeId, localStart, localEnd);
                        setInteractiveData(undefined);
                    }
                    return;
                }

                if (mouseUpAction.action === ACTIONS.EVENT_UP) {
                    const { idx } = mouseUpAction.payload;

                    setInteractiveData({
                        temporaryEvent: temporaryEvent && event.isTemporary ? temporaryEvent : undefined,
                        targetEventData: { uniqueId: event.uniqueId, idx, type },
                    });
                    return;
                }

                if (!isAllowedToMoveEvent) {
                    return;
                }

                // Regular event handling below
                if (!newTemporaryModel) {
                    newTemporaryModel = getUpdateModel({ viewEventData: event.data });
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
                        targetEventData: { uniqueId: event.uniqueId, idx, type },
                    });
                }
            };
        }

        if (isCreateDownAction(mouseDownAction)) {
            if (
                !createEventCalendar ||
                !createEventCalendarBootstrap ||
                (targetEventData && !temporaryEvent?.tmpData) || // Prevent creating a new event when an event is already selected
                isSavingEvent.current
            ) {
                return;
            }

            const { type } = mouseDownAction.payload;
            const isFromAllDay = type === TYPE.DAYGRID;

            // We cannot create all day event when the booking process is active
            if (isBookingActive && isFromAllDay) {
                return;
            }

            if (isProcessing(TMP_UNIQUE_ID)) {
                return;
            }

            let newTemporaryModel = !!temporaryEvent?.tmpData ? temporaryEvent.tmpData : getCreateModel(isFromAllDay);

            const isAllowed = !!newTemporaryModel;

            if (!isAllowed) {
                return;
            }

            if (!newTemporaryModel) {
                return;
            }

            const { start: initialStart, end: initialEnd } = newTemporaryModel;
            let newTemporaryEvent =
                temporaryEvent || getCreateTemporaryEvent(createEventCalendar, newTemporaryModel, tzid);

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
                const normalizedEnd = (() => {
                    if (action === ACTIONS.CREATE_UP) {
                        return isFromAllDay ? start : new Date(normalizedStart.getTime() + eventDuration);
                    }

                    return end;
                })();

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

                const now = toLocalDate(convertUTCDateTimeToZone(fromUTCDate(new Date()), tzid));
                const bookingStart = toLocalDate(fromUTCDate(start));
                const bookingEnd = toLocalDate(fromUTCDate(end));

                const isStrictlyInPast = isBefore(bookingStart, now) && isBefore(bookingEnd, now);

                if (action === ACTIONS.CREATE_MOVE) {
                    if (isBookingActive) {
                        // We prevent drag and drop if the booking is strictly in the past
                        if (isStrictlyInPast && !formData.recurring) {
                            createNotification({
                                text: BookingErrorMessages.RANGE_IN_PAST,
                            });
                            return;
                        }

                        if (isIntersectingBookingRange(bookingStart, bookingEnd)) {
                            return;
                        }

                        const calendarData = getVisualCalendar(
                            calendars.find((calendar) => calendar.ID === formData.selectedCalendar) ||
                                createEventCalendar
                        );

                        // Change the ID to have a specific style when dragging and creating a booking page
                        setInteractiveData({
                            temporaryEvent: {
                                ...newTemporaryEvent,
                                data: {
                                    ...newTemporaryEvent.data,
                                    calendarData,
                                },
                                uniqueId: TEMPORARY_BOOKING_SLOT + newTemporaryEvent.uniqueId,
                            },
                        });
                        return;
                    }
                    setInteractiveData({ temporaryEvent: newTemporaryEvent });
                }
                if (action === ACTIONS.CREATE_UP || action === ACTIONS.CREATE_MOVE_UP) {
                    if (isBookingActive) {
                        // We prevent drag and drop if the booking is strictly in the past
                        if (isStrictlyInPast && !formData.recurring) {
                            createNotification({
                                text: BookingErrorMessages.RANGE_IN_PAST,
                            });
                            return;
                        }

                        // We want to make sure that events last for the event duration when clicking on the calendar grid.
                        let safeEnd = bookingEnd;
                        if (
                            action === ACTIONS.CREATE_UP &&
                            differenceInMinutes(safeEnd, bookingStart) < formData.duration
                        ) {
                            safeEnd = addMinutes(bookingStart, formData.duration);
                        }

                        addBookingRange({
                            start: bookingStart,
                            end: safeEnd,
                            timezone: tzid,
                        });
                        setInteractiveData(undefined);
                        return;
                    }

                    setInteractiveData({
                        temporaryEvent: newTemporaryEvent,
                        targetEventData: { uniqueId: newTemporaryEvent.uniqueId, idx, type },
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

    const handleClickEvent = ({ uniqueId, idx, type }: TargetEventData) => {
        setInteractiveData({
            ...interactiveData,
            targetEventData: { uniqueId, idx, type },
        });
    };

    const handleSendPrefsErrors: OnSendPrefsErrors = async ({
        inviteActions,
        vevent,
        cancelVevent,
        sendPreferencesMap: initialSendPrefsMap,
        noCheckSendPrefs,
    }: any) => {
        if (initialSendPrefsMap) {
            // Temporary fix for edit single occurrence v1:
            // We are currently computing send preferences map for the main series only, because for v1, we assume that
            // the participant list is the same between single edits and main series.
            // The SendWithErrorsConfirmationModal won't be opened for single edits, so we have to compute the clean data
            // so that we make sure participants with send preferences are cleaned properly.
            // TODO this should be removed during edit single occurrences v2
            const errorMap = getSendPrefErrorMap(initialSendPrefsMap);
            const cleanSendData = getCleanSendDataFromSendPref({
                emailsWithError: Object.keys(errorMap),
                sendPreferencesMap: initialSendPrefsMap,
                inviteActions,
                vevent,
                cancelVevent,
            });
            return cleanSendData;
        }
        const { Sign } = await getMailSettings();
        const sendPreferencesMap: SimpleMap<SendPreferences> = {};
        const emails = extractInviteEmails({ inviteActions, vevent, cancelVevent });
        await Promise.all(
            emails.map(async (email) => {
                const encryptionPreferences = await getEncryptionPreferences({
                    email,
                    lifetime: 10 * SECOND, // Increase encryption preference lifetime to 10s so that requests are cached when saving events (call is done twice)
                    contactEmailsMap,
                });
                sendPreferencesMap[email] = getSendPreferences(
                    encryptionPreferences,
                    getIcsMessageWithPreferences(Sign)
                );
            })
        );

        const hasErrors = Object.values(sendPreferencesMap).some((sendPref) => !!sendPref?.error);
        if (!hasErrors || noCheckSendPrefs) {
            return { sendPreferencesMap, inviteActions, vevent, cancelVevent };
        }
        return new Promise((resolve, reject) => {
            confirm.current = { resolve, reject };
            updateModal('sendWithErrorsConfirmationModal', {
                isOpen: true,
                props: {
                    sendPreferencesMap,
                    vevent,
                    inviteActions,
                    cancelVevent,
                },
            });
        });
    };

    const handleSendIcs: SendIcs = async (
        { inviteActions, vevent, cancelVevent, noCheckSendPrefs, sendPreferencesMap: initialSendPrefsMap }: any,
        calendarID
    ) => {
        const onRequestError = () => {
            if (calendarID) {
                void calendarCall([calendarID]);
            }
            throw new Error(c('Error').t`Invitation failed to be sent`);
        };
        const onReplyError = () => {
            if (calendarID) {
                void calendarCall([calendarID]);
            }
            throw new Error(c('Error').t`Answer failed to be sent`);
        };
        const onCancelError = () => {
            if (calendarID) {
                void calendarCall([calendarID]);
            }
            throw new Error(c('Error').t`Cancellation failed to be sent`);
        };
        const {
            sendPreferencesMap,
            inviteActions: cleanInviteActions,
            vevent: cleanVevent,
            cancelVevent: cleanCancelVevent,
        } = await handleSendPrefsErrors({
            inviteActions,
            vevent,
            cancelVevent,
            sendPreferencesMap: initialSendPrefsMap,
            noCheckSendPrefs,
        });

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
            relocalizeText,
            inviteLocale,
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
            sendPreferencesMap,
        };
    };

    const handleCloseConfirmation = () => {
        updateModal('confirmModal', {
            isOpen: true,
        });

        return new Promise<void>((resolve, reject) => {
            confirm.current = { resolve, reject };
        });
    };

    const handleSaveConfirmation = ({
        type,
        data,
        isOrganizer,
        isAttendee,
        canEditOnlyPersonalPart,
        inviteActions,
    }: OnSaveConfirmationArgs): Promise<RecurringActionData> => {
        return new Promise<RecurringActionData>((resolve, reject) => {
            confirm.current = { resolve, reject };
            if (type === SAVE_CONFIRMATION_TYPES.RECURRING && data) {
                updateModal('editRecurringConfirmModal', {
                    isOpen: true,
                    props: {
                        data,
                        inviteActions,
                        isOrganizer,
                        isAttendee,
                        canEditOnlyPersonalPart,
                    },
                });
            } else if (type === SAVE_CONFIRMATION_TYPES.SINGLE) {
                updateModal('editSingleConfirmModal', {
                    isOpen: true,
                    props: {
                        inviteActions,
                    },
                });
            } else {
                return reject(new Error('Unknown type'));
            }
        });
    };

    const handleDeleteConfirmation = ({
        type,
        data,
        isAttendee,
        inviteActions,
    }: OnDeleteConfirmationArgs): Promise<RecurringActionData> => {
        return new Promise<RecurringActionData>((resolve, reject) => {
            confirm.current = { resolve, reject };
            if (type === DELETE_CONFIRMATION_TYPES.SINGLE) {
                updateModal('deleteConfirmModal', {
                    isOpen: true,
                    props: {
                        inviteActions,
                    },
                });
            } else if (type === DELETE_CONFIRMATION_TYPES.RECURRING && data) {
                updateModal('deleteRecurringConfirmModal', {
                    isOpen: true,
                    props: {
                        inviteActions,
                        types: data.types,
                        isAttendee,
                        hasNonCancelledSingleEdits: data.hasNonCancelledSingleEdits,
                    },
                });
            } else {
                return reject(new Error('Unknown type'));
            }
        });
    };

    const { setOpenedSearchItem, setIsSearching, setSearchInput } = useCalendarSearch();

    const resetInteractiveData = () => {
        setInteractiveData(undefined);
        setOpenedSearchItem(undefined);
        setMustConnectToZoom(false);
    };

    // Close modal and popover for a given uniqueId
    const closeProcessingModal = (uniqueId: string = TMP_UNIQUE_ID, type: 'modal' | 'popover') => {
        if (eventInPopoverUniqueIdRef.current !== uniqueId) {
            return;
        }

        if (type === 'modal') {
            closeModal('createEventModal');
        }

        if (type === 'popover') {
            setInteractiveData((prev) => ({
                ...prev,
                targetEventData: prev?.targetEventData
                    ? {
                          ...prev?.targetEventData,
                          preventPopover: true, // close the popover
                      }
                    : undefined,
            }));
        }
    };

    const removeTemporaryEvent = (uniqueId?: string) => {
        if (temporaryEvent?.uniqueId === uniqueId) {
            resetInteractiveData();
        }
    };

    useEffect(() => {
        if (isSearchView) {
            resetInteractiveData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-A0D7C2
    }, [isSearchView]);

    const handleCloseMorePopover = resetInteractiveData;

    const handleCloseEventPopover = () => {
        // If both a more popover and an event is open, first close the event
        if (interactiveData && interactiveData.targetMoreData && interactiveData.targetEventData) {
            setInteractiveData(omit(interactiveData, ['targetEventData']));
            return;
        }
        resetInteractiveData();
    };

    const handleConfirmDeleteTemporary = async ({ ask = false } = {}) => {
        if (isSavingEvent.current) {
            return Promise.reject(new Error('Keep event'));
        }
        if (isInTemporaryBlocking) {
            if (!ask) {
                return Promise.reject(new Error('Keep event'));
            }
            try {
                return await new Promise<void>((resolve, reject) =>
                    handleCloseConfirmation()
                        .then(() => {
                            resolve();
                        })
                        .catch(reject)
                );
            } catch (e) {
                return Promise.reject(new Error('Keep event'));
            }
        }

        return Promise.resolve();
    };

    const handleEditEvent = (temporaryEvent: CalendarViewEventTemporaryEvent, isDuplicating = false) => {
        if (isSavingEvent.current) {
            return;
        }

        // Close the popover only
        setInteractiveData({ temporaryEvent });
        updateModal('createEventModal', { isOpen: true, props: { isDuplicating } });
    };

    /**
     * Used when switching from create/edit modal to grid popover
     * 1. Close the modal
     * 2. Open the popover
     */
    const switchFromModalToPopover = (temporaryEvent: CalendarViewEventTemporaryEvent) => {
        if (isSavingEvent.current) {
            return;
        }

        cancelClosePopoverRef.current = true;
        closeModal('createEventModal');

        // Close the popover only
        setInteractiveData({
            temporaryEvent,
            targetEventData: {
                type: temporaryEvent.isAllDay ? TYPE.DAYGRID : TYPE.TIMEGRID,
                uniqueId: temporaryEvent.uniqueId,
                preventPopover: isDrawerApp,
            },
        });
    };

    const handleCreateEvent = ({
        attendees,
        startModel,
        isDuplicating,
        title,
        location,
        description,
    }: {
        attendees?: AttendeeModel[];
        startModel?: EventModel;
        isDuplicating?: boolean;
        title?: string;
        location?: string;
        description?: string;
    }) => {
        if (!createEventCalendar) {
            return;
        }

        let model = startModel || getCreateModel(false, attendees);

        if (!model) {
            throw new Error('Unable to get create model');
        }

        model = {
            ...model,
            ...(title && { title }),
            ...(location && { location }),
            ...(description && { description }),
        };

        const newTemporaryEvent = getTemporaryEvent(
            getCreateTemporaryEvent(createEventCalendar, model, tzid),
            model,
            tzid
        );
        handleEditEvent(newTemporaryEvent, isDuplicating);
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

        if (hiddenCalendars.length > 0) {
            hiddenCalendars.forEach((calendarID) => {
                void dispatch(changeCalendarVisiblity({ calendarID, display: true }));
            });
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
                /**
                 * Util to get re-encrypt comments with newly generated keypackets
                 * to allow organiser to keep comment in some single edit cases
                 */
                getAttendeeEncryptedComment: async (
                    nextSessionKey: SessionKey | undefined,
                    operation: CreateEventActionOperation | UpdateEventActionOperation
                ): Promise<{ [token: string]: AttendeeComment }> => {
                    const originalCalendarEvent = temporaryEvent?.tmpOriginalTarget?.data.eventData;

                    // 1. Return early if:
                    // - Original evetn is a calendar event
                    // - Event is not a recurring one: We target only recurring events.
                    // - It's a breaking change: In this case comment should be reset too.
                    // - Action is trigerred by an attendee: It should concern only organisers.
                    if (
                        !getIsCalendarEvent(originalCalendarEvent) ||
                        !originalCalendarEvent.IsOrganizer ||
                        !originalCalendarEvent.RRule ||
                        (getIsUpdateSyncOperation(operation) &&
                            (operation.data.resetNotes || operation.data.isAttendee))
                    ) {
                        return {};
                    }

                    // 2. Decrypt comments and get their signatures
                    // Attendees from API are redecrypted to get user signature
                    const attendeesFromApi = originalCalendarEvent.AttendeesInfo.Attendees;
                    // Attendees from vevent will have to
                    const attendeesFromVevent = operation.data.veventComponent.attendee;

                    // If no attendees or no keys, return early
                    if (!attendeesFromVevent?.length || attendeesFromApi.length === 0 || !nextSessionKey) {
                        return {};
                    }

                    const clearComments = await Promise.all(
                        attendeesFromVevent.map<Promise<{ attendeeToken: string; comment: AttendeeComment } | null>>(
                            async (attendee) => {
                                const attendeeEmail = attendee.parameters?.cn;
                                const attendeeFromApi = attendeesFromApi.find(
                                    (attendeeFromApi) => attendeeFromApi.Token === attendee.parameters?.['x-pm-token']
                                );

                                // If no comment early return
                                if (!attendeeEmail || !attendeeFromApi?.Comment) {
                                    return null;
                                }

                                // If comment in clearText early return with comment as is
                                if (attendeeFromApi.Comment.Type === ATTENDEE_COMMENT_ENCRYPTION_TYPE.CLEARTEXT) {
                                    return {
                                        attendeeToken: attendeeFromApi.Token,
                                        comment: {
                                            Type: ATTENDEE_COMMENT_ENCRYPTION_TYPE.CLEARTEXT,
                                            Message: attendeeFromApi.Comment.Message,
                                        },
                                    };
                                }

                                // Here comment is encrypted and signed
                                const attendeeVerificationPreferences = await getVerificationPreferences({
                                    email: attendeeEmail,
                                    contactEmailsMap,
                                });

                                const [privateKeys] = await Promise.all([
                                    getCalendarEventDecryptionKeys({
                                        calendarEvent: originalCalendarEvent,
                                        getAddressKeys,
                                        getCalendarKeys,
                                    }),
                                    getAuthorPublicKeysMap({
                                        event: originalCalendarEvent,
                                        getVerificationPreferences,
                                        contactEmailsMap,
                                    }),
                                    getCalendarBootstrap(originalCalendarEvent.CalendarID),
                                ]);
                                const [sharedSessionKey] = await readSessionKeys({
                                    calendarEvent: originalCalendarEvent,
                                    privateKeys,
                                });

                                if (!sharedSessionKey) {
                                    return null;
                                }

                                // I'm organiser needing to re-encrypt comments because of key packets changes
                                // If i don't re-encrypt them with new key packets they'll become undecryptable.
                                // But i need to keep the signature made by the attendees so:
                                // 1. I decrypt commetns with old keypackets
                                // 2. I reuse the decrypted comment signature to sign new comments
                                //
                                // If any change is performed on the comment content, signature will become invalid so we remain covered
                                const decryptedComment = await getDecryptedRSVPComment({
                                    attendeeVerificationPreferences,
                                    encryptedMessage: attendeeFromApi.Comment.Message,
                                    eventUID: originalCalendarEvent.UID,
                                    sharedSessionKey,
                                });

                                const encryptedComment = await getEncryptedRSVPCommentWithSignature({
                                    comment: decryptedComment.data,
                                    sessionKey: nextSessionKey,
                                    signatures: decryptedComment.signatures,
                                });

                                return {
                                    attendeeToken: attendeeFromApi.Token,
                                    comment: encryptedComment,
                                };
                            }
                        )
                    ).catch((e) => {
                        traceInitiativeError(SentryCalendarInitiatives.RSVP_NOTE, e);
                        return [];
                    });

                    return clearComments.reduce<{ [token: string]: AttendeeComment }>((acc, comment) => {
                        if (!comment) {
                            return acc;
                        }

                        acc[comment.attendeeToken] = comment.comment;

                        return acc;
                    }, {});
                },
            });

            const result = await api<SyncMultipleApiResponse>({ ...payload, silence: true });
            const { Responses: responses } = result;
            const errorResponses = responses.filter(({ Response }) => {
                return 'Error' in Response || Response.Code !== API_CODES.SINGLE_SUCCESS;
            });

            if (errorResponses.length > 0) {
                const firstError = errorResponses[0].Response;

                // Done to catch video conference errors
                if (firstError.Code === VIDEO_CONF_API_ERROR_CODES.MEETING_PROVIDER_ERROR) {
                    throw new Error(firstError.Error, { cause: VIDEO_CONF_API_ERROR_CODES.MEETING_PROVIDER_ERROR });
                }

                throw new Error(firstError.Error || 'Unknown error');
            }

            // Fetch paginated attendeesinfos to get all attendee comments
            await Promise.all(
                result.Responses.map((result) => {
                    const event = result?.Response?.Event;
                    if (result?.Response?.Error || !event) {
                        return Promise.resolve();
                    }

                    return fetchPaginatedAttendeesInfo(api, event);
                })
            );

            multiResponses.push(result);
        }

        return multiResponses;
    };

    const handleReencryptSharedEvent = async ({ calendarEvent, calendarID }: ReencryptInviteActionData) => {
        const [sharedSessionKey, calendarKeys] = await Promise.all([
            getSharedSessionKey({ calendarEvent, getAddressKeys, getCalendarKeys }),
            getCalendarKeys(calendarID),
        ]);

        if (!sharedSessionKey) {
            throw new Error('Failed to retrieve shared session key. Cannot re-encrypt event');
        }

        void (await reencryptCalendarSharedEvent({
            calendarEvent,
            sharedSessionKey,
            calendarKeys,
            api,
        }).catch((error) => {
            void calendarCall([calendarID]);

            throw new Error(error);
        }));
    };

    const handleUpdatePartstatActions = async (operations: UpdatePartstatOperation[] = []) => {
        if (!operations.length) {
            return [];
        }
        const getRequest =
            ({ data: { eventID, calendarID, attendeeID, updateTime, partstat, comment } }: UpdatePartstatOperation) =>
            async () => {
                const { Event, ...rest } = await api<UpdateEventPartApiResponse>({
                    ...updateAttendeePartstat(calendarID, eventID, attendeeID, {
                        Status: toApiPartstat(partstat),
                        UpdateTime: updateTime,
                        Comment: comment,
                    }),
                    silence: true,
                });

                if (Event.AttendeesInfo.MoreAttendees === ATTENDEE_MORE_ATTENDEES.YES) {
                    await fetchPaginatedAttendeesInfo(api, Event);
                }

                return {
                    ...rest,
                    Event,
                };
            };
        const noisyRequests = operations.filter(({ silence }) => !silence).map(getRequest);
        const silentRequests = operations.filter(({ silence }) => silence).map(getRequest);
        // the routes called in these requests do not have any specific jail limit
        // the limit per user session is 25k requests / 900s
        const responses: UpdateEventPartApiResponse[] = [];
        try {
            const noisyResponses = await processApiRequestsSafe(noisyRequests, 25000, 900 * SECOND);
            responses.push(...noisyResponses);
        } catch (e: any) {
            const errorMessage = getNonEmptyErrorMessage(
                e,
                c('Error changing answer of a calendar invitation').t`Error changing answer`
            );
            throw new Error(errorMessage);
        }

        // Catch other errors silently
        try {
            const silentResponses = await processApiRequestsSafe(silentRequests, 25000, 900 * SECOND);
            responses.push(...silentResponses);
        } catch (e: any) {
            noop();
        }
        return responses;
    };

    const handleUpdatePersonalPartActions = async (operations: UpdatePersonalPartOperation[] = []) => {
        if (!operations.length) {
            return [];
        }
        const requests = operations.map(
            ({ data: { eventID, calendarID, eventComponent, hasDefaultNotifications, color } }) =>
                async () => {
                    const payload = await getUpdatePersonalEventPayload({
                        eventComponent,
                        hasDefaultNotifications,
                        color,
                    });
                    const { Event, ...rest } = await api<UpdateEventPartApiResponse>({
                        ...updatePersonalEventPart(calendarID, eventID, payload),
                        silence: true,
                    });

                    if (Event.AttendeesInfo.MoreAttendees === ATTENDEE_MORE_ATTENDEES.YES) {
                        await fetchPaginatedAttendeesInfo(api, Event);
                    }

                    return {
                        ...rest,
                        Event,
                    };
                }
        );
        // Catch errors silently
        try {
            // the routes called in requests do not have any specific jail limit
            // the limit per user session is 25k requests / 900s
            return await processApiRequestsSafe(requests, 25000, 900 * SECOND);
        } catch (e: any) {
            return [];
        }
    };

    const handleAttendeeDeleteSingleEditActions = async (operations: AttendeeDeleteSingleEditOperation[] = []) => {
        if (!operations.length) {
            return [];
        }
        const requests = operations.map(({ data: { addressID, eventID, calendarID, eventComponent } }) => async () => {
            const payload = await getAttendeeDeleteSingleEditPayload({
                eventComponent,
                addressID,
                getAddressKeys,
            });
            return api<AttendeeDeleteSingleEditResponse>(attendeeDeleteSingleEdit(calendarID, eventID, payload));
        });
        // the routes called in requests do not have any specific jail limit
        // the limit per user session is 25k requests / 900s
        return processApiRequestsSafe(requests, 25000, 900 * SECOND);
    };

    const handleEquivalentAttendees = async (equivalentAttendees: string[][]) => {
        return new Promise<void>((_resolve, reject) => {
            confirm.current = { resolve: _resolve, reject };
            updateModal('equivalentAttendeesModal', {
                isOpen: true,
                props: {
                    equivalentAttendees,
                },
            });
        });
    };

    const handleSaveEvent = async ({
        temporaryEvent,
        inviteActions,
        isDuplicatingEvent = false,
        isChangePartstat = false,
        isModal = false,
    }: {
        temporaryEvent: CalendarViewEventTemporaryEvent;
        inviteActions: InviteActions;
        isDuplicatingEvent?: boolean;
        isChangePartstat?: boolean;
        isModal?: boolean;
    }) => {
        startNESTMetric(temporaryEvent, isCreatingEvent);
        if (isEditingEvent) {
            startEALMetric('edit');
        }
        let hasClosedModalOrPopover = false;
        let hasThrown = false;
        let hasStartChanged;
        // uid is not defined when we create a new event
        const UID = temporaryEvent.tmpData.uid || TMP_UID;
        const ID = (temporaryEvent.data?.eventData as CalendarEvent)?.ID;
        const uniqueId = temporaryEvent.uniqueId;
        const selfEmail = inviteActions.selfAddress?.Email;
        let oldPartstat: string | undefined;
        let successNotification: { success: string } | undefined;
        let isSingleEventUpdate = true;
        let notificationId = 0; // 0 is an invalid notification ID

        // The Zoom integration needs to do a round trip with API to update Zoom events
        // If a Zoom meeting is present, we do the sync before any Redux update
        const hasZoomMeeting =
            !!temporaryEvent.tmpData.conferenceId &&
            !!temporaryEvent.tmpData.conferenceUrl &&
            temporaryEvent.tmpData.conferenceUrl.includes('zoom.us');

        try {
            isSavingEvent.current = true;
            if (isChangePartstat && selfEmail && inviteActions.partstat) {
                oldPartstat = getCurrentPartstat(uniqueId, selfEmail);
                dispatch(eventsActions.updateInvite({ ID, selfEmail, partstat: inviteActions.partstat }));
            }

            const {
                syncActions,
                updatePartstatActions = [],
                updatePersonalPartActions = [],
                sendActions = [],
                texts,
                hasStartChanged: hasStartChangedProp,
            } = await getSaveEventActions({
                temporaryEvent,
                weekStartsOn,
                addresses,
                inviteActions,
                isDuplicatingEvent,
                api,
                onSaveConfirmation: async (params) => {
                    try {
                        const result = await handleSaveConfirmation(params);
                        // If confirmation modals opens, we set start time to after the user confirms
                        startNESTMetric(temporaryEvent, isCreatingEvent);
                        if (isEditingEvent) {
                            startEALMetric('edit');
                        }
                        if (result.type === RECURRING_TYPES.ALL || result.type === RECURRING_TYPES.FUTURE) {
                            isSingleEventUpdate = false;
                        }
                        return result;
                    } catch (e) {
                        // Reset partstat if the user cancels the confirmation modal
                        if (isChangePartstat && selfEmail && oldPartstat) {
                            dispatch(eventsActions.updateInvite({ ID, selfEmail, partstat: oldPartstat }));
                        }
                        throw e;
                    }
                },
                onEquivalentAttendees: handleEquivalentAttendees,
                getEventDecrypted,
                getCalendarBootstrap,
                getCalendarKeys,
                getAddressKeys,
                getCanonicalEmailsMap,
                sendIcs: handleSendIcs,
                getCalendarEventRaw,
                reencryptSharedEvent: handleReencryptSharedEvent,
                onSendPrefsErrors: handleSendPrefsErrors,
                handleSyncActions,
                isEditSingleOccurrenceEnabled,
            });

            let syncRes: SyncMultipleApiResponse[] | undefined = undefined;
            if (hasZoomMeeting) {
                try {
                    syncRes = await handleSyncActions(syncActions);
                } catch (e: any) {
                    // If the error is a video conference error, we open the oauth modal and try again
                    if (e?.cause === VIDEO_CONF_API_ERROR_CODES.MEETING_PROVIDER_ERROR) {
                        sentEventZoom(
                            VideoConferenceZoomIntegration.create_zoom_meeting_failed,
                            `${VIDEO_CONF_API_ERROR_CODES.MEETING_PROVIDER_ERROR}-intaractiveCalendar`
                        );

                        setMustConnectToZoom(true);
                        throw e;
                    } else {
                        throw e;
                    }
                }
            }

            if (isSingleEventUpdate) {
                dispatch(eventsActions.markEventAsSaving({ uniqueId, isSaving: true }));
            } else {
                dispatch(eventsActions.markEventsAsSaving({ UID, isSaving: true }));
            }

            closeProcessingModal(uniqueId, isModal ? 'modal' : 'popover');
            hasClosedModalOrPopover = true;

            const count = isSingleEventUpdate ? 1 : 3;
            notificationId = createNotification({
                text: (
                    <>
                        {c('Info').ngettext(msgid`Saving event`, `Saving events`, count)} <CircleLoader />
                    </>
                ),
                type: 'info',
                expiration: -1, // Keeps the notification visible until manually removed
                showCloseButton: false,
            });

            successNotification = texts;
            hasStartChanged = hasStartChangedProp;

            const [syncResponses, updatePartstatResponses, updatePersonalPartResponses] = await Promise.all([
                // Use of a bang here since we know the value is assigned if hasZoomMeeting is true
                hasZoomMeeting ? (syncRes ?? []) : handleSyncActions(syncActions),
                handleUpdatePartstatActions(updatePartstatActions),
                handleUpdatePersonalPartActions(updatePersonalPartActions),
            ]);

            const calendarsEventsCache = calendarsEventsCacheRef.current;
            if (calendarsEventsCache) {
                upsertUpdateEventPartResponses(
                    updatePartstatActions,
                    updatePartstatResponses,
                    calendarsEventsCache,
                    getOpenedMailEvents
                );
                upsertUpdateEventPartResponses(
                    updatePersonalPartActions,
                    updatePersonalPartResponses,
                    calendarsEventsCache,
                    getOpenedMailEvents
                );
                upsertSyncMultiActionsResponses(syncActions, syncResponses, calendarsEventsCache, getOpenedMailEvents);
            }
            const uniqueCalendarIDs = unique([
                ...syncActions.map(({ calendarID }) => calendarID),
                ...updatePartstatActions.map(({ data: { calendarID } }) => calendarID),
                ...updatePersonalPartActions.map(({ data: { calendarID } }) => calendarID),
            ]);

            await handleUpdateVisibility(uniqueCalendarIDs);
            calendarsEventsCache.rerender?.();

            // call the calendar event managers to trigger an ES IndexedDB sync (needed in case you search immediately for the event changes you just saved)
            void calendarCall(uniqueCalendarIDs);
            if (sendActions.length) {
                // if there is any send action, it's meant to be run after the sync actions above
                await Promise.all(sendActions.map((action) => handleSendIcs(action)));
            }

            const newStartDate = toUTCDate(
                modelToDateProperty(temporaryEvent.tmpData.start, temporaryEvent.tmpData.isAllDay).value
            );

            if (temporaryEvent.tmpOriginalTarget) {
                changeDate(newStartDate, hasStartChanged);
            } else {
                const hasChanged = +newStartDate !== +(isDuplicatingEvent ? temporaryEvent.tmpData.initialDate : date);
                changeDate(newStartDate, hasChanged);
            }

            removeTemporaryEvent(uniqueId);
            if (notificationId) {
                removeNotification(notificationId);
            }
            if (hasZoomMeeting && !syncRes) {
                handleCreateNotification({ success: c('Success').t`Finish Zoom authentication to save event` });
            } else {
                handleCreateNotification(successNotification);
            }
        } catch (e: any) {
            hasThrown = true;
            if (notificationId) {
                removeNotification(notificationId);
            }

            if (e?.cause === VIDEO_CONF_API_ERROR_CODES.MEETING_PROVIDER_ERROR) {
                createNotification({
                    text: c('Error').t`Your Zoom connection has expired. Please reconnect to continue.`,
                    type: 'error',
                });

                return;
            }

            if (e instanceof EscapeTryBlockError) {
                handleCreateNotification(successNotification);
                if (e.recursive) {
                    // we need to escape the outer block
                    throw new EscapeTryBlockError();
                }
                // else we ignore the error as its only purpose is to escape the try block
            } else {
                removeTemporaryEvent(uniqueId);
                // Reset partstat if error detected
                if (isChangePartstat && selfEmail && oldPartstat) {
                    dispatch(eventsActions.updateInvite({ ID, selfEmail, partstat: oldPartstat }));
                }

                if (e.message === NO_CANONICAL_EMAIL_ERROR) {
                    traceError(e, { tags: { calendar: 'error-no-canonical-email' } });
                }

                createNotification({ text: getNonEmptyErrorMessage(e), type: 'error' });
            }
        } finally {
            isSavingEvent.current = false;

            if (isSingleEventUpdate) {
                dispatch(eventsActions.markEventAsSaving({ uniqueId, isSaving: false }));
            } else {
                dispatch(eventsActions.markEventsAsSaving({ UID, isSaving: false }));
            }

            if (!hasClosedModalOrPopover && !hasThrown) {
                closeProcessingModal(uniqueId, isModal ? 'modal' : 'popover');
            }
        }
        stopNESTMetric(isCreatingEvent);
        if (isEditingEvent) {
            stopEALMetric();
        }
    };

    const handleDeleteEvent = async (targetEvent: CalendarViewEvent, inviteActions: InviteActions, isModal = false) => {
        let recurringType: RECURRING_TYPES | undefined;
        let notificationId = 0; // 0 is an invalid notification ID
        let isSingleEventUpdate = true;

        try {
            const {
                syncActions,
                updatePartstatActions = [],
                updatePersonalPartActions = [],
                attendeeDeleteSingleEditActions = [],
                texts,
            } = await getDeleteEventActions({
                targetEvent,
                addresses,
                onDeleteConfirmation: async (params) => {
                    const result = await handleDeleteConfirmation(params);
                    startEALMetric('delete');
                    recurringType = result.type;
                    if (result.type === RECURRING_TYPES.ALL || result.type === RECURRING_TYPES.FUTURE) {
                        isSingleEventUpdate = false;
                    }

                    dispatch(
                        eventsActions.markEventAsDeleting({
                            targetEvent,
                            isDeleting: true,
                            recurringType,
                        })
                    );
                    // Hide the event from the view immediately
                    dispatch(eventsActions.markAsDeleted({ targetEvent, isDeleted: true, recurringType }));

                    closeProcessingModal(targetEvent.uniqueId, isModal ? 'modal' : 'popover');

                    if (isModal) {
                        removeTemporaryEvent(targetEvent.uniqueId);
                    }

                    const count = isSingleEventUpdate ? 1 : 3;
                    notificationId = createNotification({
                        text: (
                            <>
                                {c('Info').ngettext(msgid`Deleting event...`, `Deleting events...`, count)}{' '}
                                <CircleLoader />
                            </>
                        ),
                        type: 'info',
                        expiration: -1, // Keeps the notification visible until manually removed
                        showCloseButton: false,
                    });

                    return result;
                },
                api,
                getEventDecrypted,
                getCalendarBootstrap,
                getAddressKeys,
                getCalendarKeys,
                getCalendarEventRaw,
                inviteActions,
                sendIcs: handleSendIcs,
            });

            // some operations may refer to the events to be deleted, so we execute those first
            const [updatePartstatResponses, updatePersonalPartResponses, attendeeDeleteSingleEditResponses] =
                await Promise.all([
                    handleUpdatePartstatActions(updatePartstatActions),
                    handleUpdatePersonalPartActions(updatePersonalPartActions),
                    handleAttendeeDeleteSingleEditActions(attendeeDeleteSingleEditActions),
                ]);

            const syncResponses = await handleSyncActions(syncActions);
            const calendarsEventCache = calendarsEventsCacheRef.current;
            if (calendarsEventCache) {
                upsertUpdateEventPartResponses(
                    updatePartstatActions,
                    updatePartstatResponses,
                    calendarsEventCache,
                    getOpenedMailEvents
                );
                upsertUpdateEventPartResponses(
                    updatePersonalPartActions,
                    updatePersonalPartResponses,
                    calendarsEventCache,
                    getOpenedMailEvents
                );
                upsertAttendeeDeleteSingleEditResponses(
                    attendeeDeleteSingleEditActions,
                    attendeeDeleteSingleEditResponses,
                    calendarsEventCache,
                    getOpenedMailEvents
                );
                upsertSyncMultiActionsResponses(syncActions, syncResponses, calendarsEventCache, getOpenedMailEvents);
            }
            calendarsEventCache.rerender?.();
            if (notificationId) {
                removeNotification(notificationId);
            }
            handleCreateNotification(texts);

            const uniqueCalendarIDs = unique([
                ...syncActions.map(({ calendarID }) => calendarID),
                ...updatePartstatActions.map(({ data: { calendarID } }) => calendarID),
                ...updatePersonalPartActions.map(({ data: { calendarID } }) => calendarID),
            ]);
            // call the calendar event managers to trigger an ES IndexedDB sync (needed in case you search immediately for the events you just deleted)
            void calendarCall(uniqueCalendarIDs);
        } catch (e: any) {
            if (notificationId) {
                removeNotification(notificationId);
            }
            dispatch(eventsActions.markAsDeleted({ targetEvent, isDeleted: false, recurringType }));
            if (e instanceof EscapeTryBlockError) {
                if (e.recursive) {
                    // we need to escape the outer block
                    throw new EscapeTryBlockError();
                }
                // else we ignore the error as its only purpose is to escape the try block
            } else {
                createNotification({ text: getNonEmptyErrorMessage(e), type: 'error' });
            }
        } finally {
            dispatch(eventsActions.markEventAsDeleting({ targetEvent, isDeleting: false, recurringType }));
        }
        stopEALMetric();
    };

    useImperativeHandle(interactiveRef, () => ({
        createEvent: (attendees, title, location, description) => {
            handleCreateEvent({
                attendees,
                title,
                location,
                description,
            });
        },
    }));

    const targetEvent = useMemo(() => {
        if (searchData) {
            return searchData;
        }
        if (!targetEventData) {
            return;
        }
        return sortedEventsWithTemporary.find(({ uniqueId }) => uniqueId === targetEventData.uniqueId);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-DBB752
    }, [targetEventData, temporaryEvent, sortedEventsWithTemporary, searchData]);

    useEffect(() => {
        // We need to keep a ref of the currently opened event in the popover,
        // so that we can compare currently opened event id with saving event id, and decide whether we need to close the popover or not
        eventInPopoverUniqueIdRef.current = temporaryEvent?.uniqueId || targetEvent?.uniqueId;
    }, [targetEvent, temporaryEvent]);

    const autoCloseRef = useRef<({ ask }: { ask: boolean }) => void>();
    autoCloseRef.current = ({ ask }) => {
        handleConfirmDeleteTemporary({ ask }).then(resetInteractiveData).catch(noop);
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
                (e.target instanceof HTMLElement || e.target instanceof Element) &&
                e.currentTarget instanceof HTMLElement &&
                findUpwards(e.target as HTMLElement, e.currentTarget, (el: HTMLElement) => {
                    return ['BUTTON', 'A', 'SELECT', 'INPUT'].includes(el.nodeName);
                })
            ) {
                autoCloseRef.current?.({ ask: false });
                return;
            }
            autoCloseRef?.current?.({ ask: true });
        };
        containerRef.current?.addEventListener('click', handler);
        document.addEventListener(ADVANCED_SEARCH_OVERLAY_OPEN_EVENT, resetInteractiveData);

        return () => {
            // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-038FEB
            containerRef.current?.removeEventListener('click', handler);
            document.removeEventListener(ADVANCED_SEARCH_OVERLAY_OPEN_EVENT, resetInteractiveData);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-4AD512
    }, [containerRef]);

    const formatDate = useCallback(
        (utcDate: Date) => {
            return format(utcDate, 'PP', { locale: dateLocale });
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-F1D048
        [dateLocale]
    );

    const formatTime = useCallback(
        (utcDate: Date) => {
            return formatShortTime(utcDate, userSettings);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-223356
        [dateLocale, view]
    );

    const [weekdays, weekdaysSingle] = useMemo(() => {
        return ['ccc', 'ccccc'].map((format) => getFormattedWeekdays(format, { locale: dateLocale }));
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-6360A3
    }, [dateLocale]);

    const targetMoreEvents = useMemo(() => {
        const eventsSet = targetMoreData?.events;
        if (!eventsSet) {
            return [];
        }
        // Do this to respect the order in which they were inserted
        const latestEvents = events
            .filter(({ uniqueId }) => eventsSet.has(uniqueId))
            .reduce<{ [key: string]: CalendarViewEvent }>((acc, result) => {
                acc[result.uniqueId] = result;
                return acc;
            }, {});
        return [...eventsSet.keys()].map((eventId) => latestEvents[eventId]).filter(isTruthy);
    }, [targetMoreData?.events, events]);

    const onAddFiles = (files: File[]) => {
        if (!files) {
            return;
        }

        if (!createEventCalendar) {
            return createNotification({
                type: 'error',
                text: c('Error message').t`You need an active personal calendar to import events`,
            });
        }

        updateModal('importModal', {
            isOpen: true,
            props: {
                files,
                initialCalendar: createEventCalendar,
            },
        });
    };

    const getEditedTemporaryEvent = (isDuplication: boolean = false, targetEventOverride?: CalendarViewEvent) => {
        const currentTargetEvent = targetEventOverride ?? targetEvent;

        if (!currentTargetEvent) {
            return null;
        }

        const viewEventData = { ...currentTargetEvent.data };

        const duplicateFromNonWritableCalendarData =
            isDuplication &&
            (getIsCalendarDisabled(viewEventData.calendarData) || !getIsCalendarWritable(viewEventData.calendarData)) &&
            createEventCalendar
                ? { calendar: createEventCalendar }
                : undefined;
        const newTemporaryModel = getUpdateModel({
            viewEventData,
            duplicateFromNonWritableCalendarData,
            shouldDropColor: isDuplication && !hasPaidMail,
        });

        if (!newTemporaryModel) {
            return null;
        }
        return getTemporaryEvent(
            getEditTemporaryEvent(currentTargetEvent, newTemporaryModel, tzid),
            newTemporaryModel,
            tzid
        );
    };

    const preventFetchBusySlots = useBusySlots({
        dateRange,
        temporaryEvent,
        tzid,
        view,
    });

    useCalendarActionsOnLoad({
        create: () => {
            const { title, location: eventLocation, description } = validateDeepLinkParams(searchParams);
            handleCreateEvent({ attendees: [], title, location: eventLocation, description });
        },
        update: async (eventId: string, calendarID: string) => {
            try {
                await openEventInEditMode(eventId, calendarID, {
                    cachedCalendars: calendarsEventsCacheRef.current.calendars,
                    calendars,
                    api,
                    getOpenedMailEvents,
                    getEventDecrypted,
                    handleEditEvent,
                    setEventTargetAction,
                    setInteractiveData,
                    getEditedTemporaryEvent,
                    tzid,
                });
            } catch (error) {
                createNotification({
                    type: 'error',
                    text: c('Error').t`Invalid link to the event`,
                });
            }
        },
        dependencies: {
            activeAddresses,
            cachedCalendars: calendarsEventsCacheRef.current.calendars,
            isEventCreationDisabled: isEventCreationDisabled,
            createEventCalendar,
            createEventCalendarBootstrap,
            hasInteractiveData: !!interactiveData,
        },
    });

    return (
        <>
            {!!importModal.props && (
                <ImportModal
                    {...importModal.props}
                    isOpen={importModal.isOpen}
                    onClose={() => {
                        closeModal('importModal');
                    }}
                    calendars={calendars}
                />
            )}
            {!!sendWithErrorsConfirmationModal.props && (
                <SendWithErrorsConfirmationModal
                    isOpen={sendWithErrorsConfirmationModal.isOpen}
                    {...sendWithErrorsConfirmationModal.props}
                    onClose={() => {
                        closeModal('sendWithErrorsConfirmationModal');
                        confirm.current?.reject(new EscapeTryBlockError(true));
                    }}
                    onConfirm={(props) => {
                        closeModal('sendWithErrorsConfirmationModal');
                        confirm.current?.resolve(props);
                    }}
                />
            )}
            {!!deleteConfirmModal.props && (
                <DeleteConfirmModal
                    isOpen={deleteConfirmModal.isOpen}
                    onClose={() => {
                        confirm.current?.reject(new EscapeTryBlockError(true));
                        closeModal('deleteConfirmModal');
                    }}
                    onConfirm={(data) => {
                        closeModal('deleteConfirmModal');
                        confirm.current?.resolve(data);
                    }}
                    {...deleteConfirmModal.props}
                />
            )}
            {!!deleteRecurringConfirmModal.props && (
                <DeleteRecurringConfirmModal
                    isOpen={deleteRecurringConfirmModal.isOpen}
                    {...deleteRecurringConfirmModal.props}
                    onClose={() => {
                        confirm.current?.reject(new EscapeTryBlockError(true));
                        closeModal('deleteRecurringConfirmModal');
                    }}
                    onConfirm={(data) => {
                        closeModal('deleteRecurringConfirmModal');
                        confirm.current?.resolve(data);
                    }}
                />
            )}
            {!!equivalentAttendeesModal.props && (
                <EquivalentAttendeesModal
                    isOpen={equivalentAttendeesModal.isOpen}
                    {...equivalentAttendeesModal.props}
                    onClose={() => {
                        confirm.current?.reject(new EscapeTryBlockError(true));
                        closeModal('equivalentAttendeesModal');
                    }}
                />
            )}

            <CloseConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => {
                    closeModal('confirmModal');
                    confirm.current?.reject(new EscapeTryBlockError());
                }}
                onSubmit={() => {
                    closeModal('confirmModal');
                    confirm.current?.resolve();
                }}
            />

            {!!editRecurringConfirmModal.props && (
                <EditRecurringConfirmModal
                    isOpen={editRecurringConfirmModal.isOpen}
                    {...editRecurringConfirmModal.props.data}
                    isOrganizer={editRecurringConfirmModal.props.isOrganizer}
                    isAttendee={editRecurringConfirmModal.props.isAttendee}
                    canEditOnlyPersonalPart={editRecurringConfirmModal.props.canEditOnlyPersonalPart}
                    inviteActions={editRecurringConfirmModal.props.inviteActions}
                    onClose={() => {
                        closeModal('editRecurringConfirmModal');
                        confirm.current?.reject(new EscapeTryBlockError(true));
                    }}
                    onConfirm={(data) => {
                        closeModal('editRecurringConfirmModal');
                        confirm.current?.resolve(data);
                    }}
                />
            )}
            {!!editSingleConfirmModal.props && (
                <EditSingleConfirmModal
                    isOpen={editSingleConfirmModal.isOpen}
                    {...editSingleConfirmModal.props}
                    onClose={() => {
                        closeModal('editSingleConfirmModal');
                        confirm.current?.reject(new EscapeTryBlockError(true));
                    }}
                    onConfirm={(data) => {
                        closeModal('editSingleConfirmModal');
                        confirm.current?.resolve(data);
                    }}
                />
            )}
            <Dropzone
                onDrop={onAddFiles}
                disabled={
                    Object.values(modalsMap).some((modal) => modal.isOpen) ||
                    !!targetEvent ||
                    isSearchView ||
                    isBookingActive
                }
                shape="transparent"
                customContent={
                    <section className="main-dropzone p-14 text-center">
                        <img className="main-dropzone-image" src={eventImport} alt="" aria-hidden="true" />
                        <h2 className="main-dropzone-heading h3 text-bold m-0">{c('Title').t`Drop to upload`}</h2>
                        <p className="m-0 color-weak">{c('Info').t`Your events will be encrypted and then saved.`}</p>
                    </section>
                }
                isStatic={true}
            >
                <CalendarView
                    calendars={calendars}
                    calendarsEventsCacheRef={calendarsEventsCacheRef}
                    view={view}
                    isInteractionEnabled={!isLoading}
                    onMouseDown={handleMouseDown}
                    tzid={tzid}
                    primaryTimezone={primaryTimezone}
                    secondaryTimezone={secondaryTimezone}
                    secondaryTimezoneOffset={secondaryTimezoneOffset}
                    targetEventData={targetEventData}
                    setTargetEventRef={setTargetEventElement}
                    setInteractiveData={setInteractiveData}
                    getOpenedMailEvents={getOpenedMailEvents}
                    targetMoreRef={setTargetMoreElement}
                    targetMoreData={targetMoreData}
                    displayWeekNumbers={displayWeekNumbers}
                    displaySecondaryTimezone={displaySecondaryTimezone}
                    now={now}
                    date={date}
                    dateRange={dateRange}
                    events={sortedEventsWithTemporary}
                    onClickDate={onClickDate}
                    onChangeDate={onChangeDate}
                    onClickToday={onClickToday}
                    formatTime={formatTime}
                    formatDate={formatDate}
                    weekdays={weekdays}
                    weekdaysSingle={weekdaysSingle}
                    timeGridViewRef={timeGridViewRef}
                    isScrollDisabled={isScrollDisabled}
                    isDrawerApp={isDrawerApp}
                    onBackFromSearch={onBackFromSearch}
                />
            </Dropzone>
            <Popover
                containerEl={document.body}
                targetEl={targetEventElement}
                isOpen={!!targetEvent}
                once
                when={targetEvent ? targetEvent.start : undefined}
                isCreateEventPopover={!!(targetEvent?.isTemporary && temporaryEvent?.tmpData)}
            >
                {({ style, ref }: PopoverRenderData) => {
                    if (
                        !targetEvent ||
                        targetEventData?.preventPopover ||
                        // Force to close the popover when saving a tmp event (update/create an event)
                        pendingUniqueIds.includes(targetEvent.uniqueId)
                    ) {
                        return null;
                    }

                    if (targetEvent.isTemporary && temporaryEvent?.tmpData) {
                        return (
                            <CreateEventPopover
                                isDraggingDisabled={viewportWidth['<=small'] || isDrawerApp}
                                isCreateEvent={isCreatingEvent}
                                isInvitation={isInvitation}
                                style={style}
                                popoverRef={ref}
                                model={temporaryEvent?.tmpData}
                                addresses={addresses}
                                displayWeekNumbers={!isDrawerApp && displayWeekNumbers}
                                weekStartsOn={weekStartsOn}
                                setModel={handleSetTemporaryEventModel}
                                onSave={async (inviteActions: InviteActions) => {
                                    if (!temporaryEvent) {
                                        return Promise.reject(new Error('Undefined behavior'));
                                    }
                                    try {
                                        await handleSaveEvent({ temporaryEvent, inviteActions });
                                        return;
                                    } catch (error) {
                                        return noop();
                                    }
                                }}
                                onEdit={() => {
                                    if (!temporaryEvent) {
                                        return;
                                    }
                                    handleEditEvent(temporaryEvent);
                                }}
                                onClose={async () => {
                                    try {
                                        await handleConfirmDeleteTemporary({ ask: true });
                                        return resetInteractiveData();
                                    } catch (error) {
                                        return noop();
                                    }
                                }}
                                isDrawerApp={isDrawerApp}
                                view={view}
                                hasZoomError={mustConnectToZoom}
                            />
                        );
                    }
                    return (
                        <EventPopover
                            style={style}
                            popoverRef={ref}
                            event={targetEvent}
                            view={view}
                            tzid={tzid}
                            weekStartsOn={weekStartsOn}
                            displayNameEmailMap={displayNameEmailMap}
                            formatTime={formatTime}
                            onDelete={(inviteActions) => {
                                const decryptedResult = targetEvent?.data?.eventReadResult?.result;
                                if (Array.isArray(decryptedResult) && decryptedResult[0]?.veventComponent) {
                                    const vevent = decryptedResult[0].veventComponent;
                                    const attendee = vevent.attendee?.find((a) => a.parameters?.['x-pm-comment']);
                                    const commentValue = attendee?.parameters?.['x-pm-comment'] ?? '';

                                    (inviteActions.oldPartstatData ??= {} as any).Comment = commentValue;
                                }

                                return (
                                    handleDeleteEvent(targetEvent, inviteActions)
                                        // Also close the more popover to avoid this event showing there
                                        .then(() => closeProcessingModal(targetEvent.uniqueId, 'popover'))
                                        .catch(noop)
                                );
                            }}
                            onEdit={(canDuplicateEvent) => {
                                const newTemporaryEvent = getEditedTemporaryEvent();

                                if (!newTemporaryEvent) {
                                    return;
                                }

                                // Avoid fetching busy slots when editing invite
                                if (!canDuplicateEvent) {
                                    preventFetchBusySlots.current = true;
                                }

                                return handleEditEvent(newTemporaryEvent);
                            }}
                            onRefresh={async () => {
                                // make the loader always spin for one second (same as Mail "update message in folder")
                                const dummySpin = () => wait(SECOND);
                                const { eventData } = targetEvent.data;
                                if (!eventData) {
                                    return dummySpin();
                                }
                                const { CalendarID, ID } = eventData;

                                await Promise.all([
                                    calendarsEventsCacheRef.current.retryReadEvent(CalendarID, ID),
                                    dummySpin(),
                                ]);
                            }}
                            onDuplicate={
                                isEventCreationDisabled
                                    ? undefined
                                    : () => {
                                          const newTemporaryEvent = getEditedTemporaryEvent(true);

                                          if (!newTemporaryEvent) {
                                              return;
                                          }

                                          const { tmpData } = newTemporaryEvent;

                                          if (tmpData.rest['recurrence-id']) {
                                              // when duplicating a single edit, we want to forget the previous recurrence
                                              tmpData.frequencyModel = getInitialFrequencyModel(tmpData.start.date);
                                              delete tmpData.rest['recurrence-id'];
                                          }

                                          delete tmpData.uid;

                                          // Zoom data should be removed when duplicating an event
                                          deleteConferenceData(tmpData);

                                          tmpData.attendees.forEach((attendee) => {
                                              attendee.partstat = ICAL_ATTENDEE_STATUS.NEEDS_ACTION;
                                              // attendee tokens should not be duplicated as the UID has changed
                                              delete attendee.token;
                                          });

                                          handleCreateEvent({
                                              startModel: {
                                                  ...tmpData,
                                                  // This is used to keep track of the original event start
                                                  initialDate: propertyToUTCDate(
                                                      modelToDateProperty(tmpData.start, tmpData.isAllDay)
                                                  ),
                                              },
                                              isDuplicating: true,
                                          });
                                      }
                            }
                            onChangePartstat={async (inviteActions: InviteActions, saveEvent?: boolean) => {
                                const { partstat } = inviteActions;
                                if (!targetEvent || !partstat) {
                                    return;
                                }

                                const newTemporaryModel = getUpdateModel({
                                    viewEventData: targetEvent.data,
                                    partstat,
                                });
                                if (!newTemporaryModel) {
                                    return;
                                }

                                const newTemporaryEvent = getTemporaryEvent(
                                    getEditTemporaryEvent(targetEvent, newTemporaryModel, tzid),
                                    newTemporaryModel,
                                    tzid
                                );

                                if (saveEvent) {
                                    return handleSaveEvent({
                                        temporaryEvent: newTemporaryEvent,
                                        inviteActions,
                                        isDuplicatingEvent: false,
                                        isChangePartstat: true,
                                    });
                                }
                            }}
                            onClose={handleCloseEventPopover}
                            onNavigateToEventFromSearch={(
                                eventData: CalendarEventSharedData,
                                eventComponent: VcalVeventComponent,
                                occurrence?: { localStart: Date; occurrenceNumber: number }
                            ) => {
                                setIsSearching(false);
                                setTargetEventElement(null);
                                setSearchInput('');
                                if (!occurrence) {
                                    return goToEvent(eventData, eventComponent);
                                }
                                return goToOccurrence(eventData, eventComponent, occurrence);
                            }}
                        />
                    );
                }}
            </Popover>
            <Popover containerEl={document.body} targetEl={targetMoreElement} isOpen={!!targetMoreData} once>
                {({ style, ref }: PopoverRenderData) => {
                    if (!targetMoreData) {
                        return null;
                    }
                    return (
                        <MorePopoverEvent
                            tzid={tzid}
                            style={style}
                            popoverRef={ref}
                            now={now}
                            date={targetMoreData.date}
                            events={targetMoreEvents}
                            targetEventRef={setTargetEventElement}
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
                        handleConfirmDeleteTemporary({ ask: true }).then(resetInteractiveData).catch(noop);
                        return false;
                    }
                    return true;
                }}
            />
            {!!temporaryEvent?.tmpData && (
                <CreateEventModal
                    displayWeekNumbers={!isDrawerApp && displayWeekNumbers}
                    weekStartsOn={weekStartsOn}
                    tzid={tzid}
                    model={temporaryEvent?.tmpData}
                    setModel={handleSetTemporaryEventModel}
                    isInvitation={isInvitation}
                    isOpen={createEventModal.isOpen}
                    hasZoomError={mustConnectToZoom}
                    isDuplicating={isDuplicatingEvent}
                    onDisplayBusySlots={() => {
                        if (interactiveData?.temporaryEvent) {
                            switchFromModalToPopover(interactiveData.temporaryEvent);
                        }
                    }}
                    onSave={async (inviteActions: InviteActions) => {
                        if (!temporaryEvent) {
                            return Promise.reject(new Error('Undefined behavior'));
                        }

                        try {
                            await handleSaveEvent({
                                temporaryEvent,
                                inviteActions,
                                isDuplicatingEvent,
                                isChangePartstat: false,
                                isModal: true,
                            });
                        } catch (error) {
                            return noop();
                        }
                    }}
                    onDelete={async (inviteActions) => {
                        if (!temporaryEvent?.data?.eventData || !temporaryEvent.tmpOriginalTarget) {
                            return Promise.reject(new Error('Undefined behavior'));
                        }

                        try {
                            const decryptedResult = temporaryEvent?.tmpOriginalTarget?.data?.eventReadResult?.result;
                            if (Array.isArray(decryptedResult) && decryptedResult[0]?.veventComponent) {
                                const vevent = decryptedResult[0].veventComponent;
                                const attendee = vevent.attendee?.find((a) => a.parameters?.['x-pm-comment']);
                                const commentValue = attendee?.parameters?.['x-pm-comment'] ?? '';

                                (inviteActions.oldPartstatData ??= {} as any).Comment = commentValue;
                            }

                            await handleDeleteEvent(temporaryEvent.tmpOriginalTarget, inviteActions, true);
                        } catch (error) {
                            return noop();
                        }
                    }}
                    onClose={async () => {
                        try {
                            await handleConfirmDeleteTemporary({ ask: true });
                            closeModal('createEventModal');
                            resetInteractiveData();
                        } catch (error) {
                            return noop();
                        }
                    }}
                    isCreateEvent={isCreatingEvent}
                    addresses={addresses}
                    isDrawerApp={isDrawerApp}
                    onExit={() => {
                        if (cancelClosePopoverRef.current) {
                            cancelClosePopoverRef.current = false;
                            return;
                        }
                        closeProcessingModal(temporaryEvent?.uniqueId, 'modal');
                    }}
                    view={view}
                />
            )}
        </>
    );
};

export default InteractiveCalendarView;
