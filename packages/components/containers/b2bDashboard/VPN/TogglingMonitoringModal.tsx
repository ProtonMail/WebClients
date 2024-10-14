import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Prompt from '@proton/components/components/prompt/Prompt';

interface Props extends ModalProps {
    enabling: boolean;
    onChange?: () => void;
}

const TogglingMonitoringModal = ({ enabling, onChange, ...rest }: Props) => {
    const { onClose } = rest;

    const disableButtons: [JSX.Element] = [
        <Button color={enabling ? 'norm' : 'danger'} onClick={onChange}>
            {enabling ? c('Action').t`Got it` : c('Action').t`Disable`}
        </Button>,
    ];

    const enableButtons: [JSX.Element, JSX.Element] = [
        <Button color={enabling ? 'norm' : 'danger'} onClick={onChange}>
            {enabling ? c('Action').t`Got it` : c('Action').t`Disable`}
        </Button>,
        <Button color="norm" onClick={onClose}>
            {c('Action').t`Cancel`}
        </Button>,
    ];

    return (
        <Prompt
            title={enabling ? c('Title').t`Gateway monitor enabled` : c('Title').t`Gateway monitor disabled`}
            buttons={enabling ? enableButtons : disableButtons}
            {...rest}
        >
            {enabling === true ? (
                <span>{c('Info').t`Connection data will be available in around 1 hour.`}</span>
            ) : (
                <span>{c('Info').t`New VPN connection data will stop being collected and shown.`}</span>
            )}
        </Prompt>
    );
};

export default TogglingMonitoringModal;
