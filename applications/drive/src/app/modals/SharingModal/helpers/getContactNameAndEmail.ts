import { canonicalizeEmailByGuess } from '@proton/shared/lib/helpers/email';
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts';

export const getContactNameAndEmail = (email: string, contactEmails?: ContactEmail[]) => {
    const canonicalizedEmail = canonicalizeEmailByGuess(email);
    const { Name: contactName, Email: contactEmail } = contactEmails?.find(
        (contactEmail) => canonicalizeEmailByGuess(contactEmail.Email) === canonicalizedEmail
    ) || {
        Name: '',
        Email: email,
    };

    return {
        contactName,
        contactEmail,
    };
};
