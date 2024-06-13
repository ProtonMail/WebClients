import { FC, useEffect } from 'react';
import { RouteComponentProps, useLocation } from 'react-router-dom';

import { Loader } from '@proton/components/components';

import useNavigate from '../hooks/drive/useNavigate';
import { useVolumeLinkView } from '../store/_views/useVolumeLinkView';

export const VolumeLinkContainer: FC<RouteComponentProps<{ volumeId: string; linkId: string }>> = ({ match }) => {
    const { search } = useLocation();
    const searchParams = new URLSearchParams(search);
    const invitationId = searchParams.get('invitation');
    const externalInvitationId = searchParams.get('externalInvitationID');
    const { volumeId, linkId } = match.params;
    const { handleRedirectOrAcceptInvitation, handleConvertExternalInvitation } = useVolumeLinkView();
    const { navigateToSharedWithMe, navigateToSharedByMe, navigateToLink, navigateToNoAccess } = useNavigate();

    useEffect(() => {
        if (!invitationId) {
            return;
        }
        const abortController = new AbortController();
        void handleRedirectOrAcceptInvitation(abortController.signal, {
            invitationId,
            volumeId,
            linkId,
        })
            .then((linkInfo) => {
                if (linkInfo?.shareId) {
                    navigateToLink(linkInfo.shareId, linkInfo.linkId, linkInfo.isFile, '/shared-with-me');
                } else {
                    navigateToNoAccess();
                }
            })
            .catch(() => {
                navigateToSharedWithMe();
            });

        return () => {
            abortController.abort();
        };
    }, [invitationId]);

    useEffect(() => {
        if (!externalInvitationId) {
            return;
        }
        const abortController = new AbortController();
        void handleConvertExternalInvitation(abortController.signal, {
            externalInvitationId,
            linkId,
        }).finally(() => {
            navigateToSharedByMe();
        });
        return () => {
            abortController.abort();
        };
    }, [externalInvitationId]);
    // This is a temporary solution until we have proper view to accept/decline screens
    return <Loader />;
};
