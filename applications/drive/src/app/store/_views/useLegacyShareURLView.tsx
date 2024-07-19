import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/components';
import { useLoading } from '@proton/hooks';
import { SHARE_GENERATED_PASSWORD_LENGTH } from '@proton/shared/lib/drive/constants';
import type { SharedURLSessionKeyPayload } from '@proton/shared/lib/interfaces/drive/sharing';

import { sendErrorReport } from '../../utils/errorHandling';
import type { DecryptedLink } from '../_links';
import { useLink } from '../_links';
import type { ShareURLLEGACY } from '../_shares';
import { getSharedLink, splitGeneratedAndCustomPassword } from '../_shares';
import useLegacyShareUrl from '../_shares/useLegacyShareUrl';

const getLoadingMessage = (isLinkLoading: boolean, haveShareUrl: boolean, isFile: boolean) => {
    if (isLinkLoading) {
        return c('Info').t`Loading link`;
    }
    if (haveShareUrl) {
        return isFile ? c('Info').t`Preparing link to file` : c('Info').t`Preparing link to folder`;
    }

    return isFile ? c('Info').t`Creating link to file` : c('Info').t`Creating link to folder`;
};

const getConfirmationMessage = (isFile: boolean) => {
    return isFile
        ? c('Info')
              .t`This link will be permanently disabled. No one with this link will be able to access your file. To reshare the file, you will need a new link.`
        : c('Info')
              .t`This link will be permanently disabled. No one with this link will be able to access your folder. To reshare the folder, you will need a new link.`;
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
export default function useLegacyShareURLView(shareId: string, linkId: string) {
    const { getLink } = useLink();
    const [shareUrlInfo, setShareUrlInfo] = useState<{
        shareUrl: ShareURLLEGACY;
        keyInfo: SharedURLSessionKeyPayload;
    }>();
    const { loadOrCreateShareUrl, updateShareUrl, deleteShareUrl } = useLegacyShareUrl();

    const [sharedLink, setSharedLink] = useState('');
    const [password, setPassword] = useState('');
    const [initialExpiration, setInitialExpiration] = useState<number | null>(null);
    const [error, setError] = useState('');

    const [link, setLink] = useState<DecryptedLink>();
    const [isLinkLoading, withLinkLoading] = useLoading(true);
    const [isShareUrlLoading, withShareUrlLoading] = useLoading(true);
    const [isSaving, withSaving] = useLoading();
    const [isDeleting, withDeleting] = useLoading();
    const { createNotification } = useNotifications();

    const shareUrl = shareUrlInfo?.shareUrl;

    const [, customPassword] = splitGeneratedAndCustomPassword(password, shareUrl);

    useEffect(() => {
        const abortController = new AbortController();
        void withLinkLoading(
            getLink(abortController.signal, shareId, linkId)
                .then((link) => {
                    setLink(link);
                })
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
            return loadOrCreateShareUrl(abortController.signal, shareId, linkId)
                .then((shareUrlInfo) => {
                    setShareUrlInfo(shareUrlInfo);
                    setPassword(shareUrlInfo.shareUrl.password);
                    setInitialExpiration(shareUrlInfo.shareUrl.expirationTime);
                    const sharedLink = getSharedLink(shareUrlInfo.shareUrl);
                    if (sharedLink) {
                        setSharedLink(sharedLink);
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

    const deleteLink = async () => {
        if (!link || !shareUrl) {
            return;
        }

        return withDeleting(
            deleteShareUrl(shareUrl.shareId, shareUrl.shareUrlId)
                .then(() => {
                    createNotification({
                        text: c('Notification').t`The link to your item was deleted`,
                    });
                })
                .catch(() => {
                    createNotification({
                        type: 'error',
                        text: c('Notification').t`The link to your item failed to be deleted`,
                    });
                })
        );
    };

    const loadingMessage =
        isLinkLoading || isShareUrlLoading
            ? getLoadingMessage(isLinkLoading, !!link?.shareUrl, !!link?.isFile)
            : undefined;
    const confirmationMessage = getConfirmationMessage(!!link?.isFile);
    const haveError = error || (!isLinkLoading && !link) || (!isShareUrlLoading && !shareUrlInfo);
    const errorMessage = haveError ? getErrorMessage(!link?.shareUrl, error) : undefined;
    // Show message "protected by password" only when password is saved.
    const sharedInfoMessage = customPassword
        ? getPasswordProtectedSharingInfoMessage(!!link?.isFile)
        : getSharingInfoMessage(!!link?.isFile);

    return {
        isDeleting,
        isSaving,
        name: link?.name || '', // If the link is not loaded we will return an error message anyway
        initialExpiration,
        customPassword,
        sharedLink,
        loadingMessage,
        confirmationMessage,
        errorMessage,
        sharedInfoMessage,
        hasCustomPassword: !!shareUrl?.hasCustomPassword,
        hasGeneratedPasswordIncluded: !!shareUrl?.hasGeneratedPasswordIncluded,
        hasExpirationTime: !!shareUrl?.expirationTime,
        saveSharedLink,
        deleteLink,
    };
}
