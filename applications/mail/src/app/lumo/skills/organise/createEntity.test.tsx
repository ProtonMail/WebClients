import type { ReferenceRegistry } from '@proton/llm/lib/lumoAgent/contracts/types';
import { createReferenceRegistry } from '@proton/llm/lib/lumoAgent/engine/referenceRegistry';
import { LABEL_TYPE } from '@proton/shared/lib/constants';
import type { Label } from '@proton/shared/lib/interfaces';
import { buildLabel } from '@proton/testing/builders/label';

import type { MailToolDeps } from '../../toolModule';
import type { CreatedEntityResult } from './createEntity';
import { createFolderDefinition, createFolderModule, createLabelDefinition, createLabelModule } from './createEntity';

const setUp = (created: Label) => {
    const references = createReferenceRegistry();
    const createLabel = jest.fn().mockResolvedValue(created);

    return { references, createLabel, deps: { createLabel } as unknown as MailToolDeps };
};

describe('createFolderModule', () => {
    // The backend normalises the name it is given, so a reference minted from the model's argument would
    // name an entity that does not exist — and the chain into move_emails would resolve to nothing.
    it('mints the reference from the folder the server returned, not from the name the model asked for', async () => {
        const { references, deps } = setUp(
            buildLabel({ ID: 'FOLDER_ID_1', Name: 'Hotels', Type: LABEL_TYPE.MESSAGE_FOLDER })
        );

        const result: CreatedEntityResult = await createFolderModule.createHandler(deps)(
            { name: 'hotels ', parentId: null },
            { references }
        );

        expect(result).toEqual({ reference: expect.stringMatching(/^folder-[0-9a-z]{6}$/), name: 'Hotels' });
        expect(references.idFor(result.reference)).toBe('FOLDER_ID_1');
        expect(references.labelFor(result.reference)).toBe('Hotels');
    });

    it('nests under the parent reference, sending the real folder id', async () => {
        const { references, createLabel, deps } = setUp(
            buildLabel({ ID: 'FOLDER_ID_2', Name: 'Hotels', Type: LABEL_TYPE.MESSAGE_FOLDER })
        );
        const parent = references.referenceFor('folder', 'FOLDER_ID_1', 'Travel');

        await createFolderModule.createHandler(deps)({ name: 'Hotels', parentId: parent }, { references });

        expect(createLabel).toHaveBeenCalledWith({
            label: {
                Name: 'Hotels',
                Color: expect.any(String),
                Type: LABEL_TYPE.MESSAGE_FOLDER,
                Notify: 1,
                ParentID: 'FOLDER_ID_1',
            },
        });
    });
});

describe('createLabelModule', () => {
    it('creates a label rather than a folder, with neither a parent nor folder notifications', async () => {
        const { references, createLabel, deps } = setUp(buildLabel({ ID: 'LABEL_ID_1', Name: 'Receipts' }));

        await createLabelModule.createHandler(deps)({ name: 'Receipts' }, { references });

        expect(createLabel).toHaveBeenCalledWith({
            label: { Name: 'Receipts', Color: expect.any(String), Type: LABEL_TYPE.MESSAGE_LABEL },
        });
    });
});

// The one mutation family whose result reaches the model: without the reference in it, the model has to
// re-read list_folders / list_labels before it can act on what it just created.
describe('serializeForLumo', () => {
    const anyReferences = {} as ReferenceRegistry;

    it('carries the reference and the name the server settled on', () => {
        expect(
            createFolderDefinition.serializeForLumo({ reference: 'folder-x7b2q1', name: 'Hotels' }, anyReferences)
        ).toBe('Created folder folder-x7b2q1 | "Hotels".');
        expect(
            createLabelDefinition.serializeForLumo({ reference: 'label-m3n4p5', name: 'Receipts' }, anyReferences)
        ).toBe('Created label label-m3n4p5 | "Receipts".');
    });
});
