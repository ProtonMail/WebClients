import { renderHook } from '@testing-library/react';

import { useNotifications } from '@proton/components';
import { MemberRole, type NodeEntity, NodeType, getDrivePerNodeType } from '@proton/drive/index';
import { BusDriverEventName, getBusDriver } from '@proton/drive/internal/BusDriver';

import { EnrichedError } from '../../../utils/errorHandling/EnrichedError';
import { handleSdkError } from '../../../utils/errorHandling/handleSdkError';
import { getNodeEntity } from '../../../utils/sdk/getNodeEntity';
import { useInvitationsActions } from './useInvitationsActions';

jest.mock('@proton/components', () => ({
    useNotifications: jest.fn(),
}));

jest.mock('@proton/drive', () => ({
    ...jest.requireActual('@proton/drive'),
    getDrivePerNodeType: jest.fn(),
    NodeType: {
        Folder: 'folder',
        File: 'file',
        Album: 'album',
        Photo: 'photo',
    },
    splitNodeUid: jest.fn(),
}));

jest.mock('@proton/drive/internal/BusDriver', () => ({
    ...jest.requireActual('@proton/drive/internal/BusDriver'),
    getBusDriver: jest.fn(),
}));

jest.mock('../../../utils/errorHandling/handleSdkError', () => ({
    handleSdkError: jest.fn(),
}));

jest.mock('../../../utils/sdk/getNodeEntity', () => ({
    getNodeEntity: jest.fn(),
}));

const mockCreateNotification = jest.fn();
const mockHandleError = jest.mocked(handleSdkError);
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

        const mockDrive = {
            acceptInvitation: mockAcceptInvitation,
            rejectInvitation: mockRejectInvitation,
            getNode: mockGetNode,
        };

        jest.mocked(getDrivePerNodeType).mockReturnValue(mockDrive as any);

        jest.mocked(getBusDriver).mockReturnValue(mockEventManager as any);

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
            const type = NodeType.Folder;

            mockAcceptInvitation.mockResolvedValue(undefined);
            mockGetNode.mockResolvedValue({});

            await result.current.acceptInvitation(uid, invitationUid, type);

            expect(getDrivePerNodeType).toHaveBeenCalled();
            expect(mockAcceptInvitation).toHaveBeenCalledWith(invitationUid);
            expect(mockGetNode).toHaveBeenCalledWith(uid);
            expect(mockSetVolumeShareIds).toHaveBeenCalledWith('volume-id-1', ['share-id-1']);
            expect(mockEventManagerEmit).toHaveBeenCalledWith({
                type: BusDriverEventName.ACCEPT_INVITATIONS,
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
            const type = NodeType.Folder;

            mockAcceptInvitation.mockResolvedValue(undefined);
            mockGetNode.mockResolvedValue({});
            jest.mocked(getNodeEntity).mockReturnValue({
                node: { ...mockNode, deprecatedShareId: undefined },
            } as any);

            await result.current.acceptInvitation(uid, invitationUid, type);

            expect(mockHandleError).toHaveBeenCalledWith(expect.any(EnrichedError), {
                fallbackMessage: 'Failed to accept share invitation',
            });
        });

        it('should handle errors during invitation acceptance', async () => {
            const { result } = renderHook(() => useInvitationsActions({ setVolumeShareIds: mockSetVolumeShareIds }));
            const uid = 'node-uid-1';
            const invitationUid = 'invitation-uid-1';
            const type = NodeType.Folder;
            const error = new Error('API Error');

            mockAcceptInvitation.mockRejectedValue(error);

            await result.current.acceptInvitation(uid, invitationUid, type);

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

            expect(getDrivePerNodeType).toHaveBeenCalled();
            expect(mockRejectInvitation).toHaveBeenCalledWith(invitationUid);
            expect(mockEventManagerEmit).toHaveBeenCalledWith({
                type: BusDriverEventName.REJECT_INVITATIONS,
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

        it('should show correct message for Album type rejection', async () => {
            const { result } = renderHook(() => useInvitationsActions({ setVolumeShareIds: mockSetVolumeShareIds }));
            const mockShowConfirmModal = jest.fn();
            const uid = 'node-uid-1';
            const invitationUid = 'invitation-uid-1';
            const name = 'Test Album';
            const type = NodeType.Album;

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
    });
});
