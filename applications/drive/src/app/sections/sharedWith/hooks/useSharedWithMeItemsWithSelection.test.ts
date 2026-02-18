import { act, renderHook } from '@testing-library/react-hooks';

import { NodeType } from '@proton/drive/index';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';

import { ItemType } from '../../../zustand/sections/sharedWithMeListing.store';
import { useSharedWithMeItemsWithSelection } from './useSharedWithMeItemsWithSelection';

jest.mock('../../../components/FileBrowser', () => ({
    useSelection: () => ({
        selectedItemIds: [],
        selectItem: jest.fn(),
        clearSelection: jest.fn(),
    }),
}));

jest.mock('../../../hooks/drive/useBatchThumbnailLoader', () => ({
    useBatchThumbnailLoader: () => ({
        loadThumbnail: jest.fn(),
    }),
}));

jest.mock('./useBookmarksActions', () => ({
    useBookmarksActions: () => ({
        openBookmark: jest.fn(),
    }),
}));

const mockNavigateToLink = jest.fn();
const mockNavigateToAlbum = jest.fn();

jest.mock('../../../hooks/drive/useNavigate', () => {
    return jest.fn().mockImplementation(() => ({
        navigateToLink: mockNavigateToLink,
        navigateToAlbum: mockNavigateToAlbum,
    }));
});

jest.mock('../../../hooks/drive/useOnItemRenderedMetrics', () => ({
    useOnItemRenderedMetrics: () => ({
        incrementItemRenderedCounter: jest.fn(),
    }),
}));

jest.mock('../../../components/sections/SortDropdown', () => ({
    translateSortField: jest.fn().mockReturnValue('Name'),
}));

jest.mock('../../../store', () => ({
    useDocumentActions: () => ({
        openDocument: jest.fn(),
    }),
    useUserSettings: () => ({
        layout: 'list',
    }),
}));

jest.mock('../../../store/_documents', () => ({
    useDriveDocsFeatureFlag: () => ({
        isDocsEnabled: true,
    }),
}));

jest.mock('../../../hooks/util/useSorting', () => ({
    useSortingWithDefault: (items: any[], defaultSort: any) => ({
        sortedList: items,
        sortParams: defaultSort,
        setSorting: jest.fn(),
    }),
    SortField: {
        name: 'name',
        sharedBy: 'sharedBy',
        sharedOn: 'sharedOn',
    },
}));

jest.mock('../../../utils/sdk/legacyTime', () => ({
    dateToLegacyTimestamp: jest.fn().mockReturnValue(123456789),
}));

const mockSharedWithMeStore = {
    getSharedWithMeItem: jest.fn(),
    getInvitationPositionedItems: jest.fn(() => []),
    getRegularItems: jest.fn(() => []),
    clearItemsWithInvitationPosition: jest.fn(),
    isLoading: jest.fn(() => false),
    hasEverLoaded: false,
    itemUids: new Set(),
};

jest.mock('../../../zustand/sections/sharedWithMeListing.store', () => ({
    useSharedWithMeListingStore: (selector: any) => selector(mockSharedWithMeStore),
    ItemType: {
        BOOKMARK: 'bookmark',
        DIRECT_SHARE: 'directShare',
        INVITATION: 'invitation',
    },
    getKeyUid: (item: any) => item.nodeUid || item.bookmark?.uid || 'volume-123~node-456',
}));

jest.mock('../../../modals/preview/useDrivePreviewModal', () => ({
    useDrivePreviewModal: () => ({ previewModal: null, showPreviewModal: jest.fn() }),
}));

describe('useSharedWithMeItemsWithSelection', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset the store mocks
        mockSharedWithMeStore.getSharedWithMeItem.mockReturnValue(null);
        mockSharedWithMeStore.getInvitationPositionedItems.mockReturnValue([]);
        mockSharedWithMeStore.getRegularItems.mockReturnValue([]);
        mockSharedWithMeStore.hasEverLoaded = false;
        mockSharedWithMeStore.itemUids = new Set();
    });

    it('should return initial state correctly', () => {
        mockSharedWithMeStore.hasEverLoaded = true;

        const { result } = renderHook(() => useSharedWithMeItemsWithSelection());

        expect(result.current).toEqual(
            expect.objectContaining({
                items: [],
                selectedItems: [],
                isLoading: false,
                isEmpty: true,
            })
        );
    });

    it('should handle sorting correctly', () => {
        const { result } = renderHook(() => useSharedWithMeItemsWithSelection());

        act(() => {
            result.current.handleSorting({
                sortField: 'name' as any,
                sortOrder: SORT_DIRECTION.ASC,
            });
        });

        expect(mockSharedWithMeStore.clearItemsWithInvitationPosition).toHaveBeenCalled();
    });

    it('should handle item rendering correctly', () => {
        const mockItem = {
            thumbnailId: 'test-thumbnail',
            itemType: ItemType.DIRECT_SHARE,
            nodeUid: 'volume-123~node-456',
        };

        mockSharedWithMeStore.getSharedWithMeItem.mockReturnValue(mockItem);

        const { result } = renderHook(() => useSharedWithMeItemsWithSelection());

        act(() => {
            result.current.handleRenderItem({ id: 'volume-123~node-456' });
        });

        expect(mockSharedWithMeStore.getSharedWithMeItem).toHaveBeenCalledWith('volume-123~node-456');
    });

    it('should handle click on bookmark item', () => {
        const mockItem = {
            itemType: ItemType.BOOKMARK,
            bookmark: {
                url: 'https://example.com',
                uid: 'bookmark-123',
            },
        };

        mockSharedWithMeStore.getSharedWithMeItem.mockReturnValue(mockItem);

        const { result } = renderHook(() => useSharedWithMeItemsWithSelection());

        act(() => {
            void result.current.handleOpenItem('bookmark-123');
        });

        expect(mockSharedWithMeStore.getSharedWithMeItem).toHaveBeenCalledWith('bookmark-123');
    });

    it('should map legacy items correctly', () => {
        const mockItem = {
            nodeUid: 'volume-1~node-1',
            type: NodeType.File,
            name: 'test-file.txt',
            mediaType: 'text/plain',
            size: 1024,
            itemType: ItemType.DIRECT_SHARE,
            shareId: 'share-1',
        };

        const mockRegularItem = {
            nodeUid: 'volume-1~node-1',
            name: 'test-file.txt',
            type: NodeType.File,
            mediaType: 'text/plain',
            itemType: ItemType.DIRECT_SHARE,
            directShare: {
                sharedOn: new Date(),
                sharedBy: 'test@example.com',
            },
        };

        mockSharedWithMeStore.getSharedWithMeItem.mockReturnValue(mockItem);
        mockSharedWithMeStore.getRegularItems.mockReturnValue([mockRegularItem] as any);

        const { result } = renderHook(() => useSharedWithMeItemsWithSelection());

        expect(result.current.items).toHaveLength(1);
        expect(result.current.items[0]).toEqual(
            expect.objectContaining({
                id: 'volume-1~node-1',
                name: 'test-file.txt',
                isFile: true,
                mimeType: 'text/plain',
            })
        );
    });
    it('should verify isEmpty logic edge cases', () => {
        mockSharedWithMeStore.hasEverLoaded = false;
        mockSharedWithMeStore.isLoading.mockReturnValue(false);
        mockSharedWithMeStore.itemUids = new Set();

        const { result: result1 } = renderHook(() => useSharedWithMeItemsWithSelection());
        expect(result1.current.isEmpty).toBe(false);

        mockSharedWithMeStore.hasEverLoaded = true;
        mockSharedWithMeStore.isLoading.mockReturnValue(true);
        mockSharedWithMeStore.itemUids = new Set();

        const { result: result2 } = renderHook(() => useSharedWithMeItemsWithSelection());
        expect(result2.current.isEmpty).toBe(false);

        mockSharedWithMeStore.hasEverLoaded = true;
        mockSharedWithMeStore.isLoading.mockReturnValue(false);
        mockSharedWithMeStore.itemUids = new Set(['item1']);

        const { result: result3 } = renderHook(() => useSharedWithMeItemsWithSelection());
        expect(result3.current.isEmpty).toBe(false);

        mockSharedWithMeStore.hasEverLoaded = true;
        mockSharedWithMeStore.isLoading.mockReturnValue(false);
        mockSharedWithMeStore.itemUids = new Set();

        const { result: result4 } = renderHook(() => useSharedWithMeItemsWithSelection());
        expect(result4.current.isEmpty).toBe(true);
    });
});
