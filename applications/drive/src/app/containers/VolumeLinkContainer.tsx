import { FC, useEffect } from 'react';
import { RouteComponentProps, useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { useNotifications } from '@proton/components';
import { Loader } from '@proton/components/components';

import useNavigate from '../hooks/drive/useNavigate';
import { useShareInvitation } from '../store/_shares';
import { EnrichedError } from '../utils/errorHandling/EnrichedError';

export const VolumeLinkContainer: FC<RouteComponentProps<{ volumeId: string; linkId: string }>> = ({ match }) => {
    const { search } = useLocation();
    const { navigateToSharedWithMe } = useNavigate();
    const { acceptInvitation } = useShareInvitation();
    const { createNotification } = useNotifications();
    const searchParams = new URLSearchParams(search);
    const invitationId = searchParams.get('invitation');
    const { volumeId, linkId } = match.params;

    useEffect(() => {
        const abortController = new AbortController();
        if (invitationId) {
            acceptInvitation(abortController.signal, { invitationId, volumeId, linkId })
                .then(
                    (result) => {
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
                            throw new EnrichedError('Failed to accept share invitation', {
                                tags: { invitationId, volumeId, linkId },
                            });
                        }
                    },
                    (e) => {
                        throw new EnrichedError('Error while accepting share invitation', {
                            tags: { invitationId, volumeId, linkId },
                            extra: { e },
                        });
                    }
                )
                .finally(() => {
                    navigateToSharedWithMe();
                });
        } else {
            createNotification({
                type: 'error',
                text: c('Notification').t`Share invitation ID was not found. Please check the link`,
            });
        }
        return () => {
            abortController.abort();
        };
    }, [invitationId]);
    // This is a temporary solution until we have proper view to accept/decline screens
    return <Loader />;
};
