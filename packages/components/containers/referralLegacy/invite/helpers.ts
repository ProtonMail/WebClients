import { getEmailParts, validateEmailAddress } from '@proton/shared/lib/helpers/email';
import type { Recipient } from '@proton/shared/lib/interfaces';
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts';

export const isProtonAddress = (protonDomains: Set<string>, address: string) => {
    const [, domain] = getEmailParts(address);

    return protonDomains.has(domain);
};

export const isValidEmailAdressToRefer = (protonDomains: Set<string>, address: string) => {
    const isValid = validateEmailAddress(address);
    return isValid && !isProtonAddress(protonDomains, address);
};

export const filterContactEmails = (protonDomains: Set<string>, contactEmails: ContactEmail[]) => {
    return contactEmails.filter((contact) => {
        return isValidEmailAdressToRefer(protonDomains, contact.Email);
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
