import { CalendarEvent, VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar';
import { InviteActions } from '../../../interfaces/Invite';

export const getUpdatePersonalPartOperation = ({
    eventComponent,
    event,
    memberID,
    addressID,
}: {
    eventComponent: VcalVeventComponent;
    event: CalendarEvent;
    memberID: string;
    addressID: string;
}) => {
    return {
        data: {
            memberID,
            addressID,
            calendarID: event.CalendarID,
            eventID: event.ID,
            eventComponent,
        },
    };
};

export const getUpdatePersonalPartActions = ({
    eventComponent,
    event,
    memberID,
    addressID,
    inviteActions,
}: {
    eventComponent: VcalVeventComponent;
    event: CalendarEvent;
    memberID: string;
    addressID: string;
    inviteActions: InviteActions;
}) => {
    const updatePersonalPartAction = getUpdatePersonalPartOperation({
        eventComponent,
        event,
        memberID,
        addressID,
    });
    return {
        multiSyncActions: [],
        updatePersonalPartActions: [updatePersonalPartAction],
        inviteActions,
    };
};
