import { useSyncExternalStore } from 'react';
import { type Root, createRoot } from 'react-dom/client';

import type { HomepageNavigation, HomepageRoute } from 'proton-docs/homepage';
import { type Locator, page, userEvent } from 'vitest/browser';

import { StandaloneHomepage, type StandaloneHomepageProps, getHref, getRoute } from '../StandaloneHomepage';

/** The homepage's sidebar, by its navigation landmark. */
export const sidebar = page.getByRole('navigation');

/** The homepage's documents table, the table with a "Created by" column. */
export const documentsTable = page
    .getByRole('table')
    .filter({ has: page.getByRole('columnheader', { name: 'Created by' }) });

/** The documents table's rows, without its header and section labels. */
export const documentRows = documentsTable.getByRole('row').filter({ has: page.getByRole('cell') });

/** The homepage's pending invitations table, the table with a "Shared by" column. */
export const invitesTable = page
    .getByRole('table')
    .filter({ has: page.getByRole('columnheader', { name: 'Shared by' }) });

/** The invitations table's rows, without its header. */
export const inviteRows = invitesTable.getByRole('row').filter({ has: page.getByRole('cell') });

/** The row of the documents table that shows `name`. */
export function documentRow(name: string) {
    return documentRows.filter({ hasText: name });
}

/** Opens the three-dot menu of the row that shows `name`, and picks `item`. */
export async function pickAction(name: string, item: string) {
    await userEvent.click(documentRow(name).getByRole('button', { name: 'Actions' }));
    await userEvent.click(page.getByRole('menuitem', { name: item }));
}

/** Waits until the documents table lists `names`, in that order. */
export async function expectRowsInOrder(names: string[]) {
    for (const [index, name] of names.entries()) {
        await expect.element(documentRows.nth(index)).toMatchTextContent(name);
    }
    expect(documentRows.elements()).toHaveLength(names.length);
}

/**
 * An in-memory history with the Docs app's paths, as a host's router: `navigate` pushes an entry or replaces the
 * current one, and `back` and `forward` move through them as the browser's buttons do.
 */
type MemoryHistory = {
    /** The current address, such as `/recents?q=plan`. */
    readonly location: string;
    /** Every address in the history, oldest first. */
    readonly entries: readonly string[];
    back: () => void;
    forward: () => void;
    /** Goes to `path` in a new entry, as a host's own link does. */
    push: (path: string) => void;
};

function createMemoryHistory(path: string) {
    const toEntry = (href: string) => {
        const [pathname, search = ''] = href.split('?');
        // Each entry keeps its route object, so a route is new only when the address changes, as a host's is.
        return { href, route: getRoute(pathname, search) };
    };
    let entries = [toEntry(path)];
    let index = 0;
    const listeners = new Set<() => void>();
    const notify = () => listeners.forEach((listener) => listener());

    const go = (delta: number) => {
        index = Math.min(Math.max(index + delta, 0), entries.length - 1);
        notify();
    };
    const pushEntry = (href: string) => {
        entries = [...entries.slice(0, index + 1), toEntry(href)];
        index += 1;
        notify();
    };
    const navigate: HomepageNavigation['navigate'] = (to, { replace = false } = {}) => {
        if (replace) {
            entries = entries.with(index, toEntry(getHref(to)));
            notify();
        } else {
            pushEntry(getHref(to));
        }
    };
    const subscribe = (listener: () => void) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
    };
    const getCurrentRoute = (): HomepageRoute => entries[index].route;

    const history: MemoryHistory = {
        get location() {
            return entries[index].href;
        },
        get entries() {
            return entries.map(({ href }) => href);
        },
        back: () => go(-1),
        forward: () => go(1),
        push: pushEntry,
    };
    return { history, navigate, subscribe, getCurrentRoute };
}

type MemoryHomepageProps = {
    memoryHistory: ReturnType<typeof createMemoryHistory>;
    overrides: StandaloneHomepageProps['overrides'];
};

/** The standalone homepage on an in-memory history, which follows the homepage's navigation. */
function MemoryHomepage({ memoryHistory: { subscribe, getCurrentRoute, navigate }, overrides }: MemoryHomepageProps) {
    const route = useSyncExternalStore(subscribe, getCurrentRoute);
    // A new navigation object on every render, as the Docs app's: the module reads its fields.
    return <StandaloneHomepage navigation={{ route, navigate, getHref }} overrides={overrides} />;
}

let opened: { root: Root; host: HTMLElement } | undefined;

/** Unmounts the homepage the last `openHomepage` opened, if it's still open, for a test that renders its own host. */
function closeHomepage() {
    if (opened) {
        opened.root.unmount();
        opened.host.remove();
        opened = undefined;
    }
}

export type OpenedHomepage = {
    history: MemoryHistory;
    /**
     * Renders the homepage again with `overrides`, as a host's re-render does: a new dependencies object, whose
     * fields keep their identity unless `overrides` changes them.
     */
    rerender: (overrides?: StandaloneHomepageProps['overrides']) => void;
    /** Unmounts the homepage, as a host leaving it for another page does. */
    unmount: () => void;
};

/**
 * Helper for the `browser` project (Chromium). Opens the standalone homepage at `path`, as a user opening that URL
 * does, with the same empty mocks as `pnpm start` unless `overrides` replaces them. Unmounts the page the previous
 * test opened first, so each test starts on its own, and the last one's page stays on screen after the run.
 */
export function openHomepage(path = '/recents', overrides?: StandaloneHomepageProps['overrides']): OpenedHomepage {
    closeHomepage();
    const host = document.createElement('div');
    host.className = 'fixed inset-0';
    document.body.append(host);
    const root = createRoot(host);
    opened = { root, host };
    const memoryHistory = createMemoryHistory(path);
    const render = (currentOverrides: StandaloneHomepageProps['overrides']) =>
        root.render(<MemoryHomepage memoryHistory={memoryHistory} overrides={{ ...currentOverrides }} />);
    render(overrides);
    return {
        history: memoryHistory.history,
        rerender: (nextOverrides = overrides) => render(nextOverrides),
        unmount: closeHomepage,
    };
}

/**
 * Presses Tab until `target` has focus, as a keyboard user reaches it, and fails after `maxTabs` presses. Unlike
 * hovering, it doesn't depend on where the real mouse is in a headed browser.
 */
export async function tabTo(target: Locator, maxTabs = 50) {
    const element = await target.findElement();
    for (let tabs = 0; tabs < maxTabs; tabs++) {
        await userEvent.tab();
        if (document.activeElement === element) {
            return;
        }
    }
    throw new Error(`Tab didn't reach ${target} in ${maxTabs} presses`);
}

/** A promise and the functions that settle it, for a dependency a test answers when it chooses. */
export function deferred<T = void>() {
    let resolve!: (value: T) => void;
    let reject!: (reason: unknown) => void;
    const promise = new Promise<T>((onResolve, onReject) => {
        resolve = onResolve;
        reject = onReject;
    });
    return { promise, resolve, reject };
}
