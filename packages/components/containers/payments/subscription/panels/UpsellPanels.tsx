import { c } from 'ttag';

import type { ButtonLikeShape } from '@proton/atoms/Button/ButtonLike';
import { PLANS, PLAN_NAMES } from '@proton/payments/core/constants';
import type { MaybeFreeSubscription } from '@proton/payments/core/subscription/helpers';
import { hasBundle } from '@proton/payments/core/subscription/helpers';
import { getTrialInfoForSingleSubscription } from '@proton/payments/core/trials';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import isTruthy from '@proton/utils/isTruthy';

import Time from '../../../../components/time/Time';
import { type Upsell, type UpsellWithPlan, isUpsellWithPlan } from '../helpers';
import UpsellPanel from './UpsellPanel';
import UpsellPriceV1 from './components/UpsellPriceV1';

interface Props {
    upsells: Upsell[];
    subscription: MaybeFreeSubscription;
}

const UpsellPanels = ({ upsells, subscription }: Props) => {
    const formattedPeriodEndDate = (
        <Time format="PPP" key="period-end" data-testid="period-end">
            {subscription?.PeriodEnd}
        </Time>
    );

    // Currently supporting trials for Mail Plus and Unlimited.
    // Add more branching logic here if you need to add another trial plan.
    const trialPlanName: string = hasBundle(subscription) ? PLAN_NAMES[PLANS.BUNDLE] : MAIL_APP_NAME;

    const trialInfo = getTrialInfoForSingleSubscription(subscription);

    return (
        <>
            {upsells.map((upsell) => {
                const getDefaultCta = (upsell: UpsellWithPlan) => {
                    const price = <UpsellPriceV1 key="offer-price" upsell={upsell} />;

                    let label: string | string[];
                    if (!price) {
                        label = c('new_plans: Action').t`Upgrade`;
                    } else {
                        label = c('new_plans: Action').jt`From ${price}`;
                    }

                    return {
                        shape: 'outline' as ButtonLikeShape,
                        action: upsell.onUpgrade,
                        label,
                        ...upsell.defaultCtaOverrides,
                    };
                };

                const defaultCta = isUpsellWithPlan(upsell) ? getDefaultCta(upsell) : null;
                const ctas = [defaultCta, ...upsell.otherCtas].filter(isTruthy);

                return (
                    <UpsellPanel
                        key={`upsell-${upsell.planKey}`}
                        title={upsell.title}
                        features={upsell.features}
                        isRecommended={upsell.isRecommended}
                        ctas={ctas}
                        plan={isUpsellWithPlan(upsell) ? upsell.plan : undefined}
                    >
                        {/* Warning when user is in Trial period for a plan but only for legacy referral */}
                        {isUpsellWithPlan(upsell) && upsell.isTrialEnding && !trialInfo.isReferralTrial ? (
                            <>
                                <h4>{c('new_plans: Info').jt`Your trial ends ${formattedPeriodEndDate}`}</h4>
                                <div className="color-weak">
                                    {c('new_plans: Info')
                                        .t`To continue to use ${trialPlanName} with premium features, choose your subscription and payment options.`}
                                    <br />
                                    <br />
                                    {c('new_plans: Info')
                                        .t`Otherwise access to your account will be limited, and your account will eventually be disabled.`}
                                </div>
                            </>
                        ) : (
                            <div className="color-weak text-lg">{upsell.description}</div>
                        )}
                    </UpsellPanel>
                );
            })}
        </>
    );
};

export default UpsellPanels;
