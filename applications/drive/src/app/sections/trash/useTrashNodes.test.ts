import { act, renderHook } from '@testing-library/react';

import { getNodeEntity } from '@proton/drive/legacy/sdkUtils/getNodeEntity';
import { getFormattedNodeLocation, getFormattedNodeLocationFromHierarchy } from '@proton/drive/modules/nodes';
import { type NodeEntity, getDrive, getDriveForPhotos } from '@proton/drive/sdk';

import { useTrashStore } from './useTrash.store';
import { useTrashNodes } from './useTrashNodes';

jest.mock('@proton/drive/sdk', () => ({
    getDrive: jest.fn(),
    getDriveForPhotos: jest.fn(),
}));

jest.mock('@proton/drive/legacy/errorHandling');

jest.mock('@proton/drive/modules/nodes', () => ({
    ...jest.requireActual('@proton/drive/modules/nodes'),
    getFormattedNodeLocation: jest.fn(),
    getFormattedNodeLocationFromHierarchy: jest.fn(),
}));

jest.mock('@proton/drive/legacy/sdkUtils/getNodeEntity', () => ({
    getNodeEntity: jest.fn(),
}));

jest.mock('../../utils/sdk/getSignatureIssues', () => ({
    getSignatureIssues: jest.fn(() => ({ ok: true })),
}));

jest.mock('./useTrash.store', () => {
    const hook = jest.fn() as jest.Mock & { getState: jest.Mock };
    hook.getState = jest.fn();
    return {
        useTrashStore: hook,
        createTrashItem: (rawNode: any, node: any, location: string, rootNode: NodeEntity) => ({
            ...node,
            location,
            rootUid: rootNode.uid,
        }),
    };
});

const mockGetDrive = jest.mocked(getDrive);
const mockGetDriveForPhotos = jest.mocked(getDriveForPhotos);
const mockGetNodeEntity = jest.mocked(getNodeEntity);
const mockGetFormattedNodeLocation = jest.mocked(getFormattedNodeLocation);
const mockGetFormattedNodeLocationFromHierarchy = jest.mocked(getFormattedNodeLocationFromHierarchy);
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
    const setSorting = jest.fn();
    const iterateTrashedNodes = jest.fn();
    const getNodeHierarchy = jest.fn();
    const iterateTrashedPhotoNodes = jest.fn();
    const handleError = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        mockGetFormattedNodeLocation.mockResolvedValue('/location');

        mockUseTrashStore.mockImplementation((selector: (state: any) => any) =>
            selector({ setItem, items: new Map(), isLoading: false })
        );
        mockUseTrashStore.getState.mockReturnValue({
            setLoading,
            isLoading: false,
            setItem,
            setSorting,
            sortConfig: undefined,
            sortField: 'name',
            direction: 'asc',
        });

        mockGetDrive.mockReturnValue({
            iterateTrashedNodes,
            getNodeHierarchy,
        } as any);

        mockGetDriveForPhotos.mockReturnValue({
            iterateTrashedNodes: iterateTrashedPhotoNodes,
        } as any);

        mockGetNodeEntity.mockImplementation((trashNode: any) => ({
            node: trashNode.node,
            errors: new Map(),
        }));
    });

    describe('loadTrashNodes', () => {
        it('loads trashed drive nodes and updates the store', async () => {
            const rootNode = createNode('root', 'Root');
            const trashNodes = [
                { uid: 'drive-1', node: createNode('drive-1', 'Drive 1') },
                { uid: 'drive-2', node: createNode('drive-2', 'Drive 2') },
            ];
            iterateTrashedNodes.mockReturnValue(createAsyncIterable(trashNodes));
            getNodeHierarchy.mockImplementation(async (uid: string) => [
                rootNode,
                trashNodes.find((trashNode) => trashNode.uid === uid),
            ]);
            mockGetFormattedNodeLocationFromHierarchy
                .mockResolvedValueOnce('/Trash/Drive 1')
                .mockResolvedValueOnce('/Trash/Drive 2');

            const { result } = renderHook(() => useTrashNodes());
            const abortController = new AbortController();

            await act(async () => {
                await result.current.loadTrashNodes(abortController.signal);
            });

            expect(iterateTrashedNodes).toHaveBeenCalledWith(abortController.signal);
            expect(setLoading).toHaveBeenNthCalledWith(1, 'drive', true);
            expect(setLoading).toHaveBeenLastCalledWith('drive', false);
            expect(setItem).toHaveBeenCalledTimes(2);
            expect(setItem).toHaveBeenCalledWith(
                expect.objectContaining({
                    uid: 'drive-1',
                    name: 'Drive 1',
                    location: '/Trash/Drive 1',
                    rootUid: 'root',
                })
            );
            expect(setItem).toHaveBeenCalledWith(
                expect.objectContaining({
                    uid: 'drive-2',
                    name: 'Drive 2',
                    location: '/Trash/Drive 2',
                    rootUid: 'root',
                })
            );
            // One hierarchy load per node gives both the location and the root.
            expect(getNodeHierarchy).toHaveBeenCalledTimes(2);
            expect(mockGetFormattedNodeLocation).not.toHaveBeenCalled();
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
            mockGetFormattedNodeLocation
                .mockResolvedValueOnce('/Trash/Photo 1')
                .mockResolvedValueOnce('/Trash/Photo 2');

            const { result } = renderHook(() => useTrashNodes());
            const abortController = new AbortController();

            await act(async () => {
                await result.current.loadTrashPhotoNodes(abortController.signal);
            });

            expect(iterateTrashedPhotoNodes).toHaveBeenCalledWith(abortController.signal);
            expect(setLoading).toHaveBeenNthCalledWith(1, 'photos', true);
            expect(setLoading).toHaveBeenLastCalledWith('photos', false);
            expect(setItem).toHaveBeenCalledTimes(2);
            expect(setItem).toHaveBeenCalledWith(
                expect.objectContaining({ uid: 'photo-1', name: 'Photo 1', location: '/Trash/Photo 1' })
            );
            expect(setItem).toHaveBeenCalledWith(
                expect.objectContaining({ uid: 'photo-2', name: 'Photo 2', location: '/Trash/Photo 2' })
            );
            expect(handleError).not.toHaveBeenCalled();
        });
    });
});
