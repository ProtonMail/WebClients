import { MESSAGE_ACTIONS } from '@proton/mail-message/constants';
import type { MessageState } from '@proton/mail-message/store/messages/messagesTypes';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { MESSAGE_FLAGS } from '@proton/shared/lib/mail/constants';

import { DraftKind } from '../../helpers/draftKind';
import { conversationReferenceFor } from '../../helpers/references';
import { ADA, checkParamsRejection, composeHarness, decryptedParent } from './compose.test.helpers';
import type { CreateDraftParams } from './createDraft';
import { createCreateDraftHandler, createDraftDefinition } from './createDraft';

const harness = (options?: Parameters<typeof composeHarness>[0]) => {
    const { deps, references, ...recorded } = composeHarness(options);
    const create = (params: Record<string, any>) =>
        createCreateDraftHandler(deps)(params as CreateDraftParams, { references } as any);

    return { create, references, ...recorded };
};

describe('create_draft', () => {
    it('opens a new email addressed to a contact reference', async () => {
        const { create, references, composed } = harness();
        const contact = references.referenceFor('contact', ADA.ID);

        const result = await create({
            kind: DraftKind.NEW,
            to: [contact],
            subject: 'Tuesday',
            body: 'Are you free?',
        });

        expect(composed).toEqual([
            {
                action: MESSAGE_ACTIONS.NEW,
                referenceMessage: {
                    data: {
                        ToList: [{ Name: 'Ada Lovelace', Address: 'ada@example.com' }],
                        CCList: [],
                        Subject: 'Tuesday',
                    },
                },
                bodyBeforeQuote: 'Are you free?',
            },
        ]);
        expect(result.kind).toBe(DraftKind.NEW);
    });

    it('accepts a plain address the model typed out', async () => {
        const { create, composed } = harness();

        await create({ kind: DraftKind.NEW, to: ['grace@example.com'], body: 'Hello' });

        expect(composed[0].referenceMessage.data?.ToList).toEqual([
            { Name: 'grace@example.com', Address: 'grace@example.com' },
        ]);
    });

    /** `contact-…` is also how a real mailbox is named, and re-reading can never fix a rejection of one. */
    it('accepts an address that happens to start like a contact reference', async () => {
        const { create, composed } = harness();

        await create({ kind: DraftKind.NEW, to: ['contact-sales@vendor.com'], body: 'Hello' });

        expect(composed[0].referenceMessage.data?.ToList).toEqual([
            { Name: 'contact-sales@vendor.com', Address: 'contact-sales@vendor.com' },
        ]);
    });

    it('hands compose the body without its surrounding whitespace', async () => {
        const { create, composed } = harness();

        await create({ kind: DraftKind.NEW, to: ['grace@example.com'], body: '\n  Hello  \n' });

        expect(composed[0].bodyBeforeQuote).toBe('Hello');
    });

    it('rejects a contact reference the address book no longer holds', async () => {
        const { create, references } = harness();
        const contact = references.referenceFor('contact', 'CONTACT_GONE');

        await expect(create({ kind: DraftKind.NEW, to: [contact], body: 'Hello' })).rejects.toThrow(
            'no longer in the address book'
        );
    });

    it.each([
        [DraftKind.REPLY, MESSAGE_ACTIONS.REPLY],
        [DraftKind.REPLY_ALL, MESSAGE_ACTIONS.REPLY_ALL],
        [DraftKind.FORWARD, MESSAGE_ACTIONS.FORWARD],
    ])('opens a %s quoting the decrypted email it answers', async (kind, action) => {
        const parent = decryptedParent('MESSAGE_1');
        const { create, references, composed } = harness({ messages: { MESSAGE_1: parent } });
        const answers = references.referenceFor('email', 'MESSAGE_1');

        const result = await create({ kind, answers, body: 'Sounds good.' });

        expect(composed).toEqual([{ action, referenceMessage: parent, bodyBeforeQuote: 'Sounds good.' }]);
        expect(result.kind).toBe(kind);
    });

    it('decrypts the answered email first when the store holds only its metadata', async () => {
        const initialized: string[] = [];
        const messages: Record<string, MessageState> = { MESSAGE_1: { localID: 'MESSAGE_1' } as MessageState };
        const { create, references, composed } = harness({
            messages,
            onInitializeMessage: (id) => {
                initialized.push(id);
                messages[id] = decryptedParent(id);
            },
        });
        const answers = references.referenceFor('email', 'MESSAGE_1');

        await create({ kind: DraftKind.REPLY, answers, body: 'Yes' });

        expect(initialized).toEqual(['MESSAGE_1']);
        expect(composed[0].referenceMessage).toBe(messages.MESSAGE_1);
    });

    describe('answering a conversation reference, as a grouped row mints', () => {
        /** A thread member as the conversation holds it, read and in the Inbox unless the case says otherwise. */
        const threadMessage = (
            ID: string,
            Time: number,
            {
                Unread = 0,
                Flags = MESSAGE_FLAGS.FLAG_RECEIVED,
                LabelIDs = [MAILBOX_LABEL_IDS.INBOX],
            }: Partial<Pick<Message, 'Unread' | 'Flags' | 'LabelIDs'>> = {}
        ) => {
            return { ID, ConversationID: 'CONVERSATION_1', Time, Unread, Flags, LabelIDs } as Message;
        };
        const thread = () => {
            return {
                Messages: [
                    threadMessage('MESSAGE_1', 1),
                    threadMessage('MESSAGE_2', 2),
                    threadMessage('DRAFT_3', 3, { Flags: 0, LabelIDs: [MAILBOX_LABEL_IDS.DRAFTS] }),
                ],
            };
        };

        /** Mail's Reply answers the message the conversation opens on, which is the oldest unread one. */
        it('quotes the message the conversation expands on, not the newest', async () => {
            const parent = decryptedParent('MESSAGE_2');
            const { create, references, composed } = harness({
                messages: { MESSAGE_2: parent, MESSAGE_3: decryptedParent('MESSAGE_3') },
                conversations: {
                    CONVERSATION_1: {
                        Messages: [
                            threadMessage('MESSAGE_1', 1),
                            threadMessage('MESSAGE_2', 2, { Unread: 1 }),
                            threadMessage('MESSAGE_3', 3, { Unread: 1 }),
                        ],
                    },
                },
            });
            const answers = conversationReferenceFor(references, 'CONVERSATION_1');

            await create({ kind: DraftKind.REPLY, answers, body: 'Yes' });

            expect(composed[0].referenceMessage).toBe(parent);
        });

        it('skips a newest message still in the Outbox, which compose would send first', async () => {
            const parent = decryptedParent('MESSAGE_1');
            const { create, references, composed } = harness({
                messages: { MESSAGE_1: parent, MESSAGE_2: decryptedParent('MESSAGE_2') },
                conversations: {
                    CONVERSATION_1: {
                        Messages: [
                            threadMessage('MESSAGE_1', 1),
                            threadMessage('MESSAGE_2', 2, {
                                Flags: MESSAGE_FLAGS.FLAG_SENT,
                                LabelIDs: [MAILBOX_LABEL_IDS.OUTBOX],
                            }),
                        ],
                    },
                },
            });
            const answers = conversationReferenceFor(references, 'CONVERSATION_1');

            await create({ kind: DraftKind.REPLY, answers, body: 'Yes' });

            expect(composed).toEqual([
                { action: MESSAGE_ACTIONS.REPLY, referenceMessage: parent, bodyBeforeQuote: 'Yes' },
            ]);
        });

        /** Viewed from the Inbox, a wholly trashed thread has nothing to expand, so the newest sent message stands in. */
        it('falls back to the newest sent message when the conversation expands on none', async () => {
            const parent = decryptedParent('MESSAGE_2');
            const trashed = { LabelIDs: [MAILBOX_LABEL_IDS.TRASH] };
            const { create, references, composed } = harness({
                messages: { MESSAGE_1: decryptedParent('MESSAGE_1'), MESSAGE_2: parent },
                conversations: {
                    CONVERSATION_1: {
                        Messages: [
                            threadMessage('MESSAGE_2', 2, trashed),
                            threadMessage('MESSAGE_1', 1, trashed),
                            threadMessage('DRAFT_3', 3, { Flags: 0, LabelIDs: [MAILBOX_LABEL_IDS.TRASH] }),
                        ],
                    },
                },
            });
            const answers = conversationReferenceFor(references, 'CONVERSATION_1');

            await create({ kind: DraftKind.REPLY, answers, body: 'Yes' });

            expect(composed[0].referenceMessage).toBe(parent);
        });

        /** The Drafts view opens a conversation on its draft, which a reply must never quote. */
        it.each([MAILBOX_LABEL_IDS.DRAFTS, MAILBOX_LABEL_IDS.ALL_DRAFTS])(
            'quotes the newest sent message, not the draft, from the %s view',
            async (labelID) => {
                const parent = decryptedParent('MESSAGE_2');
                const { create, references, composed } = harness({
                    messages: { MESSAGE_2: parent, DRAFT_3: decryptedParent('DRAFT_3') },
                    conversations: { CONVERSATION_1: thread() },
                    labelID,
                });
                const answers = conversationReferenceFor(references, 'CONVERSATION_1');

                await create({ kind: DraftKind.REPLY, answers, body: 'Yes' });

                expect(composed[0].referenceMessage).toBe(parent);
            }
        );

        it('skips a sent auto-reply when falling back to the newest sent message', async () => {
            const parent = decryptedParent('MESSAGE_1');
            const trashed = { LabelIDs: [MAILBOX_LABEL_IDS.TRASH] };
            const { create, references, composed } = harness({
                messages: { MESSAGE_1: parent, AUTO_REPLY_2: decryptedParent('AUTO_REPLY_2') },
                conversations: {
                    CONVERSATION_1: {
                        Messages: [
                            threadMessage('MESSAGE_1', 1, trashed),
                            threadMessage('AUTO_REPLY_2', 2, {
                                ...trashed,
                                Flags: MESSAGE_FLAGS.FLAG_SENT | MESSAGE_FLAGS.FLAG_AUTO,
                            }),
                        ],
                    },
                },
            });
            const answers = conversationReferenceFor(references, 'CONVERSATION_1');

            await create({ kind: DraftKind.REPLY, answers, body: 'Yes' });

            expect(composed[0].referenceMessage).toBe(parent);
        });

        it('quotes the newest message of the conversation that is not a draft', async () => {
            const parent = decryptedParent('MESSAGE_2');
            const { create, references, composed } = harness({
                messages: { MESSAGE_2: parent },
                conversations: { CONVERSATION_1: thread() },
            });
            const answers = conversationReferenceFor(references, 'CONVERSATION_1');

            await create({ kind: DraftKind.REPLY, answers, body: 'Yes' });

            expect(composed[0].referenceMessage).toBe(parent);
        });

        it('loads a conversation the store does not hold before choosing the message', async () => {
            const loaded: string[] = [];
            const conversations: Record<string, { Messages: Message[] }> = {};
            const parent = decryptedParent('MESSAGE_2');
            const { create, references, composed } = harness({
                messages: { MESSAGE_2: parent },
                conversations,
                onLoadConversation: (id) => {
                    loaded.push(id);
                    conversations[id] = thread();
                },
            });
            const answers = conversationReferenceFor(references, 'CONVERSATION_1');

            await create({ kind: DraftKind.REPLY, answers, body: 'Yes' });

            expect(loaded).toEqual(['CONVERSATION_1']);
            expect(composed[0].referenceMessage).toBe(parent);
        });
    });

    it('refuses to open a reply it could not decrypt, rather than one with an empty quote', async () => {
        const { create, references, composed } = harness({
            messages: { MESSAGE_1: { localID: 'MESSAGE_1' } as MessageState },
        });
        const answers = references.referenceFor('email', 'MESSAGE_1');

        await expect(create({ kind: DraftKind.REPLY, answers, body: 'Yes' })).rejects.toThrow('could not be read');
        expect(composed).toEqual([]);
    });

    /** Compose refuses a scheduled message, reported as a composer that did not open, and force-sends the rest. */
    it.each([
        [DraftKind.REPLY, 'Outbox', MAILBOX_LABEL_IDS.OUTBOX],
        [DraftKind.FORWARD, 'Outbox', MAILBOX_LABEL_IDS.OUTBOX],
        [DraftKind.REPLY, 'Scheduled', MAILBOX_LABEL_IDS.SCHEDULED],
    ])('refuses a %s to an email still in %s, before any compose', async (kind, _location, labelID) => {
        const parent = decryptedParent('MESSAGE_1');
        const unsent = { ...parent, data: { ...parent.data, LabelIDs: [labelID] } } as MessageState;
        const { create, references, composed } = harness({ messages: { MESSAGE_1: unsent } });
        const answers = references.referenceFor('email', 'MESSAGE_1');

        await expect(create({ kind, answers, body: 'Yes' })).rejects.toThrow('had not been sent yet');
        expect(composed).toEqual([]);
    });

    it('sets recipients on a forward via the composer store', async () => {
        const parent = decryptedParent('MESSAGE_1');
        const { create, references, readdressed } = harness({ messages: { MESSAGE_1: parent } });
        const answers = references.referenceFor('email', 'MESSAGE_1');
        const contact = references.referenceFor('contact', ADA.ID);

        await create({ kind: DraftKind.FORWARD, answers, to: [contact], body: 'FYI' });

        expect(readdressed).toEqual([
            {
                composerID: 'composer-1',
                recipients: { ToList: [{ Name: 'Ada Lovelace', Address: 'ada@example.com' }] },
            },
        ]);
    });

    /** The engine runs these before the confirm card, so a call that fails one never shows the user a card. */
    describe('checking the arguments before the confirm card', () => {
        const rejectionOf = (params: Record<string, any>) => {
            return checkParamsRejection(createDraftDefinition, params);
        };

        it.each(createDraftDefinition.examples!.map((example) => [example.context, example.call]))(
            'accepts the documented call: %s',
            (_context, call) => {
                expect(() => createDraftDefinition.checkParams!(call as CreateDraftParams)).not.toThrow();
            }
        );

        it('rejects a recipient that is neither an address nor a contact reference', () => {
            expect(rejectionOf({ kind: DraftKind.NEW, to: ['Ada'], body: 'Hello' })).toContain(
                'neither a valid email address nor a contact-… reference'
            );
        });

        it('rejects a malformed recipient in cc on a forward', () => {
            expect(rejectionOf({ kind: DraftKind.FORWARD, answers: 'email-a1', cc: ['Grace'], body: 'FYI' })).toContain(
                '"Grace" is neither a valid email address'
            );
        });

        it('requires the answered email on a reply', () => {
            expect(rejectionOf({ kind: DraftKind.REPLY, body: 'Yes' })).toContain('needs `answers`');
        });

        it('rejects the fields a reply inherits, naming them', () => {
            expect(
                rejectionOf({
                    kind: DraftKind.REPLY,
                    answers: 'email-a1',
                    to: ['grace@example.com'],
                    cc: ['ada@example.com'],
                    subject: 'Re: Booking',
                    body: 'Yes',
                })
            ).toContain('so to, cc, subject cannot be set on this call');
        });

        it('rejects subject on a forward, which inherits it', () => {
            expect(
                rejectionOf({ kind: DraftKind.FORWARD, answers: 'email-a1', subject: 'Custom subject', body: 'FYI' })
            ).toContain('subject cannot be set on this call');
        });

        it('rejects an answered email on a new message', () => {
            expect(rejectionOf({ kind: DraftKind.NEW, answers: 'email-a1', body: 'Hello' })).toContain(
                'only belongs on a reply'
            );
        });

        it('rejects an answered reference that is not an email', () => {
            expect(rejectionOf({ kind: DraftKind.REPLY, answers: 'folder-x1', body: 'Yes' })).toContain(
                '"folder-x1" is not a email reference'
            );
        });

        it('rejects an empty body, which a new draft has nothing else to hold', () => {
            expect(rejectionOf({ kind: DraftKind.NEW, body: '   ' })).toContain('`body` was empty');
        });
    });

    /** `composer-0` is already open in the harness, so this fails if it names any composer but the new one. */
    it('names the composer it opened, so revise_draft can target that draft', async () => {
        const { create, references } = harness({ opensComposer: 'composer-1' });

        const result = await create({ kind: DraftKind.NEW, to: ['grace@example.com'], body: 'Hello' });

        expect(result.reference).toMatch(/^composer-/);
        expect(references.idFor(result.reference)).toBe('composer-1');
    });

    /**
     * A compose refuses by notifying the user and returning — the open-composer limit, no address with
     * keys — so no composer appearing is the whole failure signal. Reporting success off the back of it
     * has Lumo say "I've drafted that for you" over a composer that never opened.
     */
    it('fails when the compose opened no composer, rather than reporting a draft', async () => {
        const { create } = harness({ opensComposer: null });

        await expect(create({ kind: DraftKind.NEW, to: ['grace@example.com'], body: 'Hello' })).rejects.toThrow(
            'NOTHING was drafted'
        );
    });
});
