import React, { useState } from 'react';
import { c } from 'ttag';
import { updateNotifyEmail, updateResetEmail, updateResetPhone } from 'proton-shared/lib/api/settings';
import { CLIENT_TYPES } from 'proton-shared/lib/constants';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';

import { Toggle, Alert, Label, Row, Field, Info, Tabs, Loader } from '../../components';

import {
    useApi,
    useModals,
    useUserSettings,
    useLoading,
    useEventManager,
    useNotifications,
    useConfig,
} from '../../hooks';

import AuthModal from '../password/AuthModal';
import RecoveryEmail from './RecoveryEmail';
import RecoveryPhone from './RecoveryPhone';
import EmailModal from './EmailModal';
import PhoneModal from './PhoneModal';

const { VPN } = CLIENT_TYPES;

const RecoveryMethodsSection = () => {
    const { createModal } = useModals();
    const [tab, setTab] = useState(0);
    const [userSettings, loadingUserSettings] = useUserSettings();
    const [loadingReset, withLoadingReset] = useLoading();
    const [loadingNotify, withLoadingNotify] = useLoading();
    const { createNotification } = useNotifications();
    const { call } = useEventManager();
    const api = useApi();
    const { CLIENT_TYPE } = useConfig();

    if (loadingUserSettings || !userSettings) {
        return <Loader />;
    }

    const handleRecoveryEmail = () => {
        createModal(
            <EmailModal
                email={userSettings.Email.Value || '' /* can be null */}
                hasReset={!!userSettings.Email.Reset}
                hasNotify={!!userSettings.Email.Notify}
            />
        );
    };

    const handleRecoveryPhone = () => {
        createModal(
            <PhoneModal
                phone={userSettings.Phone.Value || '' /* can be null */}
                hasReset={!!userSettings.Phone.Reset}
            />
        );
    };

    const handleChangePasswordEmailToggle = async (value: number) => {
        if (value && !userSettings.Email.Value) {
            return createNotification({
                type: 'error',
                text: c('Error').t`Please set a recovery/notification email first`,
            });
        }
        await new Promise((resolve, reject) => {
            createModal(<AuthModal onClose={reject} onSuccess={resolve} config={updateResetEmail(value)} />);
        });
        await call();
    };

    const handleChangePasswordPhoneToggle = async (value: number) => {
        if (value && !userSettings.Phone.Value) {
            return createNotification({ type: 'error', text: c('Error').t`Please set a recovery phone number first` });
        }
        await new Promise((resolve, reject) => {
            createModal(<AuthModal onClose={reject} onSuccess={resolve} config={updateResetPhone({ Reset: value })} />);
        });
        await call();
    };

    const handleChangeEmailNotify = async (value: number) => {
        if (value && !userSettings.Email.Value) {
            return createNotification({
                type: 'error',
                text: c('Error').t`Please set a recovery/notification email first`,
            });
        }
        await api(updateNotifyEmail(value));
        await call();
    };

    return (
        <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
                {
                    title: c('Recovery method').t`Email`,
                    content: (
                        <>
                            <Alert>{c('Info')
                                .t`The selected method can be used to recover an account in the event you forget your password and to be notified about missed emails.`}</Alert>
                            <Row className="flex-align-items-center">
                                <Label className="pt0">{c('Label').t`Email address`}</Label>
                                <RecoveryEmail email={userSettings.Email.Value} onClick={handleRecoveryEmail} />
                            </Row>
                            <Row>
                                <Label htmlFor="passwordEmailResetToggle">{c('Label').t`Allow password reset`}</Label>
                                <Field className="pt0-5">
                                    <Toggle
                                        loading={loadingReset}
                                        checked={!!userSettings.Email.Reset && !!userSettings.Email.Value}
                                        id="passwordEmailResetToggle"
                                        onChange={({ target: { checked } }) =>
                                            withLoadingReset(handleChangePasswordEmailToggle(+checked))
                                        }
                                    />
                                </Field>
                            </Row>
                            {CLIENT_TYPE === VPN ? null : (
                                <Row>
                                    <Label htmlFor="dailyNotificationsToggle">
                                        <span className="mr0-5">{c('Label').t`Daily email notifications`}</span>
                                        <Info
                                            url="https://protonmail.com/blog/notification-emails/"
                                            title={c('Info')
                                                .t`When notifications are enabled, we'll send an alert to your recovery/notification address if you have new messages in your ProtonMail account.`}
                                        />
                                    </Label>
                                    <Field className="pt0-5">
                                        <Toggle
                                            loading={loadingNotify}
                                            checked={!!userSettings.Email.Notify && !!userSettings.Email.Value}
                                            id="dailyNotificationsToggle"
                                            onChange={({ target: { checked } }) =>
                                                withLoadingNotify(handleChangeEmailNotify(+checked))
                                            }
                                        />
                                    </Field>
                                </Row>
                            )}
                        </>
                    ),
                },
                CLIENT_TYPE !== VPN && {
                    title: c('Recovery method').t`SMS`,
                    content: (
                        <>
                            <Alert>{c('Info')
                                .t`The selected method can be used to recover an account in the event you forget your password.`}</Alert>
                            <Row className="flex-align-items-center">
                                <Label className="pt0">{c('Label').t`Phone number`}</Label>
                                <RecoveryPhone phone={userSettings.Phone.Value} onClick={handleRecoveryPhone} />
                            </Row>
                            <Row>
                                <Label htmlFor="passwordPhoneResetToggle">{c('Label').t`Allow password reset`}</Label>
                                <Field className="pt0-5">
                                    <Toggle
                                        loading={loadingReset}
                                        checked={!!userSettings.Phone.Reset && !!userSettings.Phone.Value}
                                        id="passwordPhoneResetToggle"
                                        onChange={({ target: { checked } }) =>
                                            withLoadingReset(handleChangePasswordPhoneToggle(+checked))
                                        }
                                    />
                                </Field>
                            </Row>
                        </>
                    ),
                },
            ].filter(isTruthy)}
        />
    );
};

export default RecoveryMethodsSection;
