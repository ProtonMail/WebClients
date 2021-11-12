import { useEffect, useState } from 'react';
import { c } from 'ttag';

import { SessionKey } from 'pmcrypto';
import { DialogModal, useLoading, useNotifications } from '@proton/components';
import { SharedURLSessionKeyPayload, ShareURL } from '@proton/shared/lib/interfaces/drive/sharing';
import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';
import { SHARE_GENERATED_PASSWORD_LENGTH } from '@proton/shared/lib/drive/constants';

import useDrive from '../../hooks/drive/useDrive';
import useSharing from '../../hooks/drive/useSharing';
import useConfirm from '../../hooks/util/useConfirm';
import GeneratedLinkState from './GeneratedLinkState';
import ErrorState from './ErrorState';
import {
    hasNoCustomPassword,
    hasCustomPassword,
    hasGeneratedPasswordIncluded,
    splitGeneratedAndCustomPassword,
    getSharedLink,
} from '../../utils/link';
import ModalContentLoader from '../ModalContentLoader';
import useDriveEvents from '../../hooks/drive/useDriveEvents';

interface Props {
    onClose?: () => void;
    modalTitleID?: string;
    item: FileBrowserItem;
    shareId: string;
}

enum ShareLinkModalState {
    Loading,
    GeneratedLink,
}

function ShareLinkModal({ modalTitleID = 'share-link-modal', onClose, shareId, item, ...rest }: Props) {
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
    const { getShareMetaShort, deleteShare, getShareKeys } = useDrive();
    const driveEvents = useDriveEvents();
    const { createSharedLink, getSharedURLs, decryptSharedLink, updateSharedLink, deleteSharedLink } = useSharing();
    const { createNotification } = useNotifications();
    const { openConfirmModal } = useConfirm();

    useEffect(() => {
        // If token already loaded, don't reload it
        if (shareUrlInfo?.ShareURL.ShareID) {
            return;
        }

        const getShareMetaAsync = async (shareInfo?: { ID: string; sessionKey: SessionKey }) => {
            return getShareMetaShort(shareId).then(async ({ VolumeID }) => {
                const result = await createSharedLink(shareId, VolumeID, item.LinkID, shareInfo);
                await driveEvents.call(shareId);
                return result;
            });
        };

        const getToken = async () => {
            const shareUrlInfo = item.ShareUrlShareID
                ? await getSharedURLs(item.ShareUrlShareID).then(async ({ ShareURLs: [sharedUrl] }) => {
                      const shareUrlShareID = item.ShareUrlShareID as string;
                      if (sharedUrl) {
                          return decryptSharedLink(sharedUrl);
                      }

                      const { sessionKey } = await getShareKeys(shareUrlShareID);
                      return getShareMetaAsync({ ID: shareUrlShareID, sessionKey });
                  })
                : await getShareMetaAsync();

            setShareUrlInfo(shareUrlInfo);

            setPasswordToggledOn(hasCustomPassword(shareUrlInfo.ShareURL));
            setExpirationToggledOn(!!shareUrlInfo.ShareURL?.ExpirationTime);
            setPassword(shareUrlInfo.ShareURL.Password);
            setInitialExpiration(shareUrlInfo.ShareURL?.ExpirationTime);
        };

        getToken()
            .catch((err) => {
                console.error(err);
                setError(err);
            })
            .finally(() => {
                setModalState(ShareLinkModalState.GeneratedLink);
            });
    }, [shareId, item.LinkID, item.SharedUrl, shareUrlInfo?.ShareURL.ShareID]);

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
            const res = await updateSharedLink(
                {
                    shareId: shareUrlInfo.ShareURL.ShareID,
                    token: shareUrlInfo.ShareURL.Token,
                    flags: shareUrlInfo.ShareURL.Flags,
                    keyInfo: shareUrlInfo.keyInfo,
                },
                newDuration,
                newPassword
            );
            await driveEvents.call(shareId);
            return res;
        };

        const updatedFields = await withSaving(update());
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
            const { Token, ShareID } = shareUrlInfo.ShareURL;
            await deleteSharedLink(ShareID, Token);
            await deleteShare(ShareID);
            await driveEvents.call(shareId);
            createNotification({
                text: c('Notification').t`The link to your file was deleted`,
            });
            onClose?.();
        };

        openConfirmModal({
            title: c('Title').t`Stop sharing with everyone?`,
            confirm: c('Action').t`Stop sharing`,
            message: c('Info')
                .t`This link will be permanently disabled. No one with this link will be able to access your file. To reshare the file, you will need a new link.`,
            canUndo: true,
            onConfirm: () => withDeleting(deleteLink()),
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
            onConfirm: () => onClose?.(),
            canUndo: true,
        });
    };

    const loading = modalState === ShareLinkModalState.Loading;

    const [, customPassword] = splitGeneratedAndCustomPassword(password, shareUrlInfo?.ShareURL);

    const url = getSharedLink(shareUrlInfo?.ShareURL);

    const renderModalState = () => {
        if (loading) {
            const loadingMessage = item.SharedUrl
                ? c('Info').t`Preparing link to file`
                : c('Info').t`Creating link to file`;
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
        <DialogModal modalTitleID={modalTitleID} onClose={handleClose} {...rest}>
            {renderModalState()}
        </DialogModal>
    );
}

export default ShareLinkModal;
