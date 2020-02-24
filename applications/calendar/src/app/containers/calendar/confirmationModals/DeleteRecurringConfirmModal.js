import { c } from 'ttag';
import { Alert, ConfirmModal, ErrorButton, Radio, ResetButton, Row } from 'react-components';
import React, { useState } from 'react';
import { RECURRING_DELETE_TYPES } from '../../../constants';

const SelectDeleteType = ({ isFirstOccurrence, type, setType }) => {
    const radios = [
        {
            label: c('Option').t`This event`,
            value: RECURRING_DELETE_TYPES.SINGLE
        },
        isFirstOccurrence && {
            label: c('Option').t`All events`,
            value: RECURRING_DELETE_TYPES.ALL
        },
        !isFirstOccurrence && {
            label: c('Option').t`This and future events`,
            value: RECURRING_DELETE_TYPES.FUTURE
        }
    ].filter(Boolean);

    return (
        <>
            {radios.map(({ label, value }, i) => {
                const id = i.toString();
                return (
                    <Row key={i}>
                        <Radio id={id} checked={value === type} onChange={() => setType(value)}>
                            <span className="flex-item-fluid">{label}</span>
                        </Radio>
                    </Row>
                );
            })}
        </>
    );
};

const DeleteRecurringConfirmModal = ({ isFirstOccurrence, onConfirm, ...rest }) => {
    const [type, setType] = useState(RECURRING_DELETE_TYPES.SINGLE);
    const title = c('Info').t`Delete recurring event`;
    const message = c('Info').t`Which event would you like to delete?`;

    return (
        <ConfirmModal
            confirm={<ErrorButton type="submit">{c('Action').t`Delete`}</ErrorButton>}
            title={title}
            close={<ResetButton autoFocus={true}>{c('Action').t`Cancel`}</ResetButton>}
            {...rest}
            onConfirm={() => onConfirm(type)}
        >
            <Alert type="error">{message}</Alert>
            <SelectDeleteType isFirstOccurrence={isFirstOccurrence} type={type} setType={setType} />
        </ConfirmModal>
    );
};

export default DeleteRecurringConfirmModal;
