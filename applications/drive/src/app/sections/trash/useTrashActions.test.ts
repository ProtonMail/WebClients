import { act, renderHook } from '@testing-library/react';

import { NodeType, useDrive } from '@proton/drive/index';
import { BusDriverEventName, getBusDriver } from '@proton/drive/internal/BusDriver';

import { useSdkErrorHandler } from '../../utils/errorHandling/useSdkErrorHandler';
import { useTrashStore } from './useTrash.store';
import { useTrashActions } from './useTrashActions';
import { useTrashNotifications } from './useTrashNotifications';
import { useTrashPhotosStore } from './useTrashPhotos.store';

jest.mock('@proton/drive/index', () => ({
    ...jest.requireActual('@proton/drive/index'),
    useDrive: jest.fn(),
}));

jest.mock('../../utils/errorHandling/useSdkErrorHandler', () => ({
    useSdkErrorHandler: jest.fn(),
}));

jest.mock('./useTrash.store', () => {
    const hook = jest.fn() as jest.Mock & { getState: jest.Mock };
    hook.getState = jest.fn();
    return { useTrashStore: hook };
});

jest.mock('./useTrashPhotos.store', () => {
    const hook = jest.fn() as jest.Mock & { getState: jest.Mock };
    hook.getState = jest.fn();
    return { useTrashPhotosStore: hook };
});

jest.mock('./useTrashNotifications', () => ({
    useTrashNotifications: jest.fn(),
}));

jest.mock('@proton/drive/internal/BusDriver', () => ({
    ...jest.requireActual('@proton/drive/internal/BusDriver'),
    getBusDriver: jest.fn(),
}));

const mockUseDrive = jest.mocked(useDrive);
const mockUseSdkErrorHandler = jest.mocked(useSdkErrorHandler);
const mockUseTrashStore = useTrashStore as jest.MockedFunction<typeof useTrashStore> & { getState: jest.Mock };
const mockUseTrashPhotosStore = useTrashPhotosStore as jest.MockedFunction<typeof useTrashPhotosStore> & {
    getState: jest.Mock;
};
const mockUseTrashNotifications = jest.mocked(useTrashNotifications);
const mockGetActionEventManager = jest.mocked(getBusDriver);

describe('useTrashActions', () => {
    describe('emptyTrash', () => {
        const emptyTrashDrive = jest.fn();
        const emptyTrashPhotos = jest.fn();
        const handleError = jest.fn();
        const createEmptyTrashNotificationSuccess = jest.fn();
        const emit = jest.fn();

        const driveTrashNodes = {
            'drive-1': { uid: 'drive-1', name: 'File 1', type: NodeType.File },
            'drive-2': { uid: 'drive-2', name: 'Folder 1', type: NodeType.Folder },
        };

        const photoTrashNodes = {
            'photo-1': { uid: 'photo-1', name: 'Photo 1', type: NodeType.Photo },
            'photo-2': { uid: 'photo-2', name: 'Photo 2', type: NodeType.Photo },
        };

        beforeEach(() => {
            jest.clearAllMocks();

            mockUseTrashStore.mockImplementation((selector: (state: any) => any) =>
                selector({ trashNodes: driveTrashNodes })
            );

            mockUseTrashPhotosStore.mockImplementation((selector: (state: any) => any) =>
                selector({ trashNodes: photoTrashNodes })
            );

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

            mockUseSdkErrorHandler.mockReturnValue({ handleError } as any);

            mockUseTrashNotifications.mockReturnValue({
                createEmptyTrashNotificationSuccess,
            } as any);

            mockGetActionEventManager.mockReturnValue({
                emit,
            } as any);
        });

        it('empties both drive and photo trash successfully', async () => {
            emptyTrashDrive.mockResolvedValue(undefined);
            emptyTrashPhotos.mockResolvedValue(undefined);

            const { result } = renderHook(() => useTrashActions());

            await act(async () => {
                await result.current.emptyTrash();
            });

            expect(emptyTrashDrive).toHaveBeenCalledTimes(1);
            expect(emptyTrashPhotos).toHaveBeenCalledTimes(1);
            expect(emit).toHaveBeenCalledWith({
                type: BusDriverEventName.DELETED_NODES,
                uids: ['drive-1', 'drive-2', 'photo-1', 'photo-2'],
            });
            expect(createEmptyTrashNotificationSuccess).toHaveBeenCalledTimes(1);
            expect(handleError).not.toHaveBeenCalled();
        });

        it('handles errors', async () => {
            const error = new Error('Drive empty trash failed');
            emptyTrashDrive.mockRejectedValue(error);
            emptyTrashPhotos.mockResolvedValue(undefined);

            const { result } = renderHook(() => useTrashActions());

            await act(async () => {
                await result.current.emptyTrash();
            });

            expect(handleError).toHaveBeenCalledWith(error, {
                fallbackMessage: 'Trash failed to be emptied',
            });
            expect(createEmptyTrashNotificationSuccess).not.toHaveBeenCalled();
            expect(emit).not.toHaveBeenCalled();
        });
    });
});
