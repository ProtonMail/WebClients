import { c } from 'ttag';
import { Alert, ErrorButton, FormModal, ResetButton, useLoading } from 'react-components';
import React, { useState } from 'react';
import { INVITE_ACTION_TYPES, InviteActions, NO_INVITE_ACTION } from '../eventActions/inviteActions';
import SelectRecurringType from './SelectRecurringType';
import { RECURRING_TYPES } from '../../../constants';

interface Props {
    types: RECURRING_TYPES[];
    inviteActions?: InviteActions;
    onConfirm: (type: RECURRING_TYPES) => void;
    onClose: () => void;
    onDecline?: () => Promise<void>;
}

const getAlertText = (types: RECURRING_TYPES[], inviteActions: InviteActions) => {
    const { type: inviteType, sendCancellationNotice: decline } = inviteActions;
    const isDeleteInvitation = inviteType === INVITE_ACTION_TYPES.DECLINE;
    if (types.length === 1) {
        if (types[0] === RECURRING_TYPES.SINGLE) {
            return decline
                ? c('Info')
                      .t`This event has been updated. The organizer will be notified that you decline the invitation. Would you like to delete this event?`
                : isDeleteInvitation
                ? c('Info').t`This event has been updated by the organizer. Would you like to delete this event?`
                : c('Info').t`Would you like to delete this event?`;
        }
        if (types[0] === RECURRING_TYPES.ALL) {
            return decline
                ? c('Info')
                      .t`The organizer of this series of events will be notified that you decline the invitation. Would you like to delete all the events in the series?`
                : c('Info').t`Would you like to delete all the events in the series?`;
        }
    }
    return c('Info').t`Which event would you like to delete?`;
};

const DeleteRecurringConfirmModal = ({
    types,
    inviteActions = NO_INVITE_ACTION,
    onConfirm,
    onClose,
    onDecline,
    ...rest
}: Props) => {
    const [loading, withLoading] = useLoading();
    const [type, setType] = useState(types[0]);
    const { sendCancellationNotice: decline } = inviteActions;
    const handleConfirm = async () => {
        if (decline) {
            await onDecline?.();
        }
        onConfirm(type);
        onClose();
    };

    return (
        <FormModal
            title={c('Info').t`Delete recurring event`}
            small
            submit={<ErrorButton type="submit" loading={loading}>{c('Action').t`Delete`}</ErrorButton>}
            close={<ResetButton autoFocus>{c('Action').t`Cancel`}</ResetButton>}
            onSubmit={() => withLoading(handleConfirm())}
            onClose={onClose}
            {...rest}
        >
            <Alert type="error">{getAlertText(types, inviteActions)}</Alert>
            {types.length > 1 ? (
                <SelectRecurringType
                    types={types}
                    type={type}
                    setType={setType}
                    data-test-id="delete-recurring-popover:delete-option-radio"
                />
            ) : null}
        </FormModal>
    );
};

export default DeleteRecurringConfirmModal;
