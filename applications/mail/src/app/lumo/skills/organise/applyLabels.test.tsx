import type { ActionRequest } from '@proton/llm/lib/lumoAgent/contracts/types';
import { createReferenceRegistry } from '@proton/llm/lib/lumoAgent/engine/referenceRegistry';

import type { MailToolDeps } from '../../toolModule';
import {
    applyLabelsCardRenderer,
    applyLabelsDefinition,
    createApplyLabelsHandler,
    resolveLabelChanges,
} from './applyLabels';
import { hasEmailSelection, renderEmailSelectionBody } from './emailSelection';

describe('applyLabelsDefinition', () => {
    // Without this, "always tag mail from X" is answered by labelling the mail already on screen — the
    // user's actual request, a rule over future mail, silently does not happen.
    it('sends the model to create_filter for a rule over future mail', () => {
        expect(applyLabelsDefinition.toolDescription).toContain('use create_filter');
    });
});

describe('resolveLabelChanges', () => {
    const setUp = () => {
        const references = createReferenceRegistry();
        const receipts = references.referenceFor('label', 'LABEL_ID_1', 'Receipts');
        const invoices = references.referenceFor('label', 'LABEL_ID_2', 'Invoices');

        return { references, receipts, invoices };
    };

    it('maps every label reference to its id, set to true', () => {
        const { references, receipts, invoices } = setUp();

        expect(resolveLabelChanges([receipts, invoices], references)).toEqual({ LABEL_ID_1: true, LABEL_ID_2: true });
    });

    it('collapses a repeated reference rather than applying it twice', () => {
        const { references, receipts } = setUp();

        expect(resolveLabelChanges([receipts, receipts], references)).toEqual({ LABEL_ID_1: true });
    });

    it('rejects an empty list, which the apply-location hook would reject opaquely', () => {
        const { references } = setUp();

        expect(() => resolveLabelChanges([], references)).toThrow('at least one label-… reference');
    });

    // The registry is one flat map across kinds, so an unchecked `email-…` resolves to a message id and is
    // applied as though it were a label.
    it('rejects a reference of the wrong kind before it can resolve to a message id', () => {
        const { references } = setUp();
        const emailReference = references.referenceFor('email', 'ELEMENT_ID_1', 'Booking');

        expect(() => resolveLabelChanges([emailReference], references)).toThrow('is not a label reference');
    });
});

describe('applyLabelsCardRenderer', () => {
    const action: ActionRequest = {
        type: 'apply_labels',
        ids: ['email-a1b2c3', 'email-d4e5f6'],
        labels: ['label-m3n4p5', 'label-r6s7t8'],
    };
    const labels = {
        'email-a1b2c3': 'Booking confirmation',
        'email-d4e5f6': 'Receipt',
        'label-m3n4p5': 'Receipts',
        'label-r6s7t8': 'Invoices',
    };

    it('takes the shared selection body and its empty-apply rule', () => {
        expect(applyLabelsCardRenderer.renderBody).toBe(renderEmailSelectionBody);
        expect(applyLabelsCardRenderer.canApply).toBe(hasEmailSelection);
    });

    // An arrow reads as "moved into Receipts", the exact confusion the tool description exists to prevent.
    it('names the labels without an arrow, on the card and on the settled tile', () => {
        expect(applyLabelsCardRenderer.subtitle?.(action, labels)).toBe('Receipts, Invoices');
        expect(applyLabelsCardRenderer.detail?.(action, labels)).toBe('2 emails · Receipts, Invoices');
    });
});

describe('createApplyLabelsHandler', () => {
    const setUp = () => {
        const references = createReferenceRegistry();
        const emailReference = references.referenceFor('email', 'ELEMENT_ID_1', 'Booking');
        const labelReference = references.referenceFor('label', 'LABEL_ID_1', 'Receipts');
        const element = { ID: 'ELEMENT_ID_1' };
        const store = { getState: () => ({ elements: { elements: { ELEMENT_ID_1: element } } }) };
        const applyMultipleLocations = jest.fn().mockResolvedValue(undefined);
        const deps = { store, applyMultipleLocations } as unknown as MailToolDeps;

        return { references, emailReference, labelReference, element, applyMultipleLocations, deps };
    };

    // `createFilters: false` is the boundary the tool description draws: tag these emails, propose no rule.
    it('resolves both kinds of reference and adds the labels without creating a filter', async () => {
        const { references, emailReference, labelReference, element, applyMultipleLocations, deps } = setUp();

        await createApplyLabelsHandler(deps)({ ids: [emailReference], labels: [labelReference] }, { references });

        expect(applyMultipleLocations).toHaveBeenCalledWith({
            elements: [element],
            createFilters: false,
            changes: { LABEL_ID_1: true },
        });
    });

    // `applyMultipleLocations` throws a bare `'Elements are required'` here, which reaches the model only
    // as "the tool failed" — while its result tile already reads as applied.
    it('rejects an empty selection before touching apply-location', async () => {
        const { references, labelReference, applyMultipleLocations, deps } = setUp();

        await expect(
            createApplyLabelsHandler(deps)({ ids: [], labels: [labelReference] }, { references })
        ).rejects.toThrow(/at least one email-…/);
        expect(applyMultipleLocations).not.toHaveBeenCalled();
    });

    it('rejects a hallucinated label reference before touching apply-location', async () => {
        const { references, emailReference, applyMultipleLocations, deps } = setUp();

        await expect(
            createApplyLabelsHandler(deps)({ ids: [emailReference], labels: ['label-zzzzzz'] }, { references })
        ).rejects.toThrow();
        expect(applyMultipleLocations).not.toHaveBeenCalled();
    });
});
