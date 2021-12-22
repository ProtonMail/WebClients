import { getEmailParts, PROTONMAIL_DOMAINS, validateEmailAddress } from '@proton/shared/lib/helpers/email';
import { Recipient } from '@proton/shared/lib/interfaces';
import { ContactEmail } from '@proton/shared/lib/interfaces/contacts';

export const isValidEmailAdressToRefer = (address: string) => {
    const [, domain] = getEmailParts(address);
    const isValid = validateEmailAddress(address);
    return isValid && !PROTONMAIL_DOMAINS.includes(domain);
};

export const filterContactEmails = (contactEmails: ContactEmail[]) => {
    return contactEmails.filter((contact) => {
        if (isValidEmailAdressToRefer(contact.Email)) {
            return true;
        }
        return false;
    });
};

export const deduplicateRecipients = (addedRecipients: Recipient[], recipients: Recipient[]) => {
    let addedAddresses: string[] = [];
    const deduplicatedAddedRecipients = addedRecipients.filter((addedRecipient, _, array) => {
        // If recipient has no addresses
        if (!addedRecipient.Address) {
            return false;
        }

        // And not added two times in the same paste. Ex: paste "test@test.fr,test@test.fr,test@test.fr"
        if (
            array.filter((arrayRecipient) => arrayRecipient.Address === addedRecipient.Address).length > 1 &&
            addedAddresses.includes(addedRecipient.Address)
        ) {
            return false;
        }

        // Is not inside the current recipient list
        if (recipients.some((recipient) => recipient.Address === addedRecipient.Address)) {
            return false;
        }

        addedAddresses.push(addedRecipient.Address);
        return true;
    });

    return [...recipients, ...deduplicatedAddedRecipients];
};
