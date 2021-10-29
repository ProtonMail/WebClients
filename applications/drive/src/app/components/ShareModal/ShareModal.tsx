import { useEffect, useState } from 'react';
import { c } from 'ttag';

import { DialogModal, HeaderModal, InnerModal } from '@proton/components';
import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';

import useDrive from '../../hooks/drive/useDrive';
import ModalContentLoader from '../ModalContentLoader';
import useDriveEvents from '../../hooks/drive/useDriveEvents';

interface Props {
    modalTitleID?: string;
    shareId: string;
    item: FileBrowserItem;
    onClose?: () => void;
}

function ShareModal({ modalTitleID = 'share-modal', shareId, item, onClose, ...rest }: Props) {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [shareInfo, setShareInfo] = useState<string>();

    const { getShareMetaShort, createShare } = useDrive();
    const driveEvents = useDriveEvents();

    useEffect(() => {
        if (shareInfo) {
            return;
        }

        const loadShare = async () => {
            if (item.ShareUrlShareID) {
                setShareInfo(item.ShareUrlShareID);
            } else {
                return getShareMetaShort(shareId).then(async ({ VolumeID }) => {
                    const result = await createShare(shareId, VolumeID, item.LinkID);
                    await driveEvents.call(shareId);
                    setShareInfo(result.Share.ID);
                });
            }
        };

        loadShare()
            .catch((err) => {
                console.error(err);
                setError(err);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [shareId, item.LinkID, item.ShareUrlShareID]);

    const renderModalState = () => {
        if (isLoading) {
            const loadingMessage = item.ShareUrlShareID ? c('Info').t`Loading share` : c('Info').t`Creating share`;
            return <ModalContentLoader>{loadingMessage}</ModalContentLoader>;
        }

        if (error || !shareInfo || !item) {
            return <div>Error: {error}</div>;
        }

        return <div>Share: {shareInfo}</div>;
    };

    return (
        <DialogModal modalTitleID={modalTitleID} onClose={onClose} {...rest}>
            <HeaderModal modalTitleID={modalTitleID} onClose={onClose}>
                {c('Title').t`Manage share`}
            </HeaderModal>
            <div className="modal-content">
                <InnerModal>{renderModalState()}</InnerModal>
            </div>
        </DialogModal>
    );
}

export default ShareModal;
