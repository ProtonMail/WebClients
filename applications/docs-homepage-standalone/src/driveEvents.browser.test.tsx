import { page, userEvent } from 'vitest/browser';

import { type RecentFile, recentsDependencies, uid } from './mocks/recents';
import { documentRow, documentRows, documentsTable, openHomepage, sidebar, tabTo } from './test/browser';

const projectPlan = { linkId: 'plan', name: 'Project plan', type: 'document' } as const;
const budget = { linkId: 'budget', name: 'Budget', type: 'spreadsheet' } as const;
const projects = { linkId: 'projects', name: 'projects' };
const worldTakeover = { linkId: 'world-takeover', name: 'world takeover' };

/** Opens the homepage at `path` on `files`, once it has subscribed to Drive's events. */
async function openSubscribed(path: string, files: RecentFile[]) {
    const dependencies = recentsDependencies(files);
    const subscribe = vi.spyOn(dependencies.eventSubscriber, 'initialize');
    openHomepage(path, dependencies);
    await expect.element(documentRows.first()).toBeVisible();
    await vi.waitFor(() => expect(subscribe).toHaveBeenCalled());
    return dependencies;
}

// Changes made elsewhere, e.g. in Drive: the homepage learns of them from Drive's events.
describe('Drive events', () => {
    it('moves a document from the recents to the trash when it is trashed', async () => {
        const dependencies = recentsDependencies([projectPlan]);
        const subscribe = vi.spyOn(dependencies.eventSubscriber, 'initialize');
        openHomepage('/recents', dependencies);
        await expect.element(documentsTable.getByText('Project plan', { exact: true })).toBeVisible();
        // The homepage subscribes once it has loaded My files, which can be after it shows the recents.
        await vi.waitFor(() => expect(subscribe).toHaveBeenCalled());

        await Array.fromAsync(dependencies.drive.trashNodes(['volume~plan']));

        await expect.element(documentsTable.getByText('Project plan')).not.toBeInTheDocument();
        await userEvent.click(sidebar.getByRole('link', { name: 'Trash' }));
        await expect.element(documentsTable.getByText('Project plan', { exact: true })).toBeVisible();
    });

    it('renames a document in the recents when it is renamed', async () => {
        const dependencies = recentsDependencies([projectPlan]);
        const subscribe = vi.spyOn(dependencies.eventSubscriber, 'initialize');
        openHomepage('/recents', dependencies);
        await expect.element(documentsTable.getByText('Project plan', { exact: true })).toBeVisible();
        await vi.waitFor(() => expect(subscribe).toHaveBeenCalled());

        await dependencies.drive.renameNode('volume~plan', 'Roadmap');

        await expect.element(documentsTable.getByText('Roadmap', { exact: true })).toBeVisible();
        await expect.element(documentsTable.getByText('Project plan')).not.toBeInTheDocument();
    });

    it('moves a document from the trash to the recents when it is restored', async () => {
        const dependencies = recentsDependencies([{ ...projectPlan, trashed: true }]);
        const subscribe = vi.spyOn(dependencies.eventSubscriber, 'initialize');
        openHomepage('/trash', dependencies);
        await expect.element(documentsTable.getByText('Project plan', { exact: true })).toBeVisible();
        await vi.waitFor(() => expect(subscribe).toHaveBeenCalled());

        await Array.fromAsync(dependencies.drive.restoreNodes(['volume~plan']));

        await expect.element(documentsTable.getByText('Project plan')).not.toBeInTheDocument();
        await userEvent.click(sidebar.getByRole('link', { name: 'All' }));
        await expect.element(documentsTable.getByText('Project plan', { exact: true })).toBeVisible();
    });

    it('removes a folder’s documents from the recents when the folder is trashed', async () => {
        const dependencies = await openSubscribed('/recents', [
            { ...projectPlan, path: [projects, worldTakeover] },
            { ...budget, path: [projects] },
            { linkId: 'notes', name: 'Team notes', type: 'document' },
        ]);

        await Array.fromAsync(dependencies.drive.trashNodes([uid('projects')]));

        await expect.element(documentRow('Project plan')).not.toBeInTheDocument();
        await expect.element(documentRow('Budget')).not.toBeInTheDocument();
        await expect.element(documentRow('Team notes')).toBeVisible();
        // The trash lists documents only, not the folder.
        await userEvent.click(sidebar.getByRole('link', { name: 'Trash' }));
        await expect.element(page.getByText('There are no documents in the trash.')).toBeVisible();
    });

    // Its restore event finds none of its documents in the recents, since they left them with the folder.
    it('brings a folder’s documents back to the recents when the folder is restored', async () => {
        const dependencies = await openSubscribed('/recents', [{ ...projectPlan, path: [projects] }, budget]);
        await Array.fromAsync(dependencies.drive.trashNodes([uid('projects')]));
        await expect.element(documentRow('Project plan')).not.toBeInTheDocument();

        await Array.fromAsync(dependencies.drive.restoreNodes([uid('projects')]));

        await expect.element(documentRow('Project plan'), { timeout: 2000 }).toBeVisible();
    });

    it('shows a folder’s new name in its documents’ location when it is renamed', async () => {
        const dependencies = await openSubscribed('/recents', [{ ...projectPlan, path: [projects, worldTakeover] }]);

        await dependencies.drive.renameNode(uid('world-takeover'), 'world domination');
        await dependencies.drive.renameNode(uid('projects'), 'plans');

        const location = documentRow('Project plan').getByRole('button', { name: 'world domination' });
        await expect.element(location).toBeVisible();
        await tabTo(location);
        await expect.element(page.getByRole('tooltip')).toHaveTextContent('plans / world domination');
    });

    it('removes a document from the trash when it is deleted permanently', async () => {
        const dependencies = await openSubscribed('/trash', [
            { ...projectPlan, trashed: true },
            { ...budget, trashed: true },
        ]);

        await Array.fromAsync(dependencies.drive.deleteNodes([uid('plan')]));

        await expect.element(documentRow('Project plan')).not.toBeInTheDocument();
        await expect.element(documentRow('Budget')).toBeVisible();
    });

    it('subscribes to the events of each document shared with me', async () => {
        const dependencies = recentsDependencies([
            projectPlan,
            { linkId: 'notes', name: 'Team notes', type: 'document', sharedBy: 'alice@example.com' },
        ]);
        const subscribeToSharedDocument = vi.spyOn(dependencies.eventSubscriber, 'subscribeToSharedDocument');
        openHomepage('/recents', dependencies);

        await expect.element(documentRow('Team notes')).toBeVisible();
        expect(subscribeToSharedDocument).toHaveBeenCalledExactlyOnceWith(uid('notes'), 'scope');
    });

    it('subscribes to My files’ events, and unsubscribes when the homepage closes', async () => {
        const dependencies = recentsDependencies([projectPlan]);
        const initialize = vi.spyOn(dependencies.eventSubscriber, 'initialize');
        const reset = vi.spyOn(dependencies.eventSubscriber, 'reset');
        const homepage = openHomepage('/recents', dependencies);
        await vi.waitFor(() => expect(initialize).toHaveBeenCalledOnce());
        // My files' root's scope, and a listener each for the recents and the trash.
        expect(initialize.mock.calls[0][0]).toBe('scope');
        expect(initialize.mock.calls[0][1]).toHaveLength(2);

        homepage.unmount();

        expect(reset).toHaveBeenCalled();
    });

    it('reloads the recents on the host’s core events, such as a document shared with me', async () => {
        const dependencies = recentsDependencies([projectPlan, budget]);
        // The Docs API lists Budget once it's shared with me.
        let isBudgetShared = false;
        const { api } = dependencies;
        dependencies.api = (async (...args: Parameters<typeof api>) => {
            const response = (await api(...args)) as { RecentDocuments: { LinkID: string }[] };
            return {
                ...response,
                RecentDocuments: response.RecentDocuments.filter(({ LinkID }) => isBudgetShared || LinkID !== 'budget'),
            };
        }) as typeof api;
        let coreListener: (() => void) | undefined;
        const removeListener = vi.fn();
        openHomepage('/recents', {
            ...dependencies,
            coreEventSubscriber: {
                addListener: (listener) => {
                    coreListener = listener;
                    return removeListener;
                },
            },
        });
        await expect.element(documentRow('Project plan')).toBeVisible();
        expect(documentRows.elements()).toHaveLength(1);

        isBudgetShared = true;
        coreListener?.();

        await expect.element(documentRow('Budget')).toBeVisible();
    });
});
