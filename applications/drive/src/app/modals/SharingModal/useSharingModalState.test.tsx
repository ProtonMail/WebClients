import { waitFor } from '@testing-library/react';
import { act, renderHook } from '@testing-library/react-hooks';
import { when } from 'jest-when';

import { useUser } from '@proton/account/user/hooks';
import { useNotifications } from '@proton/components';
import { MemberRole, generateNodeUid, splitInvitationUid, splitNodeUid } from '@proton/drive/index';
import { getBusDriver } from '@proton/drive/internal/BusDriver';
import useLoading from '@proton/hooks/useLoading';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import type { UserModel } from '@proton/shared/lib/interfaces';

import { useFlagsDriveDocsPublicSharing } from '../../flags/useFlagsDriveDocsPublicSharing';
import { useSdkErrorHandler } from '../../utils/errorHandling/useSdkErrorHandler';
import { type DirectMember, MemberType } from './interfaces';
import { useSharingModalState } from './useSharingModalState';

const mockVolumeId = 'volume-123';
const mockLinkId = 'link-789';
const mockUid = `${mockVolumeId}~${mockLinkId}`;
const mockShareId = 'share-456';
const mockNodeUid = 'volume-123~link-789';
const mockInvitationUid = 'invitation-uid-456';
const mockInvitationId = 'invitation-id-789';
const mockEmail = 'test@example.com';

const mockDrive = {
    getSharingInfo: jest.fn(),
    getNode: jest.fn(),
    unshareNode: jest.fn(),
    shareNode: jest.fn(),
    resendInvitation: jest.fn(),
};

const mockProps = {
    nodeUid: mockUid,
    shareId: mockShareId,
    drive: mockDrive as any,
    onClose: jest.fn(),
    open: true,
    onExit: jest.fn(),
};

const mockShareResult = {
    protonInvitations: [
        {
            uid: mockInvitationUid,
            inviteeEmail: 'invitee@proton.me',
            role: MemberRole.Viewer,
        },
    ],
    nonProtonInvitations: [
        {
            uid: 'non-proton-uid',
            inviteeEmail: 'external@example.com',
            role: MemberRole.Viewer,
        },
    ],
    publicLink: {
        token: 'public-token',
        url: 'https://example.com/public-link',
        role: MemberRole.Viewer,
        customPassword: 'test-password',
        expirationTime: new Date('2025-04-25T12:17:56.000Z'),
    },
    members: [
        {
            uid: 'member-uid',
            inviteeEmail: 'member@proton.me',
            role: MemberRole.Editor,
        },
    ],
};

const mockNodeInfo = {
    ok: true,
    value: {
        name: 'Test File',
        type: 1,
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
const mockedGenerateNodeUid = jest.mocked(generateNodeUid);
const mockedSplitInvitationUid = jest.mocked(splitInvitationUid);
const mockedSplitNodeUid = jest.mocked(splitNodeUid);
const mockedUseLoading = jest.mocked(useLoading);
const mockedUseFlagsDriveDocsPublicSharing = jest.mocked(useFlagsDriveDocsPublicSharing);
const mockedUseSdkErrorHandler = jest.mocked(useSdkErrorHandler);
const mockedGetAppHref = jest.mocked(getAppHref);
const mockedTextToClipboard = jest.mocked(textToClipboard);

jest.mock('@proton/account/user/hooks');
jest.mock('@proton/components');
jest.mock('@proton/drive/index');
jest.mock('@proton/hooks/useLoading');
jest.mock('@proton/shared/lib/apps/helper');
jest.mock('@proton/shared/lib/helpers/browser');
jest.mock('../../flags/useFlagsDriveDocsPublicSharing');
jest.mock('../../utils/errorHandling/useSdkErrorHandler');
jest.mock('@proton/drive/internal/BusDriver');
jest.mock('@proton/mail/store/contactEmails/hooks', () => ({
    useContactEmails: jest.fn(() => [[]]),
}));

const { useContactEmails } = require('@proton/mail/store/contactEmails/hooks');
const mockedUseContactEmails = jest.mocked(useContactEmails);

const expectedDirectMembers: DirectMember[] = [
    {
        uid: 'member-uid',
        inviteeEmail: 'member@proton.me',
        role: MemberRole.Editor,
        type: MemberType.Member,
    },
    {
        uid: mockInvitationUid,
        inviteeEmail: 'invitee@proton.me',
        role: MemberRole.Viewer,
        type: MemberType.ProtonInvitation,
    },
    {
        uid: 'non-proton-uid',
        inviteeEmail: 'external@example.com',
        role: MemberRole.Viewer,
        type: MemberType.ProtonInvitation,
    },
];

describe('useSharingModalState', () => {
    const mockBusEmit = jest.fn();

    const mockHandleError = jest.fn();

    beforeEach(() => {
        mockedUseUser.mockReturnValue([mockUser, false]);
        mockedUseNotifications.mockReturnValue({
            createNotification: mockedCreateNotification,
        } as any);
        const mockedWithLoading = jest.fn((promise) => promise);
        const mockedSetIsLoading = jest.fn();
        mockedUseLoading.mockReturnValue([false, mockedWithLoading, mockedSetIsLoading]);
        jest.mocked(getBusDriver).mockReturnValue({ emit: mockBusEmit } as any);
        when(mockedSplitNodeUid).calledWith(mockUid).mockReturnValue({ volumeId: mockVolumeId, nodeId: mockLinkId });
        mockedUseFlagsDriveDocsPublicSharing.mockReturnValue({
            isDocsPublicSharingEnabled: true,
        });
        mockedUseSdkErrorHandler.mockReturnValue({
            handleError: mockHandleError,
        } as any);

        when(mockedGenerateNodeUid).calledWith(mockVolumeId, mockLinkId).mockReturnValue(mockNodeUid);

        when(mockDrive.getSharingInfo).calledWith(mockNodeUid).mockResolvedValue(mockShareResult);

        when(mockDrive.getNode).calledWith(mockNodeUid).mockResolvedValue(mockNodeInfo);

        when(mockedSplitInvitationUid)
            .calledWith(mockInvitationUid)
            .mockReturnValue({ shareId: mockShareId, invitationId: mockInvitationId });

        mockedGetAppHref.mockReturnValue('https://example.com/invite-link');
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should initialize with default values and fetch sharing info', async () => {
        const { result } = renderHook(() => useSharingModalState(mockProps));

        await waitFor(() => {
            expect(result.current.directMembers).toEqual([
                {
                    uid: 'member-uid',
                    inviteeEmail: 'member@proton.me',
                    role: MemberRole.Editor,
                    type: MemberType.Member,
                },
                {
                    uid: mockInvitationUid,
                    inviteeEmail: 'invitee@proton.me',
                    role: MemberRole.Viewer,
                    type: MemberType.ProtonInvitation,
                },
                {
                    uid: 'non-proton-uid',
                    inviteeEmail: 'external@example.com',
                    role: MemberRole.Viewer,
                    type: MemberType.ProtonInvitation,
                },
            ]);
            expect(result.current.ownerEmail).toBe('owner@proton.me');
            expect(result.current.isShared).toBe(true);
        });

        expect(mockDrive.getSharingInfo).toHaveBeenCalledWith(mockNodeUid);
        expect(mockDrive.getNode).toHaveBeenCalledWith(mockNodeUid);
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
            expect(result.current.directMembers).toEqual([
                {
                    uid: 'member-uid',
                    inviteeEmail: 'member@proton.me',
                    role: MemberRole.Editor,
                    type: MemberType.Member,
                },
                {
                    uid: mockInvitationUid,
                    inviteeEmail: 'invitee@proton.me',
                    role: MemberRole.Viewer,
                    type: MemberType.ProtonInvitation,
                },
                {
                    uid: 'non-proton-uid',
                    inviteeEmail: 'external@example.com',
                    role: MemberRole.Viewer,
                    type: MemberType.ProtonInvitation,
                },
            ]);
        });

        await act(async () => {
            await result.current.actions.unshareNode(mockEmail);
        });

        expect(mockDrive.unshareNode).toHaveBeenCalledWith(mockNodeUid, { users: [mockEmail] });
        expect(mockedCreateNotification).toHaveBeenCalledWith({
            type: 'info',
            text: 'Access updated',
        });
        expect(mockBusEmit).toHaveBeenCalled();
    });

    it('should unshare node and show notification for member', async () => {
        const memberEmail = 'member@proton.me';
        const updatedShareResult = {
            ...mockShareResult,
            members: [],
        };

        when(mockDrive.unshareNode)
            .calledWith(mockNodeUid, { users: [memberEmail] })
            .mockResolvedValue(updatedShareResult);

        const { result } = renderHook(() => useSharingModalState(mockProps));

        await waitFor(() => {
            expect(result.current.directMembers).toEqual(expectedDirectMembers);
        });

        await act(async () => {
            await result.current.actions.unshareNode(memberEmail);
        });

        expect(mockDrive.unshareNode).toHaveBeenCalledWith(mockNodeUid, { users: [memberEmail] });
        expect(mockedCreateNotification).toHaveBeenCalledWith({
            type: 'info',
            text: 'Access for the member removed',
        });
        expect(mockBusEmit).toHaveBeenCalled();
    });

    it('should update share node with direct sharing', async () => {
        jest.useFakeTimers();

        const shareNodeSettings = {
            users: [{ email: 'new@example.com', role: MemberRole.Viewer }],
        };
        const updatedShareResult = {
            ...mockShareResult,
            members: [
                ...mockShareResult.members,
                { uid: 'new-member-uid', inviteeEmail: 'new@example.com', role: MemberRole.Viewer },
            ],
        };

        when(mockDrive.shareNode).calledWith(mockNodeUid, shareNodeSettings).mockResolvedValue(updatedShareResult);

        const { result } = renderHook(() => useSharingModalState(mockProps));

        await waitFor(() => {
            expect(result.current.directMembers).toEqual(expectedDirectMembers);
        });

        await act(async () => {
            await result.current.actions.updateShareDirect(shareNodeSettings);
        });

        expect(mockDrive.shareNode).toHaveBeenCalledWith(mockNodeUid, shareNodeSettings);
        jest.runAllTimers();
        expect(mockedCreateNotification).toHaveBeenCalledWith({
            text: '"Test File" shared',
        });
        expect(mockBusEmit).toHaveBeenCalled();

        jest.useRealTimers();
    });

    it('should update public link and show notification', async () => {
        const publicLinkSettings = {
            role: MemberRole.Editor,
            customPassword: 'new-password',
            expiration: new Date('2025-12-31T23:59:59.000Z'),
        };
        const updatedShareResult = {
            ...mockShareResult,
            publicLink: {
                ...mockShareResult.publicLink,
                role: MemberRole.Editor,
                customPassword: 'new-password',
                expirationTime: new Date('2025-12-31T23:59:59.000Z'),
            },
        };

        when(mockDrive.shareNode)
            .calledWith(mockNodeUid, {
                publicLink: publicLinkSettings,
            })
            .mockResolvedValue(updatedShareResult);

        const { result } = renderHook(() => useSharingModalState(mockProps));

        await waitFor(() => {
            expect(result.current.publicLink).toEqual({
                role: MemberRole.Viewer,
                url: 'https://example.com/public-link',
                customPassword: 'test-password',
                expirationTime: new Date('2025-04-25T12:17:56.000Z'),
            });
        });

        await act(async () => {
            await result.current.actions.updateSharePublic(publicLinkSettings);
        });

        expect(mockDrive.shareNode).toHaveBeenCalledWith(mockNodeUid, {
            publicLink: publicLinkSettings,
        });
        expect(mockedCreateNotification).toHaveBeenCalledWith({
            text: 'Public link access updated',
        });
        expect(mockBusEmit).toHaveBeenCalled();
    });

    it('should update public link settings without role change', async () => {
        const publicLinkSettings = {
            customPassword: 'new-password',
        };
        const updatedShareResult = {
            ...mockShareResult,
            publicLink: {
                ...mockShareResult.publicLink,
                customPassword: 'new-password',
            },
        };

        when(mockDrive.shareNode)
            .calledWith(mockNodeUid, {
                publicLink: {
                    role: MemberRole.Viewer,
                    customPassword: 'new-password',
                    expiration: new Date('2025-04-25T12:17:56.000Z'),
                },
            })
            .mockResolvedValue(updatedShareResult);

        const { result } = renderHook(() => useSharingModalState(mockProps));

        await waitFor(() => {
            expect(result.current.publicLink).toBeDefined();
        });

        await act(async () => {
            await result.current.actions.updateSharePublic(publicLinkSettings);
        });

        expect(mockedCreateNotification).toHaveBeenCalledWith({
            text: 'Your settings have been changed successfully',
        });
    });

    it('should create public link', async () => {
        const mockShareResultWithoutPublicLink = {
            ...mockShareResult,
            publicLink: undefined,
        };
        const updatedShareResult = {
            ...mockShareResult,
            publicLink: {
                token: 'new-public-token',
                url: 'https://example.com/new-public-link',
                role: MemberRole.Viewer,
            },
        };

        when(mockDrive.getSharingInfo).calledWith(mockNodeUid).mockResolvedValue(mockShareResultWithoutPublicLink);
        when(mockDrive.shareNode)
            .calledWith(mockNodeUid, { publicLink: { role: MemberRole.Viewer } })
            .mockResolvedValue(updatedShareResult);

        const { result } = renderHook(() => useSharingModalState(mockProps));

        await waitFor(() => {
            expect(result.current.directMembers).toEqual(expectedDirectMembers);
        });

        await act(async () => {
            await result.current.actions.createSharePublic();
        });

        expect(mockDrive.shareNode).toHaveBeenCalledWith(mockNodeUid, {
            publicLink: { role: MemberRole.Viewer },
        });
        expect(mockBusEmit).toHaveBeenCalled();
    });

    it('should resend invitation', async () => {
        const { result } = renderHook(() => useSharingModalState(mockProps));

        await waitFor(() => {
            expect(result.current.directMembers).toEqual(expectedDirectMembers);
        });

        await act(async () => {
            await result.current.actions.resendInvitation(mockInvitationUid);
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
            expect(result.current.directMembers).toEqual(expectedDirectMembers);
        });

        await act(async () => {
            result.current.actions.copyInvitationLink(mockInvitationUid, mockEmail);
        });

        expect(mockedGetAppHref).toHaveBeenCalledWith(
            `/${mockVolumeId}/${mockLinkId}?invitation=${mockInvitationId}&email=${mockEmail}`,
            APPS.PROTONDRIVE
        );
        expect(mockedTextToClipboard).toHaveBeenCalled();
        expect(mockedCreateNotification).toHaveBeenCalledWith({
            text: 'Invite link copied',
        });
    });

    it('should unshare public link', async () => {
        const updatedShareResult = {
            ...mockShareResult,
            publicLink: undefined,
        };

        when(mockDrive.unshareNode)
            .calledWith(mockNodeUid, { publicLink: 'remove' })
            .mockResolvedValue(updatedShareResult);

        const { result } = renderHook(() => useSharingModalState(mockProps));

        await waitFor(() => {
            expect(result.current.directMembers).toEqual(expectedDirectMembers);
        });

        await act(async () => {
            await result.current.actions.unsharePublic();
        });

        expect(mockDrive.unshareNode).toHaveBeenCalledWith(mockNodeUid, { publicLink: 'remove' });
        expect(mockedCreateNotification).toHaveBeenCalledWith({
            text: 'The link to your item was deleted',
        });
        expect(mockBusEmit).toHaveBeenCalled();
    });

    it('should expose public link properties correctly', async () => {
        const { result } = renderHook(() => useSharingModalState(mockProps));

        await waitFor(() => {
            expect(result.current.publicLink).toEqual({
                role: MemberRole.Viewer,
                url: 'https://example.com/public-link',
                customPassword: 'test-password',
                expirationTime: new Date('2025-04-25T12:17:56.000Z'),
            });
        });
    });

    it('should stop sharing with poll events', async () => {
        const updatedShareResult = {
            protonInvitations: [],
            nonProtonInvitations: [],
            publicLink: undefined,
            members: [],
        };

        when(mockDrive.unshareNode).calledWith(mockNodeUid).mockResolvedValue(updatedShareResult);

        const { result } = renderHook(() => useSharingModalState(mockProps));

        await waitFor(() => {
            expect(result.current.directMembers).toEqual(expectedDirectMembers);
        });

        await act(async () => {
            await result.current.actions.stopSharing();
        });

        expect(mockDrive.unshareNode).toHaveBeenCalledWith(mockNodeUid);
        expect(mockedCreateNotification).toHaveBeenCalledWith({
            text: 'You stopped sharing this item',
        });
        expect(mockBusEmit).toHaveBeenCalled();
    });

    it('should determine owner display name correctly when user is admin', async () => {
        const userAsOwner = {
            Email: 'owner@proton.me',
            DisplayName: 'Owner Display Name',
        } as unknown as UserModel;

        const nodeInfoWithAdminRole = {
            ok: true,
            value: {
                name: 'Test File',
                type: 1,
                keyAuthor: {
                    ok: true,
                    value: 'owner@proton.me',
                },
                directRole: MemberRole.Admin,
            },
        };

        mockedUseUser.mockReturnValue([userAsOwner, false]);
        when(mockDrive.getNode).calledWith(mockNodeUid).mockResolvedValue(nodeInfoWithAdminRole);

        const { result } = renderHook(() => useSharingModalState(mockProps));

        await waitFor(() => {
            expect(result.current.ownerDisplayName).toBe('Owner Display Name');
            expect(result.current.ownerEmail).toBe('owner@proton.me');
        });
    });

    it('should not set owner display name when user is not admin', async () => {
        const userAsNonAdmin = {
            Email: 'viewer@proton.me',
            DisplayName: 'Viewer Display Name',
        } as unknown as UserModel;

        const nodeInfoWithViewerRole = {
            ok: true,
            value: {
                name: 'Test File',
                type: 1,
                keyAuthor: {
                    ok: true,
                    value: 'owner@proton.me',
                },
                directRole: MemberRole.Viewer,
            },
        };

        mockedUseUser.mockReturnValue([userAsNonAdmin, false]);
        when(mockDrive.getNode).calledWith(mockNodeUid).mockResolvedValue(nodeInfoWithViewerRole);

        const { result } = renderHook(() => useSharingModalState(mockProps));

        await waitFor(() => {
            expect(result.current.ownerDisplayName).toBeUndefined();
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

    it('should set owner display name from contacts when owner email is found in contacts', async () => {
        const contactEmails = [
            { Email: 'owner@proton.me', Name: 'Owner Contact Name' },
            { Email: 'other@proton.me', Name: 'Other User' },
        ];

        const nodeInfoWithDifferentOwner = {
            ok: true,
            value: {
                name: 'Test File',
                type: 1,
                keyAuthor: {
                    ok: true,
                    value: 'owner@proton.me',
                },
            },
        };

        mockedUseContactEmails.mockReturnValue([contactEmails]);
        mockedUseUser.mockReturnValue([mockUser, false]);
        when(mockDrive.getNode).calledWith(mockNodeUid).mockResolvedValue(nodeInfoWithDifferentOwner);

        const { result } = renderHook(() => useSharingModalState(mockProps));

        await waitFor(() => {
            expect(result.current.ownerDisplayName).toBe('Owner Contact Name');
            expect(result.current.ownerEmail).toBe('owner@proton.me');
        });
    });

    it('should not set owner display name when owner email is not found in contacts', async () => {
        const contactEmails = [{ Email: 'other@proton.me', Name: 'Other User' }];

        const nodeInfoWithDifferentOwner = {
            ok: true,
            value: {
                name: 'Test File',
                type: 1,
                keyAuthor: {
                    ok: true,
                    value: 'unknown@proton.me',
                },
            },
        };

        mockedUseContactEmails.mockReturnValue([contactEmails]);
        mockedUseUser.mockReturnValue([mockUser, false]);
        when(mockDrive.getNode).calledWith(mockNodeUid).mockResolvedValue(nodeInfoWithDifferentOwner);

        const { result } = renderHook(() => useSharingModalState(mockProps));

        await waitFor(() => {
            expect(result.current.ownerDisplayName).toBeUndefined();
            expect(result.current.ownerEmail).toBe('unknown@proton.me');
        });
    });

    it('should not set owner display name when contactEmails is empty', async () => {
        const nodeInfoWithDifferentOwner = {
            ok: true,
            value: {
                name: 'Test File',
                type: 1,
                keyAuthor: {
                    ok: true,
                    value: 'unknown@proton.me',
                },
            },
        };

        mockedUseContactEmails.mockReturnValue([[]]);
        mockedUseUser.mockReturnValue([mockUser, false]);
        when(mockDrive.getNode).calledWith(mockNodeUid).mockResolvedValue(nodeInfoWithDifferentOwner);

        const { result } = renderHook(() => useSharingModalState(mockProps));

        await waitFor(() => {
            expect(result.current.ownerDisplayName).toBeUndefined();
            expect(result.current.ownerEmail).toBe('unknown@proton.me');
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
                expect(result.current.directMembers).toEqual([
                    {
                        uid: 'member-uid',
                        inviteeEmail: 'member@proton.me',
                        role: MemberRole.Editor,
                        type: MemberType.Member,
                    },
                    {
                        uid: mockInvitationUid,
                        inviteeEmail: 'invitee@proton.me',
                        role: MemberRole.Viewer,
                        type: MemberType.ProtonInvitation,
                    },
                    {
                        uid: 'non-proton-uid',
                        inviteeEmail: 'external@example.com',
                        role: MemberRole.Viewer,
                        type: MemberType.ProtonInvitation,
                    },
                ]);
            });

            await act(async () => {
                await result.current.actions.unshareNode(mockEmail);
            });

            expect(mockHandleError).toHaveBeenCalledWith(error, {
                fallbackMessage: 'Failed to unshare node',
                extra: { nodeUid: mockNodeUid },
            });
        });

        it('should handle error when updateShareDirect fails', async () => {
            const error = new Error('Share node failed');
            const shareNodeSettings = {
                users: [{ email: 'new@example.com', role: MemberRole.Viewer }],
            };

            when(mockDrive.shareNode).calledWith(mockNodeUid, shareNodeSettings).mockRejectedValue(error);

            const { result } = renderHook(() => useSharingModalState(mockProps));

            await waitFor(() => {
                expect(result.current.directMembers).toEqual(expectedDirectMembers);
            });

            await act(async () => {
                await result.current.actions.updateShareDirect(shareNodeSettings);
            });

            expect(mockHandleError).toHaveBeenCalledWith(error, {
                fallbackMessage: 'Failed to update direct share node',
                extra: {
                    nodeUid: mockNodeUid,
                },
            });
        });

        it('should handle error when updateSharePublic fails', async () => {
            const error = new Error('Update public share failed');
            const publicLinkSettings = {
                role: MemberRole.Editor,
            };

            when(mockDrive.shareNode)
                .calledWith(mockNodeUid, {
                    publicLink: {
                        role: MemberRole.Editor,
                        expiration: new Date('2025-04-25T12:17:56.000Z'),
                        customPassword: 'test-password',
                    },
                })
                .mockRejectedValue(error);

            const { result } = renderHook(() => useSharingModalState(mockProps));

            await waitFor(() => {
                expect(result.current.publicLink).toBeDefined();
            });

            await act(async () => {
                await result.current.actions.updateSharePublic(publicLinkSettings);
            });

            expect(mockHandleError).toHaveBeenCalledWith(error, {
                fallbackMessage: 'Failed to update public share node',
                extra: {
                    nodeUid: mockNodeUid,
                },
            });
        });

        it('should handle error when createSharePublic fails', async () => {
            const error = new Error('Create public share failed');
            when(mockDrive.shareNode)
                .calledWith(mockNodeUid, {
                    publicLink: { role: MemberRole.Viewer },
                })
                .mockRejectedValue(error);

            const { result } = renderHook(() => useSharingModalState(mockProps));

            await waitFor(() => {
                expect(result.current.publicLink).toBeDefined();
            });

            await act(async () => {
                await result.current.actions.createSharePublic();
            });

            expect(mockHandleError).toHaveBeenCalledWith(error, {
                fallbackMessage: 'Failed to create public share node',
                extra: {
                    nodeUid: mockNodeUid,
                },
            });
        });

        it('should handle error when resendInvitation fails', async () => {
            const error = new Error('Resend invitation failed');
            when(mockDrive.resendInvitation).calledWith(mockNodeUid, mockInvitationUid).mockRejectedValue(error);

            const { result } = renderHook(() => useSharingModalState(mockProps));

            await waitFor(() => {
                expect(result.current.directMembers).toEqual(expectedDirectMembers);
            });

            await act(async () => {
                await result.current.actions.resendInvitation(mockInvitationUid);
            });

            expect(mockHandleError).toHaveBeenCalledWith(error, {
                fallbackMessage: 'Failed to resend invitation',
                extra: {
                    nodeUid: mockNodeUid,
                    invitationUid: mockInvitationUid,
                },
            });
        });

        it('should handle error when getSharingInfo fails', async () => {
            const error = new Error('Get sharing info failed');
            when(mockDrive.getSharingInfo).calledWith(mockNodeUid).mockRejectedValue(error);

            renderHook(() => useSharingModalState(mockProps));

            await waitFor(() => {
                expect(mockHandleError).toHaveBeenCalledWith(error, {
                    fallbackMessage: 'Failed to fetch sharing info',
                    extra: {
                        nodeUid: mockNodeUid,
                    },
                });
            });
        });

        it('should handle error when getNode fails', async () => {
            const error = new Error('Get node failed');
            when(mockDrive.getNode).calledWith(mockNodeUid).mockRejectedValue(error);

            renderHook(() => useSharingModalState(mockProps));

            await waitFor(() => {
                expect(mockHandleError).toHaveBeenCalledWith(error, {
                    fallbackMessage: 'Failed to fetch node',
                    extra: { nodeUid: mockNodeUid },
                });
            });
        });

        it('should handle error when unsharePublic fails', async () => {
            const error = new Error('Unshare public failed');
            when(mockDrive.unshareNode).calledWith(mockNodeUid, { publicLink: 'remove' }).mockRejectedValue(error);

            const { result } = renderHook(() => useSharingModalState(mockProps));

            await waitFor(() => {
                expect(result.current.directMembers).toEqual(expectedDirectMembers);
            });

            await act(async () => {
                await result.current.actions.unsharePublic();
            });

            expect(mockHandleError).toHaveBeenCalledWith(error, {
                fallbackMessage: 'The link to your item failed to be deleted',
                extra: {
                    nodeUid: mockNodeUid,
                },
            });
        });

        it('should handle error when stopSharing fails', async () => {
            const error = new Error('Stop sharing failed');
            when(mockDrive.unshareNode).calledWith(mockNodeUid).mockRejectedValue(error);

            const { result } = renderHook(() => useSharingModalState(mockProps));

            await waitFor(() => {
                expect(result.current.directMembers).toEqual(expectedDirectMembers);
            });

            await act(async () => {
                await result.current.actions.stopSharing();
            });

            expect(mockHandleError).toHaveBeenCalledWith(error, {
                fallbackMessage: 'Stopping the sharing of this item has failed',
                extra: {
                    nodeUid: mockNodeUid,
                },
            });
        });
    });
});
