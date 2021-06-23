import { withPmAttendees } from 'proton-shared/lib/calendar/attendees';
import getMemberAndAddress from 'proton-shared/lib/calendar/integration/getMemberAndAddress';
import { getSelfAttendeeToken } from 'proton-shared/lib/calendar/integration/invite';
import { WeekStartsOn } from 'proton-shared/lib/date-fns-utc/interface';
import { getIsRruleEqual } from 'proton-shared/lib/calendar/rruleEqual';
import withVeventRruleWkst from 'proton-shared/lib/calendar/rruleWkst';
import { buildVcalOrganizer, dayToNumericDay } from 'proton-shared/lib/calendar/vcalConverter';
import { getHasAttendees } from 'proton-shared/lib/calendar/vcalHelper';
import { noop } from 'proton-shared/lib/helpers/function';
import isDeepEqual from 'proton-shared/lib/helpers/isDeepEqual';
import { omit } from 'proton-shared/lib/helpers/object';
import { Address, Api } from 'proton-shared/lib/interfaces';
import { CalendarBootstrap, SyncMultipleApiResponse, VcalDays } from 'proton-shared/lib/interfaces/calendar';
import { VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar/VcalModel';
import { GetCanonicalEmailsMap } from 'proton-shared/lib/interfaces/hooks/GetCanonicalEmailsMap';
import { useGetCalendarKeys } from 'react-components/hooks/useGetDecryptedPassphraseAndCalendarKeys';
import { getRecurringEventUpdatedText, getSingleEventText } from '../../../components/eventModal/eventForm/i18n';
import { modelToVeventComponent } from '../../../components/eventModal/eventForm/modelToProperties';
import {
    CleanSendIcsActionData,
    INVITE_ACTION_TYPES,
    InviteActions,
    SendIcsActionData,
    UpdatePartstatOperation,
    UpdatePersonalPartOperation,
} from '../../../interfaces/Invite';
import getEditEventData from '../event/getEditEventData';
import { getSharedEventIDAndSessionKey } from '../event/getEventHelper';
import getSingleEditRecurringData from '../event/getSingleEditRecurringData';
import { getIsCalendarEvent } from '../eventStore/cache/helper';
import { GetDecryptedEventCb } from '../eventStore/interface';
import getAllEventsByUID from '../getAllEventsByUID';
import { SyncEventActionOperations } from '../getSyncMultipleEventsPayload';
import { CalendarViewEventTemporaryEvent, OnSaveConfirmationCb } from '../interface';
import getRecurringSaveType from './getRecurringSaveType';
import getRecurringUpdateAllPossibilities from './getRecurringUpdateAllPossibilities';
import getSaveRecurringEventActions from './getSaveRecurringEventActions';
import getSaveSingleEventActions from './getSaveSingleEventActions';
import { getDuplicateAttendeesSend, getUpdatedSaveInviteActions } from './inviteActions';
import { getOriginalEvent } from './recurringHelper';
import { withVeventSequence } from './sequence';
import { EventNewData, EventOldData } from '../../../interfaces/EventData';

const getSaveSingleEventActionsHelper = async ({
    newEditEventData,
    oldEditEventData,
    getCalendarKeys,
    getCanonicalEmailsMap,
    onSaveConfirmation,
    sendIcs,
    onSendPrefsErrors,
    inviteActions,
    onDuplicateAttendees,
    handleSyncActions,
}: {
    newEditEventData: EventNewData;
    oldEditEventData: EventOldData;
    getCalendarKeys: ReturnType<typeof useGetCalendarKeys>;
    getCanonicalEmailsMap: GetCanonicalEmailsMap;
    sendIcs: (
        data: SendIcsActionData
    ) => Promise<{ veventComponent?: VcalVeventComponent; inviteActions: InviteActions; timestamp: number }>;
    onSendPrefsErrors: (data: SendIcsActionData) => Promise<CleanSendIcsActionData>;
    onSaveConfirmation: OnSaveConfirmationCb;
    onDuplicateAttendees: (veventComponent: VcalVeventComponent, inviteActions: InviteActions) => Promise<void>;
    inviteActions: InviteActions;
    handleSyncActions: (actions: SyncEventActionOperations[]) => Promise<SyncMultipleApiResponse[]>;
}) => {
    if (!oldEditEventData.veventComponent) {
        throw new Error('Cannot update event without old data');
    }
    const newVeventWithSequence = withVeventSequence(
        newEditEventData.veventComponent,
        oldEditEventData.veventComponent
    );
    const updatedInviteActions = getUpdatedSaveInviteActions({
        inviteActions,
        newVevent: newVeventWithSequence,
        oldVevent: oldEditEventData.veventComponent,
    });
    const {
        multiSyncActions,
        updatePartstatActions,
        updatePersonalPartActions,
        inviteActions: saveInviteActions,
    } = await getSaveSingleEventActions({
        newEditEventData: { ...newEditEventData, veventComponent: newVeventWithSequence },
        oldEditEventData,
        getCalendarKeys,
        getCanonicalEmailsMap,
        onSaveConfirmation,
        inviteActions: updatedInviteActions,
        sendIcs,
        onSendPrefsErrors,
        onDuplicateAttendees,
        handleSyncActions,
    });
    const successText = getSingleEventText(oldEditEventData, newEditEventData, saveInviteActions);
    return {
        syncActions: multiSyncActions,
        updatePartstatActions,
        updatePersonalPartActions,
        texts: {
            success: successText,
        },
    };
};

interface Arguments {
    temporaryEvent: CalendarViewEventTemporaryEvent;
    weekStartsOn: WeekStartsOn;
    addresses: Address[];
    inviteActions: InviteActions;
    onSaveConfirmation: OnSaveConfirmationCb;
    onDuplicateAttendees: (attendees: string[][]) => Promise<void>;
    api: Api;
    getEventDecrypted: GetDecryptedEventCb;
    getCalendarBootstrap: (CalendarID: string) => CalendarBootstrap;
    getCalendarKeys: ReturnType<typeof useGetCalendarKeys>;
    getCanonicalEmailsMap: GetCanonicalEmailsMap;
    sendIcs: (
        data: SendIcsActionData
    ) => Promise<{ veventComponent?: VcalVeventComponent; inviteActions: InviteActions; timestamp: number }>;
    onSendPrefsErrors: (data: SendIcsActionData) => Promise<CleanSendIcsActionData>;
    handleSyncActions: (actions: SyncEventActionOperations[]) => Promise<SyncMultipleApiResponse[]>;
}

const getSaveEventActions = async ({
    temporaryEvent,
    weekStartsOn,
    addresses,
    inviteActions,
    onSaveConfirmation,
    onDuplicateAttendees,
    api,
    getEventDecrypted,
    getCalendarBootstrap,
    getCalendarKeys,
    getCanonicalEmailsMap,
    sendIcs,
    onSendPrefsErrors,
    handleSyncActions,
}: Arguments): Promise<{
    syncActions: SyncEventActionOperations[];
    updatePartstatActions?: UpdatePartstatOperation[];
    updatePersonalPartActions?: UpdatePersonalPartOperation[];
    texts?: { success: string };
}> => {
    const {
        tmpOriginalTarget: { data: { eventData: oldEventData, eventRecurrence, eventReadResult } } = { data: {} },
        tmpData,
        tmpData: {
            calendar: { id: newCalendarID },
            member: { memberID: newMemberID, addressID: newAddressID },
        },
    } = temporaryEvent;
    const { isOrganizer } = tmpData;
    const isInvitation = !isOrganizer;
    const selfAddress = addresses.find(({ ID }) => ID === newAddressID);
    if (!selfAddress) {
        throw new Error('Wrong member data');
    }

    // All updates will remove any existing exdates since they would be more complicated to normalize
    const modelVeventComponent = modelToVeventComponent(tmpData) as VcalVeventComponent;
    // In case the event has attendees but no organizer, add it here
    if (!modelVeventComponent.organizer && modelVeventComponent.attendee?.length) {
        const organizerEmail = selfAddress?.Email;
        if (!organizerEmail) {
            throw new Error('Missing organizer');
        }
        modelVeventComponent.organizer = buildVcalOrganizer(organizerEmail, organizerEmail);
    }
    // Also add selfAddress to inviteActions if it doesn't have one
    const inviteActionsWithSelfAddress = { ...inviteActions };
    if (!inviteActions.selfAddress) {
        inviteActionsWithSelfAddress.selfAddress = selfAddress;
    }
    // Do not touch RRULE for invitations
    const newVeventComponent = await withPmAttendees(modelVeventComponent, getCanonicalEmailsMap);
    const handleDuplicateAttendees = async (vevent: VcalVeventComponent, inviteActions: InviteActions) => {
        const duplicateAttendees = getDuplicateAttendeesSend(vevent, inviteActions);
        if (duplicateAttendees) {
            await onDuplicateAttendees(duplicateAttendees);
        }
    };

    const newEditEventData = {
        veventComponent: newVeventComponent,
        calendarID: newCalendarID,
        memberID: newMemberID,
        addressID: newAddressID,
    };

    // Creation
    if (!oldEventData) {
        // add sequence and WKST (if needed)
        const newVeventWithSequence = {
            ...withVeventRruleWkst(omit(newVeventComponent, ['exdate']), weekStartsOn),
            sequence: { value: 0 },
        };
        const updatedInviteActions = getUpdatedSaveInviteActions({
            inviteActions: inviteActionsWithSelfAddress,
            newVevent: newVeventWithSequence,
        });

        const { multiSyncActions = [], inviteActions: saveInviteActions } = await getSaveSingleEventActions({
            newEditEventData: {
                ...newEditEventData,
                veventComponent: newVeventWithSequence,
            },
            selfAddress,
            inviteActions: updatedInviteActions,
            getCalendarKeys,
            getCanonicalEmailsMap,
            onSaveConfirmation,
            sendIcs,
            onDuplicateAttendees: handleDuplicateAttendees,
            onSendPrefsErrors,
            handleSyncActions,
        });
        const successText = getSingleEventText(undefined, newEditEventData, saveInviteActions);
        return {
            syncActions: multiSyncActions,
            texts: { success: successText },
        };
    }

    const calendarBootstrap = getCalendarBootstrap(oldEventData.CalendarID);
    if (!calendarBootstrap) {
        throw new Error('Trying to update event without a calendar');
    }
    if (!getIsCalendarEvent(oldEventData) || !eventReadResult?.result) {
        throw new Error('Trying to edit event without event information');
    }

    const oldEditEventData = getEditEventData({
        eventData: oldEventData,
        eventResult: eventReadResult.result,
        memberResult: getMemberAndAddress(addresses, calendarBootstrap.Members, oldEventData.Author),
    });
    const { sharedEventID, sharedSessionKey } = await getSharedEventIDAndSessionKey({
        calendarEvent: oldEventData,
        getCalendarKeys,
    });
    if (sharedEventID && sharedSessionKey) {
        inviteActionsWithSelfAddress.sharedEventID = sharedEventID;
        inviteActionsWithSelfAddress.sharedSessionKey = sharedSessionKey;
    }

    // WKST should be preserved unless the user edited the RRULE explicitly. Otherwise, add it here (if needed)
    const oldWkstDay = dayToNumericDay(oldEditEventData.veventComponent?.rrule?.value.wkst || 'MO');
    const oldWkst = oldWkstDay === undefined ? VcalDays.MO : oldWkstDay;
    const newWkst = getIsRruleEqual(oldEditEventData.veventComponent?.rrule, newVeventComponent.rrule, true)
        ? oldWkst
        : weekStartsOn;
    newEditEventData.veventComponent = withVeventRruleWkst(omit(newVeventComponent, ['exdate']), newWkst);

    const isSingleEdit = !!oldEditEventData.recurrenceID;
    // If it's not an occurrence of a recurring event, or a single edit of a recurring event
    if (!eventRecurrence && !isSingleEdit) {
        return getSaveSingleEventActionsHelper({
            newEditEventData,
            oldEditEventData,
            getCalendarKeys,
            getCanonicalEmailsMap,
            onSaveConfirmation,
            sendIcs,
            inviteActions: inviteActionsWithSelfAddress,
            onDuplicateAttendees: handleDuplicateAttendees,
            onSendPrefsErrors,
            handleSyncActions,
        });
    }

    const recurrences = await getAllEventsByUID(api, oldEditEventData.calendarID, oldEditEventData.uid);
    const originalEventData = getOriginalEvent(recurrences);
    const isOrphanSingleEdit = isSingleEdit && !originalEventData;
    // If it's an orphan single edit, treat as a single event
    if (isOrphanSingleEdit) {
        return getSaveSingleEventActionsHelper({
            newEditEventData,
            oldEditEventData,
            getCalendarKeys,
            getCanonicalEmailsMap,
            onSaveConfirmation,
            sendIcs,
            inviteActions: inviteActionsWithSelfAddress,
            onDuplicateAttendees: handleDuplicateAttendees,
            onSendPrefsErrors,
            handleSyncActions,
        });
    }

    const originalEventResult = originalEventData ? await getEventDecrypted(originalEventData).catch(noop) : undefined;
    if (!originalEventData || !originalEventResult?.[0]) {
        throw new Error('Original event not found');
    }

    const originalEditEventData = getEditEventData({
        eventData: originalEventData,
        eventResult: originalEventResult,
        memberResult: getMemberAndAddress(addresses, calendarBootstrap.Members, originalEventData.Author),
    });

    const actualEventRecurrence =
        eventRecurrence ||
        getSingleEditRecurringData(originalEditEventData.mainVeventComponent, oldEditEventData.mainVeventComponent);

    const { updateAllPossibilities, hasModifiedDateTimes } = getRecurringUpdateAllPossibilities(
        originalEditEventData.mainVeventComponent,
        oldEditEventData.mainVeventComponent,
        newEditEventData.veventComponent,
        actualEventRecurrence
    );

    const selfAttendeeToken = getSelfAttendeeToken(newEditEventData.veventComponent, addresses);
    const hasModifiedCalendar = originalEditEventData.calendarID !== newEditEventData.calendarID;
    // check if the rrule has been explicitly modified. Modifications due to WKST change are ignored here
    const hasModifiedRrule =
        tmpData.hasTouchedRrule &&
        !isDeepEqual(originalEditEventData.mainVeventComponent.rrule, newEditEventData.veventComponent.rrule);
    const updatedSaveInviteActions = getUpdatedSaveInviteActions({
        inviteActions: inviteActionsWithSelfAddress,
        newVevent: newEditEventData.veventComponent,
        oldVevent: originalEditEventData.veventComponent,
        hasModifiedDateTimes,
    });
    const isSendInviteType = [INVITE_ACTION_TYPES.SEND_INVITATION, INVITE_ACTION_TYPES.SEND_UPDATE].includes(
        updatedSaveInviteActions.type
    );
    await handleDuplicateAttendees(newEditEventData.veventComponent, updatedSaveInviteActions);
    const hasAttendees = getHasAttendees(newEditEventData.veventComponent);

    const { type: saveType, inviteActions: updatedInviteActions } = await getRecurringSaveType({
        originalEditEventData,
        oldEditEventData,
        canOnlySaveAll:
            actualEventRecurrence.isSingleOccurrence ||
            hasModifiedCalendar ||
            (isInvitation && !isSingleEdit) ||
            (!isInvitation && (isSendInviteType || hasAttendees)),
        canOnlySaveThis: isInvitation && isSingleEdit,
        hasModifiedRrule,
        hasModifiedCalendar,
        inviteActions: updatedSaveInviteActions,
        onSaveConfirmation,
        recurrence: actualEventRecurrence,
        recurrences,
        isInvitation,
        selfAttendeeToken,
    });
    const {
        multiSyncActions,
        updatePartstatActions,
        updatePersonalPartActions,
        inviteActions: saveInviteActions,
    } = await getSaveRecurringEventActions({
        type: saveType,
        recurrences,
        recurrence: actualEventRecurrence,
        updateAllPossibilities,
        getCanonicalEmailsMap,
        newEditEventData,
        oldEditEventData,
        originalEditEventData,
        inviteActions: updatedInviteActions,
        isInvitation,
        sendIcs,
        selfAttendeeToken,
    });
    const successText = getRecurringEventUpdatedText(saveType, saveInviteActions);

    return {
        syncActions: multiSyncActions,
        updatePartstatActions,
        updatePersonalPartActions,
        texts: { success: successText },
    };
};

export default getSaveEventActions;
