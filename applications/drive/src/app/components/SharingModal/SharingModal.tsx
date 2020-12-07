import { getRandomString } from 'proton-shared/lib/helpers/string';
import React, { useEffect, useState } from 'react';
import { DialogModal, useLoading, useNotifications } from 'react-components';
import { c } from 'ttag';
import useDrive from '../../hooks/drive/useDrive';
import useEvents from '../../hooks/drive/useEvents';
import useSharing from '../../hooks/drive/useSharing';
import useConfirm from '../../hooks/util/useConfirm';
import { SharedURLSessionKeyPayload, ShareURL } from '../../interfaces/sharing';
import { FileBrowserItem } from '../FileBrowser/interfaces';
import EditPasswordState from './EditPasswordState';
import ErrorState from './ErrorState';
import GeneratedLinkState from './GeneratedLinkState';
import LoadingState from './LoadingState';
import { validateSharedURLPassword } from '../../utils/validation';
import { isCustomSharedURLPassword } from '../../utils/link';
import EditExpirationTimeState from './EditExpirationTimeState';

interface Props {
    onClose?: () => void;
    modalTitleID?: string;
    item: FileBrowserItem;
    shareId: string;
}

enum SharingModalState {
    Loading,
    GeneratedLink,
    EditPassword,
    EditExpirationDate,
}

function SharingModal({ modalTitleID = 'sharing-modal', onClose, shareId, item, ...rest }: Props) {
    const [modalState, setModalState] = useState(SharingModalState.Loading);
    const [deleting, withDeleting] = useLoading(false);
    const [savingExpirationTime, withSavingExpirationTime] = useLoading(false);
    const [savingPassword, withSavingPassword] = useLoading(false);
    const [includePassword, setIncludePassword] = useState(false);
    const [shareUrlInfo, setShareUrlInfo] = useState<{ ShareURL: ShareURL; keyInfo: SharedURLSessionKeyPayload }>();
    const [error, setError] = useState(false);
    const { getShareMetaShort, deleteShare } = useDrive();
    const {
        createSharedLink,
        getSharedURLs,
        decryptSharedLink,
        updateSharedLinkExpirationTime,
        updateSharedLinkPassword,
        deleteSharedLink,
    } = useSharing();
    const events = useEvents();
    const { createNotification } = useNotifications();
    const { openConfirmModal } = useConfirm();

    useEffect(() => {
        // If token already loaded, don't reload it
        if (shareUrlInfo?.ShareURL.ShareID) {
            return;
        }

        const generatePassword = (): string => {
            const password = getRandomString(12);

            // If password is invalid, retry, chance is like 0.87 to get a valid password by random
            if (validateSharedURLPassword(password)) {
                return generatePassword();
            }

            return password;
        };

        const getToken = async () => {
            const shareUrlInfo = item.SharedURLShareID
                ? await getSharedURLs(item.SharedURLShareID).then(async ([sharedUrl]) => {
                      return decryptSharedLink(sharedUrl);
                  })
                : await getShareMetaShort(shareId).then(async ({ VolumeID }) => {
                      const result = await createSharedLink(shareId, VolumeID, item.LinkID, generatePassword());
                      await events.call(shareId);
                      return result;
                  });
            setIncludePassword(!isCustomSharedURLPassword(shareUrlInfo.ShareURL));
            setShareUrlInfo(shareUrlInfo);
        };

        getToken()
            .catch((err) => {
                console.error(err);
                setError(true);
            })
            .finally(() => {
                setModalState(SharingModalState.GeneratedLink);
            });
    }, [shareId, item.LinkID, item.SharedURLShareID, shareUrlInfo?.ShareURL.ShareID]);

    const handleSaveExpirationTime = async (expirationTime: number) => {
        if (!shareUrlInfo) {
            return;
        }

        const updateExpirationTime = async () => {
            const res = await updateSharedLinkExpirationTime(
                shareUrlInfo.ShareURL.ShareID,
                shareUrlInfo.ShareURL.Token,
                expirationTime
            );
            await events.call(shareId);
            return res;
        };

        const updatedFields = await withSavingExpirationTime(updateExpirationTime());
        createNotification({ text: c('Notification').t`Expiration date has been changed successfully.` });
        setShareUrlInfo({
            ...shareUrlInfo,
            ShareURL: {
                ...shareUrlInfo.ShareURL,
                ...updatedFields,
            },
        });
        setModalState(SharingModalState.GeneratedLink);
    };

    const handleSavePassword = async (password: string) => {
        if (!shareUrlInfo) {
            return;
        }

        const updatePassword = async () => {
            try {
                const res = await updateSharedLinkPassword(
                    shareUrlInfo.ShareURL.ShareID,
                    shareUrlInfo.ShareURL.Token,
                    password,
                    shareUrlInfo.keyInfo
                );
                await events.call(shareId);
                return res;
            } catch (e) {
                if (e.name === 'ValidationError') {
                    createNotification({ text: e.message, type: 'error' });
                }
                throw e;
            }
        };

        const updatedFields = await withSavingPassword(updatePassword());
        createNotification({ text: c('Notification').t`Password has been changed successfully.` });
        setShareUrlInfo({
            ...shareUrlInfo,
            ShareURL: {
                ...shareUrlInfo.ShareURL,
                ...updatedFields,
            },
        });
        setIncludePassword(false);
        setModalState(SharingModalState.GeneratedLink);
    };

    const handleToggleIncludePassword = () => {
        setIncludePassword((includePassword) => !includePassword);
    };

    const handleDeleteLinkClick = () => {
        if (!shareUrlInfo) {
            return;
        }

        const deleteLink = async () => {
            const { Token, ShareID } = shareUrlInfo.ShareURL;
            await deleteSharedLink(ShareID, Token);
            await deleteShare(ShareID);
            await events.call(shareId);
            createNotification({ text: c('Notification').t`The link to your file was deleted.` });
            onClose?.();
        };

        openConfirmModal({
            title: c('Title').t`Stop sharing`,
            confirm: c('Action').t`Stop sharing`,
            message: c('Info').t`This will delete the link and remove access to your file for anyone with the link.`,
            canUndo: true,
            onConfirm: () => withDeleting(deleteLink()),
        });
    };

    const loading = modalState === SharingModalState.Loading;

    const renderModalState = () => {
        if (loading) {
            return <LoadingState generated={!!item.SharedURLShareID} />;
        }

        if (error || !shareUrlInfo || !item) {
            return <ErrorState modalTitleID={modalTitleID} onClose={onClose} />;
        }

        if (modalState === SharingModalState.GeneratedLink) {
            return (
                <GeneratedLinkState
                    modalTitleID={modalTitleID}
                    includePassword={includePassword}
                    customPassword={isCustomSharedURLPassword(shareUrlInfo.ShareURL)}
                    itemName={item.Name}
                    onClose={onClose}
                    onEditExpirationTimeClick={() => setModalState(SharingModalState.EditExpirationDate)}
                    onEditPasswordClick={() => setModalState(SharingModalState.EditPassword)}
                    onIncludePasswordToggle={handleToggleIncludePassword}
                    onDeleteLinkClick={handleDeleteLinkClick}
                    password={shareUrlInfo.ShareURL.Password}
                    expirationTime={shareUrlInfo.ShareURL.ExpirationTime}
                    token={shareUrlInfo.ShareURL.Token}
                    deleting={deleting}
                />
            );
        }

        if (modalState === SharingModalState.EditPassword) {
            return (
                <EditPasswordState
                    modalTitleID={modalTitleID}
                    initialPassword={shareUrlInfo.ShareURL.Password}
                    onBack={() => setModalState(SharingModalState.GeneratedLink)}
                    onClose={onClose}
                    onSave={handleSavePassword}
                    saving={savingPassword}
                />
            );
        }

        if (modalState === SharingModalState.EditExpirationDate) {
            return (
                <EditExpirationTimeState
                    modalTitleID={modalTitleID}
                    onBack={() => setModalState(SharingModalState.GeneratedLink)}
                    onClose={onClose}
                    onSave={handleSaveExpirationTime}
                    saving={savingExpirationTime}
                />
            );
        }
    };

    return (
        <DialogModal modalTitleID={modalTitleID} onClose={onClose} {...rest}>
            {renderModalState()}
        </DialogModal>
    );
}

export default SharingModal;
