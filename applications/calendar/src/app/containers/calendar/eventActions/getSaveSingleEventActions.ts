import { EventOldData, EventNewData } from '../../../interfaces/EventData';
import {
    getCreateSyncOperation,
    getDeleteSyncOperation,
    getUpdateSyncOperation,
    SyncEventActionOperations,
} from '../getSyncMultipleEventsPayload';

interface SaveEventHelperArguments {
    oldEditEventData?: EventOldData;
    newEditEventData: EventNewData;
}
const getSaveSingleEventActions = ({
    oldEditEventData,
    newEditEventData: {
        calendarID: newCalendarID,
        addressID: newAddressID,
        memberID: newMemberID,
        veventComponent: newVeventComponent,
    },
}: SaveEventHelperArguments): SyncEventActionOperations[] => {
    const oldEvent = oldEditEventData?.eventData;
    const oldCalendarID = oldEditEventData?.calendarID;
    const oldAddressID = oldEditEventData?.addressID;
    const oldMemberID = oldEditEventData?.memberID;

    const isUpdateEvent = !!oldEvent;
    const isSwitchCalendar = isUpdateEvent && oldCalendarID !== newCalendarID;

    if (isSwitchCalendar) {
        if (!oldEvent) {
            throw new Error('Missing event');
        }
        const updateOperation = getUpdateSyncOperation(newVeventComponent, oldEvent);
        const deleteOperation = getDeleteSyncOperation(oldEvent);
        if (!oldCalendarID || !oldAddressID || !oldMemberID) {
            throw new Error('Missing parameters to switch calendar');
        }
        return [
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
    }

    if (isUpdateEvent && oldEvent) {
        const updateOperation = getUpdateSyncOperation(newVeventComponent, oldEvent);
        if (!oldCalendarID || !oldAddressID || !oldMemberID) {
            throw new Error('Missing parameters to update event');
        }
        return [
            {
                calendarID: oldCalendarID,
                addressID: newAddressID,
                memberID: newMemberID,
                operations: [updateOperation],
            },
        ];
    }

    const createOperation = getCreateSyncOperation(newVeventComponent);
    return [
        {
            calendarID: newCalendarID,
            addressID: newAddressID,
            memberID: newMemberID,
            operations: [createOperation],
        },
    ];
};

export default getSaveSingleEventActions;
