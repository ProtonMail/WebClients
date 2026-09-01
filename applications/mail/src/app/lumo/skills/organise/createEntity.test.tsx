import { ToolInputError } from '@proton/llm/lib/lumoAgent/contracts/errors';
import type { ActionRequest, ReferenceRegistry } from '@proton/llm/lib/lumoAgent/contracts/types';
import { createReferenceRegistry } from '@proton/llm/lib/lumoAgent/engine/referenceRegistry';
import { LABEL_TYPE } from '@proton/shared/lib/constants';
import type { Label } from '@proton/shared/lib/interfaces';
import type { Folder } from '@proton/shared/lib/interfaces/Folder';
import { buildFolder } from '@proton/testing/builders/folder';
import { buildLabel } from '@proton/testing/builders/label';

import type { MailToolDeps } from '../../toolModule';
import type { CreatedEntityResult } from './createEntity';
import {
    createFolderCardRenderer,
    createFolderDefinition,
    createFolderModule,
    createLabelDefinition,
    createLabelModule,
} from './createEntity';

/** Travel > Europe > France: Europe is a legal parent, France already sits at the nesting limit. */
const NESTED_FOLDERS = [
    buildFolder({ ID: 'TRAVEL', Name: 'Travel', Path: 'Travel' }),
    buildFolder({ ID: 'EUROPE', Name: 'Europe', Path: 'Travel/Europe', ParentID: 'TRAVEL' }),
    buildFolder({ ID: 'FRANCE', Name: 'France', Path: 'Travel/Europe/France', ParentID: 'EUROPE' }),
];

const setUp = (created: Label, folders: Folder[] = []) => {
    const references = createReferenceRegistry();
    const createLabel = jest.fn().mockResolvedValue(created);
    const getFolders = jest.fn().mockReturnValue(folders);

    return { references, createLabel, deps: { createLabel, getFolders } as unknown as MailToolDeps };
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
        expect(references.labelFor(result.reference)?.title).toBe('Hotels');
    });

    it('nests under the parent reference, sending the real folder id', async () => {
        const { references, createLabel, deps } = setUp(
            buildLabel({ ID: 'FOLDER_ID_2', Name: 'Hotels', Type: LABEL_TYPE.MESSAGE_FOLDER })
        );
        const parent = references.referenceFor('folder', 'FOLDER_ID_1', { title: 'Travel' });

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

    // The app's own parent picker cannot offer a folder this deep, so without the guard the user confirms a
    // nesting the API then rejects.
    it('refuses a parent already at the nesting limit, before anything is created', async () => {
        const { references, createLabel, deps } = setUp(
            buildLabel({ ID: 'FOLDER_ID_3', Name: 'Hotels', Type: LABEL_TYPE.MESSAGE_FOLDER }),
            NESTED_FOLDERS
        );
        const france = references.referenceFor('folder', 'FRANCE', { title: 'France' });

        await expect(
            createFolderModule.createHandler(deps)({ name: 'Hotels', parentId: france }, { references })
        ).rejects.toThrow(ToolInputError);
        expect(createLabel).not.toHaveBeenCalled();
    });

    it('still nests under a parent one level short of the limit', async () => {
        const { references, createLabel, deps } = setUp(
            buildLabel({ ID: 'FOLDER_ID_4', Name: 'Hotels', Type: LABEL_TYPE.MESSAGE_FOLDER }),
            NESTED_FOLDERS
        );
        const europe = references.referenceFor('folder', 'EUROPE', { title: 'Europe' });

        await createFolderModule.createHandler(deps)({ name: 'Hotels', parentId: europe }, { references });

        expect(createLabel).toHaveBeenCalledWith({
            label: expect.objectContaining({ ParentID: 'EUROPE' }),
        });
    });
});

describe('createFolderCardRenderer', () => {
    // list_folders mints the parent reference without a name, so an unrecorded parent must lose the clause
    // rather than show the user a raw reference.
    it('names the parent the folder nests under, and says nothing when that name was never recorded', () => {
        const action: ActionRequest = { type: 'create_folder', name: 'Hotels', parentId: 'folder-x7b2q1' };

        expect(createFolderCardRenderer.subtitle?.(action, { 'folder-x7b2q1': { title: 'Travel' } })).toBe(
            'Hotels in Travel'
        );
        expect(createFolderCardRenderer.subtitle?.(action, {})).toBe('Hotels');
    });
});

describe('createLabelModule', () => {
    it('creates a label rather than a folder, with neither a parent nor folder notifications', async () => {
        const { references, createLabel, deps } = setUp(buildLabel({ ID: 'LABEL_ID_1', Name: 'Receipts' }));

        await createLabelModule.createHandler(deps)({ name: 'Receipts' }, { references });

        expect(createLabel).toHaveBeenCalledWith({
            label: { Name: 'Receipts', Color: expect.any(String), Type: LABEL_TYPE.MESSAGE_LABEL, Notify: 0 },
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
