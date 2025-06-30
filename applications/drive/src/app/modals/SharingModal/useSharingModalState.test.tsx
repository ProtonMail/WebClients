import { waitFor } from '@testing-library/react';
import { act, renderHook } from '@testing-library/react-hooks';
import { when } from 'jest-when';

import { useUser } from '@proton/account/user/hooks';
import { useNotifications } from '@proton/components';
import { MemberRole, useDrive } from '@proton/drive/index';
import useLoading from '@proton/hooks/useLoading';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';
import { SHARE_URL_PERMISSIONS } from '@proton/shared/lib/drive/permissions';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import { type UserModel } from '@proton/shared/lib/interfaces';

import { useDriveEventManager, useShareURLView } from '../../store';
import { useSdkErrorHandler } from '../../utils/errorHandling/sdkErrorHandler';
import { useSharingModalState } from './useSharingModalState';

const mockVolumeId = 'volume-123';
const mockShareId = 'share-456';
const mockLinkId = 'link-789';
const mockNodeUid = 'volume-123~link-789';
const mockInvitationUid = 'invitation-uid-456';
const mockInvitationId = 'invitation-id-789';
const mockEmail = 'test@example.com';

const mockProps = {
    volumeId: mockVolumeId,
    shareId: mockShareId,
    linkId: mockLinkId,
    onClose: jest.fn(),
    open: true,
    onExit: jest.fn(),
};

const mockShareResult = {
    protonInvitations: [
        {
            invitationUid: mockInvitationUid,
            inviteeEmail: 'invitee@proton.me',
            permissions: 1,
        },
    ],
    nonProtonInvitations: [
        {
            invitationUid: 'non-proton-uid',
            inviteeEmail: 'external@example.com',
            permissions: 1,
        },
    ],
    publicLink: {
        token: 'public-token',
        url: 'https://example.com/public-link',
    },
    members: [
        {
            inviteeEmail: 'member@proton.me',
            permissions: 2,
        },
    ],
};

const mockNodeInfo = {
    ok: true,
    value: {
        keyAuthor: {
            ok: true,
            value: 'owner@proton.me',
        },
    },
};

const mockUser = {
    Email: 'user@proton.me',
    DisplayName: 'Test User',
} as unknown as UserModel;

const mockedCreateNotification = jest.fn();
const mockedUseUser = jest.mocked(useUser);
const mockedUseNotifications = jest.mocked(useNotifications);
const mockedUseDrive = jest.mocked(useDrive);
const mockedUseLoading = jest.mocked(useLoading);
const mockedUseDriveEventManager = jest.mocked(useDriveEventManager);
const mockedUseShareURLView = jest.mocked(useShareURLView);
const mockedUseSdkErrorHandler = jest.mocked(useSdkErrorHandler);
const mockedGetAppHref = jest.mocked(getAppHref);
const mockedTextToClipboard = jest.mocked(textToClipboard);

jest.mock('@proton/account/user/hooks');
jest.mock('@proton/components');
jest.mock('@proton/drive/index');
jest.mock('@proton/hooks/useLoading');
jest.mock('@proton/shared/lib/apps/helper');
jest.mock('@proton/shared/lib/helpers/browser');
jest.mock('../../store');
jest.mock('../../utils/errorHandling/sdkErrorHandler');

describe('useSharingModalState', () => {
    const mockDrive = {
        getSharingInfo: jest.fn(),
        getNode: jest.fn(),
        unshareNode: jest.fn(),
        shareNode: jest.fn(),
        resendInvitation: jest.fn(),
    };

    const mockInternal = {
        generateNodeUid: jest.fn(),
        splitInvitationUid: jest.fn(),
    };

    const mockEvents = {
        pollEvents: {
            volumes: jest.fn(),
        },
    };

    const mockShareURLView = {
        customPassword: 'test-password',
        initialExpiration: 1750940276,
        name: 'Test File',
        deleteLink: jest.fn(),
        stopSharing: jest.fn(),
        sharedLink: 'https://example.com/shared',
        sharedInfoMessage: 'Info message',
        permissions: SHARE_URL_PERMISSIONS.VIEWER,
        updatePermissions: jest.fn(),
        hasSharedLink: true,
        errorMessage: '',
        loadingMessage: '',
        confirmationMessage: '',
        hasGeneratedPasswordIncluded: false,
        createSharedLink: jest.fn(),
        saveSharedLink: jest.fn(),
        isSaving: false,
        isDeleting: false,
        isCreating: false,
        isShareUrlLoading: false,
        isShareUrlEnabled: true,
    };

    const mockHandleError = jest.fn();

    beforeEach(() => {
        mockedUseUser.mockReturnValue([mockUser, false]);
        mockedUseNotifications.mockReturnValue({
            createNotification: mockedCreateNotification,
        } as any);
        mockedUseDrive.mockReturnValue({
            drive: mockDrive,
            internal: mockInternal,
        } as any);
        const mockedWithLoading = jest.fn((promise) => promise);
        const mockedSetIsLoading = jest.fn();
        mockedUseLoading.mockReturnValue([false, mockedWithLoading, mockedSetIsLoading]);
        mockedUseDriveEventManager.mockReturnValue(mockEvents as any);
        mockedUseShareURLView.mockReturnValue(mockShareURLView);
        mockedUseSdkErrorHandler.mockReturnValue({
            handleError: mockHandleError,
        } as any);

        when(mockInternal.generateNodeUid).calledWith(mockVolumeId, mockLinkId).mockReturnValue(mockNodeUid);

        when(mockDrive.getSharingInfo).calledWith(mockNodeUid).mockResolvedValue(mockShareResult);

        when(mockDrive.getNode).calledWith(mockNodeUid).mockResolvedValue(mockNodeInfo);

        when(mockInternal.splitInvitationUid)
            .calledWith(mockInvitationUid)
            .mockReturnValue({ invitationId: mockInvitationId });

        mockedGetAppHref.mockReturnValue('https://example.com/invite-link');
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should initialize with default values and fetch sharing info', async () => {
        const { result, waitFor } = renderHook(() => useSharingModalState(mockProps));

        await waitFor(() => {
            expect(result.current.members).toEqual(mockShareResult.members);
            expect(result.current.protonInvitations).toEqual(mockShareResult.protonInvitations);
            expect(result.current.nonProtonInvitations).toEqual(mockShareResult.nonProtonInvitations);
            expect(result.current.ownerEmail).toBe('owner@proton.me');
            expect(result.current.isShared).toBe(true);
        });

        expect(mockDrive.getSharingInfo).toHaveBeenCalledWith(mockNodeUid);
        expect(mockDrive.getNode).toHaveBeenCalledWith(mockNodeUid);
    });

    it('should handle overridden name listener', async () => {
        const registerListener = jest.fn();
        const overriddenName = 'Overridden Name';

        renderHook(() =>
            useSharingModalState({
                ...mockProps,
                registerOverriddenNameListener: registerListener,
            })
        );

        await waitFor(() => expect(registerListener).toHaveBeenCalled());

        const listener = registerListener.mock.calls[0][0];

        act(() => {
            listener(overriddenName);
        });
    });

    it('should unshare node and show notification for member', async () => {
        const updatedShareResult = {
            ...mockShareResult,
            members: [],
        };

        when(mockDrive.unshareNode)
            .calledWith(mockNodeUid, { users: [mockEmail] })
            .mockResolvedValue(updatedShareResult);

        const { result } = renderHook(() => useSharingModalState(mockProps));

        await waitFor(() => {
            expect(result.current.members).toEqual(mockShareResult.members);
        });

        await act(async () => {
            await result.current.unshareNode(mockEmail);
        });

        expect(mockDrive.unshareNode).toHaveBeenCalledWith(mockNodeUid, { users: [mockEmail] });
        expect(mockedCreateNotification).toHaveBeenCalledWith({
            type: 'info',
            text: 'Access updated',
        });
        expect(mockEvents.pollEvents.volumes).toHaveBeenCalledWith(mockVolumeId);
    });

    it('should unshare node and show notification for invitation', async () => {
        const memberEmail = mockShareResult.members[0].inviteeEmail;
        const updatedShareResult = {
            ...mockShareResult,
            members: [],
        };

        when(mockDrive.unshareNode)
            .calledWith(mockNodeUid, { users: [memberEmail] })
            .mockResolvedValue(updatedShareResult);

        const { result } = renderHook(() => useSharingModalState(mockProps));

        await waitFor(() => {
            expect(result.current.members).toEqual(mockShareResult.members);
        });

        await act(async () => {
            await result.current.unshareNode(memberEmail);
        });

        expect(mockedCreateNotification).toHaveBeenCalledWith({
            type: 'info',
            text: 'Access for the member removed',
        });
    });

    it('should update share node', async () => {
        const shareNodeSettings = {
            users: [{ email: 'new@example.com', role: MemberRole.Viewer }],
        };
        const updatedShareResult = {
            ...mockShareResult,
            members: [...mockShareResult.members, { inviteeEmail: 'new@example.com', permissions: 1 }],
        };

        when(mockDrive.shareNode).calledWith(mockNodeUid, shareNodeSettings).mockResolvedValue(updatedShareResult);

        const { result } = renderHook(() => useSharingModalState(mockProps));

        await waitFor(() => {
            expect(result.current.members).toEqual(mockShareResult.members);
        });

        await act(async () => {
            await result.current.updateShareNode(shareNodeSettings);
        });

        expect(mockDrive.shareNode).toHaveBeenCalledWith(mockNodeUid, shareNodeSettings);
        expect(mockedCreateNotification).toHaveBeenCalledWith({
            type: 'info',
            text: 'Access updated and shared',
        });
        expect(mockEvents.pollEvents.volumes).toHaveBeenCalledWith(mockVolumeId);
    });

    it('should resend invitation', async () => {
        const { result } = renderHook(() => useSharingModalState(mockProps));

        await waitFor(() => {
            expect(result.current.members).toEqual(mockShareResult.members);
        });

        await act(async () => {
            await result.current.resendInvitation(mockInvitationUid);
        });

        expect(mockDrive.resendInvitation).toHaveBeenCalledWith(mockNodeUid, mockInvitationUid);
        expect(mockedCreateNotification).toHaveBeenCalledWith({
            type: 'info',
            text: "Invitation's email was sent again",
        });
    });

    it('should copy invitation link', async () => {
        const { result } = renderHook(() => useSharingModalState(mockProps));

        await waitFor(() => {
            expect(result.current.members).toEqual(mockShareResult.members);
        });

        await act(async () => {
            result.current.copyInvitationLink(mockInvitationUid, mockEmail);
        });

        expect(mockInternal.splitInvitationUid).toHaveBeenCalledWith(mockInvitationUid);
        expect(mockedGetAppHref).toHaveBeenCalledWith(
            `/${mockVolumeId}/${mockLinkId}?invitation=${mockInvitationId}&email=${mockEmail}`,
            APPS.PROTONDRIVE
        );
        expect(mockedTextToClipboard).toHaveBeenCalledWith('https://example.com/invite-link');
        expect(mockedCreateNotification).toHaveBeenCalledWith({
            text: 'Invite link copied',
        });
    });

    it('should stop sharing with poll events', async () => {
        const { result } = renderHook(() => useSharingModalState(mockProps));

        await waitFor(() => {
            expect(result.current.members).toEqual(mockShareResult.members);
        });

        await act(async () => {
            await result.current.stopSharing();
        });

        expect(mockShareURLView.stopSharing).toHaveBeenCalled();
        expect(mockEvents.pollEvents.volumes).toHaveBeenCalledWith(mockVolumeId);
    });

    it('should determine owner display name correctly', async () => {
        const userAsOwner = {
            Email: 'owner@proton.me',
            DisplayName: 'Owner Display Name',
        } as unknown as UserModel;

        mockedUseUser.mockReturnValue([userAsOwner, false]);

        const { result } = renderHook(() => useSharingModalState(mockProps));

        await waitFor(() => {
            expect(result.current.ownerDisplayName).toBe('Owner Display Name');
            expect(result.current.ownerEmail).toBe('owner@proton.me');
        });
    });

    it('should handle case when node info is not ok', async () => {
        const failedNodeInfo = {
            ok: false,
            value: null,
        };

        when(mockDrive.getNode).calledWith(mockNodeUid).mockResolvedValue(failedNodeInfo);

        const { result } = renderHook(() => useSharingModalState(mockProps));

        await waitFor(() => {
            expect(result.current.ownerEmail).toBeUndefined();
        });
    });

    it('should determine isShared correctly for empty sharing info', async () => {
        const emptyShareResult = {
            protonInvitations: [],
            nonProtonInvitations: [],
            publicLink: undefined,
            members: [],
        };

        when(mockDrive.getSharingInfo).calledWith(mockNodeUid).mockResolvedValue(emptyShareResult);
        mockedUseShareURLView.mockReturnValueOnce({ ...mockShareURLView, hasSharedLink: false });

        const { result } = renderHook(() => useSharingModalState(mockProps));
        await waitFor(() => {
            expect(result.current.isShared).toBe(false);
        });
    });

    describe('error handling', () => {
        it('should handle error when unshareNode fails', async () => {
            const error = new Error('Unshare failed');
            when(mockDrive.unshareNode)
                .calledWith(mockNodeUid, { users: [mockEmail] })
                .mockRejectedValue(error);

            const { result } = renderHook(() => useSharingModalState(mockProps));

            await waitFor(() => {
                expect(result.current.members).toEqual(mockShareResult.members);
            });

            await act(async () => {
                await result.current.unshareNode(mockEmail);
            });

            expect(mockHandleError).toHaveBeenCalledWith(error, 'Failed to unshare node', { nodeUid: mockNodeUid });
        });

        it('should handle error when updateShareNode fails', async () => {
            const error = new Error('Share node failed');
            const shareNodeSettings = {
                users: [{ email: 'new@example.com', role: MemberRole.Viewer }],
            };

            when(mockDrive.shareNode).calledWith(mockNodeUid, shareNodeSettings).mockRejectedValue(error);

            const { result } = renderHook(() => useSharingModalState(mockProps));

            await waitFor(() => {
                expect(result.current.members).toEqual(mockShareResult.members);
            });

            await act(async () => {
                await result.current.updateShareNode(shareNodeSettings);
            });

            expect(mockHandleError).toHaveBeenCalledWith(error, 'Failed to update share node', {
                nodeUid: mockNodeUid,
            });
        });

        it('should handle error when resendInvitation fails', async () => {
            const error = new Error('Resend invitation failed');
            when(mockDrive.resendInvitation).calledWith(mockNodeUid, mockInvitationUid).mockRejectedValue(error);

            const { result } = renderHook(() => useSharingModalState(mockProps));

            await waitFor(() => {
                expect(result.current.members).toEqual(mockShareResult.members);
            });

            await act(async () => {
                await result.current.resendInvitation(mockInvitationUid);
            });

            expect(mockHandleError).toHaveBeenCalledWith(error, 'Failed to resend invitation', {
                nodeUid: mockNodeUid,
                invitationUid: mockInvitationUid,
            });
        });

        it('should handle error when getSharingInfo fails', async () => {
            const error = new Error('Get sharing info failed');
            when(mockDrive.getSharingInfo).calledWith(mockNodeUid).mockRejectedValue(error);

            renderHook(() => useSharingModalState(mockProps));

            await waitFor(() => {
                expect(mockHandleError).toHaveBeenCalledWith(error, 'Failed to fetch sharing info', {
                    nodeUid: mockNodeUid,
                });
            });
        });

        it('should handle error when getNode fails', async () => {
            const error = new Error('Get node failed');
            when(mockDrive.getNode).calledWith(mockNodeUid).mockRejectedValue(error);

            renderHook(() => useSharingModalState(mockProps));

            await waitFor(() => {
                expect(mockHandleError).toHaveBeenCalledWith(error, 'Failed to fetch node', { nodeUid: mockNodeUid });
            });
        });
    });
});
