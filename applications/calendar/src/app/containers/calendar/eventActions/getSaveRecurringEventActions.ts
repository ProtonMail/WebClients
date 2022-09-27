import { PublicKeyReference } from '@proton/crypto';
import { getAttendeeEmail } from '@proton/shared/lib/calendar/attendees';
import { ICAL_ATTENDEE_STATUS, ICAL_METHOD, RECURRING_TYPES } from '@proton/shared/lib/calendar/constants';
import { getResetPartstatActions, getUpdatedInviteVevent } from '@proton/shared/lib/calendar/integration/invite';
import { getHasStartChanged } from '@proton/shared/lib/calendar/vcalConverter';
import { withDtstamp } from '@proton/shared/lib/calendar/veventHelper';
import { omit } from '@proton/shared/lib/helpers/object';
import { SimpleMap } from '@proton/shared/lib/interfaces';
import { CalendarEvent, VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar';
import { SendPreferences } from '@proton/shared/lib/interfaces/mail/crypto';
import unary from '@proton/utils/unary';

import { CalendarEventRecurring } from '../../../interfaces/CalendarEvents';
import { EventNewData, EventOldData } from '../../../interfaces/EventData';
import {
    INVITE_ACTION_TYPES,
    InviteActions,
    ReencryptInviteActionData,
    SendIcsActionData,
    UpdatePartstatOperation,
    UpdatePersonalPartOperation,
} from '../../../interfaces/Invite';
import {
    SyncEventActionOperations,
    getCreateSyncOperation,
    getDeleteSyncOperation,
    getUpdateSyncOperation,
} from '../getSyncMultipleEventsPayload';
import createFutureRecurrence from '../recurrence/createFutureRecurrence';
import createSingleRecurrence from '../recurrence/createSingleRecurrence';
import deleteFutureRecurrence from '../recurrence/deleteFutureRecurrence';
import updateAllRecurrence from '../recurrence/updateAllRecurrence';
import updateSingleRecurrence from '../recurrence/updateSingleRecurrence';
import getChangePartstatActions from './getChangePartstatActions';
import { UpdateAllPossibilities } from './getRecurringUpdateAllPossibilities';
import { getUpdatePersonalPartActions } from './getUpdatePersonalPartActions';
import { getAddedAttendeesPublicKeysMap } from './inviteActions';
import { getCurrentEvent, getRecurrenceEvents, getRecurrenceEventsAfter } from './recurringHelper';
import { withIncrementedSequence, withUpdatedDtstampAndSequence, withVeventSequence } from './sequence';

interface SaveRecurringArguments {
    type: RECURRING_TYPES;
    recurrences: CalendarEvent[];
    originalEditEventData: EventOldData;
    oldEditEventData: EventOldData;
    newEditEventData: EventNewData;
    recurrence: CalendarEventRecurring;
    updateAllPossibilities: UpdateAllPossibilities;
    isAttendee: boolean;
    inviteActions: InviteActions;
    sendIcs: (data: SendIcsActionData) => Promise<{
        veventComponent?: VcalVeventComponent;
        inviteActions: InviteActions;
        timestamp: number;
        sendPreferencesMap: SimpleMap<SendPreferences>;
    }>;
    reencryptSharedEvent: (data: ReencryptInviteActionData) => Promise<void>;
    selfAttendeeToken?: string;
}

const getSaveRecurringEventActions = async ({
    type,
    recurrences,
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
    isAttendee,
    sendIcs,
    reencryptSharedEvent,
    selfAttendeeToken,
}: SaveRecurringArguments): Promise<{
    multiSyncActions: SyncEventActionOperations[];
    inviteActions: InviteActions;
    updatePartstatActions?: UpdatePartstatOperation[];
    updatePersonalPartActions?: UpdatePersonalPartOperation[];
    sendActions?: SendIcsActionData[];
    hasStartChanged?: boolean;
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
            ? [
                  getUpdateSyncOperation({
                      veventComponent: originalVeventWithSequence,
                      calendarEvent: originalEvent,
                      isAttendee,
                  }),
              ]
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
                    reencryptionCalendarID: oldEvent.AddressKeyPacket && oldEvent.AddressID ? newCalendarID : undefined,
                    sendIcs,
                    reencryptSharedEvent,
                });
            }
            if (!oldEvent.IsOrganizer) {
                // the attendee edits notifications. We must do it through the updatePersonalPart route
                return getUpdatePersonalPartActions({
                    eventComponent: newVeventComponent,
                    event: oldEvent,
                    memberID: newMemberID,
                    addressID: newAddressID,
                    reencryptionCalendarID: oldEvent.AddressKeyPacket && oldEvent.AddressID ? newCalendarID : undefined,
                    inviteActions,
                    reencryptSharedEvent,
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
            const hasStartChanged = getHasStartChanged(newVeventWithSequence, oldVeventWithSequence);
            const updateOperation = getUpdateSyncOperation({
                veventComponent: newVeventWithSequence,
                calendarEvent: oldEvent,
                isAttendee,
            });

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
                hasStartChanged,
            };
        }

        const oldRecurrenceVeventComponent = getCurrentEvent(originalVeventWithSequence, recurrence);
        const newRecurrenceVeventComponent = createSingleRecurrence(
            newVeventComponent,
            originalVeventComponent,
            recurrence.localStart
        );
        const hasStartChanged = getHasStartChanged(newRecurrenceVeventComponent, oldRecurrenceVeventComponent);
        const createOperation = getCreateSyncOperation({
            veventComponent: withUpdatedDtstampAndSequence(newRecurrenceVeventComponent, oldRecurrenceVeventComponent),
        });

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
            hasStartChanged,
        };
    }

    if (type === RECURRING_TYPES.FUTURE) {
        const newVeventWithSequence = withDtstamp(
            omit(
                {
                    ...newVeventComponent,
                    sequence: { value: 0 },
                },
                ['dtstamp']
            )
        );
        const originalVeventWithSequence = withDtstamp(
            omit(withIncrementedSequence(originalVeventComponent), ['dtstamp'])
        );
        // Any single edits in the recurrence chain.
        const singleEditRecurrences = getRecurrenceEvents(recurrences, originalEvent);

        // Any single edits after the date in the recurrence chain.
        const singleEditRecurrencesAfter = getRecurrenceEventsAfter(singleEditRecurrences, recurrence.localStart);

        // These occurrences have to be deleted, even if the time was not changed, because a new chain with a new UID is created
        // So potentially instead of deleting, we could update all the events to be linked to the new UID but this is easier
        const deleteOperations = singleEditRecurrencesAfter.map(unary(getDeleteSyncOperation));
        const updateOperation = getUpdateSyncOperation({
            veventComponent: deleteFutureRecurrence(
                originalVeventWithSequence,
                recurrence.localStart,
                recurrence.occurrenceNumber
            ),
            calendarEvent: originalEvent,
            isAttendee,
        });
        const createOperation = getCreateSyncOperation({
            veventComponent: createFutureRecurrence(newVeventWithSequence, originalVeventWithSequence, recurrence),
        });

        const oldRecurrenceVeventComponent = getCurrentEvent(originalVeventWithSequence, recurrence);
        const hasStartChanged = getHasStartChanged(newVeventWithSequence, oldRecurrenceVeventComponent);

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
            hasStartChanged,
        };
    }

    if (type === RECURRING_TYPES.ALL) {
        const isSwitchCalendar = originalCalendarID !== newCalendarID;
        // Any single edits in the recurrence chain.
        const singleEditRecurrences = getRecurrenceEvents(recurrences, originalEvent);
        // For an invitation, we do not want to delete single edits as we want to keep in sync with the organizer's event
        const deleteOperations = isAttendee ? [] : singleEditRecurrences.map(unary(getDeleteSyncOperation));
        if (selfAttendeeToken && invitePartstat) {
            // the attendee changes answer
            const { updatePartstatActions, updatePersonalPartActions, sendActions } = await getChangePartstatActions({
                inviteActions,
                eventComponent: newVeventComponent,
                event: oldEvent,
                memberID: newMemberID,
                addressID: newAddressID,
                reencryptionCalendarID: oldEvent.AddressKeyPacket && oldEvent.AddressID ? newCalendarID : undefined,
                sendIcs,
                reencryptSharedEvent,
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
                        silence: true,
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
                sendActions,
            };
        }
        if (!oldEvent.IsOrganizer && !isSwitchCalendar) {
            // the attendee edits notifications. We must do it through the updatePersonalPart route
            return getUpdatePersonalPartActions({
                eventComponent: newVeventComponent,
                event: oldEvent,
                memberID: newMemberID,
                addressID: newAddressID,
                reencryptionCalendarID: oldEvent.AddressKeyPacket && oldEvent.AddressID ? newCalendarID : undefined,
                inviteActions,
                reencryptSharedEvent,
            });
        }
        const newRecurrentVevent = updateAllRecurrence({
            component: newVeventComponent,
            originalComponent: originalVeventComponent,
            mode: updateAllPossibilities,
            isSingleEdit,
            isAttendee,
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
        let addedAttendeesPublicKeysMap: SimpleMap<PublicKeyReference> | undefined;
        if (isSendInviteType) {
            if (isSwitchCalendar) {
                // Temporary hotfix to an API issue
                throw new Error(
                    'Cannot add participants and change calendar simultaneously. Please change the calendar first'
                );
            }
            const {
                veventComponent: cleanVeventComponent,
                inviteActions: cleanInviteActions,
                sendPreferencesMap,
            } = await sendIcs({
                inviteActions,
                vevent: updatedVeventComponent,
                cancelVevent: originalVeventComponent,
            });
            if (cleanVeventComponent) {
                updatedVeventComponent = cleanVeventComponent;
                updatedInviteActions = cleanInviteActions;
                addedAttendeesPublicKeysMap = getAddedAttendeesPublicKeysMap({
                    veventComponent: updatedVeventComponent,
                    inviteActions: updatedInviteActions,
                    sendPreferencesMap,
                });
            }
        }
        const updateOperation = getUpdateSyncOperation({
            veventComponent: updatedVeventComponent,
            calendarEvent: originalEvent,
            isAttendee,
            removedAttendeesEmails: updatedInviteActions.removedAttendees?.map(unary(getAttendeeEmail)),
            addedAttendeesPublicKeysMap,
        });

        const hasStartChanged = getHasStartChanged(updatedVeventComponent, originalVeventComponent);

        if (isSwitchCalendar) {
            const deleteOriginalOperation = getDeleteSyncOperation(originalEvent, isSwitchCalendar);
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
                hasStartChanged,
            };
        }

        return {
            multiSyncActions: [
                {
                    calendarID: newCalendarID,
                    addressID: newAddressID,
                    memberID: newMemberID,
                    operations: isAttendee ? [updateOperation] : [...deleteOperations, updateOperation],
                },
            ],
            inviteActions: updatedInviteActions,
            hasStartChanged,
        };
    }

    throw new Error('Unknown type');
};

export default getSaveRecurringEventActions;
