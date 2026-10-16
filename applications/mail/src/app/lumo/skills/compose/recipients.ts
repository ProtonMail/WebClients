import { ToolInputError } from '@proton/llm/lib/lumoAgent/contracts/errors';
import type { ToolHandler } from '@proton/llm/lib/lumoAgent/contracts/types';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';
import type { Recipient } from '@proton/shared/lib/interfaces';

import { resolveTypedId } from '../../helpers/references';
import type { MailToolDeps } from '../../toolModule';

export type References = Parameters<ToolHandler>[1]['references'];

// Address first: `contact-us@acme.com` is a real address that a prefix check would send off to the
// reference registry, where it fails as a hallucination the model cannot fix by re-reading.
const isContactReference = (address: string) => {
    return !address.includes('@') && address.startsWith('contact-');
};

/**
 * The store-free half of reading a recipient: a `contact-…` reference or a well-formed address. Whether
 * the contact is still in the address book is only known from the store, so {@link toRecipients} checks it.
 */
export const assertRecipientShape = (value: string): void => {
    const address = value.trim();
    if (!isContactReference(address) && !validateEmailAddress(address)) {
        throw new ToolInputError(
            `"${address}" is neither a valid email address nor a contact-… reference from find_contacts.`
        );
    }
};

/**
 * A recipient the model named: a `contact-…` reference from find_contacts, resolved through the address
 * book, or an address typed out in full. Anything else is rejected rather than sent to an address that
 * cannot receive it.
 */
const toRecipient = (mail: MailToolDeps, value: string, references: References): Recipient => {
    assertRecipientShape(value);
    const address = value.trim();

    if (isContactReference(address)) {
        const id = resolveTypedId(address, ['contact'], references);
        const contact = mail.getContactEmails().find((contactEmail) => contactEmail.ID === id);
        if (!contact) {
            throw new ToolInputError(
                `Contact ${address} is no longer in the address book. find_contacts again for the contacts that are.`
            );
        }
        return { Name: contact.Name || contact.Email, Address: contact.Email };
    }

    return { Name: address, Address: address };
};

export const toRecipients = (mail: MailToolDeps, values: string[] = [], references: References): Recipient[] =>
    values.map((value) => toRecipient(mail, value, references));
