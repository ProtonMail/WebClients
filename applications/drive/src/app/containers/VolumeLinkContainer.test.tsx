import { MemoryRouter, Route, Routes } from 'react-router-dom-v5-compat';

import { render, waitFor } from '@testing-library/react';

import { NodeType, generateNodeUid } from '@proton/drive/sdk';

import { VolumeLinkContainer } from './VolumeLinkContainer';

// Only the client singletons and the app-wired helpers are mocked. getNodeAncestry runs for real on a fake client.
jest.mock('@proton/drive/sdk', () => ({
    ...jest.requireActual('@proton/drive/sdk'),
    getDrive: jest.fn(),
    getDriveForPhotos: jest.fn(),
}));

jest.mock('@proton/drive/legacy/errorHandling', () => ({
    handleSdkError: jest.fn(),
}));

jest.mock('../legacy/hooks/drive/useNavigate', () => ({
    __esModule: true,
    default: jest.fn(),
}));

const mockRedirectOrAcceptInvitation = jest.fn();
jest.mock('./useRedirectOrAcceptInvitation', () => ({
    useRedirectOrAcceptInvitation: () => mockRedirectOrAcceptInvitation,
}));

const { getDrive, getDriveForPhotos } = jest.mocked(require('@proton/drive/sdk'));
const useDriveNavigation = jest.mocked(require('../legacy/hooks/drive/useNavigate').default);
const { handleSdkError } = jest.mocked(require('@proton/drive/legacy/errorHandling'));

const VOLUME_ID = 'volume-id';
const LINK_ID = 'link-id';
const ROOT_UID = generateNodeUid(VOLUME_ID, 'root-id');
const NODE_UID = generateNodeUid(VOLUME_ID, LINK_ID);

const redirectToLink = jest.fn();
const redirectToAlbum = jest.fn();
const navigateToNoAccess = jest.fn();
const navigateToSharedByMe = jest.fn();
const getNode = jest.fn();

const mockNodes = ({ type, rootShareId = 'share-id' }: { type: NodeType; rootShareId?: string }) => {
    const nodes: Record<string, object> = {
        [ROOT_UID]: { uid: ROOT_UID, type: NodeType.Folder, deprecatedShareId: rootShareId },
        [NODE_UID]: { uid: NODE_UID, parentUid: ROOT_UID, type },
    };
    getNode.mockImplementation(async (uid: string) => nodes[uid]);
};

const renderAt = (path: string) =>
    render(
        <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
                <Route path=":volumeId/:linkId/*" element={<VolumeLinkContainer />} />
            </Routes>
        </MemoryRouter>
    );

describe('VolumeLinkContainer', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        getDrive.mockReturnValue({ getNode });
        getDriveForPhotos.mockReturnValue({
            getMyPhotosRootFolder: jest.fn().mockRejectedValue(new Error('not needed')),
        });
        useDriveNavigation.mockReturnValue({
            redirectToLink,
            redirectToAlbum,
            navigateToNoAccess,
            navigateToSharedByMe,
        });
    });

    it('opens a folder', async () => {
        mockNodes({ type: NodeType.Folder });

        renderAt(`/${VOLUME_ID}/${LINK_ID}`);

        await waitFor(() => expect(redirectToLink).toHaveBeenCalledWith('share-id', LINK_ID, false));
        expect(navigateToNoAccess).not.toHaveBeenCalled();
    });

    it('opens a file', async () => {
        mockNodes({ type: NodeType.File });

        renderAt(`/${VOLUME_ID}/${LINK_ID}`);

        await waitFor(() => expect(redirectToLink).toHaveBeenCalledWith('share-id', LINK_ID, true));
    });

    describe('in the photos volume', () => {
        const getDriveNode = jest.fn();

        beforeEach(() => {
            getDrive.mockReturnValue({ getNode: getDriveNode });
            getDriveForPhotos.mockReturnValue({
                getMyPhotosRootFolder: jest.fn().mockResolvedValue({ uid: ROOT_UID, name: { ok: true, value: '' } }),
                getNode,
            });
        });

        it('opens a photo as a file with the photos client', async () => {
            mockNodes({ type: NodeType.Photo });

            renderAt(`/${VOLUME_ID}/${LINK_ID}`);

            await waitFor(() => expect(redirectToLink).toHaveBeenCalledWith('share-id', LINK_ID, true));
            expect(getDriveNode).not.toHaveBeenCalled();
        });

        it('opens an album with the photos client', async () => {
            mockNodes({ type: NodeType.Album });

            renderAt(`/${VOLUME_ID}/${LINK_ID}`);

            await waitFor(() => expect(redirectToAlbum).toHaveBeenCalledWith('share-id', LINK_ID));
            expect(redirectToLink).not.toHaveBeenCalled();
            expect(getDriveNode).not.toHaveBeenCalled();
        });
    });

    it('reports the error and shows no access when the node cannot be read', async () => {
        const error = new Error('not found');
        getNode.mockRejectedValue(error);

        renderAt(`/${VOLUME_ID}/${LINK_ID}`);

        await waitFor(() => expect(navigateToNoAccess).toHaveBeenCalled());
        expect(handleSdkError).toHaveBeenCalledWith(error, { showNotification: false });
        expect(redirectToLink).not.toHaveBeenCalled();
    });

    it('shows no access when the root has no share', async () => {
        mockNodes({ type: NodeType.Folder, rootShareId: '' });

        renderAt(`/${VOLUME_ID}/${LINK_ID}`);

        await waitFor(() => expect(navigateToNoAccess).toHaveBeenCalled());
        expect(handleSdkError).not.toHaveBeenCalled();
        expect(redirectToLink).not.toHaveBeenCalled();
    });

    it('hands an invitation link to the invitation flow', async () => {
        renderAt(`/${VOLUME_ID}/${LINK_ID}?invitation=invitation-id`);

        await waitFor(() =>
            expect(mockRedirectOrAcceptInvitation).toHaveBeenCalledWith(expect.any(AbortSignal), {
                invitationId: 'invitation-id',
                volumeId: VOLUME_ID,
                linkId: LINK_ID,
            })
        );
    });

    it.each(['invitation=invitation-id', 'externalInvitationID=invitation-id'])(
        'leaves the node lookup to the invitation flow when the link has %s',
        async (query) => {
            mockNodes({ type: NodeType.Folder });

            renderAt(`/${VOLUME_ID}/${LINK_ID}?${query}`);

            await new Promise((resolve) => setTimeout(resolve));
            expect(getNode).not.toHaveBeenCalled();
            expect(redirectToLink).not.toHaveBeenCalled();
            expect(navigateToNoAccess).not.toHaveBeenCalled();
        }
    );
});
