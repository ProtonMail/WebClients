import type { Mock } from 'vitest';

import { ApiImportProvider, ApiImporterState, ApiReportState } from '@proton/activation/src/api/api.interface';
import { ImportType } from '@proton/activation/src/interface';
import type { Report, ReportSummary } from '@proton/activation/src/logic/reports/reports.interface';
import type { Feature } from '@proton/features/interface';
import { FeatureCode } from '@proton/features/interface';
import { fetchFeatures } from '@proton/features/reducer';
import { CacheType } from '@proton/redux-utilities/interface';
import { ADDRESS_FLAGS, MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Address } from '@proton/shared/lib/interfaces/Address';
import type { NewsletterSubscription } from '@proton/shared/lib/interfaces/NewsletterSubscription';

import { activeSubscription, generateSubscriptionList } from '../components/view/NewsletterSubscription/testData';
import type { BYOEInboxCleanupProgress } from './byoeInboxCleanup';
import {
    BYOE_INBOX_CLEANUP_SENDERS_QUERY,
    cleanUpBYOEInboxSenders,
    fetchIsBYOEFeatureDue,
    fetchSendersIfStillDue,
    getBYOEInboxCleanupSenders,
    getFinishedBYOEImportOutcome,
    groupBYOEInboxCleanupSenders,
} from './byoeInboxCleanup';

vi.mock('@proton/features/reducer', () => ({ fetchFeatures: vi.fn() }));

const withoutOneClick = (subscription: NewsletterSubscription): NewsletterSubscription => ({
    ...subscription,
    UnsubscribeMethods: { HttpClient: 'https://example.com/unsubscribe' },
});

const mockSubscriptionsResponse = (
    mockedApi: Mock,
    subscriptions: NewsletterSubscription[],
    nextPage: string | null = null
) => {
    mockedApi.mockResolvedValueOnce({
        NewsletterSubscriptions: subscriptions,
        PageInfo: {
            Total: subscriptions.length,
            NextPage: nextPage ? { QueryString: nextPage } : null,
        },
    });
};

describe('getBYOEInboxCleanupSenders', () => {
    it('asks quietly for active, non-spam senders, never read first, then read longest ago, then most unread', async () => {
        const mockedApi = vi.fn();
        mockSubscriptionsResponse(mockedApi, []);

        await getBYOEInboxCleanupSenders(mockedApi);

        expect(BYOE_INBOX_CLEANUP_SENDERS_QUERY).toBe(
            'PageSize=100&Active=1&Spam=0&Sort[LastReadTime]=ASC&Sort[UnreadMessageCount]=DESC&Sort[ID]=DESC'
        );
        expect(mockedApi).toHaveBeenCalledTimes(1);
        expect(mockedApi.mock.calls[0][0]).toMatchObject({
            url: 'mail/v4/newsletter-subscriptions?PageSize=100&Active=1&Spam=0&Sort[LastReadTime]=ASC&Sort[UnreadMessageCount]=DESC&Sort[ID]=DESC',
            method: 'GET',
            silence: true,
        });
    });

    it("keeps only one-click senders, in the server's order", async () => {
        const mockedApi = vi.fn();
        const [first, second, third, fourth, fifth] = generateSubscriptionList(5);
        mockSubscriptionsResponse(mockedApi, [first, withoutOneClick(second), third, withoutOneClick(fourth), fifth]);

        const senders = await getBYOEInboxCleanupSenders(mockedApi);

        expect(senders.map(({ ID }) => ID)).toEqual([first.ID, third.ID, fifth.ID]);
    });

    it('keeps a sender that offers one-click alongside other ways to unsubscribe', async () => {
        const mockedApi = vi.fn();
        const sender = {
            ...activeSubscription,
            UnsubscribeMethods: {
                OneClick: 'OneClick' as const,
                HttpClient: 'https://example.com',
                Mailto: { ToList: ['unsubscribe@example.com'] },
            },
        };
        mockSubscriptionsResponse(mockedApi, [sender]);

        const senders = await getBYOEInboxCleanupSenders(mockedApi);

        expect(senders).toEqual([sender]);
    });

    it('offers at most ten', async () => {
        const mockedApi = vi.fn();
        const subscriptions = generateSubscriptionList(25);
        mockSubscriptionsResponse(mockedApi, subscriptions);

        const senders = await getBYOEInboxCleanupSenders(mockedApi);

        expect(senders).toHaveLength(10);
        expect(senders.map(({ ID }) => ID)).toEqual(subscriptions.slice(0, 10).map(({ ID }) => ID));
    });

    it('offers fewer when fewer qualify, without asking for another page', async () => {
        const mockedApi = vi.fn();
        const subscriptions = generateSubscriptionList(100).map((subscription, index) =>
            index < 3 ? subscription : withoutOneClick(subscription)
        );
        mockSubscriptionsResponse(mockedApi, subscriptions, 'PageSize=100&Anchor=next');

        const senders = await getBYOEInboxCleanupSenders(mockedApi);

        expect(senders.map(({ ID }) => ID)).toEqual(['active-1', 'active-2', 'active-3']);
        expect(mockedApi).toHaveBeenCalledTimes(1);
    });

    it('returns an empty list, not an error, when none of the subscriptions support one-click', async () => {
        const mockedApi = vi.fn();
        mockSubscriptionsResponse(mockedApi, generateSubscriptionList(100).map(withoutOneClick), 'PageSize=100');

        const senders = await getBYOEInboxCleanupSenders(mockedApi);

        expect(senders).toEqual([]);
        expect(mockedApi).toHaveBeenCalledTimes(1);
    });

    it('returns an empty list when the person has no subscriptions', async () => {
        const mockedApi = vi.fn();
        mockSubscriptionsResponse(mockedApi, []);

        const senders = await getBYOEInboxCleanupSenders(mockedApi);

        expect(mockedApi).toHaveBeenCalledTimes(1);
        expect(senders).toEqual([]);
    });

    it('rejects when loading the subscriptions fails', async () => {
        const mockedApi = vi.fn();
        mockedApi.mockRejectedValueOnce(new Error('Network error'));

        await expect(getBYOEInboxCleanupSenders(mockedApi)).rejects.toThrow('Network error');
    });
});

describe('groupBYOEInboxCleanupSenders', () => {
    const sender = (
        ID: string,
        LastReadTime: number | null,
        ReceivedMessageCount: number,
        UnreadMessageCount: number
    ): NewsletterSubscription => ({
        ...activeSubscription,
        ID,
        LastReadTime,
        ReceivedMessageCount,
        UnreadMessageCount,
    });

    const getSectionIDs = (subscriptions: NewsletterSubscription[]) => {
        return groupBYOEInboxCleanupSenders(subscriptions).map(({ section, subscriptions: sectionSubscriptions }) => ({
            section,
            IDs: sectionSubscriptions.map(({ ID }) => ID),
        }));
    };

    it('a sender never read is never opened, even when unread is below received', () => {
        expect(getSectionIDs([sender('never', null, 10, 2)])).toEqual([{ section: 'never', IDs: ['never'] }]);
    });

    it('4 of 10 opened is sometimes', () => {
        expect(getSectionIDs([sender('four', 1700000000, 10, 6)])).toEqual([{ section: 'sometimes', IDs: ['four'] }]);
    });

    it('5 of 10 opened is often', () => {
        expect(getSectionIDs([sender('five', 1700000000, 10, 5)])).toEqual([{ section: 'often', IDs: ['five'] }]);
    });

    it('keeps the order senders arrive in within each section', () => {
        const senders = [sender('b', null, 3, 3), sender('a', null, 5, 5), sender('c', null, 1, 1)];

        expect(getSectionIDs(senders)).toEqual([{ section: 'never', IDs: ['b', 'a', 'c'] }]);
    });

    it('sections come never, sometimes, often whatever order the senders arrive in', () => {
        const senders = [
            sender('often', 1700000000, 10, 0),
            sender('sometimes', 1700000000, 10, 9),
            sender('never', null, 10, 10),
        ];

        expect(getSectionIDs(senders)).toEqual([
            { section: 'never', IDs: ['never'] },
            { section: 'sometimes', IDs: ['sometimes'] },
            { section: 'often', IDs: ['often'] },
        ]);
    });

    it('leaves out sections with no senders', () => {
        const senders = [sender('never', null, 10, 10), sender('often', 1700000000, 10, 1)];

        expect(getSectionIDs(senders).map(({ section }) => section)).toEqual(['never', 'often']);
    });
});

describe('cleanUpBYOEInboxSenders', () => {
    const apiError = (status: number) => {
        return Object.assign(new Error('api error'), { status, data: { Code: 2024, Error: 'api error' } });
    };

    interface FakeServerOptions {
        unsubscribeFails?: string[];
        ruleRefused?: string[];
        ruleFails?: string[];
        archiveFails?: string[];
    }

    interface Request {
        url: string;
        method: string;
        silence?: boolean;
        data?: { ApplyTo: string; DestinationFolder: string; MarkAsRead: boolean };
    }

    const getSubscriptionID = (url: string) => {
        return url.split('/')[3];
    };

    const createFakeApi = ({
        unsubscribeFails = [],
        ruleRefused = [],
        ruleFails = [],
        archiveFails = [],
    }: FakeServerOptions = {}) => {
        return vi.fn(async ({ url, data }: Request) => {
            const subscriptionID = getSubscriptionID(url);
            if (url.endsWith('/unsubscribe')) {
                if (unsubscribeFails.includes(subscriptionID)) {
                    throw apiError(422);
                }
                return {};
            }
            if (data?.ApplyTo === 'All') {
                if (ruleRefused.includes(subscriptionID)) {
                    throw apiError(422);
                }
                if (ruleFails.includes(subscriptionID)) {
                    throw apiError(500);
                }
                return {};
            }
            if (data?.ApplyTo === 'Existing') {
                if (archiveFails.includes(subscriptionID)) {
                    throw apiError(500);
                }
                return {};
            }
            throw new Error(`Unexpected request to ${url}`);
        });
    };

    const getRequests = (api: Mock) => {
        return (api.mock.calls as [Request][]).map(([request]) => request);
    };

    const getUnsubscribedIDs = (api: Mock) => {
        return getRequests(api)
            .filter(({ url }) => url.endsWith('/unsubscribe'))
            .map(({ url }) => getSubscriptionID(url));
    };

    const getFilterRequests = (api: Mock) => {
        return getRequests(api)
            .filter(({ url }) => url.endsWith('/filter'))
            .map(({ url, data }) => ({ subscriptionID: getSubscriptionID(url), applyTo: data?.ApplyTo }));
    };

    const run = (
        api: Mock,
        subscriptions: NewsletterSubscription[],
        { archive = true, applyToFuture = false, progress = new Map() as BYOEInboxCleanupProgress } = {}
    ) => {
        return cleanUpBYOEInboxSenders({ api, subscriptions, archive, applyToFuture, progress });
    };

    it('unsubscribes every sender silently with one-click unsubscribe', async () => {
        const api = createFakeApi();
        const subscriptions = generateSubscriptionList(3);

        const allDone = await run(api, subscriptions, { archive: false });

        expect(allDone).toBe(true);
        expect(getRequests(api)).toEqual(
            subscriptions.map(({ ID }) => ({
                url: `mail/v4/newsletter-subscriptions/${ID}/unsubscribe`,
                method: 'POST',
                silence: true,
            }))
        );
    });

    it('archives existing mail with a rule for paid users', async () => {
        const api = createFakeApi();
        const [markedAsRead, leftUnread] = generateSubscriptionList(2);
        markedAsRead.MarkAsRead = true;

        const allDone = await run(api, [markedAsRead, leftUnread], { applyToFuture: true });

        expect(allDone).toBe(true);
        const filterRequests = getRequests(api).filter(({ url }) => url.endsWith('/filter'));
        expect(filterRequests).toEqual([
            {
                url: `mail/v4/newsletter-subscriptions/${markedAsRead.ID}/filter`,
                method: 'POST',
                silence: true,
                data: { ApplyTo: 'All', DestinationFolder: MAILBOX_LABEL_IDS.ARCHIVE, MarkAsRead: true },
            },
            {
                url: `mail/v4/newsletter-subscriptions/${leftUnread.ID}/filter`,
                method: 'POST',
                silence: true,
                data: { ApplyTo: 'All', DestinationFolder: MAILBOX_LABEL_IDS.ARCHIVE, MarkAsRead: false },
            },
        ]);
    });

    it('archives existing mail without a rule for free users', async () => {
        const api = createFakeApi();
        const subscriptions = generateSubscriptionList(2);

        const allDone = await run(api, subscriptions, { applyToFuture: false });

        expect(allDone).toBe(true);
        expect(getFilterRequests(api)).toEqual([
            { subscriptionID: 'active-1', applyTo: 'Existing' },
            { subscriptionID: 'active-2', applyTo: 'Existing' },
        ]);
    });

    it.each([
        { name: 'free', applyToFuture: false },
        { name: 'paid', applyToFuture: true },
    ])('neither archives nor creates a rule when archiving is off, for $name users', async ({ applyToFuture }) => {
        const api = createFakeApi();
        const subscriptions = generateSubscriptionList(2);

        const allDone = await run(api, subscriptions, { archive: false, applyToFuture });

        expect(allDone).toBe(true);
        expect(getUnsubscribedIDs(api)).toEqual(['active-1', 'active-2']);
        expect(getFilterRequests(api)).toEqual([]);
    });

    it("archives without a rule when a paid user's rule is refused", async () => {
        const api = createFakeApi({ ruleRefused: ['active-1'] });
        const subscriptions = generateSubscriptionList(2);

        const allDone = await run(api, subscriptions, { applyToFuture: true });

        expect(allDone).toBe(true);
        expect(getFilterRequests(api)).toEqual([
            { subscriptionID: 'active-1', applyTo: 'All' },
            { subscriptionID: 'active-2', applyTo: 'All' },
            { subscriptionID: 'active-1', applyTo: 'Existing' },
        ]);
        const refusedSenderRequests = getRequests(api).filter(({ url }) => url.endsWith('active-1/filter'));
        expect(refusedSenderRequests.every(({ silence }) => silence === true)).toBe(true);
    });

    it('counts a sender as failed, without archiving it some other way, when the rule request fails for another reason', async () => {
        const api = createFakeApi({ ruleFails: ['active-1'] });
        const subscriptions = generateSubscriptionList(1);

        const allDone = await run(api, subscriptions, { applyToFuture: true });

        expect(allDone).toBe(false);
        expect(getFilterRequests(api)).toEqual([{ subscriptionID: 'active-1', applyTo: 'All' }]);
    });

    it('counts a sender as failed when the rule is refused and archiving without one fails too', async () => {
        const api = createFakeApi({ ruleRefused: ['active-1'], archiveFails: ['active-1'] });
        const subscriptions = generateSubscriptionList(1);

        const allDone = await run(api, subscriptions, { applyToFuture: true });

        expect(allDone).toBe(false);
        expect(getFilterRequests(api)).toEqual([
            { subscriptionID: 'active-1', applyTo: 'All' },
            { subscriptionID: 'active-1', applyTo: 'Existing' },
        ]);
    });

    it('keeps going with the other senders when one fails, without archiving or creating a rule for the failed one', async () => {
        const api = createFakeApi({ unsubscribeFails: ['active-1'] });
        const subscriptions = generateSubscriptionList(3);

        const allDone = await run(api, subscriptions, { applyToFuture: true });

        expect(allDone).toBe(false);
        expect(getUnsubscribedIDs(api)).toEqual(['active-1', 'active-2', 'active-3']);
        expect(getFilterRequests(api)).toEqual([
            { subscriptionID: 'active-2', applyTo: 'All' },
            { subscriptionID: 'active-3', applyTo: 'All' },
        ]);
    });

    it('skips senders already done on a retry', async () => {
        const progress: BYOEInboxCleanupProgress = new Map();
        const subscriptions = generateSubscriptionList(3);
        await run(createFakeApi({ unsubscribeFails: ['active-2'] }), subscriptions, { progress });
        const retryApi = createFakeApi();

        const allDone = await run(retryApi, subscriptions, { progress });

        expect(allDone).toBe(true);
        expect(getUnsubscribedIDs(retryApi)).toEqual(['active-2']);
        expect(getFilterRequests(retryApi)).toEqual([{ subscriptionID: 'active-2', applyTo: 'Existing' }]);
    });

    it('only redoes the archiving for a sender whose unsubscribe already worked', async () => {
        const progress: BYOEInboxCleanupProgress = new Map();
        const subscriptions = generateSubscriptionList(2);
        await run(createFakeApi({ archiveFails: ['active-1'] }), subscriptions, { progress });
        const retryApi = createFakeApi();

        const allDone = await run(retryApi, subscriptions, { progress });

        expect(allDone).toBe(true);
        expect(getUnsubscribedIDs(retryApi)).toEqual([]);
        expect(getFilterRequests(retryApi)).toEqual([{ subscriptionID: 'active-1', applyTo: 'Existing' }]);
    });

    it('only archives an already-unsubscribed sender when archiving is turned on for the retry', async () => {
        const progress: BYOEInboxCleanupProgress = new Map();
        const subscriptions = generateSubscriptionList(2);
        await run(createFakeApi({ unsubscribeFails: ['active-2'] }), subscriptions, { archive: false, progress });
        const retryApi = createFakeApi();

        const allDone = await run(retryApi, subscriptions, { archive: true, progress });

        expect(allDone).toBe(true);
        expect(getUnsubscribedIDs(retryApi)).toEqual(['active-2']);
        expect(getFilterRequests(retryApi)).toEqual([
            { subscriptionID: 'active-1', applyTo: 'Existing' },
            { subscriptionID: 'active-2', applyTo: 'Existing' },
        ]);
    });
});

describe('getFinishedBYOEImportOutcome', () => {
    const CONNECTION_TIME_BYOE = 1_700_000_000;

    const connectionFeature = { Value: true, UpdateTime: CONNECTION_TIME_BYOE } as Feature<boolean>;

    const byoeAddress = { ID: 'byoe', Email: 'test@gmail.com', Flags: ADDRESS_FLAGS.BYOE } as Address;
    const protonAddress = { ID: 'proton', Email: 'me@proton.me' } as Address;
    const externalAddress = { ID: 'external', Email: 'external@gmail.com' } as Address;
    const addresses = [protonAddress, byoeAddress, externalAddress];

    interface EntryOptions {
        id?: string;
        account?: string;
        startDate?: number;
        endDate?: number;
        product?: ImportType;
        state?: ApiImporterState;
    }

    const buildReport = ({
        id = 'report-1',
        account = byoeAddress.Email,
        startDate = CONNECTION_TIME_BYOE - 600,
        endDate = CONNECTION_TIME_BYOE + 600,
    }: EntryOptions = {}): Report => ({
        ID: id,
        state: ApiReportState.SENT,
        account,
        startDate,
        endDate,
        size: 0,
        provider: ApiImportProvider.GOOGLE,
    });

    const buildSummary = (reportID: string, product: ImportType, state: ApiImporterState): ReportSummary => ({
        localID: `${reportID}-${product}`,
        reportID,
        product,
        state,
        size: 0,
        rollbackState: undefined,
    });

    const buildEntry = (options: EntryOptions = {}) => {
        const report = buildReport(options);
        const summary = buildSummary(
            report.ID,
            options.product ?? ImportType.MAIL,
            options.state ?? ApiImporterState.DONE
        );
        return { summary, report };
    };

    it.each([
        { name: 'done', state: ApiImporterState.DONE, outcome: 'done' },
        { name: 'failed', state: ApiImporterState.FAILED, outcome: 'failed' },
        { name: 'cancelled', state: ApiImporterState.CANCELED, outcome: 'failed' },
    ])(
        'acts on a finished mail import into a BYOE address that ended after the connection ($name gives $outcome)',
        ({ state, outcome }) => {
            const entry = buildEntry({ state });

            expect(getFinishedBYOEImportOutcome({ entries: [entry], addresses, feature: connectionFeature })).toBe(
                outcome
            );
        }
    );

    it('matches an import that started before the connection but finished after it', () => {
        const entry = buildEntry({ startDate: CONNECTION_TIME_BYOE - 3600, endDate: CONNECTION_TIME_BYOE + 3600 });

        expect(getFinishedBYOEImportOutcome({ entries: [entry], addresses, feature: connectionFeature })).toBe('done');
    });

    it('matches an import ending in the same second as the connection', () => {
        const entry = buildEntry({ endDate: CONNECTION_TIME_BYOE });

        expect(getFinishedBYOEImportOutcome({ entries: [entry], addresses, feature: connectionFeature })).toBe('done');
    });

    it('matches the address whatever the letter case', () => {
        const entry = buildEntry({ account: 'Test@Gmail.COM' });
        const upperCaseAddress = { ...byoeAddress, Email: 'TEST@gmail.com' };

        expect(getFinishedBYOEImportOutcome({ entries: [entry], addresses, feature: connectionFeature })).toBe('done');
        expect(
            getFinishedBYOEImportOutcome({
                entries: [buildEntry()],
                addresses: [upperCaseAddress],
                feature: connectionFeature,
            })
        ).toBeDefined();
    });

    it('picks the most recently finished match, whatever order the entries come in', () => {
        const older = buildEntry({ id: 'older', endDate: CONNECTION_TIME_BYOE + 100, state: ApiImporterState.DONE });
        const newer = buildEntry({ id: 'newer', endDate: CONNECTION_TIME_BYOE + 500, state: ApiImporterState.FAILED });

        expect(getFinishedBYOEImportOutcome({ entries: [older, newer], addresses, feature: connectionFeature })).toBe(
            'failed'
        );
        expect(getFinishedBYOEImportOutcome({ entries: [newer, older], addresses, feature: connectionFeature })).toBe(
            'failed'
        );
    });

    it("ignores an import for an address that isn't BYOE", () => {
        const otherGmailAccount = buildEntry({ id: 'other', account: 'someone-else@gmail.com' });
        const nonBYOEAddress = buildEntry({ id: 'external', account: externalAddress.Email });
        const protonAccount = buildEntry({ id: 'proton', account: protonAddress.Email });

        expect(
            getFinishedBYOEImportOutcome({
                entries: [otherGmailAccount, nonBYOEAddress, protonAccount],
                addresses,
                feature: connectionFeature,
            })
        ).toBeUndefined();
        expect(
            getFinishedBYOEImportOutcome({ entries: [buildEntry()], addresses, feature: connectionFeature })
        ).toBeDefined();
    });

    it('ignores an import that ended before the connection', () => {
        const lastYear = buildEntry({
            startDate: CONNECTION_TIME_BYOE - 31_536_000,
            endDate: CONNECTION_TIME_BYOE - 31_000_000,
        });
        const justBefore = buildEntry({ id: 'just-before', endDate: CONNECTION_TIME_BYOE - 1 });

        expect(
            getFinishedBYOEImportOutcome({ entries: [lastYear, justBefore], addresses, feature: connectionFeature })
        ).toBeUndefined();
        expect(
            getFinishedBYOEImportOutcome({
                entries: [buildEntry({ endDate: CONNECTION_TIME_BYOE })],
                addresses,
                feature: connectionFeature,
            })
        ).toBeDefined();
    });

    it.each([
        { name: 'the value is off', feature: { Value: false, UpdateTime: CONNECTION_TIME_BYOE } as Feature<boolean> },
        { name: 'the value has no update time', feature: { Value: true } as Feature<boolean> },
        { name: 'the person has no value of their own', feature: {} as Feature<boolean> },
        { name: 'there is no feature', feature: undefined },
    ])('ignores everything when $name', ({ feature }) => {
        const entry = buildEntry();

        expect(getFinishedBYOEImportOutcome({ entries: [entry], addresses, feature })).toBeUndefined();
        expect(getFinishedBYOEImportOutcome({ entries: [entry], addresses, feature: connectionFeature })).toBeDefined();
    });

    it("counts the person's own import of the connected account like the BYOE one", () => {
        const report = buildReport({ id: 'one-off', endDate: CONNECTION_TIME_BYOE + 900 });
        const entries = [
            { summary: buildSummary(report.ID, ImportType.CONTACTS, ApiImporterState.DONE), report },
            { summary: buildSummary(report.ID, ImportType.MAIL, ApiImporterState.DONE), report },
            { summary: buildSummary(report.ID, ImportType.CALENDAR, ApiImporterState.FAILED), report },
        ];

        expect(getFinishedBYOEImportOutcome({ entries, addresses, feature: connectionFeature })).toBe('done');
    });

    it.each([
        { name: 'queued', state: ApiImporterState.QUEUED },
        { name: 'running', state: ApiImporterState.RUNNING },
        { name: 'paused', state: ApiImporterState.PAUSED },
        { name: 'delayed', state: ApiImporterState.DELAYED },
    ])('has no outcome while the mail part is $name', ({ state }) => {
        expect(
            getFinishedBYOEImportOutcome({ entries: [buildEntry({ state })], addresses, feature: connectionFeature })
        ).toBeUndefined();
        expect(
            getFinishedBYOEImportOutcome({
                entries: [buildEntry({ state: ApiImporterState.DONE })],
                addresses,
                feature: connectionFeature,
            })
        ).toBeDefined();
    });

    it('has no outcome when the report has no mail part yet', () => {
        expect(getFinishedBYOEImportOutcome({ entries: [], addresses, feature: connectionFeature })).toBeUndefined();
        expect(
            getFinishedBYOEImportOutcome({ entries: [buildEntry()], addresses, feature: connectionFeature })
        ).toBeDefined();
    });

    it('ignores non-mail summaries', () => {
        const report = buildReport();
        const entries = [
            { summary: buildSummary(report.ID, ImportType.CONTACTS, ApiImporterState.DONE), report },
            { summary: buildSummary(report.ID, ImportType.CALENDAR, ApiImporterState.FAILED), report },
            { summary: buildSummary(report.ID, ImportType.DRIVE, ApiImporterState.DONE), report },
        ];

        expect(getFinishedBYOEImportOutcome({ entries, addresses, feature: connectionFeature })).toBeUndefined();
        expect(
            getFinishedBYOEImportOutcome({
                entries: [
                    ...entries,
                    { summary: buildSummary(report.ID, ImportType.MAIL, ApiImporterState.DONE), report },
                ],
                addresses,
                feature: connectionFeature,
            })
        ).toBe('done');
    });

    it('ignores a still-running import whose end time is recent', () => {
        const running = buildEntry({
            id: 'running',
            endDate: CONNECTION_TIME_BYOE + 5_000,
            state: ApiImporterState.RUNNING,
        });
        const finished = buildEntry({
            id: 'finished',
            endDate: CONNECTION_TIME_BYOE + 100,
            state: ApiImporterState.DONE,
        });

        expect(
            getFinishedBYOEImportOutcome({ entries: [running], addresses, feature: connectionFeature })
        ).toBeUndefined();
        expect(
            getFinishedBYOEImportOutcome({ entries: [running, finished], addresses, feature: connectionFeature })
        ).toBe('done');
    });
});

describe('fetchIsBYOEFeatureDue', () => {
    const mockDispatch = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(fetchFeatures).mockImplementation(() => ({ type: 'fetchFeatures' }) as any);
    });

    it.each([FeatureCode.BYOEInboxCleanupModal, FeatureCode.BYOEInboxCleanupSpotlight] as const)(
        'reads %s fresh from the server, skipping the cache',
        async (featureCode) => {
            mockDispatch.mockResolvedValue({ [featureCode]: { Value: true } });

            await expect(fetchIsBYOEFeatureDue(mockDispatch, featureCode)).resolves.toBe(true);
            expect(fetchFeatures).toHaveBeenCalledWith([featureCode], { cache: CacheType.None });
            expect(mockDispatch).toHaveBeenCalledWith({ type: 'fetchFeatures' });
        }
    );

    it.each([false, undefined, 'true'])('is not due when the value is %s', async (Value) => {
        mockDispatch.mockResolvedValue({ [FeatureCode.BYOEInboxCleanupSpotlight]: { Value } });

        await expect(fetchIsBYOEFeatureDue(mockDispatch, FeatureCode.BYOEInboxCleanupSpotlight)).resolves.toBe(false);
    });

    // Not due would make the hook leave it alone for this mount, so a failure has to reach it as one
    it('rejects when the read fails', async () => {
        mockDispatch.mockRejectedValue(new Error('offline'));

        await expect(fetchIsBYOEFeatureDue(mockDispatch, FeatureCode.BYOEInboxCleanupModal)).rejects.toThrow('offline');
    });
});

describe('fetchSendersIfStillDue', () => {
    const senders = generateSubscriptionList(2);
    const mockDispatch = vi.fn();
    const mockApi = vi.fn();

    const fetchSenders = () => {
        return fetchSendersIfStillDue(mockDispatch, mockApi, FeatureCode.BYOEInboxCleanupSpotlight);
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockApi.mockReset();
        vi.mocked(fetchFeatures).mockImplementation(() => ({ type: 'fetchFeatures' }) as any);
        mockDispatch.mockResolvedValue({ [FeatureCode.BYOEInboxCleanupSpotlight]: { Value: true } });
    });

    it('reads the code it is given fresh, then loads and returns the senders', async () => {
        mockSubscriptionsResponse(mockApi, senders);

        await expect(fetchSenders()).resolves.toEqual(senders);
        expect(fetchFeatures).toHaveBeenCalledWith([FeatureCode.BYOEInboxCleanupSpotlight], {
            cache: CacheType.None,
        });
        expect(mockDispatch.mock.invocationCallOrder[0]).toBeLessThan(mockApi.mock.invocationCallOrder[0]);
    });

    it("returns undefined and loads no senders when the code isn't due any more", async () => {
        mockDispatch.mockResolvedValue({ [FeatureCode.BYOEInboxCleanupSpotlight]: { Value: false } });

        await expect(fetchSenders()).resolves.toBeUndefined();
        expect(mockApi).not.toHaveBeenCalled();
    });

    it('returns an empty list when there are no senders', async () => {
        mockSubscriptionsResponse(mockApi, []);

        await expect(fetchSenders()).resolves.toEqual([]);
    });

    // An empty list would make the hook clear the code, so a failure has to reach it as one
    it.each([
        {
            request: 'the fresh read',
            fail: () => {
                mockDispatch.mockRejectedValue(new Error('offline'));
            },
        },
        {
            request: 'loading the senders',
            fail: () => {
                mockApi.mockRejectedValue(new Error('offline'));
            },
        },
    ])('rejects when $request fails', async ({ fail }) => {
        fail();

        await expect(fetchSenders()).rejects.toThrow('offline');
    });
});
