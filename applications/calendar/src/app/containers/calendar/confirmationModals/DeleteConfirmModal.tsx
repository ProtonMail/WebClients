import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Prompt from '@proton/components/components/prompt/Prompt';
import { RECURRING_TYPES } from '@proton/shared/lib/calendar/constants';

import type { InviteActions, RecurringActionData } from '../../../interfaces/Invite';
import { INVITE_ACTION_TYPES } from '../../../interfaces/Invite';

const getTexts = ({ type, sendCancellationNotice }: InviteActions) => {
    if (type === INVITE_ACTION_TYPES.DECLINE_INVITATION && sendCancellationNotice) {
        return {
            title: c('Title').t`Delete event`,
            submit: c('Action').t`Delete`,
            alertText: c('Info')
                .t`The organizer of this event will be notified that you decline the invitation. Would you like to delete this event?`,
        };
    }
    if (type === INVITE_ACTION_TYPES.DECLINE_DISABLED && sendCancellationNotice) {
        return {
            title: c('Title').t`Delete event`,
            submit: c('Action').t`Delete`,
            alertText: c('Info')
                .t`The organizer of this event will not be notified that you decline the invitation as you can't send emails from the invited address. Would you like to delete this event anyway?`,
        };
    }
    if (type === INVITE_ACTION_TYPES.CANCEL_INVITATION) {
        return {
            title: c('Title').t`Delete event`,
            submit: c('Action').t`Delete`,
            alertText: c('Info')
                .t`A cancellation email will be sent to the event participants. Would you like to delete this event?`,
        };
    }
    if (type === INVITE_ACTION_TYPES.CANCEL_DISABLED) {
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
    isOpen: boolean;
}

const DeleteConfirmModal = ({ inviteActions, onConfirm, onClose, isOpen }: Props) => {
    const { title, submit, alertText } = getTexts(inviteActions);
    const handleSubmit = async () => {
        onConfirm({ type: RECURRING_TYPES.SINGLE, inviteActions });
        onClose();
    };
    return (
        <Prompt
            title={title}
            buttons={[
                <Button color="danger" onClick={handleSubmit} type="submit">
                    {submit}
                </Button>,
                <Button type="reset" onClick={onClose} autoFocus>{c('Action').t`Cancel`}</Button>,
            ]}
            onSubmit={handleSubmit}
            open={isOpen}
        >
            {alertText}
        </Prompt>
    );
};

export default DeleteConfirmModal;
