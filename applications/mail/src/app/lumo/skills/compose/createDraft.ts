import { c } from 'ttag';

import { ToolInputError } from '@proton/llm/lib/lumoAgent/contracts/errors';
import type { ToolDefinition, ToolHandler } from '@proton/llm/lib/lumoAgent/contracts/types';
import type { PartialMessageState } from '@proton/mail/store/messages/messagesTypes';
import type { Recipient } from '@proton/shared/lib/interfaces';

import { selectParams } from '../../../store/elements/elementsSelectors';
import { DraftKind, MESSAGE_ACTION_FOR } from '../../helpers/draftKind';
import { withStepTimeout } from '../../helpers/messages';
import { resolveTypedId } from '../../helpers/references';
import type { MailToolDeps, MailToolModule } from '../../toolModule';
import type { References } from './recipients';
import { toRecipients } from './recipients';

const ANSWERING_ACTIONS = [DraftKind.REPLY, DraftKind.REPLY_ALL, DraftKind.FORWARD];

/** Named once, so the schema and the free-text list cannot drift apart on a rename. */
enum CreateDraftField {
    KIND = 'kind',
    ANSWERS = 'answers',
    TO = 'to',
    CC = 'cc',
    SUBJECT = 'subject',
    BODY = 'body',
}

export interface CreateDraftParams {
    kind: DraftKind;
    answers?: string;
    to?: string[];
    cc?: string[];
    subject?: string;
    body: string;
}

export interface CreateDraftResult {
    kind: DraftKind;
    /** The composer the draft is in, so revise_draft can change THIS draft rather than opening another. */
    reference: string;
}

export const createDraftDefinition: ToolDefinition<CreateDraftParams, CreateDraftResult> = {
    name: 'create_draft',
    kind: 'mutation',
    toolDescription:
        'WRITE a NEW email that does not exist yet, opening a composer with your text already in it. `body` is the message you have written, as plain text — the user reviews it in the composer and sends it themselves, so drafting is always safe. `kind` is "new" for a fresh email (with `to`, optionally `cc` and `subject`), "reply" / "reply_all" together with `answers` (the email-… reference of the message being answered — a reply inherits its recipients and subject, so do not pass `to`, `cc` or `subject` with it), or "forward" together with `answers` and `to` (a forward inherits the subject but not the recipients — name who to forward to in `to`, optionally `cc`; do not pass `subject`). Recipients are contact-… references from find_contacts, or plain email addresses. **Use this ONLY for a message that does not exist yet.** To change a draft that is already open — including one you opened a moment ago — use revise_draft instead; this tool always opens ANOTHER composer, which for a revision leaves the user two drafts to clean up. This tool returns the new draft\'s composer-… reference, which is what revise_draft takes. It NEVER sends: it only puts a draft in front of the user.',
    // The user's own words, and a subject or body can be shaped exactly like a reference.
    freeTextParams: [CreateDraftField.BODY, CreateDraftField.SUBJECT],
    paramsSchema: {
        type: 'object',
        additionalProperties: false,
        required: [CreateDraftField.KIND, CreateDraftField.BODY],
        properties: {
            [CreateDraftField.KIND]: { type: 'string', enum: Object.values(DraftKind) },
            [CreateDraftField.ANSWERS]: { type: 'string' },
            [CreateDraftField.TO]: { type: 'array', items: { type: 'string' } },
            [CreateDraftField.CC]: { type: 'array', items: { type: 'string' } },
            [CreateDraftField.SUBJECT]: { type: 'string' },
            [CreateDraftField.BODY]: { type: 'string' },
        },
    },
    examples: [
        {
            context:
                'find_contacts returned `contact-k3m9p2 | "Ada Lovelace" | ada@example.com` and the user asks you to email her about Tuesday.',
            call: {
                kind: DraftKind.NEW,
                to: ['contact-k3m9p2'],
                subject: 'Tuesday',
                body: 'Hi Ada,\n\nAre you free on Tuesday afternoon?\n\nThanks',
            },
        },
        {
            context:
                'read_open_email returned `email-a1b2c3` and the user asks you to reply accepting the invitation. Its recipients and subject come from that email.',
            call: {
                kind: DraftKind.REPLY,
                answers: 'email-a1b2c3',
                body: 'Thanks for the invitation — I would love to come.',
            },
        },
        {
            context:
                'The user asks you to forward `email-a1b2c3` to `contact-k3m9p2`. A forward inherits the subject but not the recipients.',
            call: {
                kind: DraftKind.FORWARD,
                answers: 'email-a1b2c3',
                to: ['contact-k3m9p2'],
                body: 'FYI — see below.',
            },
        },
    ],
    serializeForLumo: (result) => {
        const opened = result.kind === DraftKind.NEW ? 'a new email' : `a ${result.kind.replace('_', ' ')}`;
        return (
            `Opened ${opened} in the composer with that text in it, for the user to review and send themselves. ` +
            `It is unsent. That draft is ${result.reference} — revise_draft changes it.`
        );
    },
    summarizeChip: () => ({ label: c('Info').t`Opened a draft` }),
};

/**
 * The composer a compose just opened. `onCompose` adds it to the store before it resolves (it focuses
 * that composer itself), so this reads a settled value rather than waiting on one.
 *
 * A compose can be refused before any composer appears — the open-composer limit, no address with keys —
 * and refuses by notifying the user and returning, so the absence of a new composer is the only signal
 * there is. Rejecting on it is what stops the model reporting a draft that was never written.
 */
const composerOpenedBy = async (mail: MailToolDeps, compose: () => Promise<void>): Promise<string> => {
    const openComposerIDs = () => Object.keys(mail.store.getState().composers.composers);
    const before = new Set(openComposerIDs());

    await compose();

    const composerID = openComposerIDs().find((id) => !before.has(id));
    if (!composerID) {
        throw new ToolInputError(
            'The composer did not open, so NOTHING was drafted — the user already has the maximum number of ' +
                'composers open, or has no address that can send. They have been shown why. Tell them the draft ' +
                'could not be opened and that closing a composer will let you write it, and do not claim to have ' +
                'written anything.'
        );
    }

    return composerID;
};

/** The reference message a reply or forward quotes: `id`'s message, decrypted, or nothing usable. */
const answeredMessage = async (mail: MailToolDeps, id: string): Promise<PartialMessageState | undefined> => {
    const stored = () => mail.store.getState().messages[id];
    if (stored()?.messageDocument?.initialized !== true) {
        const { labelID } = selectParams(mail.store.getState());
        try {
            // Store-and-api only, so it decrypts whatever the user has on screen, or nothing at all.
            await withStepTimeout(mail.initializeMessage(id, labelID));
        } catch {
            // Judged on what the store holds afterwards, below.
        }
    }

    const message = stored();
    return message?.data && message.messageDocument?.initialized === true ? message : undefined;
};

type AddressedFields = Pick<CreateDraftParams, 'answers' | 'to' | 'cc' | 'subject'>;

/** The email a reply or forward quotes, and from which it inherits its recipients and subject. */
const quotedMessage = async (
    mail: MailToolDeps,
    { kind, answers, to, cc, subject }: AddressedFields & { kind: DraftKind },
    references: References
): Promise<PartialMessageState> => {
    if (!answers) {
        throw new ToolInputError(`A ${kind} needs \`answers\`: the email-… reference of the message it answers.`);
    }

    const isReply = kind !== DraftKind.FORWARD;
    const inherited = [
        to?.length && isReply && CreateDraftField.TO,
        cc?.length && isReply && CreateDraftField.CC,
        subject && CreateDraftField.SUBJECT,
    ].filter(Boolean);
    if (inherited.length) {
        throw new ToolInputError(
            `A ${kind} inherits its recipients and subject from the email it answers, so ` +
                `${inherited.join(', ')} cannot be set on this call. Name them only on a new email.`
        );
    }

    const id = resolveTypedId(answers, ['email'], references);
    const referenceMessage = await answeredMessage(mail, id);
    if (!referenceMessage) {
        throw new ToolInputError(
            `Email ${answers} could not be read, so there was nothing to quote in the ${kind}. ` +
                'read_email opens and decrypts it.'
        );
    }

    return referenceMessage;
};

/** A fresh email, carrying only the recipients and subject the model named. */
const newMessage = (
    mail: MailToolDeps,
    { answers, to, cc, subject }: AddressedFields,
    references: References
): PartialMessageState => {
    if (answers) {
        throw new ToolInputError(
            '`answers` only belongs on a reply, reply_all or forward. For a new email, name the recipients in `to`.'
        );
    }

    return {
        data: {
            ToList: toRecipients(mail, to, references) as Recipient[],
            CCList: toRecipients(mail, cc, references) as Recipient[],
            Subject: subject ?? '',
        } as PartialMessageState['data'],
    };
};

export const createCreateDraftHandler =
    (mail: MailToolDeps): ToolHandler<CreateDraftParams, CreateDraftResult> =>
    async ({ kind, answers, to, cc, subject, body: rawBody }, { references }) => {
        const body = rawBody?.trim() ?? '';
        if (!body) {
            throw new ToolInputError('`body` was empty: pass the text the draft should hold.');
        }

        const referenceMessage = ANSWERING_ACTIONS.includes(kind)
            ? await quotedMessage(mail, { kind, answers, to, cc, subject }, references)
            : newMessage(mail, { answers, to, cc, subject }, references);

        const forwardRecipients: Partial<Record<'ToList' | 'CCList', Recipient[]>> = {};
        if (kind === DraftKind.FORWARD) {
            const toList = toRecipients(mail, to, references);
            const ccList = toRecipients(mail, cc, references);
            if (toList.length) {
                forwardRecipients.ToList = toList;
            }
            if (ccList.length) {
                forwardRecipients.CCList = ccList;
            }
        }

        const composerID = await composerOpenedBy(mail, () =>
            mail.composeDraft({ action: MESSAGE_ACTION_FOR[kind], referenceMessage, bodyBeforeQuote: body })
        );

        if (Object.keys(forwardRecipients).length) {
            mail.setDraftRecipients(composerID, forwardRecipients);
        }

        return {
            kind,
            reference: references.referenceFor('composer', composerID, {
                title: referenceMessage.data?.Subject ?? '',
            }),
        };
    };

export const createDraftModule: MailToolModule = {
    definition: createDraftDefinition,
    createHandler: createCreateDraftHandler,
};
