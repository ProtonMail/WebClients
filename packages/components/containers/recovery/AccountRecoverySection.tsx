import { c } from 'ttag';

import { useLoading } from '@proton/hooks';
import { updateResetEmail, updateResetPhone } from '@proton/shared/lib/api/settings';

import { Loader, Toggle } from '../../components';
import { useEventManager, useModals, useMyCountry, useNotifications, useUserSettings } from '../../hooks';
import { SettingsSection } from '../account';
import SettingsLayout from '../account/SettingsLayout';
import SettingsLayoutLeft from '../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../account/SettingsLayoutRight';
import AuthModal from '../password/AuthModal';
import RecoveryEmail from './email/RecoveryEmail';
import RecoveryPhone from './phone/RecoveryPhone';

export const AccountRecoverySection = ({ divider = true }: { divider?: boolean }) => {
    const { createModal } = useModals();
    const [userSettings, loadingUserSettings] = useUserSettings();
    const [loadingEmailReset, withLoadingEmailReset] = useLoading();
    const [loadingPhoneReset, withLoadingPhoneReset] = useLoading();
    const { createNotification } = useNotifications();
    const { call } = useEventManager();
    const [defaultCountry, loadingCountry] = useMyCountry();

    if (loadingUserSettings || !userSettings || loadingCountry) {
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
            createModal(
                <AuthModal onCancel={reject} onSuccess={resolve} config={updateResetEmail({ Reset: value })} />
            );
        });
        await call();
    };

    const handleChangePasswordPhoneToggle = async (value: number) => {
        if (value && !userSettings.Phone.Value) {
            return createNotification({ type: 'error', text: c('Error').t`Please set a recovery phone number first` });
        }
        await new Promise((resolve, reject) => {
            createModal(
                <AuthModal onCancel={reject} onSuccess={resolve} config={updateResetPhone({ Reset: value })} />
            );
        });
        await call();
    };

    return (
        <SettingsSection>
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label className="pt-0 mb-2 md:mb-0 text-semibold" htmlFor="recovery-email-input">
                        {c('Label').t`Recovery email address`}
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight className="flex-1">
                    <RecoveryEmail
                        className="mb-4 md:mb-0"
                        email={userSettings.Email}
                        hasReset={!!userSettings.Email.Reset}
                        hasNotify={!!userSettings.Email.Notify}
                    />
                    <div className="flex items-center">
                        <Toggle
                            className="mr-2"
                            loading={loadingEmailReset}
                            checked={!!userSettings.Email.Reset && !!userSettings.Email.Value}
                            id="passwordEmailResetToggle"
                            onChange={({ target: { checked } }) =>
                                withLoadingEmailReset(handleChangePasswordEmailToggle(+checked))
                            }
                        />
                        <label htmlFor="passwordEmailResetToggle" className="flex-1">
                            {c('Label').t`Allow recovery by email`}
                        </label>
                    </div>
                </SettingsLayoutRight>
            </SettingsLayout>

            {divider && <hr className="my-8" />}

            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label className="pt-0 mb-2 md:mb-0 text-semibold" htmlFor="phoneInput">
                        {c('label').t`Recovery phone number`}
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight className="flex-1">
                    <RecoveryPhone
                        className="mb-4 md:mb-0"
                        defaultCountry={defaultCountry}
                        phone={userSettings.Phone}
                        hasReset={!!userSettings.Phone.Reset}
                    />
                    <div className="flex items-center">
                        <Toggle
                            className="mr-2"
                            loading={loadingPhoneReset}
                            checked={!!userSettings.Phone.Reset && !!userSettings.Phone.Value}
                            id="passwordPhoneResetToggle"
                            onChange={({ target: { checked } }) =>
                                withLoadingPhoneReset(handleChangePasswordPhoneToggle(+checked))
                            }
                        />
                        <label htmlFor="passwordPhoneResetToggle" className="flex-1">
                            {c('Label').t`Allow recovery by phone`}
                        </label>
                    </div>
                </SettingsLayoutRight>
            </SettingsLayout>
        </SettingsSection>
    );
};
