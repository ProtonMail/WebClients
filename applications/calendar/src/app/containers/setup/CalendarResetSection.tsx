import { c } from 'ttag';

import { Alert } from '@proton/components';
import { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

import CalendarTableRows from './CalendarTableRows';

interface Props {
    calendarsToReset: VisualCalendar[];
}
const CalendarResetSection = ({ calendarsToReset = [] }: Props) => {
    return (
        <>
            <Alert className="mb1" type="warning">
                <div className="text-pre-wrap">
                    {c('Info')
                        .t`You have reset your password and events linked to the following calendars couldn't be decrypted.
                Any calendar you shared will be inaccessible for the people you shared with.
                Any active subscribed calendars will synchronize again after a few minutes.`}
                </div>
            </Alert>
            <CalendarTableRows calendars={calendarsToReset} />
        </>
    );
};

export default CalendarResetSection;
