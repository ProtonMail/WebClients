import { useCallback, useEffect, useState } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/components';
import { useLoading } from '@proton/hooks';
import { SHARE_GENERATED_PASSWORD_LENGTH } from '@proton/shared/lib/drive/constants';
import { isProtonDocument } from '@proton/shared/lib/helpers/mimetype';
import type { SharedURLSessionKeyPayload } from '@proton/shared/lib/interfaces/drive/sharing';

import { sendErrorReport } from '../../utils/errorHandling';
import { useDriveDocsPublicSharingFF } from '../_documents';
import type { DecryptedLink } from '../_links';
import { useLink } from '../_links';
import type { ShareURL } from '../_shares';
import { getSharedLink, splitGeneratedAndCustomPassword, useShareActions, useShareUrl } from '../_shares';
import type useShareMemberView from './useShareMemberView';

const getLoadingMessage = (isLinkLoading: boolean, haveShareUrl: boolean, isFile: boolean) => {
    if (isLinkLoading) {
        return c('Info').t`Loading link`;
    }
    if (haveShareUrl) {
        return isFile ? c('Info').t`Preparing link to file` : c('Info').t`Preparing link to folder`;
    }

    return isFile ? c('Info').t`Creating link to file` : c('Info').t`Creating link to folder`;
};

const getConfirmationMessage = () => {
    return c('Info').t`This action will delete the link and revoke access for all users.`;
};

const getErrorMessage = (isCreationError: boolean, error: string) => {
    if (isCreationError) {
        return error
            ? c('Info').t`Failed to generate a secure link. The reason is: ${error}`
            : c('Info').t`Failed to generate a secure link. Try again later`;
    }
    return c('Info').t`Failed to open a secure link. The reason is: ${error}`;
};

const getSharingInfoMessage = (isFile: boolean) => {
    return isFile
        ? c('Info').t`Anyone with this link can access your file.`
        : c('Info').t`Anyone with this link can access your folder.`;
};

const getPasswordProtectedSharingInfoMessage = (isFile: boolean) => {
    return isFile
        ? c('Info').t`Only the people with the link and the password can access this file.`
        : c('Info').t`Only the people with the link and the password can access this folder.`;
};

/**
 * useLinkView loads link if not cached yet.
 */
export default function useShareURLView(shareId: string, linkId: string) {
    const { getLink } = useLink();
    const [shareUrlInfo, setShareUrlInfo] = useState<{
        shareUrl: ShareURL;
        keyInfo: SharedURLSessionKeyPayload;
    }>();
    const { loadShareUrl, updateShareUrl, deleteShareUrl, createShareUrl, getShareIdWithSessionkey } = useShareUrl();
    const { deleteShare } = useShareActions();

    const [sharedLink, setSharedLink] = useState('');
    const [password, setPassword] = useState('');
    const [initialExpiration, setInitialExpiration] = useState<number | null>(null);
    const [error, setError] = useState('');

    const [link, setLink] = useState<DecryptedLink>();
    const [isLinkLoading, withLinkLoading] = useLoading(true);
    const [isShareUrlLoading, withShareUrlLoading] = useLoading(true);
    const [isSaving, withSaving] = useLoading();
    const [isDeleting, withDeleting] = useLoading();
    const [isCreating, withCreating] = useLoading();
    const { createNotification } = useNotifications();

    const { isDocsPublicSharingEnabled } = useDriveDocsPublicSharingFF();

    const shareUrl = shareUrlInfo?.shareUrl;

    const [, customPassword] = splitGeneratedAndCustomPassword(password, shareUrl);

    useEffect(() => {
        const abortController = new AbortController();
        void withLinkLoading(
            getLink(abortController.signal, shareId, linkId)
                .then(setLink)
                .catch((err) => {
                    setError(err);
                    sendErrorReport(err);
                })
        );
        return () => {
            abortController.abort();
        };
    }, [shareId, linkId]);

    const ShareID = shareUrl?.shareId;
    useEffect(() => {
        const abortController = new AbortController();
        void withShareUrlLoading(() => {
            if (ShareID) {
                return Promise.resolve();
            }

            return loadShareUrl(abortController.signal, shareId, linkId)
                .then((shareUrlInfo) => {
                    if (shareUrlInfo) {
                        setShareUrlInfo(shareUrlInfo);
                        setPassword(shareUrlInfo.shareUrl.password);
                        setInitialExpiration(shareUrlInfo.shareUrl.expirationTime);
                        const sharedLink = getSharedLink(shareUrlInfo.shareUrl);
                        if (sharedLink) {
                            setSharedLink(sharedLink);
                        }
                    }
                })
                .catch((err) => {
                    setError(err);
                });
        });

        return () => {
            abortController.abort();
        };
    }, [shareId, linkId, ShareID]);

    const updateLinkState = useCallback(
        async (abortSignal: AbortSignal) => {
            const link = await getLink(abortSignal, shareId, linkId);
            setLink(link);
        },
        [shareId, linkId]
    );

    const createSharedLink = () => {
        void withCreating(async () => {
            const abortController = new AbortController();
            const { shareId: linkShareId, sessionKey } = await getShareIdWithSessionkey(
                abortController.signal,
                shareId,
                linkId
            );

            return createShareUrl(abortController.signal, shareId, linkShareId, sessionKey)
                .then(async (shareUrlInfo) => {
                    if (shareUrlInfo) {
                        setShareUrlInfo(shareUrlInfo);
                        setPassword(shareUrlInfo.shareUrl.password);
                        setInitialExpiration(shareUrlInfo.shareUrl.expirationTime);
                        const sharedLink = getSharedLink(shareUrlInfo.shareUrl);
                        if (sharedLink) {
                            setSharedLink(sharedLink);
                            await updateLinkState(abortController.signal);
                        }
                    }
                })
                .catch((err) => {
                    setError(err);
                });
        });
    };

    const saveSharedLink = async (newCustomPassword?: string, newDuration?: number | null) => {
        if (!shareUrl) {
            return;
        }

        // Empty string as a newCustomPassword will remove it from the link.
        // `undefined` is to leave the password as it is.
        let newPassword = newCustomPassword;
        if (newCustomPassword !== undefined && shareUrl.hasGeneratedPasswordIncluded) {
            newPassword = password.substring(0, SHARE_GENERATED_PASSWORD_LENGTH) + newCustomPassword;
        }

        const update = () => {
            const abortController = new AbortController();
            return updateShareUrl(
                abortController.signal,
                {
                    shareId: shareUrl.shareId,
                    shareUrlId: shareUrl.shareUrlId,
                    flags: shareUrl.flags,
                    keyInfo: shareUrlInfo.keyInfo,
                },
                newDuration,
                newPassword
            );
        };

        const updatedFields = await withSaving(update()).catch((error) => {
            createNotification({
                type: 'error',
                text: c('Notification').t`Your settings failed to be saved`,
            });
            throw error;
        });
        createNotification({
            text: c('Notification').t`Your settings have been changed successfully`,
        });
        setShareUrlInfo({
            shareUrl: {
                ...shareUrl,
                ...updatedFields,
            },
            keyInfo: shareUrlInfo.keyInfo,
        });

        if (updatedFields && updatedFields.password !== undefined) {
            setPassword(updatedFields.password);
        }
        if (updatedFields && updatedFields.expirationTime !== undefined) {
            setInitialExpiration(updatedFields.expirationTime);
        }

        return updatedFields;
    };

    // TODO: Remove this parameter when we will have share events
    const deleteLink = async (deleteIfEmptyCallback: ReturnType<typeof useShareMemberView>['deleteShareIfEmpty']) => {
        if (!link || !shareUrl) {
            return;
        }

        await withDeleting(async () => {
            const abortController = new AbortController();
            await deleteShareUrl(shareUrl.shareId, shareUrl.shareUrlId)
                .then(() => {
                    setShareUrlInfo(undefined);
                    setSharedLink('');
                    setPassword('');
                    setInitialExpiration(null);
                    createNotification({
                        text: c('Notification').t`The link to your item was deleted`,
                    });
                })
                .catch(() => {
                    createNotification({
                        type: 'error',
                        text: c('Notification').t`The link to your item failed to be deleted`,
                    });
                });
            await updateLinkState(abortController.signal);
            await deleteIfEmptyCallback();
        });
    };

    const stopSharing = async () => {
        return withDeleting(async () => {
            const abortController = new AbortController();
            const loadedLink = await getLink(abortController.signal, shareId, linkId);
            if (!loadedLink?.sharingDetails) {
                return;
            }
            await deleteShare(loadedLink.sharingDetails.shareId, { force: true })
                .then(() => {
                    createNotification({
                        text: c('Notification').t`You stopped sharing this item`,
                    });
                })
                .catch(() => {
                    createNotification({
                        type: 'error',
                        text: c('Notification').t`Stopping to share this item has failed`,
                    });
                });
            await updateLinkState(abortController.signal);
        });
    };

    const loadingMessage =
        isLinkLoading || isShareUrlLoading
            ? getLoadingMessage(isLinkLoading, !!link?.shareUrl, !!link?.isFile)
            : undefined;
    const confirmationMessage = getConfirmationMessage();
    const haveError = error || (!isLinkLoading && !link);
    const errorMessage = haveError ? getErrorMessage(!link?.shareUrl, error) : undefined;
    // Show message "protected by password" only when password is saved.
    const sharedInfoMessage = customPassword
        ? getPasswordProtectedSharingInfoMessage(!!link?.isFile)
        : getSharingInfoMessage(!!link?.isFile);

    return {
        isDeleting,
        isSaving,
        name: link?.name || '', // If the link is not loaded we will return an error message anyway
        isShareUrlEnabled: !!link?.mimeType && isProtonDocument(link.mimeType) ? isDocsPublicSharingEnabled : true,
        initialExpiration,
        customPassword,
        sharedLink,
        hasSharedLink: !!link?.shareUrl,
        isShareUrlLoading,
        loadingMessage,
        confirmationMessage,
        errorMessage,
        sharedInfoMessage,
        hasGeneratedPasswordIncluded: !!shareUrl?.hasGeneratedPasswordIncluded,
        createSharedLink,
        saveSharedLink,
        deleteLink,
        stopSharing,
        isCreating,
    };
}
