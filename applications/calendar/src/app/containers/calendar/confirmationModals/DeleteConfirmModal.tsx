import React from 'react';
import { c } from 'ttag';
import { Alert, ErrorButton, FormModal, ResetButton, useLoading } from 'react-components';
import { RECURRING_TYPES } from '../../../constants';
import { InviteActions, NO_INVITE_ACTION } from '../eventActions/inviteActions';

interface Props {
    onClose: () => void;
    onConfirm: (type: RECURRING_TYPES) => void;
    onDecline?: () => Promise<void>;
    inviteActions?: InviteActions;
}

const DeleteConfirmModal = ({ inviteActions = NO_INVITE_ACTION, onClose, onConfirm, onDecline, ...rest }: Props) => {
    const [loading, withLoading] = useLoading();
    const { sendCancellationNotice: decline } = inviteActions;
    const handleConfirm = async () => {
        if (decline) {
            await onDecline?.();
        }
        onConfirm(RECURRING_TYPES.SINGLE);
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
