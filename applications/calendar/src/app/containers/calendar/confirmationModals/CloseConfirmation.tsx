import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Prompt } from '@proton/components';

interface CloseConfirmationModalProps {
    onClose: () => void;
    onSubmit: () => void;
    isOpen: boolean;
}

const CloseConfirmationModal = ({ onClose, onSubmit, isOpen }: CloseConfirmationModalProps) => {
    return (
        <Prompt
            title={c('Info').t`Discard changes?`}
            onClose={onClose}
            onSubmit={onSubmit}
            open={isOpen}
            buttons={[
                <Button color="norm" type="submit" onClick={onSubmit}>{c('Action').t`Discard`}</Button>,
                <Button type="reset" autoFocus onClick={onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
        >
            {c('Info').t`You will lose all unsaved changes.`}
        </Prompt>
    );
};

export default CloseConfirmationModal;
