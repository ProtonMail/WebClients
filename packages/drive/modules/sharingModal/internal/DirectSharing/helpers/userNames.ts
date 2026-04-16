import { canonicalizeEmailByGuess } from '@proton/shared/lib/helpers/email';
import type { UserModel } from '@proton/shared/lib/interfaces/User';
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

export function getDisplayName({
    ownerEmail,
    contactEmails,
    user,
}: {
    ownerEmail?: string;
    contactEmails?: ContactEmail[];
    user: UserModel;
}) {
    if (ownerEmail === user.Email) {
        return user.DisplayName;
    } else if (ownerEmail) {
        const { contactName } = getContactNameAndEmail(ownerEmail, contactEmails);
        if (contactName.length) {
            return contactName;
        }
    }
}
