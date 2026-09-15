import { createReferenceRegistry } from '@proton/llm/lib/lumoAgent/engine/referenceRegistry';
import { MESSAGE_ACTIONS } from '@proton/mail-renderer/constants';
import type { MessageState } from '@proton/mail/store/messages/messagesTypes';
import type { Address, MailSettings, UserSettings } from '@proton/shared/lib/interfaces';

import { getAddressPlainTextSignature } from '../../../helpers/composer/contentFromComposerMessage';
import { CLASSNAME_SIGNATURE_CONTAINER } from '../../../helpers/message/messageSignature';
import type { MailToolDeps } from '../../toolModule';
import { DraftKind, createReadComposerHandler, readComposerDefinition } from './readComposer';

const SENDER = 'alice@proton.me';

const addresses = [{ Email: SENDER, Signature: '<div>Alice — Proton</div>' }] as Address[];
const mailSettings = { PMSignature: 0 } as MailSettings;
const userSettings = {} as UserSettings;

const buildDraftDocument = (typed: string, withSignature: boolean): HTMLElement => {
    const container = window.document.createElement('div');

    const typedFragment = new DOMParser().parseFromString(typed, 'text/html').body;
    while (typedFragment.firstChild) {
        container.appendChild(typedFragment.firstChild);
    }

    if (withSignature) {
        const sig = window.document.createElement('div');
        sig.className = CLASSNAME_SIGNATURE_CONTAINER;
        sig.textContent = 'Alice — Proton';
        container.appendChild(sig);
    }

    const quote = window.document.createElement('blockquote');
    quote.className = 'protonmail_quote';
    quote.textContent = 'On Monday, Bob wrote: The original message';
    container.appendChild(quote);

    return container;
};

const htmlDraft = (
    localID: string,
    subject: string,
    typed: string,
    {
        action,
        parentID,
        withSignature = true,
    }: { action?: MESSAGE_ACTIONS; parentID?: string; withSignature?: boolean } = {}
): MessageState => {
    return {
        localID,
        data: { ID: localID, Subject: subject, MIMEType: 'text/html', Sender: { Address: SENDER, Name: 'Alice' } },
        messageDocument: { initialized: true, document: buildDraftDocument(typed, withSignature) },
        draftFlags: { action, ParentID: parentID },
    } as unknown as MessageState;
};

const plainTextDraft = (
    localID: string,
    subject: string,
    typed: string,
    { withSignature = true }: { withSignature?: boolean } = {}
): MessageState => {
    const signature = withSignature
        ? getAddressPlainTextSignature({
              senderAddress: SENDER,
              action: MESSAGE_ACTIONS.NEW,
              addresses,
              mailSettings,
              userSettings,
          })
        : '';

    return {
        localID,
        data: { ID: localID, Subject: subject, MIMEType: 'text/plain', Sender: { Address: SENDER, Name: 'Alice' } },
        messageDocument: {
            initialized: true,
            plainText: `${typed}${signature}\nOn Monday, Bob wrote:\n> The original message`,
        },
        draftFlags: { action: MESSAGE_ACTIONS.NEW },
    } as unknown as MessageState;
};

const harness = ({
    composers = {},
    messages = {},
    overrideAddresses,
}: {
    composers?: Record<string, any>;
    messages?: Record<string, MessageState>;
    overrideAddresses?: Address[];
} = {}) => {
    const deps = {
        store: { getState: () => ({ composers: { composers }, messages }) },
        getAddresses: () => overrideAddresses ?? addresses,
        getMailSettings: () => mailSettings,
        getUserSettings: () => userSettings,
    } as unknown as MailToolDeps;

    const references = createReferenceRegistry();
    const read = () => createReadComposerHandler(deps)({}, { references } as any);

    return { read, references };
};

const composerFor = (ID: string, messageID: string) => ({ [ID]: { ID, messageID } });

describe('read_composer', () => {
    it('reports no drafts when no composer is open', async () => {
        const { read } = harness();

        const result = await read();

        expect(result).toEqual({ drafts: [] });
        expect(readComposerDefinition.serializeForLumo!({ drafts: [] }, {} as any)).toContain('No composer is open');
    });

    it('reads the typed text of an HTML draft without its signature or quote', async () => {
        const { read } = harness({
            composers: composerFor('composer-0', 'DRAFT_1'),
            messages: { DRAFT_1: htmlDraft('DRAFT_1', 'Lunch', '<div>Hi Bob,</div><div>Tuesday works.</div>') },
        });

        const { drafts } = await read();

        expect(drafts).toHaveLength(1);
        expect(drafts[0].body).toBe('Hi Bob,\nTuesday works.');
        expect(drafts[0].subject).toBe('Lunch');
        expect(drafts[0].kind).toBe(DraftKind.NEW);
        expect(drafts[0].answers).toBeUndefined();
    });

    it('reads the typed text of a plain text draft without its signature or quote', async () => {
        const { read } = harness({
            composers: composerFor('composer-0', 'DRAFT_1'),
            messages: { DRAFT_1: plainTextDraft('DRAFT_1', 'Lunch', 'Tuesday works.\n\n') },
        });

        const { drafts } = await read();

        expect(drafts[0].body).toBe('Tuesday works.');
    });

    it('strips the quoted conversation from a plain text draft when the sender has no signature', async () => {
        const { read } = harness({
            composers: composerFor('composer-0', 'DRAFT_1'),
            messages: { DRAFT_1: plainTextDraft('DRAFT_1', 'Lunch', 'Tuesday works.\n\n', { withSignature: false }) },
            overrideAddresses: [{ Email: SENDER, Signature: '' }] as Address[],
        });

        const { drafts } = await read();

        expect(drafts[0].body).toBe('Tuesday works.');
    });

    it('strips the blockquote from an HTML draft when the document has no signature container', async () => {
        const { read } = harness({
            composers: composerFor('composer-0', 'DRAFT_1'),
            messages: {
                DRAFT_1: htmlDraft('DRAFT_1', 'Lunch', '<div>Tuesday works.</div>', { withSignature: false }),
            },
        });

        const { drafts } = await read();

        expect(drafts[0].body).toBe('Tuesday works.');
    });

    it('reports an empty body when the user has typed nothing yet', async () => {
        const { read } = harness({
            composers: composerFor('composer-0', 'DRAFT_1'),
            messages: { DRAFT_1: htmlDraft('DRAFT_1', '', '') },
        });

        const { drafts } = await read();

        expect(drafts[0].body).toBe('');
        expect(readComposerDefinition.serializeForLumo!({ drafts }, {} as any)).toContain(
            'the user has written nothing yet'
        );
    });

    it.each([
        [MESSAGE_ACTIONS.REPLY, DraftKind.REPLY],
        [MESSAGE_ACTIONS.REPLY_ALL, DraftKind.REPLY],
        [MESSAGE_ACTIONS.FORWARD, DraftKind.FORWARD],
        [MESSAGE_ACTIONS.NEW, DraftKind.NEW],
    ])('maps the draft action %s to %s', async (action, kind) => {
        const { read } = harness({
            composers: composerFor('composer-0', 'DRAFT_1'),
            messages: {
                DRAFT_1: htmlDraft('DRAFT_1', 'Re: Lunch', '<div>Yes</div>', { action, parentID: 'PARENT_1' }),
            },
        });

        const { drafts } = await read();

        expect(drafts[0].kind).toBe(kind);
    });

    it('references the email a reply answers, so read_thread can resolve it', async () => {
        const { read, references } = harness({
            composers: composerFor('composer-0', 'DRAFT_1'),
            messages: {
                DRAFT_1: htmlDraft('DRAFT_1', 'Re: Lunch', '<div>Yes</div>', {
                    action: MESSAGE_ACTIONS.REPLY,
                    parentID: 'PARENT_1',
                }),
            },
        });

        const { drafts } = await read();

        expect(drafts[0].answers).toMatch(/^email-/);
        expect(references.idFor(drafts[0].answers!)).toBe('PARENT_1');
    });

    it('omits the answered email when the reopened draft no longer records its parent', async () => {
        const { read } = harness({
            composers: composerFor('composer-0', 'DRAFT_1'),
            messages: {
                DRAFT_1: htmlDraft('DRAFT_1', 'Re: Lunch', '<div>Yes</div>', { action: MESSAGE_ACTIONS.REPLY }),
            },
        });

        const { drafts } = await read();

        expect(drafts[0].answers).toBeUndefined();
    });

    it('reports every open composer, so the model can pick the relevant one', async () => {
        const { read } = harness({
            composers: { ...composerFor('composer-0', 'DRAFT_1'), ...composerFor('composer-1', 'DRAFT_2') },
            messages: {
                DRAFT_1: htmlDraft('DRAFT_1', 'Lunch', '<div>Tuesday works.</div>'),
                DRAFT_2: htmlDraft('DRAFT_2', 'Invoice', '<div>Attached.</div>'),
            },
        });

        const { drafts } = await read();

        expect(drafts.map(({ subject }) => subject)).toEqual(['Lunch', 'Invoice']);
        expect(readComposerDefinition.serializeForLumo!({ drafts }, {} as any)).toContain('2 drafts open');
    });

    /**
     * A draft clicked in the Drafts list is in the store before it is decrypted, and its document reads
     * as empty until then. Reporting that as an empty draft has Lumo either tell the user they have
     * written nothing or replace their real words with its own.
     */
    it('reports a draft still being decrypted as unreadable, not as empty', async () => {
        const draft = htmlDraft('DRAFT_1', 'Lunch', '<div>Tuesday works.</div>');
        const { read } = harness({
            composers: composerFor('composer-0', 'DRAFT_1'),
            messages: { DRAFT_1: { ...draft, messageDocument: { initialized: undefined } } as MessageState },
        });

        const { drafts } = await read();

        expect(drafts[0].isLoaded).toBe(false);
        const serialized = readComposerDefinition.serializeForLumo!({ drafts }, {} as any);
        expect(serialized).toContain('still opening');
        expect(serialized).not.toContain('written nothing yet');
    });

    it('skips a composer whose draft the message store does not hold', async () => {
        const { read } = harness({ composers: composerFor('composer-0', 'DRAFT_MISSING') });

        const { drafts } = await read();

        expect(drafts).toEqual([]);
    });
});
