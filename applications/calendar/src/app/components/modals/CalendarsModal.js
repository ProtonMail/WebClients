import React from 'react';
import { c } from 'ttag';
import { FormModal, Table, TableHeader } from 'react-components';

const CalendarsModal = ({ ...rest }) => {
    const headers = [c('Header').t`Name`, c('Header').t`Actions`];
    const handleSubmit = () => {};

    return (
        <FormModal
            title={c('Title').t`Manage calendars`}
            submit={c('Action').t`Save`}
            onSubmit={handleSubmit}
            {...rest}
        >
            <Table>
                <TableHeader cells={headers} />
            </Table>
        </FormModal>
    );
};

export default CalendarsModal;
