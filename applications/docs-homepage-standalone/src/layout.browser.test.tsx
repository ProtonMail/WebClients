import { type Locator, page, userEvent } from 'vitest/browser';

import { recentsDependencies } from './mocks/recents';
import { documentRow, documentsTable, openHomepage, sidebar, tabTo } from './test/browser';

const projectPlan = {
    linkId: 'plan',
    name: 'Project plan',
    type: 'document',
    path: [{ linkId: 'projects', name: 'projects' }],
} as const;
const budget = { linkId: 'budget', name: 'Budget', type: 'spreadsheet' } as const;

// The module's `--background-norm`, in light and dark mode (HomepageStyleScope.css).
const lightBackground = 'rgb(255, 255, 255)';
const darkBackground = 'rgb(22, 20, 28)';

function backgroundOf(locator: Locator) {
    return getComputedStyle(locator.element()).backgroundColor;
}

/** Whether `locator`'s element is inside the module's style root, where its CSS variables and shims apply. */
function isInStyleScope(locator: Locator) {
    return locator.element().closest('.homepage-root') !== null;
}

/** The sidebar's root: the column, or the drawer on narrow viewports. */
function sidebarRoot() {
    return document.querySelector<HTMLElement>('.homepage-root [data-expanded]')!;
}

/** The sidebar's drawer, which leaves the accessibility tree while closed, so `sidebar` no longer finds it. */
function drawer() {
    return page.elementLocator(sidebarRoot());
}

describe('popups in the style scope', () => {
    // Ariakit portals them to the end of <body> unless HomepageStyleScope's portal root takes them, and outside the
    // root they'd lose the module's variables: transparent menus, unstyled dialogs.
    it('renders the document menu inside the style scope, with its background', async () => {
        openHomepage('/recents', recentsDependencies([projectPlan]));

        await userEvent.click(documentRow('Project plan').getByRole('button', { name: 'Actions' }));

        const menu = page.getByRole('menu');
        await expect.element(menu).toBeVisible();
        expect(isInStyleScope(menu)).toBe(true);
        expect(backgroundOf(menu)).toBe(lightBackground);
    });

    it('renders the sort menu and the new menu inside the style scope', async () => {
        openHomepage('/recents', recentsDependencies([projectPlan]));

        await userEvent.click(page.getByRole('button', { name: 'Change sort order' }));
        const sortMenu = page.getByRole('menu');
        await expect.element(sortMenu).toBeVisible();
        expect(isInStyleScope(sortMenu)).toBe(true);
        expect(backgroundOf(sortMenu)).toBe(lightBackground);
        await userEvent.keyboard('{Escape}');
        await expect.element(sortMenu).not.toBeInTheDocument();

        await userEvent.click(page.getByRole('button', { name: 'New', exact: true }));
        const newMenu = page.getByRole('menu');
        await expect.element(newMenu).toBeVisible();
        expect(isInStyleScope(newMenu)).toBe(true);
        expect(backgroundOf(newMenu)).toBe(lightBackground);
    });

    it('renders tooltips inside the style scope', async () => {
        openHomepage('/recents', recentsDependencies([projectPlan]));

        await tabTo(documentRow('Project plan').getByRole('button', { name: 'projects' }));

        const tooltip = page.getByRole('tooltip');
        await expect.element(tooltip).toHaveTextContent('projects');
        expect(isInStyleScope(tooltip)).toBe(true);
    });

    it('renders the delete dialog inside the style scope, above the page', async () => {
        openHomepage('/trash', recentsDependencies([{ ...projectPlan, trashed: true }]));

        await userEvent.click(documentRow('Project plan').getByRole('button', { name: 'Actions' }));
        await userEvent.click(page.getByRole('menuitem', { name: 'Delete permanently' }));

        const dialog = page.getByRole('dialog', { name: 'Delete permanently' });
        await expect.element(dialog).toBeVisible();
        expect(isInStyleScope(dialog)).toBe(true);
        expect(backgroundOf(dialog)).toBe(lightBackground);
        // In the middle of the viewport, not in the flow of the page.
        expect(getComputedStyle(dialog.element()).position).toBe('fixed');
    });
});

describe('dark mode', () => {
    afterEach(() => {
        document.documentElement.removeAttribute('data-theme-mode');
    });

    it('follows the host’s theme mode on <html>, and back', async () => {
        openHomepage('/recents', recentsDependencies([projectPlan]));
        await expect.element(documentRow('Project plan')).toBeVisible();
        const table = documentsTable.element().parentElement!;
        expect(getComputedStyle(table).backgroundColor).toBe(lightBackground);

        document.documentElement.setAttribute('data-theme-mode', 'dark');

        await vi.waitFor(() => expect(getComputedStyle(table).backgroundColor).toBe(darkBackground));
        await userEvent.click(documentRow('Project plan').getByRole('button', { name: 'Actions' }));
        await expect.element(page.getByRole('menu')).toBeVisible();
        expect(backgroundOf(page.getByRole('menu'))).toBe(darkBackground);
        await userEvent.keyboard('{Escape}');

        document.documentElement.setAttribute('data-theme-mode', 'light');

        await vi.waitFor(() => expect(getComputedStyle(table).backgroundColor).toBe(lightBackground));
    });

    it('switches the empty state’s illustration with the theme', async () => {
        openHomepage();
        await expect.element(page.getByText('Create end-to-end encrypted documents and spreadsheets.')).toBeVisible();
        const illustration = page.elementLocator(page.getByRole('main').element().querySelector('img')!);
        await expect.element(illustration).toHaveAttribute('src', expect.stringContaining('empty-state-recents'));

        document.documentElement.setAttribute('data-theme-mode', 'dark');

        await expect.element(illustration).toHaveAttribute('src', expect.stringContaining('emptyStateRecentsDark'));

        document.documentElement.removeAttribute('data-theme-mode');

        await expect.element(illustration).toHaveAttribute('src', expect.stringContaining('empty-state-recents'));
    });
});

describe('narrow viewport', () => {
    // The table hides its "Created by" column, by which `documentsTable` finds it.
    const main = page.getByRole('main');

    beforeEach(async () => {
        await page.viewport(600, 800);
    });
    afterEach(async () => {
        await page.viewport(1280, 720);
    });

    it('hides the sidebar in a drawer, which the menu button opens over a backdrop', async () => {
        openHomepage('/recents', recentsDependencies([projectPlan]));
        await expect.element(main.getByText('Project plan')).toBeVisible();
        await expect.element(drawer()).not.toBeVisible();

        await userEvent.click(page.getByRole('button', { name: 'Open navigation' }));

        await expect.element(drawer()).toBeVisible();
        expect(sidebarRoot().dataset.expanded).toBe('true');
        // The backdrop, under the drawer: a click on it closes the drawer.
        const backdrop = document.querySelector<HTMLElement>('.z-\\[799\\]')!;
        expect(getComputedStyle(backdrop).display).toBe('block');

        await userEvent.click(page.elementLocator(backdrop), { position: { x: 500, y: 400 } });

        await expect.element(drawer()).not.toBeVisible();
        expect(sidebarRoot().dataset.expanded).toBe('false');
    });

    it('keeps the keyboard focus in the open drawer', async () => {
        openHomepage('/recents', recentsDependencies([projectPlan]));
        await userEvent.click(page.getByRole('button', { name: 'Open navigation' }));
        await expect.element(drawer()).toBeVisible();
        const root = sidebarRoot();
        expect(root.contains(document.activeElement)).toBe(true);

        const reached = new Set<Element>();
        for (let tabs = 0; tabs < 25; tabs++) {
            await userEvent.tab();
            expect(root.contains(document.activeElement)).toBe(true);
            reached.add(document.activeElement!);
        }
        // Around and back: through the drawer's links, not stuck on one.
        expect(reached.size).toBeGreaterThan(5);

        for (let tabs = 0; tabs < 10; tabs++) {
            await userEvent.tab({ shift: true });
            expect(root.contains(document.activeElement)).toBe(true);
        }
    });

    it('closes the drawer when a link in it is followed', async () => {
        openHomepage('/recents', recentsDependencies([projectPlan]));
        await userEvent.click(page.getByRole('button', { name: 'Open navigation' }));

        await userEvent.click(sidebar.getByRole('link', { name: 'Trash' }));

        await expect.element(drawer()).not.toBeVisible();
        await expect.element(page.getByText('There are no documents in the trash.')).toBeVisible();
    });

    it('turns the search button into a field', async () => {
        openHomepage('/recents', recentsDependencies([projectPlan, budget]));
        await expect.element(main.getByText('Budget')).toBeVisible();
        await expect.element(page.getByRole('textbox', { name: 'Search recents' })).not.toBeInTheDocument();

        await userEvent.click(page.getByRole('button', { name: 'Search recents' }));

        const search = page.getByRole('textbox', { name: 'Search recents' });
        await expect.element(search).toHaveFocus();
        await userEvent.keyboard('plan');

        await expect.element(main.getByText('Budget')).not.toBeInTheDocument();
        await expect.element(main.getByText('Project plan')).toBeVisible();
    });
});

describe('sidebar', () => {
    it('shows the storage used, which links to the upgrade, and the app version', async () => {
        openHomepage();

        const meter = page.getByRole('meter');
        await expect.element(meter).toHaveAttribute('aria-valuenow', '25');
        const storage = page.getByRole('link', { name: '512.00 MB / 2.00 GB' });
        await expect.element(storage).toHaveAttribute('href', '#');
        await expect.element(page.getByRole('button', { name: 'Proton Docs 0.4.8.6' })).toBeVisible();
    });

    it('copies the app’s full version', async () => {
        const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
        openHomepage();

        await userEvent.click(page.getByRole('button', { name: 'Proton Docs 0.4.8.6' }));

        expect(writeText).toHaveBeenCalledExactlyOnceWith('0.4.8.6+standalone');
        await expect
            .element(page.getByRole('status').filter({ hasText: 'Version number successfully copied to clipboard' }))
            .toBeVisible();
    });

    it('shows the storage as text without an upgrade', async () => {
        openHomepage('/recents', { storage: { usedSpace: 1.8 * 1024 ** 3, maxSpace: 2 * 1024 ** 3 } });

        await expect.element(page.getByRole('meter')).toHaveAttribute('aria-valuenow', '90');
        await expect.element(page.getByText('1.80 GB')).toBeVisible();
        await expect.element(page.getByRole('link', { name: /1.80 GB/ })).not.toBeInTheDocument();
    });

    it('shows no storage without it, or with no space at all', async () => {
        const homepage = openHomepage('/recents', { storage: undefined });
        await expect.element(sidebar).toBeVisible();
        await expect.element(page.getByRole('meter')).not.toBeInTheDocument();

        homepage.rerender({ storage: { usedSpace: 0, maxSpace: 0 } });

        await expect.element(sidebar).toBeVisible();
        await expect.element(page.getByRole('meter')).not.toBeInTheDocument();
    });

    it('links to Drive in a new tab', async () => {
        openHomepage('/recents', { getAppHref: (path, app) => `https://${app}.example${path}` });

        const drive = sidebar.getByRole('link', { name: 'Go to Proton Drive' });
        await expect.element(drive).toHaveAttribute('href', 'https://proton-drive.example/');
        await expect.element(drive).toHaveAttribute('target', '_blank');
    });

    it('reloads the recents', async () => {
        const dependencies = recentsDependencies([projectPlan]);
        const api = vi.spyOn(dependencies, 'api');
        openHomepage('/recents', dependencies);
        await expect.element(documentRow('Project plan')).toBeVisible();
        const calls = api.mock.calls.length;

        await userEvent.click(sidebar.getByRole('button', { name: 'Update recent documents' }));

        await expect.element(page.getByRole('status').filter({ hasText: 'Recent documents updated' })).toBeVisible();
        expect(api.mock.calls.length).toBe(calls + 1);
        await expect.element(documentRow('Project plan')).toBeVisible();
    });

    it('reloads the recents from the trash, and goes to them', async () => {
        const dependencies = recentsDependencies([projectPlan]);
        const api = vi.spyOn(dependencies, 'api');
        const homepage = openHomepage('/trash', dependencies);
        await expect.element(page.getByText('There are no documents in the trash.')).toBeVisible();

        await userEvent.click(sidebar.getByRole('button', { name: 'Update recent documents' }));

        await expect.element(documentRow('Project plan')).toBeVisible();
        await expect.element(page.getByRole('status').filter({ hasText: 'Recent documents updated' })).toBeVisible();
        expect(homepage.history.location).toBe('/recents');
        expect(api).toHaveBeenCalled();
    });
});

it('focuses the main area from the skip link', async () => {
    openHomepage('/recents', recentsDependencies([projectPlan]));
    await expect.element(documentRow('Project plan')).toBeVisible();

    // The first stop of the page.
    await userEvent.tab();
    const skipLink = page.getByRole('link', { name: 'Skip to main content' });
    await expect.element(skipLink).toHaveFocus();
    await userEvent.keyboard('{Enter}');

    await expect.element(page.getByRole('main')).toHaveFocus();
});

describe('styles outside the module', () => {
    it('sets its variables and shims only inside its root', async () => {
        openHomepage('/recents', recentsDependencies([projectPlan]));
        await expect.element(documentRow('Project plan')).toBeVisible();
        const outside = document.createElement('div');
        outside.className = 'flex text-ellipsis absolute';
        document.body.append(outside);

        try {
            expect(getComputedStyle(document.documentElement).getPropertyValue('--background-norm')).toBe('');
            expect(getComputedStyle(document.body).getPropertyValue('--text-norm')).toBe('');
            // HomepageStyleScope.css's shims of Proton's utilities stop at the root.
            const style = getComputedStyle(outside);
            expect(style.flexWrap).toBe('nowrap');
            expect(style.overflow).toBe('visible');
            expect(style.zIndex).toBe('auto');
        } finally {
            outside.remove();
        }
    });

    it('removes its image preloads from <head> when it closes', async () => {
        const preloads = () => document.head.querySelectorAll('link[rel="preload"][as="image"]');
        const homepage = openHomepage();
        await expect.element(page.getByRole('main')).toBeVisible();
        expect(preloads()).toHaveLength(2);

        homepage.unmount();

        expect(preloads()).toHaveLength(0);
    });
});
