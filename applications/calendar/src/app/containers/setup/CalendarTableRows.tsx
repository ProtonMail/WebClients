import { c } from 'ttag';

import { Table, TableBody, TableHeader, TableRow } from '@proton/components';
import { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

import CalendarIcon from '../../components/CalendarIcon';

const CalendarTableRow = ({ Name, Color }: VisualCalendar) => {
    return (
        <TableRow
            cells={[
                <div key={0} className="flex items-center flex-nowrap">
                    <CalendarIcon color={Color} className="flex-item-noshrink mr-4" />
                    <span className="text-ellipsis" title={Name}>
                        {Name}
                    </span>
                </div>,
            ]}
        />
    );
};

interface Props {
    calendars: VisualCalendar[];
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
