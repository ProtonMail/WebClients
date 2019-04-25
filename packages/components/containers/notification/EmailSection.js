import React from 'react';
import { c } from 'ttag';
import { Alert, SubTitle, Label, Row, Field, Info } from 'react-components';

import PasswordResetToggle from './PasswordResetToggle';
import DailyNotificationsToggle from './DailyNotificationsToggle';

import RecoveryEmail from './RecoveryEmail';

const EmailSection = () => {
    return (
        <>
            <SubTitle>{c('Title').t`Recovery & notification`}</SubTitle>
            <Alert>{c('Info')
                .t`The selected method can be used to recover an account in the event you forget your password and to be notified about missed emails.`}</Alert>
            <Row>
                <Label>{c('Label').t`Email address`}</Label>
                <RecoveryEmail />
            </Row>
            <Row>
                <Label htmlFor="passwordResetToggle">{c('Label').t`Allow password reset`}</Label>
                <Field>
                    <PasswordResetToggle id="passwordResetToggle" />
                </Field>
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
                <Field>
                    <DailyNotificationsToggle id="dailyNotificationsToggle" />
                </Field>
            </Row>
        </>
    );
};

export default EmailSection;
