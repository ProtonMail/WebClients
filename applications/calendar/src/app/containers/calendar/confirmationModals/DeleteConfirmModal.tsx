import React from 'react';
import { c } from 'ttag';
import { Alert, ErrorButton, FormModal, Button } from 'react-components';
import { RECURRING_TYPES } from 'proton-shared/lib/calendar/constants';
import { INVITE_ACTION_TYPES, InviteActions, RecurringActionData } from '../../../interfaces/Invite';

const { DECLINE_INVITATION, DECLINE_DISABLED, CANCEL_INVITATION, CANCEL_DISABLED } = INVITE_ACTION_TYPES;

const getTexts = ({ type, sendCancellationNotice }: InviteActions) => {
    if (type === DECLINE_INVITATION && sendCancellationNotice) {
        return {
            title: c('Title').t`Delete event`,
            submit: c('Action').t`Delete`,
            alertText: c('Info')
                .t`The organizer of this event will be notified that you decline the invitation. Would you like to delete this event?`,
        };
    }
    if (type === DECLINE_DISABLED && sendCancellationNotice) {
        return {
            title: c('Title').t`Delete event`,
            submit: c('Action').t`Delete`,
            alertText: c('Info')
                .t`The organizer of this event will not be notified that you decline the invitation as your address is disabled. Would you like to delete this event anyway?`,
        };
    }
    if (type === CANCEL_INVITATION) {
        return {
            title: c('Title').t`Delete event`,
            submit: c('Action').t`Delete`,
            alertText: c('Info')
                .t`A cancellation email will be sent to the event participants. Would you like to delete this event?`,
        };
    }
    if (type === CANCEL_DISABLED) {
        return {
            title: c('Title').t`Delete event`,
            submit: c('Action').t`Delete`,
            alertText: c('Info')
                .t`Your address is disabled. A cancellation email cannot be sent to the event participants. Would you like to delete this event anyway?`,
        };
    }
    return {
        title: c('Title').t`Delete event`,
        submit: c('Action').t`Delete`,
        alertText: c('Info').t`Would you like to delete this event?`,
    };
};

interface Props {
    onClose: () => void;
    onConfirm: (data: RecurringActionData) => void;
    inviteActions: InviteActions;
}

const DeleteConfirmModal = ({ inviteActions, onConfirm, ...rest }: Props) => {
    const { title, submit, alertText } = getTexts(inviteActions);
    const handleSubmit = async () => {
        onConfirm({ type: RECURRING_TYPES.SINGLE, inviteActions });
        rest.onClose();
    };
    return (
        <FormModal
            title={title}
            small
            submit={<ErrorButton type="submit">{submit}</ErrorButton>}
            close={<Button type="reset" autoFocus>{c('Action').t`Cancel`}</Button>}
            onSubmit={handleSubmit}
            {...rest}
        >
            <Alert type="error">{alertText}</Alert>
        </FormModal>
    );
};

export default DeleteConfirmModal;
