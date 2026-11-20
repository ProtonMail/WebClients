import { act, renderHook } from '@testing-library/react';
import type { Mock, MockedFunction } from 'vitest';

import { handleSdkError } from '@proton/drive/legacy/errorHandling';
import { BusDriverEventName, getBusDriver } from '@proton/drive/modules/busDriver';
import { NodeType, getDrive, getDriveForPhotos, useDrive } from '@proton/drive/sdk';

import { useTrashStore } from './useTrash.store';
import { useTrashActions } from './useTrashActions';
import { useTrashNotifications } from './useTrashNotifications';

vi.mock('@proton/drive/sdk', async () => ({
    ...(await vi.importActual('@proton/drive/sdk')),
    useDrive: vi.fn(),
    getDrive: vi.fn(),
    getDriveForPhotos: vi.fn(),
}));

const mockGetDrive = vi.mocked(getDrive);
const mockGetDriveForPhotos = vi.mocked(getDriveForPhotos);

vi.mock('@proton/drive/legacy/errorHandling');

vi.mock('./useTrash.store', () => {
    const hook = vi.fn() as Mock & { getState: Mock };
    hook.getState = vi.fn();
    return { useTrashStore: hook };
});

vi.mock('./useTrashNotifications', () => ({
    useTrashNotifications: vi.fn(),
}));

vi.mock('@proton/drive/modules/busDriver', async () => ({
    ...(await vi.importActual('@proton/drive/modules/busDriver')),
    getBusDriver: vi.fn(),
}));

vi.mock('../../modals/DetailsModal', () => ({
    useDetailsModal: () => ({ detailsModal: null, showDetailsModal: vi.fn() }),
}));

vi.mock('../../modals/FilesDetailsModal', () => ({
    useFilesDetailsModal: () => ({ filesDetailsModal: null, showFilesDetailsModal: vi.fn() }),
}));

vi.mock('../../modals/preview', () => ({
    useDrivePreviewModal: () => ({ previewModal: null, showPreviewModal: vi.fn() }),
}));

const mockUseDrive = vi.mocked(useDrive);
const mockUseTrashStore = useTrashStore as MockedFunction<typeof useTrashStore> & { getState: Mock };
const mockUseTrashNotifications = vi.mocked(useTrashNotifications);
const mockGetActionEventManager = vi.mocked(getBusDriver);

describe('useTrashActions', () => {
    describe('handleEmptyTrash', () => {
        const emptyTrashDrive = vi.fn();
        const emptyTrashPhotos = vi.fn();
        const handleError = vi.mocked(handleSdkError);
        const createEmptyTrashNotificationSuccess = vi.fn();
        const emit = vi.fn();

        const allTrashNodes = new Map([
            ['drive-1', { uid: 'drive-1', name: 'File 1', type: NodeType.File }],
            ['drive-2', { uid: 'drive-2', name: 'Folder 1', type: NodeType.Folder }],
            ['photo-1', { uid: 'photo-1', name: 'Photo 1', type: NodeType.Photo }],
            ['photo-2', { uid: 'photo-2', name: 'Photo 2', type: NodeType.Photo }],
        ]);

        // Capture the callback passed to createEmptyTrashConfirmModal so we can invoke it
        let capturedOnSubmit: (() => Promise<unknown>) | undefined;
        const createEmptyTrashConfirmModal = vi.fn((onSubmit: () => Promise<unknown>) => {
            capturedOnSubmit = onSubmit;
        });

        const mockDriveClient = { type: 'drive' } as any;
        const mockPhotosClient = { type: 'photos' } as any;

        beforeEach(() => {
            vi.clearAllMocks();
            capturedOnSubmit = undefined;

            mockGetDrive.mockReturnValue(mockDriveClient);
            mockGetDriveForPhotos.mockReturnValue(mockPhotosClient);

            mockUseTrashStore.getState.mockReturnValue({
                items: allTrashNodes,
            });

            mockUseDrive.mockReturnValue({
                drive: {
                    emptyTrash: emptyTrashDrive,
                },
                internal: {
                    photos: {
                        emptyTrash: emptyTrashPhotos,
                    },
                },
            } as any);

            mockUseTrashNotifications.mockReturnValue({
                createEmptyTrashNotificationSuccess,
                createEmptyTrashConfirmModal,
            } as any);

            mockGetActionEventManager.mockReturnValue({
                emit,
            } as any);
        });

        it('empties both drive and photo trash successfully', async () => {
            emptyTrashDrive.mockResolvedValue(undefined);
            emptyTrashPhotos.mockResolvedValue(undefined);

            const { result } = renderHook(() => useTrashActions());

            act(() => {
                result.current.handleEmptyTrash();
            });

            expect(createEmptyTrashConfirmModal).toHaveBeenCalledTimes(1);

            // Simulate user confirming the modal
            await act(async () => {
                await capturedOnSubmit?.();
            });

            expect(emptyTrashDrive).toHaveBeenCalledTimes(1);
            expect(emptyTrashPhotos).toHaveBeenCalledTimes(1);
            expect(emit).toHaveBeenCalledWith(
                {
                    type: BusDriverEventName.DELETED_NODES,
                    uids: ['drive-1', 'drive-2'],
                },
                mockDriveClient
            );
            expect(emit).toHaveBeenCalledWith(
                {
                    type: BusDriverEventName.DELETED_NODES,
                    uids: ['photo-1', 'photo-2'],
                },
                mockPhotosClient
            );

            expect(emit).toHaveBeenCalledTimes(2);
            expect(createEmptyTrashNotificationSuccess).toHaveBeenCalledTimes(1);
            expect(handleError).not.toHaveBeenCalled();
        });

        it('handles errors', async () => {
            const error = new Error('Drive empty trash failed');
            emptyTrashDrive.mockRejectedValue(error);
            emptyTrashPhotos.mockResolvedValue(undefined);

            const { result } = renderHook(() => useTrashActions());

            act(() => {
                result.current.handleEmptyTrash();
            });

            // Simulate user confirming the modal
            await act(async () => {
                await capturedOnSubmit?.();
            });

            expect(handleError).toHaveBeenCalledWith(error, {
                fallbackMessage: 'Trash failed to be emptied',
            });
            expect(createEmptyTrashNotificationSuccess).not.toHaveBeenCalled();
            expect(emit).not.toHaveBeenCalled();
        });
    });
});
