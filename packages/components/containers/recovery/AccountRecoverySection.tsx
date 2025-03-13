import { c } from 'ttag';

import { useUserSettings } from '@proton/account/userSettings/hooks';
import Info from '@proton/components/components/link/Info';
import Loader from '@proton/components/components/loader/Loader';
import { useModalTwoPromise } from '@proton/components/components/modalTwo/useModalTwo';
import Toggle from '@proton/components/components/toggle/Toggle';
import SettingsLayout from '@proton/components/containers/account/SettingsLayout';
import SettingsLayoutLeft from '@proton/components/containers/account/SettingsLayoutLeft';
import SettingsLayoutRight from '@proton/components/containers/account/SettingsLayoutRight';
import SettingsSection from '@proton/components/containers/account/SettingsSection';
import AuthModal from '@proton/components/containers/password/AuthModal';
import type { AuthModalResult } from '@proton/components/containers/password/interface';
import useApi from '@proton/components/hooks/useApi';
import useEventManager from '@proton/components/hooks/useEventManager';
import useMyCountry from '@proton/components/hooks/useMyCountry';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoading } from '@proton/hooks';
import { updateResetEmail, updateResetPhone } from '@proton/shared/lib/api/settings';
import { updateFlags } from '@proton/shared/lib/api/settings';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import noop from '@proton/utils/noop';

import RecoveryEmail from './email/RecoveryEmail';
import RecoveryPhone from './phone/RecoveryPhone';

export const AccountRecoverySection = ({ divider = true }: { divider?: boolean }) => {
    const [userSettings, loadingUserSettings] = useUserSettings();
    const [loadingEmailReset, withLoadingEmailReset] = useLoading();
    const [loadingPhoneReset, withLoadingPhoneReset] = useLoading();
    const [loadingEDM, withLoadingEDM] = useLoading();
    const { createNotification } = useNotifications();
    const { call } = useEventManager();
    const defaultCountry = useMyCountry();
    const [authModal, showAuthModal] = useModalTwoPromise<{ config: any }, AuthModalResult>();
    const api = useApi();

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
        await call();
    };

    const handleChangePasswordPhoneToggle = async (value: number) => {
        if (value && !userSettings.Phone.Value) {
            return createNotification({ type: 'error', text: c('Error').t`Please set a recovery phone number first` });
        }
        await showAuthModal({ config: updateResetPhone({ Reset: value }) });
        await call();
    };

    const handleEDMToggle = async (value: number) => {
        await api(updateFlags({ EdmOptOut: value }));
        await call();
        createNotification({
            type: 'info',
            text: value ? c('Info').t`QR code sign-in disabled` : c('Info').t`QR code sign-in enabled`,
        });
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
                <SettingsLayout>
                    <SettingsLayoutLeft>
                        <label className="text-semibold">
                            <span className="mr-2">{c('Label').t`Sign in with QR code`}</span>
                        </label>
                    </SettingsLayoutLeft>
                    <SettingsLayoutRight isToggleContainer>
                        <div className="flex items-center gap-2">
                            <Toggle
                                loading={loadingEDM}
                                checked={!userSettings?.Flags.EdmOptOut}
                                id="edmToggle"
                                onChange={({ target: { checked } }) =>
                                    withLoadingEDM(handleEDMToggle(+!checked).catch(noop))
                                }
                            />
                            <label htmlFor="edmToggle" className="flex-1">
                                {c('Label').t`Allow scanning a QR code to sign in`}
                                <Info
                                    url={getKnowledgeBaseUrl('/')}
                                    title={c('Info').t`Scan QR code on your mobile device to sign in`}
                                    className="ml-1"
                                />
                            </label>
                        </div>
                    </SettingsLayoutRight>
                </SettingsLayout>

                <hr className="my-8" />

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
                                    withLoadingPhoneReset(handleChangePasswordPhoneToggle(+checked).catch(noop))
                                }
                            />
                            <label htmlFor="passwordPhoneResetToggle" className="flex-1">
                                {c('Label').t`Allow recovery by phone`}
                            </label>
                        </div>
                    </SettingsLayoutRight>
                </SettingsLayout>
            </SettingsSection>
        </>
    );
};
