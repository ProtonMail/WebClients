import { c } from 'ttag';
import { Alert, ConfirmModal } from 'react-components';
import React, { useState } from 'react';
import { RECURRING_TYPES } from '../../../constants';
import SelectRecurringType from './SelectRecurringType';

interface Props {
    types: RECURRING_TYPES[];
    onConfirm: (type: RECURRING_TYPES) => void;
}

const EditRecurringConfirmModal = ({ types, onConfirm, ...rest }: Props) => {
    const [type, setType] = useState(types[0]);

    return (
        <ConfirmModal
            confirm={c('Action').t`Update`}
            title={c('Info').t`Update recurring event`}
            cancel={c('Action').t`Cancel`}
            {...rest}
            onConfirm={() => onConfirm(type)}
        >
            <Alert type="info">{c('Info').t`Which event would you like to update?`}</Alert>
            <SelectRecurringType
                types={types}
                type={type}
                setType={setType}
                data-test-id="update-recurring-popover:update-option-radio"
            />
        </ConfirmModal>
    );
};

export default EditRecurringConfirmModal;
