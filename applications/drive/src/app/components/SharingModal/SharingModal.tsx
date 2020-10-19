import { getRandomString } from 'proton-shared/lib/helpers/string';
import React, { useEffect, useState } from 'react';
import { DialogModal, useNotifications } from 'react-components';
import useDrive from '../../hooks/drive/useDrive';
import useEvents from '../../hooks/drive/useEvents';
import useSharing from '../../hooks/drive/useSharing';
import { SharedURLFlags, SharedURLSessionKeyPayload, ShareURL } from '../../interfaces/sharing';
import { FileBrowserItem } from '../FileBrowser/interfaces';
import EditPasswordState from './EditPasswordState';
import ErrorState from './ErrorState';
import GeneratedLinkState from './GeneratedLinkState';
import LoadingState from './LoadingState';
import { validateSharedURLPassword } from '../../utils/validation';

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
}

function SharingModal({ modalTitleID = 'sharing-modal', onClose, shareId, item, ...rest }: Props) {
    const [modalState, setModalState] = useState(SharingModalState.Loading);
    const [includePassword, setIncludePassword] = useState(false);
    const [shareUrlInfo, setShareUrlInfo] = useState<{ ShareURL: ShareURL; keyInfo: SharedURLSessionKeyPayload }>();
    const [savingPassword, setSavingPassword] = useState(false);
    const [error, setError] = useState(false);
    const { getShareMetaShort } = useDrive();
    const { createSharedLink, getSharedURLs, decryptSharedURL, updateSharedLinkPassword } = useSharing();
    const events = useEvents();
    const { createNotification } = useNotifications();

    useEffect(() => {
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
                      return decryptSharedURL(sharedUrl);
                  })
                : await getShareMetaShort(shareId).then(async ({ VolumeID }) => {
                      const result = await createSharedLink(shareId, VolumeID, item.LinkID, generatePassword());
                      await events.call(shareId);
                      return result;
                  });
            setIncludePassword(!(shareUrlInfo.ShareURL.Flags & SharedURLFlags.CustomPassword));
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
    }, [shareId, item.LinkID, item.SharedURLShareID]);

    const handleSavePassword = async (password: string) => {
        if (!shareUrlInfo) {
            return;
        }

        const updatePassword = async () => {
            const res = await updateSharedLinkPassword(
                shareUrlInfo.ShareURL.ShareID,
                shareUrlInfo.ShareURL.Token,
                password,
                shareUrlInfo.keyInfo
            );
            await events.call(shareId);
            return res;
        };

        try {
            setSavingPassword(true);
            const updatedFields = await updatePassword();
            setShareUrlInfo({
                ...shareUrlInfo,
                ShareURL: {
                    ...shareUrlInfo.ShareURL,
                    ...updatedFields,
                },
            });
            setIncludePassword(false);
            setModalState(SharingModalState.GeneratedLink);
        } catch (e) {
            if (e.name === 'ValidationError') {
                createNotification({ text: e.message, type: 'error' });
            }
            throw e;
        } finally {
            setSavingPassword(false);
        }
    };

    const handleToggleIncludePassword = () => {
        setIncludePassword((includePassword) => !includePassword);
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
                    customPassword={!!(shareUrlInfo.ShareURL.Flags & SharedURLFlags.CustomPassword)}
                    itemName={item.Name}
                    onClose={onClose}
                    onEditPasswordClick={() => setModalState(SharingModalState.EditPassword)}
                    onIncludePasswordToggle={handleToggleIncludePassword}
                    password={shareUrlInfo.ShareURL.Password}
                    token={shareUrlInfo.ShareURL.Token}
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
    };

    return (
        <DialogModal modalTitleID={modalTitleID} onClose={onClose} {...rest}>
            {renderModalState()}
        </DialogModal>
    );
}

export default SharingModal;
