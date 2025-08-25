import { renderHook } from '@testing-library/react';

import { useNotifications } from '@proton/components';
import { MemberRole, type NodeEntity, NodeType, useDrive } from '@proton/drive/index';

import { getActionEventManager } from '../../../utils/ActionEventManager/ActionEventManager';
import { ActionEventName } from '../../../utils/ActionEventManager/ActionEventManagerTypes';
import { EnrichedError } from '../../../utils/errorHandling/EnrichedError';
import { useSdkErrorHandler } from '../../../utils/errorHandling/useSdkErrorHandler';
import { getNodeEntity } from '../../../utils/sdk/getNodeEntity';
import { useInvitationsActions } from './useInvitationsActions';

jest.mock('@proton/components', () => ({
    useNotifications: jest.fn(),
}));

jest.mock('@proton/drive', () => ({
    ...jest.requireActual('@proton/drive'),
    useDrive: jest.fn(),
    NodeType: {
        Folder: 'folder',
        File: 'file',
        Album: 'album',
    },
    splitNodeUid: jest.fn(),
}));

jest.mock('../../../utils/ActionEventManager/ActionEventManager', () => ({
    getActionEventManager: jest.fn(),
}));

jest.mock('../../../utils/errorHandling/useSdkErrorHandler', () => ({
    useSdkErrorHandler: jest.fn(),
}));

jest.mock('../../../utils/sdk/getNodeEntity', () => ({
    getNodeEntity: jest.fn(),
}));

const mockCreateNotification = jest.fn();
const mockHandleError = jest.fn();
const mockAcceptInvitation = jest.fn();
const mockRejectInvitation = jest.fn();
const mockGetNode = jest.fn();
const mockEventManagerEmit = jest.fn();

const mockSetVolumeShareIds = jest.fn();

const mockEventManager = {
    emit: mockEventManagerEmit,
};

const mockNode: Partial<NodeEntity> = {
    uid: 'node-uid-1',
    deprecatedShareId: 'share-id-1',
    membership: {
        role: MemberRole.Viewer,
        inviteTime: new Date(),
        sharedBy: {
            ok: true,
            value: 'test@example.com',
        },
    },
};

describe('useInvitationsActions', () => {
    beforeEach(() => {
        jest.mocked(useNotifications).mockReturnValue({
            createNotification: mockCreateNotification,
        } as any);

        jest.mocked(useDrive).mockReturnValue({
            drive: {
                acceptInvitation: mockAcceptInvitation,
                rejectInvitation: mockRejectInvitation,
                getNode: mockGetNode,
            },
        } as any);

        jest.mocked(useSdkErrorHandler).mockReturnValue({
            handleError: mockHandleError,
        } as any);

        jest.mocked(getActionEventManager).mockReturnValue(mockEventManager as any);

        jest.mocked(getNodeEntity).mockReturnValue({
            node: mockNode,
        } as any);

        const { splitNodeUid } = require('@proton/drive/index');
        jest.mocked(splitNodeUid).mockReturnValue({
            volumeId: 'volume-id-1',
            nodeId: 'node-id-1',
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('acceptInvitation', () => {
        it('should accept invitation and emit success notification', async () => {
            const { result } = renderHook(() => useInvitationsActions({ setVolumeShareIds: mockSetVolumeShareIds }));
            const uid = 'node-uid-1';
            const invitationUid = 'invitation-uid-1';

            mockAcceptInvitation.mockResolvedValue(undefined);
            mockGetNode.mockResolvedValue({});

            await result.current.acceptInvitation(uid, invitationUid);

            expect(mockAcceptInvitation).toHaveBeenCalledWith(invitationUid);
            expect(mockGetNode).toHaveBeenCalledWith(uid);
            expect(mockSetVolumeShareIds).toHaveBeenCalledWith('volume-id-1', ['share-id-1']);
            expect(mockEventManagerEmit).toHaveBeenCalledWith({
                type: ActionEventName.ACCEPT_INVITATIONS,
                uids: [mockNode.uid],
            });
            expect(mockCreateNotification).toHaveBeenCalledWith({
                type: 'success',
                text: 'Share invitation accepted successfully',
            });
        });

        it('should handle missing deprecatedShareId', async () => {
            const { result } = renderHook(() => useInvitationsActions({ setVolumeShareIds: mockSetVolumeShareIds }));
            const uid = 'node-uid-1';
            const invitationUid = 'invitation-uid-1';

            mockAcceptInvitation.mockResolvedValue(undefined);
            mockGetNode.mockResolvedValue({});
            jest.mocked(getNodeEntity).mockReturnValue({
                node: { ...mockNode, deprecatedShareId: undefined },
            } as any);

            await result.current.acceptInvitation(uid, invitationUid);

            expect(mockHandleError).toHaveBeenCalledWith(expect.any(EnrichedError), {
                fallbackMessage: 'Failed to accept share invitation',
            });
        });

        it('should handle errors during invitation acceptance', async () => {
            const { result } = renderHook(() => useInvitationsActions({ setVolumeShareIds: mockSetVolumeShareIds }));
            const uid = 'node-uid-1';
            const invitationUid = 'invitation-uid-1';
            const error = new Error('API Error');

            mockAcceptInvitation.mockRejectedValue(error);

            await result.current.acceptInvitation(uid, invitationUid);

            expect(mockHandleError).toHaveBeenCalledWith(error, {
                fallbackMessage: 'Failed to accept share invitation',
            });
        });
    });

    describe('rejectInvitation', () => {
        it('should show confirmation modal for folder rejection', async () => {
            const { result } = renderHook(() => useInvitationsActions({ setVolumeShareIds: mockSetVolumeShareIds }));
            const mockShowConfirmModal = jest.fn();
            const uid = 'node-uid-1';
            const invitationUid = 'invitation-uid-1';
            const name = 'Test Folder';
            const type = NodeType.Folder;

            mockRejectInvitation.mockResolvedValue(undefined);

            await result.current.rejectInvitation(mockShowConfirmModal, {
                uid,
                invitationUid,
                name,
                type,
            });

            expect(mockShowConfirmModal).toHaveBeenCalledWith({
                title: 'Decline invitation?',
                message: expect.any(Array),
                submitText: 'Decline invite',
                cancelText: 'Go back',
                onSubmit: expect.any(Function),
                canUndo: true,
            });
        });

        it('should show confirmation modal for default item rejection', async () => {
            const { result } = renderHook(() => useInvitationsActions({ setVolumeShareIds: mockSetVolumeShareIds }));
            const mockShowConfirmModal = jest.fn();
            const uid = 'node-uid-1';
            const invitationUid = 'invitation-uid-1';
            const name = 'Test File';
            const type = NodeType.File;

            await result.current.rejectInvitation(mockShowConfirmModal, {
                uid,
                invitationUid,
                name,
                type,
            });

            expect(mockShowConfirmModal).toHaveBeenCalledWith({
                title: 'Decline invitation?',
                message: expect.any(Array),
                submitText: 'Decline invite',
                cancelText: 'Go back',
                onSubmit: expect.any(Function),
                canUndo: true,
            });
        });

        it('should reject invitation and emit success notification on confirm', async () => {
            const { result } = renderHook(() => useInvitationsActions({ setVolumeShareIds: mockSetVolumeShareIds }));
            const mockShowConfirmModal = jest.fn();
            const uid = 'node-uid-1';
            const invitationUid = 'invitation-uid-1';
            const name = 'Test Folder';
            const type = NodeType.Folder;

            mockRejectInvitation.mockResolvedValue(undefined);

            await result.current.rejectInvitation(mockShowConfirmModal, {
                uid,
                invitationUid,
                name,
                type,
            });

            const { onSubmit } = mockShowConfirmModal.mock.lastCall[0];
            await onSubmit();

            expect(mockRejectInvitation).toHaveBeenCalledWith(invitationUid);
            expect(mockEventManagerEmit).toHaveBeenCalledWith({
                type: ActionEventName.REJECT_INVITATIONS,
                uids: [uid],
            });
            expect(mockCreateNotification).toHaveBeenCalledWith({
                type: 'success',
                text: 'Share invitation declined',
            });
        });

        it('should handle errors during invitation rejection', async () => {
            const { result } = renderHook(() => useInvitationsActions({ setVolumeShareIds: mockSetVolumeShareIds }));
            const mockShowConfirmModal = jest.fn();
            const uid = 'node-uid-1';
            const invitationUid = 'invitation-uid-1';
            const name = 'Test Folder';
            const type = NodeType.Folder;
            const error = new Error('API Error');

            mockRejectInvitation.mockRejectedValue(error);

            await result.current.rejectInvitation(mockShowConfirmModal, {
                uid,
                invitationUid,
                name,
                type,
            });

            const { onSubmit } = mockShowConfirmModal.mock.lastCall[0];
            await onSubmit();

            expect(mockHandleError).toHaveBeenCalledWith(error, {
                fallbackMessage: 'Failed to reject share invitation',
            });
        });
    });
});
