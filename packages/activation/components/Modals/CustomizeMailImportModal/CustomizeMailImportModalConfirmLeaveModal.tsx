import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Alert, AlertModal, ModalStateProps } from '@proton/components/components';

interface Props {
    onContinue: () => void;
    onStop: () => void;
    modalProps: ModalStateProps;
}

const CustomizeMailImportModalConfirmLeaveModal = ({ modalProps, onContinue, onStop }: Props) => (
    <AlertModal
        {...modalProps}
        title={c('Confirm modal title').t`Quit import customization?`}
        buttons={[
            <Button color="weak" onClick={onContinue} data-testid="CancelModal:cancel">{c('Action').t`Stay`}</Button>,
            <Button color="danger" onClick={onStop} data-testid="CancelModal:quit">{c('Action').t`Quit`}</Button>,
        ]}
        onClose={onContinue}
        data-testid="CancelModal:container"
    >
        <Alert className="mb1" type="error">{c('Warning').t`You will lose any customization you made so far.`}</Alert>
    </AlertModal>
);

export default CustomizeMailImportModalConfirmLeaveModal;
