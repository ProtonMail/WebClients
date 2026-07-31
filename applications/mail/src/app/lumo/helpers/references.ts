import type { ReferenceKind, ReferenceRegistry } from '@proton/llm/lib/lumoAgent/contracts/types';
import { UnknownReferenceError } from '@proton/llm/lib/lumoAgent/contracts/types';

import type { Element } from 'proton-mail/models/element';

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
 * mailbox to a nonsense route. Throws a self-correcting Error the model can act on instead.
 */
export const resolveTypedId = (reference: string, kinds: ReferenceKind[], references: ReferenceRegistry): string => {
    if (!kinds.some((kind) => reference.startsWith(`${kind}-`))) {
        throw new Error(
            `"${reference}" is not a ${kinds.join(' or ')} reference. Use one returned by ${kinds
                .map((kind) => `list_${kind}s`)
                .join(' / ')}.`
        );
    }
    return resolveId(reference, references);
};

/** Resolve email references to the live {@link Element}s the apply-location hook operates on. */
export const resolveElements = (
    store: ToolStore,
    emailReferences: string[],
    references: ReferenceRegistry
): Element[] =>
    emailReferences.map((reference) => {
        const id = resolveId(reference, references);
        const element = store.getState().elements.elements[id];
        if (!element) {
            throw new Error(`Email ${reference} is no longer loaded on screen.`);
        }
        return element;
    });
