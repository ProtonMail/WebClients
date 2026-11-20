import { renderHook } from '@testing-library/react';

import { queryMigrateLegacyShares } from '@proton/shared/lib/api/drive/share';
import { getEncryptedSessionKey } from '@proton/shared/lib/calendar/crypto/encrypt';
import { HTTP_STATUS_CODE } from '@proton/shared/lib/constants';

import { verifyAllWhenMocksCalled, when } from '../../../utils/tests/when';
import useDebouncedRequest from '../_api/useDebouncedRequest';
import useLink from '../_links/useLink';
import useLinksState from '../_links/useLinksState';
import useVolumesState from '../_volumes/useVolumesState';
import { useDefaultShare } from './useDefaultShare';
import useShare from './useShare';
import useShareActions from './useShareActions';

vi.mock('@proton/components/hooks/usePreventLeave', () => ({
    __esModule: true,
    default: vi.fn().mockReturnValue({ preventLeave: vi.fn() }),
}));

vi.mock('../_api/useDebouncedRequest');
const mockedDebounceRequest = vi.fn().mockResolvedValue(true);
vi.mocked(useDebouncedRequest).mockReturnValue(mockedDebounceRequest);

vi.mock('./useShare');
const mockedGetShareSessionKey = vi.fn().mockResolvedValue('sessionKey');
vi.mocked(useShare).mockReturnValue({
    ...(await vi.importActual('./useShare')),
    getShare: vi.fn().mockImplementation((_, shareId) => ({
        rootLinkId: 'rootLinkId',
        shareId,
    })),
    getShareCreatorKeys: vi.fn().mockResolvedValue({
        privateKey: 'privateKey',
    }),
    getShareSessionKey: mockedGetShareSessionKey,
});

vi.mock('./useDefaultShare');
const mockedGetDefaultPhotosShare = vi.fn();
vi.mocked(useDefaultShare).mockReturnValue({
    getDefaultPhotosShare: mockedGetDefaultPhotosShare,
} as any);

vi.mock('../_volumes/useVolumesState');
const mockSetVolumeShareIds = vi.fn();
vi.mocked(useVolumesState).mockReturnValue({
    setVolumeShareIds: mockSetVolumeShareIds,
} as any);

vi.mock('../_links/useLink');
const mockedGetLink = vi.fn().mockImplementation(() => ({
    parentLinkId: 'parentLinkId',
    encryptedName: 'encryptedName',
    corruptedLink: false,
}));
const mockedGetPrivateKey = vi.fn().mockResolvedValue('privateKey');
vi.mocked(useLink).mockReturnValue({
    getLink: mockedGetLink,
    getLinkPrivateKey: mockedGetPrivateKey,
} as any);

vi.mock('@proton/shared/lib/api/drive/share');
const mockedQueryLegacyShares = vi.mocked(queryMigrateLegacyShares);

vi.mock('@proton/shared/lib/calendar/crypto/encrypt');
const mockedGetEncryptedSessionKey = vi.mocked(getEncryptedSessionKey);

const mockedRemoveLinkForMigration = vi.fn();
vi.mock('../_links/useLinksState');

vi.mocked(useLinksState).mockImplementation(
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
        vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    beforeEach(() => {
        vi.clearAllMocks();
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
                    { ShareID: 'shareId', PassphraseNodeKeyPacket: PassphraseNodeKeyPacket.toBase64() },
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
                    PassphraseNodeKeyPacket: PassphraseNodeKeyPacket.toBase64(),
                })),
            });
            expect(mockedQueryLegacyShares).toHaveBeenCalledWith({
                PassphraseNodeKeyPackets: shareIds.slice(50, 100).map((shareId) => ({
                    ShareID: shareId,
                    PassphraseNodeKeyPacket: PassphraseNodeKeyPacket.toBase64(),
                })),
            });
            expect(mockedQueryLegacyShares).toHaveBeenCalledWith({
                PassphraseNodeKeyPackets: shareIds.slice(100, 120).map((shareId) => ({
                    ShareID: shareId,
                    PassphraseNodeKeyPacket: PassphraseNodeKeyPacket.toBase64(),
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
                    PassphraseNodeKeyPacket: PassphraseNodeKeyPacket.toBase64(),
                })),
            });
            expect(mockedQueryLegacyShares).not.toHaveBeenCalledWith({
                PassphraseNodeKeyPackets: shareIds.slice(50, 100).map((shareId) => ({
                    ShareID: shareId,
                    PassphraseNodeKeyPacket: PassphraseNodeKeyPacket.toBase64(),
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
                    { ShareID: 'shareId', PassphraseNodeKeyPacket: PassphraseNodeKeyPacket.toBase64() },
                ],
                UnreadableShareIDs: ['corrupted'],
            });
        });
    });
});
