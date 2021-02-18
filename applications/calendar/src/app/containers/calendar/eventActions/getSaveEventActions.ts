import { withPmAttendees } from 'proton-shared/lib/calendar/attendees';
import getMemberAndAddress from 'proton-shared/lib/calendar/integration/getMemberAndAddress';
import { getSelfAttendeeToken } from 'proton-shared/lib/calendar/integration/invite';
import { WeekStartsOn } from 'proton-shared/lib/calendar/interface';
import withVeventRruleWkst from 'proton-shared/lib/calendar/rruleWkst';
import { buildVcalOrganizer } from 'proton-shared/lib/calendar/vcalConverter';
import { getHasAttendees } from 'proton-shared/lib/calendar/vcalHelper';
import { noop } from 'proton-shared/lib/helpers/function';
import isDeepEqual from 'proton-shared/lib/helpers/isDeepEqual';
import { omit } from 'proton-shared/lib/helpers/object';
import { Address, Api, GetCanonicalEmails } from 'proton-shared/lib/interfaces';
import { CalendarBootstrap } from 'proton-shared/lib/interfaces/calendar';
import { VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar/VcalModel';
import { getRecurringEventUpdatedText, getSingleEventText } from '../../../components/eventModal/eventForm/i18n';
import { modelToVeventComponent } from '../../../components/eventModal/eventForm/modelToProperties';
import { EventNewData, EventOldData } from '../../../interfaces/EventData';
import { INVITE_ACTION_TYPES, InviteActions, SendIcsActionData } from '../../../interfaces/Invite';
import getEditEventData from '../event/getEditEventData';
import getSingleEditRecurringData from '../event/getSingleEditRecurringData';
import { getIsCalendarEvent } from '../eventStore/cache/helper';
import { GetDecryptedEventCb } from '../eventStore/interface';
import getAllEventsByUID from '../getAllEventsByUID';
import { SyncEventActionOperations } from '../getSyncMultipleEventsPayload';
import { UpdatePartstatOperation } from '../getUpdatePartstatOperation';
import { CalendarViewEventTemporaryEvent, OnSaveConfirmationCb } from '../interface';
import getRecurringSaveType from './getRecurringSaveType';
import getRecurringUpdateAllPossibilities from './getRecurringUpdateAllPossibilities';
import getSaveRecurringEventActions from './getSaveRecurringEventActions';
import getSaveSingleEventActions from './getSaveSingleEventActions';
import { getDuplicateAttendeesSend, getUpdatedSaveInviteActions } from './inviteActions';
import { getOriginalEvent } from './recurringHelper';
import { withVeventSequence } from './sequence';

const getSaveSingleEventActionsHelper = async ({
    newEditEventData,
    oldEditEventData,
    onSaveConfirmation,
    sendIcs,
    inviteActions,
    onDuplicateAttendees,
}: {
    newEditEventData: EventNewData;
    oldEditEventData: EventOldData;
    sendIcs: (
        data: SendIcsActionData
    ) => Promise<{ veventComponent?: VcalVeventComponent; inviteActions: InviteActions }>;
    onSaveConfirmation: OnSaveConfirmationCb;
    inviteActions: InviteActions;
    onDuplicateAttendees: (veventComponent: VcalVeventComponent, inviteActions: InviteActions) => Promise<void>;
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
    const { multiSyncActions, inviteActions: saveInviteActions } = await getSaveSingleEventActions({
        newEditEventData: { ...newEditEventData, veventComponent: newVeventWithSequence },
        oldEditEventData,
        onSaveConfirmation,
        inviteActions: updatedInviteActions,
        sendIcs,
        onDuplicateAttendees,
    });
    const successText = getSingleEventText(oldEditEventData, newEditEventData, saveInviteActions);
    return {
        syncActions: {
            actions: multiSyncActions,
            texts: {
                success: successText,
            },
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
    getCanonicalEmails: GetCanonicalEmails;
    sendIcs: (
        data: SendIcsActionData
    ) => Promise<{ veventComponent?: VcalVeventComponent; inviteActions: InviteActions }>;
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
    getCanonicalEmails,
    sendIcs,
}: Arguments): Promise<{
    syncActions: {
        actions: SyncEventActionOperations[];
        texts: {
            success: string;
        };
    };
    updatePartstatActions?: UpdatePartstatOperation[];
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
    const veventComponentWithRruleWkst = isInvitation
        ? modelVeventComponent
        : withVeventRruleWkst(omit(modelVeventComponent, ['exdate']), weekStartsOn);
    const newVeventComponent = await withPmAttendees(veventComponentWithRruleWkst, getCanonicalEmails);
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
        const newVeventWithSequence = {
            ...newEditEventData.veventComponent,
            sequence: { value: 0 },
        };
        const updatedInviteActions = getUpdatedSaveInviteActions({
            inviteActions: inviteActionsWithSelfAddress,
            newVevent: newVeventWithSequence,
        });
        const { multiSyncActions, inviteActions: saveInviteActions } = await getSaveSingleEventActions({
            newEditEventData: {
                ...newEditEventData,
                veventComponent: newVeventWithSequence,
            },
            selfAddress,
            onSaveConfirmation,
            inviteActions: updatedInviteActions,
            sendIcs,
            onDuplicateAttendees: handleDuplicateAttendees,
        });
        const successText = getSingleEventText(undefined, newEditEventData, saveInviteActions);
        return {
            syncActions: {
                actions: multiSyncActions,
                texts: {
                    success: successText,
                },
            },
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

    const isSingleEdit = !!oldEditEventData.recurrenceID;
    // If it's not an occurrence of a recurring event, or a single edit of a recurring event
    if (!eventRecurrence && !isSingleEdit) {
        return getSaveSingleEventActionsHelper({
            newEditEventData,
            oldEditEventData,
            onSaveConfirmation,
            sendIcs,
            inviteActions: inviteActionsWithSelfAddress,
            onDuplicateAttendees: handleDuplicateAttendees,
        });
    }

    const recurrences = await getAllEventsByUID(api, oldEditEventData.uid, oldEditEventData.calendarID);
    const originalEventData = getOriginalEvent(recurrences);
    const isOrphanSingleEdit = isSingleEdit && !originalEventData;
    // If it's an orphan single edit, treat as a single event
    if (isOrphanSingleEdit) {
        return getSaveSingleEventActionsHelper({
            newEditEventData,
            oldEditEventData,
            onSaveConfirmation,
            sendIcs,
            inviteActions: inviteActionsWithSelfAddress,
            onDuplicateAttendees: handleDuplicateAttendees,
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
        actualEventRecurrence,
        weekStartsOn
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
        inviteActions: saveInviteActions,
    } = await getSaveRecurringEventActions({
        type: saveType,
        recurrences,
        recurrence: actualEventRecurrence,
        updateAllPossibilities,
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
        syncActions: {
            actions: multiSyncActions,
            texts: {
                success: successText,
            },
        },
        updatePartstatActions,
    };
};

export default getSaveEventActions;
