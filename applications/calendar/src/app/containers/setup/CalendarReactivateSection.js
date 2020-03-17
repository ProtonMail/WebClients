import { Alert } from 'react-components';
import { c } from 'ttag';
import React from 'react';
import CalendarTableRows from './CalendarTableRows';

const CalendarReactivateSection = ({ calendarsToReactivate = [] }) => {
    return (
        <>
            <Alert type="info">{c('Info')
                .t`You have reactivated your keys and events linked to the following calendars can now be decrypted.`}</Alert>
            <CalendarTableRows calendars={calendarsToReactivate} />
        </>
    );
};

export default CalendarReactivateSection;
