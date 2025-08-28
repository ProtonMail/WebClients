import { renderHook } from '@testing-library/react';

import { splitInvitationUid, splitNodeUid } from '@proton/drive/index';

import { useInvitationsActions } from '../../../store/_actions/useInvitationsActions';
import { useLink } from '../../../store/_links';
import { getActionEventManager } from '../../../utils/ActionEventManager/ActionEventManager';
import { ActionEventName } from '../../../utils/ActionEventManager/ActionEventManagerTypes';
import { legacyTimestampToDate } from '../../../utils/sdk/legacyTime';
import { ItemType, useSharedWithMeListingStore } from '../../../zustand/sections/sharedWithMeListing.store';
import { useSharedInfoBatcher } from '../legacy/useLegacyDirectSharingInfo';
import { useLegacyInvitationsActions } from './useLegacyInvitationsActions';

jest.mock('@proton/drive/index', () => ({
    splitInvitationUid: jest.fn(),
    splitNodeUid: jest.fn(),
}));

jest.mock('../../../store/_actions/useInvitationsActions', () => ({
    useInvitationsActions: jest.fn(),
}));

jest.mock('../../../store/_links', () => ({
    useLink: jest.fn(),
}));

jest.mock('../../../utils/ActionEventManager/ActionEventManager', () => ({
    getActionEventManager: jest.fn(),
}));

jest.mock('../../../utils/sdk/legacyTime', () => ({
    legacyTimestampToDate: jest.fn(),
}));

jest.mock('../../../zustand/sections/sharedWithMeListing.store', () => ({
    useSharedWithMeListingStore: {
        getState: jest.fn(),
    },
    ItemType: {
        INVITATION: 'invitation',
        DIRECT_SHARE: 'direct_share',
    },
}));

jest.mock('../legacy/useLegacyDirectSharingInfo', () => ({
    useSharedInfoBatcher: jest.fn(),
}));

const mockLegacyAcceptInvitation = jest.fn();
const mockLegacyRejectInvitation = jest.fn();
const mockEventManagerEmit = jest.fn();
const mockLoadSharedInfo = jest.fn();
const mockGetSharedWithMeItem = jest.fn();
const mockSetSharedWithMeItem = jest.fn();
const mockGetLink = jest.fn();

const mockEventManager = {
    emit: mockEventManagerEmit,
};

const mockSharedWithMeItem = {
    itemType: ItemType.INVITATION,
    name: 'Test Album',
    type: 'album',
    mediaType: 'image/jpeg',
    thumbnailId: 'thumb-1',
    size: 1024,
};

const mockSharedInfo = {
    sharedOn: 1234567890,
    sharedBy: 'test@example.com',
};

describe('useLegacyInvitationsActions', () => {
    beforeEach(() => {
        jest.mocked(useInvitationsActions).mockReturnValue({
            acceptInvitation: mockLegacyAcceptInvitation,
            rejectInvitation: mockLegacyRejectInvitation,
        } as any);

        jest.mocked(getActionEventManager).mockReturnValue(mockEventManager as any);

        jest.mocked(useSharedInfoBatcher).mockReturnValue({
            loadSharedInfo: mockLoadSharedInfo,
        } as any);

        jest.mocked(useLink).mockReturnValue({
            getLink: mockGetLink,
        } as any);

        jest.mocked(useSharedWithMeListingStore.getState).mockReturnValue({
            getSharedWithMeItem: mockGetSharedWithMeItem,
            setSharedWithMeItem: mockSetSharedWithMeItem,
        } as any);

        jest.mocked(splitInvitationUid).mockReturnValue({
            shareId: 'share-id-1',
            invitationId: 'invitation-id-1',
        });

        jest.mocked(splitNodeUid).mockReturnValue({
            nodeId: 'node-id-1',
            volumeId: 'volume-id-1',
        });

        jest.mocked(legacyTimestampToDate).mockReturnValue(new Date('2023-01-01'));

        mockGetLink.mockResolvedValue({
            isAnonymous: false,
            signatureIssues: {},
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('acceptLegacyInvitation', () => {
        it('should accept legacy album invitation and update store', async () => {
            const { result } = renderHook(() => useLegacyInvitationsActions());
            const uid = 'node-uid-1';
            const invitationUid = 'invitation-uid-1';

            mockGetSharedWithMeItem.mockReturnValue(mockSharedWithMeItem);
            mockLegacyAcceptInvitation.mockImplementation(async (signal, invitationId, preloadLink, onSuccess) => {
                const mockResult = {
                    shareId: 'share-id-1',
                    linkId: 'link-id-1',
                    volumeId: 'volume-id-1',
                };
                onSuccess?.(mockResult);
                return mockResult;
            });
            mockLoadSharedInfo.mockImplementation((shareId, callback) => {
                callback(mockSharedInfo);
            });

            await result.current.acceptLegacyInvitation(uid, invitationUid);

            expect(splitInvitationUid).toHaveBeenCalledWith(invitationUid);
            expect(mockLegacyAcceptInvitation).toHaveBeenCalledWith(
                expect.any(AbortSignal),
                'invitation-id-1',
                true,
                expect.any(Function)
            );
            expect(mockGetSharedWithMeItem).toHaveBeenCalledWith(uid);
            expect(mockGetLink).toHaveBeenCalledWith(expect.any(AbortSignal), 'link-id-1', 'share-id-1');
            expect(mockLoadSharedInfo).toHaveBeenCalledWith('share-id-1', expect.any(Function));
            expect(mockSetSharedWithMeItem).toHaveBeenCalledWith({
                nodeUid: uid,
                name: mockSharedWithMeItem.name,
                type: mockSharedWithMeItem.type,
                mediaType: mockSharedWithMeItem.mediaType,
                itemType: ItemType.DIRECT_SHARE,
                thumbnailId: mockSharedWithMeItem.thumbnailId,
                size: mockSharedWithMeItem.size,
                directShare: {
                    sharedOn: new Date('2023-01-01'),
                    sharedBy: mockSharedInfo.sharedBy,
                },
                haveSignatureIssues: false,
                legacy: {
                    linkId: 'node-id-1',
                    shareId: 'share-id-1',
                    volumeId: 'volume-id-1',
                },
            });
        });

        it('should handle missing shared info during legacy acceptance', async () => {
            const { result } = renderHook(() => useLegacyInvitationsActions());
            const uid = 'node-uid-1';
            const invitationUid = 'invitation-uid-1';
            const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

            mockGetSharedWithMeItem.mockReturnValue(mockSharedWithMeItem);
            mockLegacyAcceptInvitation.mockImplementation(async (signal, invitationId, preloadLink, onSuccess) => {
                const mockResult = {
                    shareId: 'share-id-1',
                    linkId: 'link-id-1',
                    volumeId: 'volume-id-1',
                };
                onSuccess?.(mockResult);
                return mockResult;
            });
            mockLoadSharedInfo.mockImplementation((shareId, callback) => {
                callback(null);
            });

            await result.current.acceptLegacyInvitation(uid, invitationUid);

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                'The shared with me node entity is missing sharing info. It could be race condition and means it is probably not shared anymore.',
                { uid, shareId: 'share-id-1' }
            );
            expect(mockSetSharedWithMeItem).not.toHaveBeenCalled();

            consoleWarnSpy.mockRestore();
        });

        it('should handle non-invitation item type during legacy acceptance', async () => {
            const { result } = renderHook(() => useLegacyInvitationsActions());
            const uid = 'node-uid-1';
            const invitationUid = 'invitation-uid-1';

            mockGetSharedWithMeItem.mockReturnValue({
                ...mockSharedWithMeItem,
                itemType: ItemType.DIRECT_SHARE,
            });
            mockLegacyAcceptInvitation.mockImplementation(async (signal, invitationId, preloadLink, onSuccess) => {
                const mockResult = {
                    shareId: 'share-id-1',
                    linkId: 'link-id-1',
                    volumeId: 'volume-id-1',
                };
                onSuccess?.(mockResult);
                return mockResult;
            });

            await result.current.acceptLegacyInvitation(uid, invitationUid);

            expect(mockLoadSharedInfo).not.toHaveBeenCalled();
            expect(mockSetSharedWithMeItem).not.toHaveBeenCalled();
        });

        it('should handle errors during legacy invitation acceptance', async () => {
            const { result } = renderHook(() => useLegacyInvitationsActions());
            const uid = 'node-uid-1';
            const invitationUid = 'invitation-uid-1';
            const error = new Error('Legacy API Error');

            mockLegacyAcceptInvitation.mockRejectedValue(error);

            await expect(result.current.acceptLegacyInvitation(uid, invitationUid)).rejects.toThrow('Legacy API Error');
        });
    });

    describe('rejectLegacyInvitation', () => {
        it('should reject legacy album invitation', async () => {
            const { result } = renderHook(() => useLegacyInvitationsActions());
            const mockShowConfirmModal = jest.fn();
            const uid = 'node-uid-1';
            const invitationUid = 'invitation-uid-1';

            mockLegacyRejectInvitation.mockResolvedValue(undefined);

            await result.current.rejectLegacyInvitation(mockShowConfirmModal, {
                uid,
                invitationUid,
            });

            expect(splitInvitationUid).toHaveBeenCalledWith(invitationUid);
            expect(mockLegacyRejectInvitation).toHaveBeenCalledWith(expect.any(AbortSignal), {
                showConfirmModal: mockShowConfirmModal,
                invitationId: 'invitation-id-1',
                onSuccess: expect.any(Function),
            });
        });

        it('should emit rejection event on successful legacy rejection', async () => {
            const { result } = renderHook(() => useLegacyInvitationsActions());
            const mockShowConfirmModal = jest.fn();
            const uid = 'node-uid-1';
            const invitationUid = 'invitation-uid-1';

            mockLegacyRejectInvitation.mockImplementation(async (signal, options) => {
                options.onSuccess?.();
            });

            await result.current.rejectLegacyInvitation(mockShowConfirmModal, {
                uid,
                invitationUid,
            });

            expect(mockEventManagerEmit).toHaveBeenCalledWith({
                type: ActionEventName.REJECT_INVITATIONS,
                uids: [uid],
            });
        });
    });
});
