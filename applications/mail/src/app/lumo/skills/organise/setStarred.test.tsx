import { fireEvent, render, screen } from '@testing-library/react';

import type { ActionRequest } from '@proton/llm/lib/lumoAgent/contracts/types';
import { createReferenceRegistry } from '@proton/llm/lib/lumoAgent/engine/referenceRegistry';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { APPLY_LOCATION_TYPES } from 'proton-mail/hooks/actions/applyLocation/interface';

import type { MailToolDeps } from '../../toolModule';
import { createSetStarredHandler, setStarredCardRenderer, setStarredDefinition } from './setStarred';

describe('setStarredDefinition', () => {
    it('is a mutation with a closed, $ref-free schema over the documented params', () => {
        expect(setStarredDefinition.kind).toBe('mutation');
        expect(setStarredDefinition.paramsSchema.additionalProperties).toBe(false);
        expect(setStarredDefinition.paramsSchema.required).toEqual(['ids', 'starred']);
    });

    it('tells the model not to set a state an email is already in, in either direction', () => {
        expect(setStarredDefinition.toolDescription).toContain('already in the state you are setting');
    });

    it('tells the model the star state is set, not toggled', () => {
        expect(setStarredDefinition.toolDescription).toContain('rather than toggling it');
    });

    it('documents that an unstarred row simply omits the starred flag', () => {
        expect(setStarredDefinition.toolDescription).toContain('a row without it is not');
    });

    it('labels the transparency chip by direction', () => {
        const starLabel = setStarredDefinition.summarizeChip({ ids: [], starred: true }, undefined).label;
        const unstarLabel = setStarredDefinition.summarizeChip({ ids: [], starred: false }, undefined).label;

        expect(starLabel).toBeTruthy();
        expect(unstarLabel).toBeTruthy();
        expect(starLabel).not.toBe(unstarLabel);
    });
});

describe('setStarredCardRenderer', () => {
    const starAction: ActionRequest = {
        type: 'set_starred',
        ids: ['email-a1b2c3', 'email-d4e5f6'],
        starred: true,
    };
    const unstarAction: ActionRequest = {
        type: 'set_starred',
        ids: ['email-a1b2c3', 'email-d4e5f6'],
        starred: false,
    };
    const labels = { 'email-a1b2c3': 'Booking confirmation', 'email-d4e5f6': 'Receipt' };

    it('titles the card by direction and leaves the subtitle unset (starring has no destination)', () => {
        const starTitle = setStarredCardRenderer.title(starAction, labels);
        const unstarTitle = setStarredCardRenderer.title(unstarAction, labels);

        expect(starTitle).toBeTruthy();
        expect(unstarTitle).toBeTruthy();
        expect(starTitle).not.toBe(unstarTitle);
        expect(setStarredCardRenderer.subtitle).toBeUndefined();
    });

    it('lists the proposed emails by subject and deselects one on toggle, keeping the proposed set intact', () => {
        const onChange = jest.fn();
        render(
            <>
                {setStarredCardRenderer.renderBody?.({
                    action: starAction,
                    labels,
                    params: { ids: [...starAction.ids], starred: true },
                    onChange,
                })}
            </>
        );
        expect(screen.getByText('Booking confirmation')).toBeInTheDocument();
        expect(screen.getByText('Receipt')).toBeInTheDocument();

        const [first] = screen.getAllByRole('checkbox');
        fireEvent.click(first);
        expect(onChange).toHaveBeenCalledWith({ ids: ['email-d4e5f6'], starred: true });
        expect(starAction.ids).toEqual(['email-a1b2c3', 'email-d4e5f6']);
    });

    it('names the affected emails on the result tile', () => {
        expect(setStarredCardRenderer.detail?.(starAction, labels)).toBe('Booking confirmation, Receipt');
    });
});

describe('createSetStarredHandler', () => {
    const setUp = () => {
        const references = createReferenceRegistry();
        const emailReference = references.referenceFor('email', 'ELEMENT_ID_1', 'Booking');
        const element = { ID: 'ELEMENT_ID_1' };
        const store = { getState: () => ({ elements: { elements: { ELEMENT_ID_1: element } } }) };
        const applyLocation = jest.fn().mockResolvedValue([]);
        const deps = { store, applyLocation } as unknown as MailToolDeps;

        return { references, emailReference, element, applyLocation, deps };
    };

    // `removeLabel` is the inverse of the requested state: setting a star adds the label, clearing it removes it.
    it.each([
        ['stars', true, false],
        ['unstars', false, true],
    ])('resolves references to elements and %s them without toggling', async (_name, starred, removeLabel) => {
        const { references, emailReference, element, applyLocation, deps } = setUp();

        await createSetStarredHandler(deps)({ ids: [emailReference], starred }, { references });

        expect(applyLocation).toHaveBeenCalledWith({
            type: APPLY_LOCATION_TYPES.STAR,
            elements: [element],
            destinationLabelID: MAILBOX_LABEL_IDS.STARRED,
            removeLabel,
        });
    });

    it('rejects a hallucinated reference before touching apply-location', async () => {
        const references = createReferenceRegistry();
        const store = { getState: () => ({ elements: { elements: {} } }) };
        const applyLocation = jest.fn();
        const deps = { store, applyLocation } as unknown as MailToolDeps;

        await expect(
            createSetStarredHandler(deps)({ ids: ['email-zzzzzz'], starred: true }, { references })
        ).rejects.toThrow();
        expect(applyLocation).not.toHaveBeenCalled();
    });
});
