import { Alert, Icon, Table, TableBody, TableHeader, TableRow } from 'react-components';
import { c } from 'ttag';
import React from 'react';

const CalendarReactivateSection = ({ calendarsToReactivate = [] }) => {
    return (
        <>
            <Alert type="info">{c('Info')
                .t`You have reactivated your keys and events linked to the following calendars can now be decrypted.`}</Alert>
            <Table>
                <TableHeader cells={[c('Header').t`Name`]} />
                <TableBody>
                    {calendarsToReactivate.map(({ ID, Color, Name }) => {
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

export default CalendarReactivateSection;
