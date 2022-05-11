import {VcalVeventComponent} from "@proton/shared/lib/interfaces/calendar";
import {getAttendeeEmail} from "@proton/shared/lib/calendar/attendees";
import {INVITE_ACTION_TYPES, InviteActions} from "../interfaces/Invite";

const { SEND_INVITATION, SEND_UPDATE, CHANGE_PARTSTAT, DECLINE_INVITATION, CANCEL_INVITATION } = INVITE_ACTION_TYPES;

export const extractInviteEmails = ({ inviteActions, vevent, cancelVevent }: {
    inviteActions: InviteActions;
    vevent?: VcalVeventComponent;
    cancelVevent?: VcalVeventComponent;
}) => {
    const { type, addedAttendees, removedAttendees } = inviteActions;
    const hasAddedAttendees = !!addedAttendees?.length;
    const hasRemovedAttendees = !!removedAttendees?.length;
    const invitedEmails = vevent?.attendee?.map((attendee) => getAttendeeEmail(attendee));
    const addedEmails = addedAttendees?.map((attendee) => getAttendeeEmail(attendee));
    const removedEmails = removedAttendees?.map((attendee) => getAttendeeEmail(attendee));
    const cancelledEmails = cancelVevent?.attendee?.map((attendee) => getAttendeeEmail(attendee));
    const organizerEmail = vevent?.organizer ? getAttendeeEmail(vevent.organizer) : undefined;
    const emails: string[] = [];

    if (type === SEND_INVITATION) {
        if (!hasAddedAttendees && !hasRemovedAttendees && invitedEmails?.length) {
            emails.push(...invitedEmails);
        } else {
            if (addedEmails?.length) {
                emails.push(...addedEmails);
            }
            if (removedEmails?.length) {
                emails.push(...removedEmails);
            }
        }
    } else if (type === SEND_UPDATE) {
        if (invitedEmails?.length) {
            emails.push(...invitedEmails);
        }
        if (removedEmails?.length) {
            emails.push(...removedEmails);
        }
    } else if (type === CANCEL_INVITATION) {
        if (cancelledEmails?.length) {
            emails.push(...cancelledEmails);
        }
    } else if ([CHANGE_PARTSTAT, DECLINE_INVITATION].includes(type)) {
        if (organizerEmail) {
            emails.push(organizerEmail);
        }
    }

    return emails;
};
