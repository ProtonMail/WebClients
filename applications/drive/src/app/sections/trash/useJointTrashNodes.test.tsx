import { renderHook, waitFor } from '@testing-library/react';

import { type NodeEntity, NodeType, useDrive } from '@proton/drive/index';

import { useSortingWithDefault } from '../../hooks/util/useSorting';
import { useStableDefaultShare } from '../../hooks/util/useStableDefaultShare';
import { handleLegacyError } from '../../utils/errorHandling/useLegacyErrorHandler';
import { type LegacyItem, mapNodeToLegacyItem } from '../../utils/sdk/mapNodeToLegacyItem';
import { useJointTrashNodes } from './useJointTrashNodes';
import { useTrashStore } from './useTrash.store';
import { useTrashPhotosStore } from './useTrashPhotos.store';

jest.mock('@proton/drive/index', () => {
    const actual = jest.requireActual('@proton/drive/index');
    return {
        ...actual,
        useDrive: jest.fn(),
    };
});

jest.mock('../../hooks/util/useStableDefaultShare', () => ({
    useStableDefaultShare: jest.fn(),
}));

jest.mock('../../hooks/util/useSorting', () => ({
    useSortingWithDefault: jest.fn(),
}));

jest.mock('../../utils/errorHandling/useLegacyErrorHandler', () => ({
    handleLegacyError: jest.fn(),
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

jest.mock('../../utils/sdk/mapNodeToLegacyItem', () => {
    const actual = jest.requireActual('../../utils/sdk/mapNodeToLegacyItem');
    return {
        ...actual,
        mapNodeToLegacyItem: jest.fn(),
    };
});

const mockUseDrive = jest.mocked(useDrive);
const mockUseStableDefaultShare = jest.mocked(useStableDefaultShare);
const mockUseSortingWithDefault = jest.mocked(useSortingWithDefault);
const mockMapNodeToLegacyItem = jest.mocked(mapNodeToLegacyItem);
const mockUseTrashStore = useTrashStore as jest.MockedFunction<typeof useTrashStore> & { getState: jest.Mock };
const mockUseTrashPhotosStore = useTrashPhotosStore as jest.MockedFunction<typeof useTrashPhotosStore> & {
    getState: jest.Mock;
};
const mockHandleLegacyError = jest.mocked(handleLegacyError);

const createLegacyItem = (uid: string, name: string, type: NodeType = NodeType.File): LegacyItem => ({
    uid,
    id: uid,
    linkId: uid,
    volumeId: 'volume',
    name,
    type,
    shareId: 'shareId',
    parentLinkId: 'parent',
    rootShareId: 'rootShare',
    parentUid: undefined,
    hasThumbnail: false,
    isFile: true,
    mimeType: 'text/plain',
    fileModifyTime: 0,
    hasSignatureIssues: false,
    size: 0,
    trashed: null,
    metaDataModifyTime: 0,
    thumbnailId: uid,
});

describe('useJointTrashNodes', () => {
    let driveStoreState: { trashNodes: Record<string, any>; isLoading: boolean };
    let photoStoreState: { trashNodes: Record<string, any>; isLoading: boolean };

    beforeEach(() => {
        jest.clearAllMocks();
        driveStoreState = { trashNodes: {}, isLoading: false };
        photoStoreState = { trashNodes: {}, isLoading: false };

        mockUseDrive.mockReturnValue({
            drive: {},
            internal: {
                photos: {},
            },
        } as any);

        mockUseStableDefaultShare.mockReturnValue({
            getDefaultShare: jest.fn().mockResolvedValue({ shareId: 'shareId' }),
        } as any);

        mockUseSortingWithDefault.mockImplementation((items) => ({
            sortedList: items,
            sortParams: { sortField: 'name', sortOrder: 'asc' } as any,
            setSorting: jest.fn(),
        }));

        mockUseTrashStore.mockImplementation((selector: (state: any) => any) => selector(driveStoreState));
        mockUseTrashPhotosStore.mockImplementation((selector: (state: any) => any) => selector(photoStoreState));

        mockMapNodeToLegacyItem.mockImplementation(async (maybeNode) => {
            const node = 'value' in maybeNode ? maybeNode.value : (maybeNode as unknown as NodeEntity);
            return createLegacyItem(node.uid, node.name, node.type ?? NodeType.File);
        });
    });

    it('returns mapped drive and photo trash nodes', async () => {
        const driveNode = { uid: 'drive-1', name: 'Drive node', type: NodeType.File };
        const photoNode = { uid: 'photo-1', name: 'Photo node', type: NodeType.Photo };
        driveStoreState.trashNodes = { [driveNode.uid]: driveNode };
        photoStoreState.trashNodes = { [photoNode.uid]: photoNode };
        photoStoreState.isLoading = true;

        const { result } = renderHook(() => useJointTrashNodes());

        await waitFor(() => {
            expect(result.current.trashNodes).toHaveLength(2);
        });

        expect(mockMapNodeToLegacyItem).toHaveBeenCalledTimes(2);
        expect(result.current.trashNodes).toEqual([
            expect.objectContaining({ uid: driveNode.uid, name: driveNode.name }),
            expect.objectContaining({ uid: photoNode.uid, name: photoNode.name, type: NodeType.Photo }),
        ]);
        expect(result.current.isLoading).toBe(true);
    });

    it('reports errors when mapping fails', async () => {
        driveStoreState.trashNodes = {
            driveError: { uid: 'drive-error', name: 'Drive node', type: NodeType.File },
        };
        mockMapNodeToLegacyItem.mockRejectedValueOnce(new Error('mapping failed'));

        const { result } = renderHook(() => useJointTrashNodes());

        await waitFor(() => {
            expect(mockHandleLegacyError).toHaveBeenCalled();
        });

        expect(result.current.trashNodes).toEqual([]);
    });

    it('prevents race condition when dependencies change before async operations complete', async () => {
        const oldNode = { uid: 'old-1', name: 'Old node', type: NodeType.File };
        const newNode = { uid: 'new-1', name: 'New node', type: NodeType.File };

        driveStoreState.trashNodes = { [oldNode.uid]: oldNode };

        let resolveOldMapping: ((value: LegacyItem) => void) | undefined;
        const oldDelayedPromise = new Promise<LegacyItem>((resolve) => {
            resolveOldMapping = resolve;
        });
        mockMapNodeToLegacyItem.mockReturnValueOnce(oldDelayedPromise);

        const { result, rerender } = renderHook(() => useJointTrashNodes());

        // Verify initial state is empty
        expect(result.current.trashNodes).toEqual([]);

        // Change dependencies before old async operation completes
        driveStoreState.trashNodes = { [newNode.uid]: newNode };
        mockMapNodeToLegacyItem.mockResolvedValueOnce(createLegacyItem(newNode.uid, newNode.name));
        rerender();

        // Wait for the new mapping to complete
        await waitFor(() => {
            expect(result.current.trashNodes).toHaveLength(1);
        });

        // Verify we got the new node
        expect(result.current.trashNodes[0].uid).toBe(newNode.uid);

        // Now complete the old async operation
        if (resolveOldMapping) {
            resolveOldMapping(createLegacyItem(oldNode.uid, oldNode.name));
        }

        // Wait a bit to ensure any state updates would have been attempted
        await new Promise((resolve) => setTimeout(resolve, 50));

        // The result should still be the new node, not the old one
        expect(result.current.trashNodes).toHaveLength(1);
        expect(result.current.trashNodes[0].uid).toBe(newNode.uid);
    });
});
