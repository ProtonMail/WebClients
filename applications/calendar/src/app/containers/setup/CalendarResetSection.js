import { Alert, Icon, Table, TableBody, TableHeader, TableRow } from 'react-components';
import { c } from 'ttag';
import React from 'react';

const CalendarResetSection = ({ calendarsToReset = [] }) => {
    return (
        <>
            <Alert type="warning">{c('Info')
                .t`You have reset your password and events linked to the following calendars couldn't be decrypted.`}</Alert>
            <Table>
                <TableHeader cells={[c('Header').t`Name`]} />
                <TableBody>
                    {calendarsToReset.map(({ ID, Color, Name }) => {
                        return (
                            <TableRow
                                key={ID}
                                cells={[
                                    <div key={0}>
                                        <Icon name="calendar" color={Color} className="mr0-5" />
                                        {Name}
                                    </div>
                                ]}
                            />
                        );
                    })}
                </TableBody>
            </Table>
        </>
    );
};

export default CalendarResetSection;
