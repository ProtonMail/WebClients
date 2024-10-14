import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import Form from '@proton/components/components/form/Form';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';

interface Props extends ModalStateProps {
    onSubmitDone: () => void;
}

const RemoveServerConfirmationModal = ({ onSubmitDone, ...rest }: Props) => {
    const handleSubmit = () => {
        onSubmitDone();
        rest.onClose?.();
    };

    return (
        <ModalTwo as={Form} size="small" onSubmit={handleSubmit} {...rest}>
            <ModalTwoHeader title={c('Title').t`Remove server?`} />
            <ModalTwoContent>
                <ul>
                    <li>{c('Info').t`You’ll be able to add these servers to another Gateway immediately.`}</li>
                    <li>{c('Info').t`You won’t be able to reassign these servers to another country for 10 days.`}</li>
                </ul>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button color="danger" type="submit">
                    {c('Feature').t`Remove`}
                </Button>
                <Button color="weak" onClick={rest.onClose}>
                    {c('Action').t`Cancel`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default RemoveServerConfirmationModal;
