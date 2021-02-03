import { Table, TableBody, TableHeader, TableRow } from 'react-components';
import React from 'react';
import { c } from 'ttag';
import { Calendar } from 'proton-shared/lib/interfaces/calendar';
import CalendarIcon from '../../components/CalendarIcon';

const CalendarTableRow = ({ Name, Color }: Calendar) => {
    return (
        <TableRow
            cells={[
                <div key={0} className="flex flex-align-items-center flex-nowrap">
                    <CalendarIcon color={Color} className="flex-item-noshrink mr1" />
                    <span className="text-ellipsis" title={Name}>
                        {Name}
                    </span>
                </div>,
            ]}
        />
    );
};

interface Props {
    calendars: Calendar[];
}
const CalendarTableRows = ({ calendars = [] }: Props) => {
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
