import React from 'react';
import { c } from 'ttag';
import { APPS } from 'proton-shared/lib/constants';
import { updateNotifyEmail, updateResetEmail } from 'proton-shared/lib/api/settings';
import {
    AuthModal,
    Toggle,
    Alert,
    Label,
    Row,
    Field,
    Info,
    useApi,
    useModals,
    useUserSettings,
    useLoading,
    useEventManager,
    useNotifications,
    useConfig,
} from 'react-components';
import RecoveryEmail from './RecoveryEmail';
import EmailModal from './EmailModal';

const EmailSection = () => {
    const { createModal } = useModals();
    const [{ Email: { Value: email = '', Reset, Notify } = {} } = {}] = useUserSettings();
    const [loadingReset, withLoadingReset] = useLoading();
    const [loadingNotify, withLoadingNotify] = useLoading();
    const { createNotification } = useNotifications();
    const { call } = useEventManager();
    const api = useApi();
    const { APP_NAME } = useConfig();

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
            <Alert>{c('Info')
                .t`The selected method can be used to recover an account in the event you forget your password and to be notified about missed emails.`}</Alert>
            <Row className="flex-items-center">
                <Label className="pt0">{c('Label').t`Email address`}</Label>
                <RecoveryEmail email={email} onClick={handleRecoveryEmail} />
            </Row>
            <Row>
                <Label htmlFor="passwordResetToggle">{c('Label').t`Allow password reset`}</Label>
                <Field>
                    <Toggle
                        loading={loadingReset}
                        checked={!!Reset && !!email}
                        id="passwordResetToggle"
                        onChange={({ target: { checked } }) => withLoadingReset(handleChangePasswordToggle(+checked))}
                    />
                </Field>
            </Row>
            {APP_NAME === APPS.PROTONVPN_SETTINGS ? null : (
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
                            checked={!!Notify && !!email}
                            id="dailyNotificationsToggle"
                            onChange={({ target: { checked } }) => withLoadingNotify(handleChangeEmailNotify(+checked))}
                        />
                    </Field>
                </Row>
            )}
        </>
    );
};

export default EmailSection;
