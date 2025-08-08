import { act, renderHook, waitFor } from '@testing-library/react';

import { SupportedMimeTypes } from '@proton/shared/lib/drive/constants';
import { getItem, removeItem, setItem } from '@proton/shared/lib/helpers/storage';
import { LinkType } from '@proton/shared/lib/interfaces/drive/link';
import { VolumeType } from '@proton/shared/lib/interfaces/drive/volume';

import { usePhotosWithAlbums } from '../../photos/PhotosStore/PhotosWithAlbumsProvider';
import { useSharesStore } from '../../zustand/share/shares.store';
import type { DecryptedLink } from '../_links';
import { useLinksActions, useLinksListing } from '../_links';
import { ShareState, ShareType } from '../_shares';
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

jest.mock('../_links', () => {
    const useLinksActions = jest.fn();
    const useLinksListing = jest.fn();
    return { useLinksActions, useLinksListing };
});

jest.mock('../../photos/PhotosStore/PhotosWithAlbumsProvider', () => {
    return {
        usePhotosWithAlbums: jest.fn(),
    };
});

jest.mock('../_utils', () => ({
    waitFor: jest.fn().mockImplementation(async (callback) => {
        callback();
    }),
}));

jest.mock('@proton/shared/lib/helpers/storage', () => ({
    getItem: jest.fn(),
    removeItem: jest.fn(),
    setItem: jest.fn(),
}));

jest.mock('../../utils/errorHandling');

const mockedRemoveItem = jest.mocked(removeItem);
const mockedGetItem = jest.mocked(getItem);
const mockedSetItem = jest.mocked(setItem);

describe('usePhotosRecovery', () => {
    const links = [generateDecryptedLink('linkId1'), generateDecryptedLink('linkId2')];
    const trashedLinks = [generateDecryptedLink('linkId3'), generateDecryptedLink('linkId4')];
    const mockedUsePhotos = jest.mocked(usePhotosWithAlbums);
    const mockedUseLinksListing = jest.mocked(useLinksListing);
    const mockedUseLinksActions = jest.mocked(useLinksActions);
    const mockedGetCachedChildren = jest.fn();
    const mockedGetCachedTrashed = jest.fn();
    const mockedLoadChildren = jest.fn();
    // New mocks for the updated implementation
    const mockedRecoverPhotoLinks = jest.fn();
    const mockedGetDefaultPhotosShare = jest.fn();
    const mockedDeletePhotosShare = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        mockedDeletePhotosShare.mockResolvedValue(undefined);
        mockedLoadChildren.mockResolvedValue(undefined);

        // Setup default photo share mock
        mockedGetDefaultPhotosShare.mockResolvedValue({ volumeId: 'volumeId' });

        // Setup recoverPhotoLinks default behavior
        mockedRecoverPhotoLinks.mockImplementation(async (abortSignal, volumeId, { linkIds }) => {
            return {
                successes: linkIds,
                failures: {},
            };
        });

        // @ts-ignore
        mockedUseLinksListing.mockReturnValue({
            loadChildren: mockedLoadChildren,
            getCachedChildren: mockedGetCachedChildren,
            getCachedTrashed: mockedGetCachedTrashed,
        });

        // @ts-ignore
        mockedUsePhotos.mockReturnValue({
            shareId: 'shareId',
            linkId: 'linkId',
            deletePhotosShare: mockedDeletePhotosShare,
            volumeId: 'volumeId',
            volumeType: VolumeType.Photos,
        });

        // @ts-ignore
        mockedUseLinksActions.mockReturnValue({
            recoverPhotoLinks: mockedRecoverPhotoLinks,
        });

        const { result } = renderHook(() => useSharesStore());
        act(() => {
            result.current.setShares([
                {
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
                },
            ]);
        });
    });

    it('should pass all state if files need to be recovered', async () => {
        mockedGetCachedChildren.mockReturnValueOnce({ links, isDecrypting: false }); // Decrypting step
        mockedGetCachedTrashed.mockReturnValueOnce({ links: trashedLinks, isDecrypting: false }); // Decrypting step
        mockedGetCachedChildren.mockReturnValueOnce({ links, isDecrypting: false }); // Preparing step
        mockedGetCachedTrashed.mockReturnValueOnce({ links: trashedLinks, isDecrypting: false }); // Preparing step
        mockedGetCachedChildren.mockReturnValueOnce({ links: [], isDecrypting: false }); // Deleting step
        mockedGetCachedTrashed.mockReturnValueOnce({ links: [], isDecrypting: false }); // Deleting step

        const { result } = renderHook(() => usePhotosRecovery());
        act(() => {
            result.current.start();
        });

        await waitFor(() => expect(result.current.state).toEqual('SUCCEED'));
        expect(result.current.countOfUnrecoveredLinksLeft).toEqual(0);
        expect(mockedGetCachedChildren).toHaveBeenCalledTimes(3);
        expect(mockedGetCachedTrashed).toHaveBeenCalledTimes(3);
        expect(mockedRecoverPhotoLinks).toHaveBeenCalledTimes(1);
        expect(mockedLoadChildren).toHaveBeenCalledTimes(1);
        expect(mockedDeletePhotosShare).toHaveBeenCalledTimes(1);
        expect(mockedRemoveItem).toHaveBeenCalledTimes(1);
        expect(mockedRemoveItem).toHaveBeenCalledWith('photos-recovery-state');
    });

    it('should pass and set errors count if some recoveries failed', async () => {
        mockedGetCachedChildren.mockReturnValueOnce({ links, isDecrypting: false }); // Decrypting step
        mockedGetCachedTrashed.mockReturnValueOnce({ links: trashedLinks, isDecrypting: false }); // Decrypting step
        mockedGetCachedChildren.mockReturnValueOnce({ links, isDecrypting: false }); // Preparing step
        mockedGetCachedTrashed.mockReturnValueOnce({ links: trashedLinks, isDecrypting: false }); // Preparing step
        mockedGetCachedChildren.mockReturnValueOnce({ links: [links[0]], isDecrypting: false }); // Deleting step
        mockedGetCachedTrashed.mockReturnValueOnce({ links: [trashedLinks[0]], isDecrypting: false }); // Deleting step
        mockedRecoverPhotoLinks.mockImplementation(
            // eslint-disable-next-line
            async (abortSignal: AbortSignal, volumeId: string, { linkIds }) => {
                return {
                    successes: ['linkId1', 'linkId3'],
                    failures: { linkId2: 'Error recovering link', linkId4: 'Error recovering link' },
                };
            }
        );

        const { result } = renderHook(() => usePhotosRecovery());
        act(() => {
            result.current.start();
        });

        await waitFor(() => expect(result.current.state).toEqual('FAILED'));
        expect(result.current.countOfFailedLinks).toEqual(2);
        expect(result.current.countOfUnrecoveredLinksLeft).toEqual(0);
        expect(result.current.state).toEqual('FAILED');
        expect(mockedDeletePhotosShare).toHaveBeenCalledTimes(0);
        expect(mockedGetItem).toHaveBeenCalledTimes(1);
        expect(mockedSetItem).toHaveBeenCalledTimes(2);
        expect(mockedSetItem).toHaveBeenCalledWith('photos-recovery-state', 'progress');
        expect(mockedSetItem).toHaveBeenCalledWith('photos-recovery-state', 'failed');
    });

    it('should failed if deleteShare failed', async () => {
        mockedGetCachedChildren.mockReturnValueOnce({ links, isDecrypting: false }); // Decrypting step
        mockedGetCachedTrashed.mockReturnValueOnce({ links: trashedLinks, isDecrypting: false }); // Decrypting step

        mockedGetCachedChildren.mockReturnValueOnce({ links, isDecrypting: false }); // Preparing step
        mockedGetCachedTrashed.mockReturnValueOnce({ links: trashedLinks, isDecrypting: false }); // Preparing step

        mockedGetCachedChildren.mockReturnValueOnce({ links: [], isDecrypting: false }); // Deleting step
        mockedGetCachedTrashed.mockReturnValueOnce({ links: [], isDecrypting: false }); // Deleting step
        mockedDeletePhotosShare.mockRejectedValue(undefined);
        const { result } = renderHook(() => usePhotosRecovery());
        act(() => {
            result.current.start();
        });

        await waitFor(() => expect(result.current.state).toEqual('FAILED'));
        expect(mockedDeletePhotosShare).toHaveBeenCalledTimes(1);

        expect(mockedGetItem).toHaveBeenCalledTimes(1);
        expect(mockedSetItem).toHaveBeenCalledTimes(2);
        expect(mockedSetItem).toHaveBeenCalledWith('photos-recovery-state', 'progress');
        expect(mockedSetItem).toHaveBeenCalledWith('photos-recovery-state', 'failed');
    });

    it('should failed if recoverPhotoLinks helper failed', async () => {
        mockedGetCachedChildren.mockReturnValueOnce({ links, isDecrypting: false }); // Decrypting step
        mockedGetCachedTrashed.mockReturnValueOnce({ links: trashedLinks, isDecrypting: false }); // Decrypting step

        mockedGetCachedChildren.mockReturnValueOnce({ links, isDecrypting: false }); // Preparing step
        mockedGetCachedTrashed.mockReturnValueOnce({ links: trashedLinks, isDecrypting: false }); // Preparing step

        mockedGetCachedChildren.mockReturnValueOnce({ links: [], isDecrypting: false }); // Deleting step
        mockedGetCachedTrashed.mockReturnValueOnce({ links: [], isDecrypting: false }); // Deleting step
        mockedRecoverPhotoLinks.mockRejectedValue(undefined);
        const { result } = renderHook(() => usePhotosRecovery());
        act(() => {
            result.current.start();
        });

        await waitFor(() => expect(result.current.state).toEqual('FAILED'));
        expect(mockedDeletePhotosShare).toHaveBeenCalledTimes(0);
        expect(mockedRecoverPhotoLinks).toHaveBeenCalledTimes(1);
        expect(mockedGetCachedChildren).toHaveBeenCalledTimes(2);
        expect(mockedGetItem).toHaveBeenCalledTimes(1);
        expect(mockedSetItem).toHaveBeenCalledTimes(2);
        expect(mockedSetItem).toHaveBeenCalledWith('photos-recovery-state', 'progress');
        expect(mockedSetItem).toHaveBeenCalledWith('photos-recovery-state', 'failed');
    });

    it('should failed if loadChildren failed', async () => {
        mockedGetCachedChildren.mockReturnValueOnce({ links, isDecrypting: false }); // Decrypting step
        mockedGetCachedTrashed.mockReturnValueOnce({ links: trashedLinks, isDecrypting: false }); // Decrypting step
        mockedGetCachedChildren.mockReturnValueOnce({ links, isDecrypting: false }); // Preparing step
        mockedGetCachedTrashed.mockReturnValueOnce({ links: trashedLinks, isDecrypting: false }); // Preparing step
        mockedGetCachedChildren.mockReturnValueOnce({ links: [], isDecrypting: false }); // Deleting step
        mockedGetCachedTrashed.mockReturnValueOnce({ links: [], isDecrypting: false }); // Deleting step
        mockedLoadChildren.mockRejectedValue(undefined);

        const { result } = renderHook(() => usePhotosRecovery());
        act(() => {
            result.current.start();
        });

        await waitFor(() => expect(result.current.state).toEqual('FAILED'));
        expect(mockedDeletePhotosShare).toHaveBeenCalledTimes(0);
        expect(mockedGetCachedChildren).toHaveBeenCalledTimes(0);
        expect(mockedGetItem).toHaveBeenCalledTimes(1);
        expect(mockedSetItem).toHaveBeenCalledTimes(2);
        expect(mockedSetItem).toHaveBeenCalledWith('photos-recovery-state', 'progress');
        expect(mockedSetItem).toHaveBeenCalledWith('photos-recovery-state', 'failed');
    });

    it('should failed if recoverPhotoLinks helper failed', async () => {
        mockedGetCachedChildren.mockReturnValueOnce({ links, isDecrypting: false }); // Decrypting step
        mockedGetCachedTrashed.mockReturnValueOnce({ links: trashedLinks, isDecrypting: false }); // Decrypting step
        mockedGetCachedChildren.mockReturnValueOnce({ links, isDecrypting: false }); // Preparing step
        mockedGetCachedTrashed.mockReturnValueOnce({ links: trashedLinks, isDecrypting: false }); // Preparing step
        mockedGetCachedChildren.mockReturnValueOnce({ links: [], isDecrypting: false }); // Deleting step
        mockedGetCachedTrashed.mockReturnValueOnce({ links: [], isDecrypting: false }); // Deleting step
        mockedRecoverPhotoLinks.mockRejectedValue(undefined);

        const { result } = renderHook(() => usePhotosRecovery());
        act(() => {
            result.current.start();
        });

        await waitFor(() => expect(result.current.state).toEqual('FAILED'));
        expect(mockedDeletePhotosShare).toHaveBeenCalledTimes(0);
        expect(mockedRecoverPhotoLinks).toHaveBeenCalledTimes(1);
        expect(mockedGetCachedChildren).toHaveBeenCalledTimes(2);
        expect(mockedGetItem).toHaveBeenCalledTimes(1);
        expect(mockedSetItem).toHaveBeenCalledTimes(2);
        expect(mockedSetItem).toHaveBeenCalledWith('photos-recovery-state', 'progress');
        expect(mockedSetItem).toHaveBeenCalledWith('photos-recovery-state', 'failed');
    });

    it('should start the process if localStorage value was set to progress', async () => {
        mockedGetCachedChildren.mockReturnValueOnce({ links, isDecrypting: false }); // Decrypting step
        mockedGetCachedTrashed.mockReturnValueOnce({ links: trashedLinks, isDecrypting: false }); // Decrypting step
        mockedGetCachedChildren.mockReturnValueOnce({ links, isDecrypting: false }); // Preparing step
        mockedGetCachedTrashed.mockReturnValueOnce({ links: trashedLinks, isDecrypting: false }); // Preparing step
        mockedGetCachedChildren.mockReturnValueOnce({ links: [], isDecrypting: false }); // Deleting step
        mockedGetCachedTrashed.mockReturnValueOnce({ links: [], isDecrypting: false }); // Deleting step
        mockedGetItem.mockReturnValueOnce('progress');

        const { result } = renderHook(() => usePhotosRecovery());
        await waitFor(() => expect(result.current.state).toEqual('SUCCEED'));
        expect(mockedGetItem).toHaveBeenCalledTimes(1);
    });

    it('should set state to failed if localStorage value was set to failed', async () => {
        mockedGetItem.mockReturnValueOnce('failed');
        const { result } = renderHook(() => usePhotosRecovery());
        await waitFor(() => expect(result.current.state).toEqual('FAILED'));
    });
});
