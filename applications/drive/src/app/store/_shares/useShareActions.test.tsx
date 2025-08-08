import { renderHook } from '@testing-library/react-hooks';
import { verifyAllWhenMocksCalled, when } from 'jest-when';

import { queryMigrateLegacyShares } from '@proton/shared/lib/api/drive/share';
import { getEncryptedSessionKey } from '@proton/shared/lib/calendar/crypto/encrypt';
import { HTTP_STATUS_CODE } from '@proton/shared/lib/constants';
import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';

import { useDebouncedRequest } from '../_api';
import { useLink } from '../_links';
import useLinksState from '../_links/useLinksState';
import useVolumesState from '../_volumes/useVolumesState';
import useDefaultShare from './useDefaultShare';
import useShare from './useShare';
import useShareActions from './useShareActions';

jest.mock('@proton/components', () => ({
    usePreventLeave: jest.fn().mockReturnValue({ preventLeave: jest.fn() }),
}));

jest.mock('../_api');
const mockedDebounceRequest = jest.fn().mockResolvedValue(true);
jest.mocked(useDebouncedRequest).mockReturnValue(mockedDebounceRequest);

jest.mock('./useShare');
const mockedGetShareSessionKey = jest.fn().mockResolvedValue('sessionKey');
jest.mocked(useShare).mockReturnValue({
    ...jest.requireActual('./useShare'),
    getShare: jest.fn().mockImplementation((_, shareId) => ({
        rootLinkId: 'rootLinkId',
        shareId,
    })),
    getShareCreatorKeys: jest.fn().mockResolvedValue({
        privateKey: 'privateKey',
    }),
    getShareSessionKey: mockedGetShareSessionKey,
});

jest.mock('./useDefaultShare');
const mockedGetDefaultPhotosShare = jest.fn();
jest.mocked(useDefaultShare).mockReturnValue({
    getDefaultPhotosShare: mockedGetDefaultPhotosShare,
} as any);

jest.mock('../_volumes/useVolumesState');
const mockSetVolumeShareIds = jest.fn();
jest.mocked(useVolumesState).mockReturnValue({
    setVolumeShareIds: mockSetVolumeShareIds,
} as any);

jest.mock('../_links');
const mockedGetLink = jest.fn().mockImplementation(() => ({
    parentLinkId: 'parentLinkId',
    encryptedName: 'encryptedName',
    corruptedLink: false,
}));
const mockedGetPrivateKey = jest.fn().mockResolvedValue('privateKey');
jest.mocked(useLink).mockReturnValue({
    getLink: mockedGetLink,
    getLinkPrivateKey: mockedGetPrivateKey,
} as any);

jest.mock('@proton/shared/lib/api/drive/share');
const mockedQueryLegacyShares = jest.mocked(queryMigrateLegacyShares);

jest.mock('@proton/shared/lib/calendar/crypto/encrypt');
const mockedGetEncryptedSessionKey = jest.mocked(getEncryptedSessionKey);

const mockedRemoveLinkForMigration = jest.fn();
jest.mock('../_links/useLinksState');

jest.mocked(useLinksState).mockImplementation(
    () =>
        ({
            removeLinkForMigration: mockedRemoveLinkForMigration,
        }) as any
);

describe('useShareActions', () => {
    let originalConsoleWarn: Console['warn'];
    beforeAll(() => {
        // Store the original console.warn
        originalConsoleWarn = console.warn;

        // Mock console.warn
        jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    beforeEach(() => {
        jest.clearAllMocks();
        mockedGetDefaultPhotosShare.mockResolvedValue({
            volumeId: 'photos-volume-id',
        });
    });

    afterAll(() => {
        // Restore the original console.warn
        console.warn = originalConsoleWarn;
        verifyAllWhenMocksCalled();
    });

    describe('migrateShares', () => {
        it('should run migrateShares normally', async () => {
            const PassphraseNodeKeyPacket = new Uint8Array([3, 2, 32, 32]);
            mockedDebounceRequest.mockResolvedValueOnce({ ShareIDs: ['shareId'] });
            mockedGetEncryptedSessionKey.mockResolvedValue(PassphraseNodeKeyPacket);
            const { result } = renderHook(() => useShareActions());
            await result.current.migrateShares();
            expect(mockedQueryLegacyShares).toHaveBeenCalledWith({
                PassphraseNodeKeyPackets: [
                    { ShareID: 'shareId', PassphraseNodeKeyPacket: uint8ArrayToBase64String(PassphraseNodeKeyPacket) },
                ],
            });
            expect(mockedRemoveLinkForMigration).toHaveBeenCalledWith('shareId', 'rootLinkId');
        });

        it('migrateShares with 120 shares', async () => {
            const PassphraseNodeKeyPacket = new Uint8Array([3, 2, 32, 32]);
            const shareIds = [];
            for (let i = 1; i <= 120; i++) {
                shareIds.push('string' + i);
            }
            mockedDebounceRequest.mockResolvedValueOnce({ ShareIDs: shareIds });
            mockedGetEncryptedSessionKey.mockResolvedValue(PassphraseNodeKeyPacket);
            const { result } = renderHook(() => useShareActions());
            await result.current.migrateShares();

            expect(mockedQueryLegacyShares).toHaveBeenCalledWith({
                PassphraseNodeKeyPackets: shareIds.slice(0, 50).map((shareId) => ({
                    ShareID: shareId,
                    PassphraseNodeKeyPacket: uint8ArrayToBase64String(PassphraseNodeKeyPacket),
                })),
            });
            expect(mockedQueryLegacyShares).toHaveBeenCalledWith({
                PassphraseNodeKeyPackets: shareIds.slice(50, 100).map((shareId) => ({
                    ShareID: shareId,
                    PassphraseNodeKeyPacket: uint8ArrayToBase64String(PassphraseNodeKeyPacket),
                })),
            });
            expect(mockedQueryLegacyShares).toHaveBeenCalledWith({
                PassphraseNodeKeyPackets: shareIds.slice(100, 120).map((shareId) => ({
                    ShareID: shareId,
                    PassphraseNodeKeyPacket: uint8ArrayToBase64String(PassphraseNodeKeyPacket),
                })),
            });
            expect(mockedRemoveLinkForMigration.mock.calls).toEqual(shareIds.map((shareId) => [shareId, 'rootLinkId']));
        });

        it('stop migration when server respond 404 for unmigrated endpoint', async () => {
            const PassphraseNodeKeyPacket = new Uint8Array([3, 2, 32, 32]);
            const shareIds = [];
            for (let i = 1; i <= 120; i++) {
                shareIds.push('string' + i);
            }
            mockedDebounceRequest.mockRejectedValueOnce({ data: { Code: HTTP_STATUS_CODE.NOT_FOUND } });
            mockedGetEncryptedSessionKey.mockResolvedValue(PassphraseNodeKeyPacket);
            const { result } = renderHook(() => useShareActions());
            await result.current.migrateShares();

            expect(mockedQueryLegacyShares).not.toHaveBeenCalled();
        });

        it('stop migration when server respond 404 for migrate post endpoint', async () => {
            const PassphraseNodeKeyPacket = new Uint8Array([3, 2, 32, 32]);
            const shareIds = [];
            for (let i = 1; i <= 120; i++) {
                shareIds.push('string' + i);
            }
            mockedDebounceRequest.mockResolvedValueOnce({ ShareIDs: shareIds });
            mockedDebounceRequest.mockRejectedValueOnce({ data: { Code: HTTP_STATUS_CODE.NOT_FOUND } });
            mockedGetEncryptedSessionKey.mockResolvedValue(PassphraseNodeKeyPacket);
            const { result } = renderHook(() => useShareActions());
            await result.current.migrateShares();

            expect(mockedQueryLegacyShares).toHaveBeenCalledWith({
                PassphraseNodeKeyPackets: shareIds.slice(0, 50).map((shareId) => ({
                    ShareID: shareId,
                    PassphraseNodeKeyPacket: uint8ArrayToBase64String(PassphraseNodeKeyPacket),
                })),
            });
            expect(mockedQueryLegacyShares).not.toHaveBeenCalledWith({
                PassphraseNodeKeyPackets: shareIds.slice(50, 100).map((shareId) => ({
                    ShareID: shareId,
                    PassphraseNodeKeyPacket: uint8ArrayToBase64String(PassphraseNodeKeyPacket),
                })),
            });
        });

        it('should send non-decryptable shares to api', async () => {
            const PassphraseNodeKeyPacket = new Uint8Array([3, 2, 32, 32]);
            const shareIds = [];
            for (let i = 1; i <= 120; i++) {
                shareIds.push('string' + i);
            }
            mockedDebounceRequest.mockResolvedValueOnce({ ShareIDs: ['shareId', 'corrupted'] });
            when(mockedGetShareSessionKey)
                .calledWith(expect.any(AbortSignal), 'corrupted')
                .mockRejectedValue(undefined);
            mockedGetEncryptedSessionKey.mockResolvedValue(PassphraseNodeKeyPacket);
            const { result } = renderHook(() => useShareActions());
            await result.current.migrateShares();

            expect(mockedQueryLegacyShares).toHaveBeenCalledWith({
                PassphraseNodeKeyPackets: [
                    { ShareID: 'shareId', PassphraseNodeKeyPacket: uint8ArrayToBase64String(PassphraseNodeKeyPacket) },
                ],
                UnreadableShareIDs: ['corrupted'],
            });
        });
    });
});
