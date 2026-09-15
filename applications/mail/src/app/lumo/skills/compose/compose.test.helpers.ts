import { createReferenceRegistry } from '@proton/llm/lib/lumoAgent/engine/referenceRegistry';
import type { MESSAGE_ACTIONS } from '@proton/mail-renderer/constants';
import type { MessageState, PartialMessageState } from '@proton/mail/store/messages/messagesTypes';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Recipient } from '@proton/shared/lib/interfaces';
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts/Contact';

import type { RecipientType } from '../../../models/address';
import type { DraftChangeability, MailToolDeps } from '../../toolModule';

/** An open composer that will take both a rewrite and a readdress. */
export const CHANGEABLE: DraftChangeability = {
    isOpen: true,
    isEditorReady: true,
    canReplaceBody: true,
    canReaddress: true,
};

const CLOSED: DraftChangeability = { isOpen: false, isEditorReady: false, canReplaceBody: false, canReaddress: false };

export const ADA: ContactEmail = { ID: 'CONTACT_1', Name: 'Ada Lovelace', Email: 'ada@example.com' } as ContactEmail;

export const decryptedParent = (id: string): MessageState =>
    ({
        localID: id,
        data: { ID: id, Subject: 'Booking', Sender: { Address: 'bob@example.com', Name: 'Bob' } },
        messageDocument: { initialized: true, document: window.document.createElement('div') },
    }) as unknown as MessageState;

interface HarnessOptions {
    messages?: Record<string, MessageState>;
    /** What each composer answers when asked what it will take; one not named here reads as closed. */
    changeability?: Record<string, DraftChangeability>;
    onInitializeMessage?: (id: string) => void;
    /** The composer id `composeDraft` adds to the store, as `onCompose` does; null for a refused compose. */
    opensComposer?: string | null;
}

/** `composer-0` starts open, so a test that expects a newly opened composer fails if it names that one. */
export const composeHarness = ({
    messages = {},
    changeability = {},
    onInitializeMessage,
    opensComposer = 'composer-1',
}: HarnessOptions = {}) => {
    const composed: { action: MESSAGE_ACTIONS; referenceMessage: PartialMessageState; bodyBeforeQuote?: string }[] = [];
    const written: { composerID: string; body: string }[] = [];
    const readdressed: { composerID: string; recipients: Partial<Record<RecipientType, Recipient[]>> }[] = [];
    const composers: Record<string, { ID: string }> = { 'composer-0': { ID: 'composer-0' } };

    const deps = {
        store: {
            getState: () => ({
                composers: { composers },
                messages,
                elements: { elements: {}, params: { labelID: MAILBOX_LABEL_IDS.INBOX } },
            }),
        },
        getContactEmails: () => [ADA],
        initializeMessage: async (id: string) => {
            onInitializeMessage?.(id);
        },
        composeDraft: async (params: (typeof composed)[number]) => {
            composed.push(params);
            if (opensComposer) {
                composers[opensComposer] = { ID: opensComposer };
            }
        },
        getDraftChangeability: (composerID: string) => changeability[composerID] ?? CLOSED,
        writeDraftBody: (composerID: string, body: string) => {
            written.push({ composerID, body });
            return true;
        },
        setDraftRecipients: (composerID: string, recipients: Partial<Record<RecipientType, Recipient[]>>) => {
            readdressed.push({ composerID, recipients });
        },
    } as unknown as MailToolDeps;

    return { deps, references: createReferenceRegistry(), composed, written, readdressed };
};
