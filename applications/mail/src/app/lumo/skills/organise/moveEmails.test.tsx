import type { ActionRequest } from '@proton/llm/lib/lumoAgent/contracts/types';
import { createReferenceRegistry } from '@proton/llm/lib/lumoAgent/engine/referenceRegistry';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { APPLY_LOCATION_TYPES } from '../../../hooks/actions/applyLocation/interface';
import type { MailToolDeps } from '../../toolModule';
import { hasEmailSelection, renderEmailSelectionBody } from './emailSelection';
import { createMoveEmailsHandler, moveEmailsCardRenderer, moveEmailsDefinition, resolveMoveTarget } from './moveEmails';

describe('resolveMoveTarget', () => {
    it('accepts a system location', () => {
        expect(resolveMoveTarget({ folder: null, location: 'trash' })).toEqual({ location: 'trash' });
    });

    it('accepts a custom folder', () => {
        expect(resolveMoveTarget({ folder: 'folder-x7b2q1', location: null })).toEqual({ folder: 'folder-x7b2q1' });
    });

    it('rejects when both or neither are set', () => {
        expect(() => resolveMoveTarget({ folder: 'folder-x7b2q1', location: 'trash' })).toThrow(/EXACTLY ONE/);
        expect(() => resolveMoveTarget({ folder: null, location: null })).toThrow(/EXACTLY ONE/);
    });

    it('rejects an unknown system location', () => {
        expect(() => resolveMoveTarget({ folder: null, location: 'outbox' })).toThrow(/Unknown location/);
    });
});

describe('moveEmailsDefinition', () => {
    it('is a mutation with a closed, $ref-free schema over the documented params', () => {
        expect(moveEmailsDefinition.kind).toBe('mutation');
        expect(moveEmailsDefinition.paramsSchema.additionalProperties).toBe(false);
        expect(moveEmailsDefinition.paramsSchema.required).toEqual(['ids', 'folder', 'location']);
    });
});

describe('moveEmailsCardRenderer', () => {
    const action: ActionRequest = {
        type: 'move_emails',
        ids: ['email-a1b2c3', 'email-d4e5f6'],
        folder: null,
        location: 'trash',
    };
    const labels = { 'email-a1b2c3': { title: 'Booking confirmation' }, 'email-d4e5f6': { title: 'Receipt' } };

    it('titles the card and subtitles a system-location move', () => {
        expect(moveEmailsCardRenderer.title(action, labels)).toBeTruthy();
        expect(moveEmailsCardRenderer.subtitle?.(action, labels)).toContain('Trash');
    });

    it('subtitles a folder move by the folder name', () => {
        const folderAction: ActionRequest = {
            type: 'move_emails',
            ids: ['email-a1b2c3'],
            folder: 'folder-x7b2q1',
            location: null,
        };
        expect(moveEmailsCardRenderer.subtitle?.(folderAction, { 'folder-x7b2q1': { title: 'Travel' } })).toContain(
            'Travel'
        );
    });

    it('takes the shared selection body and its empty-apply rule', () => {
        expect(moveEmailsCardRenderer.renderBody).toBe(renderEmailSelectionBody);
        expect(moveEmailsCardRenderer.canApply).toBe(hasEmailSelection);
    });

    it('describes the settled move on the result tile', () => {
        expect(moveEmailsCardRenderer.detail?.(action, labels)).toContain('Trash');
    });
});

describe('createMoveEmailsHandler', () => {
    it('resolves references to elements and applies a MOVE to the system label', async () => {
        const references = createReferenceRegistry();
        const emailReference = references.referenceFor('email', 'ELEMENT_ID_1', { title: 'Booking' });
        const element = { ID: 'ELEMENT_ID_1' };
        const store = { getState: () => ({ elements: { elements: { ELEMENT_ID_1: element } } }) };
        const applyLocation = jest.fn().mockResolvedValue([]);
        const deps = { store, applyLocation } as unknown as MailToolDeps;

        await createMoveEmailsHandler(deps)({ ids: [emailReference], folder: null, location: 'trash' }, { references });

        expect(applyLocation).toHaveBeenCalledWith({
            type: APPLY_LOCATION_TYPES.MOVE,
            elements: [element],
            destinationLabelID: MAILBOX_LABEL_IDS.TRASH,
        });
    });

    it('rejects a hallucinated reference before touching apply-location', async () => {
        const references = createReferenceRegistry();
        const store = { getState: () => ({ elements: { elements: {} } }) };
        const applyLocation = jest.fn();
        const deps = { store, applyLocation } as unknown as MailToolDeps;

        await expect(
            createMoveEmailsHandler(deps)({ ids: ['email-zzzzzz'], folder: null, location: 'trash' }, { references })
        ).rejects.toThrow();
        expect(applyLocation).not.toHaveBeenCalled();
    });
});
