import type { FC } from 'react';
import { useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom-v5-compat';

import { c } from 'ttag';

import { Loader } from '@proton/components';
import { generateNodeUid, getDrive, getDriveForPhotos, splitInvitationUid, splitNodeUid } from '@proton/drive';
import { BusDriverEventName, getBusDriver } from '@proton/drive/internal/BusDriver';
import { isProtonDocsDocument, isProtonDocsSpreadsheet } from '@proton/shared/lib/helpers/mimetype';
import { LinkType } from '@proton/shared/lib/interfaces/drive/link';

import useDriveNavigation from '../hooks/drive/useNavigate';
import { getNotificationsManager } from '../modules/notifications';
import { useDocumentActions } from '../store/_documents';
import { useVolumeLinkView } from '../store/_views/useVolumeLinkView';
import { handleSdkError } from '../utils/errorHandling/handleSdkError';
import { getNodeEntity } from '../utils/sdk/getNodeEntity';

export const VolumeLinkContainer: FC = () => {
    const { volumeId, linkId } = useParams<{ volumeId: string; linkId: string }>();
    const { search } = useLocation();
    const searchParams = new URLSearchParams(search);
    const invitationId = searchParams.get('invitation');
    const externalInvitationId = searchParams.get('externalInvitationID');
    const { handleRedirectOrAcceptInvitation } = useVolumeLinkView();
    const { navigateToSharedWithMe, navigateToSharedByMe, navigateToLink, navigateToNoAccess, navigateToAlbum } =
        useDriveNavigation();
    const { openDocument } = useDocumentActions();

    useEffect(() => {
        if (!invitationId || !volumeId || !linkId) {
            return;
        }
        const abortController = new AbortController();
        void handleRedirectOrAcceptInvitation(abortController.signal, {
            invitationId,
            volumeId,
            linkId,
        })
            .then(async (linkInfo) => {
                if (linkInfo && isProtonDocsDocument(linkInfo.mimeType)) {
                    return openDocument({
                        type: 'doc',
                        shareId: linkInfo.shareId,
                        linkId: linkInfo.linkId,
                        openBehavior: 'redirect',
                    });
                } else if (linkInfo && isProtonDocsSpreadsheet(linkInfo.mimeType)) {
                    return openDocument({
                        type: 'sheet',
                        shareId: linkInfo.shareId,
                        linkId: linkInfo.linkId,
                        openBehavior: 'redirect',
                    });
                } else if (linkInfo?.type === LinkType.ALBUM) {
                    navigateToAlbum(linkInfo.shareId, linkInfo.linkId);
                } else if (linkInfo?.shareId) {
                    // TODO: Migrate to new accept invitation with sdk
                    // Current issues:
                    // - invitationId/invitationUid, we only have invitationId and sdk is waiting of invitationUid
                    // - We don't get the mimeType so we can't switch between legacy/sdk accept invitation
                    // - We can't do a single getInvitation on drive sdk
                    await getBusDriver().emit(
                        {
                            type: BusDriverEventName.ACCEPT_INVITATIONS,
                            uids: [generateNodeUid(volumeId, linkId)],
                        },
                        getDrive()
                    );
                    navigateToLink(linkInfo.shareId, linkInfo.linkId, linkInfo.isFile, '/shared-with-me');
                } else {
                    navigateToNoAccess();
                }
            })
            .catch(() => {
                navigateToSharedWithMe();
            });
        // No cleanup/abort function, allowing the action to continue in the background
    }, [invitationId, volumeId, linkId]);

    useEffect(
        function convertExternalInvitation() {
            if (!externalInvitationId || !linkId || !volumeId) {
                return;
            }
            // TODO: Update this once app is properly migratde to full UID logic
            const handleConvertExternalInvitation = async () => {
                try {
                    const isPhotoNode =
                        volumeId ===
                        splitNodeUid(getNodeEntity(await getDriveForPhotos().getMyPhotosRootFolder()).node.uid)
                            .volumeId;
                    const drive = isPhotoNode ? getDriveForPhotos() : getDrive();
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

    useEffect(() => {
        if (!invitationId && !externalInvitationId && volumeId && linkId) {
            navigateToNoAccess();
        }
    }, [invitationId, externalInvitationId, volumeId, linkId, navigateToNoAccess]);

    // This is a temporary solution until we have proper view to accept/decline screens
    return <Loader size="medium" className="absolute inset-center" />;
};
