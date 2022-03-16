import { CalendarEvent, VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar';
import { InviteActions, ReencryptInviteActionData } from '../../../interfaces/Invite';

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

export const getUpdatePersonalPartActions = async ({
    eventComponent,
    event,
    memberID,
    addressID,
    reencryptionCalendarID,
    inviteActions,
    reencryptSharedEvent,
}: {
    eventComponent: VcalVeventComponent;
    event: CalendarEvent;
    memberID: string;
    addressID: string;
    reencryptionCalendarID?: string;
    inviteActions: InviteActions;
    reencryptSharedEvent: (data: ReencryptInviteActionData) => Promise<void>;
}) => {
    // Re-encrypt shared event first if needed
    if (reencryptionCalendarID) {
        await reencryptSharedEvent({ calendarEvent: event, calendarID: reencryptionCalendarID });
    }
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
