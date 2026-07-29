import type { ReferenceRegistry } from '@proton/llm/lib/lumoAgent/contracts/types';
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
