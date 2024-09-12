import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Prompt } from '@proton/components';

interface Props {
    handleClose: () => void;
    handleContinue: () => void;
}

const ConfirmLeaveModal = ({ handleClose, handleContinue }: Props) => {
    return (
        <Prompt
            open
            onClose={handleContinue}
            title={c('Confirm modal title').t`Quit import?`}
            buttons={[
                <Button color="danger" onClick={handleClose} data-testid="ConfirmLeaveModal:discard">{c('Action')
                    .t`Discard`}</Button>,
                <Button onClick={handleContinue} data-testid="ConfirmLeaveModal:continue">{c('Action')
                    .t`Continue import`}</Button>,
            ]}
        >
            <p className="m-0">{c('Info').t`Are you sure you want to discard your import?`}</p>
        </Prompt>
    );
};

export default ConfirmLeaveModal;
