import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Alert, ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components/components';

interface Props {
    handleClose: () => void;
    handleContinue: () => void;
}

const ConfirmLeaveModal = ({ handleClose, handleContinue }: Props) => {
    return (
        <ModalTwo key="easy-switch-confirm-leave-modal" className="easy-switch-modal" open onClose={handleContinue}>
            <ModalTwoHeader title={c('Confirm modal title').t`Quit import?`} />
            <ModalTwoContent>
                <div className="mb-4">{c('Info').t`Your import will not be processed.`}</div>
                <Alert className="mb-4" type="error">{c('Warning')
                    .t`Are you sure you want to discard your import?`}</Alert>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button color="danger" onClick={handleClose} data-testid="ConfirmLeaveModal:discard">{c('Action')
                    .t`Discard`}</Button>
                <Button color="norm" onClick={handleContinue} data-testid="ConfirmLeaveModal:continue">{c('Action')
                    .t`Continue import`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default ConfirmLeaveModal;
