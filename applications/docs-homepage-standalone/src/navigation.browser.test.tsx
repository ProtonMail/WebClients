import { page, userEvent } from 'vitest/browser';

import { recentsDependencies } from './mocks/recents';
import { documentRow, documentRows, documentsTable, expectRowsInOrder, openHomepage, sidebar } from './test/browser';

// The homepage owns its query parameters and asks the host to navigate: these tests read the host's history.

const day = 24 * 60 * 60 * 1000;
// Last viewed first is Project plan, Budget, Agenda; by name it's Agenda, Budget, Project plan.
const projectPlan = { linkId: 'plan', name: 'Project plan', type: 'document' } as const;
const budget = {
    linkId: 'budget',
    name: 'Budget',
    type: 'spreadsheet',
    lastOpened: new Date(Date.now() - day),
} as const;
const agenda = {
    linkId: 'agenda',
    name: 'Agenda',
    type: 'document',
    lastOpened: new Date(Date.now() - 3 * day),
} as const;
const files = [projectPlan, budget, agenda];
const trashedReport = { linkId: 'report', name: 'Old report', type: 'document', trashed: true } as const;

const lastViewedOrder = ['Project plan', 'Budget', 'Agenda'];
const nameOrder = ['Agenda', 'Budget', 'Project plan'];

/** The sidebar link named `name`. */
function sidebarLink(name: 'All' | 'Documents' | 'Spreadsheets' | 'Trash') {
    return sidebar.getByRole('link', { name, exact: true });
}

/** The header's search field, whose name follows the type filter. */
function searchField(name = 'Search recents') {
    return page.getByRole('textbox', { name });
}

async function sortBy(option: string) {
    await userEvent.click(page.getByRole('button', { name: 'Change sort order' }));
    await userEvent.click(page.getByRole('menuitem', { name: option }));
}

/**
 * Clicks `link` with a modifier or another button, as a user opening it in a new tab, and returns whether the
 * homepage prevented the browser's default. The test prevents it afterwards, so that no tab opens.
 */
function modifiedClick(link: Element, init: MouseEventInit) {
    let defaultPrevented: boolean | undefined;
    // On the window, so it runs after React's listener on the root.
    const listener = (event: Event) => {
        defaultPrevented = event.defaultPrevented;
        event.preventDefault();
    };
    window.addEventListener('click', listener, { once: true });
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ...init }));
    return defaultPrevented;
}

describe('sidebar links', () => {
    it('point to the host’s addresses of their views', async () => {
        openHomepage('/recents', recentsDependencies(files));

        await expect.element(sidebarLink('All')).toHaveAttribute('href', '/recents');
        await expect.element(sidebarLink('Documents')).toHaveAttribute('href', '/recents?type=document');
        await expect.element(sidebarLink('Spreadsheets')).toHaveAttribute('href', '/recents?type=spreadsheet');
        await expect.element(sidebarLink('Trash')).toHaveAttribute('href', '/trash');
    });

    it('keep the search and sort in the filters’ addresses, and drop them from the trash’s', async () => {
        openHomepage('/recents?sort=name&q=a', recentsDependencies(files));

        await expect.element(sidebarLink('All')).toHaveAttribute('href', '/recents?sort=name&q=a');
        await expect.element(sidebarLink('Documents')).toHaveAttribute('href', '/recents?sort=name&q=a&type=document');
        await expect.element(sidebarLink('Trash')).toHaveAttribute('href', '/trash');
    });

    it('mark the current view and filter', async () => {
        const { history } = openHomepage('/recents', recentsDependencies(files));
        await expect.element(sidebarLink('All')).toHaveAttribute('aria-current', 'page');

        await userEvent.click(sidebarLink('Spreadsheets'));

        await expect.element(sidebarLink('Spreadsheets')).toHaveAttribute('aria-current', 'page');
        await expect.element(sidebarLink('All')).not.toHaveAttribute('aria-current');
        expect(history.location).toBe('/recents?type=spreadsheet');

        await userEvent.click(sidebarLink('Trash'));

        await expect.element(sidebarLink('Trash')).toHaveAttribute('aria-current', 'page');
        await expect.element(sidebarLink('Spreadsheets')).not.toHaveAttribute('aria-current');
    });

    it('push a history entry each, so that Back returns to the previous filter and view', async () => {
        const { history } = openHomepage('/recents', recentsDependencies([...files, trashedReport]));
        await expect.element(documentRow('Budget')).toBeVisible();

        await userEvent.click(sidebarLink('Documents'));
        await expect.element(documentRow('Budget')).not.toBeInTheDocument();
        await userEvent.click(sidebarLink('Trash'));
        await expect.element(documentRow('Old report')).toBeVisible();

        expect(history.entries).toEqual(['/recents', '/recents?type=document', '/trash']);

        history.back();

        await expect.element(documentRow('Project plan')).toBeVisible();
        await expect.element(documentRow('Old report')).not.toBeInTheDocument();
        await expect.element(documentRow('Budget')).not.toBeInTheDocument();
        await expect.element(sidebarLink('Documents')).toHaveAttribute('aria-current', 'page');

        history.back();

        await expect.element(documentRow('Budget')).toBeVisible();
        await expect.element(sidebarLink('All')).toHaveAttribute('aria-current', 'page');

        history.forward();
        history.forward();

        await expect.element(documentRow('Old report')).toBeVisible();
        await expect.element(sidebarLink('Trash')).toHaveAttribute('aria-current', 'page');
    });

    it('replace the current entry when they lead to the current address', async () => {
        const { history } = openHomepage('/recents?type=document', recentsDependencies(files));
        await expect.element(documentRow('Project plan')).toBeVisible();

        await userEvent.click(sidebarLink('Documents'));
        await userEvent.click(sidebarLink('Documents'));

        expect(history.entries).toEqual(['/recents?type=document']);
    });

    it('go to the trash without the search, sort and filter', async () => {
        const { history } = openHomepage('/recents?sort=name&type=document&q=plan', recentsDependencies(files));
        await expect.element(documentRow('Project plan')).toBeVisible();

        await userEvent.click(sidebarLink('Trash'));

        expect(history.location).toBe('/trash');
        await expect.element(page.getByText('There are no documents in the trash.')).toBeVisible();
    });

    it('keep the search and sort when the filter changes', async () => {
        const { history } = openHomepage('/recents?sort=name', recentsDependencies(files));
        await expectRowsInOrder(nameOrder);

        await userEvent.click(sidebarLink('Documents'));

        expect(history.location).toBe('/recents?sort=name&type=document');
        await expectRowsInOrder(['Agenda', 'Project plan']);

        await userEvent.fill(searchField('Search recent documents'), 'plan');
        await userEvent.click(sidebarLink('All'));

        expect(history.location).toBe('/recents?sort=name&q=plan');
        await expect.element(searchField()).toHaveValue('plan');
        await expectRowsInOrder(['Project plan']);
    });

    it('leave a modified or middle click to the browser, which opens the address in a new tab', async () => {
        const { history } = openHomepage('/recents', recentsDependencies(files));
        const documents = await sidebarLink('Documents').findElement();

        expect(modifiedClick(documents, { ctrlKey: true })).toBe(false);
        expect(modifiedClick(documents, { metaKey: true })).toBe(false);
        expect(modifiedClick(documents, { shiftKey: true })).toBe(false);
        expect(modifiedClick(documents, { button: 1 })).toBe(false);

        expect(history.entries).toEqual(['/recents']);
        await expect.element(sidebarLink('All')).toHaveAttribute('aria-current', 'page');
        await expect.element(documentRow('Budget')).toBeVisible();
    });

    it('follow a plain click in the page, without the browser following the link', async () => {
        const { history } = openHomepage('/recents', recentsDependencies(files));
        const documents = await sidebarLink('Documents').findElement();

        expect(modifiedClick(documents, {})).toBe(true);

        expect(history.entries).toEqual(['/recents', '/recents?type=document']);
    });
});

describe('opened at an address', () => {
    it('filters documents with `type=document`', async () => {
        openHomepage('/recents?type=document', recentsDependencies(files));

        await expectRowsInOrder(['Project plan', 'Agenda']);
        await expect.element(documentsTable.getByText('Recent documents', { exact: true })).toBeVisible();
        await expect.element(sidebarLink('Documents')).toHaveAttribute('aria-current', 'page');
        await expect.element(searchField('Search recent documents')).toBeVisible();
    });

    it('filters spreadsheets with `type=spreadsheet`', async () => {
        openHomepage('/recents?type=spreadsheet', recentsDependencies(files));

        await expectRowsInOrder(['Budget']);
        await expect.element(documentsTable.getByText('Recent spreadsheets', { exact: true })).toBeVisible();
        await expect.element(searchField('Search recent spreadsheets')).toBeVisible();
    });

    it('sorts by name with `sort=name`, and checks that option in the sort menu', async () => {
        const { history } = openHomepage('/recents?sort=name', recentsDependencies(files));

        await expectRowsInOrder(nameOrder);
        expect(history.location).toBe('/recents?sort=name');

        await userEvent.click(page.getByRole('button', { name: 'Change sort order' }));

        const nameOption = page.getByRole('menuitem', { name: 'Name' });
        await expect.element(nameOption).toBeVisible();
        expect(nameOption.element().querySelector('svg')).not.toBeNull();
        expect(page.getByRole('menuitem', { name: 'Last viewed first' }).element().querySelector('svg')).toBeNull();
    });

    it('searches with `q`, and shows the search in the field', async () => {
        openHomepage('/recents?q=plan', recentsDependencies(files));

        await expect.element(searchField()).toHaveValue('plan');
        await expectRowsInOrder(['Project plan']);
        await expect.element(documentsTable.getByText('Search results', { exact: true })).toBeVisible();
    });

    it('combines the search, the filter and the sort', async () => {
        openHomepage('/recents?q=a&type=document', recentsDependencies(files));

        await expect.element(searchField('Search recent documents')).toHaveValue('a');
        // Search results are by name, whatever the sort.
        await expectRowsInOrder(['Agenda', 'Project plan']);
    });

    it('decodes special characters in the search', async () => {
        openHomepage(
            '/recents?q=R%26D+plan',
            recentsDependencies([...files, { linkId: 'rnd', name: 'R&D plan', type: 'document' }])
        );

        await expect.element(searchField()).toHaveValue('R&D plan');
        await expectRowsInOrder(['R&D plan']);
    });

    it('drops an unknown sort from the address, in place, and sorts last viewed first', async () => {
        const { history } = openHomepage('/recents?sort=bogus&type=document', recentsDependencies(files));

        await expectRowsInOrder(['Project plan', 'Agenda']);
        await vi.waitFor(() => expect(history.entries).toEqual(['/recents?type=document']));
    });

    it('drops the default sort from the address, in place', async () => {
        const { history } = openHomepage('/recents?sort=viewed', recentsDependencies(files));

        await expectRowsInOrder(lastViewedOrder);
        await vi.waitFor(() => expect(history.entries).toEqual(['/recents']));
    });

    // Unlike an unknown sort, an unknown type would filter every document out.
    it('drops an unknown type from the address, in place, and shows every document', async () => {
        const { history } = openHomepage('/recents?type=pdf', recentsDependencies(files));

        await expect.element(documentRow('Project plan'), { timeout: 1000 }).toBeVisible();
        expect(history.entries).toEqual(['/recents']);
    });

    it('keeps parameters it doesn’t know', async () => {
        const { history } = openHomepage('/recents?utm_source=mail', recentsDependencies(files));

        await expectRowsInOrder(lastViewedOrder);
        expect(history.entries).toEqual(['/recents?utm_source=mail']);
    });

    it('shows the whole trash at `/trash?q=…`, without the search', async () => {
        openHomepage('/trash?q=plan', recentsDependencies([...files, trashedReport]));

        await expectRowsInOrder(['Old report']);
        await expect.element(documentsTable.getByText('Trash', { exact: true }).first()).toBeVisible();
        await expect.element(searchField()).toHaveValue('');
        await expect.element(sidebarLink('Trash')).toHaveAttribute('aria-current', 'page');
    });
});

describe('sort', () => {
    it('replaces the current history entry', async () => {
        const { history } = openHomepage('/recents?type=document', recentsDependencies(files));
        await expectRowsInOrder(['Project plan', 'Agenda']);

        await sortBy('Name');

        await expectRowsInOrder(['Agenda', 'Project plan']);
        expect(history.entries).toEqual(['/recents?type=document&sort=name']);

        await sortBy('Last viewed first');

        await expectRowsInOrder(['Project plan', 'Agenda']);
        expect(history.entries).toEqual(['/recents?type=document']);
    });

    it('keeps parameters it doesn’t know', async () => {
        const { history } = openHomepage('/recents?utm_source=mail', recentsDependencies(files));
        await expectRowsInOrder(lastViewedOrder);

        await sortBy('Location');

        expect(history.location).toBe('/recents?utm_source=mail&sort=location');
    });

    it('follows the host’s Back and Forward', async () => {
        const { history } = openHomepage('/recents', recentsDependencies(files));
        await expectRowsInOrder(lastViewedOrder);
        history.push('/recents?sort=name');
        await expectRowsInOrder(nameOrder);

        history.back();

        await expectRowsInOrder(lastViewedOrder);

        history.forward();

        await expectRowsInOrder(nameOrder);
    });
});

describe('search', () => {
    it('replaces the current history entry as the user types', async () => {
        const { history } = openHomepage('/recents', recentsDependencies(files));
        await expectRowsInOrder(lastViewedOrder);

        await userEvent.type(searchField(), 'plan');

        await expectRowsInOrder(['Project plan']);
        expect(history.entries).toEqual(['/recents?q=plan']);
    });

    it('drops the search from the address when the field is emptied', async () => {
        const { history } = openHomepage('/recents?q=plan&sort=name', recentsDependencies(files));
        await expectRowsInOrder(['Project plan']);

        await userEvent.clear(searchField());

        await expectRowsInOrder(nameOrder);
        expect(history.entries).toEqual(['/recents?sort=name']);
    });

    it('clears on Escape, and keeps the filter', async () => {
        const { history } = openHomepage('/recents?type=document&q=plan', recentsDependencies(files));
        await expectRowsInOrder(['Project plan']);

        await userEvent.click(searchField('Search recent documents'));
        await userEvent.keyboard('{Escape}');

        await expect.element(searchField('Search recent documents')).toHaveValue('');
        await expectRowsInOrder(['Project plan', 'Agenda']);
        expect(history.entries).toEqual(['/recents?type=document']);
    });

    it('keeps parameters it doesn’t know', async () => {
        const { history } = openHomepage('/recents?utm_source=mail', recentsDependencies(files));
        await expectRowsInOrder(lastViewedOrder);

        await userEvent.fill(searchField(), 'plan');

        expect(history.location).toBe('/recents?utm_source=mail&q=plan');
    });

    it('searches within the filter, with a placeholder that names it', async () => {
        openHomepage('/recents?type=spreadsheet', recentsDependencies(files));
        const search = searchField('Search recent spreadsheets');
        await expect.element(search).toHaveAttribute('placeholder', 'Search recent spreadsheets');

        await userEvent.fill(search, 'e');

        // Agenda and Project plan match too, but aren't spreadsheets.
        await expectRowsInOrder(['Budget']);
    });

    it('from the trash, goes to the recents in a new history entry, and Back returns to the trash', async () => {
        const { history } = openHomepage('/trash', recentsDependencies([...files, trashedReport]));
        await expectRowsInOrder(['Old report']);

        await userEvent.type(searchField(), 'plan');

        await expectRowsInOrder(['Project plan']);
        await expect.element(searchField()).toHaveValue('plan');
        await expect.element(searchField()).toHaveFocus();
        await expect.element(sidebarLink('All')).toHaveAttribute('aria-current', 'page');
        expect(history.entries).toEqual(['/trash', '/recents?q=plan']);

        history.back();

        await expectRowsInOrder(['Old report']);
        await expect.element(searchField()).toHaveValue('');
    });

    it('follows the host’s Back and Forward in the field', async () => {
        const { history } = openHomepage('/recents', recentsDependencies(files));
        await expectRowsInOrder(lastViewedOrder);
        history.push('/recents?q=budget');
        await expect.element(searchField()).toHaveValue('budget');
        await expectRowsInOrder(['Budget']);

        history.back();

        await expect.element(searchField()).toHaveValue('');
        await expectRowsInOrder(lastViewedOrder);

        history.forward();

        await expect.element(searchField()).toHaveValue('budget');
        await expectRowsInOrder(['Budget']);
    });

    it('shows that nothing matches, and the recents again once cleared', async () => {
        openHomepage('/recents', recentsDependencies(files));
        await expectRowsInOrder(lastViewedOrder);

        await userEvent.fill(searchField(), 'Roadmap');

        await expect.element(page.getByText('No recent documents match your search.')).toBeVisible();
        await expect.element(documentRows).not.toBeInTheDocument();

        await userEvent.clear(searchField());

        await expectRowsInOrder(lastViewedOrder);
    });
});

describe('filters', () => {
    it('follow the host’s Back and Forward, with the table’s label', async () => {
        const { history } = openHomepage('/recents', recentsDependencies(files));
        await expect.element(documentsTable.getByText('Recents', { exact: true })).toBeVisible();
        history.push('/recents?type=spreadsheet');
        await expect.element(documentsTable.getByText('Recent spreadsheets', { exact: true })).toBeVisible();
        await expectRowsInOrder(['Budget']);

        history.back();

        await expect.element(documentsTable.getByText('Recents', { exact: true })).toBeVisible();
        await expectRowsInOrder(lastViewedOrder);
        await expect.element(sidebarLink('All')).toHaveAttribute('aria-current', 'page');
    });

    it('show the empty state when no recent matches the filter', async () => {
        openHomepage('/recents?type=spreadsheet', recentsDependencies([projectPlan]));

        await expect.element(page.getByText('Create end-to-end encrypted documents and spreadsheets.')).toBeVisible();
    });
});
