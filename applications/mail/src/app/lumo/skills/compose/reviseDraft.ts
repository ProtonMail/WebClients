import { c } from 'ttag';

import { ToolInputError } from '@proton/llm/lib/lumoAgent/contracts/errors';
import type { ToolDefinition, ToolHandler } from '@proton/llm/lib/lumoAgent/contracts/types';
import type { Recipient } from '@proton/shared/lib/interfaces';

import type { RecipientType } from '../../../models/address';
import { resolveTypedId } from '../../helpers/references';
import type { DraftChangeability, MailToolDeps, MailToolModule } from '../../toolModule';
import { toRecipients } from './recipients';

/** Named once, so the schema and the free-text list cannot drift apart on a rename. */
enum ReviseDraftField {
    DRAFT = 'draft',
    TO = 'to',
    CC = 'cc',
    BODY = 'body',
}

export interface ReviseDraftParams {
    draft: string;
    /** Optional: a call may only be readdressing the draft, leaving its text as it was. */
    body?: string;
    to?: string[];
    cc?: string[];
}

export enum ReviseOutcome {
    /** The text was replaced, and who it goes to left as it was. */
    REPLACED = 'replaced',
    /** It was readdressed, and its text left as it was. */
    RETARGETED = 'retargeted',
    /** Both, in the one call. */
    RETARGETED_AND_REPLACED = 'retargeted_and_replaced',
}

const OUTCOME_RESULT: Record<ReviseOutcome, string> = {
    [ReviseOutcome.REPLACED]: 'Replaced the text in that draft.',
    [ReviseOutcome.RETARGETED]: 'Changed who that draft is addressed to, leaving its text as it was.',
    [ReviseOutcome.RETARGETED_AND_REPLACED]: 'Changed who that draft is addressed to and replaced its text.',
};

export interface ReviseDraftResult {
    outcome: ReviseOutcome;
}

export const reviseDraftDefinition: ToolDefinition<ReviseDraftParams, ReviseDraftResult> = {
    name: 'revise_draft',
    kind: 'mutation',
    toolDescription:
        'Change a draft that is ALREADY OPEN in the composer — the user\'s own, or one you just wrote. `draft` is its composer-… reference: create_draft returns that reference when it opens a draft, and read_composer reports the references of everything open. Pass `body` to replace the draft\'s text, `to` and/or `cc` to readdress it, or both together — whichever you leave out is left exactly as it is, and the signature and any quoted conversation are kept either way. This is what "make it shorter", "fix my English", "more formal", "make it more aggressive" and equally "actually send it to Cristiano instead" all ask for. **Never reach for create_draft to change an existing draft** — that opens a second composer and leaves the user two drafts for one email. Recipients are contact-… references from find_contacts, or plain email addresses. The draft\'s subject is the one thing this cannot change; if the user wants a different subject, create a new draft. This tool NEVER sends.',
    // The user's own words, and a body can be shaped exactly like a reference.
    freeTextParams: [ReviseDraftField.BODY],
    paramsSchema: {
        type: 'object',
        additionalProperties: false,
        required: [ReviseDraftField.DRAFT],
        properties: {
            [ReviseDraftField.DRAFT]: { type: 'string' },
            [ReviseDraftField.BODY]: { type: 'string' },
            [ReviseDraftField.TO]: { type: 'array', items: { type: 'string' } },
            [ReviseDraftField.CC]: { type: 'array', items: { type: 'string' } },
        },
    },
    examples: [
        {
            context:
                'read_composer reported `composer-x7b2q1` holding a draft the user has written, and they ask you to make it more formal.',
            call: {
                draft: 'composer-x7b2q1',
                body: 'Dear Mr Smith,\n\nI am writing to confirm our meeting on Tuesday.\n\nKind regards',
            },
        },
        {
            context:
                'You opened `composer-x7b2q1` addressed to Matteo, and the user now says "actually send it to Cristiano instead". find_contacts returned `contact-9jyvpd | "Cristiano Ronaldo"`. Readdress that draft and leave its text alone.',
            call: { draft: 'composer-x7b2q1', to: ['contact-9jyvpd'] },
        },
    ],
    serializeForLumo: (result) =>
        `${OUTCOME_RESULT[result.outcome]} It is in the composer the user is looking at, unsent.`,
    // Translated copy, so the labels stay inside the call rather than in a table frozen at import.
    summarizeChip: (_params, result) => {
        if (result.outcome === ReviseOutcome.RETARGETED) {
            return { label: c('Info').t`Readdressed the draft` };
        }
        if (result.outcome === ReviseOutcome.RETARGETED_AND_REPLACED) {
            return { label: c('Info').t`Rewrote and readdressed the draft` };
        }
        return { label: c('Info').t`Rewrote the draft` };
    },
};

const stillOpeningError = (draft: string) =>
    `The draft ${draft} has not finished opening, so nothing was changed. Say so and try again in a moment.`;

const bodyUnreplaceableError = (draft: string) =>
    `The text of the draft ${draft} cannot be replaced, so nothing was changed: it carries a quoted ` +
    'conversation that a rewrite would delete along with it. Tell the user you cannot rewrite this ' +
    'particular draft and offer to write what you would have said, for them to paste in themselves. ' +
    'Do not open a second draft, and do not try this call again.';

/**
 * Refuse a revision the draft cannot take, naming the actual cause: the model is told to re-read when
 * re-reading would help, and told plainly that the text is untouchable when it never will.
 */
const assertChangeable = (
    { isOpen, isEditorReady, canReplaceBody, canReaddress }: DraftChangeability,
    draft: string,
    { retargeted, rewrote }: { retargeted: boolean; rewrote: boolean }
): void => {
    if (!isOpen) {
        throw new ToolInputError(
            `The draft ${draft} is no longer open, so nothing was changed. read_composer reports the drafts ` +
                'that are open.'
        );
    }
    if (rewrote && !isEditorReady) {
        throw new ToolInputError(stillOpeningError(draft));
    }
    if (rewrote && !canReplaceBody) {
        throw new ToolInputError(bodyUnreplaceableError(draft));
    }
    if (retargeted && !canReaddress) {
        throw new ToolInputError(stillOpeningError(draft));
    }
};

const outcomeOf = (retargeted: boolean, rewrote: boolean) => {
    if (!retargeted) {
        return ReviseOutcome.REPLACED;
    }
    return rewrote ? ReviseOutcome.RETARGETED_AND_REPLACED : ReviseOutcome.RETARGETED;
};

export const createReviseDraftHandler =
    (mail: MailToolDeps): ToolHandler<ReviseDraftParams, ReviseDraftResult> =>
    async ({ draft, body: rawBody, to, cc }, { references }) => {
        const body = rawBody?.trim() ?? '';
        const composerID = resolveTypedId(draft, ['composer'], references);

        const recipients: Partial<Record<RecipientType, Recipient[]>> = {};
        if (to?.length) {
            recipients.ToList = toRecipients(mail, to, references);
        }
        if (cc?.length) {
            recipients.CCList = toRecipients(mail, cc, references);
        }
        const retargeted = Object.keys(recipients).length > 0;

        if (!body && !retargeted) {
            throw new ToolInputError(
                `Nothing to change on the draft ${draft}: pass \`body\` to replace its text, ` +
                    '`to` or `cc` to readdress it, or both.'
            );
        }

        assertChangeable(mail.getDraftChangeability(composerID), draft, { retargeted, rewrote: !!body });

        if (body) {
            const written = mail.writeDraftBody(composerID, body);
            if (!written) {
                throw new ToolInputError(bodyUnreplaceableError(draft));
            }
        }
        if (retargeted) {
            mail.setDraftRecipients(composerID, recipients);
        }

        return { outcome: outcomeOf(retargeted, !!body) };
    };

export const reviseDraftModule: MailToolModule = {
    definition: reviseDraftDefinition,
    createHandler: createReviseDraftHandler,
};
