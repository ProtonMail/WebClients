import { Alert, Icon } from 'react-components';
import { c } from 'ttag';
import React from 'react';
import calendarSvg from 'design-system/assets/img/pm-images/calendar.svg';

const CalendarReady = () => {
    const supportIcon = <Icon key="support-icon" name="support1" />;
    return (
        <>
            <Alert>{c('Info')
                .t`Your new calendar is now ready. All events in your calendar are encrypted and inaccessible to anybody other than you.`}</Alert>
            <div className="aligncenter">
                <img src={calendarSvg} alt="Calendar" />
            </div>
            <Alert>{c('Info')
                .jt`If you encounter a problem, you can reach our support team by clicking the ${supportIcon} button.`}</Alert>
        </>
    );
};

export default CalendarReady;
