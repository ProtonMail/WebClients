import { c, msgid } from 'ttag';

import type { ToolDefinition, ToolHandler } from '@proton/llm/lib/lumoAgent/contracts/types';
import { getContactDisplayNameEmail } from '@proton/shared/lib/contacts/contactEmail';
import { normalize } from '@proton/shared/lib/helpers/string';
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts/Contact';

import type { MailToolDeps, MailToolModule } from '../../toolModule';
import { serializeCatalogue } from './catalogue';

/** An address book can hold thousands; past this the model is told the count it did not see. */
const MAX_CONTACTS_RETURNED = 50;

export interface FindContactsParams {
    /** Null lists the whole address book — the model has no other way to enumerate contacts. */
    query: string | null;
}

export interface ContactMatch {
    /**
     * Minted from the ContactEmail, not the Contact: a contact with two addresses is two rows, and one
     * reference across both would leave the model unable to say which address it meant.
     */
    reference: string;
    name: string;
    email: string;
}

export interface FindContactsResult {
    query: string | null;
    matches: ContactMatch[];
    /** May exceed `matches.length`. */
    total: number;
    addressBookIsEmpty: boolean;
}

/**
 * Diacritic-insensitive substring match over name and address, mirroring how the contact list itself
 * filters (`useContactList`) so Lumo finds exactly what the user's own search would. A blank query is
 * not a query: it returns the whole address book rather than nothing.
 */
export const matchContacts = (contactEmails: ContactEmail[], query: string | null): ContactEmail[] => {
    const normalizedQuery = normalize(query ?? '', true);
    if (!normalizedQuery) {
        return contactEmails;
    }

    return contactEmails.filter(
        ({ Name, Email }) =>
            normalize(Name, true).includes(normalizedQuery) || normalize(Email, true).includes(normalizedQuery)
    );
};

/** Shares the contact list's own rule for a name worth showing, so an address saved under itself is not echoed twice. */
const projectMatch = ({ reference, name, email }: ContactMatch): string => {
    const { displayOnlyEmail } = getContactDisplayNameEmail({ name, email });

    return displayOnlyEmail ? `${reference} | ${email}` : `${reference} | "${name}" | ${email}`;
};

/** Says outright when the list is partial: the model must not report a truncated read as the whole book. */
const describeMatches = ({ query, matches, total }: FindContactsResult): string => {
    const scope = query ? `contacts matching "${query}"` : 'contacts';
    if (total > matches.length) {
        return `${total} ${scope}, showing the first ${matches.length}:`;
    }

    return `${total} ${scope}:`;
};

const QUERY_IS_FREE_TEXT = ['query'] as const;

export const findContactsDefinition: ToolDefinition<FindContactsParams, FindContactsResult> = {
    name: 'find_contacts',
    kind: 'read',
    toolDescription:
        'Look up saved contacts by name or email address, matching any part of either — each result carries its contact-… reference, the saved name and the email address. Pass a `query` to look someone up, or null to list the whole address book. Use to turn a person the user names ("email Ada", "anything from my accountant?") into a real address before searching their mail for it or drafting to them. Searches only the address book, never the mailbox: for emails from or to someone, use search. Read-only.',
    freeTextParams: QUERY_IS_FREE_TEXT,
    paramsSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['query'],
        properties: { query: { type: ['string', 'null'] } },
    },
    examples: [
        {
            context: 'The user asks you to draft an email to Ada, and you need her address before composing.',
            call: { query: 'Ada' },
        },
        {
            context: 'The user asks who is in their address book. There is nothing to match on, so list all of it.',
            call: { query: null },
        },
    ],
    serializeForLumo: (result) =>
        serializeCatalogue(
            describeMatches(result),
            result.matches.map(projectMatch),
            result.addressBookIsEmpty ? 'The user has no saved contacts.' : `No contacts match "${result.query}".`
        ),
    summarizeChip: (_params, result) => {
        const count = result.total;
        if (!count) {
            return { label: c('Info').t`No contacts found` };
        }

        return { label: c('Info').ngettext(msgid`Found ${count} contact`, `Found ${count} contacts`, count) };
    },
};

export const createFindContactsHandler =
    (mail: MailToolDeps): ToolHandler<FindContactsParams, FindContactsResult> =>
    async ({ query }, { references }) => {
        const contactEmails = mail.getContactEmails();
        const matched = matchContacts(contactEmails, query);

        return {
            query,
            total: matched.length,
            addressBookIsEmpty: !contactEmails.length,
            matches: matched.slice(0, MAX_CONTACTS_RETURNED).map((contactEmail) => ({
                reference: references.referenceFor('contact', contactEmail.ID, contactEmail.Name),
                name: contactEmail.Name,
                email: contactEmail.Email,
            })),
        };
    };

export const findContactsModule: MailToolModule = {
    definition: findContactsDefinition,
    createHandler: createFindContactsHandler,
};
