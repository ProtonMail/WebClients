import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalStateProps } from '@proton/components';
import Prompt from '@proton/components/components/prompt/Prompt';

interface Props {
    onConfirm: () => void;
}

const DiscardGroupChangesPrompt = ({ onClose, onConfirm, open, ...modalProps }: Props & ModalStateProps) => {
    return (
        <Prompt
            open={open}
            onClose={onClose}
            title={c('Title').t`Discard changes?`}
            buttons={[
                <Button
                    color="danger"
                    onClick={() => {
                        onClose();
                        onConfirm();
                    }}
                >
                    {c('Action').t`Discard changes`}
                </Button>,
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...modalProps}
        >
            <p className="m-0">{c('Info').t`Are you sure you want to cancel editing the group?`}</p>
        </Prompt>
    );
};

export default DiscardGroupChangesPrompt;
