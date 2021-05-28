import { getCanonicalEmails } from 'proton-shared/lib/calendar/attendees';
import { ICAL_METHOD, SAVE_CONFIRMATION_TYPES } from 'proton-shared/lib/calendar/constants';
import { getUpdatedInviteVevent } from 'proton-shared/lib/calendar/integration/invite';
import { omit } from 'proton-shared/lib/helpers/object';
import { Address } from 'proton-shared/lib/interfaces';
import { SyncMultipleApiResponse, VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar';
import { GetCanonicalEmailsMap } from 'proton-shared/lib/interfaces/hooks/GetCanonicalEmailsMap';
import { useGetCalendarKeys } from 'react-components/hooks/useGetDecryptedPassphraseAndCalendarKeys';
import {
    CleanSendIcsActionData,
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
import { OnSaveConfirmationCb } from '../interface';
import { EventNewData, EventOldData } from '../../../interfaces/EventData';
import getChangePartstatActions from './getChangePartstatActions';
import { getUpdatePersonalPartActions } from './getUpdatePersonalPartActions';
import { withUpdatedDtstamp } from './dtstamp';
import { getSharedEventIDAndSessionKey } from '../event/getEventHelper';

const { SEND_INVITATION, SEND_UPDATE, CHANGE_PARTSTAT } = INVITE_ACTION_TYPES;

interface SaveEventHelperArguments {
    oldEditEventData?: EventOldData;
    newEditEventData: EventNewData;
    selfAddress?: Address;
    inviteActions: InviteActions;
    onSaveConfirmation: OnSaveConfirmationCb;
    getCalendarKeys: ReturnType<typeof useGetCalendarKeys>;
    getCanonicalEmailsMap: GetCanonicalEmailsMap;
    sendIcs: (
        data: SendIcsActionData
    ) => Promise<{ veventComponent?: VcalVeventComponent; inviteActions: InviteActions; timestamp: number }>;
    onSendPrefsErrors: (data: SendIcsActionData) => Promise<CleanSendIcsActionData>;
    onDuplicateAttendees: (veventComponent: VcalVeventComponent, inviteActions: InviteActions) => Promise<void>;
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
    selfAddress,
    inviteActions,
    getCalendarKeys,
    getCanonicalEmailsMap,
    onSaveConfirmation,
    sendIcs,
    onSendPrefsErrors,
    onDuplicateAttendees,
    handleSyncActions,
}: SaveEventHelperArguments): Promise<{
    multiSyncActions: SyncEventActionOperations[];
    inviteActions: InviteActions;
    updatePartstatActions?: UpdatePartstatOperation[];
    updatePersonalPartActions?: UpdatePersonalPartOperation[];
}> => {
    const oldEvent = oldEditEventData?.eventData;
    const oldCalendarID = oldEditEventData?.calendarID;
    const oldAddressID = oldEditEventData?.addressID;
    const oldMemberID = oldEditEventData?.memberID;
    const oldVeventComponent = oldEditEventData?.veventComponent;

    const { type: inviteType } = inviteActions;
    const isUpdateEvent = !!oldEvent;
    const isSwitchCalendar = isUpdateEvent && oldCalendarID !== newCalendarID;

    await onDuplicateAttendees(newVeventComponent, inviteActions);

    if (isSwitchCalendar) {
        if (!oldEvent || !oldVeventComponent) {
            throw new Error('Missing event');
        }
        const isSendType = [SEND_INVITATION, SEND_UPDATE].includes(inviteType);
        const method = isSendType ? ICAL_METHOD.REQUEST : undefined;
        const veventComponentWithUpdatedDtstamp = withUpdatedDtstamp(newVeventComponent, oldVeventComponent);
        const updatedVeventComponent = getUpdatedInviteVevent(
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
                'Cannot add participants and change calendar simultaneously. Please do the operations separately'
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
        const removedAttendeeEmails = await getCanonicalEmails(
            updatedInviteActions.removedAttendees,
            getCanonicalEmailsMap
        );
        const updateOperation = getUpdateSyncOperation(updatedVeventComponent, oldEvent, removedAttendeeEmails);
        const deleteOperation = getDeleteSyncOperation(oldEvent);
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
        return { multiSyncActions, inviteActions: updatedInviteActions };
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
        const isSendType = [SEND_INVITATION, SEND_UPDATE].includes(inviteType);
        const method = isSendType ? ICAL_METHOD.REQUEST : undefined;
        const veventComponentWithUpdatedDtstamp = withUpdatedDtstamp(newVeventComponent, oldVeventComponent);
        let updatedVeventComponent = getUpdatedInviteVevent(
            veventComponentWithUpdatedDtstamp,
            oldVeventComponent,
            method
        );
        let updatedInviteActions = inviteActions;
        if (isSendType) {
            await onSaveConfirmation({
                type: SAVE_CONFIRMATION_TYPES.SINGLE,
                inviteActions,
                isInvitation: false,
            });
            const { veventComponent: cleanVeventComponent, inviteActions: cleanInviteActions } = await sendIcs({
                inviteActions,
                vevent: updatedVeventComponent,
                cancelVevent: oldVeventComponent,
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
        const updateOperation = getUpdateSyncOperation(updatedVeventComponent, oldEvent, removedAttendeeEmails);
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
        return { multiSyncActions, inviteActions: updatedInviteActions };
    }

    // it's a new event
    let updatedVeventComponent = newVeventComponent;
    let updatedInviteActions = inviteActions;
    let intermediateEvent;
    if (inviteType === SEND_INVITATION) {
        if (!selfAddress) {
            throw new Error('Cannot create an event without user address');
        }
        await onSaveConfirmation({
            type: SAVE_CONFIRMATION_TYPES.SINGLE,
            inviteActions,
            isInvitation: false,
        });
        const { inviteActions: cleanInviteActions, vevent: cleanVevent } = await onSendPrefsErrors({
            inviteActions,
            vevent: updatedVeventComponent,
        });

        if (!cleanVevent) {
            throw new Error('Failed to clean event component');
        }

        [updatedInviteActions, updatedVeventComponent] = [cleanInviteActions, cleanVevent];

        // we need to get a SharedEventID before sending out the invitation
        // for that we will save the event first without attendees
        const createIntermediateOperation = getCreateSyncOperation(omit(updatedVeventComponent, ['attendee']));
        const multiSyncIntermediateActions = [
            {
                calendarID: newCalendarID,
                addressID: newAddressID,
                memberID: newMemberID,
                operations: [createIntermediateOperation],
            },
        ];
        const [
            {
                Responses: [
                    {
                        Response: { Event },
                    },
                ],
            },
        ] = await handleSyncActions(multiSyncIntermediateActions);
        intermediateEvent = Event;
        const { sharedEventID, sharedSessionKey } = await getSharedEventIDAndSessionKey({
            calendarEvent: intermediateEvent,
            getCalendarKeys,
        });
        if (sharedEventID && sharedSessionKey) {
            updatedInviteActions.sharedEventID = sharedEventID;
            updatedInviteActions.sharedSessionKey = sharedSessionKey;
        }
        const { veventComponent: finalVeventComponent, inviteActions: finalInviteActions } = await sendIcs({
            inviteActions: updatedInviteActions,
            vevent: updatedVeventComponent,
            cancelVevent: oldVeventComponent,
            noCheck: true,
        });
        if (finalVeventComponent) {
            updatedVeventComponent = finalVeventComponent;
            updatedInviteActions = finalInviteActions;
        }
    }

    const createOrUpdateOperation = intermediateEvent
        ? getUpdateSyncOperation(updatedVeventComponent, intermediateEvent)
        : getCreateSyncOperation(updatedVeventComponent);
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
