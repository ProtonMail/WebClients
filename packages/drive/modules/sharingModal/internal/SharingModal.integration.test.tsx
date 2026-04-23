import { useEffect } from 'react';

import { type MaybeNode, MemberRole, type NodeEntity, NodeType } from '@protontech/drive-sdk/dist/interface/nodes';
import type { ShareResult } from '@protontech/drive-sdk/dist/interface/sharing';
import { screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { getModelState } from '@proton/account/test';
import { renderWithProviders } from '@proton/testing';
import { buildAddress } from '@proton/testing/builders/address';

import { useSharingModal } from './SharingModal';
import type { SharingModalInnerProps } from './useSharingModalState';

jest.mock('@proton/unleash/useFlag', () => ({
    useFlag: (name: string) => name === 'DriveSharingAdminPermissions',
}));

const DRIVE_BASE = {
    getNode: jest.fn(),
    getSharingInfo: jest.fn(),
    shareNode: jest.fn(),
    unshareNode: jest.fn(),
    resendInvitation: jest.fn(),
    convertNonProtonInvitation: jest.fn(),
};

const commonNodeProperties = {
    keyAuthor: { ok: true, value: null },
    nameAuthor: { ok: true, value: null },
    ownedBy: {},
    type: NodeType.Folder,
    isShared: true,
    isSharedPublicly: true,
    creationTime: new Date(),
    modificationTime: new Date(),
    treeEventScopeId: '',
};

function SharingModalTestBed({ nodeUid, drive }: SharingModalInnerProps) {
    const { sharingModal, showSharingModal } = useSharingModal();
    useEffect(() => {
        showSharingModal({ nodeUid, drive });
    }, [drive, nodeUid, showSharingModal]);

    return <>{sharingModal}</>;
}

describe('SharingModal', () => {
    it('should show public link section to owners', async () => {
        const parentNode = {
            ...commonNodeProperties,
            uid: 'qwe~123',
            name: 'root', // a.k.a. "My files"
            directRole: MemberRole.Admin,
            isSharedPublicly: false,
        } as NodeEntity;
        const viewedNode = {
            ...commonNodeProperties,
            uid: 'qwe~456',
            parentUid: parentNode.uid,
            name: 'whatever - child',
            directRole: MemberRole.Admin,
        } as NodeEntity;

        const drive = {
            ...DRIVE_BASE,
            getNode: (uid: string): Promise<MaybeNode> =>
                Promise.resolve({
                    ok: true,
                    value: uid === parentNode.uid ? parentNode : viewedNode,
                }),
        };

        renderWithProviders(<SharingModalTestBed nodeUid={viewedNode.uid} drive={drive} />);

        await waitFor(() => {
            const publicSharing = screen.getByTestId('share-modal-shareWithAnyoneSection');
            expect(publicSharing).toBeInTheDocument();
        });
    });

    it('should hide public link section from admins', async () => {
        const parentNode = {
            ...commonNodeProperties,
            uid: 'qwe~123',
            name: 'whatever - parent',
            directRole: MemberRole.Admin,
            membership: {
                role: MemberRole.Admin,
                inviteTime: new Date(),
                sharedBy: { ok: true, value: null },
            },
        } as NodeEntity;
        const viewedNode = {
            ...commonNodeProperties,
            uid: 'qwe~456',
            parentUid: parentNode.uid,
            name: 'whatever - child',
            directRole: MemberRole.Inherited,
        } as NodeEntity;

        const drive = {
            ...DRIVE_BASE,
            getNode: (uid: string): Promise<MaybeNode> =>
                Promise.resolve({
                    ok: true,
                    value: uid === parentNode.uid ? parentNode : viewedNode,
                }),
        };

        renderWithProviders(<SharingModalTestBed nodeUid={viewedNode.uid} drive={drive} />);

        await waitFor(() => {
            expect(screen.getByText(`Share "${viewedNode.name}"`)).toBeInTheDocument();
        });

        const publicSharing = screen.queryByTestId('share-modal-shareWithAnyoneSection');
        expect(publicSharing).not.toBeInTheDocument();
    });

    it('should allow owners to decide if editors are admins', async () => {
        const parentNode = {
            ...commonNodeProperties,
            uid: 'qwe~123',
            name: 'root',
            directRole: MemberRole.Admin,
            isSharedPublicly: false,
        } as NodeEntity;
        const viewedNode = {
            ...commonNodeProperties,
            uid: 'qwe~456',
            parentUid: parentNode.uid,
            name: 'whatever - child',
            directRole: MemberRole.Admin,
        } as NodeEntity;

        const shareNode = jest.fn().mockResolvedValue({
            protonInvitations: [],
            nonProtonInvitations: [],
            members: [],
            editorsCanShare: false,
        });
        const drive = {
            ...DRIVE_BASE,
            getNode: (uid: string): Promise<MaybeNode> =>
                Promise.resolve({
                    ok: true,
                    value: uid === parentNode.uid ? parentNode : viewedNode,
                }),
            getSharingInfo: (): Promise<ShareResult> =>
                Promise.resolve({
                    protonInvitations: [],
                    nonProtonInvitations: [],
                    members: [
                        {
                            uid: '',
                            invitationTime: new Date(),
                            role: MemberRole.Admin,
                            addedByEmail: { ok: true, value: '' },
                            inviteeEmail: '',
                        },
                    ],
                    editorsCanShare: true,
                }),
            shareNode,
        };

        renderWithProviders(<SharingModalTestBed nodeUid={viewedNode.uid} drive={drive} />);

        await waitFor(() => screen.getByText(`Share "${viewedNode.name}"`));
        expect(screen.getByText('Sharing is end-to-end encrypted')).toBeInTheDocument();
        await openSharingSettings(viewedNode.name);
        screen.getByText('Allow editors to change permissions and share');
        const toggle = screen.getByLabelText('Allow editors to change permissions and share');
        expect(toggle).toBeChecked();

        await userEvent.click(toggle);

        expect(shareNode).toHaveBeenCalledWith(viewedNode.uid, { editorsCanShare: false });

        await waitFor(() => {
            expect(toggle).not.toBeChecked();
            expect(toggle).toHaveAttribute('aria-busy', 'false');
        });
    });

    it('should allow owners to stop sharing', async () => {
        const parentNode = {
            ...commonNodeProperties,
            uid: 'qwe~123',
            name: 'root',
            directRole: MemberRole.Admin,
            isSharedPublicly: false,
        } as NodeEntity;
        const viewedNode = {
            ...commonNodeProperties,
            uid: 'qwe~456',
            parentUid: parentNode.uid,
            name: 'whatever - child',
            directRole: MemberRole.Admin,
        } as NodeEntity;

        const unshareNode = jest.fn();
        const drive = {
            ...DRIVE_BASE,
            getNode: (uid: string): Promise<MaybeNode> =>
                Promise.resolve({
                    ok: true,
                    value: uid === parentNode.uid ? parentNode : viewedNode,
                }),
            getSharingInfo: (): Promise<ShareResult> =>
                Promise.resolve({
                    protonInvitations: [],
                    nonProtonInvitations: [],
                    members: [
                        {
                            uid: '',
                            invitationTime: new Date(),
                            role: MemberRole.Admin,
                            addedByEmail: { ok: true, value: '' },
                            inviteeEmail: '',
                        },
                    ],
                    editorsCanShare: true,
                }),
            unshareNode,
        };

        renderWithProviders(<SharingModalTestBed nodeUid={viewedNode.uid} drive={drive} />);

        await waitFor(() => screen.getByText(`Share "${viewedNode.name}"`));
        await openSharingSettings(viewedNode.name);
        const stopSharingButton = screen.getByRole('button', { name: 'Stop sharing', hidden: true });
        await userEvent.click(stopSharingButton);
        // Confirmation modal opens
        const confirmDialog = (await screen.findByText('Stop sharing?')).closest('dialog');
        await userEvent.click(within(confirmDialog!).getByRole('button', { name: 'Stop sharing', hidden: true }));
        expect(unshareNode).toHaveBeenCalledWith(viewedNode.uid);
    });

    it('should hide settings from non-owners', async () => {
        const viewedNode = {
            ...commonNodeProperties,
            uid: 'qwe~999',
            name: 'tortilla de patatas',
            directRole: MemberRole.Admin,
        } as NodeEntity;

        const drive = {
            ...DRIVE_BASE,
            getNode: (): Promise<MaybeNode> =>
                Promise.resolve({
                    ok: true,
                    value: viewedNode,
                }),
            getSharingInfo: (): Promise<ShareResult> =>
                Promise.resolve({
                    protonInvitations: [],
                    nonProtonInvitations: [],
                    members: [
                        {
                            uid: '',
                            invitationTime: new Date(),
                            role: MemberRole.Admin,
                            addedByEmail: { ok: true, value: '' },
                            inviteeEmail: '',
                        },
                    ],
                    editorsCanShare: true,
                }),
        };

        renderWithProviders(<SharingModalTestBed nodeUid={viewedNode.uid} drive={drive} />);

        await waitFor(() => screen.getByText(`Share "${viewedNode.name}"`));
        const settingsButton = screen.getByTestId('share-modal-settings');
        expect(settingsButton).toBeDisabled();
    });

    it('should warn user of degrading if user does not have admin on parent', async () => {
        const currentUserEmail = 'me@myself.com';
        const parentNode = {
            ...commonNodeProperties,
            name: 'pare',
            uid: 'qwe~123',
            directRole: MemberRole.Viewer,
            membership: {
                role: MemberRole.Viewer,
                inviteTime: new Date(),
                sharedBy: { ok: true, value: null },
            },
        } as NodeEntity;
        const viewedNode = {
            ...commonNodeProperties,
            name: 'filla',
            uid: 'qwe~456',
            parentUid: parentNode.uid,
            directRole: MemberRole.Admin,
            membership: {
                role: MemberRole.Admin,
                inviteTime: new Date(),
                sharedBy: { ok: true, value: null },
            },
        } as NodeEntity;

        const shareNode = jest.fn();
        const drive = {
            ...DRIVE_BASE,
            getNode: (uid: string): Promise<MaybeNode> =>
                Promise.resolve({
                    ok: true,
                    value: uid === parentNode.uid ? parentNode : viewedNode,
                }),
            getSharingInfo: (): Promise<ShareResult> =>
                Promise.resolve({
                    protonInvitations: [],
                    nonProtonInvitations: [],
                    members: [
                        {
                            uid: 'member~1',
                            invitationTime: new Date(),
                            role: MemberRole.Admin,
                            addedByEmail: { ok: true, value: '' },
                            inviteeEmail: currentUserEmail,
                        },
                    ],
                    editorsCanShare: true,
                }),
            shareNode,
        };

        renderWithProviders(<SharingModalTestBed nodeUid={viewedNode.uid} drive={drive} />, {
            preloadedState: {
                addresses: getModelState([buildAddress({ Email: currentUserEmail })]),
            },
        });

        await waitFor(() => screen.getByText(`Share "${viewedNode.name}"`));
        const memberRow = await screen.findByTestId('share-members');
        await userEvent.click(within(memberRow).getByText('can edit'));
        await userEvent.click(screen.getByText('Viewer'));
        await waitFor(() => screen.getByText(`Change access to viewer?`));
        await userEvent.click(screen.getByText('Change my access'));

        expect(shareNode).toHaveBeenCalledWith(viewedNode.uid, {
            users: [{ email: currentUserEmail, role: MemberRole.Viewer }],
        });
        await waitFor(() => {
            const header = screen.getByText(`Share "${viewedNode.name}"`);
            // Animation starts - modal is closing; jsdom doesn't run CSS animations, so onAnimationEnd never fires
            expect(header.closest('.modal-two--out')).not.toBeNull();
        });
    });

    it('should show the owner and the current user on the list of users', async () => {
        const ownerEmail = 'owner@example.com';
        const ownerDisplayName = 'Owner Name';
        const currentUserEmail = 'me@myself.com';
        const currentUserDisplayName = 'Current User';

        const viewedNode = {
            ...commonNodeProperties,
            uid: 'qwe~456',
            name: 'shared file',
            directRole: MemberRole.Viewer,
            ownedBy: { email: ownerEmail },
            membership: {
                role: MemberRole.Viewer,
                inviteTime: new Date(),
                sharedBy: { ok: true, value: null },
            },
        } as NodeEntity;

        const drive = {
            ...DRIVE_BASE,
            getNode: (): Promise<MaybeNode> =>
                Promise.resolve({
                    ok: true,
                    value: viewedNode,
                }),
            getSharingInfo: (): Promise<ShareResult> =>
                Promise.resolve({
                    protonInvitations: [],
                    nonProtonInvitations: [],
                    members: [
                        {
                            uid: 'member~1',
                            invitationTime: new Date(),
                            role: MemberRole.Viewer,
                            addedByEmail: { ok: true, value: ownerEmail },
                            inviteeEmail: currentUserEmail,
                        },
                    ],
                    editorsCanShare: false,
                }),
        };

        renderWithProviders(<SharingModalTestBed nodeUid={viewedNode.uid} drive={drive} />, {
            preloadedState: {
                addresses: getModelState([buildAddress({ Email: currentUserEmail })]),
                contactEmails: getModelState([
                    makeContact(ownerEmail, ownerDisplayName),
                    makeContact(currentUserEmail, currentUserDisplayName),
                ]),
            },
        });

        await waitFor(() => screen.getByText(`Share "${viewedNode.name}"`));

        const ownerRow = await screen.findByTestId('share-owner');
        expect(within(ownerRow).getByText(ownerDisplayName)).toBeInTheDocument();
        expect(within(ownerRow).getByText(ownerEmail)).toBeInTheDocument();

        const memberRow = await screen.findByTestId('share-members');
        expect(within(memberRow).getByText(currentUserDisplayName)).toBeInTheDocument();
        expect(within(memberRow).getByText(currentUserEmail)).toBeInTheDocument();
    });

    it('should not warn user of degrading when user is an admin on parent', async () => {
        const currentUserEmail = 'me@myself.com';
        const parentNode = {
            ...commonNodeProperties,
            name: 'pare',
            uid: 'qwe~123',
            directRole: MemberRole.Admin,
            membership: {
                role: MemberRole.Admin,
                inviteTime: new Date(),
                sharedBy: { ok: true, value: null },
            },
        } as NodeEntity;
        const viewedNode = {
            ...commonNodeProperties,
            name: 'filla',
            uid: 'qwe~456',
            parentUid: parentNode.uid,
            directRole: MemberRole.Admin,
            membership: {
                role: MemberRole.Admin,
                inviteTime: new Date(),
                sharedBy: { ok: true, value: null },
            },
        } as NodeEntity;

        const shareNode = jest.fn();
        const drive = {
            ...DRIVE_BASE,
            getNode: (uid: string): Promise<MaybeNode> =>
                Promise.resolve({
                    ok: true,
                    value: uid === parentNode.uid ? parentNode : viewedNode,
                }),
            getSharingInfo: (): Promise<ShareResult> =>
                Promise.resolve({
                    protonInvitations: [],
                    nonProtonInvitations: [],
                    members: [
                        {
                            uid: 'member~1',
                            invitationTime: new Date(),
                            role: MemberRole.Admin,
                            addedByEmail: { ok: true, value: '' },
                            inviteeEmail: currentUserEmail,
                        },
                    ],
                    editorsCanShare: true,
                }),
            shareNode,
        };

        renderWithProviders(<SharingModalTestBed nodeUid={viewedNode.uid} drive={drive} />, {
            preloadedState: {
                addresses: getModelState([buildAddress({ Email: currentUserEmail })]),
            },
        });

        await waitFor(() => screen.getByText(`Share "${viewedNode.name}"`));
        const memberRow = await screen.findByTestId('share-members');
        await userEvent.click(within(memberRow).getByText('can edit'));
        await userEvent.click(screen.getByText('Viewer'));
        await waitFor(() => expect(screen.queryByText(`Change access to viewer?`)).not.toBeInTheDocument());

        expect(shareNode).toHaveBeenCalledWith(viewedNode.uid, {
            users: [{ email: currentUserEmail, role: MemberRole.Viewer }],
        });
        const header = screen.getByText(`Share "${viewedNode.name}"`);
        expect(header.closest('.modal-two--out')).toBeNull();
    });

    it('should confirm before removing the current user and call unshareNode on confirmation', async () => {
        const currentUserEmail = 'me@myself.com';
        const viewedNode = {
            ...commonNodeProperties,
            uid: 'qwe~456',
            name: 'shared file',
            directRole: MemberRole.Viewer,
            ownedBy: { email: 'owner@example.com' },
            membership: {
                role: MemberRole.Viewer,
                inviteTime: new Date(),
                sharedBy: { ok: true, value: null },
            },
        } as NodeEntity;

        const unshareNode = jest.fn().mockResolvedValue(undefined);
        const drive = {
            ...DRIVE_BASE,
            getNode: (): Promise<MaybeNode> =>
                Promise.resolve({
                    ok: true,
                    value: viewedNode,
                }),
            getSharingInfo: (): Promise<ShareResult> =>
                Promise.resolve({
                    protonInvitations: [],
                    nonProtonInvitations: [],
                    members: [
                        {
                            uid: 'member~1',
                            invitationTime: new Date(),
                            role: MemberRole.Viewer,
                            addedByEmail: { ok: true, value: '' },
                            inviteeEmail: currentUserEmail,
                        },
                    ],
                    editorsCanShare: true,
                }),
            unshareNode,
        };

        renderWithProviders(<SharingModalTestBed nodeUid={viewedNode.uid} drive={drive} />, {
            preloadedState: {
                addresses: getModelState([buildAddress({ Email: currentUserEmail })]),
            },
        });

        await waitFor(() => screen.getByText(`Share "${viewedNode.name}"`));
        const memberRow = await screen.findByTestId('share-members');
        await userEvent.click(within(memberRow).getByText('can view'));
        await userEvent.click(screen.getByText('Remove access'));

        const confirmDialog = (await screen.findByText('Remove your access?')).closest('dialog');
        expect(confirmDialog).not.toBeNull();
        await userEvent.click(within(confirmDialog!).getByRole('button', { name: 'Remove my access', hidden: true }));

        expect(unshareNode).toHaveBeenCalledWith(viewedNode.uid, { users: [currentUserEmail] });
    });

    it('should not show confirmation when removing myself if I still have access via the parent', async () => {
        const currentUserEmail = 'me@myself.com';
        const parentNode = {
            ...commonNodeProperties,
            uid: 'qwe~123',
            name: 'pare',
            directRole: MemberRole.Viewer,
            membership: {
                role: MemberRole.Viewer,
                inviteTime: new Date(),
                sharedBy: { ok: true, value: null },
            },
        } as NodeEntity;
        const viewedNode = {
            ...commonNodeProperties,
            uid: 'qwe~456',
            parentUid: parentNode.uid,
            name: 'shared file',
            directRole: MemberRole.Viewer,
            membership: {
                role: MemberRole.Viewer,
                inviteTime: new Date(),
                sharedBy: { ok: true, value: null },
            },
        } as NodeEntity;

        const unshareNode = jest.fn().mockResolvedValue(undefined);
        const drive = {
            ...DRIVE_BASE,
            getNode: (uid: string): Promise<MaybeNode> =>
                Promise.resolve({
                    ok: true,
                    value: uid === parentNode.uid ? parentNode : viewedNode,
                }),
            getSharingInfo: (): Promise<ShareResult> =>
                Promise.resolve({
                    protonInvitations: [],
                    nonProtonInvitations: [],
                    members: [
                        {
                            uid: 'member~1',
                            invitationTime: new Date(),
                            role: MemberRole.Viewer,
                            addedByEmail: { ok: true, value: '' },
                            inviteeEmail: currentUserEmail,
                        },
                    ],
                    editorsCanShare: true,
                }),
            unshareNode,
        };

        renderWithProviders(<SharingModalTestBed nodeUid={viewedNode.uid} drive={drive} />, {
            preloadedState: {
                addresses: getModelState([buildAddress({ Email: currentUserEmail })]),
            },
        });

        await waitFor(() => screen.getByText(`Share "${viewedNode.name}"`));
        const memberRow = await screen.findByTestId('share-members');
        await userEvent.click(within(memberRow).getByText('can view'));
        await userEvent.click(screen.getByText('Remove access'));

        expect(screen.queryByText('Remove your access?')).not.toBeInTheDocument();
        await waitFor(() => {
            expect(unshareNode).toHaveBeenCalledWith(viewedNode.uid, { users: [currentUserEmail] });
        });
    });
});

async function openSharingSettings(name: string) {
    await userEvent.click(screen.getByTestId('share-modal-settings'));
    await waitFor(() => screen.getByText(`Settings for ${name}`));
}

function makeContact(Email: string, Name: string) {
    return {
        ID: Email,
        ContactID: Email,
        Email,
        Name,
        LabelIDs: [],
        Defaults: 0,
        Order: 0,
        Type: [],
        LastUsedTime: 0,
    };
}
