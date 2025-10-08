import { useCallback } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Form from '@proton/components/components/form/Form';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';

interface UnpublishedChangesModalProps extends ModalProps {
    onDiscard: () => void;
}

const UnpublishedChangesModal = ({ onDiscard, ...rest }: UnpublishedChangesModalProps) => {
    const handleDiscard = useCallback(async () => {
        rest.onClose?.();
        onDiscard();
    }, [onDiscard, rest]);

    return (
        <ModalTwo size="small" as={Form} {...rest}>
            <ModalTwoHeader title={c('Title').t`Warning`} />

            <ModalTwoContent>
                <span>{c('Info').t`The unpublished changes you made will be lost.`}</span>
            </ModalTwoContent>

            <ModalTwoFooter className="flex flex-column">
                <Button color="weak" type="button" onClick={rest.onClose}>
                    {c('Action').t`Keep Editing`}
                </Button>
                <Button color="danger" type="button" onClick={handleDiscard}>
                    {c('Action').t`Discard Changes`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default UnpublishedChangesModal;
