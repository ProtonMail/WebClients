import { act, renderHook } from '@testing-library/react';

import { type NodeEntity, useDrive } from '@proton/drive/index';
import { getNodeEntityFromMaybeNode } from '@proton/drive/modules/upload/utils/getNodeEntityFromMaybeNode';

import { useSdkErrorHandler } from '../../utils/errorHandling/useSdkErrorHandler';
import { useTrashStore } from './useTrash.store';
import { useTrashPhotosStore } from './useTrashPhotos.store';
import { useTrashPhototsNodes } from './useTrashPhototsNodes';

jest.mock('@proton/drive/index', () => ({
    useDrive: jest.fn(),
}));

jest.mock('../../utils/errorHandling/useSdkErrorHandler', () => ({
    useSdkErrorHandler: jest.fn(),
}));

jest.mock('@proton/drive/modules/upload/utils/getNodeEntityFromMaybeNode', () => ({
    getNodeEntityFromMaybeNode: jest.fn(),
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

const mockUseDrive = jest.mocked(useDrive);
const mockUseSdkErrorHandler = jest.mocked(useSdkErrorHandler);
const mockGetNodeEntityFromMaybeNode = jest.mocked(getNodeEntityFromMaybeNode);
const mockUseTrashStore = useTrashStore as jest.MockedFunction<typeof useTrashStore> & { getState: jest.Mock };
const mockUseTrashPhotosStore = useTrashPhotosStore as jest.MockedFunction<typeof useTrashPhotosStore> & {
    getState: jest.Mock;
};

const createNode = (uid: string, name: string): NodeEntity =>
    ({
        uid,
        name,
    }) as unknown as NodeEntity;

const createAsyncIterable = <T>(items: T[]) =>
    (async function* () {
        for (const item of items) {
            yield item;
        }
    })();

describe('useTrashPhototsNodes', () => {
    const setPhotoNodes = jest.fn();
    const setLoading = jest.fn();
    const iterateTrashedPhotoNodes = jest.fn();
    const handleError = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();

        mockUseTrashPhotosStore.mockImplementation((selector: (state: any) => any) =>
            selector({ setNodes: setPhotoNodes, trashNodes: {}, isLoading: false })
        );
        mockUseTrashPhotosStore.getState.mockReturnValue({
            setLoading,
            isLoading: false,
            setNodes: setPhotoNodes,
        });
        mockUseTrashStore.getState.mockReturnValue({ setLoading });

        mockUseDrive.mockReturnValue({
            internal: {
                photos: {
                    iterateTrashedNodes: iterateTrashedPhotoNodes,
                },
            },
        } as any);

        mockUseSdkErrorHandler.mockReturnValue({ handleError } as any);
        mockGetNodeEntityFromMaybeNode.mockImplementation((trashNode: any) => ({
            node: trashNode.node,
            errors: new Map(),
        }));
    });

    it('loads trashed photo nodes and updates the photo store', async () => {
        iterateTrashedPhotoNodes.mockReturnValue(
            createAsyncIterable([
                { node: createNode('photo-1', 'Photo 1') },
                { node: createNode('photo-2', 'Photo 2') },
            ])
        );

        const { result } = renderHook(() => useTrashPhototsNodes());
        const abortController = new AbortController();

        await act(async () => {
            await result.current.loadTrashPhotoNodes(abortController.signal);
        });

        expect(iterateTrashedPhotoNodes).toHaveBeenCalledWith(abortController.signal);
        expect(setLoading).toHaveBeenNthCalledWith(1, true);
        expect(setLoading).toHaveBeenLastCalledWith(false);
        expect(setPhotoNodes).toHaveBeenCalledTimes(2);
        expect(setPhotoNodes).toHaveBeenCalledWith({ 'photo-1': { uid: 'photo-1', name: 'Photo 1' } });
        expect(setPhotoNodes).toHaveBeenCalledWith({ 'photo-2': { uid: 'photo-2', name: 'Photo 2' } });
        expect(handleError).not.toHaveBeenCalled();
    });
});
