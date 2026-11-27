import { page, userEvent } from 'vitest/browser';

import { type RecentFile, recentsDependencies, uid } from './mocks/recents';
import { documentRow, documentRows, documentsTable, expectRowsInOrder, openHomepage, sidebar } from './test/browser';

const projectPlan = { linkId: 'plan', name: 'Project plan', type: 'document' } as const;
const budget = { linkId: 'budget', name: 'Budget', type: 'spreadsheet' } as const;

/** The text of each of the table's rows, its head and section labels included, in order. */
function tableLines() {
    return documentsTable
        .getByRole('row')
        .elements()
        .map((row) => row.textContent ?? '');
}

describe('documents table', () => {
    describe('dates', () => {
        // A Friday afternoon. Only `Date` is faked: timers stay real for the user events and the homepage's waits.
        const now = new Date(2026, 10, 27, 15, 0);
        function daysAgo(days: number, hours = 10) {
            const date = new Date(now);
            date.setDate(date.getDate() - days);
            date.setHours(hours, 0, 0, 0);
            return date;
        }

        beforeEach(() => {
            vi.useFakeTimers({ toFake: ['Date'] });
            vi.setSystemTime(now);
        });
        afterEach(() => {
            vi.useRealTimers();
        });

        const files: RecentFile[] = [
            { linkId: 'hour', name: 'An hour ago', type: 'document', lastOpened: daysAgo(0, 14) },
            { linkId: 'morning', name: 'This morning', type: 'document', lastOpened: new Date(2026, 10, 27, 2, 30) },
            { linkId: 'yesterday', name: 'Yesterday’s', type: 'document', lastOpened: daysAgo(1) },
            { linkId: 'week', name: 'This week', type: 'spreadsheet', lastOpened: daysAgo(3) },
            { linkId: 'month', name: 'This month', type: 'document', lastOpened: daysAgo(20) },
            { linkId: 'old', name: 'Long ago', type: 'document', lastOpened: daysAgo(60) },
        ];

        it('groups the recents by when they were last viewed, newest first', async () => {
            openHomepage('/recents', recentsDependencies(files));

            await expectRowsInOrder([
                'An hour ago',
                'This morning',
                'Yesterday’s',
                'This week',
                'This month',
                'Long ago',
            ]);
            // The head names the first section, a row between them each of the others.
            expect(tableLines()).toEqual([
                expect.stringMatching(/^Today/),
                expect.stringMatching(/^An hour ago/),
                expect.stringMatching(/^This morning/),
                'Yesterday',
                expect.stringMatching(/^Yesterday’s/),
                'Previous 7 days',
                expect.stringMatching(/^This week/),
                'Previous 30 days',
                expect.stringMatching(/^This month/),
                'Earlier',
                expect.stringMatching(/^Long ago/),
            ]);
        });

        it('shows when each was viewed: relative today and yesterday, then the weekday, then the date', async () => {
            openHomepage('/recents', recentsDependencies(files));

            await expect.element(documentRow('An hour ago')).toMatchTextContent('1 hour ago');
            // Over 12 hours ago, the time, on a 24-hour clock as `dateFormat` asks.
            await expect.element(documentRow('This morning')).toMatchTextContent('02:30');
            await expect.element(documentRow('Yesterday’s')).toMatchTextContent('Yesterday');
            await expect.element(documentRow('This week')).toMatchTextContent('Tuesday');
            await expect.element(documentRow('This month')).toMatchTextContent('Nov 7');
            await expect.element(documentRow('Long ago')).toMatchTextContent('Sep 28');
        });

        it('shows a document opened a moment ago as just now', async () => {
            openHomepage('/recents', recentsDependencies([{ ...projectPlan, lastOpened: now }]));

            await expect.element(documentRow('Project plan')).toMatchTextContent('Just now');
        });

        it('lists the dates in the host’s locale and clock', async () => {
            openHomepage('/recents', {
                ...recentsDependencies([
                    { ...projectPlan, lastOpened: new Date(2026, 10, 27, 2, 30) },
                    { ...budget, lastOpened: daysAgo(20) },
                ]),
                dateFormat: { localeCode: 'fr-FR', hourCycle: 'h23' },
            });

            await expect.element(documentRow('Project plan')).toMatchTextContent('02:30');
            await expect.element(documentRow('Budget')).toMatchTextContent('7 nov.');
        });
    });

    describe('created by', () => {
        it('names the user “Me”, a contact by their name, and anyone else by their email', async () => {
            const teamNotes: RecentFile = {
                linkId: 'notes',
                name: 'Team notes',
                type: 'document',
                sharedBy: 'alice@example.com',
            };
            const agenda: RecentFile = {
                linkId: 'agenda',
                name: 'Agenda',
                type: 'document',
                sharedBy: 'bob@example.com',
            };
            openHomepage('/recents', {
                ...recentsDependencies([projectPlan, teamNotes, agenda]),
                // The mocks' own files are by author@example.com. Proton's addresses match however they're written.
                addresses: [{ Email: 'Author+docs@Example.com' }],
                contactEmails: [{ Email: 'alice@example.com', Name: 'Alice Liddell' }],
            });

            await expect.element(documentRow('Project plan')).toMatchTextContent('Me');
            await expect.element(documentRow('Project plan')).not.toMatchTextContent('author@example.com');
            await expect.element(documentRow('Team notes')).toMatchTextContent('Alice Liddell');
            await expect.element(documentRow('Agenda')).toMatchTextContent('bob@example.com');
        });

        it('names the author by email while the addresses and contacts load', async () => {
            openHomepage('/recents', {
                ...recentsDependencies([projectPlan]),
                addresses: undefined,
                contactEmails: undefined,
            });

            await expect.element(documentRow('Project plan')).toMatchTextContent('author@example.com');
        });
    });

    describe('location', () => {
        it('shows My files, the document’s folder or Shared with me', async () => {
            openHomepage(
                '/recents',
                recentsDependencies([
                    projectPlan,
                    { ...budget, path: [{ linkId: 'finance', name: 'finance' }] },
                    { linkId: 'notes', name: 'Team notes', type: 'document', sharedBy: 'alice@example.com' },
                ])
            );

            await expect.element(documentRow('Project plan').getByRole('button', { name: 'My files' })).toBeVisible();
            await expect.element(documentRow('Budget').getByRole('button', { name: 'finance' })).toBeVisible();
            await expect
                .element(documentRow('Team notes').getByRole('button', { name: 'Shared with me' }))
                .toBeVisible();
        });

        it('opens the trash in Drive from a trashed document’s location', async () => {
            const open = vi.spyOn(window, 'open').mockReturnValue(null);
            openHomepage('/trash', {
                ...recentsDependencies([{ ...projectPlan, trashed: true }]),
                getAppHref: (path, app) => `https://${app}.example${path}`,
            });

            await userEvent.click(documentRow('Project plan').getByRole('button', { name: 'Trash' }));

            expect(open).toHaveBeenCalledExactlyOnceWith('https://proton-drive.example/trash');
        });
    });

    it('lists the trash by name, with when each was deleted', async () => {
        openHomepage(
            '/trash',
            recentsDependencies([
                { linkId: 'zeta', name: 'Zeta', type: 'document', trashed: true },
                { linkId: 'alpha', name: 'Alpha', type: 'spreadsheet', trashed: true },
                // Not trashed: only in the recents.
                projectPlan,
            ])
        );

        await expectRowsInOrder(['Alpha', 'Zeta']);
        await expect.element(documentsTable.getByRole('columnheader', { name: 'Deleted' })).toBeVisible();
        await expect.element(documentsTable.getByRole('columnheader', { name: 'Viewed' })).not.toBeInTheDocument();
        await expect.element(documentsTable).toMatchTextContent(/^Trash/);
    });

    it('opens a document, and a spreadsheet, in a new tab of its editor', async () => {
        const open = vi.spyOn(window, 'open').mockReturnValue(null);
        const reportTelemetry = vi.fn();
        openHomepage('/recents', {
            ...recentsDependencies([projectPlan, budget]),
            getAppHref: (path, app) => `https://${app}.example${path}`,
            reportTelemetry,
        });

        await userEvent.click(documentRow('Project plan').getByText('Project plan'));
        await userEvent.click(documentRow('Budget').getByText('Budget'));

        expect(open.mock.calls).toEqual([
            ['https://proton-docs.example/doc?mode=open&volumeId=volume&linkId=plan'],
            ['https://proton-docs.example/sheet?mode=open&volumeId=volume&linkId=budget'],
        ]);
        expect(reportTelemetry).toHaveBeenCalledWith('document.opened');
    });

    it('opens a trashed document as one in the trash', async () => {
        vi.spyOn(window, 'open').mockReturnValue(null);
        const reportTelemetry = vi.fn();
        openHomepage('/trash', { ...recentsDependencies([{ ...projectPlan, trashed: true }]), reportTelemetry });

        await userEvent.click(documentRow('Project plan').getByText('Project plan'));

        expect(reportTelemetry).toHaveBeenCalledExactlyOnceWith('document.opened_in_trash');
    });

    it('shows a name Drive can’t decrypt as undecryptable', async () => {
        const dependencies = recentsDependencies([projectPlan, budget]);
        const node = await dependencies.drive.getNode(uid('plan'));
        Object.assign(node!, { name: { ok: false, error: new Error('Decryption failed') } });
        openHomepage('/recents', dependencies);

        await expect.element(documentRows.filter({ hasText: '⚠️ Undecryptable name' })).toBeVisible();
        await expect.element(documentRow('Budget')).toBeVisible();
    });

    it('lists the documents it can load, and tells that some could not be', async () => {
        const dependencies = recentsDependencies([projectPlan, budget]);
        // The Docs API lists a document Drive no longer has.
        const api = dependencies.api;
        dependencies.api = (async (...args: Parameters<typeof api>) => {
            const response = (await api(...args)) as { RecentDocuments: object[] };
            return {
                ...response,
                RecentDocuments: [
                    ...response.RecentDocuments,
                    { VolumeID: 'volume', LinkID: 'gone', LastOpenTime: 0, ContextShareID: 'share', AncestorIDs: [] },
                ],
            };
        }) as typeof api;
        openHomepage('/recents', dependencies);

        await expect.element(page.getByRole('alert')).toHaveTextContent('Some documents could not be loaded');
        await expect.element(documentRow('Project plan')).toBeVisible();
        await expect.element(documentRow('Budget')).toBeVisible();
        expect(documentRows.elements()).toHaveLength(2);
    });

    it('tells when My files can’t load, and still lists the recents', async () => {
        const dependencies = recentsDependencies([projectPlan]);
        vi.spyOn(dependencies.drive, 'getMyFilesRootFolder').mockRejectedValue(new Error('Drive failed'));
        openHomepage('/recents', dependencies);

        await expect.element(page.getByRole('alert')).toHaveTextContent("Failed to load 'My files' folder");
        await expect.element(documentRow('Project plan')).toBeVisible();
    });

    it('titles the table after the sidebar’s filter', async () => {
        openHomepage('/recents', recentsDependencies([projectPlan, budget]));
        await expect.element(documentsTable).toMatchTextContent(/^Recents/);

        await userEvent.click(sidebar.getByRole('link', { name: 'Documents' }));
        await expect.element(documentsTable).toMatchTextContent(/^Recent documents/);

        await userEvent.click(sidebar.getByRole('link', { name: 'Spreadsheets' }));
        await expect.element(documentsTable).toMatchTextContent(/^Recent spreadsheets/);
    });
});
