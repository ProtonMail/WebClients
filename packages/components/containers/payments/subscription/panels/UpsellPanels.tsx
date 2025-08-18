import { c } from 'ttag';

import type { ButtonLikeShape } from '@proton/atoms';
import Time from '@proton/components/components/time/Time';
import { PLANS, PLAN_NAMES, type Subscription, hasBundle } from '@proton/payments';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import isTruthy from '@proton/utils/isTruthy';

import type { Upsell } from '../helpers';
import UpsellPanel from './UpsellPanel';
import UpsellPriceV1 from './components/UpsellPriceV1';

interface Props {
    upsells: Upsell[];
    subscription: Subscription;
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

    return (
        <>
            {upsells.map((upsell) => {
                const getDefaultCta = (upsell: Upsell) => {
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

                const defaultCta = upsell.ignoreDefaultCta ? null : getDefaultCta(upsell);
                const ctas = [defaultCta, ...upsell.otherCtas].filter(isTruthy);

                return (
                    <UpsellPanel
                        key={`upsell-${upsell.plan}`}
                        title={upsell.title}
                        features={upsell.features}
                        isRecommended={upsell.isRecommended}
                        ctas={ctas}
                        plan={upsell.plan}
                    >
                        {/* Warning when user is in Trial period for a plan */}
                        {upsell.isTrialEnding ? (
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
