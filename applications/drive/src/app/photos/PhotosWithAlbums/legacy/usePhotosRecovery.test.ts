import { act, renderHook, waitFor } from '@testing-library/react';

import { useApi } from '@proton/components';
import { SupportedMimeTypes } from '@proton/shared/lib/drive/constants';
import { getItem, removeItem, setItem } from '@proton/shared/lib/helpers/storage';
import { LinkType } from '@proton/shared/lib/interfaces/drive/link';

import { useLinksActions, useLinksListing } from '../../../legacy/store/_links';
import type { DecryptedLink } from '../../../legacy/store/_links';
import { ShareState, ShareType } from '../../../legacy/store/_shares';
import { useSharesStore } from '../../../legacy/zustand/share/shares.store';
import { usePhotosRecovery } from './usePhotosRecovery';

function generateDecryptedLink(linkId = 'linkId'): DecryptedLink {
    return {
        encryptedName: 'name',
        name: 'name',
        type: LinkType.FILE,
        linkId,
        createTime: 323212,
        digests: { sha1: '' },
        fileModifyTime: 323212,
        parentLinkId: 'parentLinkId',
        isFile: true,
        mimeType: SupportedMimeTypes.jpg,
        hash: 'hash',
        size: 233,
        metaDataModifyTime: 323212,
        trashed: 0,
        hasThumbnail: false,
        isShared: false,
        rootShareId: 'rootShareId',
        volumeId: 'volumeId',
        activeRevision: {
            id: 'id',
            size: 323212,
            signatureEmail: 'address@gmail.com',
            createTime: 123,
            manifestSignature: '',
            blocs: [],
            state: 2,
            thumbnails: [],
            photo: {
                linkId: 'linkId',
                captureTime: 321321,
            },
        },
    };
}

jest.mock('../../../legacy/store/_links', () => {
    const useLinksActions = jest.fn();
    const useLinksListing = jest.fn();
    return { useLinksActions, useLinksListing };
});

jest.mock('@proton/components', () => ({
    useApi: jest.fn(),
}));

jest.mock('@proton/drive', () => ({
    ...jest.requireActual('@proton/drive'),
    getDriveForPhotos: jest.fn(() => ({
        getMyPhotosRootFolder: jest.fn().mockResolvedValue({}),
    })),
}));

jest.mock('@proton/drive/internal/BusDriver', () => ({
    ...jest.requireActual('@proton/drive/internal/BusDriver'),
    getBusDriver: jest.fn(() => ({ emit: jest.fn().mockResolvedValue(undefined) })),
}));

jest.mock('@proton/drive/legacy/sdkUtils/getNodeEntity', () => ({
    getNodeEntity: jest.fn(() => ({
        node: { uid: 'volumeId~rootLinkId', deprecatedShareId: 'shareId' },
        errors: new Map(),
    })),
}));

jest.mock('../../../legacy/store/_utils', () => ({
    waitFor: jest.fn().mockImplementation(async (callback) => {
        callback();
    }),
}));

jest.mock('@proton/shared/lib/helpers/storage', () => ({
    getItem: jest.fn(),
    removeItem: jest.fn(),
    setItem: jest.fn(),
}));

jest.mock('@proton/drive/legacy/errorHandling');

const mockedRemoveItem = jest.mocked(removeItem);
const mockedGetItem = jest.mocked(getItem);
const mockedSetItem = jest.mocked(setItem);

const RESTORED_SHARE = {
    addressId: 'addressId',
    shareId: 'shareId',
    rootLinkId: 'rootLinkId',
    volumeId: 'volumeId',
    creator: 'creator',
    isLocked: false,
    isDefault: false,
    possibleKeyPackets: ['dsad'],
    type: ShareType.photos,
    state: ShareState.restored,
    createTime: 1234,
    linkType: 1,
};

describe('usePhotosRecovery', () => {
    const links = [generateDecryptedLink('linkId1'), generateDecryptedLink('linkId2')];
    const trashedLinks = [generateDecryptedLink('linkId3'), generateDecryptedLink('linkId4')];

    const mockedUseLinksListing = jest.mocked(useLinksListing);
    const mockedUseLinksActions = jest.mocked(useLinksActions);
    const mockedUseApi = jest.mocked(useApi);
    const mockedApi = jest.fn();
    const mockedGetCachedChildren = jest.fn();
    const mockedGetCachedTrashed = jest.fn();
    const mockedLoadChildren = jest.fn();
    const mockedRecoverPhotoLinks = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();

        mockedLoadChildren.mockResolvedValue(undefined);
        mockedApi.mockResolvedValue(undefined);
        mockedUseApi.mockReturnValue(mockedApi);

        mockedRecoverPhotoLinks.mockImplementation(async (_signal, _volumeId, { linkIds }) => ({
            successes: linkIds,
            failures: {},
        }));

        // @ts-ignore
        mockedUseLinksListing.mockReturnValue({
            loadChildren: mockedLoadChildren,
            getCachedChildren: mockedGetCachedChildren,
            getCachedTrashed: mockedGetCachedTrashed,
        });

        // @ts-ignore
        mockedUseLinksActions.mockReturnValue({ recoverPhotoLinks: mockedRecoverPhotoLinks });

        const { result } = renderHook(() => useSharesStore());
        act(() => {
            result.current.setShares([RESTORED_SHARE]);
        });
    });

    it('should pass all states and succeed', async () => {
        mockedGetCachedChildren.mockReturnValueOnce({ links, isDecrypting: false }); // DECRYPTING
        mockedGetCachedTrashed.mockReturnValueOnce({ links: trashedLinks, isDecrypting: false }); // DECRYPTING
        mockedGetCachedChildren.mockReturnValueOnce({ links, isDecrypting: false }); // PREPARING
        mockedGetCachedTrashed.mockReturnValueOnce({ links: trashedLinks, isDecrypting: false }); // PREPARING
        mockedGetCachedChildren.mockReturnValueOnce({ links: [], isDecrypting: false }); // CLEANING
        mockedGetCachedTrashed.mockReturnValueOnce({ links: [], isDecrypting: false }); // CLEANING

        const { result } = renderHook(() => usePhotosRecovery());
        act(() => {
            result.current.start();
        });

        await waitFor(() => expect(result.current.state).toEqual('SUCCEED'));
        expect(result.current.countOfUnrecoveredLinksLeft).toEqual(0);
        expect(mockedRecoverPhotoLinks).toHaveBeenCalledTimes(1);
        expect(mockedLoadChildren).toHaveBeenCalledTimes(1);
        expect(mockedApi).toHaveBeenCalledTimes(1); // queryDeletePhotosShare
        expect(mockedRemoveItem).toHaveBeenCalledWith('photos-recovery-state');
    });

    it('should report failed count when some links fail to recover', async () => {
        mockedGetCachedChildren.mockReturnValueOnce({ links, isDecrypting: false }); // DECRYPTING
        mockedGetCachedTrashed.mockReturnValueOnce({ links: trashedLinks, isDecrypting: false }); // DECRYPTING
        mockedGetCachedChildren.mockReturnValueOnce({ links, isDecrypting: false }); // PREPARING
        mockedGetCachedTrashed.mockReturnValueOnce({ links: trashedLinks, isDecrypting: false }); // PREPARING
        mockedGetCachedChildren.mockReturnValueOnce({ links: [links[0]], isDecrypting: false }); // CLEANING (non-empty → no delete)
        mockedGetCachedTrashed.mockReturnValueOnce({ links: [trashedLinks[0]], isDecrypting: false }); // CLEANING

        mockedRecoverPhotoLinks.mockResolvedValue({
            successes: ['linkId1', 'linkId3'],
            failures: { linkId2: 'Error recovering link', linkId4: 'Error recovering link' },
        });

        const { result } = renderHook(() => usePhotosRecovery());
        act(() => {
            result.current.start();
        });

        await waitFor(() => expect(result.current.state).toEqual('FAILED'));
        expect(result.current.countOfFailedLinks).toEqual(2);
        expect(result.current.countOfUnrecoveredLinksLeft).toEqual(0);
        expect(mockedApi).not.toHaveBeenCalled(); // share not empty, no delete
        expect(mockedSetItem).toHaveBeenCalledWith('photos-recovery-state', 'progress');
        expect(mockedSetItem).toHaveBeenCalledWith('photos-recovery-state', 'failed');
    });

    it('should reach FAILED when delete share fails', async () => {
        mockedGetCachedChildren.mockReturnValueOnce({ links, isDecrypting: false }); // DECRYPTING
        mockedGetCachedTrashed.mockReturnValueOnce({ links: trashedLinks, isDecrypting: false }); // DECRYPTING
        mockedGetCachedChildren.mockReturnValueOnce({ links, isDecrypting: false }); // PREPARING
        mockedGetCachedTrashed.mockReturnValueOnce({ links: trashedLinks, isDecrypting: false }); // PREPARING
        mockedGetCachedChildren.mockReturnValueOnce({ links: [], isDecrypting: false }); // CLEANING
        mockedGetCachedTrashed.mockReturnValueOnce({ links: [], isDecrypting: false }); // CLEANING
        mockedApi.mockRejectedValue(new Error('delete failed'));

        const { result } = renderHook(() => usePhotosRecovery());
        act(() => {
            result.current.start();
        });

        await waitFor(() => expect(result.current.state).toEqual('FAILED'));
        expect(mockedApi).toHaveBeenCalledTimes(1);
        expect(mockedSetItem).toHaveBeenCalledWith('photos-recovery-state', 'progress');
        expect(mockedSetItem).toHaveBeenCalledWith('photos-recovery-state', 'failed');
    });

    it('should reach FAILED when recoverPhotoLinks throws', async () => {
        mockedGetCachedChildren.mockReturnValueOnce({ links, isDecrypting: false }); // DECRYPTING
        mockedGetCachedTrashed.mockReturnValueOnce({ links: trashedLinks, isDecrypting: false }); // DECRYPTING
        mockedGetCachedChildren.mockReturnValueOnce({ links, isDecrypting: false }); // PREPARING
        mockedGetCachedTrashed.mockReturnValueOnce({ links: trashedLinks, isDecrypting: false }); // PREPARING
        mockedRecoverPhotoLinks.mockRejectedValue(new Error('recover failed'));

        const { result } = renderHook(() => usePhotosRecovery());
        act(() => {
            result.current.start();
        });

        await waitFor(() => expect(result.current.state).toEqual('FAILED'));
        expect(mockedRecoverPhotoLinks).toHaveBeenCalledTimes(1);
        expect(mockedSetItem).toHaveBeenCalledWith('photos-recovery-state', 'progress');
        expect(mockedSetItem).toHaveBeenCalledWith('photos-recovery-state', 'failed');
    });

    it('should reach FAILED when loadChildren throws', async () => {
        mockedLoadChildren.mockRejectedValue(new Error('load failed'));

        const { result } = renderHook(() => usePhotosRecovery());
        act(() => {
            result.current.start();
        });

        await waitFor(() => expect(result.current.state).toEqual('FAILED'));
        expect(mockedRecoverPhotoLinks).not.toHaveBeenCalled();
        expect(mockedSetItem).toHaveBeenCalledWith('photos-recovery-state', 'progress');
        expect(mockedSetItem).toHaveBeenCalledWith('photos-recovery-state', 'failed');
    });

    it('should auto-start if localStorage value is "progress"', async () => {
        mockedGetCachedChildren.mockReturnValueOnce({ links, isDecrypting: false }); // DECRYPTING
        mockedGetCachedTrashed.mockReturnValueOnce({ links: trashedLinks, isDecrypting: false }); // DECRYPTING
        mockedGetCachedChildren.mockReturnValueOnce({ links, isDecrypting: false }); // PREPARING
        mockedGetCachedTrashed.mockReturnValueOnce({ links: trashedLinks, isDecrypting: false }); // PREPARING
        mockedGetCachedChildren.mockReturnValueOnce({ links: [], isDecrypting: false }); // CLEANING
        mockedGetCachedTrashed.mockReturnValueOnce({ links: [], isDecrypting: false }); // CLEANING
        mockedGetItem.mockReturnValueOnce('progress');

        const { result } = renderHook(() => usePhotosRecovery());
        await waitFor(() => expect(result.current.state).toEqual('SUCCEED'));
        expect(mockedGetItem).toHaveBeenCalledTimes(1);
    });

    it('should immediately set FAILED if localStorage value is "failed"', async () => {
        mockedGetItem.mockReturnValueOnce('failed');
        const { result } = renderHook(() => usePhotosRecovery());
        await waitFor(() => expect(result.current.state).toEqual('FAILED'));
    });
});
