import { LatestEventIdProvider } from './latestEventIdProvider';
import { proxyDriveClientWithEventTracking } from './proxyDriveClientWithEventTracking';

const mockDriveClient = {
    subscribeToTreeEvents: jest.fn(),
    getMyFilesRootFolder: jest.fn(),
    otherMethod: jest.fn(),
} as any;

const mockDispose = jest.fn();
const mockSubscription = {
    dispose: mockDispose,
};

const mockEvent = {
    eventId: 'event-123',
    type: 'NodeCreated',
    nodeUid: 'node-456',
    parentNodeUid: 'parent-789',
};

describe('proxyDriveClientWithEventTracking', () => {
    let latestEventIdProvider: LatestEventIdProvider;
    let proxiedClient: any;

    beforeEach(() => {
        jest.clearAllMocks();
        latestEventIdProvider = new LatestEventIdProvider();
        mockDriveClient.subscribeToTreeEvents.mockResolvedValue(mockSubscription);
        proxiedClient = proxyDriveClientWithEventTracking(mockDriveClient, latestEventIdProvider);
    });

    describe('subscribeToTreeEvents', () => {
        it('should intercept subscribeToTreeEvents calls', async () => {
            const callback = jest.fn().mockResolvedValue(undefined);

            await proxiedClient.subscribeToTreeEvents('scope-123', callback);

            expect(mockDriveClient.subscribeToTreeEvents).toHaveBeenCalledWith('scope-123', expect.any(Function));
        });

        it('should save event ID when callback is executed', async () => {
            const callback = jest.fn().mockResolvedValue(undefined);

            await proxiedClient.subscribeToTreeEvents('scope-123', callback);

            const wrappedCallback = mockDriveClient.subscribeToTreeEvents.mock.calls[0][1];
            await wrappedCallback(mockEvent);

            expect(callback).toHaveBeenCalledWith(mockEvent);
            expect(latestEventIdProvider.getLatestEventId('scope-123')).toBe('event-123');
        });

        it('should save event ID even if callback throws', async () => {
            const callback = jest.fn().mockRejectedValue(new Error('Callback error'));

            await proxiedClient.subscribeToTreeEvents('scope-123', callback);

            const wrappedCallback = mockDriveClient.subscribeToTreeEvents.mock.calls[0][1];

            await expect(wrappedCallback(mockEvent)).rejects.toThrow('Callback error');
            expect(latestEventIdProvider.getLatestEventId('scope-123')).toBe('event-123');
        });

        it('should clean up event scope when dispose is called', async () => {
            const callback = jest.fn().mockResolvedValue(undefined);
            latestEventIdProvider.saveLatestEventId('scope-123', 'some-event-id');

            const result = await proxiedClient.subscribeToTreeEvents('scope-123', callback);
            result.dispose();

            expect(mockDispose).toHaveBeenCalled();
            expect(latestEventIdProvider.getLatestEventId('scope-123')).toBeNull();
        });
    });
});
