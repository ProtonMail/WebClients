import { c } from 'ttag';

import { userSettingsThunk } from '@proton/account/userSettings';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import Loader from '@proton/components/components/loader/Loader';
import { useModalTwoPromise } from '@proton/components/components/modalTwo/useModalTwo';
import Toggle from '@proton/components/components/toggle/Toggle';
import SettingsDivider from '@proton/components/containers/account/SettingsDivider';
import SettingsLayout from '@proton/components/containers/account/SettingsLayout';
import SettingsLayoutLeft from '@proton/components/containers/account/SettingsLayoutLeft';
import SettingsLayoutRight from '@proton/components/containers/account/SettingsLayoutRight';
import SettingsSection from '@proton/components/containers/account/SettingsSection';
import AuthModal from '@proton/components/containers/password/AuthModal';
import type { AuthModalResult } from '@proton/components/containers/password/interface';
import useMyCountry from '@proton/components/hooks/useMyCountry';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoading } from '@proton/hooks';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { CacheType } from '@proton/redux-utilities';
import { updateResetEmail, updateResetPhone } from '@proton/shared/lib/api/settings';
import noop from '@proton/utils/noop';

import SignInWithAnotherDeviceSettings from './SignInWithAnotherDeviceSettings';
import RecoveryEmail from './email/RecoveryEmail';
import RecoveryPhone from './phone/RecoveryPhone';

export const AccountRecoverySection = ({ divider = true }: { divider?: boolean }) => {
    const [userSettings, loadingUserSettings] = useUserSettings();
    const dispatch = useDispatch();
    const [loadingEmailReset, withLoadingEmailReset] = useLoading();
    const [loadingPhoneReset, withLoadingPhoneReset] = useLoading();
    const { createNotification } = useNotifications();
    const defaultCountry = useMyCountry();
    const [authModal, showAuthModal] = useModalTwoPromise<{ config: any }, AuthModalResult>();

    if (loadingUserSettings || !userSettings) {
        return <Loader />;
    }

    const handleChangePasswordEmailToggle = async (value: number) => {
        if (value && !userSettings.Email.Value) {
            return createNotification({
                type: 'error',
                text: c('Error').t`Please set a recovery email first`,
            });
        }
        await showAuthModal({ config: updateResetEmail({ Reset: value }) });
        await dispatch(userSettingsThunk({ cache: CacheType.None }));
    };

    const handleChangePasswordPhoneToggle = async (value: number) => {
        if (value && !userSettings.Phone.Value) {
            return createNotification({ type: 'error', text: c('Error').t`Please set a recovery phone number first` });
        }
        await showAuthModal({ config: updateResetPhone({ Reset: value }) });
        await dispatch(userSettingsThunk({ cache: CacheType.None }));
    };

    return (
        <>
            {authModal((props) => {
                return (
                    <AuthModal
                        {...props}
                        scope="password"
                        config={props.config}
                        onCancel={props.onReject}
                        onSuccess={props.onResolve}
                    />
                );
            })}
            <SettingsSection>
                <SettingsDivider enabled={divider}>
                    <SignInWithAnotherDeviceSettings />

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
                                        withLoadingEmailReset(handleChangePasswordEmailToggle(+checked).catch(noop))
                                    }
                                />
                                <label htmlFor="passwordEmailResetToggle" className="flex-1">
                                    {c('Label').t`Allow recovery by email`}
                                </label>
                            </div>
                        </SettingsLayoutRight>
                    </SettingsLayout>

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
                                        withLoadingPhoneReset(handleChangePasswordPhoneToggle(+checked).catch(noop))
                                    }
                                />
                                <label htmlFor="passwordPhoneResetToggle" className="flex-1">
                                    {c('Label').t`Allow recovery by phone`}
                                </label>
                            </div>
                        </SettingsLayoutRight>
                    </SettingsLayout>
                </SettingsDivider>
            </SettingsSection>
        </>
    );
};
