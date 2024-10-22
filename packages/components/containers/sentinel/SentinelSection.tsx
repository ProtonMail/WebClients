import { useRef } from 'react';

import { c } from 'ttag';

import { Href } from '@proton/atoms';
import { PromotionButton } from '@proton/components/components/button/PromotionButton';
import Toggle from '@proton/components/components/toggle/Toggle';
import SettingsLayout from '@proton/components/containers/account/SettingsLayout';
import SettingsLayoutLeft from '@proton/components/containers/account/SettingsLayoutLeft';
import SettingsLayoutRight from '@proton/components/containers/account/SettingsLayoutRight';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import { useSubscriptionModal } from '@proton/components/containers/payments/subscription/SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import useApi from '@proton/components/hooks/useApi';
import useConfig from '@proton/components/hooks/useConfig';
import useEventManager from '@proton/components/hooks/useEventManager';
import { useBundleProPlan } from '@proton/components/hooks/useHasPlan';
import { useLoading } from '@proton/hooks';
import { PLANS, PLAN_NAMES } from '@proton/payments';
import { disableHighSecurity, enableHighSecurity } from '@proton/shared/lib/api/settings';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { PROTON_SENTINEL_NAME, SHARED_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRefFromApp } from '@proton/shared/lib/helpers/upsell';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { isProtonSentinelEligible } from '@proton/shared/lib/helpers/userSettings';
import { SETTINGS_PROTON_SENTINEL_STATE } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import { useNotifications, useSearchParamsEffect, useUserSettings } from '../../hooks';
import { getDisabledString, getEnableString, getEnabledString } from '../credentialLeak/helpers';

interface Props {
    app: APP_NAMES;
}

export const SentinelSection = ({ app }: Props) => {
    const { APP_NAME } = useConfig();
    const [userSettings] = useUserSettings();
    const [openSubscriptionModal, loadingSubscriptionModal] = useSubscriptionModal();
    const api = useApi();
    const [loadingSentinel, withLoadingSentinel] = useLoading();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const bundleProPlan = useBundleProPlan();

    const sentinelToggleRef = useRef<HTMLInputElement | null>(null);

    const protonSentinel = userSettings.HighSecurity.Value;
    const sentinelEligible = isProtonSentinelEligible(userSettings);

    useSearchParamsEffect(
        (params) => {
            if (!sentinelToggleRef.current) {
                return;
            }

            const enableSentinelParam = params.get('enable-sentinel');
            params.delete('enable-sentinel');
            if (!enableSentinelParam) {
                return params;
            }

            if (protonSentinel === SETTINGS_PROTON_SENTINEL_STATE.ENABLED) {
                return params;
            }

            sentinelToggleRef.current.click();

            return params;
        },
        [sentinelToggleRef.current]
    );

    const handleHighSecurity = async (newHighSecurityState: Boolean) => {
        if (newHighSecurityState) {
            await api(enableHighSecurity());
            createNotification({ text: getEnabledString(PROTON_SENTINEL_NAME) });
        } else {
            await api(disableHighSecurity());
            createNotification({ text: getDisabledString(PROTON_SENTINEL_NAME) });
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
        openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.PLAN_SELECTION,
            metrics: {
                source: 'upsells',
            },
            mode: 'upsell-modal',
            upsellRef,
        });
    };

    const getUpgradeMessage = () => {
        const plans = [PLANS.PASS, PLANS.PASS_FAMILY, PLANS.BUNDLE, PLANS.FAMILY, bundleProPlan];
        const planNames = plans.map((plan) => PLAN_NAMES[plan]);
        const firstPlanNames = planNames.slice(0, -1).join(', ');
        const lastPlanName = planNames.at(-1);
        return (
            <>
                {/* translator: full sentence with pass plus: "Upgrade to Pass Plus, Pass Family, Proton Unlimited, Proton Family, or Business plan to get access to Proton Sentinel." */}
                {c('Info')
                    .t`Upgrade to ${firstPlanNames}, or ${lastPlanName} plan to get access to ${PROTON_SENTINEL_NAME}.`}
            </>
        );
    };

    return (
        <SettingsSectionWide>
            <SettingsParagraph large>
                {c('Info')
                    .t`${PROTON_SENTINEL_NAME} is an advanced account protection program powered by sophisticated AI systems and specialists working around the clock to protect you from bad actors and security threats.`}
            </SettingsParagraph>
            <SettingsParagraph large>
                {c('Info')
                    .t`Public figures, journalists, executives, and others who may be the target of cyber attacks are highly encouraged to enable ${PROTON_SENTINEL_NAME}.`}{' '}
            </SettingsParagraph>
            {!sentinelEligible && <SettingsParagraph large>{getUpgradeMessage()}</SettingsParagraph>}
            <SettingsParagraph large>
                <Href href={getKnowledgeBaseUrl('/proton-sentinel')}>{c('Link').t`Learn more`}</Href>
            </SettingsParagraph>

            {sentinelEligible ? (
                <>
                    <SettingsLayout>
                        <SettingsLayoutLeft>
                            <label className="text-semibold" htmlFor="high-security-toggle">
                                <span className="mr-2">{getEnableString(PROTON_SENTINEL_NAME)}</span>
                            </label>
                        </SettingsLayoutLeft>
                        <SettingsLayoutRight isToggleContainer>
                            <Toggle
                                ref={sentinelToggleRef}
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
                    <PromotionButton
                        iconName="upgrade"
                        iconGradient={true}
                        onClick={handleUpgrade}
                        disabled={loadingSubscriptionModal}
                    >
                        {/* translator: full sentence: "Upgrade to enable Proton Sentinel." */}
                        {c('Action').t`Upgrade to enable ${PROTON_SENTINEL_NAME}`}
                    </PromotionButton>
                </SettingsParagraph>
            )}
        </SettingsSectionWide>
    );
};
