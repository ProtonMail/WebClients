import type { PublicKeyReference } from '@proton/crypto';
import { getIsAutoAddedInvite } from '@proton/shared/lib/calendar/apiModels';
import { getAttendeeEmail } from '@proton/shared/lib/calendar/attendees';
import { ICAL_METHOD, SAVE_CONFIRMATION_TYPES } from '@proton/shared/lib/calendar/constants';
import { getInviteVeventWithUpdatedParstats } from '@proton/shared/lib/calendar/mailIntegration/invite';
import { getHasStartChanged } from '@proton/shared/lib/calendar/vcalConverter';
import type { SimpleMap } from '@proton/shared/lib/interfaces';
import type { SyncMultipleApiResponse, VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar';
import type { GetCalendarKeys } from '@proton/shared/lib/interfaces/hooks/GetCalendarKeys';
import unary from '@proton/utils/unary';

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
import type { SyncEventActionOperations } from '../getSyncMultipleEventsPayload';
import {
    getCreateSyncOperation,
    getDeleteSyncOperation,
    getUpdateSyncOperation,
} from '../getSyncMultipleEventsPayload';
import type { OnSaveConfirmationCb } from '../interface';
import { withUpdatedDtstamp } from './dtstamp';
import getChangePartstatActions from './getChangePartstatActions';
import { createIntermediateEvent } from './getSaveEventActionsHelpers';
import { getUpdatePersonalPartActions } from './getUpdatePersonalPartActions';
import { getAddedAttendeesPublicKeysMap } from './inviteActions';

const { SEND_INVITATION, SEND_UPDATE, CHANGE_PARTSTAT } = INVITE_ACTION_TYPES;

interface SaveEventHelperArguments {
    oldEditEventData?: EventOldData;
    newEditEventData: EventNewData;
    hasDefaultNotifications: boolean;
    canEditOnlyPersonalPart: boolean;
    isAttendee: boolean;
    inviteActions: InviteActions;
    onSaveConfirmation: OnSaveConfirmationCb;
    getCalendarKeys: GetCalendarKeys;
    sendIcs: SendIcs;
    reencryptSharedEvent: (data: ReencryptInviteActionData) => Promise<void>;
    onSendPrefsErrors: OnSendPrefsErrors;
    onEquivalentAttendees: (veventComponent: VcalVeventComponent, inviteActions: InviteActions) => Promise<void>;
    handleSyncActions: (actions: SyncEventActionOperations[]) => Promise<SyncMultipleApiResponse[]>;
}
const getSaveSingleEventActions = async ({
    oldEditEventData,
    newEditEventData: {
        calendarID: newCalendarID,
        addressID: newAddressID,
        memberID: newMemberID,
        veventComponent: newVeventComponent,
    },
    hasDefaultNotifications,
    canEditOnlyPersonalPart,
    isAttendee,
    inviteActions,
    getCalendarKeys,
    onSaveConfirmation,
    sendIcs,
    reencryptSharedEvent,
    onSendPrefsErrors,
    onEquivalentAttendees,
    handleSyncActions,
}: SaveEventHelperArguments): Promise<{
    multiSyncActions: SyncEventActionOperations[];
    inviteActions: InviteActions;
    updatePartstatActions?: UpdatePartstatOperation[];
    updatePersonalPartActions?: UpdatePersonalPartOperation[];
    sendActions?: SendIcsActionData[];
    hasStartChanged?: boolean;
}> => {
    const oldEvent = oldEditEventData?.eventData;
    const oldCalendarID = oldEditEventData?.calendarID;
    const oldAddressID = oldEditEventData?.addressID;
    const oldMemberID = oldEditEventData?.memberID;
    const oldVeventComponent = oldEditEventData?.veventComponent;

    const hasStartChanged = oldVeventComponent ? getHasStartChanged(newVeventComponent, oldVeventComponent) : true;

    const { type: inviteType } = inviteActions;
    const isUpdateEvent = !!oldEvent;
    const isSwitchCalendar = isUpdateEvent && oldCalendarID !== newCalendarID;

    await onEquivalentAttendees(newVeventComponent, inviteActions);

    if (isSwitchCalendar) {
        if (!oldEvent || !oldVeventComponent) {
            throw new Error('Missing event');
        }

        const isSendType = [SEND_INVITATION, SEND_UPDATE].includes(inviteType);
        const method = isSendType ? ICAL_METHOD.REQUEST : undefined;
        const veventComponentWithUpdatedDtstamp = withUpdatedDtstamp(newVeventComponent, oldVeventComponent);
        const updatedVeventComponent = getInviteVeventWithUpdatedParstats(
            veventComponentWithUpdatedDtstamp,
            oldVeventComponent,
            method
        );
        const updatedInviteActions = inviteActions;

        if (!oldCalendarID || !oldAddressID || !oldMemberID) {
            throw new Error('Missing parameters to switch calendar');
        }

        if (isSendType) {
            // Temporary hotfix to an API issue
            throw new Error(
                'Cannot add participants and change calendar simultaneously. Please change the calendar first'
            );
            // await onSaveConfirmation({
            //     type: SAVE_CONFIRMATION_TYPES.SINGLE,
            //     inviteActions,
            //     isInvitation: false,
            // });
            // const { veventComponent: cleanVeventComponent, inviteActions: cleanInviteActions } = await sendIcs({
            //     inviteActions,
            //     vevent: updatedVeventComponent,
            //     cancelVevent: oldVeventComponent,
            // });
            // if (cleanVeventComponent) {
            //     updatedVeventComponent = cleanVeventComponent;
            //     updatedInviteActions = cleanInviteActions;
            // }
        }
        const updateOperation = getUpdateSyncOperation({
            veventComponent: updatedVeventComponent,
            calendarEvent: oldEvent,
            hasDefaultNotifications,
            removedAttendeesEmails: updatedInviteActions.removedAttendees?.map(unary(getAttendeeEmail)),
            isAttendee,
            resetNotes: oldVeventComponent.sequence !== updatedVeventComponent.sequence,
        });
        const deleteOperation = getDeleteSyncOperation(oldEvent, isSwitchCalendar);
        const multiSyncActions = [
            {
                calendarID: newCalendarID,
                addressID: newAddressID,
                memberID: newMemberID,
                operations: [updateOperation],
            },
            {
                calendarID: oldCalendarID,
                addressID: oldAddressID,
                memberID: oldMemberID,
                operations: [deleteOperation],
            },
        ];
        return { multiSyncActions, inviteActions: updatedInviteActions, hasStartChanged };
    }

    if (isUpdateEvent) {
        if (!oldEvent || !oldVeventComponent || !oldCalendarID || !oldAddressID || !oldMemberID) {
            throw new Error('Missing parameters to update event');
        }

        if (inviteType === CHANGE_PARTSTAT) {
            // the attendee changes answer
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

        const isSendType = [SEND_INVITATION, SEND_UPDATE].includes(inviteType);
        const method = isSendType ? ICAL_METHOD.REQUEST : undefined;
        const veventComponentWithUpdatedDtstamp = withUpdatedDtstamp(newVeventComponent, oldVeventComponent);
        let updatedVeventComponent = getInviteVeventWithUpdatedParstats(
            veventComponentWithUpdatedDtstamp,
            oldVeventComponent,
            method
        );
        let updatedInviteActions = inviteActions;
        let addedAttendeesPublicKeysMap: SimpleMap<PublicKeyReference> | undefined;

        if (isSendType) {
            await onSaveConfirmation({
                type: SAVE_CONFIRMATION_TYPES.SINGLE,
                inviteActions,
                isAttendee: false,
                isOrganizer: true,
                canEditOnlyPersonalPart: false,
            });
            const {
                veventComponent: cleanVeventComponent,
                inviteActions: cleanInviteActions,
                sendPreferencesMap,
            } = await sendIcs({
                inviteActions,
                vevent: updatedVeventComponent,
                cancelVevent: oldVeventComponent,
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
            calendarEvent: oldEvent,
            hasDefaultNotifications,
            isAttendee,
            removedAttendeesEmails: updatedInviteActions.removedAttendees?.map(unary(getAttendeeEmail)),
            addedAttendeesPublicKeysMap,
            resetNotes: oldVeventComponent.sequence !== updatedVeventComponent.sequence,
        });

        if (!oldCalendarID || !oldAddressID || !oldMemberID) {
            throw new Error('Missing parameters to update event');
        }

        const multiSyncActions = [
            {
                calendarID: oldCalendarID,
                addressID: newAddressID,
                memberID: newMemberID,
                operations: [updateOperation],
            },
        ];

        return { multiSyncActions, inviteActions: updatedInviteActions, hasStartChanged };
    }

    // it's a new event
    let updatedVeventComponent: VcalVeventComponent | undefined = newVeventComponent;
    let updatedInviteActions = inviteActions;
    let intermediateEvent;
    let sendPreferencesMap;
    let addedAttendeesPublicKeysMap: SimpleMap<PublicKeyReference> | undefined;

    if (inviteType === SEND_INVITATION) {
        await onSaveConfirmation({
            type: SAVE_CONFIRMATION_TYPES.SINGLE,
            inviteActions,
            isAttendee: false,
            isOrganizer: true,
            canEditOnlyPersonalPart: false,
        });
        ({
            intermediateEvent,
            vevent: updatedVeventComponent,
            inviteActions: updatedInviteActions,
        } = await createIntermediateEvent({
            inviteActions: updatedInviteActions,
            vevent: updatedVeventComponent,
            hasDefaultNotifications,
            calendarID: newCalendarID,
            addressID: newAddressID,
            memberID: newMemberID,
            getCalendarKeys,
            onSendPrefsErrors,
            handleSyncActions,
        }));

        ({
            veventComponent: updatedVeventComponent,
            inviteActions: updatedInviteActions,
            sendPreferencesMap,
        } = await sendIcs(
            {
                inviteActions: updatedInviteActions,
                vevent: updatedVeventComponent,
                cancelVevent: oldVeventComponent,
                noCheckSendPrefs: true,
            },
            // we pass the calendarID here as we want to call the event manager in case the operation fails
            newCalendarID
        ));

        addedAttendeesPublicKeysMap = getAddedAttendeesPublicKeysMap({
            veventComponent: updatedVeventComponent,
            inviteActions: updatedInviteActions,
            sendPreferencesMap,
        });
    }

    const createOrUpdateOperation = intermediateEvent
        ? getUpdateSyncOperation({
              veventComponent: updatedVeventComponent,
              calendarEvent: intermediateEvent,
              hasDefaultNotifications,
              isAttendee,
              addedAttendeesPublicKeysMap,
              resetNotes: oldVeventComponent?.sequence !== updatedVeventComponent.sequence,
          })
        : getCreateSyncOperation({
              veventComponent: updatedVeventComponent,
              hasDefaultNotifications,
              addedAttendeesPublicKeysMap,
          });
    const multiSyncActions = [
        {
            calendarID: newCalendarID,
            addressID: newAddressID,
            memberID: newMemberID,
            operations: [createOrUpdateOperation],
        },
    ];
    return { multiSyncActions, inviteActions: updatedInviteActions };
};

export default getSaveSingleEventActions;
