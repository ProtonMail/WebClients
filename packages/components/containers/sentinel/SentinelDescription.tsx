import { c } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import { Href } from '@proton/atoms/Href/Href';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import { useBundleProPlan } from '@proton/components/hooks/useHasPlan';
import { PLANS, PLAN_NAMES, getPlanName } from '@proton/payments';
import { PROTON_SENTINEL_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import useFlag from '@proton/unleash/useFlag';

interface Props {
    variant: 'user' | 'organization';
    eligible: boolean;
}

const useUpgradableOptions = () => {
    const [subscription] = useSubscription();
    const bundleProPlan = useBundleProPlan();
    const currentPlan = getPlanName(subscription);
    const isNewB2BPlanEnabled = useFlag('NewProtonBusinessBundlePlans');

    const workspacePlans = isNewB2BPlanEnabled ? [bundleProPlan, PLANS.BUNDLE_BIZ_2025] : [bundleProPlan];

    const productSpecificB2bPlans = (() => {
        switch (currentPlan) {
            case PLANS.VPN_PRO:
                return [PLANS.VPN_BUSINESS];
            case PLANS.DRIVE_PRO:
                return [PLANS.DRIVE_BUSINESS];
            case PLANS.PASS_PRO:
                return [PLANS.PASS_BUSINESS];
            case PLANS.MAIL_PRO:
                // mail pro don't have product specific b2b plan
                return isNewB2BPlanEnabled ? [] : [PLANS.MAIL_BUSINESS];
            default:
                // show all available product specific b2b plans for users with free subscription
                return [PLANS.VPN_BUSINESS, PLANS.DRIVE_BUSINESS, PLANS.PASS_BUSINESS];
        }
    })();

    return productSpecificB2bPlans.concat(workspacePlans);
};

const SentinelDescription = ({ variant, eligible }: Props) => {
    const upgradeOptions = useUpgradableOptions();

    const planNames = upgradeOptions.map((plan) => PLAN_NAMES[plan]);
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
                        .t`${PROTON_SENTINEL_NAME} for organizations is an advanced account protection program powered by sophisticated AI systems and specialists working around the clock to protect your organization from bad actors and security threats.`}
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
                    {variant === 'user' &&
                        c('Info')
                            .t`Upgrade your plan to ${firstPlanNames} or ${lastPlanName} to get access to ${PROTON_SENTINEL_NAME}.`}

                    {variant === 'organization' &&
                        c('Info')
                            .t`Upgrade your plan to ${firstPlanNames} or ${lastPlanName} to get access to ${PROTON_SENTINEL_NAME} for organizations.`}
                </SettingsParagraph>
            )}

            <SettingsParagraph large>
                <Href href={getKnowledgeBaseUrl('/proton-sentinel')}>{c('Link').t`Learn more`}</Href>
            </SettingsParagraph>
        </>
    );
};

export default SentinelDescription;
