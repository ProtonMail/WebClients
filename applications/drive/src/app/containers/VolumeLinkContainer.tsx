import { FC, useEffect } from 'react';
import { RouteComponentProps, useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { useNotifications } from '@proton/components';
import { Loader } from '@proton/components/components';

import useNavigate from '../hooks/drive/useNavigate';
import { useShareInvitation } from '../store/_shares';
import { sendErrorReport } from '../utils/errorHandling';

export const VolumeLinkContainer: FC<RouteComponentProps<{ volumeId: string; linkId: string }>> = ({ match }) => {
    const { search } = useLocation();
    const { navigateToSharedWithMe, navigateToSharedByMe } = useNavigate();
    const { acceptInvitation, convertExternalInvitation } = useShareInvitation();
    const { createNotification } = useNotifications();
    const searchParams = new URLSearchParams(search);
    const invitationId = searchParams.get('invitation');
    const externalInvitationId = searchParams.get('externalInvitationID');
    const { volumeId, linkId } = match.params;

    useEffect(() => {
        if (!invitationId) {
            return;
        }
        const abortController = new AbortController();
        void acceptInvitation(abortController.signal, { invitationId, volumeId, linkId })
            .then((result) => {
                if (result?.Code === 1000) {
                    createNotification({
                        type: 'success',
                        text: c('Notification').t`Share invitation accepted successfully`,
                    });
                } else {
                    createNotification({
                        type: 'error',
                        text: c('Notification').t`Failed to accept share invitation`,
                    });
                }
            })
            .catch((error) => {
                if (error.message) {
                    sendErrorReport(error);
                    createNotification({
                        type: 'error',
                        text: error.message,
                    });
                }

                return error;
            })
            .finally(() => {
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
        void convertExternalInvitation(abortController.signal, {
            externalInvitationId,
            linkId,
        })
            .then((result) => {
                if (result?.code === 1000) {
                    createNotification({
                        type: 'success',
                        text: c('Notification').t`An invitation has been sent`,
                    });
                } else {
                    createNotification({
                        type: 'error',
                        text: c('Notification').t`Failed to convert external invitation`,
                    });
                }
            })
            .catch((error) => {
                if (error.message) {
                    sendErrorReport(error);
                    createNotification({
                        type: 'error',
                        text: error.message,
                    });
                }
                return error;
            })
            .finally(() => {
                navigateToSharedByMe();
            });

        return () => {
            abortController.abort();
        };
    }, [externalInvitationId]);
    // This is a temporary solution until we have proper view to accept/decline screens
    return <Loader />;
};
