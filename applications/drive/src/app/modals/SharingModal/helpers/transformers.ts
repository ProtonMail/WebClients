import type { Recipient } from '@proton/shared/lib/interfaces';

import type { ShareInvitee } from '../../../store';

export const inviteesToRecipients = (invitees: ShareInvitee[]): Recipient[] => {
    return invitees.map((invitee) => ({
        Name: invitee.name,
        Address: invitee.email,
        ContactID: invitee.contactId,
        Group: invitee.group,
    }));
};
export const recipientsToInvitees = (recipients: Recipient[]): ShareInvitee[] => {
    return recipients.map((recipient) => ({
        name: recipient.Name,
        email: recipient.Address,
        contactId: recipient.ContactID,
        group: recipient.Group,
    }));
};
