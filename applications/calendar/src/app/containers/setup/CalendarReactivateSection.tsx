import { c } from 'ttag';

import { Banner } from '@proton/atoms/index';
import type { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

import CalendarTableRows from './CalendarTableRows';

interface Props {
    calendarsToReactivate: VisualCalendar[];
}
const CalendarReactivateSection = ({ calendarsToReactivate = [] }: Props) => {
    return (
        <>
            <Banner className="mb-4" variant="info">{c('Info')
                .t`You have reactivated your keys and events linked to the following calendars can now be decrypted.`}</Banner>
            <CalendarTableRows calendars={calendarsToReactivate} />
        </>
    );
};

export default CalendarReactivateSection;
