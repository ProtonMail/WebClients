import { getHasDefaultNotifications, getIsPersonalSingleEdit } from '@proton/shared/lib/calendar/apiModels';
import { ICAL_ATTENDEE_STATUS, RECURRING_TYPES } from '@proton/shared/lib/calendar/constants';
import { getResetPartstatActions } from '@proton/shared/lib/calendar/mailIntegration/invite';
import { getHasRecurrenceId } from '@proton/shared/lib/calendar/vcalHelper';
import { getIsEventCancelled, withDtstamp } from '@proton/shared/lib/calendar/veventHelper';
import { omit } from '@proton/shared/lib/helpers/object';
import type { CalendarEvent, VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar';
import type { GetCalendarEventRaw } from '@proton/shared/lib/interfaces/hooks/GetCalendarEventRaw';
import unary from '@proton/utils/unary';

import type { CalendarEventRecurring } from '../../../interfaces/CalendarEvents';
import type { EventOldData } from '../../../interfaces/EventData';
import type {
    AttendeeDeleteSingleEditOperation,
    InviteActions,
    SendIcs,
    UpdatePartstatOperation,
    UpdatePersonalPartOperation,
} from '../../../interfaces/Invite';
import { INVITE_ACTION_TYPES } from '../../../interfaces/Invite';
import type { SyncEventActionOperation, SyncEventActionOperations } from '../getSyncMultipleEventsPayload';
import { getDeleteSyncOperation, getUpdateSyncOperation } from '../getSyncMultipleEventsPayload';
import createSingleCancelledRecurrence from '../recurrence/createSingleCancelledRecurrence';
import deleteFutureRecurrence from '../recurrence/deleteFutureRecurrence';
import deleteSingleRecurrence from '../recurrence/deleteSingleRecurrence';
import { getAttendeeDeleteSingleEditOperation } from './getAttendeeDeleteSingleEditActions';
import { getUpdatePartstatOperation } from './getChangePartstatActions';
import { getHasProtonAttendees } from './inviteActions';
import { getCurrentVevent, getRecurrenceEvents, getRecurrenceEventsAfter } from './recurringHelper';

interface DeleteRecurringArguments {
    type: RECURRING_TYPES;
    recurrence: CalendarEventRecurring;
    recurrences: CalendarEvent[];
    originalEditEventData: EventOldData;
    oldEditEventData: EventOldData;
    isAttendee: boolean;
    inviteActions: InviteActions;
    selfAttendeeToken?: string;
    sendIcs: SendIcs;
    getCalendarEventRaw: GetCalendarEventRaw;
}

export const getDeleteRecurringEventActions = async ({
    type,
    recurrence,
    recurrences,
    originalEditEventData: {
        veventComponent: originalVeventComponent,
        eventData: originalEvent,
        calendarID: originalCalendarID,
        addressID: originalAddressID,
        memberID: originalMemberID,
    },
    oldEditEventData: { eventData: oldEvent, veventComponent: oldVeventComponent },
    isAttendee,
    inviteActions,
    selfAttendeeToken,
    sendIcs,
    getCalendarEventRaw,
}: DeleteRecurringArguments): Promise<{
    multiSyncActions: SyncEventActionOperations[];
    inviteActions: InviteActions;
    updatePartstatActions?: UpdatePartstatOperation[];
    updatePersonalPartActions?: UpdatePersonalPartOperation[];
    attendeeDeleteSingleEditActions?: AttendeeDeleteSingleEditOperation[];
}> => {
    const { type: inviteType, sendCancellationNotice, deleteSingleEdits } = inviteActions;
    const isDeclineInvitation = inviteType === INVITE_ACTION_TYPES.DECLINE_INVITATION && sendCancellationNotice;
    const isCancelInvitation = inviteType === INVITE_ACTION_TYPES.CANCEL_INVITATION;
    let updatedInviteActions = inviteActions;

    if (type === RECURRING_TYPES.SINGLE) {
        if (!originalVeventComponent || !oldVeventComponent) {
            throw new Error('Cannot delete single occurrence without original or old events');
        }

        const updatePartstatOperations: UpdatePartstatOperation[] = [];

        const isSingleEdit = oldEvent.ID !== originalEvent.ID;
        const isCancelInvitation = inviteType === INVITE_ACTION_TYPES.CANCEL_INVITATION;
        const isPersonalSingleEdit = getIsPersonalSingleEdit(oldEvent);
        let cancelledOccurrenceVevent: VcalVeventComponent | undefined;
        let hasCancelledMainSeriesWithProtonAttendees = false;

        if (isSingleEdit && isDeclineInvitation) {
            const { inviteActions: cleanInviteActions, timestamp } = await sendIcs({
                inviteActions,
                vevent: oldVeventComponent,
            });
            updatedInviteActions = cleanInviteActions;
            // even though we are going to delete the event, we need to update the partstat first to notify the organizer for
            // Proton-Proton invites. Hopefully a better API will allow us to do it differently in the future
            const updatePartstatOperation = getUpdatePartstatOperation({
                eventComponent: oldVeventComponent,
                event: oldEvent,
                timestamp,
                inviteActions: updatedInviteActions,
                silence: true,
            });

            if (updatePartstatOperation) {
                updatePartstatOperations.push(updatePartstatOperation);
            }
        }

        if (isCancelInvitation) {
            cancelledOccurrenceVevent = isSingleEdit
                ? oldVeventComponent
                : createSingleCancelledRecurrence(getCurrentVevent(oldVeventComponent, recurrence));
            const { inviteActions: cleanInviteActions, sendPreferencesMap } = await sendIcs({
                inviteActions,
                cancelVevent: cancelledOccurrenceVevent,
            });
            const isNonPersonalSingleEdit = isSingleEdit && !isPersonalSingleEdit;
            hasCancelledMainSeriesWithProtonAttendees =
                !isNonPersonalSingleEdit && getHasProtonAttendees(cancelledOccurrenceVevent, sendPreferencesMap);
            updatedInviteActions = cleanInviteActions;
        }

        const syncOperations: SyncEventActionOperation[] = [];
        const attendeeDeleteSingleEditOperations: AttendeeDeleteSingleEditOperation[] = [];

        const originalVeventWithUpdatedExdate = deleteSingleRecurrence(originalVeventComponent, recurrence.localStart);
        const attendeeIsDeletingProtonSingleEdit = isAttendee && isSingleEdit && oldEvent.IsProtonProtonInvite;

        if (isSingleEdit && !attendeeIsDeletingProtonSingleEdit) {
            // delete single edit (not needed for the case of the attendee deleting it since the BE does it automatically)
            syncOperations.push(getDeleteSyncOperation(oldEvent));
        }

        if (originalVeventWithUpdatedExdate) {
            if (!isAttendee) {
                // add EXDATE to the main series
                syncOperations.push(
                    getUpdateSyncOperation({
                        veventComponent: originalVeventWithUpdatedExdate,
                        calendarEvent: originalEvent,
                        hasDefaultNotifications: getHasDefaultNotifications(originalEvent),
                        isAttendee,
                        resetNotes: false,
                        cancelledOccurrenceVevent: hasCancelledMainSeriesWithProtonAttendees
                            ? cancelledOccurrenceVevent
                            : undefined,
                    })
                );
            } else if (attendeeIsDeletingProtonSingleEdit) {
                attendeeDeleteSingleEditOperations.push(
                    getAttendeeDeleteSingleEditOperation({
                        addressID: originalAddressID,
                        eventComponent: originalVeventWithUpdatedExdate,
                        event: oldEvent,
                    })
                );
            }
        }

        return {
            multiSyncActions: syncOperations.length
                ? [
                      {
                          calendarID: originalCalendarID,
                          addressID: originalAddressID,
                          memberID: originalMemberID,
                          operations: syncOperations,
                      },
                  ]
                : [],
            attendeeDeleteSingleEditActions: attendeeDeleteSingleEditOperations,
            inviteActions: updatedInviteActions,
            updatePartstatActions: updatePartstatOperations,
        };
    }

    if (type === RECURRING_TYPES.FUTURE) {
        if (!originalVeventComponent || !recurrences.length) {
            throw new Error('Can not delete future recurrences without the original event');
        }

        const updatedVeventComponent = deleteFutureRecurrence(
            originalVeventComponent,
            recurrence.localStart,
            recurrence.occurrenceNumber
        );

        // Any single edits in the recurrence chain.
        const singleEditRecurrences = getRecurrenceEvents(recurrences, originalEvent);

        // Any single edits after the date in the recurrence chain.
        const singleEditRecurrencesAfter = getRecurrenceEventsAfter(singleEditRecurrences, recurrence.localStart);

        const deleteOperations = singleEditRecurrencesAfter.map(unary(getDeleteSyncOperation));
        const updateOperation = getUpdateSyncOperation({
            veventComponent: withDtstamp(omit(updatedVeventComponent, ['dtstamp'])),
            calendarEvent: originalEvent,
            hasDefaultNotifications: getHasDefaultNotifications(originalEvent),
            isAttendee,
            resetNotes: false,
        });

        return {
            multiSyncActions: [
                {
                    calendarID: originalCalendarID,
                    addressID: originalAddressID,
                    memberID: originalMemberID,
                    operations: [...deleteOperations, updateOperation],
                },
            ],
            inviteActions,
        };
    }

    if (type === RECURRING_TYPES.ALL) {
        if (!recurrences.length) {
            throw new Error('Cannot delete all events without any recurrences');
        }

        const updatePartstatOperations: UpdatePartstatOperation[] = [];
        const resetPartstatOperations: UpdatePartstatOperation[] = [];
        const dropPersonalPartOperations: UpdatePersonalPartOperation[] = [];

        if (isDeclineInvitation && originalVeventComponent) {
            const { inviteActions: cleanInviteActions, timestamp } = await sendIcs({
                inviteActions,
                vevent: originalVeventComponent,
            });
            updatedInviteActions = cleanInviteActions;
            // even though we are going to delete the event, we need to update the partstat first to notify the organizer for
            // Proton-Proton invites. Hopefully a better API will allow us to do it differently in the future
            const updatePartstatOperation = getUpdatePartstatOperation({
                eventComponent: originalVeventComponent,
                event: originalEvent,
                timestamp,
                inviteActions: updatedInviteActions,
                silence: true,
            });
            if (updatePartstatOperation) {
                updatePartstatOperations.push(updatePartstatOperation);
            }
        }
        const singleEditRecurrences = getRecurrenceEvents(recurrences, originalEvent);
        const eventsToDelete =
            // For an attendee deleting a recurring invitation, we do not delete single edits (unless explicitly told so),
            // but reset partstat if necessary
            isAttendee && !deleteSingleEdits
                ? [originalEvent].concat(singleEditRecurrences.filter((event) => getIsEventCancelled(event)))
                : recurrences;

        if (isAttendee && selfAttendeeToken) {
            const { updatePartstatActions, updatePersonalPartActions } = getResetPartstatActions(
                singleEditRecurrences,
                selfAttendeeToken,
                ICAL_ATTENDEE_STATUS.DECLINED
            );
            resetPartstatOperations.push(
                ...updatePartstatActions.map(({ calendarID, eventID, updateTime, attendeeID }) => {
                    return {
                        data: {
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
            if (!deleteSingleEdits) {
                dropPersonalPartOperations.push(
                    ...updatePersonalPartActions.map(({ calendarID, eventID, color }) => {
                        return { data: { memberID: originalMemberID, calendarID, eventID, color } };
                    })
                );
            }
        }

        if (isCancelInvitation && originalVeventComponent) {
            const veventsToDelete = await Promise.all([
                originalVeventComponent,
                ...singleEditRecurrences
                    .filter((event) => !getIsPersonalSingleEdit(event))
                    .map((event) => getCalendarEventRaw(event).then(({ veventComponent }) => veventComponent)),
            ]);
            await Promise.all(
                veventsToDelete.map(async (cancelVevent) =>
                    sendIcs({
                        inviteActions,
                        cancelVevent,
                        // When deleting all, do not check single edits send preferences. Otherwise, single edits containing prefs errors will block the UI
                        // TODO: Move send preference error check outside of sendIcs
                        noCheckSendPrefs: getHasRecurrenceId(cancelVevent),
                    })
                )
            );
        }

        const deleteOperations = eventsToDelete.map(unary(getDeleteSyncOperation));

        return {
            multiSyncActions: [
                {
                    calendarID: originalCalendarID,
                    addressID: originalAddressID,
                    memberID: originalMemberID,
                    operations: deleteOperations,
                },
            ],
            inviteActions: updatedInviteActions,
            updatePartstatActions: [...updatePartstatOperations, ...resetPartstatOperations],
            updatePersonalPartActions: dropPersonalPartOperations,
        };
    }

    throw new Error('Unknown delete type');
};
