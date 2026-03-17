import { act, renderHook } from '@testing-library/react';

import { NodeType, getDrive, getDriveForPhotos, useDrive } from '@proton/drive/index';
import { BusDriverEventName, getBusDriver } from '@proton/drive/internal/BusDriver';

import { handleSdkError } from '../../utils/errorHandling/handleSdkError';
import { useTrashStore } from './useTrash.store';
import { useTrashActions } from './useTrashActions';
import { useTrashNotifications } from './useTrashNotifications';

jest.mock('@proton/drive/index', () => ({
    ...jest.requireActual('@proton/drive/index'),
    useDrive: jest.fn(),
    getDrive: jest.fn(),
    getDriveForPhotos: jest.fn(),
}));

const mockGetDrive = jest.mocked(getDrive);
const mockGetDriveForPhotos = jest.mocked(getDriveForPhotos);

jest.mock('../../utils/errorHandling/handleSdkError');

jest.mock('./useTrash.store', () => {
    const hook = jest.fn() as jest.Mock & { getState: jest.Mock };
    hook.getState = jest.fn();
    return { useTrashStore: hook };
});

jest.mock('./useTrashNotifications', () => ({
    useTrashNotifications: jest.fn(),
}));

jest.mock('@proton/drive/internal/BusDriver', () => ({
    ...jest.requireActual('@proton/drive/internal/BusDriver'),
    getBusDriver: jest.fn(),
}));

jest.mock('../../modals/DetailsModal', () => ({
    useDetailsModal: () => ({ detailsModal: null, showDetailsModal: jest.fn() }),
}));

jest.mock('../../modals/FilesDetailsModal', () => ({
    useFilesDetailsModal: () => ({ filesDetailsModal: null, showFilesDetailsModal: jest.fn() }),
}));

jest.mock('../../modals/preview', () => ({
    useDrivePreviewModal: () => ({ previewModal: null, showPreviewModal: jest.fn() }),
}));

const mockUseDrive = jest.mocked(useDrive);
const mockUseTrashStore = useTrashStore as jest.MockedFunction<typeof useTrashStore> & { getState: jest.Mock };
const mockUseTrashNotifications = jest.mocked(useTrashNotifications);
const mockGetActionEventManager = jest.mocked(getBusDriver);

describe('useTrashActions', () => {
    describe('handleEmptyTrash', () => {
        const emptyTrashDrive = jest.fn();
        const emptyTrashPhotos = jest.fn();
        const handleError = jest.mocked(handleSdkError);
        const createEmptyTrashNotificationSuccess = jest.fn();
        const emit = jest.fn();

        const allTrashNodes = new Map([
            ['drive-1', { uid: 'drive-1', name: 'File 1', type: NodeType.File }],
            ['drive-2', { uid: 'drive-2', name: 'Folder 1', type: NodeType.Folder }],
            ['photo-1', { uid: 'photo-1', name: 'Photo 1', type: NodeType.Photo }],
            ['photo-2', { uid: 'photo-2', name: 'Photo 2', type: NodeType.Photo }],
        ]);

        // Capture the callback passed to createEmptyTrashConfirmModal so we can invoke it
        let capturedOnSubmit: (() => Promise<unknown>) | undefined;
        const createEmptyTrashConfirmModal = jest.fn((onSubmit: () => Promise<unknown>) => {
            capturedOnSubmit = onSubmit;
        });

        const mockDriveClient = { type: 'drive' } as any;
        const mockPhotosClient = { type: 'photos' } as any;

        beforeEach(() => {
            jest.clearAllMocks();
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
