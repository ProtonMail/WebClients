import React, { useState } from 'react';
import { Alert, ConfirmModal, FormModal } from 'react-components';
import { c } from 'ttag';
import { RECURRING_TYPES } from '../../../constants';
import { INVITE_ACTION_TYPES, InviteActions } from '../eventActions/inviteActions';
import SelectRecurringType from './SelectRecurringType';

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

const getAlertText = (types: RECURRING_TYPES[], inviteActions: InviteActions) => {
    const isChangingPartstat = inviteActions.type === INVITE_ACTION_TYPES.CHANGE_PARTSTAT;
    if (types.length === 1) {
        if (types[0] === RECURRING_TYPES.SINGLE) {
            return isChangingPartstat
                ? c('Info')
                      .t`This event has been updated by the organizer. Would you like to change your answer only for this event in the series?`
                : c('Info').t`Would you like to update this event?`;
        }
        if (types[0] === RECURRING_TYPES.ALL) {
            return isChangingPartstat
                ? c('Info').t`Would you like to change your answer for all the events in the series?`
                : c('Info').t`Would you like to update all the events in the series?`;
        }
    }
    return c('Info').t`Which event would you like to update?`;
};

const getRecurringWarningText = (isInvitation: boolean, inviteActions: InviteActions) => {
    if (!isInvitation) {
        return c('Info').t`Previous modifications on this series will be lost`;
    }
    if (inviteActions.resetSingleEditsPartstat) {
        return c('Info').t`Your answers to occurrences previously updated by the organizer will be lost`;
    }
    return '';
};

const getRruleWarningText = () => {
    return c('Info').t`Frequency modifications will be lost`;
};

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

    const alertText = getAlertText(types, inviteActions);
    const hasPreviousModifications =
        (type === RECURRING_TYPES.ALL && hasSingleModifications) ||
        (type === RECURRING_TYPES.FUTURE && hasSingleModificationsAfter);
    const recurringWarningText = hasPreviousModifications ? getRecurringWarningText(isInvitation, inviteActions) : '';

    const showRruleWarning = !isInvitation && type === RECURRING_TYPES.SINGLE && hasRruleModification;
    const rruleWarningText = showRruleWarning ? getRruleWarningText() : '';

    if (isInvitation && hasCalendarModification && hasPreviousModifications) {
        const alertText = c('Info').t`The organizer has updated some of the events in this series.
        Changing the calendar is not supported yet for this type of recurring events.`;
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
            confirm={c('Action').t`Update`}
            title={c('Info').t`Update recurring event`}
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
