import {
    MemberRole,
    type NodeEntity,
    NodeType,
    ValidationError,
    generateNodeUid,
    resultError,
    resultOk,
} from '@protontech/drive-sdk';
import { splitInvitationUid, splitNodeUid } from '@protontech/drive-sdk/dist/internal/uids';
import { act, renderHook, waitFor } from '@testing-library/react';

import { useContactEmails } from '@proton/account/contactEmails/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useNotifications } from '@proton/app-context/useNotifications';
import useLoading from '@proton/hooks/useLoading';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import { PROTON_DOCS_DOCUMENT_MIMETYPE } from '@proton/shared/lib/helpers/mimetype';
import type { UserModel } from '@proton/shared/lib/interfaces/User';

import { handleSdkError } from '../../../legacy/errorHandling';
import { getBusDriver } from '../../../modules/busDriver';
import { useFlagsDriveDocsPublicSharing } from '../../../modules/flags';
import { type DirectMember, MemberType } from './interfaces';
import { when } from './testUtils/when';
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
    getSharingInfo: vi.fn(),
    getNode: vi.fn(),
    unshareNode: vi.fn(),
    shareNode: vi.fn(),
    resendInvitation: vi.fn(),
};

const mockProps = {
    nodeUid: mockUid,
    shareId: mockShareId,
    drive: mockDrive as any,
    onClose: vi.fn(),
    open: true,
    onExit: vi.fn(),
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
    urlAccess: {
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

const mockNodeInfo: Partial<NodeEntity> = {
    name: { ok: true, value: 'Test File' },
    type: NodeType.File,
    ownedBy: {
        email: 'owner@proton.me',
    },
};

const mockUser = {
    Email: 'user@proton.me',
    DisplayName: 'Test User',
} as unknown as UserModel;

const mockedCreateNotification = vi.fn();
const mockedUseUser = vi.mocked(useUser);
const mockedUseNotifications = vi.mocked(useNotifications);
const mockedGenerateNodeUid = vi.mocked(generateNodeUid);
const mockedSplitInvitationUid = vi.mocked(splitInvitationUid);
const mockedSplitNodeUid = vi.mocked(splitNodeUid);
const mockedUseLoading = vi.mocked(useLoading);
const mockedUseFlagsDriveDocsPublicSharing = vi.mocked(useFlagsDriveDocsPublicSharing);
const mockedGetAppHref = vi.mocked(getAppHref);
const mockedTextToClipboard = vi.mocked(textToClipboard);
const mockedResultOk = vi.mocked(resultOk);
const mockedResultError = vi.mocked(resultError);

vi.mock('@proton/account/user/hooks');
vi.mock('@proton/app-context/useNotifications');
vi.mock('@proton/hooks/useLoading');
vi.mock('@proton/shared/lib/apps/helper');
vi.mock('@proton/shared/lib/helpers/browser');
vi.mock('../../../modules/flags', async () => ({
    ...(await vi.importActual('../../../modules/flags')),
    useFlagsDriveDocsPublicSharing: vi.fn(),
}));
vi.mock('../../../legacy/errorHandling');
vi.mock('../../../modules/busDriver');
vi.mock('@proton/account/contactEmails/hooks', () => ({
    useContactEmails: vi.fn(() => [[]]),
}));
vi.mock('@protontech/drive-sdk');
vi.mock('@protontech/drive-sdk/dist/internal/uids');

const mockedUseContactEmails = vi.mocked(useContactEmails);

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
        type: MemberType.NonProtonInvitation,
    },
];

describe('useSharingModalState', () => {
    const mockBusEmit = vi.fn();

    const mockHandleError = vi.mocked(handleSdkError);

    beforeEach(() => {
        mockedUseUser.mockReturnValue([mockUser, false]);
        mockedUseNotifications.mockReturnValue({
            createNotification: mockedCreateNotification,
        } as any);
        const mockedWithLoading = vi.fn((promise) => promise);
        const mockedSetIsLoading = vi.fn();
        mockedUseLoading.mockReturnValue([false, mockedWithLoading, mockedSetIsLoading]);
        vi.mocked(getBusDriver).mockReturnValue({ emit: mockBusEmit } as any);
        when(mockedSplitNodeUid).calledWith(mockUid).mockReturnValue({ volumeId: mockVolumeId, nodeId: mockLinkId });
        mockedUseFlagsDriveDocsPublicSharing.mockReturnValue({
            isDocsPublicSharingEnabled: true,
        });

        when(mockedGenerateNodeUid).calledWith(mockVolumeId, mockLinkId).mockReturnValue(mockNodeUid);

        when(mockDrive.getSharingInfo).calledWith(mockNodeUid).mockResolvedValue(mockShareResult);

        when(mockDrive.getNode).calledWith(mockNodeUid).mockResolvedValue(mockNodeInfo);

        when(mockedSplitInvitationUid)
            .calledWith(mockInvitationUid)
            .mockReturnValue({ shareId: mockShareId, invitationId: mockInvitationId });

        mockedGetAppHref.mockReturnValue('https://example.com/invite-link');

        mockedResultOk.mockImplementation((value) => ({ ok: true, value }));
        mockedResultError.mockImplementation((error) => ({ ok: false, error }));
    });

    afterEach(() => {
        vi.clearAllMocks();
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
                    type: MemberType.NonProtonInvitation,
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
                    type: MemberType.NonProtonInvitation,
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
        vi.useFakeTimers();

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
        vi.runAllTimers();
        expect(mockedCreateNotification).toHaveBeenCalledWith({
            text: '"Test File" shared',
        });
        expect(mockBusEmit).toHaveBeenCalled();

        vi.useRealTimers();
    });

    it('should update public link and show notification', async () => {
        const publicLinkSettings = {
            role: MemberRole.Editor,
            customPassword: 'new-password',
            expiration: new Date('2025-12-31T23:59:59.000Z'),
        };
        const updatedShareResult = {
            ...mockShareResult,
            urlAccess: {
                ...mockShareResult.urlAccess,
                role: MemberRole.Editor,
                customPassword: 'new-password',
                expirationTime: new Date('2025-12-31T23:59:59.000Z'),
            },
        };

        when(mockDrive.shareNode)
            .calledWith(mockNodeUid, {
                urlAccess: publicLinkSettings,
            })
            .mockResolvedValue(updatedShareResult);

        const { result } = renderHook(() => useSharingModalState(mockProps));

        await waitFor(() => {
            expect(result.current.publicLink).toEqual({
                role: MemberRole.Viewer,
                url: 'https://example.com/public-link',
                customPassword: 'test-password',
                expirationTime: new Date('2025-04-25T12:17:56.000Z'),
                isExpired: true,
            });
        });

        await act(async () => {
            await result.current.actions.updateSharePublic(publicLinkSettings);
        });

        expect(mockDrive.shareNode).toHaveBeenCalledWith(mockNodeUid, {
            urlAccess: publicLinkSettings,
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
            urlAccess: {
                ...mockShareResult.urlAccess,
                customPassword: 'new-password',
            },
        };

        when(mockDrive.shareNode)
            .calledWith(mockNodeUid, {
                urlAccess: {
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
            urlAccess: undefined,
        };
        const updatedShareResult = {
            ...mockShareResult,
            urlAccess: {
                token: 'new-public-token',
                url: 'https://example.com/new-public-link',
                role: MemberRole.Viewer,
            },
        };

        when(mockDrive.getSharingInfo).calledWith(mockNodeUid).mockResolvedValue(mockShareResultWithoutPublicLink);
        when(mockDrive.shareNode)
            .calledWith(mockNodeUid, { urlAccess: { role: MemberRole.Viewer } })
            .mockResolvedValue(updatedShareResult);

        const { result } = renderHook(() => useSharingModalState(mockProps));

        await waitFor(() => {
            expect(result.current.directMembers).toEqual(expectedDirectMembers);
        });

        await act(async () => {
            await result.current.actions.createSharePublic();
        });

        expect(mockDrive.shareNode).toHaveBeenCalledWith(mockNodeUid, {
            urlAccess: { role: MemberRole.Viewer },
        });
        expect(mockBusEmit).toHaveBeenCalled();
    });

    it('should call onShareSnapshot with the updated share result when createSharePublic succeeds', async () => {
        const onShareSnapshot = vi.fn();
        const mockShareResultWithoutPublicLink = {
            ...mockShareResult,
            urlAccess: undefined,
        };
        const updatedShareResult = {
            ...mockShareResult,
            urlAccess: {
                token: 'new-public-token',
                url: 'https://example.com/new-public-link',
                role: MemberRole.Viewer,
            },
        };

        when(mockDrive.getSharingInfo).calledWith(mockNodeUid).mockResolvedValue(mockShareResultWithoutPublicLink);
        when(mockDrive.shareNode)
            .calledWith(mockNodeUid, { urlAccess: { role: MemberRole.Viewer } })
            .mockResolvedValue(updatedShareResult);

        const { result } = renderHook(() => useSharingModalState({ ...mockProps, onShareSnapshot }));

        await waitFor(() => {
            expect(result.current.directMembers).toEqual(expectedDirectMembers);
        });

        await act(async () => {
            await result.current.actions.createSharePublic();
        });

        expect(onShareSnapshot).toHaveBeenCalledWith({
            ok: true,
            value: updatedShareResult,
        });
    });

    it('should call onShareSnapshot for non-public-link mutations', async () => {
        const onShareSnapshot = vi.fn();
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

        const { result } = renderHook(() => useSharingModalState({ ...mockProps, onShareSnapshot }));

        await waitFor(() => {
            expect(result.current.directMembers).toEqual(expectedDirectMembers);
        });

        await act(async () => {
            await result.current.actions.updateShareDirect(shareNodeSettings);
        });

        expect(onShareSnapshot).toHaveBeenCalledWith({
            ok: true,
            value: updatedShareResult,
        });
    });

    it('should call onShareSnapshot with the fetched share result on initial load', async () => {
        const onShareSnapshot = vi.fn();

        const { result } = renderHook(() => useSharingModalState({ ...mockProps, onShareSnapshot }));

        await waitFor(() => {
            expect(result.current.directMembers).toEqual(expectedDirectMembers);
        });

        expect(onShareSnapshot).toHaveBeenCalledWith({ ok: true, value: mockShareResult });
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
            urlAccess: undefined,
        };

        when(mockDrive.unshareNode)
            .calledWith(mockNodeUid, { urlAccess: 'remove' })
            .mockResolvedValue(updatedShareResult);

        const { result } = renderHook(() => useSharingModalState(mockProps));

        await waitFor(() => {
            expect(result.current.directMembers).toEqual(expectedDirectMembers);
        });

        await act(async () => {
            await result.current.actions.unsharePublic();
        });

        expect(mockDrive.unshareNode).toHaveBeenCalledWith(mockNodeUid, { urlAccess: 'remove' });
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
                isExpired: true,
            });
        });
    });

    it.each([
        ['no expiration time', undefined],
        ['a future expiration time', new Date(Date.now() + 24 * 60 * 60 * 1000)],
    ])('should expose isExpired as false when public link has %s', async (_, expirationTime) => {
        const shareResultWithExpiration = {
            ...mockShareResult,
            urlAccess: { ...mockShareResult.urlAccess, expirationTime },
        };
        when(mockDrive.getSharingInfo).calledWith(mockNodeUid).mockResolvedValue(shareResultWithExpiration);

        const { result } = renderHook(() => useSharingModalState(mockProps));

        await waitFor(() => {
            expect(result.current.publicLink).toEqual({
                role: MemberRole.Viewer,
                url: 'https://example.com/public-link',
                customPassword: 'test-password',
                expirationTime,
                isExpired: false,
            });
        });
    });

    it('should stop sharing with poll events', async () => {
        const updatedShareResult = {
            protonInvitations: [],
            nonProtonInvitations: [],
            urlAccess: undefined,
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

    it('should handle case when getNode fails', async () => {
        when(mockDrive.getNode).calledWith(mockNodeUid).mockRejectedValue(new Error('Node not found'));

        const { result } = renderHook(() => useSharingModalState(mockProps));

        await waitFor(() => {
            expect(result.current.ownerEmail).toBe(undefined);
        });
    });

    it('should set owner display name from contacts when owner email is found in contacts', async () => {
        const contactEmails = [
            { Email: 'owner@proton.me', Name: 'Owner Contact Name' },
            { Email: 'other@proton.me', Name: 'Other User' },
        ];

        const nodeInfoWithDifferentOwner = {
            name: { ok: true, value: 'Test File' },
            type: 1,
            ownedBy: {
                email: 'owner@proton.me',
            },
        };

        mockedUseContactEmails.mockReturnValue([contactEmails as any, false]);
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
            name: { ok: true, value: 'Test File' },
            type: 1,
            ownedBy: {
                email: 'owner@proton.me',
            },
        };

        mockedUseContactEmails.mockReturnValue([contactEmails as any, false]);
        mockedUseUser.mockReturnValue([mockUser, false]);
        when(mockDrive.getNode).calledWith(mockNodeUid).mockResolvedValue(nodeInfoWithDifferentOwner);

        const { result } = renderHook(() => useSharingModalState(mockProps));

        await waitFor(() => {
            expect(result.current.ownerDisplayName).toBeUndefined();
            expect(result.current.ownerEmail).toBe('owner@proton.me');
        });
    });

    it('should not set owner display name when contactEmails is empty', async () => {
        const nodeInfoWithDifferentOwner = {
            name: { ok: true, value: 'Test File' },
            type: 1,
            ownedBy: {
                email: 'owner@proton.me',
            },
        };

        mockedUseContactEmails.mockReturnValue([[], false]);
        mockedUseUser.mockReturnValue([mockUser, false]);
        when(mockDrive.getNode).calledWith(mockNodeUid).mockResolvedValue(nodeInfoWithDifferentOwner);

        const { result } = renderHook(() => useSharingModalState(mockProps));

        await waitFor(() => {
            expect(result.current.ownerDisplayName).toBeUndefined();
            expect(result.current.ownerEmail).toBe('owner@proton.me');
        });
    });

    it('should determine isShared correctly for empty sharing info', async () => {
        const emptyShareResult = {
            protonInvitations: [],
            nonProtonInvitations: [],
            urlAccess: undefined,
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
                        type: MemberType.NonProtonInvitation,
                    },
                ]);
            });

            await act(async () => {
                await result.current.actions.unshareNode(mockEmail);
            });

            expect(mockHandleError).toHaveBeenCalledWith(error, {
                fallbackMessage: 'Failed to unshare node',
                extra: { nodeUid: mockNodeUid },
                showNotification: true,
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
                showNotification: true,
            });
        });

        it('should handle error when updateSharePublic fails', async () => {
            const error = new Error('Update public share failed');
            const publicLinkSettings = {
                role: MemberRole.Editor,
            };

            when(mockDrive.shareNode)
                .calledWith(mockNodeUid, {
                    urlAccess: {
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
                showNotification: true,
            });
        });

        it('should handle error when createSharePublic fails', async () => {
            const error = new Error('Create public share failed');
            when(mockDrive.shareNode)
                .calledWith(mockNodeUid, {
                    urlAccess: { role: MemberRole.Viewer },
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
                showNotification: true,
            });
        });

        it('should call onShareSnapshot with the error when createSharePublic fails', async () => {
            const onShareSnapshot = vi.fn();
            const error = new Error('Create public share failed');
            when(mockDrive.shareNode)
                .calledWith(mockNodeUid, { urlAccess: { role: MemberRole.Viewer } })
                .mockRejectedValue(error);

            const { result } = renderHook(() => useSharingModalState({ ...mockProps, onShareSnapshot }));

            await waitFor(() => {
                expect(result.current.publicLink).toBeDefined();
            });

            await act(async () => {
                await result.current.actions.createSharePublic();
            });

            expect(onShareSnapshot).toHaveBeenCalledWith({ ok: false, error });
        });

        it('should show a toast with the SDK message when updateSharePublic fails with ValidationError', async () => {
            const errorMessage = 'Max amount of editable public urls limited to 3 on your plan. Please upgrade.';
            const error = new ValidationError(errorMessage);
            error.message = errorMessage;

            when(mockDrive.shareNode)
                .calledWith(mockNodeUid, {
                    urlAccess: {
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
                await result.current.actions.updateSharePublic({ role: MemberRole.Editor });
            });

            expect(mockedCreateNotification).toHaveBeenCalledWith({
                type: 'error',
                text: errorMessage,
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
                showNotification: true,
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
                    showNotification: false,
                });
            });
        });

        it('should call onShareSnapshot with the error when initial fetch fails', async () => {
            const onShareSnapshot = vi.fn();
            const error = new Error('Get sharing info failed');
            when(mockDrive.getSharingInfo).calledWith(mockNodeUid).mockRejectedValue(error);

            renderHook(() => useSharingModalState({ ...mockProps, onShareSnapshot }));

            await waitFor(() => {
                expect(onShareSnapshot).toHaveBeenCalledWith({ ok: false, error });
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
                    showNotification: false,
                });
            });
        });

        it('should handle error when unsharePublic fails', async () => {
            const error = new Error('Unshare public failed');
            when(mockDrive.unshareNode).calledWith(mockNodeUid, { urlAccess: 'remove' }).mockRejectedValue(error);

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
                showNotification: true,
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
                showNotification: true,
            });
        });
    });

    describe('isPublicLinkEnabled', () => {
        // Hierarchy root without membership -> node is in my files -> not resharing
        const renderWithNode = async (node: Partial<NodeEntity>, hierarchy: Partial<NodeEntity>[] = [{}]) => {
            when(mockDrive.getNode).calledWith(mockNodeUid).mockResolvedValue(node);
            const drive = { ...mockDrive, getNodeHierarchy: vi.fn().mockResolvedValue(hierarchy) };
            const { result } = renderHook(() => useSharingModalState({ ...mockProps, drive: drive as any }));
            await waitFor(() => {
                expect(result.current.initialized).toBe(true);
            });
            return result;
        };

        it.each([
            { name: 'file without media type', node: { ...mockNodeInfo, mediaType: undefined }, expected: true },
            { name: 'file with empty media type', node: { ...mockNodeInfo, mediaType: '' }, expected: true },
            { name: 'file with media type', node: { ...mockNodeInfo, mediaType: 'image/png' }, expected: true },
            { name: 'folder', node: { ...mockNodeInfo, type: NodeType.Folder }, expected: true },
            { name: 'album', node: { ...mockNodeInfo, type: NodeType.Album }, expected: false },
        ])('should return $expected for $name', async ({ node, expected }) => {
            const result = await renderWithNode(node);
            expect(result.current.isPublicLinkEnabled).toBe(expected);
        });

        it('should follow the Docs public sharing flag for Proton Docs', async () => {
            mockedUseFlagsDriveDocsPublicSharing.mockReturnValue({ isDocsPublicSharingEnabled: false });
            const result = await renderWithNode({ ...mockNodeInfo, mediaType: PROTON_DOCS_DOCUMENT_MIMETYPE });
            expect(result.current.isPublicLinkEnabled).toBe(false);
        });

        it('should be disabled when resharing', async () => {
            const result = await renderWithNode(mockNodeInfo, [
                { membership: { role: MemberRole.Editor } } as Partial<NodeEntity>,
            ]);
            expect(result.current.isPublicLinkEnabled).toBe(false);
        });
    });
});
