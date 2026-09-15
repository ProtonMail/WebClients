import { ToolInputError } from '@proton/llm/lib/lumoAgent/contracts/errors';
import type { ToolHandler } from '@proton/llm/lib/lumoAgent/contracts/types';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';
import type { Recipient } from '@proton/shared/lib/interfaces';

import { resolveTypedId } from '../../helpers/references';
import type { MailToolDeps } from '../../toolModule';

export type References = Parameters<ToolHandler>[1]['references'];

/**
 * A recipient the model named: a `contact-…` reference from find_contacts, resolved through the address
 * book, or an address typed out in full. Anything else is rejected rather than sent to an address that
 * cannot receive it.
 */
const toRecipient = (mail: MailToolDeps, value: string, references: References): Recipient => {
    const address = value.trim();

    // Address first: `contact-us@acme.com` is a real address that a prefix check would send off to the
    // reference registry, where it fails as a hallucination the model cannot fix by re-reading.
    if (!address.includes('@') && address.startsWith('contact-')) {
        const id = resolveTypedId(address, ['contact'], references);
        const contact = mail.getContactEmails().find((contactEmail) => contactEmail.ID === id);
        if (!contact) {
            throw new ToolInputError(
                `Contact ${address} is no longer in the address book. find_contacts again for the contacts that are.`
            );
        }
        return { Name: contact.Name || contact.Email, Address: contact.Email };
    }

    if (!validateEmailAddress(address)) {
        throw new ToolInputError(
            `"${address}" is neither a valid email address nor a contact-… reference from find_contacts.`
        );
    }
    return { Name: address, Address: address };
};

export const toRecipients = (mail: MailToolDeps, values: string[] = [], references: References): Recipient[] =>
    values.map((value) => toRecipient(mail, value, references));
