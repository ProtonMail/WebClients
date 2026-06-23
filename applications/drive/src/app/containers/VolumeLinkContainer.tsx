import type { FC } from 'react';
import { useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom-v5-compat';

import { c } from 'ttag';

import { Loader } from '@proton/components';
import { generateNodeUid, getDrive, getDriveForPhotos, splitInvitationUid, splitNodeUid } from '@proton/drive';
import { handleSdkError } from '@proton/drive/legacy/errorHandling';
import { getNodeEntity } from '@proton/drive/legacy/sdkUtils/getNodeEntity';
import { getNotificationsManager } from '@proton/drive/modules/notifications';

import useDriveNavigation from '../legacy/hooks/drive/useNavigate';
import { useRedirectOrAcceptInvitation } from './useRedirectOrAcceptInvitation';

export const VolumeLinkContainer: FC = () => {
    const { volumeId, linkId } = useParams<{ volumeId: string; linkId: string }>();
    const { search } = useLocation();
    const searchParams = new URLSearchParams(search);
    const invitationId = searchParams.get('invitation');
    const externalInvitationId = searchParams.get('externalInvitationID');
    const { navigateToSharedByMe, navigateToNoAccess } = useDriveNavigation();
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
