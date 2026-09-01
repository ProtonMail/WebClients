import { createReferenceRegistry } from '@proton/llm/lib/lumoAgent/engine/referenceRegistry';
import { MARK_AS_STATUS } from '@proton/shared/lib/mail/constants';

import { SOURCE_ACTION } from '../../../components/list/list-telemetry/useListTelemetry';
import type { MailToolDeps } from '../../toolModule';
import { emailCountDetail, hasEmailSelection, renderEmailSelectionBody } from './emailSelection';
import { createSetReadHandler, setReadCardRenderer, setReadDefinition } from './setRead';

describe('setReadDefinition', () => {
    // Without this, a whole-folder request is proposed as a set_read over the handful of rows on screen,
    // which silently under-delivers rather than failing.
    it('sends the model to set_location_read for a whole folder', () => {
        expect(setReadDefinition.toolDescription).toContain('use set_location_read');
    });
});

describe('setReadCardRenderer', () => {
    it('takes the shared selection body, its empty-apply rule and the shared count detail', () => {
        expect(setReadCardRenderer.renderBody).toBe(renderEmailSelectionBody);
        expect(setReadCardRenderer.canApply).toBe(hasEmailSelection);
        expect(setReadCardRenderer.detail).toBe(emailCountDetail);
    });
});

describe('createSetReadHandler', () => {
    const setUp = () => {
        const references = createReferenceRegistry();
        const emailReference = references.referenceFor('email', 'ELEMENT_ID_1', { title: 'Booking' });
        const element = { ID: 'ELEMENT_ID_1' };
        const store = {
            getState: () => ({
                elements: { elements: { ELEMENT_ID_1: element }, params: { labelID: '0' } },
            }),
        };
        const markAs = jest.fn().mockResolvedValue(undefined);
        const deps = { store, markAs } as unknown as MailToolDeps;

        return { references, emailReference, element, markAs, deps };
    };

    it.each([
        ['read', true, MARK_AS_STATUS.READ],
        ['unread', false, MARK_AS_STATUS.UNREAD],
    ])('resolves references to elements and marks them %s without toggling', async (_name, read, status) => {
        const { references, emailReference, element, markAs, deps } = setUp();

        await createSetReadHandler(deps)({ ids: [emailReference], read }, { references });

        expect(markAs).toHaveBeenCalledWith({
            elements: [element],
            status,
            silent: true,
            labelID: '0',
            sourceAction: SOURCE_ACTION.TOOLBAR,
        });
    });

    // `useMarkAs` resolves cleanly on an empty selection, so the engine would feed back a success the model
    // then relays to the user.
    it('rejects an empty selection rather than reporting a mark that never ran', async () => {
        const { references, markAs, deps } = setUp();

        await expect(createSetReadHandler(deps)({ ids: [], read: true }, { references })).rejects.toThrow(
            /at least one email-…/
        );
        expect(markAs).not.toHaveBeenCalled();
    });

    it('rejects a hallucinated reference before touching mark-as', async () => {
        const references = createReferenceRegistry();
        const store = { getState: () => ({ elements: { elements: {}, params: { labelID: '0' } } }) };
        const markAs = jest.fn();
        const deps = { store, markAs } as unknown as MailToolDeps;

        await expect(
            createSetReadHandler(deps)({ ids: ['email-zzzzzz'], read: true }, { references })
        ).rejects.toThrow();
        expect(markAs).not.toHaveBeenCalled();
    });
});
