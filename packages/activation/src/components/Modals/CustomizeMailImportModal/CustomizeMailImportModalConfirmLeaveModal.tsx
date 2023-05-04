import { c } from 'ttag';



import { Button } from '@proton/atoms/Button';
import { Alert, ModalStateProps, Prompt } from '@proton/components/components';


interface Props {
    onContinue: () => void;
    onStop: () => void;
    modalProps: ModalStateProps;
}

const CustomizeMailImportModalConfirmLeaveModal = ({ modalProps, onContinue, onStop }: Props) => (
    <Prompt
        {...modalProps}
        title={c('Confirm modal title').t`Quit import customization?`}
        buttons={[
            <Button color="weak" onClick={onContinue} data-testid="CancelModal:cancel">{c('Action').t`Stay`}</Button>,
            <Button color="danger" onClick={onStop} data-testid="CancelModal:quit">{c('Action').t`Quit`}</Button>,
        ]}
        onClose={onContinue}
        data-testid="CancelModal:container"
    >
        <Alert className="mb-4" type="error">{c('Warning').t`You will lose any customization you made so far.`}</Alert>
    </Prompt>
);

export default CustomizeMailImportModalConfirmLeaveModal;