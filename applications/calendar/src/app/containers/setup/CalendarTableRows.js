import { Table, TableBody, TableHeader, TableRow } from 'react-components';
import React from 'react';
import { c } from 'ttag';
import CalendarIcon from '../../components/calendar/CalendarIcon';

const CalendarTableRow = ({ Name, Color }) => {
    return (
        <TableRow
            cells={[
                <div key={0} className="flex flex-items-center flex-nowrap">
                    <CalendarIcon color={Color} className="flex-item-noshrink mr1" />
                    <span className="ellipsis" title={Name}>
                        {Name}
                    </span>
                </div>
            ]}
        />
    );
};

const CalendarTableRows = ({ calendars = [] }) => {
    return (
        <Table>
            <TableHeader cells={[c('Header').t`Name`]} />
            <TableBody>
                {calendars.map((calendar) => {
                    return <CalendarTableRow key={calendar.ID} {...calendar} />;
                })}
            </TableBody>
        </Table>
    );
};

export default CalendarTableRows;
