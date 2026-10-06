import { ToolInputError, UnknownReferenceError } from '@proton/llm/lib/lumoAgent/contracts/errors';
import type { ReferenceKind, ReferenceLabel, ReferenceRegistry } from '@proton/llm/lib/lumoAgent/contracts/types';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { API_CODES } from '@proton/shared/lib/constants';

import { isElementConversation } from '../../helpers/elements';
import type { Element } from '../../models/element';
import { conversationByID } from '../../store/conversations/conversationsSelectors';
import { messageByID } from '../../store/messages/messagesSelectors';
import type { MailToolDeps, ToolStore } from '../toolModule';

/** Resolve a reference to its real backend id, or reject it as a hallucination the model must recover from. */
export const resolveId = (reference: string, references: ReferenceRegistry): string => {
    const id = references.idFor(reference);
    if (!id) {
        throw new UnknownReferenceError(reference);
    }
    return id;
};

/**
 * Resolve a reference the caller already knows the KIND of. The registry is one flat map across kinds, so
 * an `email-…` passed where a folder belongs would otherwise resolve to a message id and navigate the
 * mailbox to a nonsense route. Throws a {@link ToolInputError} the model can act on instead.
 */
export const resolveTypedId = (reference: string, kinds: ReferenceKind[], references: ReferenceRegistry): string => {
    if (!kinds.some((kind) => reference.startsWith(`${kind}-`))) {
        throw new ToolInputError(
            `"${reference}" is not a ${kinds.join(' or ')} reference. Re-read the ${kinds.join(
                ' or '
            )} list for valid ones.`
        );
    }
    return resolveId(reference, references);
};

// Keyed on the registry so the record is scoped to the session that minted the references and goes with it.
const conversationIDsByRegistry = new WeakMap<ReferenceRegistry, Set<string>>();

const conversationIDsMintedBy = (references: ReferenceRegistry): Set<string> => {
    const existing = conversationIDsByRegistry.get(references);
    if (existing) {
        return existing;
    }
    const minted = new Set<string>();
    conversationIDsByRegistry.set(references, minted);
    return minted;
};

/*
 * Every email reference is minted through these, never `referenceFor('email', …)` (lint-enforced): once
 * the email has left every store, the recorded conversation ids are the only way to pick the endpoint.
 */
export const messageReferenceFor = (references: ReferenceRegistry, messageID: string, label?: ReferenceLabel) => {
    return references.referenceFor('email', messageID, label);
};

export const conversationReferenceFor = (
    references: ReferenceRegistry,
    conversationID: string,
    label?: ReferenceLabel
) => {
    conversationIDsMintedBy(references).add(conversationID);
    return references.referenceFor('email', conversationID, label);
};

export const emailReferenceFor = (references: ReferenceRegistry, element: Element, label?: ReferenceLabel) => {
    return isElementConversation(element)
        ? conversationReferenceFor(references, element.ID, label)
        : messageReferenceFor(references, element.ID, label);
};

export const isConversationReferenceID = (references: ReferenceRegistry, id: string): boolean => {
    return conversationIDsMintedBy(references).has(id);
};

export type ElementFetchDeps = Pick<MailToolDeps, 'store' | 'fetchConversation' | 'fetchMessage'>;

/** Every slice here is kept current by the event loop, so a hit is as fresh as a fetch. */
const storedElement = (state: ReturnType<ToolStore['getState']>, id: string): Element | undefined => {
    return (
        state.elements.elements[id] ??
        conversationByID(state, { ID: id })?.Conversation ??
        messageByID(state, { ID: id })?.data
    );
};

const CONVERSATION_NOT_FOUND_CODE = 20052;
// Not `isNotExistError`: its INVALID_ID means the id went to the wrong endpoint, not that the email is gone.
const EMAIL_DELETED_CODES = [API_CODES.NOT_FOUND_ERROR, CONVERSATION_NOT_FOUND_CODE];

const isEmailDeletedError = (error: unknown): boolean => {
    return EMAIL_DELETED_CODES.includes(getApiError(error).code);
};

const goneMessage = (reference: string, references: ReferenceRegistry): string => {
    const title = references.labelFor(reference)?.title;
    return `Email ${reference}${title ? ` ("${title}")` : ''} no longer exists: it was permanently deleted.`;
};

const fetchElement = async (
    mail: ElementFetchDeps,
    id: string,
    reference: string,
    references: ReferenceRegistry
): Promise<Element> => {
    try {
        return isConversationReferenceID(references, id)
            ? await mail.fetchConversation(id)
            : await mail.fetchMessage(id);
    } catch (error) {
        if (isEmailDeletedError(error)) {
            throw new ToolInputError(goneMessage(reference, references));
        }
        throw error;
    }
};

/** One email's current state, from the store when any slice holds it and from the server otherwise. */
const resolveFreshElement = async (
    mail: ElementFetchDeps,
    reference: string,
    references: ReferenceRegistry
): Promise<Element> => {
    const id = resolveId(reference, references);
    return storedElement(mail.store.getState(), id) ?? fetchElement(mail, id, reference, references);
};

/**
 * Resolve email references to their current {@link Element}s, wherever the email now sits, so the
 * apply-location hook validates against the mailbox as it is rather than as an earlier read saw it.
 *
 * Rejections are {@link ToolInputError}s because an empty `ids` and a deleted email are both things the
 * model can relay or correct; a plain Error would reach it only as "the tool failed".
 */
export const resolveFreshElements = async (
    mail: ElementFetchDeps,
    emailReferences: string[],
    references: ReferenceRegistry
): Promise<Element[]> => {
    if (!emailReferences.length) {
        throw new ToolInputError(
            '`ids` was empty: pass at least one email-… reference from a mailbox read or a search.'
        );
    }
    return Promise.all(emailReferences.map((reference) => resolveFreshElement(mail, reference, references)));
};
