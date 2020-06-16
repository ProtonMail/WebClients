import { c } from 'ttag';
import { Alert, ConfirmModal } from 'react-components';
import React, { useState } from 'react';
import { RECURRING_TYPES } from '../../../constants';
import SelectRecurringType from './SelectRecurringType';

interface Props {
    types: RECURRING_TYPES[];
    hasSingleModifications: boolean;
    hasSingleModificationsAfter: boolean;
    hasRruleModification: boolean;
    onConfirm: (type: RECURRING_TYPES) => void;
    onClose: () => void;
}

const getAlertText = (types: RECURRING_TYPES[]) => {
    if (types.length === 1) {
        if (types[0] === RECURRING_TYPES.SINGLE) {
            return c('Info').t`Would you like to update this event?`;
        }
        if (types[0] === RECURRING_TYPES.ALL) {
            return c('Info').t`Would you like to update all the events in the series?`;
        }
    }
    return c('Info').t`Which event would you like to update?`;
};

const getRecurringWarningText = () => {
    return c('Info').t`Previous modifications on this series will be lost`;
};

const getRruleWarningText = () => {
    return c('Info').t`Frequency modifications will be lost`;
};

const EditRecurringConfirmModal = ({
    types,
    hasSingleModifications,
    hasSingleModificationsAfter,
    hasRruleModification,
    onConfirm,
    ...rest
}: Props) => {
    const [type, setType] = useState(types[0]);

    const alertText = getAlertText(types);
    const showRecurringWarning =
        (type === RECURRING_TYPES.ALL && hasSingleModifications) ||
        (type === RECURRING_TYPES.FUTURE && hasSingleModificationsAfter);
    const recurringWarningText = showRecurringWarning ? getRecurringWarningText() : '';

    const showRruleWarning = type === RECURRING_TYPES.SINGLE && hasRruleModification;
    const rruleWarningText = showRruleWarning ? getRruleWarningText() : '';

    return (
        <ConfirmModal
            confirm={c('Action').t`Update`}
            title={c('Info').t`Update recurring event`}
            cancel={c('Action').t`Cancel`}
            {...rest}
            onConfirm={() => onConfirm(type)}
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
