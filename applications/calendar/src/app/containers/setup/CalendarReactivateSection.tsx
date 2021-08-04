import { Alert } from '@proton/components';
import { c } from 'ttag';
import { Calendar } from '@proton/shared/lib/interfaces/calendar';
import CalendarTableRows from './CalendarTableRows';

interface Props {
    calendarsToReactivate: Calendar[];
}
const CalendarReactivateSection = ({ calendarsToReactivate = [] }: Props) => {
    return (
        <>
            <Alert type="info">{c('Info')
                .t`You have reactivated your keys and events linked to the following calendars can now be decrypted.`}</Alert>
            <CalendarTableRows calendars={calendarsToReactivate} />
        </>
    );
};

export default CalendarReactivateSection;
