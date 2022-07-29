import { c } from 'ttag';

import { AlertModal, Button, ModalProps } from '@proton/components';

import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';

const ClearBrowserDataModal = (rest: ModalProps) => {
    const { onClose } = rest;
    const { esDelete } = useEncryptedSearchContext();

    const handleClear = () => {
        void esDelete();
        onClose?.();
    };

    return (
        <AlertModal
            title={c('Info').t`Disable message content search`}
            buttons={[
                <Button color="norm" onClick={handleClear}>{c('Info').t`Clear data`}</Button>,
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...rest}
        >
            {c('Info')
                .t`Clearing browser data also deactivates message content search on this device. All messages will need to be downloaded again to search within them.`}
        </AlertModal>
    );
};

export default ClearBrowserDataModal;
