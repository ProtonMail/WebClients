import { useState } from 'react';

import { c } from 'ttag';

import { Alert, AlertModal, Button } from '@proton/components';
import { RECURRING_TYPES } from '@proton/shared/lib/calendar/constants';

import { INVITE_ACTION_TYPES, InviteActions, RecurringActionData } from '../../../interfaces/Invite';
import SelectRecurringType from './SelectRecurringType';

const getTexts = (types: RECURRING_TYPES[], inviteActions: InviteActions) => {
    const { type: inviteType, sendCancellationNotice } = inviteActions;

    const defaultTexts = {
        title: c('Title').t`Delete recurring event`,
        confirm: c('Action').t`Delete`,
        alertText: c('Info').t`Which event would you like to delete?`,
    };

    if (types.length !== 1) {
        return defaultTexts;
    }
    if (types[0] === RECURRING_TYPES.SINGLE) {
        if (inviteType === INVITE_ACTION_TYPES.DECLINE_INVITATION) {
            if (sendCancellationNotice) {
                return {
                    ...defaultTexts,
                    alertText: c('Info')
                        .t`This event has been updated. The organizer will be notified that you decline the invitation. Would you like to delete this event?`,
                };
            }
            return {
                ...defaultTexts,
                alertText: c('Info')
                    .t`This event has been updated by the organizer. Would you like to delete this event?`,
            };
        }
        if (inviteType === INVITE_ACTION_TYPES.DECLINE_DISABLED && sendCancellationNotice) {
            return {
                ...defaultTexts,
                alertText: c('Info')
                    .t`This event has been updated. The organizer will not be notified that you decline the invitation as you can't send emails from the invited address. Would you like to delete this event anyway?`,
            };
        }
        return {
            ...defaultTexts,
            alertText: c('Info').t`Would you like to delete this event?`,
        };
    }
    if (types[0] === RECURRING_TYPES.ALL) {
        if (inviteType === INVITE_ACTION_TYPES.CANCEL_INVITATION) {
            return {
                ...defaultTexts,
                alertText: c('Info')
                    .t`A cancellation email will be sent to the event participants. Would you like to delete all events in this series?`,
            };
        }
        if (inviteType === INVITE_ACTION_TYPES.CANCEL_DISABLED) {
            return {
                ...defaultTexts,
                alertText: c('Info')
                    .t`Your address is disabled. A cancellation email cannot be sent to the event participants. Would you like to delete all events in this series anyway?`,
            };
        }
        if (inviteType === INVITE_ACTION_TYPES.DECLINE_INVITATION && sendCancellationNotice) {
            return {
                ...defaultTexts,
                alertText: c('Info')
                    .t`The organizer of this series of events will be notified that you decline the invitation. Would you like to delete all the events in this series?`,
            };
        }
        if (inviteType === INVITE_ACTION_TYPES.DECLINE_DISABLED && sendCancellationNotice) {
            return {
                ...defaultTexts,
                alertText: c('Info')
                    .t`The organizer of this series of events will not be notified that you decline the invitation as you can't send emails from the invited address. Would you like to delete all the events in this series anyway?`,
            };
        }
        return {
            ...defaultTexts,
            alertText: c('Info').t`Would you like to delete all the events in this series?`,
        };
    }
    // should never fall here
    return {
        title: '',
        confirm: '',
        alertText: '',
    };
};

const getRecurringWarningText = (isAttendee: boolean, inviteActions: InviteActions) => {
    if (!isAttendee) {
        return '';
    }
    if (inviteActions.resetSingleEditsPartstat) {
        return c('Info')
            .t`Occurrences previously updated by the organizer will be kept, but some of your answers will be lost.`;
    }
    return c('Info').t`Occurrences previously updated by the organizer will be kept.`;
};

interface Props {
    types: RECURRING_TYPES[];
    isAttendee: boolean;
    hasNonCancelledSingleEdits: boolean;
    inviteActions: InviteActions;
    onConfirm: (data: RecurringActionData) => void;
    onClose: () => void;
    isOpen: boolean;
}
const DeleteRecurringConfirmModal = ({
    types,
    hasNonCancelledSingleEdits,
    isAttendee,
    inviteActions,
    onConfirm,
    onClose,
    isOpen,
}: Props) => {
    const [type, setType] = useState(types[0]);
    const { deleteSingleEdits } = inviteActions;
    const { title, confirm, alertText } = getTexts(types, inviteActions);
    const showWarning = hasNonCancelledSingleEdits && type === RECURRING_TYPES.ALL && !deleteSingleEdits;
    const warningText = showWarning ? getRecurringWarningText(isAttendee, inviteActions) : '';
    const handleConfirm = async () => {
        onConfirm({ type, inviteActions });
        onClose();
    };

    return (
        <AlertModal
            title={title}
            buttons={[
                <Button color="danger" onClick={handleConfirm}>
                    {confirm}
                </Button>,
                <Button type="reset" onClick={onClose} autoFocus>{c('Action').t`Cancel`}</Button>,
            ]}
            onSubmit={handleConfirm}
            open={isOpen}
        >
            <div className="mb1">{alertText}</div>
            {warningText && (
                <Alert className="mb1" type="warning">
                    {warningText}
                </Alert>
            )}
            {types.length > 1 ? (
                <SelectRecurringType
                    types={types}
                    type={type}
                    setType={setType}
                    data-test-id="delete-recurring-popover:delete-option-radio"
                />
            ) : null}
        </AlertModal>
    );
};

export default DeleteRecurringConfirmModal;
