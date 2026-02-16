import { c } from 'ttag';

import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableHeader from '@proton/components/components/table/TableHeader';
import TableRow from '@proton/components/components/table/TableRow';
import type { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

import CalendarIcon from '../../components/CalendarIcon';

const CalendarTableRow = ({ Name, Color }: VisualCalendar) => {
    return (
        <TableRow
            cells={[
                <div key={0} className="flex items-center flex-nowrap">
                    <CalendarIcon color={Color} className="shrink-0 mr-4" />
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
