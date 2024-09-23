import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Prompt from '@proton/components/components/prompt/Prompt';

interface Props extends ModalProps {
    isSaving?: boolean;
    handleDiscard?: () => void;
}

const CloseModal = ({ isSaving, handleDiscard, ...rest }: Props) => {
    const { onClose } = rest;

    if (isSaving) {
        return (
            <Prompt
                title={c('Title').t`Your changes are not synced yet`}
                buttons={[<Button onClick={onClose}>{c('Action').t`Cancel`}</Button>]}
                {...rest}
            >
                {c('Info').t`Please wait till your changes are synced with the server.`}
            </Prompt>
        );
    }

    const handleClose = () => {
        handleDiscard?.();
        onClose?.();
    };

    return (
        <Prompt
            title={c('Title').t`Are you sure you want to close the preview?`}
            buttons={[
                <Button color="danger" onClick={handleClose}>{c('Action').t`Discard`}</Button>,
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...rest}
        >
            {c('Info').t`All your changes will be lost.`}
            <br />
            {c('Info').t`Are you sure you want to discard your changes?`}
        </Prompt>
    );
};

export default CloseModal;
