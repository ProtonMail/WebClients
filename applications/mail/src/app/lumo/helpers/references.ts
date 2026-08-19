import { ToolInputError, UnknownReferenceError } from '@proton/llm/lib/lumoAgent/contracts/errors';
import type { ReferenceKind, ReferenceRegistry } from '@proton/llm/lib/lumoAgent/contracts/types';

import type { Element } from '../../models/element';
import { taskRunning } from '../../store/elements/elementsSelectors';

import type { ToolStore } from '../toolModule';

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
            `"${reference}" is not a ${kinds.join(' or ')} reference. Use one returned by ${kinds
                .map((kind) => `list_${kind}s`)
                .join(' / ')}.`
        );
    }
    return resolveId(reference, references);
};

/**
 * A bulk mark-all clears its location's list until the server has worked through it, so an element
 * missing there has a cause the model can relay rather than a call it should retry. References don't
 * record where they were collected, so any running bulk action is a candidate cause — the current
 * location isn't necessarily the one the element came from.
 */
const missingElementMessage = (reference: string, state: ReturnType<ToolStore['getState']>): string => {
    const missing = `Email ${reference} is no longer loaded on screen.`;
    if (!taskRunning(state).labelIDs.length) {
        return missing;
    }
    return `${missing} A bulk action is still running, so the list of the location it came from may stay cleared until the server finishes.`;
};

/**
 * Resolve email references to the live {@link Element}s the apply-location hook operates on.
 *
 * Rejections are {@link ToolInputError}s because an empty `ids` and a stale reference are both things the
 * model can correct; a plain Error would reach it only as "the tool failed".
 */
export const resolveElements = (
    store: ToolStore,
    emailReferences: string[],
    references: ReferenceRegistry
): Element[] => {
    if (!emailReferences.length) {
        throw new ToolInputError(
            '`ids` was empty: pass at least one email-… reference returned by view_emails or search.'
        );
    }
    const state = store.getState();

    return emailReferences.map((reference) => {
        const id = resolveId(reference, references);
        const element = state.elements.elements[id];
        if (!element) {
            throw new ToolInputError(missingElementMessage(reference, state));
        }
        return element;
    });
};
