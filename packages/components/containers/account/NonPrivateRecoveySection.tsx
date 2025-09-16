import { c } from 'ttag';

import { useUserSettings } from '@proton/account/userSettings/hooks';
import Loader from '@proton/components/components/loader/Loader';
import useMyCountry from '@proton/components/hooks/useMyCountry';

import RecoveryEmail from '../recovery/email/RecoveryEmail';
import RecoveryPhone from '../recovery/phone/RecoveryPhone';
import SettingsLayout from './SettingsLayout';
import SettingsLayoutLeft from './SettingsLayoutLeft';
import SettingsLayoutRight from './SettingsLayoutRight';

const NonPrivateRecoverySection = () => {
    const defaultCountry = useMyCountry();
    const [userSettings, loadingUserSettings] = useUserSettings();

    if (loadingUserSettings || !userSettings) {
        return <Loader />;
    }

    return (
        <>
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
                        email={userSettings.Email}
                        hasReset={!!userSettings.Email.Reset}
                        hasNotify={!!userSettings.Email.Notify}
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
                        phone={userSettings.Phone}
                        hasReset={!!userSettings.Phone.Reset}
                    />
                </SettingsLayoutRight>
            </SettingsLayout>
        </>
    );
};

export default NonPrivateRecoverySection;
