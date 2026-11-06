import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Href } from '@proton/atoms/Href/Href';
import BasicModal from '@proton/components/components/modalTwo/BasicModal';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';

import { ErrorTypes } from '../helpers/emailReservationHelpers';

interface PaymentErrorModalProps extends ModalStateProps {
    errorType: ErrorTypes;
}

const ReservationErrorModal = ({ open, onClose, onExit, errorType }: PaymentErrorModalProps) => {
    return (
        <BasicModal
            size="small"
            isOpen={open}
            onClose={onClose}
            onExit={onExit}
            title={
                errorType === ErrorTypes.postAccountCreationError
                    ? c('Title').t`Problem processing your request`
                    : c('Title').t`Problem processing your payment`
            }
            className="w-fit"
            footer={
                errorType === ErrorTypes.postAccountCreationError ? (
                    <>
                        <ButtonLike as={Href} href="https://proton.me/support/contact" fullWidth className="mt-2">
                            {c('Action').t`Contact support`}
                        </ButtonLike>
                        <Button color="norm" fullWidth onClick={onClose}>
                            {c('Action').t`Got it`}
                        </Button>
                    </>
                ) : (
                    <Button fullWidth onClick={onClose}>
                        {c('Action').t`Try payment again`}
                    </Button>
                )
            }
        >
            <p className="text-left m-0">
                {errorType === ErrorTypes.postAccountCreationError
                    ? c('Info').t`Something went wrong. Please try again or contact customer support.`
                    : c('Info').t`We couldn't complete the transaction. Please try again.`}
            </p>
        </BasicModal>
    );
};

export default ReservationErrorModal;
