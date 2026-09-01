import { ToolInputError } from '@proton/llm/lib/lumoAgent/contracts/errors';
import { createReferenceRegistry } from '@proton/llm/lib/lumoAgent/engine/referenceRegistry';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import type { ToolStore } from '../toolModule';
import { resolveElements } from './references';

const storeWith = ({
    elements = {},
    blockedLabelIDs = [],
}: { elements?: Record<string, unknown>; blockedLabelIDs?: string[] } = {}) =>
    ({
        getState: () => ({
            elements: {
                elements,
                params: { labelID: MAILBOX_LABEL_IDS.INBOX },
                taskRunning: { labelIDs: blockedLabelIDs, timeoutID: undefined },
            },
        }),
    }) as unknown as ToolStore;

describe('resolveElements', () => {
    const registry = () => {
        const references = createReferenceRegistry();
        return { references, reference: references.referenceFor('email', 'ELEMENT_1', { title: 'Booking' }) };
    };

    it('resolves each reference to the element the mutation hooks operate on', () => {
        const { references, reference } = registry();
        const element = { ID: 'ELEMENT_1' };

        expect(resolveElements(storeWith({ elements: { ELEMENT_1: element } }), [reference], references)).toEqual([
            element,
        ]);
    });

    // The hooks report an empty selection as a bare `'Elements are required'` (or silently do nothing), so
    // without this the model is told only that the tool failed — and Lumo tells the user it worked.
    it('rejects an empty selection with something the model can act on', () => {
        const { references } = registry();

        expect(() => resolveElements(storeWith(), [], references)).toThrow(ToolInputError);
        expect(() => resolveElements(storeWith(), [], references)).toThrow(/at least one email-…/);
    });

    it('rejects a reference whose element is no longer on screen', () => {
        const { references, reference } = registry();

        expect(() => resolveElements(storeWith(), [reference], references)).toThrow(/no longer loaded on screen/);
    });

    // A mark-all is the usual reason, and it is temporary: saying so is the difference between Lumo
    // explaining the wait and Lumo retrying a call that cannot succeed yet.
    it('names the bulk action when one is what cleared the list', () => {
        const { references, reference } = registry();
        const store = storeWith({ blockedLabelIDs: [MAILBOX_LABEL_IDS.INBOX] });

        expect(() => resolveElements(store, [reference], references)).toThrow(/bulk action is still running/);
    });

    // The element was collected wherever the bulk action is running, not necessarily where the view sits now.
    it('names the bulk action when it is running outside the current view', () => {
        const { references, reference } = registry();
        const store = storeWith({ blockedLabelIDs: [MAILBOX_LABEL_IDS.ARCHIVE] });

        expect(() => resolveElements(store, [reference], references)).toThrow(/bulk action is still running/);
    });
});
