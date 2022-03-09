import { c } from 'ttag';
import { updateResetEmail, updateResetPhone } from '@proton/shared/lib/api/settings';
import { APPS } from '@proton/shared/lib/constants';

import { Loader, Toggle } from '../../components';
import {
    useConfig,
    useEventManager,
    useLoading,
    useModals,
    useMyLocation,
    useNotifications,
    useUserSettings,
} from '../../hooks';
import RecoveryEmail from './email/RecoveryEmail';
import RecoveryPhone from './RecoveryPhone';
import AuthModal from '../password/AuthModal';
import SettingsParagraph from '../account/SettingsParagraph';
import { SettingsSection } from '../account';
import SettingsLayout from '../account/SettingsLayout';
import SettingsLayoutLeft from '../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../account/SettingsLayoutRight';

const { PROTONVPN_SETTINGS } = APPS;

const AccountRecoverySection = () => {
    const { createModal } = useModals();
    const [userSettings, loadingUserSettings] = useUserSettings();
    const [loadingEmailReset, withLoadingEmailReset] = useLoading();
    const [loadingPhoneReset, withLoadingPhoneReset] = useLoading();
    const { createNotification } = useNotifications();
    const { call } = useEventManager();
    const { APP_NAME } = useConfig();
    const [myLocation, loadingMyLocation] = useMyLocation();
    const defaultCountry = myLocation?.Country?.toUpperCase();

    if (loadingUserSettings || !userSettings || loadingMyLocation) {
        return <Loader />;
    }

    const handleChangePasswordEmailToggle = async (value: number) => {
        if (value && !userSettings.Email.Value) {
            return createNotification({
                type: 'error',
                text: c('Error').t`Please set a recovery email first`,
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

    const canUsePhoneRecovery = APP_NAME !== PROTONVPN_SETTINGS;

    const text = canUsePhoneRecovery
        ? c('Info').t`In case you lose your login details, we’ll send you recovery instructions via email or SMS.`
        : c('Info').t`In case you lose your login details, we’ll send you recovery instructions via email.`;

    return (
        <SettingsSection>
            <SettingsParagraph>{text}</SettingsParagraph>
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label className="pt0 on-mobile-mb0-5 text-semibold" htmlFor="recovery-email-input">
                        {c('Label').t`Recovery email address`}
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight className="flex-item-fluid">
                    <RecoveryEmail
                        className="mb0 on-mobile-mb1"
                        email={userSettings.Email}
                        hasReset={!!userSettings.Email.Reset}
                        hasNotify={!!userSettings.Email.Notify}
                    />
                    <div className="mb1 flex flex-align-items-center">
                        <Toggle
                            className="mr0-5"
                            loading={loadingEmailReset}
                            checked={!!userSettings.Email.Reset && !!userSettings.Email.Value}
                            id="passwordEmailResetToggle"
                            onChange={({ target: { checked } }) =>
                                withLoadingEmailReset(handleChangePasswordEmailToggle(+checked))
                            }
                        />
                        <label htmlFor="passwordEmailResetToggle" className="flex-item-fluid">
                            {c('Label').t`Allow recovery by email`}
                        </label>
                    </div>
                </SettingsLayoutRight>
            </SettingsLayout>

            {canUsePhoneRecovery && (
                <>
                    <hr className="mb2 mt2" />

                    <SettingsLayout>
                        <SettingsLayoutLeft>
                            <label className="pt0 on-mobile-mb0-5 text-semibold" htmlFor="phoneInput">
                                {c('label').t`Recovery phone number`}
                            </label>
                        </SettingsLayoutLeft>
                        <SettingsLayoutRight className="flex-item-fluid">
                            <RecoveryPhone
                                className="mb0 on-mobile-mb1"
                                defaultCountry={defaultCountry}
                                phone={userSettings.Phone.Value}
                                hasReset={!!userSettings.Phone.Reset}
                            />
                            <div className="flex flex-align-items-center">
                                <Toggle
                                    className="mr0-5"
                                    loading={loadingPhoneReset}
                                    checked={!!userSettings.Phone.Reset && !!userSettings.Phone.Value}
                                    id="passwordPhoneResetToggle"
                                    onChange={({ target: { checked } }) =>
                                        withLoadingPhoneReset(handleChangePasswordPhoneToggle(+checked))
                                    }
                                />
                                <label htmlFor="passwordPhoneResetToggle" className="flex-item-fluid">
                                    {c('Label').t`Allow recovery by phone`}
                                </label>
                            </div>
                        </SettingsLayoutRight>
                    </SettingsLayout>
                </>
            )}
        </SettingsSection>
    );
};

export default AccountRecoverySection;
