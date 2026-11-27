import { page, userEvent } from 'vitest/browser';

import { recentsDependencies, uid } from './mocks/recents';
import { documentRow, openHomepage, sidebar } from './test/browser';

const day = 24 * 60 * 60 * 1000;
// Listed in this order, last viewed first.
const projectPlan = { linkId: 'plan', name: 'Project plan', type: 'document' } as const;
const budget = {
    linkId: 'budget',
    name: 'Budget',
    type: 'spreadsheet',
    lastOpened: new Date(Date.now() - 60_000),
} as const;
const roadmap = {
    linkId: 'roadmap',
    name: 'Roadmap',
    type: 'document',
    lastOpened: new Date(Date.now() - 120_000),
} as const;
const teamNotes = {
    linkId: 'notes',
    name: 'Team notes',
    type: 'document',
    sharedBy: 'alice@example.com',
    lastOpened: new Date(Date.now() - 3 * day),
} as const;

const featureFlags = { bulkTrash: true, bulkMove: true };

/** The checkbox that selects the row that shows `name`. */
function checkbox(name: string) {
    return page.getByRole('checkbox', { name: `Select ${name}` });
}

/** The row-sized button that selects and opens the row that shows `name`. */
function activator(name: string) {
    return documentRow(name).getByTestId('row-activator');
}

const selectAll = page.getByRole('checkbox', { name: 'Select all' });
const selectedCount = page.getByTestId('bulk-selected-count');

/** Waits until exactly the rows that show `names` are selected. */
async function expectSelected(names: string[]) {
    for (const name of [projectPlan, budget, roadmap].map((file) => file.name)) {
        if (names.includes(name)) {
            await expect.element(checkbox(name)).toBeChecked();
        } else {
            await expect.element(checkbox(name)).not.toBeChecked();
        }
    }
    if (names.length) {
        await expect.element(selectedCount).toHaveTextContent(`${names.length} selected`);
    } else {
        await expect.element(selectedCount).not.toBeInTheDocument();
    }
}

function openWithFiles(overrides = {}) {
    const dependencies = recentsDependencies([projectPlan, budget, roadmap, teamNotes]);
    openHomepage('/recents', { ...dependencies, featureFlags, ...overrides });
    return dependencies;
}

describe('selection', () => {
    it('selects rows with their checkboxes, and all of them with "Select all"', async () => {
        openWithFiles();

        await userEvent.click(checkbox('Budget'));

        await expectSelected(['Budget']);
        await expect.element(selectAll).toBePartiallyChecked();

        // Unlike Drive's selection store, which selects every row from a partial selection.
        await userEvent.click(selectAll);

        await expectSelected([]);
        await expect.element(selectAll).not.toBeChecked();

        await userEvent.click(selectAll);

        await expectSelected(['Project plan', 'Budget', 'Roadmap']);
        await expect.element(selectAll).toBeChecked();
    });

    it('has no checkbox for a document shared directly, which can’t be trashed', async () => {
        openWithFiles();

        await expect.element(documentRow('Team notes')).toBeVisible();
        await expect.element(checkbox('Team notes')).not.toBeInTheDocument();
    });

    it('selects a row on a click, without opening it', async () => {
        const open = vi.spyOn(window, 'open').mockReturnValue(null);
        openWithFiles();

        await userEvent.click(activator('Project plan'));
        await expectSelected(['Project plan']);
        await expect.element(activator('Project plan')).toHaveAttribute('aria-pressed', 'true');

        await userEvent.click(activator('Budget'));
        await expectSelected(['Budget']);
        expect(open).not.toHaveBeenCalled();
    });

    it('opens a document on a double click', async () => {
        const open = vi.spyOn(window, 'open').mockReturnValue(null);
        openWithFiles();

        await userEvent.dblClick(activator('Budget'));

        expect(open).toHaveBeenCalledExactlyOnceWith('/sheet?mode=open&volumeId=volume&linkId=budget');
    });

    it('opens a document on Enter, and toggles its selection on Space', async () => {
        const open = vi.spyOn(window, 'open').mockReturnValue(null);
        openWithFiles();
        await userEvent.click(activator('Project plan'));
        await expect.element(activator('Project plan')).toHaveFocus();

        await userEvent.keyboard(' ');
        await expectSelected([]);
        await userEvent.keyboard(' ');
        await expectSelected(['Project plan']);
        expect(open).not.toHaveBeenCalled();

        await userEvent.keyboard('{Enter}');

        expect(open).toHaveBeenCalledExactlyOnceWith('/doc?mode=open&volumeId=volume&linkId=plan');
    });

    it('selects a range on a shift-click, and toggles a row on a ctrl-click', async () => {
        openWithFiles();

        await userEvent.click(activator('Project plan'));
        await userEvent.click(activator('Roadmap'), { modifiers: ['Shift'] });
        await expectSelected(['Project plan', 'Budget', 'Roadmap']);

        await userEvent.click(activator('Budget'), { modifiers: ['ControlOrMeta'] });
        await expectSelected(['Project plan', 'Roadmap']);
    });

    it('selects a range on a shift-click on a checkbox', async () => {
        openWithFiles();

        await userEvent.click(checkbox('Project plan'));
        await userEvent.click(checkbox('Roadmap'), { modifiers: ['Shift'] });

        await expectSelected(['Project plan', 'Budget', 'Roadmap']);
    });

    it('clears the selection on Escape', async () => {
        openWithFiles();
        await userEvent.click(checkbox('Project plan'));
        await userEvent.click(checkbox('Budget'));
        await expectSelected(['Project plan', 'Budget']);

        await userEvent.keyboard('{Escape}');

        await expectSelected([]);
    });

    it('moves the focus between rows with the arrow keys, Home and End', async () => {
        openWithFiles();
        await userEvent.click(activator('Project plan'));

        await userEvent.keyboard('{ArrowDown}');
        await expect.element(activator('Budget')).toHaveFocus();
        await userEvent.keyboard('{End}');
        await expect.element(activator('Team notes')).toHaveFocus();
        await userEvent.keyboard('{ArrowUp}');
        await expect.element(activator('Roadmap')).toHaveFocus();
        await userEvent.keyboard('{Home}');
        await expect.element(activator('Project plan')).toHaveFocus();
    });

    it('clears the selection when the filter changes', async () => {
        openWithFiles();
        await userEvent.click(checkbox('Project plan'));
        await expectSelected(['Project plan']);

        await userEvent.click(sidebar.getByRole('link', { name: 'Documents' }));
        await expect.element(documentRow('Budget')).not.toBeInTheDocument();

        await expect.element(checkbox('Project plan')).not.toBeChecked();
        await expect.element(selectedCount).not.toBeInTheDocument();
    });

    it('clears the selection when the search changes', async () => {
        openWithFiles();
        await userEvent.click(checkbox('Project plan'));
        await expectSelected(['Project plan']);

        await userEvent.fill(page.getByRole('textbox', { name: 'Search recents' }), 'p');
        await expect.element(documentRow('Budget')).not.toBeInTheDocument();

        await expect.element(checkbox('Project plan')).not.toBeChecked();
        await expect.element(selectedCount).not.toBeInTheDocument();
    });
});

describe('bulk actions', () => {
    it('moves the selected documents to the trash in one call, and back with undo', async () => {
        const dependencies = openWithFiles();
        const trashNodes = vi.spyOn(dependencies.drive, 'trashNodes');
        const restoreNodes = vi.spyOn(dependencies.drive, 'restoreNodes');
        await userEvent.click(checkbox('Project plan'));
        await userEvent.click(checkbox('Budget'));

        await userEvent.click(page.getByRole('button', { name: 'Move to trash' }));

        await expect.element(page.getByRole('status').filter({ hasText: '2 items moved to trash' })).toBeVisible();
        expect(trashNodes).toHaveBeenCalledExactlyOnceWith([uid('plan'), uid('budget')]);
        await expect.element(documentRow('Project plan')).not.toBeInTheDocument();
        await expect.element(documentRow('Budget')).not.toBeInTheDocument();
        await expect.element(selectedCount).not.toBeInTheDocument();

        await userEvent.click(page.getByRole('button', { name: 'Undo' }));

        await expect.element(page.getByRole('status').filter({ hasText: '2 items restored from trash' })).toBeVisible();
        expect(restoreNodes).toHaveBeenCalledExactlyOnceWith([uid('plan'), uid('budget')]);
        await expect.element(documentRow('Project plan')).toBeVisible();
        await expect.element(documentRow('Budget')).toBeVisible();
    });

    it('keeps the documents selected when Drive fails to trash them all', async () => {
        const dependencies = openWithFiles();
        vi.spyOn(dependencies.drive, 'trashNodes').mockImplementation(async function* (nodeUids: string[]) {
            yield* nodeUids.map((nodeUid) => ({ uid: nodeUid, ok: false, error: new Error('Drive failed') }));
        } as typeof dependencies.drive.trashNodes);
        await userEvent.click(checkbox('Project plan'));
        await userEvent.click(checkbox('Budget'));

        await userEvent.click(page.getByRole('button', { name: 'Move to trash' }));

        await expect.element(page.getByRole('alert')).toHaveTextContent('2 items could not be moved to trash');
        await expectSelected(['Project plan', 'Budget']);
    });

    // A reload would show the loader in place of the table, whose selection then starts empty again.
    it('keeps the documents Drive failed to trash selected, and says how many', async () => {
        const dependencies = openWithFiles();
        const trashNodes = dependencies.drive.trashNodes;
        vi.spyOn(dependencies.drive, 'trashNodes').mockImplementation(async function* ([trashed, failed]: string[]) {
            yield* trashNodes([trashed]);
            yield { uid: failed, ok: false, error: new Error('Drive failed') };
        } as typeof trashNodes);
        await userEvent.click(checkbox('Project plan'));
        await userEvent.click(checkbox('Budget'));

        await userEvent.click(page.getByRole('button', { name: 'Move to trash' }));

        await expect.element(page.getByRole('alert')).toHaveTextContent('1 item could not be moved to trash');
        await expect.element(page.getByRole('status').filter({ hasText: '1 item moved to trash' })).toBeVisible();
        await expect.element(documentRow('Project plan')).not.toBeInTheDocument();
        await expect.element(checkbox('Budget')).toBeVisible();
        await expect.element(checkbox('Budget'), { timeout: 2000 }).toBeChecked();
    });

    it('opens the move modal for the selected documents', async () => {
        const reportTelemetry = vi.fn();
        openWithFiles({ reportTelemetry });
        await userEvent.click(checkbox('Project plan'));
        await userEvent.click(checkbox('Budget'));

        await userEvent.click(page.getByRole('button', { name: 'Move', exact: true }));

        await expect.element(page.getByRole('dialog', { name: 'Move' })).toBeVisible();
        expect(reportTelemetry.mock.calls.filter(([event]) => event === 'document.moved')).toHaveLength(2);
    });

    it('acts on the whole selection from the menu of one of its rows', async () => {
        const dependencies = openWithFiles();
        const trashNodes = vi.spyOn(dependencies.drive, 'trashNodes');
        await userEvent.click(checkbox('Project plan'));
        await userEvent.click(checkbox('Budget'));

        await userEvent.click(activator('Budget'), { button: 'right' });

        await expect.element(page.getByRole('menu')).toBeVisible();
        expect(
            page
                .getByRole('menuitem')
                .elements()
                .map((item) => item.textContent)
        ).toEqual(['Move', 'Move to trash']);
        await expectSelected(['Project plan', 'Budget']);

        await userEvent.click(page.getByRole('menuitem', { name: 'Move to trash' }));

        await expect.element(page.getByRole('status').filter({ hasText: '2 items moved to trash' })).toBeVisible();
        expect(trashNodes).toHaveBeenCalledExactlyOnceWith([uid('plan'), uid('budget')]);
    });

    it('selects only the row a right-click opens the menu of, when it wasn’t selected', async () => {
        openWithFiles();
        await userEvent.click(checkbox('Project plan'));
        await userEvent.click(checkbox('Budget'));

        await userEvent.click(activator('Roadmap'), { button: 'right' });

        await expect.element(page.getByRole('menuitem', { name: 'Rename' })).toBeVisible();
        await expectSelected(['Roadmap']);
    });
});
