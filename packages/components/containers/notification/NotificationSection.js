import React from 'react';
import { c } from 'ttag';
import { SubTitle, Label, Row, Info } from 'react-components';

import PasswordResetToggle from './PasswordResetToggle';
import DailyNotificationsToggle from './DailyNotificationsToggle';
import NewsCheckboxes from './NewsCheckboxes';
import RecoveryEmailButton from './RecoveryEmailButton';

const NotificationSection = () => {
    return (
        <>
            <SubTitle>{c('Title').t`Notification`}</SubTitle>
            <Row>
                <Label>{c('Label').t`Reset/notification email`}</Label>
                <RecoveryEmailButton />
            </Row>
            <Row>
                <Label htmlFor="passwordResetToggle">{c('Label').t`Allow password reset`}</Label>
                <PasswordResetToggle id="passwordResetToggle" />
            </Row>
            <Row>
                <Label htmlFor="dailyNotificationsToggle">
                    {c('Label').t`Daily email notifications`}{' '}
                    <Info
                        url="https://protonmail.com/blog/notification-emails/"
                        title={c('Info')
                            .t`When notifications are enabled, we'll send an alert to your recovery/notification address if you have new messages in your ProtonMail account.`}
                    />
                </Label>
                <DailyNotificationsToggle id="dailyNotificationsToggle" />
            </Row>
            <Row>
                <Label>{c('Label').t`Email subscriptions`}</Label>
                <NewsCheckboxes />
            </Row>
        </>
    );
};

export default NotificationSection;
