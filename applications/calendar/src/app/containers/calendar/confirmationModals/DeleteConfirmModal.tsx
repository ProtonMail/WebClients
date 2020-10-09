import React from 'react';
import { c } from 'ttag';
import { Alert, ErrorButton, FormModal, ResetButton, useLoading } from 'react-components';

interface Props {
    onClose: () => void;
    onConfirm: () => void;
    onDecline?: () => Promise<void>;
    decline: boolean;
}
const DeleteConfirmModal = ({ decline = false, onClose, onConfirm, onDecline, ...rest }: Props) => {
    const [loading, withLoading] = useLoading();
    const handleConfirm = async () => {
        if (decline) {
            await onDecline?.();
        }
        onConfirm();
        onClose();
    };
    return (
        <FormModal
            title={c('Info').t`Delete event`}
            small
            submit={<ErrorButton type="submit" loading={loading}>{c('Action').t`Delete`}</ErrorButton>}
            close={<ResetButton autoFocus disabled={loading}>{c('Action').t`Cancel`}</ResetButton>}
            onSubmit={() => withLoading(handleConfirm())}
            onClose={onClose}
            {...rest}
        >
            <Alert type="error">
                {decline
                    ? c('Info')
                          .t`The organizer of this event will be notified that you decline the invitation. Would you like to delete this event?`
                    : c('Info').t`Would you like to delete this event?`}
            </Alert>
        </FormModal>
    );
};

export default DeleteConfirmModal;
