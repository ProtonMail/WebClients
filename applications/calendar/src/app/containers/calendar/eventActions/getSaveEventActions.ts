import { withPmAttendees } from 'proton-shared/lib/calendar/attendees';
import { ICAL_ATTENDEE_STATUS } from 'proton-shared/lib/calendar/constants';
import getMemberAndAddress from 'proton-shared/lib/calendar/integration/getMemberAndAddress';
import { getSelfAttendeeToken } from 'proton-shared/lib/calendar/integration/invite';
import { WeekStartsOn } from 'proton-shared/lib/calendar/interface';
import { noop } from 'proton-shared/lib/helpers/function';
import isDeepEqual from 'proton-shared/lib/helpers/isDeepEqual';
import { omit } from 'proton-shared/lib/helpers/object';
import { Address, Api } from 'proton-shared/lib/interfaces';
import { CalendarBootstrap } from 'proton-shared/lib/interfaces/calendar';
import { VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar/VcalModel';
import withVeventRruleWkst from 'proton-shared/lib/calendar/rruleWkst';
import { getRecurringEventUpdatedText, getSingleEventText } from '../../../components/eventModal/eventForm/i18n';
import { modelToVeventComponent } from '../../../components/eventModal/eventForm/modelToProperties';
import { EventNewData, EventOldData } from '../../../interfaces/EventData';
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
import { INVITE_ACTION_TYPES, InviteActions, NO_INVITE_ACTION } from './inviteActions';
import { getOriginalEvent } from './recurringHelper';
import { withVeventSequence } from './sequence';

const getSaveSingleEventActionsHelper = async ({
    newEditEventData,
    oldEditEventData,
    sendReplyIcs,
    inviteActions = NO_INVITE_ACTION,
}: {
    newEditEventData: EventNewData;
    oldEditEventData: EventOldData;
    sendReplyIcs: (partstat: ICAL_ATTENDEE_STATUS, vevent?: VcalVeventComponent) => Promise<void>;
    inviteActions?: InviteActions;
}) => {
    const { type, partstat } = inviteActions;
    const newVeventWithSequence = withVeventSequence(
        newEditEventData.veventComponent,
        oldEditEventData.mainVeventComponent
    );
    if (type === INVITE_ACTION_TYPES.CHANGE_PARTSTAT) {
        if (!partstat) {
            throw new Error('Cannot update participation status without new answer');
        }
        await sendReplyIcs(partstat, newEditEventData.veventComponent);
    }
    const multiActions = getSaveSingleEventActions({
        newEditEventData: { ...newEditEventData, veventComponent: newVeventWithSequence },
        oldEditEventData,
    });
    const successText = getSingleEventText(oldEditEventData, newEditEventData, inviteActions);
    return {
        syncActions: {
            actions: multiActions,
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
    inviteActions?: InviteActions;
    onSaveConfirmation: OnSaveConfirmationCb;
    api: Api;
    getEventDecrypted: GetDecryptedEventCb;
    getCalendarBootstrap: (CalendarID: string) => CalendarBootstrap;
    sendReplyIcs: (partstat: ICAL_ATTENDEE_STATUS, vevent?: VcalVeventComponent) => Promise<void>;
}

const getSaveEventActions = async ({
    temporaryEvent,
    weekStartsOn,
    addresses,
    inviteActions = NO_INVITE_ACTION,
    onSaveConfirmation,
    api,
    getEventDecrypted,
    getCalendarBootstrap,
    sendReplyIcs,
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
    const { type: inviteType, partstat: invitePartstat } = inviteActions;
    const { isOrganizer } = tmpData;
    const isInvitation = !isOrganizer;

    // All updates will remove any existing exdates since they would be more complicated to normalize
    const modelVeventComponent = modelToVeventComponent(tmpData) as VcalVeventComponent;
    // Do not touch RRULE for invitations
    const veventComponentWithRruleWkst = isInvitation
        ? modelVeventComponent
        : withVeventRruleWkst(omit(modelVeventComponent, ['exdate']), weekStartsOn);
    const newVeventComponent = await withPmAttendees(veventComponentWithRruleWkst, api);

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
        const multiActions = getSaveSingleEventActions({
            newEditEventData: {
                ...newEditEventData,
                veventComponent: newVeventWithSequence,
            },
        });
        const successText = getSingleEventText(undefined, newEditEventData, NO_INVITE_ACTION);
        return {
            syncActions: {
                actions: multiActions,
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
            sendReplyIcs,
            inviteActions,
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
            sendReplyIcs,
            inviteActions,
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

    const updateAllPossibilities = getRecurringUpdateAllPossibilities(
        originalEditEventData.mainVeventComponent,
        oldEditEventData.mainVeventComponent,
        newEditEventData.veventComponent,
        actualEventRecurrence,
        weekStartsOn
    );

    const hasModifiedCalendar = originalEditEventData.calendarID !== newEditEventData.calendarID;
    const hasModifiedRrule =
        tmpData.hasTouchedRrule &&
        !isDeepEqual(originalEditEventData.mainVeventComponent.rrule, newEditEventData.veventComponent.rrule);
    const selfAttendeeToken = getSelfAttendeeToken(newEditEventData.veventComponent, addresses);

    const { type: saveType, inviteActions: updatedInviteActions } = await getRecurringSaveType({
        originalEditEventData,
        oldEditEventData,
        canOnlySaveAll:
            actualEventRecurrence.isSingleOccurrence || hasModifiedCalendar || (isInvitation && !isSingleEdit),
        canOnlySaveThis: isInvitation && isSingleEdit,
        hasModifiedRrule,
        hasModifiedCalendar,
        inviteActions,
        onSaveConfirmation,
        recurrence: actualEventRecurrence,
        recurrences,
        isInvitation,
        selfAttendeeToken,
    });
    if (inviteType === INVITE_ACTION_TYPES.CHANGE_PARTSTAT) {
        if (!invitePartstat) {
            throw new Error('Cannot update participation status without new answer');
        }
        await sendReplyIcs(invitePartstat, newEditEventData.veventComponent);
    }
    const { multiSyncActions, updatePartstatActions } = getSaveRecurringEventActions({
        type: saveType,
        recurrences,
        recurrence: actualEventRecurrence,
        updateAllPossibilities,
        newEditEventData,
        oldEditEventData,
        originalEditEventData,
        hasModifiedRrule,
        inviteActions: updatedInviteActions,
        isInvitation,
        selfAttendeeToken,
    });
    const successText = getRecurringEventUpdatedText(saveType, updatedInviteActions);
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
