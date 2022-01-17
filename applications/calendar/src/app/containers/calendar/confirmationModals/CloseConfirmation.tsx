import { Button, AlertModal } from '@proton/components';
import { c } from 'ttag';

interface CloseConfirmationModalProps {
    onClose: () => void;
    onSubmit: () => void;
    isOpen: boolean;
}

const CloseConfirmationModal = ({ onClose, onSubmit, isOpen }: CloseConfirmationModalProps) => {
    return (
        <AlertModal
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
        </AlertModal>
    );
};

export default CloseConfirmationModal;
