import { ToolInputError } from '@proton/llm/lib/lumoAgent/contracts/errors';
import type { ActionRequest, ReferenceLabels } from '@proton/llm/lib/lumoAgent/contracts/types';
import { createReferenceRegistry } from '@proton/llm/lib/lumoAgent/engine/referenceRegistry';
import sentenceText from '@proton/llm/lib/lumoAgent/ui/sentenceText';
import { LABEL_TYPE } from '@proton/shared/lib/constants';
import type { Folder } from '@proton/shared/lib/interfaces/Folder';

import { DefaultFolderReference } from '../../helpers/defaultFolders';
import type { MailToolDeps } from '../../toolModule';
import { createRenameFolderHandler, renameFolderDefinition, renameFolderModule } from './renameFolder';

const folder = (overrides: Partial<Folder> = {}): Folder => ({
    ID: 'FOLDER_ID_1',
    Name: 'Travel',
    Color: '#c44800',
    Path: 'Travel',
    Expanded: 0,
    Type: LABEL_TYPE.MESSAGE_FOLDER,
    Order: 1,
    Notify: 1,
    LastUnseenMessageEventID: null,
    ...overrides,
});

const setUp = (folders: Folder[]) => {
    const references = createReferenceRegistry();
    const folderReference = references.referenceFor('folder', 'FOLDER_ID_1', { title: 'Travel' });
    const updateLabel = vi.fn().mockResolvedValue(undefined);
    const deps = { getFolders: () => folders, updateLabel } as unknown as MailToolDeps;

    return { references, folderReference, updateLabel, deps };
};

// `name` is free text the user types, and the engine's hallucination guard rejects any reference-shaped
// value no read returned — so "family-photos" would never reach the handler if it stayed guarded.
describe('renameFolderDefinition', () => {
    it('exempts the new name from the reference guard, leaving the folder itself guarded', () => {
        const guarded = Object.keys(renameFolderDefinition.paramsSchema.properties).filter(
            (param) => !renameFolderDefinition.freeTextParams?.includes(param)
        );

        expect(guarded).toEqual(['folder']);
    });

    // Checked on the arguments, so the engine refuses it before the confirm card and before any API call.
    it('refuses a default folder', () => {
        const check = () =>
            renameFolderDefinition.checkParams?.({ folder: DefaultFolderReference.INBOX, name: 'Mail' });

        expect(check).toThrow(ToolInputError);
        expect(check).toThrow(/cannot be renamed/);
    });
});

describe('renameFolderCardRenderer', () => {
    const sentence = (action: ActionRequest, labels: ReferenceLabels) =>
        sentenceText(renameFolderModule.cardRenderer!.sentence(action, labels));

    // A reference with no recorded name would otherwise put `folder-x7b2q1` — or `undefined` for a
    // missing param — in the headline the user approves.
    it('names the folder, or says "this folder" when no name was recorded', () => {
        const action = { type: 'rename_folder', folder: 'folder-x7b2q1', name: '' } as ActionRequest;

        expect(sentence(action, { 'folder-x7b2q1': { title: 'Travel' } })).toContain('Travel');
        expect(sentence(action, {})).toBe('Rename this folder');
        expect(sentence({ type: 'rename_folder' } as ActionRequest, {})).toBe('Rename this folder');
    });
});

describe('createRenameFolderHandler', () => {
    it.each([
        ['a top-level folder', {}],
        ['a nested folder', { ParentID: 'PARENT_ID_1' }],
    ])('renames %s, preserving every field it does not change', async (_case, overrides) => {
        const existing = folder(overrides);
        const { references, folderReference, updateLabel, deps } = setUp([existing]);

        await createRenameFolderHandler(deps)({ folder: folderReference, name: 'Trips' }, { references });

        expect(updateLabel).toHaveBeenCalledWith({ labelID: 'FOLDER_ID_1', label: { ...existing, Name: 'Trips' } });
    });

    it('trims a name the user padded on the card', async () => {
        const { references, folderReference, updateLabel, deps } = setUp([folder()]);

        await createRenameFolderHandler(deps)({ folder: folderReference, name: '  Trips  ' }, { references });

        expect(updateLabel).toHaveBeenCalledWith(
            expect.objectContaining({ label: expect.objectContaining({ Name: 'Trips' }) })
        );
    });

    // Later cards read the folder's name from the registry, so it must carry the new one.
    it('records the trimmed new name for later cards', async () => {
        const { references, folderReference, deps } = setUp([folder()]);

        await createRenameFolderHandler(deps)({ folder: folderReference, name: '  Trips  ' }, { references });

        expect(references.labelFor(folderReference)?.title).toBe('Trips');
    });

    it('keeps the recorded name when the rename fails', async () => {
        const { references, folderReference, updateLabel, deps } = setUp([folder()]);
        updateLabel.mockRejectedValue(new Error('network'));

        await expect(
            createRenameFolderHandler(deps)({ folder: folderReference, name: 'Trips' }, { references })
        ).rejects.toThrow('network');
        expect(references.labelFor(folderReference)?.title).toBe('Travel');
    });

    it('reports a folder that no longer exists, rather than renaming nothing', async () => {
        const { references, folderReference, updateLabel, deps } = setUp([]);

        await expect(
            createRenameFolderHandler(deps)({ folder: folderReference, name: 'Trips' }, { references })
        ).rejects.toThrow(/no longer exists/);
        expect(updateLabel).not.toHaveBeenCalled();
    });
});
