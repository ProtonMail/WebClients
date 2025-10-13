import { c } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import { Href } from '@proton/atoms';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import { useBundleProPlan } from '@proton/components/hooks/useHasPlan';
import { PLANS, PLAN_NAMES, getPlanName } from '@proton/payments';
import { PROTON_SENTINEL_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

interface Props {
    variant: 'user' | 'organization';
    eligible: boolean;
}

const B2B_PLANS_MAPPING: Partial<Record<PLANS, PLANS>> = {
    [PLANS.MAIL_PRO]: PLANS.MAIL_BUSINESS,
    [PLANS.VPN_PRO]: PLANS.VPN_BUSINESS,
    [PLANS.DRIVE_PRO]: PLANS.DRIVE_BUSINESS,
    [PLANS.PASS_PRO]: PLANS.PASS_BUSINESS,
};

const SentinelDescription = ({ variant, eligible }: Props) => {
    const [subscription] = useSubscription();
    const bundleProPlan = useBundleProPlan();

    const plans = (function getSentinelPlans(variant) {
        if (variant === 'user') {
            return [PLANS.PASS, PLANS.PASS_FAMILY, PLANS.BUNDLE, PLANS.FAMILY, bundleProPlan];
        }
        const currentPlan = getPlanName(subscription);
        const b2bPlan = currentPlan ? B2B_PLANS_MAPPING[currentPlan] : null;
        const b2bPlans = b2bPlan ? [b2bPlan] : Object.values(B2B_PLANS_MAPPING);

        return [...b2bPlans, bundleProPlan];
    })();

    const planNames = plans.map((plan) => PLAN_NAMES[plan]);
    const firstPlanNames = planNames.slice(0, -1).join(', ');
    const lastPlanName = planNames.at(-1);

    return (
        <>
            <SettingsParagraph large>
                {variant === 'user' &&
                    c('Info')
                        .t`${PROTON_SENTINEL_NAME} is an advanced account protection program powered by sophisticated AI systems and specialists working around the clock to protect you from bad actors and security threats.`}

                {variant === 'organization' &&
                    c('Info')
                        .t`${PROTON_SENTINEL_NAME} is an advanced account protection program powered by sophisticated AI systems and specialists working around the clock to protect your organization from bad actors and security threats.`}
            </SettingsParagraph>

            <SettingsParagraph large>
                {variant === 'user' &&
                    c('Info')
                        .t`Public figures, journalists, executives, and others who may be the target of cyber attacks are highly encouraged to enable ${PROTON_SENTINEL_NAME}.`}

                {variant === 'organization' &&
                    c('Info')
                        .t`If your organization has public figures, handles sensitive data, or may be targeted in cyber attacks, you are highly encouraged to enable ${PROTON_SENTINEL_NAME} for everyone in your organization.`}
            </SettingsParagraph>

            {!eligible && (
                <SettingsParagraph large>
                    {c('Info')
                        .t`Upgrade your plan to ${firstPlanNames} or ${lastPlanName} to get access to ${PROTON_SENTINEL_NAME}.`}
                </SettingsParagraph>
            )}

            <SettingsParagraph large>
                <Href href={getKnowledgeBaseUrl('/proton-sentinel')}>{c('Link').t`Learn more`}</Href>
            </SettingsParagraph>
        </>
    );
};

export default SentinelDescription;
