import React from 'react';
import { c } from 'ttag';
import { updateNotifyEmail, updateResetEmail, updateResetPhone } from 'proton-shared/lib/api/settings';
import { CLIENT_TYPES } from 'proton-shared/lib/constants';

import { Toggle, Info, Loader } from '../../components';

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
import SettingsParagraph from '../account/SettingsParagraph';
import { SettingsSection } from '../account';
import SettingsLayout from '../account/SettingsLayout';
import SettingsLayoutLeft from '../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../account/SettingsLayoutRight';

const { VPN } = CLIENT_TYPES;

const RecoveryMethodsSection = () => {
    const { createModal } = useModals();
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
        <SettingsSection>
            <SettingsParagraph>
                {c('Info')
                    .t`We recommend adding a linked email or phone number so you can recover your account if you lose your password.`}
            </SettingsParagraph>
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label className="text-semibold" htmlFor="recovery-email-input">
                        {c('Label').t`Email address`}
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight>
                    <div className="mb1">
                        <RecoveryEmail
                            email={userSettings.Email.Value}
                            hasReset={!!userSettings.Email.Reset}
                            hasNotify={!!userSettings.Email.Notify}
                        />
                    </div>
                    <div className="mb1 flex flex-align-items-center">
                        <Toggle
                            className="mr0-5"
                            loading={loadingReset}
                            checked={!!userSettings.Email.Reset && !!userSettings.Email.Value}
                            id="passwordEmailResetToggle"
                            onChange={({ target: { checked } }) =>
                                withLoadingReset(handleChangePasswordEmailToggle(+checked))
                            }
                        />
                        <span className="mr0-5">{c('Label').t`Email recovery`}</span>
                        <Info
                            url="https://protonmail.com/blog/notification-emails/"
                            title={c('Info')
                                .t`Disabling this will prevent this email from being used for account recovery`}
                        />
                    </div>
                    {CLIENT_TYPE !== VPN ? (
                        <div className="flex flex-align-items-center">
                            <Toggle
                                className="mr0-5"
                                loading={loadingNotify}
                                checked={!!userSettings.Email.Notify && !!userSettings.Email.Value}
                                id="dailyNotificationsToggle"
                                onChange={({ target: { checked } }) =>
                                    withLoadingNotify(handleChangeEmailNotify(+checked))
                                }
                            />
                            <span className="mr0-5">{c('Label').t`Daily email notifications`}</span>
                            <Info
                                url="https://protonmail.com/blog/notification-emails/"
                                title={c('Info')
                                    .t`When notifications are enabled, we'll send an alert to your recovery/notification address if you have new messages in your ProtonMail account.`}
                            />
                        </div>
                    ) : null}
                </SettingsLayoutRight>
            </SettingsLayout>

            <hr className="mb2 mt2" />

            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label className="pt0 on-mobile-mb0-5 text-semibold" htmlFor="phoneInput">
                        {c('label').t`Phone number`}
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight>
                    <div className="mb1">
                        <RecoveryPhone phone={userSettings.Phone.Value} hasReset={!!userSettings.Phone.Reset} />
                    </div>
                    <div className="flex flex-align-items-center">
                        <Toggle
                            className="mr0-5"
                            loading={loadingReset}
                            checked={!!userSettings.Phone.Reset && !!userSettings.Phone.Value}
                            id="passwordPhoneResetToggle"
                            onChange={({ target: { checked } }) =>
                                withLoadingReset(handleChangePasswordPhoneToggle(+checked))
                            }
                        />
                        <label htmlFor="passwordPhoneResetToggle">{c('Label').t`Password reset allowed`}</label>
                    </div>
                </SettingsLayoutRight>
            </SettingsLayout>
        </SettingsSection>
    );
};

export default RecoveryMethodsSection;
