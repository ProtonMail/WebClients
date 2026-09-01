import getRandomString, { DEFAULT_LOWERCASE_CHARSET } from '@proton/utils/getRandomString';

import type { ReferenceKind, ReferenceLabel, ReferenceRegistry } from '../contracts/types';

/**
 * An append-only {@link ReferenceRegistry}. References (`email-a3f9k2`, `folder-x7b2q1`, …) stand in
 * for real backend IDs when talking to the model: the model only ever sees and emits references, so a
 * hallucinated ID cannot resolve and the action is rejected before the API is touched. Each real ID is
 * assigned a random 6-character base36 id ONCE and cached, so the mapping is stable for the session —
 * the same real ID always yields the same reference, even after the read that introduced it is evicted
 * from the working set, so an item cited in a later action still resolves. Ids are random rather than
 * sequential so the model cannot invent "the next number": an unissued reference can only be a
 * hallucination.
 */
export const createReferenceRegistry = (): ReferenceRegistry => {
    const idByReference = new Map<string, string>();
    const referenceById = new Map<string, string>();
    // Merged, not replaced: the same element is minted by several reads, and the leanest of them must
    // not strip the sender and date a richer one recorded.
    const labelByReference = new Map<string, ReferenceLabel>();

    const keyFor = (kind: ReferenceKind, id: string) => `${kind}:${id}`;

    // Mint a reference not already issued this session. 6 base36 chars is ~2.1B combinations, so the
    // collision loop effectively never spins for a per-session registry — it is a correctness guard,
    // not a hot path.
    const mintReference = (kind: ReferenceKind): string => {
        let reference: string;
        do {
            reference = `${kind}-${getRandomString(6, DEFAULT_LOWERCASE_CHARSET)}`;
        } while (idByReference.has(reference));
        return reference;
    };

    return {
        referenceFor(kind, id, label) {
            const key = keyFor(kind, id);
            const existing = referenceById.get(key);
            const reference = existing ?? mintReference(kind);
            if (!existing) {
                referenceById.set(key, reference);
                idByReference.set(reference, id);
            }
            if (label) {
                labelByReference.set(reference, { ...labelByReference.get(reference), ...label });
            }
            return reference;
        },
        idFor(reference) {
            return idByReference.get(reference);
        },
        labelFor(reference) {
            return labelByReference.get(reference);
        },
        has(reference) {
            return idByReference.has(reference);
        },
    };
};
