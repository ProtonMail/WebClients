import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Prompt from '@proton/components/components/prompt/Prompt';

interface Props extends ModalProps {
    onChange?: () => void;
}

const WipeLogsModal = ({ onChange, ...rest }: Props) => {
    const { onClose } = rest;

    return (
        <Prompt
            title={c('Title').t`Wipe all logs?`}
            buttons={[
                <Button color={'danger'} onClick={onChange}>
                    {c('Action').t`Got it`}
                </Button>,
                <Button color="weak" onClick={onClose}>
                    {c('Action').t`Cancel`}
                </Button>,
            ]}
            {...rest}
        >
            <span>{c('Info').t`This will wipe all logs for your organization members.`}</span>
        </Prompt>
    );
};

export default WipeLogsModal;
