import { c } from 'ttag';

import { PromotionButton } from '@proton/components/components/button/PromotionButton';
import { useLoading } from '@proton/hooks';
import { disableHighSecurity, enableHighSecurity } from '@proton/shared/lib/api/settings';
import {
    APP_NAMES,
    PLANS,
    PLAN_NAMES,
    PROTON_SENTINEL_NAME,
    SHARED_UPSELL_PATHS,
    UPSELL_COMPONENT,
} from '@proton/shared/lib/constants';
import { getUpsellRefFromApp } from '@proton/shared/lib/helpers/upsell';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { isProtonSentinelEligible } from '@proton/shared/lib/helpers/userSettings';
import { SETTINGS_PROTON_SENTINEL_STATE } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import { Toggle, useSettingsLink } from '../../components';
import { useApi, useConfig, useEventManager, useNotifications, useUserSettings } from '../../hooks';
import { SettingsParagraph, SettingsSectionWide } from '../account';
import SettingsLayout from '../account/SettingsLayout';
import SettingsLayoutLeft from '../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../account/SettingsLayoutRight';
import { useFlag } from '../unleash';

interface Props {
    app: APP_NAMES;
}

const SentinelSection = ({ app }: Props) => {
    const { APP_NAME } = useConfig();
    const goToSettings = useSettingsLink();
    const [userSettings] = useUserSettings();
    const api = useApi();
    const [loadingSentinel, withLoadingSentinel] = useLoading();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();

    const protonSentinel = userSettings.HighSecurity.Value;
    const sentinelEligible = isProtonSentinelEligible(userSettings);
    const sentinelPassplusEnabled = !!useFlag('SentinelPassPlus');

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

    const handleUpgrade = () => {
        const upsellRef = getUpsellRefFromApp({
            app: APP_NAME,
            feature: SHARED_UPSELL_PATHS.SENTINEL,
            component: UPSELL_COMPONENT.BUTTON,
            fromApp: app,
        });
        goToSettings(`/upgrade?ref=${upsellRef}`, undefined, false);
    };

    const getUpgradeMessage = () => {
        if (sentinelPassplusEnabled) {
            return (
                <>
                    {/* translator: full sentence with pass plus: "Upgrade to Pass Plus, Proton Unlimited, Proton Family, or Business plan to get access to Proton Sentinel." */}
                    {c('Info').t`Upgrade to ${PLAN_NAMES[PLANS.PASS_PLUS]}, ${PLAN_NAMES[PLANS.BUNDLE]}, ${
                        PLAN_NAMES[PLANS.FAMILY]
                    }, or ${PLAN_NAMES[PLANS.BUNDLE_PRO]} plan to get access to ${PROTON_SENTINEL_NAME}.`}
                    ;
                </>
            );
        }
        return (
            <>
                {/* translator: full sentence: "Upgrade to Proton Unlimited, Proton Family, or Business plan to get access to Proton Sentinel." */}
                {c('Info').t`Upgrade to ${PLAN_NAMES[PLANS.BUNDLE]}, ${PLAN_NAMES[PLANS.FAMILY]}, or ${
                    PLAN_NAMES[PLANS.BUNDLE_PRO]
                } plan to get access to ${PROTON_SENTINEL_NAME}.`}
                ;
            </>
        );
    };

    return (
        <SettingsSectionWide>
            <SettingsParagraph large={true} learnMoreUrl={getKnowledgeBaseUrl('/proton-sentinel')}>
                <p className="mt-0">{c('Info')
                    .t`${PROTON_SENTINEL_NAME} is an advanced account protection program powered by sophisticated AI systems and specialists working around the clock to protect you from bad actors and security threats.`}</p>
                <p className="mb-0">{c('Info')
                    .t`Public figures, journalists, executives, and others who may be the target of cyber attacks are highly encouraged to enable ${PROTON_SENTINEL_NAME}.`}</p>
                {!sentinelEligible && <p className="mb-0">{getUpgradeMessage()}</p>}
            </SettingsParagraph>

            {sentinelEligible ? (
                <>
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
                    <PromotionButton iconName="upgrade" iconGradient={true} onClick={handleUpgrade}>
                        {/* translator: full sentence: "Upgrade to enable Proton Sentinel." */}
                        {c('Action').t`Upgrade to enable ${PROTON_SENTINEL_NAME}`}
                    </PromotionButton>
                </SettingsParagraph>
            )}
        </SettingsSectionWide>
    );
};

export default SentinelSection;
