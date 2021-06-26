import { Alert } from 'react-components';
import { c } from 'ttag';
import React from 'react';
import { Calendar } from 'proton-shared/lib/interfaces/calendar';
import CalendarTableRows from './CalendarTableRows';

interface Props {
    calendarsToReset: Calendar[];
}
const CalendarResetSection = ({ calendarsToReset = [] }: Props) => {
    return (
        <>
            <Alert type="warning">{c('Info')
                .t`You have reset your password and events linked to the following calendars couldn't be decrypted. Any shared calendar links you created previously will no longer work.`}</Alert>
            <CalendarTableRows calendars={calendarsToReset} />
        </>
    );
};

export default CalendarResetSection;
