import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Prompt from '@proton/components/components/prompt/Prompt';

interface Props extends ModalProps {
    onChange?: () => void;
}

const TogglingMonitoringModal = ({ onChange, ...rest }: Props) => {
    const { onClose } = rest;

    const disableButtons: [JSX.Element, JSX.Element] = [
        <Button color="weak" onClick={onClose}>
            {c('Action').t`Cancel`}
        </Button>,
        <Button color="danger" onClick={onChange}>
            {c('Action').t`Disable`}
        </Button>,
    ];

    return (
        <Prompt title={c('Title').t`Disable activity monitor?`} buttons={disableButtons} {...rest}>
            <span>{c('Info').t`New activity data will stop being collected and shown.`}</span>
        </Prompt>
    );
};

export default TogglingMonitoringModal;
