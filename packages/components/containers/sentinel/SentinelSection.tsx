import { c } from 'ttag';

import { Href } from '@proton/atoms';
import { disableHighSecurity, enableHighSecurity } from '@proton/shared/lib/api/settings';
import { BRAND_NAME, PROTON_SENTINEL_NAME } from '@proton/shared/lib/constants';
import { getSupportContactURL } from '@proton/shared/lib/helpers/url';
import { SETTINGS_PROTON_SENTINEL_STATE } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import { Toggle } from '../../components';
import { useApi, useEventManager, useLoading, useUser, useUserSettings } from '../../hooks';
import { SettingsParagraph, SettingsSectionWide } from '../account';
import SettingsLayout from '../account/SettingsLayout';
import SettingsLayoutLeft from '../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../account/SettingsLayoutRight';

const SentinelSection = () => {
    const [settings] = useUserSettings();
    const [user] = useUser();
    const api = useApi();
    const [loadingSentinel, withLoadingSentinel] = useLoading();
    const protonSentinel = settings.HighSecurity.Value;
    const sentinelEligible = !!settings.HighSecurity.Eligible;
    const { call } = useEventManager();

    const handleHighSecurity = async (newHighSecurityState: Boolean) => {
        if (newHighSecurityState) {
            await api(enableHighSecurity());
        } else {
            await api(disableHighSecurity());
        }
        await call();
    };

    // translator: full sentence is: You will receive priority support from specialists trained in account protection. For any account security concerns, please <contact us>.
    const hereLink = (
        <Href href={getSupportContactURL(`topic=account_security&username=${user.Name}`)}>{c('Link')
            .t`contact us`}</Href>
    );

    return (
        <SettingsSectionWide>
            {sentinelEligible ? (
                <>
                    <SettingsParagraph large={true}>
                        <p className="mt-0">{c('Info')
                            .t`${PROTON_SENTINEL_NAME} is an account protection program developed at ${BRAND_NAME} for users who need maximum security.`}</p>
                        <p>{c('Info')
                            .t`${PROTON_SENTINEL_NAME} is powered by sophisticated AI systems and teams of specialists working 24/7 to mitigate bad actors and security threats.`}</p>
                        <p>{c('Info')
                            .t`Users with sensitive data and communications, such as journalists or executives, are highly encouraged to enable ${PROTON_SENTINEL_NAME}.`}</p>
                        <h3 className="text-bold text-rg">{c('Info').t`Once you enable ${PROTON_SENTINEL_NAME}:`}</h3>
                        <ol>
                            <li>{c('Info')
                                .t`You will see more details in the Security logs below for important events such as sign in attempts.`}</li>
                            <li>{c('Info')
                                .t`Suspicious events will be challenged by multiple layers of defense that help prevent attackers from hijacking your account.`}</li>
                            <li>
                                {
                                    // translator: full sentence is: You will receive priority support from specialists trained in account protection. For any account security concerns, please <contact us>.
                                    c('Info')
                                        .jt`You will receive priority support from specialists trained in account protection. For any account security concerns, please ${hereLink}.`
                                }
                            </li>
                        </ol>
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
