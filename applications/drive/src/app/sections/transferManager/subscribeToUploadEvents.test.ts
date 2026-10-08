import { BusDriverEventName, getBusDriver } from '@proton/drive/modules/busDriver';
import { uploadManager } from '@proton/drive/modules/upload';

import { subscribeToUploadEvents } from './subscribeToUploadEvents';
import { useTransferManagerStore } from './transferManager.store';

jest.mock('@proton/drive/modules/busDriver', () => ({
    ...jest.requireActual('@proton/drive/modules/busDriver'),
    getBusDriver: jest.fn(),
}));
jest.mock('@proton/drive/modules/upload', () => ({
    uploadManager: { subscribeToEvents: jest.fn(), unsubscribeFromEvents: jest.fn() },
}));

describe('subscribeToUploadEvents', () => {
    it('should still emit created nodes when the uploaded node cannot be loaded', async () => {
        const emit = jest.fn();
        jest.mocked(getBusDriver).mockReturnValue({ emit } as any);
        subscribeToUploadEvents();
        const callback = jest.mocked(uploadManager.subscribeToEvents).mock.calls[0][1];
        const driveClient = { getNode: jest.fn().mockRejectedValue(new Error('Item not found')) };

        await callback(
            {
                type: 'file:complete',
                uploadId: 'upload1',
                nodeUid: 'node1',
                parentUid: 'parent1',
                isUpdatedNode: false,
                isForPhotos: true,
            },
            driveClient as any
        );

        expect(useTransferManagerStore.getState().getItem('upload1')).toBeUndefined();
        expect(emit).toHaveBeenCalledWith(
            { type: BusDriverEventName.CREATED_NODES, items: [{ uid: 'node1', parentUid: 'parent1' }] },
            driveClient
        );
    });
});
