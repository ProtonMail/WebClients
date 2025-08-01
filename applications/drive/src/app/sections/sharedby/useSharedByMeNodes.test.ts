import { renderHook, waitFor } from '@testing-library/react';

import { useNotifications } from '@proton/components';
import { useDrive } from '@proton/drive';
import useLoading from '@proton/hooks/useLoading';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';
import { LinkType } from '@proton/shared/lib/interfaces/drive/link';

import { useBatchThumbnailLoader } from '../../hooks/drive/useBatchThumbnailLoader';
import { SortField, useSortingWithDefault } from '../../hooks/util/useSorting';
import { ShareState, ShareType, useDefaultShare } from '../../store';
import { useSdkErrorHandler } from '../../utils/errorHandling/useSdkErrorHandler';
import { type LegacyItem, mapNodeToLegacyItem } from '../../utils/sdk/mapNodeToLegacyItem';
import { useSharingInfoStore } from '../../zustand/share/sharingInfo.store';
import { useLegacySharesByMeNodes } from './useLegacySharesByMeNode';
import { useSharedByMeNodes } from './useSharedByMeNodes';

jest.mock('@proton/components');
jest.mock('@proton/drive');
jest.mock('@proton/hooks/useLoading');
jest.mock('../../hooks/drive/useBatchThumbnailLoader');
jest.mock('../../store');
jest.mock('../../utils/sdk/mapNodeToLegacyItem');
jest.mock('../../zustand/share/sharingInfo.store');
jest.mock('./useLegacySharesByMeNode');
jest.mock('../../hooks/util/useSorting');
jest.mock('../../utils/errorHandling/useSdkErrorHandler');
const mockUseDrive = jest.mocked(useDrive);
const mockUseLoading = jest.mocked(useLoading);
const mockUseDefaultShare = jest.mocked(useDefaultShare);
const mockMapNodeToLegacyItem = jest.mocked(mapNodeToLegacyItem);
const mockUseLegacySharesByMeNodes = jest.mocked(useLegacySharesByMeNodes);
const mockUseBatchThumbnailLoader = jest.mocked(useBatchThumbnailLoader);
const mockUseSharingInfoStore = jest.mocked(useSharingInfoStore);
const mockUseSortingWithDefault = jest.mocked(useSortingWithDefault).mockImplementation((items, defaultSort) => ({
    sortedList: items,
    sortParams: defaultSort,
    setSorting: jest.fn(),
}));
const mockUseSdkErrorHandler = jest.mocked(useSdkErrorHandler).mockImplementation(() => ({
    handleError: jest.fn(),
}));
const mockCreateNotification = jest.fn();
jest.mocked(useNotifications).mockImplementation(
    () =>
        ({
            createNotification: mockCreateNotification,
        }) as any
);

const mockDefaultShare = {
    shareId: 'default-share-id',
    volumeId: 'default-volume-id',
    rootLinkId: 'root-link-id',
    creator: 'test@proton.me',
    addressId: 'address-id',
    key: 'share-key',
    passphrase: 'passphrase',
    passphraseSignature: 'signature',
    createTime: 1640995200,
    state: ShareState.active,
    memberships: [],
    type: ShareType.default,
    possibleKeyPackets: [],
    isLocked: false,
    isDefault: true,
    linkType: LinkType.FOLDER,
};

const mockLegacyItem: LegacyItem = {
    uid: 'vol~node1',
    name: 'shared-file.txt',
    shareId: 'share1',
    volumeId: 'vol1',
    id: 'node1',
    linkId: 'node1',
    activeRevision: {
        id: 'rev1',
        createTime: 1640995200,
        size: 1024,
        state: 1,
        manifestSignature: '',
        blocs: [],
        thumbnails: [],
    },
    cachedThumbnailUrl: undefined,
    hasThumbnail: false,
    isFile: true,
    mimeType: 'text/plain',
    fileModifyTime: 1640995200,
    shareUrl: undefined,
    size: 1024,
    trashed: null,
    parentLinkId: 'parent1',
    rootShareId: 'root1',
    sharedOn: undefined,
    isAnonymous: false,
    metaDataModifyTime: 1640995200,
    thumbnailId: 'rev1',
};

const mockLegacyNode = {
    linkId: 'node2',
    parentLinkId: 'parent2',
    type: LinkType.FILE,
    isFile: true,
    name: 'legacy-file.txt',
    mimeType: 'text/plain',
    hash: 'hash2',
    size: 2048,
    createTime: 1640995200,
    metaDataModifyTime: 1640995200,
    trashed: null,
    hasThumbnail: false,
    shareId: 'share2',
    rootShareId: 'root2',
    volumeId: 'vol2',
    encryptedName: 'encrypted-legacy-file.txt',
    fileModifyTime: 1640995200,
    activeRevision: {
        id: 'rev2',
        createTime: 1640995200,
        size: 2048,
        state: 1,
        manifestSignature: '',
        blocs: [],
        thumbnails: [],
    },
};

const mockHandleError = jest.fn();
const mockLoadThumbnail = jest.fn();
const mockSetSharingInfoStoreLoading = jest.fn();
const mockSetSharingInfoStore = jest.fn();
const mockSetSharingInfoStoreEmptyOrFailed = jest.fn();
const mockSkipSharingInfoLoading = jest.fn();

const mockDriveClientWithSharing = {
    iterateSharedNodes: jest.fn(),
    getSharingInfo: jest.fn(),
};

describe('useSharedByMeNodes', () => {
    const setupMocks = (isLoading = false, isLegacyLoading = false) => {
        const mockWithLoading = jest.fn(async (promise) => {
            if (promise) {
                return Promise.resolve().then(() => promise);
            }
            return Promise.resolve();
        });
        const mockSetLoading = jest.fn();
        mockUseLoading.mockReturnValue([isLoading, mockWithLoading, mockSetLoading]);
        mockUseDrive.mockReturnValue({ drive: mockDriveClientWithSharing } as any);
        mockUseDefaultShare.mockReturnValue({ getDefaultShare: jest.fn().mockResolvedValue(mockDefaultShare) } as any);
        mockMapNodeToLegacyItem.mockResolvedValue(mockLegacyItem);
        mockUseLegacySharesByMeNodes.mockReturnValue({
            items: [] as any[],
            isLoading: isLegacyLoading,
        });
        mockUseBatchThumbnailLoader.mockReturnValue({
            loadThumbnail: mockLoadThumbnail,
        });
        mockUseSharingInfoStore.mockReturnValue({
            setSharingInfoStoreLoading: mockSetSharingInfoStoreLoading,
            setSharingInfoStore: mockSetSharingInfoStore,
            setSharingInfoStoreEmptyOrFailed: mockSetSharingInfoStoreEmptyOrFailed,
            skipSharingInfoLoading: mockSkipSharingInfoLoading,
        });
        mockUseSdkErrorHandler.mockReturnValue({ handleError: mockHandleError });
        mockUseSortingWithDefault.mockImplementation((items, defaultSort) => ({
            sortedList: items,
            sortParams: defaultSort,
            setSorting: jest.fn(),
        }));
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockCreateNotification.mockClear();
        mockSetSharingInfoStoreLoading.mockClear();
        mockSetSharingInfoStore.mockClear();
        mockSetSharingInfoStoreEmptyOrFailed.mockClear();
        mockSkipSharingInfoLoading.mockClear();
    });

    it('should initialize with loading state', () => {
        setupMocks(true);
        const { result } = renderHook(() => useSharedByMeNodes());

        expect(result.current.isLoading).toBe(true);
        expect(result.current.sharedByMeNodes).toEqual([]);
    });

    it('should combine loading states from both hooks', () => {
        setupMocks(false, true);
        const { result } = renderHook(() => useSharedByMeNodes());

        expect(result.current.isLoading).toBe(true);
    });

    it('should load shared nodes successfully', async () => {
        setupMocks();

        const mockSharedNode = {
            uid: 'vol~node1',
            name: 'shared-file.txt',
            type: ShareType.default,
            isFile: true,
        };

        mockDriveClientWithSharing.iterateSharedNodes.mockImplementation(async function* () {
            yield mockSharedNode;
        });

        const mockSortedList = [mockLegacyItem];
        mockUseSortingWithDefault.mockReturnValue({
            sortedList: mockSortedList,
            sortParams: { sortField: SortField.name, sortOrder: SORT_DIRECTION.ASC },
            setSorting: jest.fn(),
        });

        const { result } = renderHook(() => useSharedByMeNodes());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(mockDriveClientWithSharing.iterateSharedNodes).toHaveBeenCalled();
        expect(mockMapNodeToLegacyItem).toHaveBeenCalledWith(
            mockSharedNode,
            mockDefaultShare.shareId,
            mockDriveClientWithSharing
        );
        expect(result.current.sharedByMeNodes).toEqual(mockSortedList);
    });

    it('should populate nodes from legacy successfully', async () => {
        setupMocks();

        const legacyNodes = [mockLegacyNode];
        mockUseLegacySharesByMeNodes.mockReturnValue({
            items: legacyNodes as any[],
            isLoading: false,
        });

        const expectedLegacyItemWithUid = {
            ...mockLegacyNode,
            uid: 'vol2~node2',
            id: 'vol2~node2',
            isLegacy: true,
            thumbnailId: 'rev2',
        };

        const mockSortedList = [expectedLegacyItemWithUid];
        mockUseSortingWithDefault.mockReturnValue({
            sortedList: mockSortedList,
            sortParams: { sortField: SortField.name, sortOrder: SORT_DIRECTION.ASC },
            setSorting: jest.fn(),
        });

        const { result } = renderHook(() => useSharedByMeNodes());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.sharedByMeNodes).toEqual(mockSortedList);
    });

    it('should handle errors gracefully during node loading', async () => {
        setupMocks();

        const mockSharedNode = {
            uid: 'vol~node1',
            name: 'shared-file.txt',
            type: ShareType.default,
            isFile: true,
        };

        mockDriveClientWithSharing.iterateSharedNodes.mockImplementation(async function* () {
            yield mockSharedNode;
        });

        mockMapNodeToLegacyItem.mockRejectedValue(new Error('Node mapping failed'));

        const { result } = renderHook(() => useSharedByMeNodes());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(mockHandleError).toHaveBeenCalledWith(expect.any(Error), {
            showNotification: false,
        });
        expect(mockCreateNotification).toHaveBeenCalledWith({
            type: 'error',
            text: 'We were not able to load some of your shared items',
        });
    });

    it('should show single notification for multiple errors', async () => {
        setupMocks();

        const mockSharedNode1 = {
            uid: 'vol~node1',
            name: 'shared-file-1.txt',
            type: ShareType.default,
            isFile: true,
        };

        const mockSharedNode2 = {
            uid: 'vol~node2',
            name: 'shared-file-2.txt',
            type: ShareType.default,
            isFile: true,
        };

        mockDriveClientWithSharing.iterateSharedNodes.mockImplementation(async function* () {
            yield mockSharedNode1;
            yield mockSharedNode2;
        });

        mockMapNodeToLegacyItem.mockRejectedValue(new Error('Node mapping failed'));

        const { result } = renderHook(() => useSharedByMeNodes());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(mockHandleError).toHaveBeenCalledTimes(2);
        expect(mockHandleError).toHaveBeenCalledWith(expect.any(Error), {
            showNotification: false,
        });

        expect(mockCreateNotification).toHaveBeenCalledTimes(1);
        expect(mockCreateNotification).toHaveBeenCalledWith({
            type: 'error',
            text: 'We were not able to load some of your shared items',
        });
    });

    it('should handle errors gracefully during legacy population', async () => {
        setupMocks();

        const legacyNodes = [mockLegacyNode];
        mockUseLegacySharesByMeNodes.mockReturnValue({
            items: legacyNodes as any[],
            isLoading: false,
        });

        const { result } = renderHook(() => useSharedByMeNodes());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.sharedByMeNodes).toBeDefined();
    });

    it('should return sorting parameters and setter', async () => {
        setupMocks();

        const mockSetSorting = jest.fn();
        const mockSortParams = { sortField: SortField.name, sortOrder: SORT_DIRECTION.ASC };

        mockUseSortingWithDefault.mockReturnValue({
            sortedList: [],
            sortParams: mockSortParams,
            setSorting: mockSetSorting,
        });

        const { result } = renderHook(() => useSharedByMeNodes());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.sortParams).toEqual(mockSortParams);
        expect(result.current.setSorting).toBe(mockSetSorting);
    });

    it('should not load shared nodes when there are no items', async () => {
        setupMocks();

        mockDriveClientWithSharing.iterateSharedNodes.mockImplementation(async function* () {
            return;
        });

        const { result } = renderHook(() => useSharedByMeNodes());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(mockDriveClientWithSharing.iterateSharedNodes).toHaveBeenCalled();
        expect(result.current.sharedByMeNodes).toEqual([]);
    });

    it('should call loadThumbnail hook', async () => {
        setupMocks();

        const { result } = renderHook(() => useSharedByMeNodes());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(mockUseBatchThumbnailLoader).toHaveBeenCalled();
        expect(result.current.onRenderItem).toBeDefined();
    });

    describe('onRenderItem and sharing info loading', () => {
        it('should load thumbnail and sharing info when skipSharingInfoLoading returns false', async () => {
            setupMocks();
            mockSkipSharingInfoLoading.mockReturnValue(false);
            mockDriveClientWithSharing.getSharingInfo.mockResolvedValue({
                publicLink: {
                    uid: 'share~link',
                    url: 'https://example.com',
                    creationTime: '2023-01-01T00:00:00Z',
                    expirationTime: null,
                    numAccess: 0,
                },
            });

            const mockSharedNode = {
                uid: 'vol~node1',
                name: 'shared-file.txt',
                type: ShareType.default,
                isFile: true,
            };

            mockDriveClientWithSharing.iterateSharedNodes.mockImplementation(async function* () {
                yield mockSharedNode;
            });

            const { result } = renderHook(() => useSharedByMeNodes());

            await waitFor(() => expect(result.current.isLoading).toBe(false));
            await waitFor(() => expect(result.current.sharedByMeNodes.length).toBeGreaterThan(0));

            result.current.onRenderItem(mockLegacyItem.uid);

            expect(mockLoadThumbnail).toHaveBeenCalledWith({
                uid: mockLegacyItem.uid,
                thumbnailId: mockLegacyItem.thumbnailId,
                hasThumbnail: mockLegacyItem.hasThumbnail,
                cachedThumbnailUrl: mockLegacyItem.cachedThumbnailUrl,
            });
            expect(mockSkipSharingInfoLoading).toHaveBeenCalledWith(mockLegacyItem.uid);
            expect(mockSetSharingInfoStoreLoading).toHaveBeenCalledWith(mockLegacyItem.uid);
        });

        it('should skip sharing info loading when skipSharingInfoLoading returns true', async () => {
            setupMocks();
            mockSkipSharingInfoLoading.mockReturnValue(true);

            const mockSharedNode = {
                uid: 'vol~node1',
                name: 'shared-file.txt',
                type: ShareType.default,
                isFile: true,
            };

            mockDriveClientWithSharing.iterateSharedNodes.mockImplementation(async function* () {
                yield mockSharedNode;
            });

            const { result } = renderHook(() => useSharedByMeNodes());

            await waitFor(() => expect(result.current.isLoading).toBe(false));
            await waitFor(() => expect(result.current.sharedByMeNodes.length).toBeGreaterThan(0));

            result.current.onRenderItem(mockLegacyItem.uid);

            expect(mockSkipSharingInfoLoading).toHaveBeenCalledWith(mockLegacyItem.uid);
            expect(mockSetSharingInfoStoreLoading).not.toHaveBeenCalled();
            expect(mockDriveClientWithSharing.getSharingInfo).not.toHaveBeenCalled();
        });

        it('should handle sharing info loading error', async () => {
            setupMocks();
            mockSkipSharingInfoLoading.mockReturnValue(false);
            const error = new Error('Failed to load sharing info');
            mockDriveClientWithSharing.getSharingInfo.mockRejectedValue(error);

            const mockSharedNode = {
                uid: 'vol~node1',
                name: 'shared-file.txt',
                type: ShareType.default,
                isFile: true,
            };

            mockDriveClientWithSharing.iterateSharedNodes.mockImplementation(async function* () {
                yield mockSharedNode;
            });

            const { result } = renderHook(() => useSharedByMeNodes());

            await waitFor(() => expect(result.current.isLoading).toBe(false));
            await waitFor(() => expect(result.current.sharedByMeNodes.length).toBeGreaterThan(0));

            result.current.onRenderItem(mockLegacyItem.uid);

            await waitFor(() => {
                expect(mockSetSharingInfoStoreEmptyOrFailed).toHaveBeenCalledWith(mockLegacyItem.uid);
                expect(mockHandleError).toHaveBeenCalledWith(error, {
                    fallbackMessage: 'We were not able to load some of your shared items details',
                });
            });
        });

        it('should not render item when uid does not exist in sharedByMeNodes', async () => {
            setupMocks();

            const { result } = renderHook(() => useSharedByMeNodes());

            await waitFor(() => expect(result.current.isLoading).toBe(false));

            result.current.onRenderItem('non-existent-uid');

            expect(mockLoadThumbnail).not.toHaveBeenCalled();
            expect(mockSkipSharingInfoLoading).not.toHaveBeenCalled();
        });
    });
});
