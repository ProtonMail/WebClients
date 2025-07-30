import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Prompt from '@proton/components/components/prompt/Prompt';

interface Props {
    modalProps: ModalProps;
    onResolve?: () => void;
    onReject?: () => void;
    type: 'label' | 'folder';
}

const ConfirmSortModal = ({ modalProps, onReject, onResolve, type }: Props) => {
    const { onClose } = modalProps;

    const handleResolve = async () => {
        onResolve?.();
        onClose?.();
    };

    const handleClose = () => {
        onReject?.();
        onClose?.();
    };

    const modalText =
        type === 'label'
            ? c('Info').t`Are you sure you want to sort your labels alphabetically?`
            : c('Info').t`Are you sure you want to sort your folders alphabetically?`;

    return (
        <Prompt
            title={type === 'label' ? c('Header').t`Sort labels` : c('Header').t`Sort folders`}
            buttons={[
                <Button color="norm" onClick={handleResolve}>{c('Action').t`Sort`}</Button>,
                <Button onClick={handleClose}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...modalProps}
            onClose={handleClose}
        >
            <span className="mr-1">{modalText}</span>
        </Prompt>
    );
};

export default ConfirmSortModal;
