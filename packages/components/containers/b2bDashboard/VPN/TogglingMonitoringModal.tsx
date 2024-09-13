import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalProps } from '@proton/components/components';
import Prompt from '@proton/components/components/prompt/Prompt';

interface Props extends ModalProps {
    enabling: boolean;
}

const TogglingMonitoringModal = ({ enabling, ...rest }: Props) => {
    const { onClose } = rest;

    return (
        <Prompt
            title={enabling ? c('Title').t`Connection monitor enabled` : c('Title').t`Connection monitor disabled`}
            buttons={[<Button color="norm" onClick={onClose}>{c('Action').t`Got it`}</Button>]}
            {...rest}
        >
            {c('Info').t`This change will be fully reflected across your infrastructure in about 1 hour`}
        </Prompt>
    );
};

export default TogglingMonitoringModal;
