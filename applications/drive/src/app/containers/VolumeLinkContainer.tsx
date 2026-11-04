import type { FC } from 'react';
import { useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom-v5-compat';

import { c } from 'ttag';

import Loader from '@proton/components/components/loader/Loader';
import { handleSdkError } from '@proton/drive/legacy/errorHandling';
import { getNodeEntity } from '@proton/drive/legacy/sdkUtils/getNodeEntity';
import { getNodeAncestry } from '@proton/drive/modules/nodes';
import { getNotificationsManager } from '@proton/drive/modules/notifications';
import {
    NodeType,
    generateNodeUid,
    getDrive,
    getDriveForPhotos,
    splitInvitationUid,
    splitNodeUid,
} from '@proton/drive/sdk';

import useDriveNavigation from '../legacy/hooks/drive/useNavigate';
import { useRedirectOrAcceptInvitation } from './useRedirectOrAcceptInvitation';

// The URL only has a volume ID --> compare it with the photos root volume to pick the client.
const getDriveForVolume = async (volumeId: string) => {
    const photosRoot = await getDriveForPhotos()
        .getMyPhotosRootFolder()
        .then(getNodeEntity)
        .catch(() => undefined);
    const isPhotosVolume = photosRoot !== undefined && splitNodeUid(photosRoot.node.uid).volumeId === volumeId;
    return isPhotosVolume ? getDriveForPhotos() : getDrive();
};

export const VolumeLinkContainer: FC = () => {
    const { volumeId, linkId } = useParams<{ volumeId: string; linkId: string }>();
    const { search } = useLocation();
    const searchParams = new URLSearchParams(search);
    const invitationId = searchParams.get('invitation');
    const externalInvitationId = searchParams.get('externalInvitationID');
    const { navigateToSharedByMe, navigateToNoAccess, redirectToLink, redirectToAlbum } = useDriveNavigation();
    const redirectOrAcceptInvitation = useRedirectOrAcceptInvitation();

    useEffect(() => {
        if (!invitationId || !volumeId || !linkId) {
            return;
        }
        const abortController = new AbortController();
        void redirectOrAcceptInvitation(abortController.signal, { invitationId, volumeId, linkId });
        // No cleanup/abort function, allowing the action to continue in the background
    }, [invitationId, volumeId, linkId, redirectOrAcceptInvitation]);

    useEffect(
        function convertExternalInvitation() {
            if (!externalInvitationId || !linkId || !volumeId) {
                return;
            }
            // TODO: Update this once app is properly migratde to full UID logic
            const handleConvertExternalInvitation = async () => {
                try {
                    const drive = await getDriveForVolume(volumeId);
                    const nodeUid = generateNodeUid(volumeId, linkId);
                    const sharingInfo = await drive.getSharingInfo(nodeUid);
                    if (!sharingInfo) {
                        return;
                    }

                    const nonProtonInvitation = sharingInfo.nonProtonInvitations.find(
                        (nonProtonInvitation) =>
                            splitInvitationUid(nonProtonInvitation.uid).invitationId === externalInvitationId
                    );
                    if (!nonProtonInvitation) {
                        return;
                    }

                    await drive.convertNonProtonInvitation(nodeUid, nonProtonInvitation);
                    getNotificationsManager().createNotification({
                        text: c('Info').t`Invitation confirmed`,
                    });
                } catch (e) {
                    handleSdkError(e);
                } finally {
                    navigateToSharedByMe();
                }
            };
            void handleConvertExternalInvitation();

            // No cleanup/abort function, allowing the action to continue in the background
        },
        [externalInvitationId, linkId, navigateToSharedByMe, volumeId]
    );

    useEffect(
        function redirectVolumeUrlToShareUrl() {
            if (invitationId || externalInvitationId || !volumeId || !linkId) {
                return;
            }
            // Redirect (history replace) --> browser Back skips this route instead of reopening the node.
            const redirectToShareUrl = async () => {
                const ancestry = await getNodeAncestry(
                    generateNodeUid(volumeId, linkId),
                    await getDriveForVolume(volumeId)
                );
                if (!ancestry.ok) {
                    handleSdkError(ancestry.error, { showNotification: false });
                    navigateToNoAccess();
                    return;
                }
                const shareId = ancestry.value[0].deprecatedShareId;
                if (!shareId) {
                    navigateToNoAccess();
                    return;
                }
                const { type } = ancestry.value[ancestry.value.length - 1];
                if (type === NodeType.Album) {
                    redirectToAlbum(shareId, linkId);
                    return;
                }
                redirectToLink(shareId, linkId, type === NodeType.File || type === NodeType.Photo);
            };
            void redirectToShareUrl();
        },
        [invitationId, externalInvitationId, volumeId, linkId, navigateToNoAccess, redirectToLink, redirectToAlbum]
    );

    // This is a temporary solution until we have proper view to accept/decline screens
    return <Loader size="medium" className="absolute inset-center" />;
};
