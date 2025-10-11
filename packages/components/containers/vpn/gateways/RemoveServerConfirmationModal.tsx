import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Form from '@proton/components/components/form/Form';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
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
