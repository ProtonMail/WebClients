import type { CalendarWithOwnMembers } from '@proton/shared/lib/interfaces/calendar';

export const getCalendarAndOwner = (selectedCalendarId: string, calendars?: CalendarWithOwnMembers[]) => {
    const calendar = calendars?.find((calendar) => calendar.ID === selectedCalendarId);
    if (!calendar) {
        return;
    }

    const calendarOwner = calendar.Owner.Email;
    const ownerAddress = calendar.Members.find((member) => member.Email === calendarOwner);
    if (!ownerAddress) {
        return;
    }

    return {
        calendar,
        calendarOwner,
        ownerAddress,
    };
};
