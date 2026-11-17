import { fireEvent, screen } from '@testing-library/react';

import { getModelState } from '@proton/account/testing/getModelState';
import { ToolInputError } from '@proton/llm/lib/lumoAgent/contracts/errors';
import type { ActionRequest, ReferenceRegistry } from '@proton/llm/lib/lumoAgent/contracts/types';
import { createReferenceRegistry } from '@proton/llm/lib/lumoAgent/engine/referenceRegistry';
import type { CardRenderer } from '@proton/llm/lib/lumoAgent/ui/types';
import { buildFolder } from '@proton/mail/testing/buildFolder';
import { buildLabel } from '@proton/mail/testing/buildLabel';
import { LABEL_TYPE } from '@proton/shared/lib/constants';
import type { Folder } from '@proton/shared/lib/interfaces/Folder';
import type { Label } from '@proton/shared/lib/interfaces/Label';

import { mailTestRender } from '../../../helpers/tests/render';
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

    // The card can swap in a parent the model never named, so without its name the model's reply shows a handle.
    it('names the parent in the result the model sees', async () => {
        const { references, deps } = setUp(
            buildLabel({ ID: 'FOLDER_ID_5', Name: 'Hotels', Type: LABEL_TYPE.MESSAGE_FOLDER }),
            NESTED_FOLDERS
        );
        const europe = references.referenceFor('folder', 'EUROPE');

        const result = await createFolderModule.createHandler(deps)(
            { name: 'Hotels', parentId: europe },
            { references }
        );

        expect(result.parent).toEqual({ reference: europe, name: 'Europe' });
        expect(createFolderDefinition.serializeForLumo(result, references)).toBe(
            `Created folder ${result.reference} | "Hotels" inside folder ${europe} | "Europe".`
        );
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

        expect(createFolderCardRenderer.detail?.(action, { 'folder-x7b2q1': { title: 'Travel' } })).toBe(
            'Hotels in Travel'
        );
        expect(createFolderCardRenderer.detail?.(action, {})).toBe('Hotels');
    });
});

describe('the create-folder card body', () => {
    const FOLDERS = [...NESTED_FOLDERS, buildFolder({ ID: 'WORK', Name: 'Work', Path: 'Work' })];

    // `parentId` is minted in the registry the card is handed, as the model's references are.
    const renderBody = async (parentFolderID?: string, renderer: CardRenderer = createFolderCardRenderer) => {
        const references = createReferenceRegistry();
        const parentId = parentFolderID ? references.referenceFor('folder', parentFolderID) : null;
        const onChange = jest.fn();
        const params = { name: 'Hotels', parentId };
        const action: ActionRequest = { type: 'create_folder', ...params };

        await mailTestRender(<>{renderer.renderBody?.({ action, labels: {}, params, onChange, references })}</>, {
            preloadedState: { categories: getModelState(FOLDERS) },
        });

        return { references, onChange, parentId };
    };

    const location = () => {
        return screen.getByRole('button', { name: 'Folder location' });
    };

    const pick = async (option: string) => {
        fireEvent.click(location());
        fireEvent.click(await screen.findByRole('button', { name: option }));
    };

    it("preselects the model's proposed parent", async () => {
        await renderBody('TRAVEL');

        expect(location()).toHaveTextContent('Travel');
    });

    it('shows "No parent folder" when the model proposed none', async () => {
        await renderBody();

        expect(location()).toHaveTextContent('No parent folder');
    });

    // The handler resolves `parentId` through the registry, and the settled tile names the parent from
    // the reference's label, so a pick must be a named reference to the real folder.
    it('turns a picked folder into a named reference to it', async () => {
        const { references, onChange } = await renderBody('TRAVEL');

        await pick('Work');

        const { parentId } = onChange.mock.lastCall[0];
        expect(onChange).toHaveBeenLastCalledWith({ name: 'Hotels', parentId });
        expect(references.idFor(parentId)).toBe('WORK');
        expect(references.labelFor(parentId)?.title).toBe('Work');
    });

    it('clears the parent when "No parent folder" is picked', async () => {
        const { onChange } = await renderBody('TRAVEL');

        await pick('No parent folder');

        expect(onChange).toHaveBeenLastCalledWith({ name: 'Hotels', parentId: null });
    });

    // The handler refuses a parent at the nesting limit, so the picker must not offer one.
    it('offers no parent already at the nesting limit', async () => {
        await renderBody();

        fireEvent.click(location());

        expect(await screen.findByRole('button', { name: /Europe/ })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /France/ })).not.toBeInTheDocument();
    });

    // A parent the picker cannot show would read as blank on the card yet still be sent on Confirm.
    it.each([
        ['already at the nesting limit', 'FRANCE'],
        ['no longer in the folder list', 'DELETED'],
    ])('drops a proposed parent %s, so Confirm applies the "No parent folder" the card shows', async (_, folderID) => {
        const { onChange } = await renderBody(folderID);

        expect(location()).toHaveTextContent('No parent folder');
        expect(onChange).toHaveBeenLastCalledWith({ name: 'Hotels', parentId: null });
    });

    it('keeps the proposed parent when the name is edited', async () => {
        const { onChange, parentId } = await renderBody('TRAVEL');

        fireEvent.change(screen.getByRole('textbox', { name: 'Folder name' }), { target: { value: 'Inns' } });

        expect(onChange).toHaveBeenLastCalledWith({ name: 'Inns', parentId });
    });

    // A host that hands the card no registry cannot resolve or mint a parent, so it gets the name field alone.
    it('shows only the name field when the card is handed no references', async () => {
        const params = { name: 'Hotels', parentId: null };
        const body = createFolderCardRenderer.renderBody?.({
            action: { type: 'create_folder', ...params },
            labels: {},
            params,
            onChange: jest.fn(),
        });

        await mailTestRender(<>{body}</>, { preloadedState: { categories: getModelState(FOLDERS) } });

        expect(screen.getByRole('textbox', { name: 'Folder name' })).toBeInTheDocument();
        expect(screen.queryByText('Folder location')).not.toBeInTheDocument();
    });

    it('offers no folder location on the create-label card', async () => {
        await renderBody(undefined, createLabelModule.cardRenderer!);

        expect(screen.getByRole('textbox', { name: 'Label name' })).toBeInTheDocument();
        expect(screen.queryByText('Folder location')).not.toBeInTheDocument();
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
