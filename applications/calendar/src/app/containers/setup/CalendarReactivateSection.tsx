import { c } from 'ttag';

import Alert from '@proton/components/components/alert/Alert';
import type { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

import CalendarTableRows from './CalendarTableRows';

interface Props {
    calendarsToReactivate: VisualCalendar[];
}
const CalendarReactivateSection = ({ calendarsToReactivate = [] }: Props) => {
    return (
        <>
            <Alert className="mb-4" type="info">{c('Info')
                .t`You have reactivated your keys and events linked to the following calendars can now be decrypted.`}</Alert>
            <CalendarTableRows calendars={calendarsToReactivate} />
        </>
    );
};

export default CalendarReactivateSection;
