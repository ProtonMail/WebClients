import { act, renderHook } from '@testing-library/react';

import { NodeType, ValidationError, generateInvitationUid, generateNodeUid } from '@proton/drive';
import { handleSdkError } from '@proton/drive/legacy/errorHandling';
import { BusDriverEventName, getBusDriver } from '@proton/drive/modules/busDriver';
import { getNotificationsManager } from '@proton/drive/modules/notifications';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { PROTON_DOCS_DOCUMENT_MIMETYPE } from '@proton/shared/lib/helpers/mimetype';

import useDriveNavigation from '../legacy/hooks/drive/useNavigate';
import { getOpenInDocsInfo, openDocsOrSheetsDocument } from '../utils/docs/openInDocs';
import { useRedirectOrAcceptInvitation } from './useRedirectOrAcceptInvitation';

// Only the client singletons, the app-context helpers (bus driver / notifications / error handler /
// navigation / docs) are mocked - those need a configured app. The pure UID helpers, NodeType, the
// real ValidationError and isNativeProtonDocsAppFile are kept so the test exercises the actual
// matching, not-found and docs-routing logic.
jest.mock('@proton/drive', () => ({
    ...jest.requireActual('@proton/drive'),
    getDrive: jest.fn(),
    getDriveForPhotos: jest.fn(),
    getDrivePerNodeType: jest.fn(),
}));

jest.mock('@proton/drive/modules/busDriver', () => ({
    ...jest.requireActual('@proton/drive/modules/busDriver'),
    getBusDriver: jest.fn(),
}));

jest.mock('@proton/drive/modules/notifications', () => ({
    getNotificationsManager: jest.fn(),
}));

jest.mock('@proton/drive/legacy/errorHandling', () => ({
    handleSdkError: jest.fn(),
}));

jest.mock('../legacy/hooks/drive/useNavigate', () => ({
    __esModule: true,
    default: jest.fn(),
}));

jest.mock('../utils/docs/openInDocs', () => ({
    getOpenInDocsInfo: jest.fn(),
    openDocsOrSheetsDocument: jest.fn(),
}));

const { getDrive, getDriveForPhotos, getDrivePerNodeType } = jest.mocked(require('@proton/drive'));

const VOLUME_ID = 'volume-1';
const LINK_ID = 'link-1';
const NODE_UID = generateNodeUid(VOLUME_ID, LINK_ID);
const INVITATION_ID = 'invitation-1';

const mockEmit = jest.fn().mockResolvedValue(undefined);
const mockCreateNotification = jest.fn();
const navigateToSharedWithMe = jest.fn();
const navigateToNoAccess = jest.fn();
const navigateToNodeUid = jest.fn().mockResolvedValue(undefined);

async function* asyncIteratorFrom<T>(items: T[]): AsyncGenerator<T> {
    for (const item of items) {
        yield item;
    }
}

async function* throwingIterator(error: Error): AsyncGenerator<never> {
    throw error;
}

function notFoundError() {
    return new ValidationError('not found', API_CUSTOM_ERROR_CODES.NOT_FOUND);
}

function fakeInvitation({
    shareId = 'share-1',
    invitationId = INVITATION_ID,
    nodeUid = NODE_UID,
    type = NodeType.File,
    mediaType,
}: {
    shareId?: string;
    invitationId?: string;
    nodeUid?: string;
    type?: NodeType;
    mediaType?: string;
} = {}) {
    return {
        uid: generateInvitationUid(shareId, invitationId),
        node: { uid: nodeUid, name: { ok: true, value: 'name' }, type, mediaType },
    };
}

function fakeNode({ type = NodeType.File, mediaType }: { type?: NodeType; mediaType?: string } = {}) {
    return { uid: NODE_UID, name: { ok: true, value: 'name' }, type, mediaType };
}

function fakeDriveClient({
    invitations = [],
    iterateInvitations,
    getNode = jest.fn().mockRejectedValue(notFoundError()),
}: {
    invitations?: ReturnType<typeof fakeInvitation>[];
    iterateInvitations?: jest.Mock;
    getNode?: jest.Mock;
} = {}) {
    return {
        iterateInvitations: iterateInvitations ?? jest.fn(() => asyncIteratorFrom(invitations)),
        acceptInvitation: jest.fn().mockResolvedValue(undefined),
        getNode,
    };
}

const params = { invitationId: INVITATION_ID, volumeId: VOLUME_ID, linkId: LINK_ID };

beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getBusDriver).mockReturnValue({ emit: mockEmit } as any);
    jest.mocked(getNotificationsManager).mockReturnValue({ createNotification: mockCreateNotification } as any);
    jest.mocked(useDriveNavigation).mockReturnValue({
        navigateToSharedWithMe,
        navigateToNoAccess,
        navigateToNodeUid,
    } as any);
    // getDrivePerNodeType returns a recognizable client per node type for navigation assertions.
    jest.mocked(getDrivePerNodeType).mockImplementation((type: NodeType) => ({ type }) as any);
});

describe('useRedirectOrAcceptInvitation', () => {
    describe('accept path', () => {
        it('accepts a matching invitation, emits the event, notifies and navigates to the node', async () => {
            const drive = fakeDriveClient({ invitations: [fakeInvitation({ type: NodeType.Folder })] });
            const photos = fakeDriveClient();
            getDrive.mockReturnValue(drive);
            getDriveForPhotos.mockReturnValue(photos);

            const { result } = renderHook(() => useRedirectOrAcceptInvitation());
            await act(async () => {
                await result.current(new AbortController().signal, params);
            });

            expect(drive.acceptInvitation).toHaveBeenCalledWith(generateInvitationUid('share-1', INVITATION_ID));
            expect(mockEmit).toHaveBeenCalledWith(
                { type: BusDriverEventName.ACCEPT_INVITATIONS, uids: [NODE_UID] },
                drive
            );
            expect(mockCreateNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }));
            expect(photos.iterateInvitations).not.toHaveBeenCalled();
            expect(navigateToNodeUid).toHaveBeenCalledWith(NODE_UID, { type: NodeType.Folder }, '/shared-with-me');
        });

        it('accepts a matching invitation on the photos drive when not on the regular drive', async () => {
            const drive = fakeDriveClient({ invitations: [fakeInvitation({ invitationId: 'other-invitation' })] });
            const photos = fakeDriveClient({ invitations: [fakeInvitation({ type: NodeType.Album })] });
            getDrive.mockReturnValue(drive);
            getDriveForPhotos.mockReturnValue(photos);

            const { result } = renderHook(() => useRedirectOrAcceptInvitation());
            await act(async () => {
                await result.current(new AbortController().signal, params);
            });

            expect(drive.acceptInvitation).not.toHaveBeenCalled();
            expect(photos.acceptInvitation).toHaveBeenCalledWith(generateInvitationUid('share-1', INVITATION_ID));
            expect(navigateToNodeUid).toHaveBeenCalledWith(NODE_UID, { type: NodeType.Album }, '/shared-with-me');
        });

        it('opens the document in Docs when the node is a native proton doc', async () => {
            getDrive.mockReturnValue(
                fakeDriveClient({ invitations: [fakeInvitation({ mediaType: PROTON_DOCS_DOCUMENT_MIMETYPE })] })
            );
            getDriveForPhotos.mockReturnValue(fakeDriveClient());
            jest.mocked(getOpenInDocsInfo).mockReturnValue({ type: 'document', isNative: true });

            const { result } = renderHook(() => useRedirectOrAcceptInvitation());
            await act(async () => {
                await result.current(new AbortController().signal, params);
            });

            expect(openDocsOrSheetsDocument).toHaveBeenCalledWith({
                uid: NODE_UID,
                type: 'document',
                isNative: true,
                openBehavior: 'redirect',
            });
            expect(navigateToNodeUid).not.toHaveBeenCalled();
        });

        it('reports the error but still redirects when accepting fails', async () => {
            const acceptError = new Error('accept failed');
            const drive = fakeDriveClient({ invitations: [fakeInvitation({ type: NodeType.Folder })] });
            drive.acceptInvitation.mockRejectedValue(acceptError);
            getDrive.mockReturnValue(drive);
            getDriveForPhotos.mockReturnValue(fakeDriveClient());

            const { result } = renderHook(() => useRedirectOrAcceptInvitation());
            await act(async () => {
                await result.current(new AbortController().signal, params);
            });

            expect(handleSdkError).toHaveBeenCalledWith(acceptError, expect.anything());
            expect(navigateToNodeUid).toHaveBeenCalledWith(NODE_UID, { type: NodeType.Folder }, '/shared-with-me');
        });
    });

    describe('get-node path (already has access)', () => {
        it('resolves the node from the regular drive when no invitation matches', async () => {
            const drive = fakeDriveClient({
                invitations: [fakeInvitation({ invitationId: 'other-invitation' })],
                getNode: jest.fn().mockResolvedValue(fakeNode({ type: NodeType.Folder })),
            });
            getDrive.mockReturnValue(drive);
            getDriveForPhotos.mockReturnValue(fakeDriveClient());

            const { result } = renderHook(() => useRedirectOrAcceptInvitation());
            await act(async () => {
                await result.current(new AbortController().signal, params);
            });

            expect(drive.acceptInvitation).not.toHaveBeenCalled();
            expect(drive.getNode).toHaveBeenCalledWith(NODE_UID);
            expect(navigateToNodeUid).toHaveBeenCalledWith(NODE_UID, { type: NodeType.Folder }, '/shared-with-me');
        });

        it('falls back to the photos drive when the regular drive returns not-found', async () => {
            const drive = fakeDriveClient(); // getNode rejects with not-found by default
            const photos = fakeDriveClient({
                getNode: jest.fn().mockResolvedValue(fakeNode({ type: NodeType.Album })),
            });
            getDrive.mockReturnValue(drive);
            getDriveForPhotos.mockReturnValue(photos);

            const { result } = renderHook(() => useRedirectOrAcceptInvitation());
            await act(async () => {
                await result.current(new AbortController().signal, params);
            });

            expect(photos.getNode).toHaveBeenCalledWith(NODE_UID);
            expect(navigateToNodeUid).toHaveBeenCalledWith(NODE_UID, { type: NodeType.Album }, '/shared-with-me');
        });

        it('falls back to the photos drive when the regular drive getNode fails with any error', async () => {
            const realError = new Error('boom');
            const drive = fakeDriveClient({ getNode: jest.fn().mockRejectedValue(realError) });
            const photos = fakeDriveClient({
                getNode: jest.fn().mockResolvedValue(fakeNode({ type: NodeType.Album })),
            });
            getDrive.mockReturnValue(drive);
            getDriveForPhotos.mockReturnValue(photos);

            const { result } = renderHook(() => useRedirectOrAcceptInvitation());
            await act(async () => {
                await result.current(new AbortController().signal, params);
            });

            expect(drive.getNode).toHaveBeenCalledWith(NODE_UID);
            expect(photos.getNode).toHaveBeenCalledWith(NODE_UID);
            expect(navigateToNodeUid).toHaveBeenCalledWith(NODE_UID, { type: NodeType.Album }, '/shared-with-me');
            expect(navigateToSharedWithMe).not.toHaveBeenCalled();
            expect(navigateToNoAccess).not.toHaveBeenCalled();
        });
    });

    describe('no access', () => {
        it('navigates to no-access when there is neither an invitation nor access', async () => {
            getDrive.mockReturnValue(fakeDriveClient());
            getDriveForPhotos.mockReturnValue(fakeDriveClient());

            const { result } = renderHook(() => useRedirectOrAcceptInvitation());
            await act(async () => {
                await result.current(new AbortController().signal, params);
            });

            expect(navigateToNoAccess).toHaveBeenCalled();
            expect(navigateToSharedWithMe).not.toHaveBeenCalled();
        });
    });

    describe('error handling', () => {
        it('reports the error and redirects to shared-with-me when iterating invitations throws', async () => {
            const iterateError = new Error('iterate failed');
            getDrive.mockReturnValue(
                fakeDriveClient({ iterateInvitations: jest.fn(() => throwingIterator(iterateError)) })
            );
            getDriveForPhotos.mockReturnValue(fakeDriveClient());

            const { result } = renderHook(() => useRedirectOrAcceptInvitation());
            await act(async () => {
                await result.current(new AbortController().signal, params);
            });

            expect(handleSdkError).toHaveBeenCalledWith(iterateError);
            expect(navigateToSharedWithMe).toHaveBeenCalled();
        });
    });
});
