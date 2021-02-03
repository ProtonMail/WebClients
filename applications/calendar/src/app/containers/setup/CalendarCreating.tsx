import { c } from 'ttag';
import { Alert, FullLoader } from 'react-components';
import React from 'react';

const CalendarCreating = () => {
    return (
        <>
            <Alert>{c('Info').t`Give us a moment while we prepare your calendar.`}</Alert>
            <div className="text-center">
                <FullLoader size={80} className="center flex color-primary" />
                <p>{c('Info').t`Creating your calendar...`}</p>
            </div>
        </>
    );
};

export default CalendarCreating;
