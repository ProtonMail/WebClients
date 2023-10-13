import { act, renderHook } from '@testing-library/react-hooks';

import { SupportedMimeTypes } from '@proton/shared/lib/drive/constants';
import { getItem, removeItem, setItem } from '@proton/shared/lib/helpers/storage';

import { DecryptedLink, useLinksActions, useLinksListing } from '../_links';
import { useShareActions } from '../_shares';
import { RECOVERY_STATE, usePhotosRecovery } from './usePhotosRecovery';

function generateDecryptedLink(linkId = 'linkId'): DecryptedLink {
    return {
        encryptedName: 'name',
        name: 'name',
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
    };
}

jest.mock('../_links', () => {
    const useLinksActions = jest.fn();
    const useLinksListing = jest.fn();
    return { useLinksActions, useLinksListing };
});

jest.mock('../_shares', () => {
    const useShareActions = jest.fn();
    return { useShareActions };
});

jest.mock('./PhotosProvider', () => {
    const usePhotos = () => ({
        shareId: 'shareId',
        linkId: 'linkId',
        restoredShares: [
            {
                shareId: 'shareId',
                rootLinkId: 'rootLinkId',
                volumeId: 'volumeId',
                creator: 'creator',
                isLocked: false,
                isDefault: false,
                isVolumeSoftDeleted: false,
                possibleKeyPackets: ['dsad'],
                type: 4,
                state: 1,
            },
        ],
    });
    return {
        usePhotos,
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
const mockedRemoveItem = jest.mocked(removeItem);
const mockedGetItem = jest.mocked(getItem);
const mockedSetItem = jest.mocked(setItem);

const getAllResultState = (
    all: (
        | Error
        | {
              needsRecovery: boolean;
              countOfUnrecoveredLinksLeft: number;
              countOfFailedLinks: number;
              start: () => void;
              state: RECOVERY_STATE;
          }
    )[]
) => {
    const allResultState: {
        state: RECOVERY_STATE;
    }[] = all.map((allResult: any) => allResult.state);
    return allResultState;
};
describe('usePhotosRecovery', () => {
    const links = [generateDecryptedLink('linkId1'), generateDecryptedLink('linkId2')];
    const mockedUseShareActions = jest.mocked(useShareActions);
    const mockedDeleteShare = jest.fn();
    const mockedUseLinksListing = jest.mocked(useLinksListing);
    const mockedUseLinksActions = jest.mocked(useLinksActions);
    const mockedGetCachedChildren = jest.fn();
    const mockedLoadChildren = jest.fn();
    const mockedMoveLinks = jest.fn();
    // @ts-ignore
    mockedUseLinksListing.mockReturnValue({
        loadChildren: mockedLoadChildren,
        getCachedChildren: mockedGetCachedChildren,
    });
    // @ts-ignore
    mockedUseShareActions.mockReturnValue({
        deleteShare: mockedDeleteShare,
    });
    // @ts-ignore
    mockedUseLinksActions.mockReturnValue({
        moveLinks: mockedMoveLinks,
    });

    beforeEach(() => {
        jest.clearAllMocks();
        mockedDeleteShare.mockResolvedValue(undefined);
        mockedLoadChildren.mockResolvedValue(undefined);

        mockedMoveLinks.mockImplementation(
            async (abortSignal: AbortSignal, { linkIds, onMoved }: { linkIds: string[]; onMoved?: () => void }) => {
                linkIds.forEach(() => onMoved?.());
            }
        );
    });

    it('should pass all state if files need to be recovered', async () => {
        mockedGetCachedChildren.mockReturnValueOnce({ links, isDecrypting: false }); // Decrypting step
        mockedGetCachedChildren.mockReturnValueOnce({ links, isDecrypting: false }); // Preparing step
        mockedGetCachedChildren.mockReturnValueOnce({ links: [], isDecrypting: false }); // Deleting step
        const { result, waitFor } = renderHook(() => usePhotosRecovery());
        act(() => {
            result.current.start();
        });
        await waitFor(() => expect(result.current.countOfUnrecoveredLinksLeft).toEqual(2));

        expect(result.current.state).toEqual('SUCCEED');
        expect(mockedGetCachedChildren).toHaveBeenCalledTimes(3);
        expect(mockedMoveLinks).toHaveBeenCalledTimes(1);
        expect(mockedLoadChildren).toHaveBeenCalledTimes(1);
        expect(mockedDeleteShare).toHaveBeenCalledTimes(1);
        expect(result.current.countOfUnrecoveredLinksLeft).toEqual(0);
        expect(getAllResultState(result.all)).toStrictEqual([
            'READY',
            'READY',
            'STARTED',
            'DECRYPTING',
            'DECRYPTED',
            'PREPARING',
            'PREPARING',
            'PREPARING', // 3 times Preparing because of React states changes
            'PREPARED',
            'MOVING',
            'MOVED',
            'CLEANING',
            'SUCCEED',
        ]);
        expect(mockedRemoveItem).toHaveBeenCalledTimes(1);
        expect(mockedRemoveItem).toHaveBeenCalledWith('photos-recovery-state');
    });

    it('should pass and set errors count if some moves failed', async () => {
        mockedGetCachedChildren.mockClear();
        mockedGetCachedChildren.mockReturnValueOnce({ links, isDecrypting: false }); // Decrypting step
        mockedGetCachedChildren.mockReturnValueOnce({ links, isDecrypting: false }); // Preparing step
        mockedGetCachedChildren.mockReturnValueOnce({ links: [links[0]], isDecrypting: false }); // Deleting step
        mockedMoveLinks.mockImplementation(
            async (
                abortSignal: AbortSignal,
                { linkIds, onMoved, onError }: { linkIds: string[]; onMoved?: () => void; onError?: () => void }
            ) => {
                linkIds.forEach((linkId) => {
                    if (linkId === 'linkId2') {
                        onError?.();
                    } else {
                        onMoved?.();
                    }
                });
            }
        );
        const { result, waitFor } = renderHook(() => usePhotosRecovery());
        act(() => {
            result.current.start();
        });

        await waitFor(() => expect(result.current.countOfUnrecoveredLinksLeft).toEqual(2));

        expect(result.current.countOfFailedLinks).toEqual(1);
        expect(result.current.countOfUnrecoveredLinksLeft).toEqual(0);
        expect(result.current.state).toEqual('FAILED');
        expect(mockedDeleteShare).toHaveBeenCalledTimes(0);
        expect(getAllResultState(result.all)).toStrictEqual([
            'READY',
            'READY',
            'STARTED',
            'DECRYPTING',
            'DECRYPTED',
            'PREPARING',
            'PREPARING',
            'PREPARING', // 3 times Preparing because of React states changes
            'PREPARED',
            'MOVING',
            'MOVED',
            'CLEANING',
            'FAILED',
        ]);
        expect(mockedGetItem).toHaveBeenCalledTimes(1);
        expect(mockedSetItem).toHaveBeenCalledTimes(2);
        expect(mockedSetItem).toHaveBeenCalledWith('photos-recovery-state', 'progress');
        expect(mockedSetItem).toHaveBeenCalledWith('photos-recovery-state', 'failed');
    });

    it('should failed if deleteShare failed', async () => {
        mockedGetCachedChildren.mockReturnValueOnce({ links, isDecrypting: false }); // Decrypting step
        mockedGetCachedChildren.mockReturnValueOnce({ links, isDecrypting: false }); // Preparing step
        mockedGetCachedChildren.mockReturnValueOnce({ links: [], isDecrypting: false }); // Deleting step
        mockedDeleteShare.mockRejectedValue(undefined);
        const { result, waitFor } = renderHook(() => usePhotosRecovery());
        act(() => {
            result.current.start();
        });

        await waitFor(() => expect(result.current.state).toEqual('FAILED'));
        expect(mockedDeleteShare).toHaveBeenCalledTimes(1);

        expect(getAllResultState(result.all)).toStrictEqual([
            'READY',
            'READY',
            'STARTED',
            'DECRYPTING',
            'DECRYPTED',
            'PREPARING',
            'PREPARING',
            'PREPARING', // 3 times Preparing because of React states changes
            'PREPARED',
            'MOVING',
            'MOVED',
            'CLEANING',
            'FAILED',
        ]);
        expect(mockedGetItem).toHaveBeenCalledTimes(1);
        expect(mockedSetItem).toHaveBeenCalledTimes(2);
        expect(mockedSetItem).toHaveBeenCalledWith('photos-recovery-state', 'progress');
        expect(mockedSetItem).toHaveBeenCalledWith('photos-recovery-state', 'failed');
    });

    it('should failed if loadChildren failed', async () => {
        mockedGetCachedChildren.mockReturnValueOnce({ links, isDecrypting: false }); // Decrypting step
        mockedGetCachedChildren.mockReturnValueOnce({ links, isDecrypting: false }); // Preparing step
        mockedGetCachedChildren.mockReturnValueOnce({ links: [], isDecrypting: false }); // Deleting step
        mockedLoadChildren.mockRejectedValue(undefined);
        const { result, waitFor } = renderHook(() => usePhotosRecovery());
        act(() => {
            result.current.start();
        });

        await waitFor(() => expect(result.current.state).toEqual('FAILED'));
        expect(mockedDeleteShare).toHaveBeenCalledTimes(0);
        expect(mockedGetCachedChildren).toHaveBeenCalledTimes(0);

        expect(getAllResultState(result.all)).toStrictEqual(['READY', 'READY', 'STARTED', 'DECRYPTING', 'FAILED']);
        expect(mockedGetItem).toHaveBeenCalledTimes(1);
        expect(mockedSetItem).toHaveBeenCalledTimes(2);
        expect(mockedSetItem).toHaveBeenCalledWith('photos-recovery-state', 'progress');
        expect(mockedSetItem).toHaveBeenCalledWith('photos-recovery-state', 'failed');
    });

    it('should failed if moveLinks helper failed', async () => {
        mockedGetCachedChildren.mockReturnValueOnce({ links, isDecrypting: false }); // Decrypting step
        mockedGetCachedChildren.mockReturnValueOnce({ links, isDecrypting: false }); // Preparing step
        mockedGetCachedChildren.mockReturnValueOnce({ links: [], isDecrypting: false }); // Deleting step
        mockedMoveLinks.mockRejectedValue(undefined);
        const { result, waitFor } = renderHook(() => usePhotosRecovery());
        act(() => {
            result.current.start();
        });

        await waitFor(() => expect(result.current.state).toEqual('FAILED'));
        expect(mockedDeleteShare).toHaveBeenCalledTimes(0);
        expect(mockedMoveLinks).toHaveBeenCalledTimes(1);
        expect(mockedGetCachedChildren).toHaveBeenCalledTimes(2);
        expect(getAllResultState(result.all)).toStrictEqual([
            'READY',
            'READY',
            'STARTED',
            'DECRYPTING',
            'DECRYPTED',
            'PREPARING',
            'PREPARING',
            'PREPARING', // 3 times Preparing because of React states changes
            'PREPARED',
            'MOVING',
            'FAILED',
        ]);
        expect(mockedGetItem).toHaveBeenCalledTimes(1);
        expect(mockedSetItem).toHaveBeenCalledTimes(2);
        expect(mockedSetItem).toHaveBeenCalledWith('photos-recovery-state', 'progress');
        expect(mockedSetItem).toHaveBeenCalledWith('photos-recovery-state', 'failed');
    });

    it('should start the process if localStorage value was set to progress', async () => {
        mockedGetCachedChildren.mockReturnValueOnce({ links, isDecrypting: false }); // Decrypting step
        mockedGetCachedChildren.mockReturnValueOnce({ links, isDecrypting: false }); // Preparing step
        mockedGetCachedChildren.mockReturnValueOnce({ links: [], isDecrypting: false }); // Deleting step
        mockedGetItem.mockReturnValueOnce('progress');
        const { result, waitFor } = renderHook(() => usePhotosRecovery());

        await waitFor(() => expect(result.current.state).toEqual('SUCCEED'));
        expect(getAllResultState(result.all)).toStrictEqual([
            'READY',
            'STARTED',
            'DECRYPTING',
            'DECRYPTED',
            'PREPARING',
            'PREPARING',
            'PREPARING',
            'PREPARED',
            'MOVING',
            'MOVED',
            'CLEANING',
            'SUCCEED',
        ]);
        expect(mockedGetItem).toHaveBeenCalledTimes(1);
    });

    it('should set state to failed if localStorage value was set to failed', async () => {
        mockedGetItem.mockReturnValueOnce('failed');
        const { result, waitFor } = renderHook(() => usePhotosRecovery());

        await waitFor(() => expect(result.current.state).toEqual('FAILED'));
        expect(getAllResultState(result.all)).toStrictEqual(['READY', 'FAILED']);
    });
});
