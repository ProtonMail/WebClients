import { page, userEvent } from 'vitest/browser';

import { invitationsDependencies } from './mocks/invitations';
import { recentsDependencies } from './mocks/recents';
import { documentsTable, invitesTable, openHomepage, sidebar, tabTo } from './test/browser';

const projectPlan = {
    linkId: 'plan',
    name: 'Project plan',
    type: 'document',
    path: [
        { linkId: 'projects', name: 'projects' },
        { linkId: 'important', name: 'important' },
        { linkId: 'world-takeover', name: 'world takeover' },
    ],
} as const;
const budget = { linkId: 'budget', name: 'Budget', type: 'spreadsheet' } as const;
const teamNotes = { linkId: 'notes', name: 'Team notes', type: 'document', sharedBy: 'alice@example.com' } as const;
const launchChecklist = {
    invitationId: 'launch',
    name: 'Launch checklist',
    type: 'spreadsheet',
    inviterEmail: 'bob@example.com',
} as const;

/** The documents table's rows, without its header. */
const documentRows = documentsTable.getByRole('row').filter({ has: page.getByRole('cell') });

/** Waits until the documents table lists `names`, in that order. */
async function expectRowsInOrder(names: string[]) {
    for (const [index, name] of names.entries()) {
        await expect.element(documentRows.nth(index)).toMatchTextContent(name);
    }
    expect(documentRows.elements()).toHaveLength(names.length);
}

it('opens on recents, empty, and goes to the trash from the sidebar', async () => {
    openHomepage();

    await expect.element(page.getByRole('main')).toBeVisible();
    await expect.element(page.getByText('Create end-to-end encrypted documents and spreadsheets.')).toBeVisible();

    await userEvent.click(sidebar.getByRole('link', { name: 'Trash' }));

    await expect.element(page.getByText('There are no documents in the trash.')).toBeVisible();
});

it('offers a new document and a new spreadsheet, each in a new tab of the editor', async () => {
    openHomepage('/recents', { getAppHref: (path, app) => `https://${app}.example${path}` });

    // Not clicked: the links would open a tab.
    await userEvent.click(page.getByRole('button', { name: 'New', exact: true }));

    const newDocument = page.getByRole('menuitem', { name: 'New document' });
    await expect.element(newDocument).toHaveAttribute('href', 'https://proton-docs.example/doc');
    await expect.element(newDocument).toHaveAttribute('target', '_blank');
    const newSpreadsheet = page.getByRole('menuitem', { name: 'New spreadsheet' });
    await expect.element(newSpreadsheet).toHaveAttribute('href', 'https://proton-docs.example/sheet');
    await expect.element(newSpreadsheet).toHaveAttribute('target', '_blank');
});

it('shows a spreadsheet, a document shared with me and an invitation', async () => {
    openHomepage('/recents', {
        ...recentsDependencies([budget, teamNotes]),
        ...invitationsDependencies([launchChecklist]),
    });

    await expect.element(documentRows.filter({ hasText: 'Budget' })).toBeVisible();
    await expect.element(documentRows.filter({ hasText: 'Team notes' })).toMatchTextContent('Shared with me');
    expect(documentRows.elements()).toHaveLength(2);

    const invites = invitesTable.getByRole('row').filter({ has: page.getByRole('cell') });
    await expect.element(invites).toMatchTextContent('Launch checklist');
    await expect.element(invites).toMatchTextContent('bob@example.com');
});

it('shows only documents in the documents section', async () => {
    openHomepage('/recents', recentsDependencies([projectPlan, budget]));
    await expect.element(documentRows.filter({ hasText: 'Budget' })).toBeVisible();

    await userEvent.click(sidebar.getByRole('link', { name: 'Documents' }));

    await expect.element(documentRows.filter({ hasText: 'Budget' })).not.toBeInTheDocument();
    await expect.element(documentRows.filter({ hasText: 'Project plan' })).toBeVisible();
    expect(documentRows.elements()).toHaveLength(1);
});

it('shows only spreadsheets in the spreadsheets section', async () => {
    openHomepage('/recents', recentsDependencies([projectPlan, budget]));
    await expect.element(documentRows.filter({ hasText: 'Project plan' })).toBeVisible();

    await userEvent.click(sidebar.getByRole('link', { name: 'Spreadsheets' }));

    await expect.element(documentRows.filter({ hasText: 'Project plan' })).not.toBeInTheDocument();
    await expect.element(documentRows.filter({ hasText: 'Budget' })).toBeVisible();
    expect(documentRows.elements()).toHaveLength(1);
});

it('searches the recents by name, in any case', async () => {
    openHomepage('/recents', recentsDependencies([projectPlan, budget]));
    const search = page.getByRole('textbox', { name: 'Search recents' });

    await userEvent.fill(search, 'PLAN');

    await expect.element(documentRows.filter({ hasText: 'Budget' })).not.toBeInTheDocument();
    await expect.element(documentRows.filter({ hasText: 'Project plan' })).toBeVisible();
    expect(documentRows.elements()).toHaveLength(1);

    await userEvent.fill(search, 'Roadmap');

    await expect.element(page.getByText('No recent documents match your search.')).toBeVisible();
    await expect.element(documentRows).not.toBeInTheDocument();
});

describe('sorting', () => {
    const day = 24 * 60 * 60 * 1000;
    // In a folder, in My files' root and shared with me: each sort orders them differently.
    const files = [
        { ...budget, path: [{ linkId: 'finance', name: 'finance' }], lastOpened: new Date(Date.now() - 3 * day) },
        { ...projectPlan, path: [] },
        { ...teamNotes, lastOpened: new Date(Date.now() - day) },
    ];
    const lastViewedOrder = ['Project plan', 'Team notes', 'Budget'];

    async function sortBy(option: string) {
        await userEvent.click(page.getByRole('button', { name: 'Change sort order' }));
        await userEvent.click(page.getByRole('menuitem', { name: option }));
    }

    it('lists the recents last viewed first', async () => {
        openHomepage('/recents', recentsDependencies(files));

        await expectRowsInOrder(lastViewedOrder);
    });

    it('sorts the recents by name', async () => {
        openHomepage('/recents', recentsDependencies(files));
        await expectRowsInOrder(lastViewedOrder);

        await sortBy('Name');

        await expectRowsInOrder(['Budget', 'Project plan', 'Team notes']);
    });

    it('sorts the recents by location: My files’ root, its folders, then shared with me', async () => {
        openHomepage('/recents', recentsDependencies(files));
        await expectRowsInOrder(lastViewedOrder);

        await sortBy('Location');

        await expectRowsInOrder(['Project plan', 'Budget', 'Team notes']);
    });

    it('sorts the recents by who created them: My files first, then shared with me by owner', async () => {
        // A single file in My files: the user's files all have the same owner, so their order is a tie.
        const agenda = { linkId: 'agenda', name: 'Agenda', type: 'document', sharedBy: 'bob@example.com' } as const;
        openHomepage(
            '/recents',
            recentsDependencies([
                { ...projectPlan, lastOpened: new Date(Date.now() - 3 * day) },
                { ...teamNotes, lastOpened: new Date(Date.now() - day) },
                agenda,
            ])
        );
        await expectRowsInOrder(['Agenda', 'Team notes', 'Project plan']);

        await sortBy('Created by');

        await expectRowsInOrder(['Project plan', 'Team notes', 'Agenda']);
    });
});

it('shows a document’s folder, and its path in the folder’s tooltip', async () => {
    openHomepage('/recents', recentsDependencies([projectPlan]));

    // By keyboard: on hover, the tooltip waits a second, and the real mouse in a headed browser can cancel it.
    await tabTo(documentsTable.getByRole('button', { name: 'world takeover' }));

    await expect.element(page.getByRole('tooltip')).toHaveTextContent('projects / important / world takeover');
});
