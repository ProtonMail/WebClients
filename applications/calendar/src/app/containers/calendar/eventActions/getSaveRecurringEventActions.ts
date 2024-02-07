import { useGetCalendarKeys } from '@proton/components/hooks';
import { PublicKeyReference } from '@proton/crypto';
import { getHasDefaultNotifications } from '@proton/shared/lib/calendar/apiModels';
import { getIsAutoAddedInvite } from '@proton/shared/lib/calendar/apiModels';
import { getAttendeeEmail } from '@proton/shared/lib/calendar/attendees';
import { ICAL_ATTENDEE_STATUS, RECURRING_TYPES } from '@proton/shared/lib/calendar/constants';
import { getBase64SharedSessionKey } from '@proton/shared/lib/calendar/crypto/keys/helpers';
import { getResetPartstatActions } from '@proton/shared/lib/calendar/mailIntegration/invite';
import { getHasStartChanged } from '@proton/shared/lib/calendar/vcalConverter';
import { withDtstamp } from '@proton/shared/lib/calendar/veventHelper';
import { omit } from '@proton/shared/lib/helpers/object';
import { SimpleMap } from '@proton/shared/lib/interfaces';
import { CalendarEvent, SyncMultipleApiResponse, VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar';
import { GetAddressKeys } from '@proton/shared/lib/interfaces/hooks/GetAddressKeys';
import unary from '@proton/utils/unary';

import { CalendarEventRecurring } from '../../../interfaces/CalendarEvents';
import { EventNewData, EventOldData } from '../../../interfaces/EventData';
import {
    INVITE_ACTION_TYPES,
    InviteActions,
    OnSendPrefsErrors,
    ReencryptInviteActionData,
    SendIcs,
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
import {
    getCorrectedSendInviteData,
    getUpdateInviteOperationWithIntermediateEvent,
} from './getSaveEventActionsHelpers';
import { getUpdatePersonalPartActions } from './getUpdatePersonalPartActions';
import { getAddedAttendeesPublicKeysMap } from './inviteActions';
import { getCurrentVevent, getRecurrenceEvents, getRecurrenceEventsAfter } from './recurringHelper';
import { withIncrementedSequence, withUpdatedDtstampAndSequence, withVeventSequence } from './sequence';

interface SaveRecurringArguments {
    type: RECURRING_TYPES;
    recurrences: CalendarEvent[];
    originalEditEventData: EventOldData;
    oldEditEventData: EventOldData;
    newEditEventData: EventNewData;
    recurrence: CalendarEventRecurring;
    updateAllPossibilities: UpdateAllPossibilities;
    getAddressKeys: GetAddressKeys;
    getCalendarKeys: ReturnType<typeof useGetCalendarKeys>;
    hasDefaultNotifications: boolean;
    hasModifiedDateTimes: boolean;
    canEditOnlyPersonalPart: boolean;
    isOrganizer: boolean;
    isAttendee: boolean;
    isBreakingChange: boolean;
    inviteActions: InviteActions;
    sendIcs: SendIcs;
    handleSyncActions: (actions: SyncEventActionOperations[]) => Promise<SyncMultipleApiResponse[]>;
    reencryptSharedEvent: (data: ReencryptInviteActionData) => Promise<void>;
    onSendPrefsErrors: OnSendPrefsErrors;
    onEquivalentAttendees: (veventComponent: VcalVeventComponent, inviteActions: InviteActions) => Promise<void>;
    selfAttendeeToken?: string;
}

const getSaveRecurringEventActions = async ({
    type,
    recurrences,
    oldEditEventData,
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
    getAddressKeys,
    getCalendarKeys,
    inviteActions,
    hasDefaultNotifications,
    hasModifiedDateTimes,
    canEditOnlyPersonalPart,
    isAttendee,
    isBreakingChange,
    sendIcs,
    handleSyncActions,
    onSendPrefsErrors,
    onEquivalentAttendees,
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
    const { eventData: oldEvent, veventComponent: oldVeventComponent } = oldEditEventData;
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
                      hasDefaultNotifications,
                      isAttendee,
                  }),
              ]
            : [];

        /**
         * Editing an existing single edit
         */
        if (isSingleEdit) {
            if (inviteType === INVITE_ACTION_TYPES.CHANGE_PARTSTAT) {
                // the attendee changes answer
                // the sequence is not affected by simply updating the partstast
                return getChangePartstatActions({
                    inviteActions,
                    eventComponent: newVeventComponent,
                    hasDefaultNotifications,
                    event: oldEvent,
                    addressID: newAddressID,
                    reencryptionCalendarID: getIsAutoAddedInvite(oldEvent) ? newCalendarID : undefined,
                    sendIcs,
                    reencryptSharedEvent,
                });
            }
            if (canEditOnlyPersonalPart) {
                // We change notifications through the updatePersonalPart route
                return getUpdatePersonalPartActions({
                    eventComponent: newVeventComponent,
                    hasDefaultNotifications,
                    event: oldEvent,
                    addressID: newAddressID,
                    reencryptionCalendarID: getIsAutoAddedInvite(oldEvent) ? newCalendarID : undefined,
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
                : withVeventSequence(oldVeventComponent, getCurrentVevent(originalVeventWithSequence, recurrence));
            const newVeventWithSequence = withUpdatedDtstampAndSequence(
                updateSingleRecurrence(newVeventComponent),
                oldVeventWithSequence
            );
            const hasStartChanged = getHasStartChanged(newVeventWithSequence, oldVeventWithSequence);
            const {
                vevent: correctedVevent,
                inviteActions: correctedInviteActions,
                isSendInviteType,
            } = await getCorrectedSendInviteData({
                newVevent: newVeventWithSequence,
                oldVevent: oldVeventWithSequence,
                inviteActions,
                hasModifiedDateTimes,
                onEquivalentAttendees,
                isCreatingSingleEdit: oldEvent.IsPersonalSingleEdit,
            });

            const sharedSessionKey = await getBase64SharedSessionKey({
                calendarEvent: oldEvent,
                getAddressKeys,
                getCalendarKeys,
            });

            const inviteActionsWithSharedData = {
                ...correctedInviteActions,
                sharedEventID: oldEvent.SharedEventID,
                sharedSessionKey,
            };

            let addedAttendeesPublicKeysMap: SimpleMap<PublicKeyReference> | undefined;

            if (isSendInviteType) {
                const {
                    veventComponent: finalVevent,
                    inviteActions: finalInviteActions,
                    sendPreferencesMap,
                } = await sendIcs({
                    inviteActions: inviteActionsWithSharedData,
                    vevent: correctedVevent,
                    cancelVevent: oldVeventComponent,
                });

                addedAttendeesPublicKeysMap = getAddedAttendeesPublicKeysMap({
                    veventComponent: finalVevent,
                    inviteActions: finalInviteActions,
                    sendPreferencesMap,
                });
            }

            const updateOperation = getUpdateSyncOperation({
                veventComponent: correctedVevent,
                calendarEvent: oldEvent,
                hasDefaultNotifications,
                isAttendee,
                addedAttendeesPublicKeysMap,
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

        /**
         * Creating a single edit
         */
        const oldRecurrenceVeventComponentWithSequence = getCurrentVevent(originalVeventWithSequence, recurrence);
        const newRecurrenceVeventComponent = createSingleRecurrence(
            newVeventComponent,
            originalVeventComponent,
            recurrence.localStart
        );
        const newRecurrenceVeventWithSequence = withUpdatedDtstampAndSequence(
            newRecurrenceVeventComponent,
            oldRecurrenceVeventComponentWithSequence
        );

        const hasStartChanged = getHasStartChanged(
            newRecurrenceVeventWithSequence,
            oldRecurrenceVeventComponentWithSequence
        );

        const {
            vevent: correctedVevent,
            inviteActions: correctedInviteActions,
            isSendInviteType,
        } = await getCorrectedSendInviteData({
            newVevent: newRecurrenceVeventWithSequence,
            oldVevent: oldRecurrenceVeventComponentWithSequence,
            inviteActions,
            hasModifiedDateTimes,
            onEquivalentAttendees,
            isCreatingSingleEdit: true,
        });

        const updateOperationWithAttendees = isSendInviteType
            ? await getUpdateInviteOperationWithIntermediateEvent({
                  inviteActions: correctedInviteActions,
                  vevent: correctedVevent,
                  oldVevent: oldRecurrenceVeventComponentWithSequence,
                  hasDefaultNotifications,
                  calendarID: newCalendarID,
                  addressID: newAddressID,
                  memberID: newMemberID,
                  getCalendarKeys,
                  sendIcs,
                  onSendPrefsErrors,
                  handleSyncActions,
              })
            : undefined;

        const createOrUpdateOperation =
            updateOperationWithAttendees ||
            getCreateSyncOperation({
                veventComponent: newRecurrenceVeventWithSequence,
                hasDefaultNotifications,
                isPersonalSingleEdit: !isSendInviteType,
            });

        return {
            multiSyncActions: [
                {
                    calendarID: originalCalendarID,
                    addressID: originalAddressID,
                    memberID: originalMemberID,
                    operations: [...maybeUpdateParentOperations, createOrUpdateOperation],
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
            hasDefaultNotifications: getHasDefaultNotifications(originalEvent),
            isAttendee,
        });
        const createOperation = getCreateSyncOperation({
            veventComponent: createFutureRecurrence(newVeventWithSequence, originalVeventWithSequence, recurrence),
            hasDefaultNotifications,
        });

        const oldRecurrenceVeventComponent = getCurrentVevent(originalVeventWithSequence, recurrence);
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
        if (selfAttendeeToken && invitePartstat) {
            // the attendee changes answer
            const { updatePartstatActions, updatePersonalPartActions, sendActions } = await getChangePartstatActions({
                inviteActions,
                eventComponent: newRecurrentVeventWithSequence,
                hasDefaultNotifications,
                event: oldEvent,
                addressID: newAddressID,
                reencryptionCalendarID: getIsAutoAddedInvite(oldEvent) ? newCalendarID : undefined,
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
                ...dropAlarmsActions.map(({ calendarID, eventID, color }) => {
                    return { data: { memberID: newMemberID, calendarID, eventID, color } };
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
        if (canEditOnlyPersonalPart && !isSwitchCalendar) {
            // We change notifications through the updatePersonalPart route
            return getUpdatePersonalPartActions({
                eventComponent: newRecurrentVeventWithSequence,
                hasDefaultNotifications,
                event: oldEvent,
                addressID: newAddressID,
                reencryptionCalendarID: getIsAutoAddedInvite(oldEvent) ? newCalendarID : undefined,
                inviteActions,
                reencryptSharedEvent,
            });
        }
        const {
            vevent: correctedVevent,
            inviteActions: correctedInviteActions,
            isSendInviteType,
        } = await getCorrectedSendInviteData({
            newVevent: newRecurrentVeventWithSequence,
            oldVevent: originalVeventComponent,
            inviteActions,
            hasModifiedDateTimes,
            onEquivalentAttendees,
        });

        let updatedVeventComponent = correctedVevent;
        let updatedInviteActions = correctedInviteActions;
        let addedAttendeesPublicKeysMap: SimpleMap<PublicKeyReference> | undefined;
        if (isSendInviteType) {
            if (isSwitchCalendar) {
                // Temporary hotfix to an API issue
                throw new Error(
                    'Cannot add participants and change calendar simultaneously. Please change the calendar first'
                );
            }
            const sharedSessionKey = await getBase64SharedSessionKey({
                calendarEvent: originalEvent,
                getCalendarKeys,
                getAddressKeys,
            });
            if (sharedSessionKey) {
                updatedInviteActions.sharedEventID = originalEvent.SharedEventID;
                updatedInviteActions.sharedSessionKey = sharedSessionKey;
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
            hasDefaultNotifications,
            isAttendee,
            isBreakingChange,
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
