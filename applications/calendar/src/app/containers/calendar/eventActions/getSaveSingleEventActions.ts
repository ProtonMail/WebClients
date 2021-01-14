import { ICAL_METHOD } from 'proton-shared/lib/calendar/constants';
import { getUpdatedInviteVevent } from 'proton-shared/lib/calendar/integration/invite';
import { Address } from 'proton-shared/lib/interfaces';
import { VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar';
import { SAVE_CONFIRMATION_TYPES } from '../../../constants';
import { EventNewData, EventOldData } from '../../../interfaces/EventData';
import { INVITE_ACTION_TYPES, InviteActions, SendIcsActionData } from '../../../interfaces/Invite';
import {
    getCreateSyncOperation,
    getDeleteSyncOperation,
    getUpdateSyncOperation,
    SyncEventActionOperations,
} from '../getSyncMultipleEventsPayload';
import { OnSaveConfirmationCb } from '../interface';

const { SEND_INVITATION, SEND_UPDATE, CHANGE_PARTSTAT } = INVITE_ACTION_TYPES;

interface SaveEventHelperArguments {
    oldEditEventData?: EventOldData;
    newEditEventData: EventNewData;
    selfAddress?: Address;
    onSaveConfirmation: OnSaveConfirmationCb;
    inviteActions: InviteActions;
    sendIcs: (
        data: SendIcsActionData
    ) => Promise<{ veventComponent?: VcalVeventComponent; inviteActions: InviteActions }>;
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
    onSaveConfirmation,
    inviteActions,
    sendIcs,
}: SaveEventHelperArguments): Promise<{
    multiSyncActions: SyncEventActionOperations[];
    inviteActions: InviteActions;
}> => {
    const oldEvent = oldEditEventData?.eventData;
    const oldCalendarID = oldEditEventData?.calendarID;
    const oldAddressID = oldEditEventData?.addressID;
    const oldMemberID = oldEditEventData?.memberID;
    const oldVeventComponent = oldEditEventData?.veventComponent;

    const { type: inviteType, partstat } = inviteActions;
    const isUpdateEvent = !!oldEvent;
    const isSwitchCalendar = isUpdateEvent && oldCalendarID !== newCalendarID;

    if (isSwitchCalendar) {
        if (!oldEvent || !oldVeventComponent) {
            throw new Error('Missing event');
        }
        const isSendType = [SEND_INVITATION, SEND_UPDATE].includes(inviteType);
        const method = isSendType ? ICAL_METHOD.REQUEST : undefined;
        let updatedVeventComponent = getUpdatedInviteVevent(newVeventComponent, oldVeventComponent, method);
        let updatedInviteActions = inviteActions;
        if (!oldCalendarID || !oldAddressID || !oldMemberID) {
            throw new Error('Missing parameters to switch calendar');
        }
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
        const updateOperation = getUpdateSyncOperation(updatedVeventComponent, oldEvent);
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

    if (isUpdateEvent && oldEvent && oldVeventComponent) {
        if (inviteType === CHANGE_PARTSTAT) {
            if (!partstat) {
                throw new Error('Cannot update participation status without new answer');
            }
            await sendIcs({ inviteActions, vevent: newVeventComponent });
        }
        const isSendType = [SEND_INVITATION, SEND_UPDATE].includes(inviteType);
        const method = isSendType ? ICAL_METHOD.REQUEST : undefined;
        let updatedVeventComponent = getUpdatedInviteVevent(newVeventComponent, oldVeventComponent, method);
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
        const updateOperation = getUpdateSyncOperation(updatedVeventComponent, oldEvent);
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

    let updatedVeventComponent = newVeventComponent;
    let updatedInviteActions = inviteActions;
    if (inviteType === SEND_INVITATION) {
        if (!selfAddress) {
            throw new Error('Cannot create an event without user address');
        }
        await onSaveConfirmation({
            type: SAVE_CONFIRMATION_TYPES.SINGLE,
            inviteActions,
            isInvitation: false,
        });
        const { veventComponent: cleanVeventComponent, inviteActions: cleanInviteActions } = await sendIcs({
            inviteActions,
            vevent: newVeventComponent,
            cancelVevent: oldVeventComponent,
        });
        if (cleanVeventComponent) {
            updatedVeventComponent = cleanVeventComponent;
            updatedInviteActions = cleanInviteActions;
        }
    }

    const createOperation = getCreateSyncOperation(updatedVeventComponent);
    const multiSyncActions = [
        {
            calendarID: newCalendarID,
            addressID: newAddressID,
            memberID: newMemberID,
            operations: [createOperation],
        },
    ];
    return { multiSyncActions, inviteActions: updatedInviteActions };
};

export default getSaveSingleEventActions;
