import { useEffect, useState } from 'react';
import { c } from 'ttag';

import { ModalTwo, ModalTwoContent, ModalTwoHeader } from '@proton/components';
import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';

import ModalContentLoader from '../ModalContentLoader';

interface Props {
    modalTitleID?: string;
    shareId: string;
    item: FileBrowserItem;
    onClose?: () => void;
}

function ShareModal({ shareId, item, onClose, ...rest }: Props) {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [shareInfo, setShareInfo] = useState<string>();

    useEffect(() => {
        if (shareInfo) {
            return;
        }

        const loadShare = async () => {
            setShareInfo('info');
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
        <ModalTwo onClose={onClose} {...rest}>
            <ModalTwoHeader title={c('Title').t`Manage share`} />
            <ModalTwoContent>{renderModalState()}</ModalTwoContent>
        </ModalTwo>
    );
}

export default ShareModal;
