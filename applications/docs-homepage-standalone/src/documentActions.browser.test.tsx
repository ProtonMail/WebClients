import { page, userEvent } from 'vitest/browser';

import { recentsDependencies } from './mocks/recents';
import { documentRow, documentsTable, openHomepage, pickAction, sidebar, tabTo } from './test/browser';

const projectPlan = { linkId: 'plan', name: 'Project plan', type: 'document' } as const;
const budget = { linkId: 'budget', name: 'Budget', type: 'spreadsheet' } as const;

/** The items of the open three-dot menu, in order. */
async function menuItemNames() {
    await expect.element(page.getByRole('menu')).toBeVisible();
    return page
        .getByRole('menuitem')
        .elements()
        .map((item) => item.textContent);
}

describe('three-dot menu (document actions)', () => {
    it('opens the document’s folder in Drive', async () => {
        // Stubbed, so that no tab opens.
        const open = vi.spyOn(window, 'open').mockReturnValue(null);
        const getAppHref = vi.fn((path: string) => path);
        const shareId = 'plan-share-id';
        const folder = { linkId: 'projects-folder-id', name: 'projects' };
        openHomepage('/recents', {
            ...recentsDependencies([{ ...projectPlan, shareId, path: [folder] }]),
            getAppHref,
        });

        await userEvent.click(documentsTable.getByRole('button', { name: 'Actions' }));
        await userEvent.click(page.getByRole('menuitem', { name: 'Open folder' }));

        const folderPath = `/${shareId}/folder/${folder.linkId}`;
        expect(getAppHref).toHaveBeenCalledWith(folderPath, 'proton-drive');
        expect(open).toHaveBeenCalledExactlyOnceWith(folderPath);
    });

    describe('rename', () => {
        it('renames a document', async () => {
            const dependencies = recentsDependencies([projectPlan]);
            const renameNode = vi.spyOn(dependencies.drive, 'renameNode');
            openHomepage('/recents', dependencies);

            await userEvent.click(documentsTable.getByRole('button', { name: 'Actions' }));
            await userEvent.click(page.getByRole('menuitem', { name: 'Rename' }));
            await userEvent.fill(documentsTable.getByRole('textbox'), 'Roadmap');
            await userEvent.keyboard('{Enter}');

            await expect.element(documentsTable.getByText('Roadmap', { exact: true })).toBeVisible();
            await expect.element(documentsTable.getByText('Project plan')).not.toBeInTheDocument();
            expect(renameNode).toHaveBeenCalledExactlyOnceWith('volume~plan', 'Roadmap');
            expect(await dependencies.drive.getNode('volume~plan')).toMatchObject({
                name: { ok: true, value: 'Roadmap' },
            });
        });

        it('keeps a document’s name and shows an error when Drive fails to rename it', async () => {
            const dependencies = recentsDependencies([projectPlan]);
            vi.spyOn(dependencies.drive, 'renameNode').mockRejectedValue(new Error('Drive failed'));
            openHomepage('/recents', dependencies);

            await userEvent.click(documentsTable.getByRole('button', { name: 'Actions' }));
            await userEvent.click(page.getByRole('menuitem', { name: 'Rename' }));
            await userEvent.fill(documentsTable.getByRole('textbox'), 'Roadmap');
            await userEvent.keyboard('{Enter}');

            await expect.element(page.getByRole('alert')).toHaveTextContent('Failed to rename document');
            await expect.element(documentsTable.getByText('Project plan', { exact: true })).toBeVisible();
            await expect.element(documentsTable.getByText('Roadmap')).not.toBeInTheDocument();
        });
    });

    describe('trash and delete permanently', () => {
        it('moves a document to the trash, and back with undo', async () => {
            const dependencies = recentsDependencies([projectPlan]);
            const trashNodes = vi.spyOn(dependencies.drive, 'trashNodes');
            const restoreNodes = vi.spyOn(dependencies.drive, 'restoreNodes');
            openHomepage('/recents', dependencies);

            await userEvent.click(documentsTable.getByRole('button', { name: 'Actions' }));
            await userEvent.click(page.getByRole('menuitem', { name: 'Move to trash' }));

            await expect.element(page.getByRole('status').filter({ hasText: 'Document moved to trash' })).toBeVisible();
            await expect.element(documentsTable.getByText('Project plan')).not.toBeInTheDocument();
            expect(trashNodes).toHaveBeenCalledExactlyOnceWith(['volume~plan']);

            await userEvent.click(sidebar.getByRole('link', { name: 'Trash' }));
            await expect.element(documentsTable.getByText('Project plan', { exact: true })).toBeVisible();

            await userEvent.click(page.getByRole('button', { name: 'Undo' }));
            await expect
                .element(page.getByRole('status').filter({ hasText: 'Document restored from trash' }))
                .toBeVisible();
            expect(restoreNodes).toHaveBeenCalledExactlyOnceWith(['volume~plan']);

            await userEvent.click(sidebar.getByRole('link', { name: 'All' }));
            await expect.element(documentsTable.getByText('Project plan', { exact: true })).toBeVisible();
        });

        it('keeps a document and shows an error when the Drive SDK returns ok: false', async () => {
            const dependencies = recentsDependencies([projectPlan]);
            // Drive reports each node's failure as a result.
            vi.spyOn(dependencies.drive, 'trashNodes').mockImplementation(async function* () {
                yield { uid: 'volume~plan', ok: false, error: new Error('Drive failed') };
            });
            openHomepage('/recents', dependencies);

            await userEvent.click(documentsTable.getByRole('button', { name: 'Actions' }));
            await userEvent.click(page.getByRole('menuitem', { name: 'Move to trash' }));

            await expect.element(page.getByRole('alert')).toHaveTextContent('Failed to trash document');
            await expect.element(documentsTable.getByText('Project plan', { exact: true })).toBeVisible();
        });

        it('keeps a document and shows an error when the Drive SDK throws', async () => {
            const dependencies = recentsDependencies([projectPlan]);
            // The SDK throws as a whole, e.g. when offline.
            vi.spyOn(dependencies.drive, 'trashNodes').mockImplementation(async function* () {
                throw new Error('Network error');
            });
            openHomepage('/recents', dependencies);

            await userEvent.click(documentsTable.getByRole('button', { name: 'Actions' }));
            await userEvent.click(page.getByRole('menuitem', { name: 'Move to trash' }));

            await expect.element(page.getByRole('alert')).toHaveTextContent('Failed to trash document');
            await expect.element(documentsTable.getByText('Project plan', { exact: true })).toBeVisible();
        });

        it('deletes a document in the trash permanently', async () => {
            const dependencies = recentsDependencies([{ ...projectPlan, trashed: true }]);
            openHomepage('/trash', dependencies);

            await userEvent.click(documentsTable.getByRole('button', { name: 'Actions' }));
            await userEvent.click(page.getByRole('menuitem', { name: 'Delete permanently' }));
            const dialog = page.getByRole('dialog', { name: 'Delete permanently' });
            await expect.element(dialog).toHaveAccessibleDescription(/permanently delete "Project plan"/);
            await userEvent.click(dialog.getByRole('button', { name: 'Delete permanently' }));

            await expect.element(page.getByRole('status')).toHaveTextContent('Document deleted permanently');
            await expect.element(dialog).not.toBeInTheDocument();
            await expect.element(documentsTable.getByText('Project plan')).not.toBeInTheDocument();
            expect(await dependencies.drive.getNode('volume~plan')).toBeUndefined();
        });

        it('keeps a document in the trash and shows an error when Drive fails to delete it', async () => {
            const dependencies = recentsDependencies([{ ...projectPlan, trashed: true }]);
            vi.spyOn(dependencies.drive, 'deleteNodes').mockImplementation(async function* () {
                yield { uid: 'volume~plan', ok: false, error: new Error('Drive failed') };
            });
            openHomepage('/trash', dependencies);

            await userEvent.click(documentsTable.getByRole('button', { name: 'Actions' }));
            await userEvent.click(page.getByRole('menuitem', { name: 'Delete permanently' }));
            await userEvent.click(page.getByRole('dialog').getByRole('button', { name: 'Delete permanently' }));

            await expect.element(page.getByRole('alert')).toHaveTextContent('Failed to delete document');
            await expect.element(documentsTable.getByText('Project plan', { exact: true })).toBeVisible();
        });
    });

    it('opens the share modal', async () => {
        openHomepage('/recents', recentsDependencies([projectPlan]));

        await userEvent.click(documentsTable.getByRole('button', { name: 'Actions' }));
        await userEvent.click(page.getByRole('menuitem', { name: 'Share' }));

        await expect.element(page.getByRole('dialog', { name: 'Share' })).toBeVisible();
    });

    it('opens the move modal', async () => {
        openHomepage('/recents', recentsDependencies([projectPlan]));

        await userEvent.click(documentsTable.getByRole('button', { name: 'Actions' }));
        await userEvent.click(page.getByRole('menuitem', { name: 'Move' }));

        await expect.element(page.getByRole('dialog', { name: 'Move' })).toBeVisible();
    });

    describe('opening', () => {
        it('opens a document in the Docs editor when its row is clicked', async () => {
            const open = vi.spyOn(window, 'open').mockReturnValue(null);
            const getAppHref = vi.fn((path: string) => `https://docs.example${path}`);
            const reportTelemetry = vi.fn();
            openHomepage('/recents', { ...recentsDependencies([projectPlan]), getAppHref, reportTelemetry });

            await userEvent.click(documentRow('Project plan').getByText('Project plan'));

            const path = '/doc?mode=open&volumeId=volume&linkId=plan';
            expect(getAppHref).toHaveBeenCalledWith(path, 'proton-docs');
            expect(open).toHaveBeenCalledExactlyOnceWith(`https://docs.example${path}`);
            expect(reportTelemetry).toHaveBeenCalledWith('document.opened');
        });

        it('opens a spreadsheet in the Sheets editor', async () => {
            const open = vi.spyOn(window, 'open').mockReturnValue(null);
            openHomepage('/recents', recentsDependencies([budget]));

            await userEvent.click(documentRow('Budget').getByText('Budget'));

            expect(open).toHaveBeenCalledExactlyOnceWith('/sheet?mode=open&volumeId=volume&linkId=budget');
        });

        it('opens a document from its menu', async () => {
            const open = vi.spyOn(window, 'open').mockReturnValue(null);
            openHomepage('/recents', recentsDependencies([projectPlan]));

            await pickAction('Project plan', 'Open');

            expect(open).toHaveBeenCalledExactlyOnceWith('/doc?mode=open&volumeId=volume&linkId=plan');
            await expect.element(page.getByRole('menu')).not.toBeInTheDocument();
        });

        it('opens a document in the trash, and reports it as opened in the trash', async () => {
            const open = vi.spyOn(window, 'open').mockReturnValue(null);
            const reportTelemetry = vi.fn();
            openHomepage('/trash', { ...recentsDependencies([{ ...projectPlan, trashed: true }]), reportTelemetry });

            await userEvent.click(documentRow('Project plan').getByText('Project plan'));

            expect(open).toHaveBeenCalledExactlyOnceWith('/doc?mode=open&volumeId=volume&linkId=plan');
            expect(reportTelemetry).toHaveBeenCalledWith('document.opened_in_trash');
        });

        it('opens Drive’s trash from a trashed document’s location, without opening the document', async () => {
            const open = vi.spyOn(window, 'open').mockReturnValue(null);
            const getAppHref = vi.fn((path: string) => path);
            openHomepage('/trash', { ...recentsDependencies([{ ...projectPlan, trashed: true }]), getAppHref });

            await userEvent.click(documentRow('Project plan').getByRole('button', { name: 'Trash' }));

            expect(getAppHref).toHaveBeenCalledWith('/trash', 'proton-drive');
            expect(open).toHaveBeenCalledExactlyOnceWith('/trash');
        });

        it('opens a document’s folder from its location, and reports it', async () => {
            const open = vi.spyOn(window, 'open').mockReturnValue(null);
            const reportTelemetry = vi.fn();
            const folder = { linkId: 'projects', name: 'projects' };
            openHomepage('/recents', {
                ...recentsDependencies([{ ...projectPlan, shareId: 'share', path: [folder] }]),
                reportTelemetry,
            });

            await userEvent.click(documentRow('Project plan').getByRole('button', { name: 'projects' }));

            expect(open).toHaveBeenCalledExactlyOnceWith('/share/folder/projects');
            expect(reportTelemetry).toHaveBeenCalledWith('document.source.opened');
        });
    });

    describe('menu items by role', () => {
        it('offers every action on the user’s own document', async () => {
            openHomepage('/recents', recentsDependencies([projectPlan]));

            await userEvent.click(documentRow('Project plan').getByRole('button', { name: 'Actions' }));

            expect(await menuItemNames()).toEqual(['Open', 'Share', 'Move', 'Open folder', 'Rename', 'Move to trash']);
        });

        it.each([
            { role: 'admin', items: ['Open', 'Share', 'Open folder'] },
            { role: 'editor', items: ['Open', 'Open folder'] },
            { role: 'viewer', items: ['Open', 'Open folder'] },
        ] as const)('lets a document shared directly as $role be shared only by an admin', async ({ role, items }) => {
            openHomepage('/recents', recentsDependencies([{ ...projectPlan, sharedBy: 'alice@example.com', role }]));

            await userEvent.click(documentRow('Project plan').getByRole('button', { name: 'Actions' }));

            expect(await menuItemNames()).toEqual(items);
        });

        it('offers restoring and deleting a document in the trash', async () => {
            openHomepage('/trash', recentsDependencies([{ ...projectPlan, trashed: true }]));

            await userEvent.click(documentRow('Project plan').getByRole('button', { name: 'Actions' }));

            expect(await menuItemNames()).toEqual(['Restore from trash', 'Delete permanently']);
        });

        it('opens the same menu on a right-click on the row', async () => {
            openHomepage('/recents', recentsDependencies([projectPlan]));

            await userEvent.click(documentRow('Project plan').getByText('Project plan'), { button: 'right' });

            expect(await menuItemNames()).toEqual(['Open', 'Share', 'Move', 'Open folder', 'Rename', 'Move to trash']);
        });

        it('opens the menu from the keyboard, and gives the focus back to the button when Escape closes it', async () => {
            openHomepage('/recents', recentsDependencies([projectPlan]));
            const actions = documentRow('Project plan').getByRole('button', { name: 'Actions' });

            await tabTo(actions);
            await userEvent.keyboard('{Enter}');

            const menu = page.getByRole('menu');
            await expect.element(menu).toBeVisible();
            await vi.waitFor(() => expect(menu.element().contains(document.activeElement)).toBe(true));

            await userEvent.keyboard('{Escape}');

            await expect.element(menu).not.toBeInTheDocument();
            await expect.element(actions).toHaveFocus();
        });
    });

    describe('rename, more', () => {
        it('starts with the whole name selected, so typing replaces it', async () => {
            const dependencies = recentsDependencies([projectPlan]);
            const renameNode = vi.spyOn(dependencies.drive, 'renameNode');
            const reportTelemetry = vi.fn();
            openHomepage('/recents', { ...dependencies, reportTelemetry });

            await pickAction('Project plan', 'Rename');
            const field = documentsTable.getByRole('textbox');
            await expect.element(field).toHaveFocus();
            await expect.element(field).toHaveValue('Project plan');
            const input = field.element() as HTMLInputElement;
            expect([input.selectionStart, input.selectionEnd]).toEqual([0, 'Project plan'.length]);

            await userEvent.keyboard('Roadmap{Enter}');

            expect(renameNode).toHaveBeenCalledExactlyOnceWith('volume~plan', 'Roadmap');
            await expect.element(page.getByRole('status')).toHaveTextContent('"Roadmap" renamed successfully');
            expect(reportTelemetry).toHaveBeenCalledWith('document.renamed');
        });

        it('shows the new name without waiting for Drive’s event', async () => {
            const dependencies = recentsDependencies([projectPlan]);
            // Drive renames it, but its event hasn't come yet.
            vi.spyOn(dependencies.drive, 'renameNode').mockResolvedValue(undefined as never);
            openHomepage('/recents', dependencies);

            await pickAction('Project plan', 'Rename');
            await userEvent.fill(documentsTable.getByRole('textbox'), 'Roadmap');
            await userEvent.keyboard('{Enter}');

            await expect.element(documentsTable.getByText('Roadmap', { exact: true })).toBeVisible();
            await expect.element(documentsTable.getByRole('textbox')).not.toBeInTheDocument();
        });

        it('cancels on Escape, without renaming', async () => {
            const dependencies = recentsDependencies([projectPlan]);
            const renameNode = vi.spyOn(dependencies.drive, 'renameNode');
            openHomepage('/recents', dependencies);

            await pickAction('Project plan', 'Rename');
            await userEvent.fill(documentsTable.getByRole('textbox'), 'Roadmap');
            await userEvent.keyboard('{Escape}');

            await expect.element(documentsTable.getByRole('textbox')).not.toBeInTheDocument();
            await expect.element(documentsTable.getByText('Project plan', { exact: true })).toBeVisible();
            expect(renameNode).not.toHaveBeenCalled();
        });

        it('cancels when the field loses the focus, without renaming', async () => {
            const dependencies = recentsDependencies([projectPlan]);
            const renameNode = vi.spyOn(dependencies.drive, 'renameNode');
            openHomepage('/recents', dependencies);

            await pickAction('Project plan', 'Rename');
            await userEvent.fill(documentsTable.getByRole('textbox'), 'Roadmap');
            await userEvent.tab();

            await expect.element(documentsTable.getByRole('textbox')).not.toBeInTheDocument();
            await expect.element(documentsTable.getByText('Project plan', { exact: true })).toBeVisible();
            expect(renameNode).not.toHaveBeenCalled();
        });
    });

    describe('trash, more', () => {
        it('reports a trashed document', async () => {
            const reportTelemetry = vi.fn();
            openHomepage('/recents', { ...recentsDependencies([projectPlan]), reportTelemetry });

            await pickAction('Project plan', 'Move to trash');

            await expect.element(page.getByRole('status').filter({ hasText: 'Document moved to trash' })).toBeVisible();
            expect(reportTelemetry).toHaveBeenCalledWith('document.trashed');
        });

        it('restores a document from the trash, and back to the trash with undo', async () => {
            const dependencies = recentsDependencies([{ ...projectPlan, trashed: true }]);
            const restoreNodes = vi.spyOn(dependencies.drive, 'restoreNodes');
            const trashNodes = vi.spyOn(dependencies.drive, 'trashNodes');
            const reportTelemetry = vi.fn();
            openHomepage('/trash', { ...dependencies, reportTelemetry });

            await pickAction('Project plan', 'Restore from trash');

            await expect
                .element(page.getByRole('status').filter({ hasText: 'Document restored from trash' }))
                .toBeVisible();
            await expect.element(documentsTable.getByText('Project plan')).not.toBeInTheDocument();
            expect(restoreNodes).toHaveBeenCalledExactlyOnceWith(['volume~plan']);
            expect(reportTelemetry).toHaveBeenCalledWith('document.restored');
            await userEvent.click(sidebar.getByRole('link', { name: 'All' }));
            await expect.element(documentsTable.getByText('Project plan', { exact: true })).toBeVisible();

            await userEvent.click(page.getByRole('button', { name: 'Undo' }));

            await expect.element(page.getByRole('status').filter({ hasText: 'Document moved to trash' })).toBeVisible();
            expect(trashNodes).toHaveBeenCalledExactlyOnceWith(['volume~plan']);
            await expect.element(documentsTable.getByText('Project plan')).not.toBeInTheDocument();
        });

        it.each(['Cancel', 'Escape'])('keeps a document in the trash when %s closes the delete dialog', async (how) => {
            const dependencies = recentsDependencies([{ ...projectPlan, trashed: true }]);
            const deleteNodes = vi.spyOn(dependencies.drive, 'deleteNodes');
            openHomepage('/trash', dependencies);

            await pickAction('Project plan', 'Delete permanently');
            const dialog = page.getByRole('dialog', { name: 'Delete permanently' });
            await expect.element(dialog).toBeVisible();
            if (how === 'Cancel') {
                await userEvent.click(dialog.getByRole('button', { name: 'Cancel' }));
            } else {
                await userEvent.keyboard('{Escape}');
            }

            await expect.element(dialog).not.toBeInTheDocument();
            await expect.element(documentsTable.getByText('Project plan', { exact: true })).toBeVisible();
            expect(deleteNodes).not.toHaveBeenCalled();
        });

        // Drive's `node_deleted` event can come late, or not at all.
        it('removes a deleted document from the trash without waiting for Drive’s event', async () => {
            const dependencies = recentsDependencies([{ ...projectPlan, trashed: true }]);
            // Drive deletes it, but its events don't come.
            dependencies.eventSubscriber.initialize = async () => {};
            openHomepage('/trash', dependencies);

            await pickAction('Project plan', 'Delete permanently');
            await userEvent.click(page.getByRole('dialog').getByRole('button', { name: 'Delete permanently' }));

            await expect.element(page.getByRole('status')).toHaveTextContent('Document deleted permanently');
            await expect.element(documentsTable.getByText('Project plan'), { timeout: 2000 }).not.toBeInTheDocument();
        });
    });

    it('reports a shared document', async () => {
        const reportTelemetry = vi.fn();
        openHomepage('/recents', { ...recentsDependencies([projectPlan]), reportTelemetry });

        await pickAction('Project plan', 'Share');

        await expect.element(page.getByRole('dialog', { name: 'Share' })).toBeVisible();
        // The standalone page replaces `openShareModal` with its dummy modal, so what it gets isn't checked here.
        expect(reportTelemetry).toHaveBeenCalledWith('document.shared');
    });
});
