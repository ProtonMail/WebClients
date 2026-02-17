import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { type ModalProps, ModalTwo, ModalTwoContent, ModalTwoFooter } from '@proton/components';
import { getCalendarAppFeature } from '@proton/components/containers/payments/features/calendar';
import { getDriveAppFeature, getStorageFeature } from '@proton/components/containers/payments/features/drive';
import { getUsersFeature } from '@proton/components/containers/payments/features/highlights';
import { getMailAppFeature } from '@proton/components/containers/payments/features/mail';
import { getPassAppFeature } from '@proton/components/containers/payments/features/pass';
import { getShortPlan } from '@proton/components/containers/payments/features/plan';
import { getVPNAppFeature } from '@proton/components/containers/payments/features/vpn';
import { PlanCardFeatureList } from '@proton/components/containers/payments/subscription/PlanCardFeatures';
import { getNormalizedPlanTitles } from '@proton/components/containers/payments/subscription/plusToPlusHelper';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { type FreePlanDefault, PLANS, type Plan, type PlansMap, type SubscriptionPlan } from '@proton/payments';
import { getCheckoutUi } from '@proton/payments/core/checkout';
import type { VPNServersCountData } from '@proton/shared/lib/interfaces';

import type { SubscriptionData } from '../../signup/interfaces';
import svg from '../welcome-suite.svg';

interface Props extends Omit<ModalProps, 'title'> {
    dark: boolean;
    currentPlan: SubscriptionPlan | undefined;
    upsellPlan: Plan | undefined;
    unlockPlan: Plan | undefined;
    relativePrice: string | undefined;
    appName: string;
    plansMap: PlansMap;
    freePlan: FreePlanDefault;
    vpnServersCountData: VPNServersCountData;
    subscriptionData: SubscriptionData | undefined;
    onUpgrade: () => void;
    onFree: () => void;
}

const getFamilyFeatures = ({
    plan,
    freePlan,
    vpnServersCountData,
}: {
    plan: Plan;
    freePlan: FreePlanDefault;
    vpnServersCountData: VPNServersCountData;
}) => {
    return [
        getStorageFeature(plan.MaxSpace, {
            freePlan,
            family: plan.Name === PLANS.FAMILY,
            duo: plan.Name === PLANS.DUO,
        }),
        getUsersFeature(plan.MaxMembers),
        getMailAppFeature(),
        getCalendarAppFeature({ duo: true }),
        getDriveAppFeature({ duo: true }),
        getVPNAppFeature({
            duo: true,
            serversCount: vpnServersCountData,
        }),
        getPassAppFeature(),
    ];
};

const UpsellModal = ({
    dark,
    currentPlan,
    unlockPlan,
    upsellPlan,
    relativePrice,
    appName,
    subscriptionData,
    plansMap,
    freePlan,
    vpnServersCountData,
    onUpgrade,
    onFree,
    ...rest
}: Props) => {
    const { currentPlanTitle, upsellPlanTitle } = getNormalizedPlanTitles({
        currentPlan,
        unlockPlan,
        upsellPlan,
    });

    const shortPlan = upsellPlan
        ? getShortPlan(upsellPlan.Name as PLANS, plansMap, { vpnServers: vpnServersCountData, freePlan })
        : null;

    const { title, features } = (() => {
        const defaultFeatures = shortPlan?.features || [];
        if (upsellPlan?.Name === PLANS.PASS_FAMILY) {
            return {
                title: c('pass_signup_2023: Info').t`Secure your family’s passwords and online identities`,
                features: defaultFeatures,
            };
        }
        if (upsellPlan?.Name === PLANS.DUO) {
            return {
                title: c('pass_signup_2023: Info').t`Get unlimited privacy for two`,
                features: getFamilyFeatures({ plan: upsellPlan, freePlan, vpnServersCountData }),
            };
        }
        if (upsellPlan?.Name === PLANS.FAMILY) {
            return {
                title: c('pass_signup_2023: Info').t`Get online privacy, for your whole family`,
                features: getFamilyFeatures({ plan: upsellPlan, freePlan, vpnServersCountData }),
            };
        }
        return {
            title: '',
            features: defaultFeatures,
        };
    })();

    const checkout = subscriptionData
        ? getCheckoutUi({
              planIDs: subscriptionData.planIDs,
              plansMap,
              checkResult: subscriptionData.checkResult,
          })
        : undefined;

    return (
        <ModalTwo {...rest} size="small" disableCloseOnEscape={true}>
            <ModalTwoContent>
                <div className="text-center">
                    <img src={svg} alt="" className="mb-4 mt-4" />

                    {title && <div className="text-bold h3 mb-4">{title}</div>}
                    <div className="mb-2 color-weak">
                        {c('pass_signup_2023: Info')
                            .t`The offer you selected is not available for ${currentPlanTitle} subscribers.`}
                    </div>
                    {checkout && (
                        <div className="color-weak mb-4">
                            {(() => {
                                const discountPercentString = `${checkout.discountPercent}%`;
                                if (relativePrice) {
                                    if (checkout.discountPercent !== 0) {
                                        return getBoldFormattedText(
                                            c('pass_signup_2023: Info')
                                                .t`But you can get ${discountPercentString} off by upgrading to **${upsellPlanTitle}** — it’s just ${relativePrice} extra per month.`
                                        );
                                    } else {
                                        return getBoldFormattedText(
                                            c('pass_signup_2023: Info')
                                                .t`But you can upgrade to **${upsellPlanTitle}** — it’s just ${relativePrice} extra per month.`
                                        );
                                    }
                                }

                                if (checkout.discountPercent !== 0) {
                                    return getBoldFormattedText(
                                        c('pass_signup_2023: Info')
                                            .t`But you can get ${discountPercentString} off by upgrading to **${upsellPlanTitle}**.`
                                    );
                                } else {
                                    return getBoldFormattedText(
                                        c('pass_signup_2023: Info').t`But you can upgrade to **${upsellPlanTitle}**.`
                                    );
                                }
                            })()}
                        </div>
                    )}

                    {features && <PlanCardFeatureList icon={false} iconColor="color-success" features={features} />}
                </div>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button shape="ghost" color="norm" fullWidth onClick={onFree}>
                    {c('pass_signup_2023: Action').t`Continue to ${appName} without upgrading`}
                </Button>
                <Button color="norm" fullWidth className="mb-1" onClick={onUpgrade}>
                    {c('pass_signup_2023: Action').jt`Upgrade`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default UpsellModal;
