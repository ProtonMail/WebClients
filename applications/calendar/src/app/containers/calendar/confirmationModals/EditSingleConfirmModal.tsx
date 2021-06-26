import React from 'react';
import { c } from 'ttag';
import { Alert, FormModal } from 'react-components';
import { RECURRING_TYPES } from 'proton-shared/lib/calendar/constants';
import { INVITE_ACTION_TYPES, InviteActions, RecurringActionData } from '../../../interfaces/Invite';

const { SEND_INVITATION, SEND_UPDATE } = INVITE_ACTION_TYPES;

const getTexts = ({ type, addedAttendees, removedAttendees, hasRemovedAllAttendees }: InviteActions) => {
    const hasAddedAttendees = !!addedAttendees?.length;
    const hasRemovedAttendees = !!removedAttendees?.length;
    if (type === SEND_INVITATION) {
        if (hasAddedAttendees && hasRemovedAttendees) {
            return {
                title: c('Title').t`Save changes`,
                submit: c('Action').t`Save`,
                alertText: c('Info').t`Added and removed participants will be notified.`,
            };
        }
        if (hasAddedAttendees) {
            return {
                title: c('Title').t`Add participants`,
                submit: c('Action').t`Add`,
                alertText: c('Info').t`An invitation will be sent to added participants.`,
            };
        }
        if (hasRemovedAttendees) {
            return {
                title: c('Title').t`Remove participants`,
                submit: c('Action').t`Remove`,
                alertText: c('Info').t`A cancellation email will be sent to removed participants.`,
            };
        }
        return {
            title: c('Title').t`Send invitation`,
            submit: c('Action').t`Send`,
            alertText: c('Info').t`An invitation will be sent to added participants.`,
        };
    }
    if (type === SEND_UPDATE) {
        if (hasAddedAttendees && hasRemovedAttendees) {
            if (hasRemovedAllAttendees) {
                return {
                    title: c('Title').t`Save changes`,
                    submit: c('Action').t`Save`,
                    alertText: c('Info').t`Added and removed participants will be notified.`,
                };
            }
            return {
                title: c('Title').t`Save changes`,
                submit: c('Action').t`Save`,
                alertText: c('Info').t`Existent, added and removed participants will be notified.`,
            };
        }
        if (hasAddedAttendees) {
            return {
                title: c('Title').t`Save changes`,
                submit: c('Action').t`Save`,
                alertText: c('Info').t`Existent and added participants will be notified.`,
            };
        }
        if (hasRemovedAllAttendees) {
            return {
                title: c('Title').t`Save changes`,
                submit: c('Action').t`Save`,
                alertText: c('Info').t`Removed participants will be notified.`,
            };
        }
        if (hasRemovedAttendees) {
            return {
                title: c('Title').t`Save changes`,
                submit: c('Action').t`Save`,
                alertText: c('Info').t`Existent and removed participants will be notified.`,
            };
        }
        return {
            title: c('Title').t`Update event`,
            submit: c('Action').t`Update`,
            alertText: c('Info').t`An invitation will be sent to the event participants.`,
        };
    }
    // should never fall here
    return {
        title: '',
        action: '',
        alertText: '',
    };
};

interface Props {
    inviteActions: InviteActions;
    onConfirm: ({ type, inviteActions }: RecurringActionData) => void;
    onClose: () => void;
}

const EditSingleConfirmModal = ({ inviteActions, onConfirm, ...rest }: Props) => {
    const { title, submit, alertText } = getTexts(inviteActions);
    const handleSubmit = () => {
        onConfirm({ type: RECURRING_TYPES.SINGLE, inviteActions });
        rest.onClose();
    };
    return (
        <FormModal title={title} small submit={submit} close={c('Action').t`Cancel`} onSubmit={handleSubmit} {...rest}>
            <Alert type="info">{alertText}</Alert>
        </FormModal>
    );
};

export default EditSingleConfirmModal;
