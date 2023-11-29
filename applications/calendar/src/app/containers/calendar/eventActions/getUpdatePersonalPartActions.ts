import { getVeventColorValue } from '@proton/shared/lib/calendar/veventHelper';
import { CalendarEvent, VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar';

import { InviteActions, ReencryptInviteActionData } from '../../../interfaces/Invite';

export const getUpdatePersonalPartOperation = ({
    eventComponent,
    hasDefaultNotifications,
    event,
    addressID,
}: {
    eventComponent: VcalVeventComponent;
    hasDefaultNotifications: boolean;
    event: CalendarEvent;
    addressID: string;
}) => {
    return {
        data: {
            addressID,
            calendarID: event.CalendarID,
            eventID: event.ID,
            eventComponent,
            hasDefaultNotifications,
            color: getVeventColorValue(eventComponent),
        },
    };
};

export const getUpdatePersonalPartActions = async ({
    eventComponent,
    hasDefaultNotifications,
    event,
    addressID,
    reencryptionCalendarID,
    inviteActions,
    reencryptSharedEvent,
}: {
    eventComponent: VcalVeventComponent;
    hasDefaultNotifications: boolean;
    event: CalendarEvent;
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
        hasDefaultNotifications,
        event,
        addressID,
    });
    return {
        multiSyncActions: [],
        updatePersonalPartActions: [updatePersonalPartAction],
        inviteActions,
    };
};
