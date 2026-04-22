import { c } from 'ttag';

import { useUpdateAccountRecovery } from '@proton/account/recovery/useUpdateAccountRecovery';
import Loader from '@proton/components/components/loader/Loader';
import Toggle from '@proton/components/components/toggle/Toggle';
import SettingsDivider from '@proton/components/containers/account/SettingsDivider';
import SettingsLayout from '@proton/components/containers/account/SettingsLayout';
import SettingsLayoutLeft from '@proton/components/containers/account/SettingsLayoutLeft';
import SettingsLayoutRight from '@proton/components/containers/account/SettingsLayoutRight';
import SettingsSection from '@proton/components/containers/account/SettingsSection';
import useMyCountry from '@proton/components/hooks/useMyCountry';

import SignInWithAnotherDeviceSettings from './SignInWithAnotherDeviceSettings';
import RecoveryEmail from './email/RecoveryEmail';
import RecoveryPhone from './phone/RecoveryPhone';

export const AccountRecoverySection = ({ divider = true }: { divider?: boolean }) => {
    const defaultCountry = useMyCountry();
    const accountRecovery = useUpdateAccountRecovery();

    if (accountRecovery.data.loading) {
        return <Loader />;
    }

    return (
        <>
            {accountRecovery.el}
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
                            <RecoveryEmail className="mb-4 md:mb-0" {...accountRecovery.recoveryEmail.props} />
                            <div className="flex items-center">
                                <Toggle
                                    className="mr-2"
                                    id="passwordEmailResetToggle"
                                    {...accountRecovery.recoveryEmail.toggleProps}
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
                                {...accountRecovery.recoveryPhone.props}
                            />
                            <div className="flex items-center">
                                <Toggle
                                    className="mr-2"
                                    id="passwordPhoneResetToggle"
                                    {...accountRecovery.recoveryPhone.toggleProps}
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
