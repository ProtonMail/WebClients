import React from 'react';
import { c } from 'ttag';
import {
    AuthModal,
    Toggle,
    Alert,
    SubTitle,
    Label,
    Row,
    Field,
    Info,
    useApi,
    useModals,
    useUserSettings,
    useLoading,
    useEventManager,
    useNotifications
} from 'react-components';

import RecoveryEmail from './RecoveryEmail';
import EmailModal from './EmailModal';
import { updateNotifyEmail, updateResetEmail } from 'proton-shared/lib/api/settings';

const EmailSection = () => {
    const { createModal } = useModals();
    const [{ Email: { Value: email = '', Reset, Notify } = {} } = {}] = useUserSettings();
    const [loadingReset, withLoadingReset] = useLoading();
    const [loadingNotify, withLoadingNotify] = useLoading();
    const { createNotification } = useNotifications();
    const { call } = useEventManager();
    const api = useApi();

    const handleRecoveryEmail = () => {
        createModal(<EmailModal email={email || '' /* can be null */} hasReset={!!Reset} hasNotify={!!Notify} />);
    };

    const handleChangePasswordToggle = async (value) => {
        if (value && !email) {
            return createNotification({ type: 'error', text: c('Error').t`Please set a recovery/notification email` });
        }
        await new Promise((resolve, reject) => {
            createModal(<AuthModal onClose={reject} onSuccess={resolve} config={updateResetEmail(value)} />);
        });
        await call();
    };

    const handleChangeEmailNotify = async (value) => {
        if (value && !email) {
            return createNotification({ type: 'error', text: c('Error').t`Please set a recovery/notification email` });
        }
        await api(updateNotifyEmail(value));
        await call();
    };

    return (
        <>
            <SubTitle>{c('Title').t`Recovery & notification`}</SubTitle>
            <Alert>{c('Info')
                .t`The selected method can be used to recover an account in the event you forget your password and to be notified about missed emails.`}</Alert>
            <Row>
                <Label>{c('Label').t`Email address`}</Label>
                <RecoveryEmail email={email} onClick={handleRecoveryEmail} />
            </Row>
            {!email && Reset ? (
                <Alert type="warning">
                    {c('Warning').t`Password reset is enabled without an email address. Please set a recovery address.`}
                </Alert>
            ) : null}
            <Row>
                <Label htmlFor="passwordResetToggle">{c('Label').t`Allow password reset`}</Label>
                <Field>
                    <Toggle
                        loading={loadingReset}
                        checked={!!Reset}
                        id="passwordResetToggle"
                        onChange={({ target: { checked } }) => withLoadingReset(handleChangePasswordToggle(+checked))}
                    />
                </Field>
            </Row>
            <Row>
                <Label htmlFor="dailyNotificationsToggle">
                    <span className="mr0-5">{c('Label').t`Daily email notifications`}</span>
                    <Info
                        url="https://protonmail.com/blog/notification-emails/"
                        title={c('Info')
                            .t`When notifications are enabled, we'll send an alert to your recovery/notification address if you have new messages in your ProtonMail account.`}
                    />
                </Label>
                <Field>
                    <Toggle
                        loading={loadingNotify}
                        checked={!!Notify}
                        id="dailyNotificationsToggle"
                        onChange={({ target: { checked } }) => withLoadingNotify(handleChangeEmailNotify(+checked))}
                    />
                </Field>
            </Row>
        </>
    );
};

export default EmailSection;
