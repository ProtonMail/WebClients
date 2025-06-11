import { renderHook } from '@testing-library/react-hooks';
import { verifyAllWhenMocksCalled, when } from 'jest-when';

import { useGetAddressKeys } from '@proton/account/addressKeys/hooks';
import { useGetAddresses } from '@proton/account/addresses/hooks';
import { queryListShareAutoRestore, querySendShareAutoRestoreStatus } from '@proton/shared/lib/api/drive/sanitization';
import {
    queryListNodesWithMissingNodeHashKeys,
    querySendNodesWithNewNodeHashKeys,
} from '@proton/shared/lib/api/drive/sanitization';
import { generateNodeHashKey } from '@proton/shared/lib/keys/driveKeys';

import { useDebouncedRequest } from '../_api';
import { useLink } from '../_links';
import { ShareType, useLockedVolume, useShare } from '../_shares';
import { useSanitization } from './useSanitization';

jest.mock('@proton/components', () => ({
    usePreventLeave: jest.fn().mockReturnValue({ preventLeave: jest.fn() }),
}));

jest.mock('../_api');
const mockedDebounceRequest = jest.fn().mockResolvedValue(true);
jest.mocked(useDebouncedRequest).mockReturnValue(mockedDebounceRequest);

jest.mock('@proton/account/addressKeys/hooks');
jest.mock('@proton/account/addresses/hooks');

const mockAddressesKeys = [{ address: { ID: 'address1' }, keys: ['addressKey1'] }];
const mockedGetAddressKeys = jest.fn().mockResolvedValue(mockAddressesKeys[0].keys);
const mockedGetAddresses = jest.fn().mockResolvedValue([mockAddressesKeys[0].address]);

jest.mocked(useGetAddressKeys).mockReturnValue(mockedGetAddressKeys);
jest.mocked(useGetAddresses).mockReturnValue(mockedGetAddresses);

jest.mock('../_shares/useShare');
const mockedGetShareWithKey = jest.fn().mockImplementation((_, shareId) => ({
    rootLinkId: 'rootLinkId',
    shareId,
}));
const mockedGetShareCreatorKeys = jest.fn();

jest.mocked(useShare).mockReturnValue({
    ...jest.requireActual('../_shares/useShare'),
    getShareWithKey: mockedGetShareWithKey,
    getShareCreatorKeys: mockedGetShareCreatorKeys,
});

jest.mock('@proton/shared/lib/api/drive/sanitization');
const mockedQuerySendShareAutoRestoreStatus = jest.mocked(querySendShareAutoRestoreStatus);

jest.mock('../_shares/useLockedVolume/useLockedVolume');
const mockedRestoreVolumes = jest.fn();
jest.mocked(useLockedVolume).mockReturnValue({
    restoreVolumes: mockedRestoreVolumes,
} as any);

const mockedShowAutoRestoreModal = jest.fn();

jest.mock('../_links');
const mockedGetPrivateKey = jest.fn();
jest.mocked(useLink).mockReturnValue({
    getLinkPrivateKey: mockedGetPrivateKey,
} as any);

jest.mock('@proton/shared/lib/keys/driveKeys');
const mockedGenerateNodeHashKey = jest.mocked(generateNodeHashKey);

describe('useSanitization', () => {
    let originalConsoleWarn: Console['warn'];

    beforeAll(() => {
        // Store the original console.warn
        originalConsoleWarn = console.warn;

        // Mock console.warn
        jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterAll(() => {
        // Restore the original console.warn
        console.warn = originalConsoleWarn;
        verifyAllWhenMocksCalled();
    });
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('autoRestore', () => {
        beforeEach(() => {
            mockedRestoreVolumes.mockResolvedValue(true);
        });

        it('should not do any actions if the list is empty', async () => {
            when(mockedDebounceRequest)
                .calledWith(queryListShareAutoRestore(), expect.any(AbortSignal))
                .mockResolvedValueOnce({ ShareIDs: [] });

            const { result } = renderHook(() => useSanitization());
            await result.current.autoRestore(() => {});

            expect(mockedRestoreVolumes).not.toHaveBeenCalled();
            expect(mockedQuerySendShareAutoRestoreStatus).not.toHaveBeenCalled();
            expect(mockedShowAutoRestoreModal).toHaveBeenCalledTimes(0);
        });

        it('should handle auto restore with valid shares', async () => {
            const defaultShare = {
                shareId: 'share1',
                volumeId: 'volume1',
                linkId: 'link1',
                type: ShareType.default,
            };
            const deviceShare = {
                shareId: 'share2',
                volumeId: 'volume1',
                linkId: 'link1',
                type: ShareType.device,
            };
            const shareIds = [defaultShare.shareId, deviceShare.shareId];

            when(mockedDebounceRequest)
                .calledWith(queryListShareAutoRestore(), expect.any(AbortSignal))
                .mockResolvedValueOnce({ ShareIDs: shareIds });

            when(mockedGetShareWithKey)
                .calledWith(expect.any(AbortSignal), defaultShare.shareId)
                .mockResolvedValueOnce(defaultShare);
            when(mockedGetShareWithKey)
                .calledWith(expect.any(AbortSignal), deviceShare.shareId)
                .mockResolvedValueOnce(deviceShare);

            const { result } = renderHook(() => useSanitization());
            await result.current.autoRestore(mockedShowAutoRestoreModal);

            expect(mockedRestoreVolumes).toHaveBeenCalledWith(expect.any(AbortSignal), {
                preloadedAddressesKeys: mockAddressesKeys,
                preloadedLockedShares: [
                    {
                        defaultShares: [defaultShare],
                        devices: [deviceShare],
                        photos: [],
                    },
                ],
            });

            expect(mockedShowAutoRestoreModal).toHaveBeenCalledTimes(1);
        });

        it('should handle non-1000 response code from list shares API', async () => {
            when(mockedDebounceRequest)
                .calledWith(queryListShareAutoRestore(), expect.any(AbortSignal))
                .mockResolvedValueOnce({ ShareIDs: [], Code: 2000 });

            const { result } = renderHook(() => useSanitization());
            await result.current.autoRestore(mockedShowAutoRestoreModal);

            expect(mockedQuerySendShareAutoRestoreStatus).not.toHaveBeenCalled();
            expect(mockedShowAutoRestoreModal).toHaveBeenCalledTimes(0);
        });

        it('should handle failed getShareWithKey requests', async () => {
            const defaultShare = {
                shareId: 'share1',
                volumeId: 'volume1',
                linkId: 'link1',
                type: ShareType.default,
            };
            const shareIds = [defaultShare.shareId, 'share2'];

            when(mockedDebounceRequest)
                .calledWith(queryListShareAutoRestore(), expect.any(AbortSignal))
                .mockResolvedValueOnce({ ShareIDs: shareIds });

            when(mockedGetShareWithKey)
                .calledWith(expect.any(AbortSignal), defaultShare.shareId)
                .mockResolvedValueOnce(defaultShare);

            when(mockedGetShareWithKey)
                .calledWith(expect.any(AbortSignal), 'share2')
                .mockRejectedValueOnce(new Error('Failed to fetch share meta'));

            const { result } = renderHook(() => useSanitization());
            await result.current.autoRestore(mockedShowAutoRestoreModal);

            expect(mockedQuerySendShareAutoRestoreStatus).toHaveBeenCalledWith({
                Shares: [{ ShareID: 'share2', Reason: 'Failed to fetch share meta' }],
            });
            expect(mockedRestoreVolumes).toHaveBeenCalledWith(expect.any(AbortSignal), {
                preloadedAddressesKeys: mockAddressesKeys,
                preloadedLockedShares: [{ defaultShares: [defaultShare], devices: [], photos: [] }],
            });
            expect(mockedShowAutoRestoreModal).toHaveBeenCalledTimes(1);
        });

        it('should handle failed restoreVolumes', async () => {
            const defaultShare = {
                shareId: 'share1',
                volumeId: 'volume1',
                linkId: 'link1',
                type: ShareType.default,
            };
            const shareIds = [defaultShare.shareId];

            when(mockedRestoreVolumes)
                .calledWith(expect.any(AbortSignal), {
                    preloadedAddressesKeys: mockAddressesKeys,
                    preloadedLockedShares: [{ defaultShares: [defaultShare], devices: [], photos: [] }],
                })
                .mockResolvedValue(false);

            when(mockedDebounceRequest)
                .calledWith(queryListShareAutoRestore(), expect.any(AbortSignal))
                .mockResolvedValueOnce({ ShareIDs: shareIds });

            when(mockedGetShareWithKey)
                .calledWith(expect.any(AbortSignal), defaultShare.shareId)
                .mockResolvedValueOnce(defaultShare);

            const { result } = renderHook(() => useSanitization());
            await result.current.autoRestore(mockedShowAutoRestoreModal);

            expect(mockedQuerySendShareAutoRestoreStatus).toHaveBeenCalledWith({
                Shares: [{ ShareID: defaultShare.shareId, Reason: 'Failed to auto restore' }],
            });
            expect(mockedShowAutoRestoreModal).toHaveBeenCalledTimes(0);
        });

        it('should handle volumes without default shares', async () => {
            const photosShare = {
                shareId: 'share1',
                volumeId: 'volume1',
                linkId: 'link1',
                type: ShareType.photos,
            };
            const deviceShare = {
                shareId: 'share2',
                volumeId: 'volume1',
                linkId: 'link1',
                type: ShareType.device,
            };
            const shareIds = [photosShare.shareId, deviceShare.shareId];

            when(mockedDebounceRequest)
                .calledWith(queryListShareAutoRestore(), expect.any(AbortSignal))
                .mockResolvedValueOnce({ ShareIDs: shareIds });

            when(mockedGetShareWithKey)
                .calledWith(expect.any(AbortSignal), photosShare.shareId)
                .mockResolvedValueOnce(photosShare);
            when(mockedGetShareWithKey)
                .calledWith(expect.any(AbortSignal), deviceShare.shareId)
                .mockResolvedValueOnce(deviceShare);

            const { result } = renderHook(() => useSanitization());
            await result.current.autoRestore(mockedShowAutoRestoreModal);

            expect(mockedQuerySendShareAutoRestoreStatus).toHaveBeenCalledWith({
                Shares: [
                    { ShareID: photosShare.shareId, Reason: 'No associated default share' },
                    { ShareID: deviceShare.shareId, Reason: 'No associated default share' },
                ],
            });
            expect(mockedShowAutoRestoreModal).toHaveBeenCalledTimes(0);
        });

        it('should report shares as failed when address keys fetch fails', async () => {
            const defaultShare = {
                shareId: 'share1',
                volumeId: 'volume1',
                linkId: 'link1',
                type: ShareType.default,
            };
            const shareIds = [defaultShare.shareId];

            when(mockedDebounceRequest)
                .calledWith(queryListShareAutoRestore(), expect.any(AbortSignal))
                .mockResolvedValueOnce({ ShareIDs: shareIds });
            when(mockedGetShareWithKey)
                .calledWith(expect.any(AbortSignal), defaultShare.shareId)
                .mockResolvedValueOnce(defaultShare);

            mockedGetAddressKeys.mockRejectedValueOnce(new Error('Failed to fetch keys'));

            const { result } = renderHook(() => useSanitization());
            await result.current.autoRestore(mockedShowAutoRestoreModal);

            expect(mockedRestoreVolumes).not.toHaveBeenCalled();
            expect(mockedQuerySendShareAutoRestoreStatus).toHaveBeenCalledWith({
                Shares: [{ ShareID: defaultShare.shareId, Reason: 'Failed to fetch keys' }],
            });
            expect(mockedShowAutoRestoreModal).toHaveBeenCalledTimes(0);
        });

        it('should report unknown error when restore fails with non-Error', async () => {
            const defaultShare = {
                shareId: 'share1',
                volumeId: 'volume1',
                linkId: 'link1',
                type: ShareType.default,
            };

            when(mockedDebounceRequest)
                .calledWith(queryListShareAutoRestore(), expect.any(AbortSignal))
                .mockResolvedValueOnce({ ShareIDs: [defaultShare.shareId], Code: 1000 });

            when(mockedGetShareWithKey)
                .calledWith(expect.any(AbortSignal), defaultShare.shareId)
                .mockResolvedValueOnce(defaultShare);

            mockedRestoreVolumes.mockRejectedValueOnce(new Error('Restore volume random error'));

            const { result } = renderHook(() => useSanitization());
            await result.current.autoRestore(mockedShowAutoRestoreModal);

            expect(mockedQuerySendShareAutoRestoreStatus).toHaveBeenCalledWith({
                Shares: [{ ShareID: defaultShare.shareId, Reason: 'Restore volume random error' }],
            });
            expect(mockedShowAutoRestoreModal).toHaveBeenCalledTimes(0);
        });

        it('should group shares by volume correctly', async () => {
            const defaultShare = {
                shareId: 'share1',
                volumeId: 'volume1',
                linkId: 'link1',
                type: ShareType.default,
            };
            const photosShare = {
                shareId: 'share2',
                volumeId: 'volume1',
                linkId: 'link1',
                type: ShareType.photos,
            };
            const deviceShare = {
                shareId: 'share3',
                volumeId: 'volume1',
                linkId: 'link1',
                type: ShareType.device,
            };

            const defaultShare2 = {
                shareId: 'share1',
                volumeId: 'volume2',
                linkId: 'link1',
                type: ShareType.default,
            };
            const shareIds = [defaultShare.shareId, photosShare.shareId, deviceShare.shareId, defaultShare2.shareId];

            when(mockedDebounceRequest)
                .calledWith(queryListShareAutoRestore(), expect.any(AbortSignal))
                .mockResolvedValueOnce({ ShareIDs: shareIds });

            when(mockedGetShareWithKey)
                .calledWith(expect.any(AbortSignal), defaultShare.shareId)
                .mockResolvedValueOnce(defaultShare);

            when(mockedGetShareWithKey)
                .calledWith(expect.any(AbortSignal), photosShare.shareId)
                .mockResolvedValueOnce(photosShare);

            when(mockedGetShareWithKey)
                .calledWith(expect.any(AbortSignal), deviceShare.shareId)
                .mockResolvedValueOnce(deviceShare);

            when(mockedGetShareWithKey)
                .calledWith(expect.any(AbortSignal), defaultShare2.shareId)
                .mockResolvedValueOnce(defaultShare2);

            const { result } = renderHook(() => useSanitization());
            await result.current.autoRestore(mockedShowAutoRestoreModal);

            expect(mockedRestoreVolumes).toHaveBeenCalledWith(expect.any(AbortSignal), {
                preloadedAddressesKeys: mockAddressesKeys,
                preloadedLockedShares: [
                    {
                        defaultShares: [defaultShare],
                        devices: [deviceShare],
                        photos: [photosShare],
                    },
                    { defaultShares: [defaultShare2], devices: [], photos: [] },
                ],
            });
            expect(mockedQuerySendShareAutoRestoreStatus).toHaveBeenCalledTimes(0);
            expect(mockedShowAutoRestoreModal).toHaveBeenCalledTimes(1);
        });
    });

    describe('restoreHashKey', () => {
        it('should restore missing node hash keys', async () => {
            const nodesWithMissingHashKey = [
                {
                    LinkID: 'link1',
                    ShareID: 'share1',
                    VolumeID: 'volume1',
                    PGPArmoredEncryptedNodeHashKey: '',
                },
            ];

            const linkPrivateKey = 'linkPrivateKey';
            const generatedHashKey = { NodeHashKey: 'newHashKey' };

            when(mockedDebounceRequest)
                .calledWith(queryListNodesWithMissingNodeHashKeys(), expect.any(AbortSignal))
                .mockResolvedValueOnce({ NodesWithMissingNodeHashKey: nodesWithMissingHashKey });

            when(mockedGetPrivateKey)
                .calledWith(
                    expect.any(AbortSignal),
                    nodesWithMissingHashKey[0].ShareID,
                    nodesWithMissingHashKey[0].LinkID
                )
                .mockResolvedValueOnce(linkPrivateKey);

            mockedGenerateNodeHashKey.mockResolvedValueOnce(generatedHashKey);

            when(mockedDebounceRequest)
                .calledWith(
                    querySendNodesWithNewNodeHashKeys({
                        NodesWithMissingNodeHashKey: [
                            {
                                ...nodesWithMissingHashKey[0],
                                PGPArmoredEncryptedNodeHashKey: generatedHashKey.NodeHashKey,
                            },
                        ],
                    }),
                    expect.any(AbortSignal)
                )
                .mockResolvedValueOnce({ Code: 1000 });

            const { result } = renderHook(() => useSanitization());
            await result.current.restoreHashKey();

            expect(mockedGenerateNodeHashKey).toHaveBeenCalledWith(linkPrivateKey, linkPrivateKey);
            expect(mockedDebounceRequest).toHaveBeenCalledWith(
                querySendNodesWithNewNodeHashKeys({
                    NodesWithMissingNodeHashKey: [
                        {
                            ...nodesWithMissingHashKey[0],
                            PGPArmoredEncryptedNodeHashKey: generatedHashKey.NodeHashKey,
                        },
                    ],
                }),
                expect.any(AbortSignal)
            );
        });

        it('should handle empty list of nodes with missing hash keys', async () => {
            when(mockedDebounceRequest)
                .calledWith(queryListNodesWithMissingNodeHashKeys(), expect.any(AbortSignal))
                .mockResolvedValueOnce({ NodesWithMissingNodeHashKey: [] });

            const { result } = renderHook(() => useSanitization());
            await result.current.restoreHashKey();

            expect(mockedGenerateNodeHashKey).not.toHaveBeenCalled();
            expect(mockedDebounceRequest).toHaveBeenCalledTimes(1);
        });
    });
});
