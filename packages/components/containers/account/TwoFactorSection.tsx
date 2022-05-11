import { c } from 'ttag';
import { APPS } from '@proton/shared/lib/constants';
import { getHasTOTPSettingEnabled } from '@proton/shared/lib/settings/twoFactor';

import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { Info, Toggle, useModalState } from '../../components';
import { useConfig, useUserSettings } from '../../hooks';

import EnableTOTPModal from './EnableTOTPModal';
import DisableTOTPModal from './DisableTOTPModal';
import SettingsLayout from './SettingsLayout';
import SettingsLayoutLeft from './SettingsLayoutLeft';
import SettingsLayoutRight from './SettingsLayoutRight';

const TwoFactorSection = () => {
    const { APP_NAME } = useConfig();
    const [userSettings] = useUserSettings();
    const [enableTOTPModal, setEnableTOTPModalopen, renderEnableTOTPModal] = useModalState();
    const [disableTOTPModal, setDisableTOTPModalopen, renderDisableTOTPModal] = useModalState();

    const hasTOTPEnabled = getHasTOTPSettingEnabled(userSettings);

    const handleChange = () => {
        if (hasTOTPEnabled) {
            setDisableTOTPModalopen(true);
        } else {
            setEnableTOTPModalopen(true);
        }
    };

    const twoFactorAuthLink =
        APP_NAME === APPS.PROTONVPN_SETTINGS
            ? 'https://protonvpn.com/support/two-factor-authentication'
            : getKnowledgeBaseUrl('/two-factor-authentication-2fa');

    return (
        <>
            {renderEnableTOTPModal && <EnableTOTPModal {...enableTOTPModal} />}
            {renderDisableTOTPModal && <DisableTOTPModal {...disableTOTPModal} />}
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="twoFactorToggle" className="text-semibold">
                        <span className="mr0-5">{c('Label').t`Two-factor authentication`}</span>
                        <Info
                            url={twoFactorAuthLink}
                            title={c('Info')
                                .t`Two-factor authentication adds an extra layer of security to your account in case your password is compromised.`}
                        />
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight className="pt0-5">
                    <Toggle checked={hasTOTPEnabled} id="twoFactorToggle" onChange={handleChange} />
                </SettingsLayoutRight>
            </SettingsLayout>
        </>
    );
};

export default TwoFactorSection;
