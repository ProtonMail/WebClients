import { ApiImportProvider, ApiImporterState, ApiReportState } from '@proton/activation/src/api/api.interface';
import { ImportType } from '@proton/activation/src/interface';
import type { Report, ReportSummary } from '@proton/activation/src/logic/reports/reports.interface';
import type { Feature } from '@proton/features/interface';
import { ADDRESS_FLAGS } from '@proton/shared/lib/constants';
import type { Address } from '@proton/shared/lib/interfaces/Address';
import type { NewsletterSubscription } from '@proton/shared/lib/interfaces/NewsletterSubscription';

import { activeSubscription, generateSubscriptionList } from '../components/view/NewsletterSubscription/testData';
import {
    BYOE_INBOX_CLEANUP_SENDERS_QUERY,
    getBYOEInboxCleanupSenders,
    getFinishedBYOEImportOutcome,
} from './byoeInboxCleanup';

const withoutOneClick = (subscription: NewsletterSubscription): NewsletterSubscription => ({
    ...subscription,
    UnsubscribeMethods: { HttpClient: 'https://example.com/unsubscribe' },
});

const mockSubscriptionsResponse = (
    mockedApi: jest.Mock,
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
        const mockedApi = jest.fn();
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
        const mockedApi = jest.fn();
        const [first, second, third, fourth, fifth] = generateSubscriptionList(5);
        mockSubscriptionsResponse(mockedApi, [first, withoutOneClick(second), third, withoutOneClick(fourth), fifth]);

        const senders = await getBYOEInboxCleanupSenders(mockedApi);

        expect(senders.map(({ ID }) => ID)).toEqual([first.ID, third.ID, fifth.ID]);
    });

    it('keeps a sender that offers one-click alongside other ways to unsubscribe', async () => {
        const mockedApi = jest.fn();
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
        const mockedApi = jest.fn();
        const subscriptions = generateSubscriptionList(25);
        mockSubscriptionsResponse(mockedApi, subscriptions);

        const senders = await getBYOEInboxCleanupSenders(mockedApi);

        expect(senders).toHaveLength(10);
        expect(senders.map(({ ID }) => ID)).toEqual(subscriptions.slice(0, 10).map(({ ID }) => ID));
    });

    it('offers fewer when fewer qualify, without asking for another page', async () => {
        const mockedApi = jest.fn();
        const subscriptions = generateSubscriptionList(100).map((subscription, index) =>
            index < 3 ? subscription : withoutOneClick(subscription)
        );
        mockSubscriptionsResponse(mockedApi, subscriptions, 'PageSize=100&Anchor=next');

        const senders = await getBYOEInboxCleanupSenders(mockedApi);

        expect(senders.map(({ ID }) => ID)).toEqual(['active-1', 'active-2', 'active-3']);
        expect(mockedApi).toHaveBeenCalledTimes(1);
    });

    it('returns an empty list, not an error, when none of the subscriptions support one-click', async () => {
        const mockedApi = jest.fn();
        mockSubscriptionsResponse(mockedApi, generateSubscriptionList(100).map(withoutOneClick), 'PageSize=100');

        const senders = await getBYOEInboxCleanupSenders(mockedApi);

        expect(senders).toEqual([]);
        expect(mockedApi).toHaveBeenCalledTimes(1);
    });

    it('returns an empty list when the person has no subscriptions', async () => {
        const mockedApi = jest.fn();
        mockSubscriptionsResponse(mockedApi, []);

        const senders = await getBYOEInboxCleanupSenders(mockedApi);

        expect(mockedApi).toHaveBeenCalledTimes(1);
        expect(senders).toEqual([]);
    });

    it('rejects when loading the subscriptions fails', async () => {
        const mockedApi = jest.fn();
        mockedApi.mockRejectedValueOnce(new Error('Network error'));

        await expect(getBYOEInboxCleanupSenders(mockedApi)).rejects.toThrow('Network error');
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
