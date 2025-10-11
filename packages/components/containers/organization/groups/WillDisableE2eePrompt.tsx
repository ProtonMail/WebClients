import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import Prompt from '@proton/components/components/prompt/Prompt';

interface Props {
    onConfirm: () => void;
    onCancel: () => void;
}

const WillDisableE2eePrompt = ({ onClose, onConfirm, onCancel, open, ...modalProps }: Props & ModalStateProps) => {
    const handleOnClose = () => {
        onClose();
        onCancel();
    };

    return (
        <Prompt
            open={open}
            onClose={handleOnClose}
            title={c('Title').t`Add external address?`}
            buttons={[
                <Button
                    color="danger"
                    onClick={() => {
                        onClose();
                        onConfirm();
                    }}
                >
                    {c('Action').t`Add external address`}
                </Button>,
                <Button onClick={handleOnClose}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...modalProps}
        >
            <p className="m-0">{c('Info')
                .t`Adding an external email address will disable end-to-end encryption for all email communication within that group. Do you want to proceed?`}</p>
        </Prompt>
    );
};

export default WillDisableE2eePrompt;
