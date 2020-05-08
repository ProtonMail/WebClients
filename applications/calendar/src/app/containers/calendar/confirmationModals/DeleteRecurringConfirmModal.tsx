import { c } from 'ttag';
import { Alert, ConfirmModal, ErrorButton, ResetButton } from 'react-components';
import React, { useState } from 'react';
import SelectRecurringType from './SelectRecurringType';
import { RECURRING_TYPES } from '../../../constants';

interface Props {
    types: RECURRING_TYPES[];
    onConfirm: (type: RECURRING_TYPES) => void;
    onClose: () => void;
}

const getAlertText = (types: RECURRING_TYPES[]) => {
    if (types.length === 1) {
        if (types[0] === RECURRING_TYPES.SINGLE) {
            return c('Info').t`Would you like to delete this event?`;
        }
        if (types[0] === RECURRING_TYPES.ALL) {
            return c('Info').t`Would you like to delete all the events in the series?`;
        }
    }
    return c('Info').t`Which event would you like to delete?`;
};

const DeleteRecurringConfirmModal = ({ types, onConfirm, ...rest }: Props) => {
    const [type, setType] = useState(types[0]);

    return (
        <ConfirmModal
            confirm={<ErrorButton type="submit">{c('Action').t`Delete`}</ErrorButton>}
            title={c('Info').t`Delete recurring event`}
            cancel={<ResetButton autoFocus={true}>{c('Action').t`Cancel`}</ResetButton>}
            {...rest}
            onConfirm={() => onConfirm(type)}
        >
            <Alert type="error">{getAlertText(types)}</Alert>
            {types.length > 1 ? (
                <SelectRecurringType
                    types={types}
                    type={type}
                    setType={setType}
                    data-test-id="delete-recurring-popover:delete-option-radio"
                />
            ) : null}
        </ConfirmModal>
    );
};

export default DeleteRecurringConfirmModal;
