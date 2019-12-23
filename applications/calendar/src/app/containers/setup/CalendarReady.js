import { Alert, Icon } from 'react-components';
import { c } from 'ttag';
import React from 'react';
import calendarSvg from 'design-system/assets/img/pm-images/calendar.svg';

const CalendarReady = () => {
    const supportIcon = <Icon key="support-icon" name="report-bug" className="alignsub" />;
    return (
        <>
            <Alert>{c('Info')
                .t`Your new calendar is now ready. All events in your calendar are encrypted and inaccessible to anybody other than you.`}</Alert>
            <div className="aligncenter mb1">
                <img src={calendarSvg} alt="" />
            </div>
            <Alert>{c('Info')
                .jt`If you encounter a problem, you can reach our support team by clicking on Profile/${supportIcon} Report a bug button.`}</Alert>
        </>
    );
};

export default CalendarReady;
