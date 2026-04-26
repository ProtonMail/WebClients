import { c } from 'ttag';

import { useUpdateAccountRecovery } from '@proton/account/recovery/useUpdateAccountRecovery';
import Loader from '@proton/components/components/loader/Loader';
import useMyCountry from '@proton/components/hooks/useMyCountry';

import RecoveryEmail from '../recovery/email/RecoveryEmail';
import RecoveryPhone from '../recovery/phone/RecoveryPhone';
import SettingsLayout from './SettingsLayout';
import SettingsLayoutLeft from './SettingsLayoutLeft';
import SettingsLayoutRight from './SettingsLayoutRight';

const NonPrivateRecoverySection = () => {
    const defaultCountry = useMyCountry();
    const accountRecovery = useUpdateAccountRecovery();

    if (accountRecovery.data.loading) {
        return <Loader />;
    }

    return (
        <>
            {accountRecovery.el}
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label className="pt-0 mb-2 md:mb-0 text-semibold" htmlFor="recovery-email-input">
                        {c('Label').t`Notification email address`}
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight>
                    <RecoveryEmail
                        className="mb-4 md:mb-0"
                        inputWidth="25rem"
                        {...accountRecovery.recoveryEmail.props}
                    />
                </SettingsLayoutRight>
            </SettingsLayout>

            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label className="pt-0 mb-2 md:mb-0 text-semibold" htmlFor="phoneInput">
                        {c('label').t`Notification phone number`}
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight>
                    <RecoveryPhone
                        className="mb-4 md:mb-0"
                        inputWidth="25rem"
                        defaultCountry={defaultCountry}
                        {...accountRecovery.recoveryPhone.props}
                    />
                </SettingsLayoutRight>
            </SettingsLayout>
        </>
    );
};

export default NonPrivateRecoverySection;
