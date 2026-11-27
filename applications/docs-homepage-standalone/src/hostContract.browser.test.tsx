import { type HomepageDependencies, defaultHomepageMessages } from 'proton-docs/homepage';
import { page, userEvent } from 'vitest/browser';

import { recentsDependencies } from './mocks/recents';
import { deferred, documentRow, documentRows, openHomepage, sidebar } from './test/browser';

// What the module asks of its host (HomepageDependencies' comments, the README), and what it does to the page: the
// contract a host other than the Docs app relies on once the module is extracted.

const projectPlan = { linkId: 'plan', name: 'Project plan', type: 'document' } as const;
const budget = { linkId: 'budget', name: 'Budget', type: 'spreadsheet' } as const;

/** Recents whose `api` counts its calls and, with `gate`, answers only once the gate opens. */
function countedRecents(files: Parameters<typeof recentsDependencies>[0], gate?: Promise<void>) {
    const dependencies = recentsDependencies(files);
    const recentsApi = dependencies.api;
    const api = vi.fn(async (...args: Parameters<HomepageDependencies['api']>) => {
        await gate;
        return recentsApi(...args);
    }) as unknown as HomepageDependencies['api'] & ReturnType<typeof vi.fn>;
    return { ...dependencies, api };
}

const reloadButton = sidebar.getByRole('button', { name: 'Update recent documents' });

describe('re-renders', () => {
    it('keeps the recents when the host renders a new dependencies object with the same fields', async () => {
        const dependencies = countedRecents([projectPlan]);
        const homepage = openHomepage('/recents', dependencies);
        await expect.element(documentRow('Project plan')).toBeVisible();

        for (let render = 0; render < 3; render++) {
            homepage.rerender({ ...dependencies });
        }
        // As the Docs app, which builds `dateFormat` on every render.
        homepage.rerender({ ...dependencies, dateFormat: { localeCode: 'en-US', hourCycle: 'h23' } });

        await expect.element(documentRow('Project plan')).toBeVisible();
        expect(dependencies.api).toHaveBeenCalledOnce();
    });

    it('shows new messages, such as another language’s, without loading the recents again', async () => {
        const dependencies = countedRecents([projectPlan]);
        const homepage = openHomepage('/recents', dependencies);
        await expect.element(sidebar.getByRole('link', { name: 'Trash' })).toBeVisible();
        await expect.element(documentRow('Project plan')).toBeVisible();

        homepage.rerender({
            ...dependencies,
            messages: {
                ...defaultHomepageMessages,
                sidebar: { ...defaultHomepageMessages.sidebar, trash: 'Corbeille' },
            },
        });

        await expect.element(sidebar.getByRole('link', { name: 'Corbeille' })).toBeVisible();
        expect(dependencies.api).toHaveBeenCalledOnce();
    });

    it('loads the recents again when the host passes another api, as the dependencies’ comments say', async () => {
        const dependencies = countedRecents([projectPlan]);
        const homepage = openHomepage('/recents', dependencies);
        await expect.element(documentRow('Project plan')).toBeVisible();

        const other = countedRecents([budget]);
        homepage.rerender(other);

        await expect.element(documentRow('Budget')).toBeVisible();
        expect(other.api).toHaveBeenCalledOnce();
    });
});

describe('unmounting', () => {
    it('stops listening to Drive and core events', async () => {
        const dependencies = recentsDependencies([projectPlan]);
        const reset = vi.spyOn(dependencies.eventSubscriber, 'reset');
        const initialize = vi.spyOn(dependencies.eventSubscriber, 'initialize');
        const removeCoreListener = vi.fn();
        const addListener = vi.fn(() => removeCoreListener);
        const homepage = openHomepage('/recents', { ...dependencies, coreEventSubscriber: { addListener } });
        await expect.element(documentRow('Project plan')).toBeVisible();
        await vi.waitFor(() => expect(initialize).toHaveBeenCalled());
        expect(addListener).toHaveBeenCalled();

        homepage.unmount();

        expect(reset).toHaveBeenCalled();
        expect(removeCoreListener).toHaveBeenCalledTimes(addListener.mock.calls.length);
    });

    it('asks before the page unloads while a request is pending, and no longer once it’s unmounted', async () => {
        const gate = deferred();
        const homepage = openHomepage('/recents', countedRecents([projectPlan], gate.promise));
        const unload = () => {
            const event = new Event('beforeunload', { cancelable: true });
            window.dispatchEvent(event);
            return event.defaultPrevented;
        };

        await vi.waitFor(() => expect(unload()).toBe(true));
        gate.resolve();
        await expect.element(documentRow('Project plan')).toBeVisible();
        expect(unload()).toBe(false);

        // Another api loads the recents again.
        const pending = deferred();
        homepage.rerender(countedRecents([projectPlan], pending.promise));
        await vi.waitFor(() => expect(unload()).toBe(true));
        homepage.unmount();
        expect(unload()).toBe(false);
        pending.resolve();
    });
});

describe('load failures', () => {
    // The reload button is disabled while the recents load.
    it('lets the user retry after the recents fail to load', async () => {
        const dependencies = recentsDependencies([projectPlan]);
        let online = false;
        const api = (async (...args: Parameters<HomepageDependencies['api']>) => {
            if (!online) {
                throw new Error('Network error');
            }
            return dependencies.api(...args);
        }) as HomepageDependencies['api'];
        openHomepage('/recents', { ...dependencies, api });
        await expect.element(page.getByRole('alert')).toHaveTextContent('Failed to load recent documents');

        online = true;
        await expect.element(reloadButton, { timeout: 1000 }).toBeEnabled();
        await userEvent.click(reloadButton);

        await expect.element(documentRow('Project plan')).toBeVisible();
    });

    it('reports a failed load to error tracking', async () => {
        const traceError = vi.fn();
        openHomepage('/recents', {
            ...recentsDependencies([projectPlan]),
            api: (async () => {
                throw new Error('Network error');
            }) as unknown as HomepageDependencies['api'],
            errorTracking: { traceError, addBreadcrumb: () => {}, isReportable: () => true },
        });

        await expect.element(page.getByRole('alert')).toHaveTextContent('Failed to load recent documents');
        expect(traceError).toHaveBeenCalled();
    });

    it('shows the trash, empty, and an error when the trash fails to load', async () => {
        const dependencies = recentsDependencies([{ ...projectPlan, trashed: true }]);
        vi.spyOn(dependencies.drive, 'iterateTrashedNodes').mockImplementation(async function* () {
            throw new Error('Network error');
        });
        openHomepage('/trash', dependencies);

        await expect.element(page.getByRole('alert')).toHaveTextContent('Some trashed documents could not be loaded');
        await expect.element(page.getByText('There are no documents in the trash.')).toBeVisible();
        await expect.element(reloadButton).toBeEnabled();
    });

    // Going to the trash aborts the recents' load.
    it('leaves the reload button usable after leaving the recents while they load', async () => {
        const gate = deferred();
        openHomepage('/recents', countedRecents([projectPlan], gate.promise));
        await expect.element(reloadButton).toBeDisabled();

        await userEvent.click(sidebar.getByRole('link', { name: 'Trash' }));
        gate.resolve();

        await expect.element(page.getByText('There are no documents in the trash.')).toBeVisible();
        await expect.element(reloadButton, { timeout: 1000 }).toBeEnabled();
    });

    it('shows the recents the last load returned when the user switches views quickly', async () => {
        const gate = deferred();
        const dependencies = countedRecents([projectPlan, { ...budget, trashed: true }], gate.promise);
        const homepage = openHomepage('/recents', dependencies);

        // Recents, trash and back before the recents load.
        await vi.waitFor(() => expect(dependencies.api).toHaveBeenCalledOnce());
        homepage.history.push('/trash');
        await expect.element(page.getByText('Budget')).toBeVisible();
        homepage.history.back();
        await vi.waitFor(() => expect(dependencies.api).toHaveBeenCalledTimes(2));
        gate.resolve();

        await expect.element(documentRow('Project plan')).toBeVisible();
        await expect.element(documentRow('Budget')).not.toBeInTheDocument();
        expect(documentRows.elements()).toHaveLength(1);
    });
});
