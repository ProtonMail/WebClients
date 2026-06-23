import { useCallback } from 'react';

import { c } from 'ttag';

import { generateNodeUid, getDrive, getDriveForPhotos, getDrivePerNodeType, splitInvitationUid } from '@proton/drive';
import { handleSdkError } from '@proton/drive/legacy/errorHandling';
import { BusDriverEventName, getBusDriver } from '@proton/drive/modules/busDriver';
import { logging } from '@proton/drive/modules/logging';
import { getNotificationsManager } from '@proton/drive/modules/notifications';
import { isNativeProtonDocsAppFile } from '@proton/shared/lib/helpers/mimetype';

import useDriveNavigation from '../legacy/hooks/drive/useNavigate';
import { getOpenInDocsInfo, openDocsOrSheetsDocument } from '../utils/docs/openInDocs';

const logger = logging.getLogger('redirect-or-accept-invitation');

/**
 * Resolves an invitation deep-link (`?invitation=...`) and redirects the user to the right place.
 *
 * - Accept path: finds the pending invitation matching `invitationId` and accepts it. The SDK has
 *   no single-invitation lookup, so we iterate. Invitations live on separate clients for regular
 *   drive and photos, so both are checked.
 * - Get-node path: if no pending invitation is found, the user may already have access (invitation
 *   accepted on another device/tab); we resolve the node directly.
 *
 * Once resolved, the user is redirected to Docs/Sheets, the node location, or the no-access screen.
 */
export const useRedirectOrAcceptInvitation = () => {
    const { navigateToSharedWithMe, navigateToNoAccess, navigateToNodeUid } = useDriveNavigation();

    return useCallback(
        async (
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
        ) => {
            const nodeUid = generateNodeUid(volumeId, linkId);
            const drives = [getDrive(), getDriveForPhotos()];

            const onError = (error: unknown) => {
                logger.error(`Failed to resolve invitation ${invitationId} (node ${nodeUid})`, error);
                handleSdkError(error);
                navigateToSharedWithMe();
            };

            try {
                let node;

                for (const drive of drives) {
                    for await (const invitation of drive.iterateInvitations(abortSignal)) {
                        if (splitInvitationUid(invitation.uid).invitationId !== invitationId) {
                            continue;
                        }
                        try {
                            await drive.acceptInvitation(invitation.uid);

                            await getBusDriver().emit(
                                {
                                    type: BusDriverEventName.ACCEPT_INVITATIONS,
                                    uids: [invitation.node.uid],
                                },
                                drive
                            );

                            getNotificationsManager().createNotification({
                                type: 'success',
                                text: c('Notification').t`Share invitation accepted successfully`,
                            });
                        } catch (e) {
                            handleSdkError(e, {
                                fallbackMessage: c('Notification').t`Failed to accept share invitation`,
                            });
                        }
                        node = invitation.node;
                        break;
                    }
                    if (node) {
                        break;
                    }
                }

                // No pending invitation: the user may already have access. We don't know which
                // client the link belongs to, so we try both.
                if (!node) {
                    logger.info(
                        `No pending invitation found for ${invitationId}, trying to get node ${nodeUid} directly`
                    );

                    for (const drive of drives) {
                        try {
                            node = await drive.getNode(nodeUid);
                            break;
                        } catch (e) {
                            // TODO: Once the SDK enforces which client to use, the failure will be a
                            // specific "wrong client" error. Until then, any error means the node may
                            // belong to the other client, so we try it next.
                            logger.warn(
                                `Failed to get node ${nodeUid}: ${e instanceof Error ? e.message : 'unknown error'}`
                            );
                            continue;
                        }
                    }
                }

                if (!node) {
                    logger.warn(`No invitation or node found for invitation ${invitationId} (node ${nodeUid})`);
                    navigateToNoAccess();
                    return;
                }

                if (node.mediaType && isNativeProtonDocsAppFile(node.mediaType)) {
                    const openInDocsInfo = getOpenInDocsInfo(node.mediaType);
                    if (openInDocsInfo) {
                        await openDocsOrSheetsDocument({
                            uid: node.uid,
                            type: openInDocsInfo.type,
                            isNative: openInDocsInfo.isNative,
                            openBehavior: 'redirect',
                        });
                        return;
                    }
                }

                await navigateToNodeUid(node.uid, getDrivePerNodeType(node.type), '/shared-with-me');
            } catch (e) {
                onError(e);
            }
        },
        [navigateToNoAccess, navigateToNodeUid, navigateToSharedWithMe]
    );
};
