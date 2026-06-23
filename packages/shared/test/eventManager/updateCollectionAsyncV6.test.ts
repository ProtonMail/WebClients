import { ActionEventV6, type EventV6Response } from '@proton/shared/lib/api/events';

import { updateCollectionAsyncV6 } from '../../lib/eventManager/updateCollectionAsyncV6';

describe('updateCollectionAsyncV6', () => {
    // Test data
    const mockItem1 = { ID: '1', Name: 'Item 1' };

    describe('updateCollectionAsyncV6', () => {
        it('should call update when result type is update', async () => {
            const getMock = vi.fn().mockReturnValue(Promise.resolve(mockItem1));
            const updateMock = vi.fn();
            const refetchMock = vi.fn();

            const events = [{ ID: '1', Action: ActionEventV6.Update }] as EventV6Response;

            await updateCollectionAsyncV6({
                get: getMock,
                events,
                update: updateMock,
                refetch: refetchMock,
            });

            expect(updateMock).toHaveBeenCalledWith({
                delete: [],
                upsert: [mockItem1],
            });
            expect(refetchMock).not.toHaveBeenCalled();
        });

        it('should call refetch when result type is refetch', async () => {
            const getMock = vi.fn();
            const updateMock = vi.fn();
            const refetchMock = vi.fn().mockReturnValue(Promise.resolve());

            // Create many events to trigger refetch
            const events = Array(10)
                .fill(0)
                .map((_, i) => ({
                    ID: `${i}`,
                    Action: ActionEventV6.Update,
                })) as EventV6Response;

            await updateCollectionAsyncV6({
                get: getMock,
                events,
                update: updateMock,
                refetch: refetchMock,
            });

            expect(updateMock).not.toHaveBeenCalled();
            expect(refetchMock).toHaveBeenCalledTimes(1);
        });

        it('should do nothing when result type is ignore', async () => {
            const getMock = vi.fn();
            const updateMock = vi.fn();
            const refetchMock = vi.fn();

            await updateCollectionAsyncV6({
                get: getMock,
                events: [],
                update: updateMock,
                refetch: refetchMock,
            });

            expect(updateMock).not.toHaveBeenCalled();
            expect(refetchMock).not.toHaveBeenCalled();
        });
    });
});
