import { useState } from 'react';
import { Alert, ConfirmModal, FormModal } from '@proton/components';
import { c } from 'ttag';
import { RECURRING_TYPES } from '@proton/shared/lib/calendar/constants';
import { INVITE_ACTION_TYPES, InviteActions } from '../../../interfaces/Invite';
import SelectRecurringType from './SelectRecurringType';

const getTexts = (types: RECURRING_TYPES[], inviteActions: InviteActions) => {
    const { type: inviteType, addedAttendees, removedAttendees, hasRemovedAllAttendees } = inviteActions;
    const hasAddedAttendees = !!addedAttendees?.length;
    const hasRemovedAttendees = !!removedAttendees?.length;

    const defaultTexts = {
        title: c('Title').t`Update recurring event`,
        confirm: c('Action').t`Update`,
        alertText: c('Info').t`Which event would you like to update?`,
    };

    if (types.length !== 1) {
        return defaultTexts;
    }
    if (types[0] === RECURRING_TYPES.SINGLE) {
        if (inviteType === INVITE_ACTION_TYPES.CHANGE_PARTSTAT) {
            return {
                ...defaultTexts,
                alertText: c('Info')
                    .t`This event has been updated by the organizer. Would you like to change your answer only for this occurrence in this series?`,
            };
        }
        return {
            ...defaultTexts,
            alertText: c('Info').t`Would you like to update this event?`,
        };
    }
    if (types[0] === RECURRING_TYPES.ALL) {
        if (inviteType === INVITE_ACTION_TYPES.CHANGE_PARTSTAT) {
            return {
                ...defaultTexts,
                alertText: c('Info').t`Would you like to change your answer for all the events in this series?`,
            };
        }
        if (inviteType === INVITE_ACTION_TYPES.SEND_INVITATION) {
            if (hasAddedAttendees && hasRemovedAttendees) {
                return {
                    title: c('Title').t`Save changes`,
                    confirm: c('Action').t`Save`,
                    alertText: c('Info')
                        .t`Added and removed participants will be notified about all the events in this series.`,
                };
            }
            if (hasAddedAttendees) {
                return {
                    title: c('Title').t`Add participants`,
                    confirm: c('Action').t`Add`,
                    alertText: c('Success')
                        .t`An invitation will be sent to added participants for all the events in this series.`,
                };
            }
            if (hasRemovedAttendees) {
                return {
                    title: c('Title').t`Remove participants`,
                    confirm: c('Action').t`Remove`,
                    alertText: c('Success')
                        .t`A cancellation email will be sent to removed participants for all the events in this series.`,
                };
            }
            // should never fall here
            throw new Error('Inconsistent invite actions');
        }
        if (inviteType === INVITE_ACTION_TYPES.SEND_UPDATE) {
            if (hasAddedAttendees && hasRemovedAttendees) {
                if (hasRemovedAllAttendees) {
                    return {
                        title: c('Title').t`Save changes`,
                        confirm: c('Action').t`Save`,
                        alertText: c('Info')
                            .t`You will update all the events in this series. Added and removed participants will be notified.`,
                    };
                }
                return {
                    title: c('Title').t`Save changes`,
                    confirm: c('Action').t`Save`,
                    alertText: c('Info')
                        .t`You will update all the events in this series. Existent, added and removed participants will be notified.`,
                };
            }
            if (hasAddedAttendees) {
                return {
                    title: c('Title').t`Save changes`,
                    confirm: c('Action').t`Save`,
                    alertText: c('Info')
                        .t`You will update all the events in this series. Existent and added participants will be notified.`,
                };
            }
            if (hasRemovedAllAttendees) {
                return {
                    title: c('Title').t`Save changes`,
                    confirm: c('Action').t`Save`,
                    alertText: c('Info')
                        .t`You will update all the events in this series. Removed participants will be notified.`,
                };
            }
            if (hasRemovedAttendees) {
                return {
                    title: c('Title').t`Save changes`,
                    confirm: c('Action').t`Save`,
                    alertText: c('Info')
                        .t`You will update all the events in this series. Existent and removed participants will be notified.`,
                };
            }
            return {
                ...defaultTexts,
                alertText: c('Info')
                    .t`You will update all the events in this series. An invitation will be sent to the event participants.`,
            };
        }
        return {
            ...defaultTexts,
            alertText: c('Info').t`Would you like to update all events in this series?`,
        };
    }
    // should never fall here
    throw new Error('Unknown confirmation type');
};

const getRecurringWarningText = (isInvitation: boolean, inviteActions: InviteActions) => {
    if (!isInvitation) {
        return c('Info').t`Previous modifications on this series will be lost.`;
    }
    if (inviteActions.resetSingleEditsPartstat) {
        return c('Info').t`Some of your answers to occurrences previously updated by the organizer will be lost.`;
    }
    return '';
};

const getRruleWarningText = () => {
    return c('Info').t`Frequency modifications will be lost.`;
};

interface Props {
    types: RECURRING_TYPES[];
    hasSingleModifications: boolean;
    hasSingleModificationsAfter: boolean;
    hasRruleModification: boolean;
    hasCalendarModification: boolean;
    isInvitation: boolean;
    inviteActions: InviteActions;
    onConfirm: ({ type, inviteActions }: { type: RECURRING_TYPES; inviteActions: InviteActions }) => void;
    onClose: () => void;
}
const EditRecurringConfirmModal = ({
    types,
    hasSingleModifications,
    hasSingleModificationsAfter,
    hasRruleModification,
    hasCalendarModification,
    isInvitation,
    inviteActions,
    onConfirm,
    ...rest
}: Props) => {
    const [type, setType] = useState(types[0]);

    const { title, confirm, alertText } = getTexts(types, inviteActions);
    const hasPreviousModifications =
        (type === RECURRING_TYPES.ALL && hasSingleModifications) ||
        (type === RECURRING_TYPES.FUTURE && hasSingleModificationsAfter);
    const recurringWarningText = hasPreviousModifications ? getRecurringWarningText(isInvitation, inviteActions) : '';

    const showRruleWarning = !isInvitation && type === RECURRING_TYPES.SINGLE && hasRruleModification;
    const rruleWarningText = showRruleWarning ? getRruleWarningText() : '';

    if (isInvitation && hasCalendarModification && hasPreviousModifications) {
        const alertText = c('Info')
            .t`The organizer has updated some of the events in this series. Changing the calendar is not supported yet for this type of recurring events.`;
        return (
            <FormModal
                small
                hasSubmit={false}
                title={c('Info').t`Update recurring event`}
                close={c('Action').t`Cancel`}
                {...rest}
            >
                <Alert type="warning">{alertText}</Alert>
            </FormModal>
        );
    }

    return (
        <ConfirmModal
            confirm={confirm}
            title={title}
            cancel={c('Action').t`Cancel`}
            {...rest}
            onConfirm={() => onConfirm({ type, inviteActions })}
        >
            <Alert type="info">{alertText}</Alert>
            {types.length > 1 ? (
                <SelectRecurringType
                    types={types}
                    type={type}
                    setType={setType}
                    data-test-id="update-recurring-popover:update-option-radio"
                />
            ) : null}
            {recurringWarningText ? <Alert type="warning">{recurringWarningText}</Alert> : null}
            {rruleWarningText ? <Alert type="warning">{rruleWarningText}</Alert> : null}
        </ConfirmModal>
    );
};

export default EditRecurringConfirmModal;
