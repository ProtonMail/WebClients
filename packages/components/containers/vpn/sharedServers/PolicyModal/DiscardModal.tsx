import { useCallback } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Form from '@proton/components/components/form/Form';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';

interface DiscardModalProps extends ModalProps {
    onSuccess: () => void;
}

const DiscardModal = ({ onSuccess, ...rest }: DiscardModalProps) => {
    const handleConfirm = useCallback(async () => {
        onSuccess();
        rest.onClose?.();
    }, [onSuccess, rest]);

    return (
        <ModalTwo size="small" as={Form} {...rest}>
            <ModalTwoHeader title={c('Title').t`Discard changes?`} />

            <ModalTwoFooter className="flex flex-column">
                <Button color="danger" type="button" onClick={handleConfirm}>
                    {c('Action').t`Discard changes`}
                </Button>
                <Button color="weak" type="button" onClick={rest.onClose}>
                    {c('Action').t`Keep editing`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default DiscardModal;
