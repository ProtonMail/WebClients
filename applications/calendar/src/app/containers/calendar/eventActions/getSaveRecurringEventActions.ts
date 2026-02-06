import type { useGetCalendarKeys } from '@proton/calendar/calendarBootstrap/keys';
import type { PublicKeyReference } from '@proton/crypto';
import {
    getHasDefaultNotifications,
    getIsAutoAddedInvite,
    getIsPersonalSingleEdit,
} from '@proton/shared/lib/calendar/apiModels';
import { getAttendeeEmail } from '@proton/shared/lib/calendar/attendees';
import { ICAL_ATTENDEE_STATUS, RECURRING_TYPES } from '@proton/shared/lib/calendar/constants';
import { getBase64SharedSessionKey } from '@proton/shared/lib/calendar/crypto/keys/helpers';
import { getHasUpdatedInviteData, getResetPartstatActions } from '@proton/shared/lib/calendar/mailIntegration/invite';
import { getHasStartChanged } from '@proton/shared/lib/calendar/vcalConverter';
import { getHasAttendees } from '@proton/shared/lib/calendar/vcalHelper';
import { getIsAllDay, withDtstamp } from '@proton/shared/lib/calendar/veventHelper';
import { omit } from '@proton/shared/lib/helpers/object';
import type { RequireSome, SimpleMap } from '@proton/shared/lib/interfaces';
import type {
    CalendarEvent,
    SyncMultipleApiResponse,
    VcalVeventComponent,
} from '@proton/shared/lib/interfaces/calendar';
import type { GetAddressKeys } from '@proton/shared/lib/interfaces/hooks/GetAddressKeys';
import type { GetCalendarEventRaw } from '@proton/shared/lib/interfaces/hooks/GetCalendarEventRaw';
import unary from '@proton/utils/unary';

import type { CalendarEventRecurring } from '../../../interfaces/CalendarEvents';
import type { EventNewData, EventOldData } from '../../../interfaces/EventData';
import type {
    InviteActions,
    OnSendPrefsErrors,
    ReencryptInviteActionData,
    SendIcs,
    SendIcsActionData,
    UpdatePartstatOperation,
    UpdatePersonalPartOperation,
} from '../../../interfaces/Invite';
import { INVITE_ACTION_TYPES } from '../../../interfaces/Invite';
import type { SyncEventActionOperations, UpdateEventActionOperation } from '../getSyncMultipleEventsPayload';
import {
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
    getHasMergeUpdate,
    getHasNotificationsMergeUpdate,
    getUpdateInviteOperationWithIntermediateEvent,
    getUpdateMainSeriesMergeVevent,
    getUpdateMergeVeventWithoutMaybeNotifications,
    getUpdateSingleEditMergeVevent,
    getUpdatedMainSeriesMergeEvent,
    handleConferenceDataInMergedVeventIfNeeded,
} from './getSaveEventActionsHelpers';
import { getUpdatePersonalPartActions } from './getUpdatePersonalPartActions';
import { getAddedAttendeesPublicKeysMap } from './inviteActions';
import { getCurrentVevent, getRecurrenceEvents, getRecurrenceEventsAfter } from './recurringHelper';
import { withIncrementedSequence, withUpdatedDtstampAndSequence, withVeventSequence } from './sequence';

interface SaveRecurringArguments {
    type: RECURRING_TYPES;
    recurrences: CalendarEvent[];
    originalEditEventData: RequireSome<EventOldData, 'veventComponent'>;
    oldEditEventData: RequireSome<EventOldData, 'veventComponent'>;
    newEditEventData: EventNewData;
    recurrence: CalendarEventRecurring;
    isSingleEdit: boolean;
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
    getCalendarEventRaw: GetCalendarEventRaw;
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
    isSingleEdit,
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
    getCalendarEventRaw,
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
                      resetNotes: isBreakingChange,
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

            const hasUpdatedInviteData = getHasUpdatedInviteData({
                newVevent: newVeventWithSequence,
                oldVevent: oldVeventWithSequence,
                hasModifiedDateTimes,
            });
            const updateOperation = getUpdateSyncOperation({
                veventComponent: correctedVevent,
                calendarEvent: oldEvent,
                hasDefaultNotifications,
                isAttendee,
                addedAttendeesPublicKeysMap,
                // we only need to specify isPersonalSingleEdit when we need to change its value
                // here that is in case the existing single edit was a personal one, but we're now propagating the change to attendees
                isPersonalSingleEdit: hasUpdatedInviteData && oldEvent.IsPersonalSingleEdit ? false : undefined,
                resetNotes: isBreakingChange,
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
                  isBreakingChange,
              })
            : undefined;

        const createOrUpdateOperation =
            updateOperationWithAttendees ||
            getCreateSyncOperation({
                veventComponent: newRecurrenceVeventWithSequence,
                hasDefaultNotifications,
                isPersonalSingleEdit: !getHasUpdatedInviteData({
                    newVevent: newRecurrenceVeventWithSequence,
                    oldVevent: oldRecurrenceVeventComponentWithSequence,
                    hasModifiedDateTimes,
                }),
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
            resetNotes: isBreakingChange,
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

        const organizerEditsNonBreakingSingleEdit =
            isSingleEdit &&
            !isBreakingChange &&
            !isAttendee &&
            (getHasAttendees(originalVeventComponent) || getHasAttendees(newVeventComponent));
        const updateMainSeriesMergeVevent = getUpdateMainSeriesMergeVevent({
            newVeventComponent,
            oldVeventComponent,
            originalVeventComponent,
        });
        const mergedNewRecurrentVevent = organizerEditsNonBreakingSingleEdit
            ? {
                  ...originalVeventComponent,
                  ...getUpdateMergeVeventWithoutMaybeNotifications({
                      newVevent: oldVeventComponent,
                      oldVevent: originalVeventComponent,
                      mergeVevent: updateMainSeriesMergeVevent,
                  }),
              }
            : newVeventComponent;

        handleConferenceDataInMergedVeventIfNeeded(mergedNewRecurrentVevent);

        const newRecurrentVevent = updateAllRecurrence({
            component: mergedNewRecurrentVevent,
            originalComponent: originalVeventComponent,
            mode: updateAllPossibilities,
            isAttendee,
        });
        const newRecurrentVeventWithSequence = withUpdatedDtstampAndSequence(
            newRecurrentVevent,
            originalVeventComponent
        );
        // Any single edits in the recurrence chain.
        const singleEditRecurrences = getRecurrenceEvents(recurrences, originalEvent);
        // As an attendee, we do not want to delete single edits as we want to keep in sync with the organizer's event
        let deleteOperations = isAttendee ? [] : singleEditRecurrences.map(unary(getDeleteSyncOperation));
        const updateSingleEditOperations: UpdateEventActionOperation[] = [];

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
        let updatedInviteActions: InviteActions = {
            ...correctedInviteActions,
            recurringType: RECURRING_TYPES.ALL,
        };
        let addedAttendeesPublicKeysMap: SimpleMap<PublicKeyReference> | undefined;
        if (isSendInviteType) {
            if (isSwitchCalendar) {
                // Temporary hotfix to an API issue
                throw new Error(
                    'Cannot add participants and change calendar simultaneously. Please change the calendar first'
                );
            }
            // checking send preferences errors here to apply potential changes to all occurrences
            // TODO: this assumes all occurrences have the same list of attendees
            const {
                sendPreferencesMap: sendPrefsMapAfterSendPrefsCheck,
                inviteActions: inviteActionsAfterSendPrefsCheck,
                vevent: veventAfterSendPrefsCheck,
                cancelVevent: cancelVeventAfterSendPrefsCheck,
            } = await onSendPrefsErrors({
                inviteActions: updatedInviteActions,
                vevent: updatedVeventComponent,
                cancelVevent: originalVeventComponent,
            });
            updatedVeventComponent = veventAfterSendPrefsCheck;
            updatedInviteActions = inviteActionsAfterSendPrefsCheck;
            const updatedMainSeriesInviteActions = { ...updatedInviteActions };

            const originalIcsPromise = getBase64SharedSessionKey({
                calendarEvent: originalEvent,
                getCalendarKeys,
                getAddressKeys,
            }).then((sharedSessionKey) => {
                if (sharedSessionKey) {
                    updatedMainSeriesInviteActions.sharedEventID = originalEvent.SharedEventID;
                    updatedMainSeriesInviteActions.sharedSessionKey = sharedSessionKey;
                }
                return sendIcs({
                    inviteActions: updatedMainSeriesInviteActions,
                    vevent: updatedVeventComponent,
                    cancelVevent: cancelVeventAfterSendPrefsCheck,
                    noCheckSendPrefs: false,
                    sendPreferencesMap: sendPrefsMapAfterSendPrefsCheck,
                });
            });
            const singleEditIcsPromises = [];
            if (!isBreakingChange) {
                deleteOperations = [];
                const oldVevent = isSingleEdit ? oldVeventComponent : originalVeventComponent;
                // For non-breaking single edits, changes to date-time properties need a merge with the original date-time properties
                // However, some attendees might have been removed after a send preference check.
                // In that case, we want to use updateMainSeriesMergeVevent, but we take computed attendees from updatedVeventComponent
                const updateMergeVevent = organizerEditsNonBreakingSingleEdit
                    ? getUpdatedMainSeriesMergeEvent(updatedVeventComponent, updateMainSeriesMergeVevent)
                    : getUpdateSingleEditMergeVevent(updatedVeventComponent, oldVevent);
                // implement the so-called smart rules for "edit all", namely propagate changed fields to single edits
                singleEditIcsPromises.push(
                    ...singleEditRecurrences.map(async (event) => {
                        const { veventComponent } = await getCalendarEventRaw(event);
                        const updateSingleEditMergeVevent = getUpdateMergeVeventWithoutMaybeNotifications({
                            newVevent: veventComponent,
                            oldVevent,
                            mergeVevent: updateMergeVevent,
                        });

                        const hasModifiedNotifications = getHasNotificationsMergeUpdate(
                            veventComponent,
                            updateSingleEditMergeVevent
                        );
                        if (!getHasMergeUpdate(veventComponent, updateSingleEditMergeVevent)) {
                            return;
                        }
                        let updatedSingleEditVevent = {
                            ...veventComponent,
                            ...updateSingleEditMergeVevent,
                        };

                        handleConferenceDataInMergedVeventIfNeeded(updatedSingleEditVevent);

                        let addedAttendeesSingleEditPublicKeysMap;
                        let updatedSingleEditInviteActions = {
                            ...updatedInviteActions,
                        };

                        if (!getIsPersonalSingleEdit(event)) {
                            // attendees need to be notified by email
                            const sharedSessionKey = await getBase64SharedSessionKey({
                                calendarEvent: event,
                                getCalendarKeys,
                                getAddressKeys,
                            });
                            updatedSingleEditInviteActions = {
                                ...updatedSingleEditInviteActions,
                                sharedEventID: event.SharedEventID,
                                sharedSessionKey,
                                recurringType: RECURRING_TYPES.ALL,
                            };

                            const {
                                veventComponent: finalVevent,
                                inviteActions: finalInviteActions,
                                sendPreferencesMap,
                            } = await sendIcs({
                                inviteActions: updatedSingleEditInviteActions,
                                vevent: updatedSingleEditVevent,
                                cancelVevent: veventComponent,
                                // Do not re-check send preferences errors for single edits as they were checked for the main event already,
                                // and it's currently not possible to have a different list of attendees in the single edits
                                // TODO: Move send preference error check outside of sendIcs
                                sendPreferencesMap: sendPrefsMapAfterSendPrefsCheck,
                                noCheckSendPrefs: true,
                            });
                            updatedSingleEditVevent = finalVevent;
                            addedAttendeesSingleEditPublicKeysMap = getAddedAttendeesPublicKeysMap({
                                veventComponent: finalVevent,
                                inviteActions: finalInviteActions,
                                sendPreferencesMap,
                            });
                        }

                        const updateSingleEditOperation = getUpdateSyncOperation({
                            veventComponent: updatedSingleEditVevent,
                            calendarEvent: event,
                            hasDefaultNotifications: hasModifiedNotifications
                                ? false
                                : getHasDefaultNotifications(event),
                            isAttendee: false,
                            isBreakingChange: false,
                            isPersonalSingleEdit: event.IsPersonalSingleEdit,
                            addedAttendeesPublicKeysMap: addedAttendeesSingleEditPublicKeysMap,
                            removedAttendeesEmails: updatedSingleEditInviteActions.removedAttendees?.map(
                                unary(getAttendeeEmail)
                            ),
                            resetNotes: isBreakingChange,
                        });
                        updateSingleEditOperations.push(updateSingleEditOperation);
                    })
                );
            } else {
                singleEditIcsPromises.push(
                    ...singleEditRecurrences
                        .filter((event) => !getIsPersonalSingleEdit(event))
                        .map(async (event) => {
                            const { veventComponent } = await getCalendarEventRaw(event);
                            const cancelSingleEditInviteActions = {
                                ...updatedInviteActions,
                                type: INVITE_ACTION_TYPES.CANCEL_INVITATION,
                                sharedEventID: event.SharedEventID,
                                recurringType: RECURRING_TYPES.ALL,
                            };
                            return sendIcs({
                                inviteActions: cancelSingleEditInviteActions,
                                cancelVevent: veventComponent,
                                // Do not re-check send preferences errors for single edits as they were checked for the main event already,
                                // and it's currently not possible to have a different list of attendees in the single edits
                                // TODO: Move send preference error check outside of sendIcs
                                sendPreferencesMap: sendPrefsMapAfterSendPrefsCheck,
                                noCheckSendPrefs: true,
                            });
                        })
                );
            }
            const [{ veventComponent: cleanVeventComponent, inviteActions: cleanInviteActions, sendPreferencesMap }] =
                await Promise.all([originalIcsPromise, ...singleEditIcsPromises]);

            if (cleanVeventComponent) {
                updatedVeventComponent = cleanVeventComponent;
                updatedInviteActions = cleanInviteActions;
                addedAttendeesPublicKeysMap = getAddedAttendeesPublicKeysMap({
                    veventComponent: updatedVeventComponent,
                    inviteActions: updatedInviteActions,
                    sendPreferencesMap,
                });
            }
        } else if (updateAllPossibilities === UpdateAllPossibilities.KEEP_SINGLE_MODIFICATIONS) {
            deleteOperations = [];
            const oldVevent = isSingleEdit ? oldVeventComponent : originalVeventComponent;
            const updateMergeVevent = getUpdateSingleEditMergeVevent(newVeventComponent, oldVevent);
            // implement the so-called smart rules for "edit all", namely propagate changed fields to single edits
            await Promise.all(
                singleEditRecurrences.map(async (event) => {
                    const { veventComponent } = await getCalendarEventRaw(event);
                    const updateSingleEditMergeVevent = {
                        ...updateMergeVevent,
                    };
                    const hasAllDayChanged = getIsAllDay(veventComponent) !== getIsAllDay(oldVevent);

                    if (hasAllDayChanged) {
                        // Ignore changes to notifications
                        delete updateSingleEditMergeVevent.components;
                    }

                    const hasModifiedNotifications = getHasNotificationsMergeUpdate(
                        veventComponent,
                        updateSingleEditMergeVevent
                    );
                    if (!getHasMergeUpdate(veventComponent, updateSingleEditMergeVevent)) {
                        return;
                    }
                    const updatedSingleEditVevent = {
                        ...veventComponent,
                        ...updateSingleEditMergeVevent,
                    };

                    handleConferenceDataInMergedVeventIfNeeded(updatedSingleEditVevent);

                    const updateSingleEditOperation = getUpdateSyncOperation({
                        veventComponent: updatedSingleEditVevent,
                        calendarEvent: event,
                        hasDefaultNotifications: hasModifiedNotifications ? false : getHasDefaultNotifications(event),
                        isAttendee,
                        isBreakingChange: false,
                        isPersonalSingleEdit: event.IsPersonalSingleEdit,
                        resetNotes: isBreakingChange,
                    });
                    updateSingleEditOperations.push(updateSingleEditOperation);
                })
            );
        }
        const updateOriginalOperation = getUpdateSyncOperation({
            veventComponent: updatedVeventComponent,
            calendarEvent: originalEvent,
            hasDefaultNotifications,
            isAttendee,
            isBreakingChange,
            removedAttendeesEmails: updatedInviteActions.removedAttendees?.map(unary(getAttendeeEmail)),
            addedAttendeesPublicKeysMap,
            resetNotes: isBreakingChange,
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
                        operations: [updateOriginalOperation],
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
                    operations: [...deleteOperations, updateOriginalOperation, ...updateSingleEditOperations],
                },
            ],
            inviteActions: updatedInviteActions,
            hasStartChanged,
        };
    }

    throw new Error('Unknown type');
};

export default getSaveRecurringEventActions;
