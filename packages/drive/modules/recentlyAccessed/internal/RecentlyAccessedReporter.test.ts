import { traceError } from '@proton/shared/lib/helpers/sentry';

import { RecentlyAccessedReporter } from './RecentlyAccessedReporter';

jest.mock('@proton/shared/lib/helpers/sentry', () => ({
    traceError: jest.fn(),
    addSentryBreadcrumb: jest.fn(),
}));

function makeClient() {
    return { reportRecentlyAccessed: jest.fn().mockResolvedValue(undefined) };
}

function setOnline(online: boolean) {
    Object.defineProperty(window.navigator, 'onLine', { value: online, configurable: true });
}

describe('RecentlyAccessedReporter', () => {
    let driveClient: ReturnType<typeof makeClient>;
    let photosClient: ReturnType<typeof makeClient>;
    let reporter: RecentlyAccessedReporter;

    beforeEach(() => {
        jest.clearAllMocks();
        driveClient = makeClient();
        photosClient = makeClient();
        setOnline(true);
        reporter = new RecentlyAccessedReporter({
            getDrive: () => driveClient,
            getDriveForPhotos: () => photosClient,
        });
    });

    it('does nothing before start()', async () => {
        reporter.report(driveClient, ['node-1']);
        await Promise.resolve();

        expect(driveClient.reportRecentlyAccessed).not.toHaveBeenCalled();
    });

    it('ignores an unrecognized client', async () => {
        reporter.start();
        reporter.report({}, ['node-1']);
        await Promise.resolve();

        expect(driveClient.reportRecentlyAccessed).not.toHaveBeenCalled();
        expect(photosClient.reportRecentlyAccessed).not.toHaveBeenCalled();
    });

    it('reports immediately when online, routing to the drive or photos client by identity', async () => {
        reporter.start();
        reporter.report(driveClient, ['drive-node']);
        reporter.report(photosClient, ['photos-node']);
        await Promise.resolve();
        await Promise.resolve();

        expect(driveClient.reportRecentlyAccessed).toHaveBeenCalledWith([
            expect.objectContaining({ nodeUid: 'drive-node' }),
        ]);
        expect(photosClient.reportRecentlyAccessed).toHaveBeenCalledWith([
            expect.objectContaining({ nodeUid: 'photos-node' }),
        ]);
    });

    it('accumulates nodes in memory while offline and sends them once back online', async () => {
        reporter.start();
        setOnline(false);
        reporter.report(driveClient, ['node-1']);
        reporter.report(driveClient, ['node-2']);
        await Promise.resolve();

        expect(driveClient.reportRecentlyAccessed).not.toHaveBeenCalled();

        setOnline(true);
        window.dispatchEvent(new Event('online'));
        await Promise.resolve();
        await Promise.resolve();

        expect(driveClient.reportRecentlyAccessed).toHaveBeenCalledTimes(1);
        const [items] = driveClient.reportRecentlyAccessed.mock.calls[0];
        expect(items).toHaveLength(2);
        expect(items).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ nodeUid: 'node-1' }),
                expect.objectContaining({ nodeUid: 'node-2' }),
            ])
        );
    });

    it('dedupes a node accumulated twice while offline, keeping the latest access time', async () => {
        reporter.start();
        setOnline(false);
        reporter.report(driveClient, ['node-1']);
        reporter.report(driveClient, ['node-1']);

        setOnline(true);
        window.dispatchEvent(new Event('online'));
        await Promise.resolve();
        await Promise.resolve();

        expect(driveClient.reportRecentlyAccessed).toHaveBeenCalledTimes(1);
        const [items] = driveClient.reportRecentlyAccessed.mock.calls[0];
        expect(items).toHaveLength(1);
    });

    it('drops nodes when a send fails instead of retrying them', async () => {
        reporter.start();
        const networkError = new Error('network error');
        driveClient.reportRecentlyAccessed.mockRejectedValueOnce(networkError);
        reporter.report(driveClient, ['node-1']);
        await Promise.resolve();
        await Promise.resolve();

        expect(traceError).toHaveBeenCalledWith(
            networkError,
            expect.objectContaining({ level: 'error', tags: { component: 'recently-accessed' } })
        );

        window.dispatchEvent(new Event('online'));
        await Promise.resolve();
        await Promise.resolve();

        expect(driveClient.reportRecentlyAccessed).toHaveBeenCalledTimes(1);
    });
});
