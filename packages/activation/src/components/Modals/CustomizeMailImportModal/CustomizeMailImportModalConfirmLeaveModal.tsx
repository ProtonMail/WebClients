import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import type { ModalStateProps } from '@proton/components';
import { Prompt } from '@proton/components';

interface Props extends ModalStateProps {
    onContinue: () => void;
    onStop: () => void;
}

const CustomizeMailImportModalConfirmLeaveModal = ({ onContinue, onStop, ...rest }: Props) => (
    <Prompt
        {...rest}
        title={c('Confirm modal title').t`Quit import customization?`}
        buttons={[
            <Button color="danger" onClick={onStop} data-testid="CancelModal:quit">{c('Action').t`Quit`}</Button>,
            <Button color="weak" onClick={() => rest.onClose()} data-testid="CancelModal:cancel">{c('Action')
                .t`Stay`}</Button>,
        ]}
        onClose={onContinue}
        data-testid="CancelModal:container"
    >
        <p className="m-0">{c('Warning').t`You will lose any customization you made so far.`}</p>
    </Prompt>
);

export default CustomizeMailImportModalConfirmLeaveModal;
