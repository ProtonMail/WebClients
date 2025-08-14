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
};

jest.mock('../../../zustand/sections/sharedWithMeListing.store', () => ({
    useSharedWithMeListingStore: (selector: any) => selector(mockSharedWithMeStore),
    ItemType: {
        BOOKMARK: 'bookmark',
        DIRECT_SHARE: 'directShare',
    },
    getKeyUid: (item: any) => item.id || 'test-uid',
}));

describe('useSharedWithMeItemsWithSelection', () => {
    let hook: {
        current: ReturnType<typeof useSharedWithMeItemsWithSelection>;
    };

    beforeEach(() => {
        jest.clearAllMocks();
        // Reset the store mocks
        mockSharedWithMeStore.getSharedWithMeItem.mockReturnValue(null);
        mockSharedWithMeStore.getInvitationPositionedItems.mockReturnValue([]);
        mockSharedWithMeStore.getRegularItems.mockReturnValue([]);

        const { result } = renderHook(() => useSharedWithMeItemsWithSelection());
        hook = result;
    });

    it('should return initial state correctly', () => {
        expect(hook.current).toEqual(
            expect.objectContaining({
                items: [],
                selectedItems: [],
                isLoading: false,
                isEmpty: true,
            })
        );
    });

    it('should handle sorting correctly', () => {
        act(() => {
            hook.current.handleSorting({
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
            nodeUid: 'test-node-uid',
        };

        mockSharedWithMeStore.getSharedWithMeItem.mockReturnValue(mockItem);

        const { result } = renderHook(() => useSharedWithMeItemsWithSelection());

        act(() => {
            result.current.handleRenderItem('test-uid');
        });

        expect(mockSharedWithMeStore.getSharedWithMeItem).toHaveBeenCalledWith('test-uid');
    });

    it('should handle click on bookmark item', () => {
        const mockItem = {
            itemType: ItemType.BOOKMARK,
            bookmark: {
                url: 'https://example.com',
            },
        };

        mockSharedWithMeStore.getSharedWithMeItem.mockReturnValue(mockItem);

        const { result } = renderHook(() => useSharedWithMeItemsWithSelection());

        act(() => {
            void result.current.handleOpenItem('test-uid');
        });

        expect(mockSharedWithMeStore.getSharedWithMeItem).toHaveBeenCalledWith('test-uid');
    });

    it('should map legacy items correctly', () => {
        const mockItem = {
            id: 'test-id',
            type: NodeType.File,
            name: 'test-file.txt',
            mediaType: 'text/plain',
            size: 1024,
            legacy: {
                volumeId: 'volume-1',
                shareId: 'share-1',
                linkId: 'link-1',
            },
        };

        const mockRegularItem = {
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
                id: expect.any(String),
                name: 'test-file.txt',
                isFile: true,
                mimeType: 'text/plain',
            })
        );
    });
});
