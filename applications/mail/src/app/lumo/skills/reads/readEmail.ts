import { c, msgid } from 'ttag';

import { ToolInputError, UnknownReferenceError } from '@proton/llm/lib/lumoAgent/contracts/errors';
import type { ToolDefinition, ToolHandler } from '@proton/llm/lib/lumoAgent/contracts/types';

import type { Element } from '../../../models/element';
import type { DecryptedMessage } from '../../helpers/messages';
import {
    createDecryptDeadline,
    openInReadingPane,
    readDecryptedMessage,
    toDecryptedMessage,
    truncateBody,
} from '../../helpers/messages';
import { resolveFreshElement } from '../../helpers/references';
import type { MailToolDeps, MailToolModule } from '../../toolModule';

/** Keep an empty bucket out of the payload entirely, rather than telling the model about nothing. */
const named = (references: string[]): string[] | undefined => (references.length ? references : undefined);

export interface ReadEmailParams {
    references: string[];
    /** On a multi-reference read, the ONE email to leave open on screen — the row that best answers the
     *  user. Must be one of `references`. Null on a single read (that email is trivially it). */
    best_match: string | null;
}

interface ReadEmailRow extends DecryptedMessage {
    reference: string;
}

/**
 * Told to the model so it cannot assume every requested email came back — and split by cause, because the
 * two need different responses: one is a fact to relay, the other only worth retrying.
 */
export interface ReadEmailsResult {
    emails: ReadEmailRow[];
    deleted?: string[];
    /** Opened, but did not decrypt inside the read's budget. */
    notDecrypted?: string[];
    unreachable?: string[];
}

export const readEmailDefinition: ToolDefinition<ReadEmailParams, ReadEmailsResult> = {
    name: 'read_email',
    kind: 'read',
    toolDescription:
        'Read the decrypted plain-text body of a specific email, identified by an email-… reference that view_emails, open_folder or search returned earlier. Use once you have a candidate row and need its contents — to answer a question about it, summarise it, or decide an action. Reading an email OPENS it in the reading pane, so to answer about or act on ONE email, read just the SINGLE best-matching row — that email is then what the user sees. Pass MULTIPLE references ONLY when the user explicitly wants several emails summarised or compared together; in that case also set best_match to the one reference to leave open on screen (the row that best answers the user). Each reference must be a real email-… you were given: never call this with empty, missing, or invented references. A reference from any earlier result stays valid for the whole conversation, even once its row has left the screen, so pass it straight here rather than searching again. If you have already identified which email to read, pass its exact reference now rather than deferring. To read the email the user currently has OPEN in the reading pane, use read_open_email instead. To read every message in a conversation, use read_thread. Example: after search returns `email-a1b2c3 | … | Fw: Votre séjour`, call with { "references": ["email-a1b2c3"], "best_match": null }.',
    paramsSchema: {
        type: 'object',
        additionalProperties: false,
        // best_match is nullable-and-required — the strict-structured-outputs idiom for an optional
        // field: the model must supply it, passing null on a single read.
        required: ['references', 'best_match'],
        properties: {
            references: { type: 'array', items: { type: 'string' } },
            best_match: { type: ['string', 'null'] },
        },
    },
    examples: [
        {
            context:
                "A previous search returned the row `email-a1b2c3 | … | Fw: Votre séjour à HÔTEL RAMADA` and you want to read it to answer the user's question about the booking. Reading it also opens that email on screen for the user.",
            call: { references: ['email-a1b2c3'], best_match: null },
        },
        {
            context:
                'The user explicitly asked you to summarise SEVERAL emails together. A previous search returned `email-a1b2c3 | … | Fw: Votre séjour` and `email-d4e5f6 | … | Booking confirmation`; read both, and leave the most relevant one (the séjour booking) open on screen via best_match.',
            call: { references: ['email-a1b2c3', 'email-d4e5f6'], best_match: 'email-a1b2c3' },
        },
    ],
    serializeForLumo: (result) => {
        const count = result.emails.length;
        const parts = [
            `Read ${count} email${count === 1 ? '' : 's'}:`,
            ...result.emails.map(
                (email) =>
                    `Email ${email.reference} — "${email.subject}" from ${email.from} (${email.date}):\n${truncateBody(
                        email.body
                    )}`
            ),
        ];
        if (result.deleted?.length) {
            parts.push(`Permanently deleted, so not read: ${result.deleted.join(', ')}.`);
        }
        if (result.notDecrypted?.length) {
            parts.push(`Could not read (didn't open in time): ${result.notDecrypted.join(', ')}.`);
        }
        if (result.unreachable?.length) {
            parts.push(`Could not read (failed to load from the server): ${result.unreachable.join(', ')}.`);
        }
        return parts.join('\n\n');
    },
    summarizeChip: (_params, result) => {
        const count = result.emails.length;
        return { label: c('Info').ngettext(msgid`Read ${count} email`, `Read ${count} emails`, count) };
    },
};

/**
 * Sequential, not parallel: opening navigates the reading pane, so parallel opens would thrash the
 * router. Reading IS displaying — the email read last is the one the user is left looking at. One shared
 * decrypt budget across the batch, so a long list of unreadable emails cannot hold the tool open.
 */
export const createReadEmailHandler =
    (mail: MailToolDeps): ToolHandler<ReadEmailParams, ReadEmailsResult> =>
    async ({ references: emailReferences, best_match }, { references }) => {
        const emails: ReadEmailRow[] = [];
        const deleted: string[] = [];
        const notDecrypted: string[] = [];
        const unreachable: string[] = [];
        const outOfTime = createDecryptDeadline();

        const readElements = new Map<string, Element>();
        let openReference: string | undefined;
        const open = (element: Element, reference: string) => {
            openInReadingPane(mail, element);
            openReference = reference;
        };

        for (const reference of emailReferences) {
            if (outOfTime()) {
                notDecrypted.push(reference);
                continue;
            }

            let element: Element;
            try {
                element = await resolveFreshElement(mail, reference, references);
            } catch (error) {
                if (error instanceof UnknownReferenceError) {
                    throw error;
                }
                (error instanceof ToolInputError ? deleted : unreachable).push(reference);
                continue;
            }

            // Navigating is what triggers the decrypt.
            open(element, reference);
            const decrypted = await readDecryptedMessage(mail.store, element.ID);
            if (!decrypted) {
                notDecrypted.push(reference);
                continue;
            }
            readElements.set(reference, element);
            emails.push({ reference, ...toDecryptedMessage(decrypted) });
        }

        // Leave the model-designated best match open, unless the batch already ended on it.
        const bestMatchElement = best_match ? readElements.get(best_match) : undefined;
        if (best_match && bestMatchElement && best_match !== openReference) {
            open(bestMatchElement, best_match);
        }

        return {
            emails,
            deleted: named(deleted),
            notDecrypted: named(notDecrypted),
            unreachable: named(unreachable),
        };
    };

export const readEmailModule: MailToolModule = {
    definition: readEmailDefinition,
    createHandler: createReadEmailHandler,
};
