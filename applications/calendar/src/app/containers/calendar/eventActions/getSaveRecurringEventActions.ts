import { getCanonicalEmails } from '@proton/shared/lib/calendar/attendees';
import { ICAL_ATTENDEE_STATUS, ICAL_METHOD, RECURRING_TYPES } from '@proton/shared/lib/calendar/constants';
import { getResetPartstatActions, getUpdatedInviteVevent } from '@proton/shared/lib/calendar/integration/invite';
import { GetCanonicalEmailsMap } from '@proton/shared/lib/interfaces/hooks/GetCanonicalEmailsMap';
import { CalendarEvent, VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar';

import {
    INVITE_ACTION_TYPES,
    InviteActions,
    SendIcsActionData,
    UpdatePartstatOperation,
    UpdatePersonalPartOperation,
} from '../../../interfaces/Invite';
import {
    getCreateSyncOperation,
    getDeleteSyncOperation,
    getUpdateSyncOperation,
    SyncEventActionOperations,
} from '../getSyncMultipleEventsPayload';
import createFutureRecurrence from '../recurrence/createFutureRecurrence';
import createSingleRecurrence from '../recurrence/createSingleRecurrence';
import deleteFutureRecurrence from '../recurrence/deleteFutureRecurrence';
import updateAllRecurrence from '../recurrence/updateAllRecurrence';
import updateSingleRecurrence from '../recurrence/updateSingleRecurrence';
import { withUpdatedDtstamp } from './dtstamp';
import getChangePartstatActions from './getChangePartstatActions';
import { UpdateAllPossibilities } from './getRecurringUpdateAllPossibilities';
import { getUpdatePersonalPartActions } from './getUpdatePersonalPartActions';
import { getCurrentEvent, getRecurrenceEvents, getRecurrenceEventsAfter } from './recurringHelper';
import { withIncreasedSequence, withUpdatedDtstampAndSequence, withVeventSequence } from './sequence';
import { EventNewData, EventOldData } from '../../../interfaces/EventData';
import { CalendarEventRecurring } from '../../../interfaces/CalendarEvents';

interface SaveRecurringArguments {
    type: RECURRING_TYPES;
    recurrences: CalendarEvent[];
    getCanonicalEmailsMap: GetCanonicalEmailsMap;
    originalEditEventData: EventOldData;
    oldEditEventData: EventOldData;
    newEditEventData: EventNewData;
    recurrence: CalendarEventRecurring;
    updateAllPossibilities: UpdateAllPossibilities;
    isInvitation: boolean;
    inviteActions: InviteActions;
    sendIcs: (
        data: SendIcsActionData
    ) => Promise<{ veventComponent?: VcalVeventComponent; inviteActions: InviteActions; timestamp: number }>;
    selfAttendeeToken?: string;
}

const getSaveRecurringEventActions = async ({
    type,
    recurrences,
    getCanonicalEmailsMap,
    oldEditEventData: { eventData: oldEvent, veventComponent: oldVeventComponent },
    originalEditEventData: {
        eventData: originalEvent,
        calendarID: originalCalendarID,
        addressID: originalAddressID,
        memberID: originalMemberID,
        veventComponent: originalVeventComponent,
    },
    newEditEventData: {
        calendarID: newCalendarID,
        addressID: newAddressID,
        memberID: newMemberID,
        veventComponent: newVeventComponent,
    },
    recurrence,
    updateAllPossibilities,
    inviteActions,
    isInvitation,
    sendIcs,
    selfAttendeeToken,
}: SaveRecurringArguments): Promise<{
    multiSyncActions: SyncEventActionOperations[];
    inviteActions: InviteActions;
    updatePartstatActions?: UpdatePartstatOperation[];
    updatePersonalPartActions?: UpdatePersonalPartOperation[];
}> => {
    const { type: inviteType, partstat: invitePartstat } = inviteActions;
    const isSingleEdit = oldEvent.ID !== originalEvent.ID;

    if (!originalVeventComponent) {
        throw new Error('Original component missing');
    }
    if (!oldVeventComponent) {
        throw Error('Old component missing');
    }

    if (type === RECURRING_TYPES.SINGLE) {
        // we need to add the sequence to the old event as well, otherwise the API will complain
        const originalSequence = originalVeventComponent.sequence;
        const originalVeventWithSequence = {
            ...originalVeventComponent,
            sequence: { value: originalSequence ? originalSequence.value : 0 },
        };
        const maybeUpdateParentOperations = !originalSequence
            ? [getUpdateSyncOperation(originalVeventWithSequence, originalEvent)]
            : [];
        if (isSingleEdit) {
            if (inviteType === INVITE_ACTION_TYPES.CHANGE_PARTSTAT) {
                // the attendee changes answer
                // the sequence is not affected by simply updating the partstast
                return getChangePartstatActions({
                    inviteActions,
                    eventComponent: newVeventComponent,
                    event: oldEvent,
                    memberID: newMemberID,
                    addressID: newAddressID,
                    sendIcs,
                });
            }
            if (!oldEvent.IsOrganizer) {
                // the attendee edits notifications. We must do it through the updatePartstat route
                return getUpdatePersonalPartActions({
                    eventComponent: newVeventComponent,
                    event: oldEvent,
                    memberID: newMemberID,
                    addressID: newAddressID,
                    inviteActions,
                });
            }

            // the sequence of the child must not be smaller than that of the parent
            // we could see such scenarios on production in chains where the parent was updated, but not all of its children
            const safeOldSequenceValue = Math.max(
                originalVeventWithSequence.sequence.value,
                oldVeventComponent?.sequence?.value || 0
            );
            const oldVeventWithSafeSequence = {
                ...oldVeventComponent,
                sequence: { value: safeOldSequenceValue },
            };
            const oldVeventWithSequence = oldVeventComponent.sequence
                ? oldVeventWithSafeSequence
                : withVeventSequence(oldVeventComponent, getCurrentEvent(originalVeventWithSequence, recurrence));
            const newVeventWithSequence = withUpdatedDtstampAndSequence(
                updateSingleRecurrence(newVeventComponent),
                oldVeventWithSequence
            );
            const removedAttendeeEmails = await getCanonicalEmails(
                inviteActions.removedAttendees,
                getCanonicalEmailsMap
            );
            const updateOperation = getUpdateSyncOperation(newVeventWithSequence, oldEvent, removedAttendeeEmails);

            return {
                multiSyncActions: [
                    {
                        calendarID: originalCalendarID,
                        addressID: originalAddressID,
                        memberID: originalMemberID,
                        operations: [...maybeUpdateParentOperations, updateOperation],
                    },
                ],
                inviteActions,
            };
        }

        const oldRecurrenceVeventComponent = getCurrentEvent(originalVeventWithSequence, recurrence);
        const newRecurrenceVeventComponent = createSingleRecurrence(
            newVeventComponent,
            originalVeventComponent,
            recurrence.localStart
        );
        const createOperation = getCreateSyncOperation(
            withUpdatedDtstampAndSequence(newRecurrenceVeventComponent, oldRecurrenceVeventComponent)
        );

        return {
            multiSyncActions: [
                {
                    calendarID: originalCalendarID,
                    addressID: originalAddressID,
                    memberID: originalMemberID,
                    operations: [...maybeUpdateParentOperations, createOperation],
                },
            ],
            inviteActions,
        };
    }

    if (type === RECURRING_TYPES.FUTURE) {
        const newVeventWithSequence = withUpdatedDtstamp({
            ...newVeventComponent,
            sequence: { value: 0 },
        });
        const originalVeventWithSequence = withUpdatedDtstamp(withIncreasedSequence(originalVeventComponent));
        // Any single edits in the recurrence chain.
        const singleEditRecurrences = getRecurrenceEvents(recurrences, originalEvent);

        // Any single edits after the date in the recurrence chain.
        const singleEditRecurrencesAfter = getRecurrenceEventsAfter(singleEditRecurrences, recurrence.localStart);

        // These occurrences have to be deleted, even if the time was not changed, because a new chain with a new UID is created
        // So potentially instead of deleting, we could update all the events to be linked to the new UID but this is easier
        const deleteOperations = singleEditRecurrencesAfter.map(getDeleteSyncOperation);
        const updateOperation = getUpdateSyncOperation(
            deleteFutureRecurrence(originalVeventWithSequence, recurrence.localStart, recurrence.occurrenceNumber),
            originalEvent
        );
        const createOperation = getCreateSyncOperation(
            createFutureRecurrence(newVeventWithSequence, originalVeventWithSequence, recurrence)
        );

        return {
            multiSyncActions: [
                {
                    calendarID: originalCalendarID,
                    addressID: originalAddressID,
                    memberID: originalMemberID,
                    operations: [...deleteOperations, updateOperation, createOperation],
                },
            ],
            inviteActions,
        };
    }

    if (type === RECURRING_TYPES.ALL) {
        const isSwitchCalendar = originalCalendarID !== newCalendarID;
        // Any single edits in the recurrence chain.
        const singleEditRecurrences = getRecurrenceEvents(recurrences, originalEvent);
        // For an invitation, we do not want to delete single edits as we want to keep in sync with the organizer's event
        const deleteOperations = isInvitation ? [] : singleEditRecurrences.map(getDeleteSyncOperation);
        if (selfAttendeeToken && invitePartstat) {
            // the attendee changes answer
            const { updatePartstatActions, updatePersonalPartActions } = await getChangePartstatActions({
                inviteActions,
                eventComponent: newVeventComponent,
                event: oldEvent,
                memberID: newMemberID,
                addressID: newAddressID,
                sendIcs,
            });
            const { updatePartstatActions: resetPartstatActions, updatePersonalPartActions: dropAlarmsActions } =
                getResetPartstatActions(singleEditRecurrences, selfAttendeeToken, invitePartstat);
            updatePartstatActions.push(
                ...resetPartstatActions.map(({ calendarID, eventID, updateTime, attendeeID }) => {
                    return {
                        data: {
                            memberID: newMemberID,
                            calendarID,
                            eventID,
                            updateTime,
                            attendeeID,
                            partstat: ICAL_ATTENDEE_STATUS.NEEDS_ACTION,
                        },
                    };
                })
            );
            updatePersonalPartActions.push(
                ...dropAlarmsActions.map(({ calendarID, eventID }) => {
                    return { data: { memberID: newMemberID, calendarID, eventID } };
                })
            );
            return {
                inviteActions,
                multiSyncActions: [],
                updatePartstatActions,
                updatePersonalPartActions,
            };
        }
        if (!oldEvent.IsOrganizer && !isSwitchCalendar) {
            // the attendee edits notifications. We must do it through the updatePartstat route
            return getUpdatePersonalPartActions({
                eventComponent: newVeventComponent,
                event: oldEvent,
                memberID: newMemberID,
                addressID: newAddressID,
                inviteActions,
            });
        }
        const newRecurrentVevent = updateAllRecurrence({
            component: newVeventComponent,
            originalComponent: originalVeventComponent,
            mode: updateAllPossibilities,
            isSingleEdit,
            isInvitation,
        });
        const newRecurrentVeventWithSequence = withUpdatedDtstampAndSequence(
            newRecurrentVevent,
            originalVeventComponent
        );
        const isSendInviteType = [INVITE_ACTION_TYPES.SEND_INVITATION, INVITE_ACTION_TYPES.SEND_UPDATE].includes(
            inviteActions.type
        );

        const method = isSendInviteType ? ICAL_METHOD.REQUEST : undefined;
        let updatedVeventComponent = getUpdatedInviteVevent(
            newRecurrentVeventWithSequence,
            originalVeventComponent,
            method
        );
        let updatedInviteActions = inviteActions;
        if (isSendInviteType) {
            if (isSwitchCalendar) {
                // Temporary hotfix to an API issue
                throw new Error(
                    'Cannot add participants and change calendar simultaneously. Please change the calendar first'
                );
            }
            const { veventComponent: cleanVeventComponent, inviteActions: cleanInviteActions } = await sendIcs({
                inviteActions,
                vevent: updatedVeventComponent,
                cancelVevent: originalVeventComponent,
            });
            if (cleanVeventComponent) {
                updatedVeventComponent = cleanVeventComponent;
                updatedInviteActions = cleanInviteActions;
            }
        }
        const removedAttendeeEmails = await getCanonicalEmails(
            updatedInviteActions.removedAttendees,
            getCanonicalEmailsMap
        );
        const updateOperation = getUpdateSyncOperation(updatedVeventComponent, originalEvent, removedAttendeeEmails);

        if (isSwitchCalendar) {
            const deleteOriginalOperation = getDeleteSyncOperation(originalEvent);
            return {
                multiSyncActions: [
                    {
                        calendarID: newCalendarID,
                        addressID: newAddressID,
                        memberID: newMemberID,
                        operations: [updateOperation],
                    },
                    {
                        calendarID: originalCalendarID,
                        addressID: originalAddressID,
                        memberID: originalMemberID,
                        operations: [...deleteOperations, deleteOriginalOperation],
                    },
                ],
                inviteActions: updatedInviteActions,
            };
        }

        return {
            multiSyncActions: [
                {
                    calendarID: newCalendarID,
                    addressID: newAddressID,
                    memberID: newMemberID,
                    operations: isInvitation ? [updateOperation] : [...deleteOperations, updateOperation],
                },
            ],
            inviteActions: updatedInviteActions,
        };
    }

    throw new Error('Unknown type');
};

export default getSaveRecurringEventActions;
