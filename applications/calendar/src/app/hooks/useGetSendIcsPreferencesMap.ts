import { getAttendeeEmail } from '@proton/shared/lib/calendar/attendees';
import { getIcsMessageWithPreferences } from '@proton/shared/lib/calendar/integration/invite';
import { VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar';
import { ContactEmail } from '@proton/shared/lib/interfaces/contacts';
import { SendPreferences } from '@proton/shared/lib/interfaces/mail/crypto';
import { SimpleMap } from '@proton/shared/lib/interfaces/utils';
import getSendPreferences from '@proton/shared/lib/mail/send/getSendPreferences';
import { useCallback } from 'react';
import { useApi, useGetEncryptionPreferences, useGetMailSettings } from '@proton/components';
import { INVITE_ACTION_TYPES, InviteActions } from '../interfaces/Invite';

const { SEND_INVITATION, SEND_UPDATE, CHANGE_PARTSTAT, DECLINE_INVITATION, CANCEL_INVITATION } = INVITE_ACTION_TYPES;

const useGetSendIcsPreferencesMap = () => {
    const api = useApi();
    const getEncryptionPreferences = useGetEncryptionPreferences();
    const getMailSettings = useGetMailSettings();

    return useCallback(
        async ({
            inviteActions,
            vevent,
            cancelVevent,
            contactEmailsMap,
        }: {
            inviteActions: InviteActions;
            vevent?: VcalVeventComponent;
            cancelVevent?: VcalVeventComponent;
            contactEmailsMap?: SimpleMap<ContactEmail>;
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

            const { Sign } = await getMailSettings();
            const messageWithPreferences = getIcsMessageWithPreferences(Sign);

            const sendPreferencesMap: SimpleMap<SendPreferences> = {};
            await Promise.all(
                emails.map(async (email) => {
                    const encryptionPreferences = await getEncryptionPreferences(email, 0, contactEmailsMap);
                    const sendPreferences = getSendPreferences(encryptionPreferences, messageWithPreferences);
                    sendPreferencesMap[email] = sendPreferences;
                })
            );
            return sendPreferencesMap;
        },
        [api, getEncryptionPreferences, getMailSettings]
    );
};

export default useGetSendIcsPreferencesMap;
