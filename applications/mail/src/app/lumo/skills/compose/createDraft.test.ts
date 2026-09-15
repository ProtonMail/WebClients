import { MESSAGE_ACTIONS } from '@proton/mail-renderer/constants';
import type { MessageState } from '@proton/mail/store/messages/messagesTypes';

import { DraftKind } from '../../helpers/draftKind';
import { ADA, composeHarness, decryptedParent } from './compose.test.helpers';
import type { CreateDraftParams } from './createDraft';
import { createCreateDraftHandler } from './createDraft';

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

    it('rejects a recipient that is neither an address nor a contact reference', async () => {
        const { create } = harness();

        await expect(create({ kind: DraftKind.NEW, to: ['Ada'], body: 'Hello' })).rejects.toThrow(
            'neither a valid email address nor a contact-… reference'
        );
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

    it('refuses to open a reply it could not decrypt, rather than one with an empty quote', async () => {
        const { create, references, composed } = harness({
            messages: { MESSAGE_1: { localID: 'MESSAGE_1' } as MessageState },
        });
        const answers = references.referenceFor('email', 'MESSAGE_1');

        await expect(create({ kind: DraftKind.REPLY, answers, body: 'Yes' })).rejects.toThrow('could not be read');
        expect(composed).toEqual([]);
    });

    it('requires the answered email on a reply', async () => {
        const { create } = harness();

        await expect(create({ kind: DraftKind.REPLY, body: 'Yes' })).rejects.toThrow('needs `answers`');
    });

    it('rejects the fields a reply inherits, naming them', async () => {
        const parent = decryptedParent('MESSAGE_1');
        const { create, references } = harness({ messages: { MESSAGE_1: parent } });
        const answers = references.referenceFor('email', 'MESSAGE_1');

        await expect(
            create({
                kind: DraftKind.REPLY,
                answers,
                to: ['grace@example.com'],
                subject: 'Re: Booking',
                body: 'Yes',
            })
        ).rejects.toThrow('so to, subject cannot be set on this call');
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

    it('rejects subject on a forward, which inherits it', async () => {
        const parent = decryptedParent('MESSAGE_1');
        const { create, references } = harness({ messages: { MESSAGE_1: parent } });
        const answers = references.referenceFor('email', 'MESSAGE_1');

        await expect(
            create({ kind: DraftKind.FORWARD, answers, subject: 'Custom subject', body: 'FYI' })
        ).rejects.toThrow('subject cannot be set on this call');
    });

    it('rejects an answered email on a new message', async () => {
        const { create, references } = harness();
        const answers = references.referenceFor('email', 'MESSAGE_1');

        await expect(create({ kind: DraftKind.NEW, answers, body: 'Hello' })).rejects.toThrow(
            'only belongs on a reply'
        );
    });

    it('rejects an empty body, which a new draft has nothing else to hold', async () => {
        const { create } = harness();

        await expect(create({ kind: DraftKind.NEW, body: '   ' })).rejects.toThrow('`body` was empty');
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
