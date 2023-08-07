import { c } from 'ttag';

import { useLoading } from '@proton/hooks';
import { disableHighSecurity, enableHighSecurity } from '@proton/shared/lib/api/settings';
import { PROTON_SENTINEL_NAME } from '@proton/shared/lib/constants';
import { SETTINGS_PROTON_SENTINEL_STATE } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import { Toggle } from '../../components';
import { useApi, useEventManager, useNotifications, useUserSettings } from '../../hooks';
import { SettingsParagraph, SettingsSectionWide } from '../account';
import SettingsLayout from '../account/SettingsLayout';
import SettingsLayoutLeft from '../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../account/SettingsLayoutRight';

const SentinelSection = () => {
    const [settings] = useUserSettings();
    const api = useApi();
    const [loadingSentinel, withLoadingSentinel] = useLoading();
    const protonSentinel = settings.HighSecurity.Value;
    const sentinelEligible =
        !!settings.HighSecurity.Eligible || settings.HighSecurity.Value === SETTINGS_PROTON_SENTINEL_STATE.ENABLED;
    const { call } = useEventManager();
    const { createNotification } = useNotifications();

    const handleHighSecurity = async (newHighSecurityState: Boolean) => {
        if (newHighSecurityState) {
            await api(enableHighSecurity());
            createNotification({ text: c('Notification').t`${PROTON_SENTINEL_NAME} has been enabled` });
        } else {
            await api(disableHighSecurity());
            createNotification({ text: c('Notification').t`${PROTON_SENTINEL_NAME} has been disabled` });
        }
        await call();
    };
    return (
        <SettingsSectionWide>
            {sentinelEligible ? (
                <>
                    <SettingsParagraph large={true}>
                        <p className="mt-0">{c('Info')
                            .t`${PROTON_SENTINEL_NAME} is an advanced account protection program powered by sophisticated AI systems and specialists working around the clock to protect you from bad actors and security threats.`}</p>
                        <p>{c('Info')
                            .t`Public figures, journalists, executives, and others who may be the target of cyber attacks are highly encouraged to enable ${PROTON_SENTINEL_NAME}.`}</p>
                    </SettingsParagraph>
                    <SettingsLayout>
                        <SettingsLayoutLeft>
                            <label className="text-semibold" htmlFor="high-security-toggle">
                                <span className="mr-2">{c('Log preference').t`Enable ${PROTON_SENTINEL_NAME}`}</span>
                            </label>
                        </SettingsLayoutLeft>
                        <SettingsLayoutRight className="pt-2">
                            <Toggle
                                id="high-security-toggle"
                                disabled={false}
                                loading={loadingSentinel}
                                checked={protonSentinel === SETTINGS_PROTON_SENTINEL_STATE.ENABLED}
                                onChange={({ target }) => {
                                    withLoadingSentinel(handleHighSecurity(target.checked)).catch(noop);
                                }}
                            />
                        </SettingsLayoutRight>
                    </SettingsLayout>
                </>
            ) : (
                <SettingsParagraph>
                    {c('Info').t`Upgrade to a paid account to enable ${PROTON_SENTINEL_NAME}.`}
                </SettingsParagraph>
            )}
        </SettingsSectionWide>
    );
};

export default SentinelSection;
