import type { FC } from 'react';
import { useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom-v5-compat';

import { Loader } from '@proton/components';
import { isProtonDocsDocument, isProtonDocsSpreadsheet } from '@proton/shared/lib/helpers/mimetype';
import { LinkType } from '@proton/shared/lib/interfaces/drive/link';

import useDriveNavigation from '../hooks/drive/useNavigate';
import { useDocumentActions } from '../store/_documents';
import { useVolumeLinkView } from '../store/_views/useVolumeLinkView';

export const VolumeLinkContainer: FC = () => {
    const { volumeId, linkId } = useParams<{ volumeId: string; linkId: string }>();
    const { search } = useLocation();
    const searchParams = new URLSearchParams(search);
    const invitationId = searchParams.get('invitation');
    const externalInvitationId = searchParams.get('externalInvitationID');
    const { handleRedirectOrAcceptInvitation, handleConvertExternalInvitation } = useVolumeLinkView();
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
            .then((linkInfo) => {
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

    useEffect(() => {
        if (!externalInvitationId || !linkId || !volumeId) {
            return;
        }
        const abortController = new AbortController();
        void handleConvertExternalInvitation(abortController.signal, {
            volumeId,
            externalInvitationId,
            linkId,
        }).finally(() => {
            navigateToSharedByMe();
        });
        // No cleanup/abort function, allowing the action to continue in the background
    }, [externalInvitationId, volumeId]);
    // This is a temporary solution until we have proper view to accept/decline screens
    return <Loader size="medium" className="absolute inset-center" />;
};
