import { Alert } from 'react-components';
import { c } from 'ttag';
import React from 'react';
import calendarSvg from 'design-system/assets/img/onboarding/calendar-unlock.svg';

const CalendarReady = () => {
    return (
        <>
            <Alert>{c('Info')
                .t`Your new calendar is now ready. All events in your calendar are encrypted and inaccessible to anybody other than you.`}</Alert>
            <div className="text-center mb1">
                <img src={calendarSvg} alt="" />
            </div>
            <Alert>{c('Info')
                .jt`For any question or feedback, you can contact us from the Help dropdown located in the calendar header by clicking on Report bug.`}</Alert>
        </>
    );
};

export default CalendarReady;
