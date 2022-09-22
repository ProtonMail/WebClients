import { PublicKeyReference } from '@proton/crypto';
import { getAttendeeEmail } from '@proton/shared/lib/calendar/attendees';
import { ICAL_METHOD, SAVE_CONFIRMATION_TYPES } from '@proton/shared/lib/calendar/constants';
import { getUpdatedInviteVevent } from '@proton/shared/lib/calendar/integration/invite';
import { getHasStartChanged } from '@proton/shared/lib/calendar/vcalConverter';
import { getBase64SharedSessionKey } from '@proton/shared/lib/calendar/veventHelper';
import { omit } from '@proton/shared/lib/helpers/object';
import { Address, SimpleMap } from '@proton/shared/lib/interfaces';
import { SyncMultipleApiResponse, VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar';
import { GetCalendarKeys } from '@proton/shared/lib/interfaces/hooks/GetCalendarKeys';
import { SendPreferences } from '@proton/shared/lib/interfaces/mail/crypto';
import unary from '@proton/utils/unary';

import { EventNewData, EventOldData } from '../../../interfaces/EventData';
import {
    CleanSendIcsActionData,
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
import { OnSaveConfirmationCb } from '../interface';
import { withUpdatedDtstamp } from './dtstamp';
import getChangePartstatActions from './getChangePartstatActions';
import { getUpdatePersonalPartActions } from './getUpdatePersonalPartActions';
import { getAddedAttendeesPublicKeysMap } from './inviteActions';

const { SEND_INVITATION, SEND_UPDATE, CHANGE_PARTSTAT } = INVITE_ACTION_TYPES;

interface SaveEventHelperArguments {
    oldEditEventData?: EventOldData;
    newEditEventData: EventNewData;
    selfAddress?: Address;
    isAttendee: boolean;
    inviteActions: InviteActions;
    onSaveConfirmation: OnSaveConfirmationCb;
    getCalendarKeys: GetCalendarKeys;
    sendIcs: (
        data: SendIcsActionData,
        calendarID?: string
    ) => Promise<{
        veventComponent?: VcalVeventComponent;
        inviteActions: InviteActions;
        timestamp: number;
        sendPreferencesMap: SimpleMap<SendPreferences>;
    }>;
    reencryptSharedEvent: (data: ReencryptInviteActionData) => Promise<void>;
    onSendPrefsErrors: (data: SendIcsActionData) => Promise<CleanSendIcsActionData>;
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
    selfAddress,
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
            removedAttendeesEmails: updatedInviteActions.removedAttendees?.map(unary(getAttendeeEmail)),
            isAttendee,
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
        const isSendType = [SEND_INVITATION, SEND_UPDATE].includes(inviteType);
        const method = isSendType ? ICAL_METHOD.REQUEST : undefined;
        const veventComponentWithUpdatedDtstamp = withUpdatedDtstamp(newVeventComponent, oldVeventComponent);
        let updatedVeventComponent = getUpdatedInviteVevent(
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
            isAttendee,
            removedAttendeesEmails: updatedInviteActions.removedAttendees?.map(unary(getAttendeeEmail)),
            addedAttendeesPublicKeysMap,
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
    let updatedVeventComponent = newVeventComponent;
    let updatedInviteActions = inviteActions;
    let intermediateEvent;
    let addedAttendeesPublicKeysMap: SimpleMap<PublicKeyReference> | undefined;
    if (inviteType === SEND_INVITATION) {
        if (!selfAddress) {
            throw new Error('Cannot create an event without user address');
        }
        await onSaveConfirmation({
            type: SAVE_CONFIRMATION_TYPES.SINGLE,
            inviteActions,
            isAttendee: false,
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
        const createIntermediateOperation = getCreateSyncOperation({
            veventComponent: omit(updatedVeventComponent, ['attendee']),
        });
        const syncIntermediateActions = [
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
        ] = await handleSyncActions(syncIntermediateActions);
        intermediateEvent = Event;
        if (!intermediateEvent) {
            throw new Error('Failed to generate intermediate event');
        }
        const sharedSessionKey = await getBase64SharedSessionKey({
            calendarEvent: intermediateEvent,
            getCalendarKeys,
        });
        if (sharedSessionKey) {
            updatedInviteActions.sharedEventID = intermediateEvent.SharedEventID;
            updatedInviteActions.sharedSessionKey = sharedSessionKey;
        }
        const {
            veventComponent: finalVeventComponent,
            inviteActions: finalInviteActions,
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
        );
        if (finalVeventComponent) {
            updatedVeventComponent = finalVeventComponent;
            updatedInviteActions = finalInviteActions;
        }
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
              isAttendee,
              addedAttendeesPublicKeysMap,
          })
        : getCreateSyncOperation({ veventComponent: updatedVeventComponent, addedAttendeesPublicKeysMap });
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
