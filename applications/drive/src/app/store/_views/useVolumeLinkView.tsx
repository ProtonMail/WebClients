import { c } from 'ttag';

import { useNotifications } from '@proton/components';
import { queryResolveContextShare } from '@proton/shared/lib/api/drive/share';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import type { LinkType } from '@proton/shared/lib/interfaces/drive/link';

import { sendErrorReport } from '../../utils/errorHandling';
import { EnrichedError } from '../../utils/errorHandling/EnrichedError';
import { useInvitationsActions } from '../_actions';
import { useDebouncedRequest } from '../_api';
import { EXTERNAL_INVITATIONS_ERROR_NAMES, useInvitations } from '../_invitations';
import type { DecryptedLink } from '../_links';
import { useLink } from '../_links';
import { type ShareInvitationDetails } from '../_shares';
import { useVolumesState } from '../_volumes';

export const useVolumeLinkView = () => {
    const { getInvitationDetails, convertExternalInvitation } = useInvitations();
    const { acceptInvitation } = useInvitationsActions();
    const debouncedRequest = useDebouncedRequest();
    const { getLink } = useLink();

    const { createNotification } = useNotifications();
    const volumeState = useVolumesState();

    const getContextShareLinkDetails = async (
        abortSignal: AbortSignal,
        { volumeId, linkId }: { volumeId: string; linkId: string }
    ) => {
        const { ContextShareID: contextShareId } = await debouncedRequest<{
            Code: number;
            ContextShareID: string;
        }>(queryResolveContextShare({ volumeId, linkId }));
        return getLink(abortSignal, contextShareId, linkId);
    };

    const handleRedirectOrAcceptInvitation = async (
        abortSignal: AbortSignal,
        {
            invitationId,
            volumeId,
            linkId,
        }: {
            invitationId: string;
            volumeId: string;
            linkId: string;
        }
    ): Promise<{ linkId: string; shareId: string; isFile: boolean; mimeType: string; type?: LinkType } | undefined> => {
        try {
            const invitationDetails: ShareInvitationDetails | undefined = await getInvitationDetails(abortSignal, {
                invitationId,
                volumeId,
                linkId,
            }).catch(async (error) => {
                if (error.data?.Code === API_CUSTOM_ERROR_CODES.NOT_FOUND) {
                    return undefined;
                }
                throw error;
            });

            if (!invitationDetails) {
                const link: DecryptedLink | undefined = await getContextShareLinkDetails(abortSignal, {
                    volumeId,
                    linkId,
                }).catch((error) => {
                    if (error.data?.Code === API_CUSTOM_ERROR_CODES.NOT_FOUND) {
                        return undefined;
                    }
                    throw error;
                });
                if (link?.shareId) {
                    volumeState.setVolumeShareIds(volumeId, [link.shareId]);
                    return {
                        linkId: link.linkId,
                        shareId: link.shareId,
                        isFile: link.isFile,
                        mimeType: link.mimeType,
                        type: link.type,
                    };
                }
                // This will happen if we can't find the invite and the file/folder does not exist
                return;
            }
            const acceptedInvitation = await acceptInvitation(abortSignal, invitationId, false);
            if (!acceptedInvitation) {
                return;
            }
            return {
                linkId: invitationDetails.link.linkId,
                shareId: invitationDetails.share.shareId,
                isFile: invitationDetails.link.isFile,
                mimeType: invitationDetails.link.mimeType,
                type: invitationDetails.link.type,
            };
        } catch (error) {
            // This is to make TS work with error typing
            let message;
            if (error instanceof Error) {
                message = error.message;
            }
            if (message) {
                sendErrorReport(error);
                createNotification({
                    type: 'error',
                    text: message,
                });
            }
            throw error;
        }
    };

    const handleConvertExternalInvitation = async (
        abortSignal: AbortSignal,
        {
            externalInvitationId,
            volumeId,
            linkId,
        }: {
            externalInvitationId: string;
            volumeId: string;
            linkId: string;
        }
    ) => {
        const link = await getContextShareLinkDetails(abortSignal, { volumeId, linkId });
        if (!link.shareId) {
            throw new EnrichedError('No share found for given invitation', {
                tags: {
                    volumeId,
                    linkId,
                },
            });
        }
        return convertExternalInvitation(abortSignal, {
            contextShareId: link.rootShareId,
            volumeId,
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
                    if (
                        error.name !== EXTERNAL_INVITATIONS_ERROR_NAMES.DISABLED &&
                        error.name !== EXTERNAL_INVITATIONS_ERROR_NAMES.NOT_FOUND
                    ) {
                        sendErrorReport(error);
                    }
                    createNotification({
                        type: 'error',
                        text: error.message,
                    });
                }
                throw error;
            });
    };

    return { handleRedirectOrAcceptInvitation, handleConvertExternalInvitation };
};
