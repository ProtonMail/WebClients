import { reformatApiErrorMessage } from '@proton/shared/lib/calendar/api';
import { getAttendeeEmail } from '@proton/shared/lib/calendar/attendees';
import { getHasRecurrenceId } from '@proton/shared/lib/calendar/vcalHelper';
import { SimpleMap } from '@proton/shared/lib/interfaces';
import { VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar';

import { AugmentedSendPreferences } from '../containers/calendar/interface';
import { INVITE_ACTION_TYPES, InviteActions } from '../interfaces/Invite';

const { CHANGE_PARTSTAT, DECLINE_INVITATION, NONE, SEND_INVITATION, CANCEL_INVITATION, SEND_UPDATE } =
    INVITE_ACTION_TYPES;

export const getCleanSendDataFromSendPref = ({
    emailsWithError,
    sendPreferencesMap,
    inviteActions,
    vevent,
    cancelVevent,
}: {
    sendPreferencesMap: SimpleMap<AugmentedSendPreferences>;
    inviteActions: InviteActions;
    vevent: VcalVeventComponent;
    cancelVevent?: VcalVeventComponent;
    emailsWithError: string[];
}) => {
    const { type, addedAttendees = [], removedAttendees = [] } = inviteActions;
    const hasAddedAttendees = !!addedAttendees.length;
    const hasRemovedAttendees = !!removedAttendees.length;
    const addedCleanAttendees = addedAttendees.filter(
        (attendee) => !emailsWithError.includes(getAttendeeEmail(attendee))
    );
    const invitedEmails = (vevent?.attendee || []).map((attendee) => getAttendeeEmail(attendee));
    const addedEmails = addedAttendees.map((attendee) => getAttendeeEmail(attendee));
    const addedEmailsWithError = addedEmails.filter((email) => emailsWithError.includes(email));
    const existingEmails = invitedEmails.filter((email) => !addedEmails.includes(email));
    const removedCleanAttendees = removedAttendees.filter(
        (attendee) => !emailsWithError.includes(getAttendeeEmail(attendee))
    );
    const removedEmails = removedAttendees.map((attendee) => getAttendeeEmail(attendee));
    const removedEmailsWithError = removedEmails.filter((email) => emailsWithError.includes(email));
    const invitedCleanAttendees = vevent?.attendee?.filter(
        (attendee) => !emailsWithError.includes(getAttendeeEmail(attendee))
    );
    const invitedCleanOfAddedAttendees = vevent?.attendee?.filter((attendee) => {
        const email = getAttendeeEmail(attendee);
        return existingEmails.includes(email) || !emailsWithError.includes(email);
    });
    const invitedEmailsWithError = (vevent?.attendee || [])
        .map((attendee) => getAttendeeEmail(attendee))
        .filter((email) => emailsWithError.includes(email));
    const cancelledCleanAttendees = cancelVevent?.attendee?.filter(
        (attendee) => !emailsWithError.includes(getAttendeeEmail(attendee))
    );
    const cancelledEmailsWithError = (cancelVevent?.attendee || [])
        .map((attendee) => getAttendeeEmail(attendee))
        .filter((email) => emailsWithError.includes(email));
    const organizerEmail = vevent?.organizer ? getAttendeeEmail(vevent.organizer) : undefined;
    const organizerEmailWithError =
        organizerEmail && emailsWithError.includes(organizerEmail) ? organizerEmail : undefined;

    const cleanData = {
        inviteActions: {
            ...inviteActions,
            addedAttendees: addedCleanAttendees,
        },
        vevent: {
            ...vevent,
            attendee: invitedCleanOfAddedAttendees || [],
        },
        cancelVevent,
        sendPreferencesMap,
        emailsWithError: [],
    };

    if (type === SEND_INVITATION) {
        if (!vevent) {
            throw new Error('Cannot create event without vevent component');
        }
        if (!hasAddedAttendees && !hasRemovedAttendees) {
            if (getHasRecurrenceId(vevent)) {
                // we're creating a single edit, in that case we want to keep attendees with errors
                return {
                    ...cleanData,
                    inviteActions: {
                        ...cleanData.inviteActions,
                    },
                    emailsWithError: [...invitedEmailsWithError, ...addedEmailsWithError, ...removedEmailsWithError],
                };
            }
            // it's a new invitation
            return {
                ...cleanData,
                vevent: {
                    ...vevent,
                    attendee: invitedCleanAttendees,
                },
                inviteActions: {
                    ...cleanData.inviteActions,
                    type: invitedCleanAttendees?.length
                        ? INVITE_ACTION_TYPES.SEND_INVITATION
                        : INVITE_ACTION_TYPES.NONE,
                },
                emailsWithError: invitedEmailsWithError,
            };
        }
        // the event exists already
        const hasAddedOrRemoved = addedCleanAttendees.length || removedCleanAttendees.length;
        return {
            ...cleanData,
            inviteActions: {
                ...cleanData.inviteActions,
                type: hasAddedOrRemoved ? SEND_INVITATION : NONE,
            },
            emailsWithError: [...addedEmailsWithError, ...removedEmailsWithError],
        };
    }
    if (type === SEND_UPDATE) {
        const cannotNotify = !invitedCleanAttendees?.length && !removedCleanAttendees?.length;
        return {
            ...cleanData,
            inviteActions: {
                ...cleanData.inviteActions,
                type: cannotNotify ? NONE : SEND_UPDATE,
            },
            emailsWithError: [...invitedEmailsWithError, ...addedEmailsWithError, ...removedEmailsWithError],
        };
    }
    if (type === CANCEL_INVITATION) {
        return {
            ...cleanData,
            inviteActions: {
                ...cleanData.inviteActions,
                type: cancelledCleanAttendees?.length ? CANCEL_INVITATION : NONE,
            },
            emailsWithError: cancelledEmailsWithError,
        };
    }
    if ([CHANGE_PARTSTAT, DECLINE_INVITATION].includes(type)) {
        return {
            sendPreferencesMap,
            inviteActions: {
                ...inviteActions,
                type: NONE,
            },
            vevent,
            cancelVevent,
            emailsWithError: [organizerEmailWithError],
        };
    }
    return cleanData;
};

export const getSendPrefErrorMap = (sendPreferencesMap: SimpleMap<AugmentedSendPreferences>) => {
    return Object.entries(sendPreferencesMap).reduce<SimpleMap<string>>((acc, [email, sendPrefs]) => {
        const error = sendPrefs?.error;
        if (error) {
            acc[email] = reformatApiErrorMessage(error.message);
        }
        return acc;
    }, {});
};
