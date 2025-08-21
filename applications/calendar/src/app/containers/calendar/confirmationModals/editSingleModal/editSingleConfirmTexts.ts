import { c } from 'ttag';

import { INVITE_ACTION_TYPES, type InviteActions } from '../../../../interfaces/Invite';

export const getTexts = ({ type, addedAttendees, removedAttendees, hasRemovedAllAttendees }: InviteActions) => {
    const hasAddedAttendees = !!addedAttendees?.length;
    const hasRemovedAttendees = !!removedAttendees?.length;
    if (type === INVITE_ACTION_TYPES.SEND_INVITATION) {
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
    if (type === INVITE_ACTION_TYPES.SEND_UPDATE) {
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
