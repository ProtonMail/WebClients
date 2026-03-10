import { act, renderHook } from '@testing-library/react';

import { type NodeEntity, getDrive, getDriveForPhotos } from '@proton/drive/index';
import { getNodeEntityFromMaybeNode } from '@proton/drive/modules/upload/utils/getNodeEntityFromMaybeNode';

import { useTrashStore } from './useTrash.store';
import { useTrashNodes } from './useTrashNodes';

jest.mock('@proton/drive/index', () => ({
    getDrive: jest.fn(),
    getDriveForPhotos: jest.fn(),
}));

jest.mock('../../utils/errorHandling/handleSdkError');

jest.mock('@proton/drive/modules/upload/utils/getNodeEntityFromMaybeNode', () => ({
    getNodeEntityFromMaybeNode: jest.fn(),
}));

jest.mock('./useTrash.store', () => {
    const hook = jest.fn() as jest.Mock & { getState: jest.Mock };
    hook.getState = jest.fn();
    return { useTrashStore: hook };
});

const mockGetDrive = jest.mocked(getDrive);
const mockGetDriveForPhotos = jest.mocked(getDriveForPhotos);
const mockGetNodeEntityFromMaybeNode = jest.mocked(getNodeEntityFromMaybeNode);
const mockUseTrashStore = useTrashStore as jest.MockedFunction<typeof useTrashStore> & { getState: jest.Mock };

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

describe('useTrashNodes', () => {
    const setItem = jest.fn();
    const setLoading = jest.fn();
    const iterateTrashedNodes = jest.fn();
    const iterateTrashedPhotoNodes = jest.fn();
    const handleError = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();

        mockUseTrashStore.mockImplementation((selector: (state: any) => any) =>
            selector({ setItem, items: new Map(), isLoading: false })
        );
        mockUseTrashStore.getState.mockReturnValue({ setLoading, isLoading: false, setItem });

        mockGetDrive.mockReturnValue({
            iterateTrashedNodes,
        } as any);

        mockGetDriveForPhotos.mockReturnValue({
            iterateTrashedNodes: iterateTrashedPhotoNodes,
        } as any);

        mockGetNodeEntityFromMaybeNode.mockImplementation((trashNode: any) => ({
            node: trashNode.node,
            errors: new Map(),
        }));
    });

    describe('loadTrashNodes', () => {
        it('loads trashed drive nodes and updates the store', async () => {
            iterateTrashedNodes.mockReturnValue(
                createAsyncIterable([
                    { node: createNode('drive-1', 'Drive 1') },
                    { node: createNode('drive-2', 'Drive 2') },
                ])
            );

            const { result } = renderHook(() => useTrashNodes());
            const abortController = new AbortController();

            await act(async () => {
                await result.current.loadTrashNodes(abortController.signal);
            });

            expect(iterateTrashedNodes).toHaveBeenCalledWith(abortController.signal);
            expect(setLoading).toHaveBeenNthCalledWith(1, 'drive', true);
            expect(setLoading).toHaveBeenLastCalledWith('drive', false);
            expect(setItem).toHaveBeenCalledTimes(2);
            expect(setItem).toHaveBeenCalledWith({ uid: 'drive-1', name: 'Drive 1' });
            expect(setItem).toHaveBeenCalledWith({ uid: 'drive-2', name: 'Drive 2' });
            expect(handleError).not.toHaveBeenCalled();
        });
    });

    describe('loadTrashPhotoNodes', () => {
        it('loads trashed photo nodes and updates the store', async () => {
            iterateTrashedPhotoNodes.mockReturnValue(
                createAsyncIterable([
                    { node: createNode('photo-1', 'Photo 1') },
                    { node: createNode('photo-2', 'Photo 2') },
                ])
            );

            const { result } = renderHook(() => useTrashNodes());
            const abortController = new AbortController();

            await act(async () => {
                await result.current.loadTrashPhotoNodes(abortController.signal);
            });

            expect(iterateTrashedPhotoNodes).toHaveBeenCalledWith(abortController.signal);
            expect(setLoading).toHaveBeenNthCalledWith(1, 'photos', true);
            expect(setLoading).toHaveBeenLastCalledWith('photos', false);
            expect(setItem).toHaveBeenCalledTimes(2);
            expect(setItem).toHaveBeenCalledWith({ uid: 'photo-1', name: 'Photo 1' });
            expect(setItem).toHaveBeenCalledWith({ uid: 'photo-2', name: 'Photo 2' });
            expect(handleError).not.toHaveBeenCalled();
        });
    });
});
