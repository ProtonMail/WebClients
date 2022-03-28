import { useEffect, useState } from 'react';
import { c } from 'ttag';

import { ModalTwo, useLoading, useNotifications } from '@proton/components';
import { SharedURLSessionKeyPayload, ShareURL } from '@proton/shared/lib/interfaces/drive/sharing';
import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';
import { SHARE_GENERATED_PASSWORD_LENGTH } from '@proton/shared/lib/drive/constants';

import useConfirm from '../../hooks/util/useConfirm';
import {
    useShareUrl,
    hasNoCustomPassword,
    hasCustomPassword,
    hasGeneratedPasswordIncluded,
    splitGeneratedAndCustomPassword,
    getSharedLink,
} from '../../store';
import ModalContentLoader from '../ModalContentLoader';
import GeneratedLinkState from './GeneratedLinkState';
import ErrorState from './ErrorState';

const getLoadingMessage = (item: FileBrowserItem) => {
    if (item.SharedUrl) {
        return item.IsFile ? c('Info').t`Preparing link to file` : c('Info').t`Preparing link to folder`;
    }

    return item.IsFile ? c('Info').t`Creating link to file` : c('Info').t`Creating link to folder`;
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
    item: FileBrowserItem;
    shareId: string;
    open?: boolean;
}

enum ShareLinkModalState {
    Loading,
    GeneratedLink,
}

function ShareLinkModal({ modalTitleID = 'share-link-modal', onClose, shareId, item, open }: Props) {
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
        loadOrCreateShareUrl(abortController.signal, shareId, item.LinkID)
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
    }, [shareId, item.LinkID, shareUrlInfo?.ShareURL.ShareID]);

    const handleSaveSharedLink = async (newCustomPassword?: string, newDuration?: number | null) => {
        if (!shareUrlInfo) {
            return;
        }

        // Empty string as a newCustomPassword will remove it from the link.
        // `undefined` is to leave the password as it is.
        let newPassword = newCustomPassword;
        // Generated password has to be used for any new custom password (no
        // custom password set yet), or when generated password was already
        // set before.
        // This can be simplified once legacy custom password without generated
        // prefix is not used anymore.
        if (
            newCustomPassword !== undefined &&
            (hasNoCustomPassword(shareUrlInfo.ShareURL) || hasGeneratedPasswordIncluded(shareUrlInfo.ShareURL))
        ) {
            newPassword = password.substring(0, SHARE_GENERATED_PASSWORD_LENGTH) + newCustomPassword;
        }

        const update = async () => {
            const res = await updateShareUrl(
                {
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
        if (!shareUrlInfo) {
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
            message: getConfirmationMessage(item.IsFile),
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
        if (loading) {
            const loadingMessage = getLoadingMessage(item);
            return <ModalContentLoader>{loadingMessage}</ModalContentLoader>;
        }

        if (error || !shareUrlInfo || !item || !url) {
            return <ErrorState modalTitleID={modalTitleID} onClose={onClose} error={error} isCreationError={!item} />;
        }

        if (modalState === ShareLinkModalState.GeneratedLink) {
            const isValidForPasswordRemoval =
                hasCustomPassword(shareUrlInfo.ShareURL) && !hasGeneratedPasswordIncluded(shareUrlInfo.ShareURL);

            return (
                <GeneratedLinkState
                    modalTitleID={modalTitleID}
                    passwordToggledOn={passwordToggledOn}
                    expirationToggledOn={expirationToggledOn}
                    itemName={item.Name}
                    isFile={item.IsFile}
                    onClose={handleClose}
                    onIncludePasswordToggle={handleToggleIncludePassword}
                    onIncludeExpirationTimeToogle={handleToggleIncludeExpirationTime}
                    onSaveLinkClick={handleSaveSharedLink}
                    onDeleteLinkClick={handleDeleteLinkClick}
                    onFormStateChange={handleFormStateChange}
                    customPassword={customPassword}
                    initialExpiration={initialExpiration}
                    url={url}
                    isValidForPasswordRemoval={isValidForPasswordRemoval}
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
