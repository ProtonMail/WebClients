import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { ModalTwo, useLoading, useNotifications } from '@proton/components';
import { SHARE_GENERATED_PASSWORD_LENGTH } from '@proton/shared/lib/drive/constants';
import { ShareURL, SharedURLSessionKeyPayload } from '@proton/shared/lib/interfaces/drive/sharing';

import useConfirm from '../../hooks/util/useConfirm';
import {
    DecryptedLink,
    getSharedLink,
    hasCustomPassword,
    hasGeneratedPasswordIncluded,
    splitGeneratedAndCustomPassword,
    useLinkView,
    useShareUrl,
} from '../../store';
import ModalContentLoader from '../ModalContentLoader';
import ErrorState from './ErrorState';
import GeneratedLinkState from './GeneratedLinkState';

const getLoadingMessage = (item: DecryptedLink) => {
    if (item.shareUrl) {
        return item.isFile ? c('Info').t`Preparing link to file` : c('Info').t`Preparing link to folder`;
    }

    return item.isFile ? c('Info').t`Creating link to file` : c('Info').t`Creating link to folder`;
};

const getConfirmationMessage = (isFile: boolean) => {
    return isFile
        ? c('Info')
              .t`This link will be permanently disabled. No one with this link will be able to access your file. To reshare the file, you will need a new link.`
        : c('Info')
              .t`This link will be permanently disabled. No one with this link will be able to access your folder. To reshare the folder, you will need a new link.`;
};

interface Props {
    onClose?: () => void;
    modalTitleID?: string;
    shareId: string;
    linkId: string;
    open?: boolean;
}

enum ShareLinkModalState {
    Loading,
    GeneratedLink,
}

function ShareLinkModal({ modalTitleID = 'share-link-modal', onClose, shareId, linkId, open }: Props) {
    const { link, isLoading: linkIsLoading, error: linkError } = useLinkView(shareId, linkId);

    const [modalState, setModalState] = useState(ShareLinkModalState.Loading);
    const [isSharingFormDirty, setIsSharingFormDirty] = useState(false);
    const [deleting, withDeleting] = useLoading(false);
    const [saving, withSaving] = useLoading(false);
    const [shareUrlInfo, setShareUrlInfo] = useState<{
        ShareURL: ShareURL;
        keyInfo: SharedURLSessionKeyPayload;
    }>();
    const [passwordToggledOn, setPasswordToggledOn] = useState(false);
    const [expirationToggledOn, setExpirationToggledOn] = useState(false);

    const [password, setPassword] = useState('');
    const [initialExpiration, setInitialExpiration] = useState<number | null>(null);
    const [error, setError] = useState('');

    const { loadOrCreateShareUrl, updateShareUrl, deleteShareUrl } = useShareUrl();
    const { createNotification } = useNotifications();
    const { openConfirmModal } = useConfirm();

    useEffect(() => {
        if (shareUrlInfo?.ShareURL.ShareID) {
            return;
        }

        const abortController = new AbortController();
        loadOrCreateShareUrl(abortController.signal, shareId, linkId)
            .then((shareUrlInfo) => {
                setShareUrlInfo(shareUrlInfo);
                setPasswordToggledOn(hasCustomPassword(shareUrlInfo.ShareURL));
                setExpirationToggledOn(!!shareUrlInfo.ShareURL?.ExpirationTime);
                setPassword(shareUrlInfo.ShareURL.Password);
                setInitialExpiration(shareUrlInfo.ShareURL?.ExpirationTime);
            })
            .catch((err) => {
                setError(err);
            })
            .finally(() => {
                setModalState(ShareLinkModalState.GeneratedLink);
            });

        return () => {
            abortController.abort();
        };
    }, [shareId, linkId, shareUrlInfo?.ShareURL.ShareID]);

    const handleSaveSharedLink = async (newCustomPassword?: string, newDuration?: number | null) => {
        if (!shareUrlInfo) {
            return;
        }

        // Empty string as a newCustomPassword will remove it from the link.
        // `undefined` is to leave the password as it is.
        let newPassword = newCustomPassword;
        if (newCustomPassword !== undefined && hasGeneratedPasswordIncluded(shareUrlInfo.ShareURL)) {
            newPassword = password.substring(0, SHARE_GENERATED_PASSWORD_LENGTH) + newCustomPassword;
        }

        const update = async () => {
            const res = await updateShareUrl(
                {
                    creatorEmail: shareUrlInfo.ShareURL.CreatorEmail,
                    shareId: shareUrlInfo.ShareURL.ShareID,
                    shareUrlId: shareUrlInfo.ShareURL.ShareURLID,
                    flags: shareUrlInfo.ShareURL.Flags,
                    keyInfo: shareUrlInfo.keyInfo,
                },
                newDuration,
                newPassword
            );
            return res;
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
            ...shareUrlInfo,
            ShareURL: {
                ...shareUrlInfo.ShareURL,
                ...updatedFields,
            },
        });

        if (updatedFields && updatedFields.Password !== undefined) {
            setPassword(updatedFields.Password);
        }
        if (updatedFields && updatedFields.ExpirationTime !== undefined) {
            setInitialExpiration(updatedFields.ExpirationTime);
        }

        return updatedFields;
    };

    const handleToggleIncludePassword = () => {
        setPasswordToggledOn((passwordToggledOn) => !passwordToggledOn);
    };

    const handleToggleIncludeExpirationTime = () => {
        setExpirationToggledOn((expirationToggledOn) => !expirationToggledOn);
    };

    const handleDeleteLinkClick = () => {
        if (!link || !shareUrlInfo) {
            return;
        }

        const deleteLink = async () => {
            const { ShareID, ShareURLID } = shareUrlInfo.ShareURL;
            await deleteShareUrl(ShareID, ShareURLID);
            createNotification({
                text: c('Notification').t`The link to your item was deleted`,
            });
            onClose?.();
        };

        openConfirmModal({
            title: c('Title').t`Stop sharing with everyone?`,
            confirm: c('Action').t`Stop sharing`,
            message: getConfirmationMessage(link.isFile),
            canUndo: true,
            onConfirm: () =>
                withDeleting(deleteLink()).catch(() => {
                    createNotification({
                        type: 'error',
                        text: c('Notification').t`The link to your item failed to be deleted`,
                    });
                }),
        });
    };

    const handleFormStateChange = ({ isFormDirty }: { isFormDirty: boolean }) => {
        setIsSharingFormDirty(isFormDirty);
    };

    const handleClose = () => {
        if (!isSharingFormDirty) {
            onClose?.();
            return;
        }

        openConfirmModal({
            title: c('Title').t`Discard changes?`,
            confirm: c('Title').t`Discard`,
            message: c('Info').t`You will lose all unsaved changes.`,
            onConfirm: async () => onClose?.(),
            canUndo: true,
        });
    };

    const loading = modalState === ShareLinkModalState.Loading;

    const [, customPassword] = splitGeneratedAndCustomPassword(password, shareUrlInfo?.ShareURL);

    const url = getSharedLink(shareUrlInfo?.ShareURL);

    const renderModalState = () => {
        if (linkIsLoading) {
            return <ModalContentLoader>{c('Info').t`Loading link`}</ModalContentLoader>;
        }

        if (linkError || !link) {
            return <ErrorState onClose={onClose} error={linkError} isCreationError={!link} />;
        }

        if (loading) {
            const loadingMessage = getLoadingMessage(link);
            return <ModalContentLoader>{loadingMessage}</ModalContentLoader>;
        }

        if (error || !shareUrlInfo || !url) {
            return <ErrorState onClose={onClose} error={error} isCreationError={!shareUrlInfo} />;
        }

        if (modalState === ShareLinkModalState.GeneratedLink) {
            const modificationDisabled = !hasGeneratedPasswordIncluded(shareUrlInfo.ShareURL);

            return (
                <GeneratedLinkState
                    modalTitleID={modalTitleID}
                    passwordToggledOn={passwordToggledOn}
                    expirationToggledOn={expirationToggledOn}
                    itemName={link.name}
                    isFile={link.isFile}
                    onClose={handleClose}
                    onIncludePasswordToggle={handleToggleIncludePassword}
                    onIncludeExpirationTimeToogle={handleToggleIncludeExpirationTime}
                    onSaveLinkClick={handleSaveSharedLink}
                    onDeleteLinkClick={handleDeleteLinkClick}
                    onFormStateChange={handleFormStateChange}
                    customPassword={customPassword}
                    initialExpiration={initialExpiration}
                    url={url}
                    modificationDisabled={modificationDisabled}
                    deleting={deleting}
                    saving={saving}
                />
            );
        }
    };

    return (
        <ModalTwo
            as="form"
            open={open}
            onClose={handleClose}
            onReset={(e: any) => {
                e.preventDefault();
                handleClose();
            }}
            disableCloseOnEscape={saving || deleting}
            size="large"
        >
            {renderModalState()}
        </ModalTwo>
    );
}

export default ShareLinkModal;
