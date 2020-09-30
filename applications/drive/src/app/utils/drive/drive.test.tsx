import { initDriveAsync } from './drive';

describe('drive utils', () => {
    describe('initDrive', () => {
        it('should create a volume and render onboarding modal when there are no shares', async () => {
            expect.assertions(1);

            const createVolumeMock = jest.fn().mockResolvedValue({
                Share: {
                    ID: 'share-1',
                    LinkID: 'link-1',
                },
            });
            const getShareMetaMock = jest.fn((shareId: string) =>
                Promise.resolve(
                    ({
                        'share-1': 'test-share-mock',
                    } as { [id: string]: any })[shareId]
                )
            );
            const getUserSharesMock = jest.fn().mockResolvedValue([]);

            const result = await initDriveAsync(createVolumeMock, getUserSharesMock, getShareMetaMock);

            expect(result).toBe('test-share-mock');
        });

        it('should return default share and initialize other shares in cache', async () => {
            expect.assertions(1);

            const createVolumeMock = jest.fn();
            const getUserSharesMock = jest.fn().mockResolvedValue([['share-1', 'share-2'], 'share-2']);
            const getShareMetaMock = jest.fn((shareId: string) =>
                Promise.resolve(
                    ({
                        'share-1': 'test-share-mock-1',
                        'share-2': 'test-share-mock-2',
                    } as { [id: string]: any })[shareId]
                )
            );

            const result = await initDriveAsync(createVolumeMock, getUserSharesMock, getShareMetaMock);

            expect(result).toBe('test-share-mock-2');
        });
    });
});
