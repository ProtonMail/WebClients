import { c } from 'ttag';

import type { ButtonLikeShape } from '@proton/atoms/Button/ButtonLike';
import type { ThemeColorUnion } from '@proton/colors/types';
import Time from '@proton/components/components/time/Time';
import { type FreeSubscription, PLANS, PLAN_NAMES, type Subscription, hasBundle } from '@proton/payments';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import isTruthy from '@proton/utils/isTruthy';

import type { Upsell } from '../helpers';
import UpsellPanelV2 from './UpsellPanelV2';
import SaveLabel from './components/SaveLabel';
import UpsellPrice from './components/UpsellPrice';

const getDefaultCta = (upsell: Upsell) => {
    const label = c('new_plans: Action').t`Upgrade`;

    return {
        shape: 'outline' as ButtonLikeShape,
        color: 'norm' as ThemeColorUnion,
        action: upsell.onUpgrade,
        label,
        ...upsell.defaultCtaOverrides,
    };
};

interface Props {
    upsells: Upsell[];
    subscription?: Subscription | FreeSubscription;
}

const UpsellPanelsV2 = ({ upsells, subscription }: Props) => {
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
                const defaultCta = upsell.ignoreDefaultCta ? null : getDefaultCta(upsell);
                const ctas = [defaultCta, ...upsell.otherCtas].filter(isTruthy);

                if (!upsell.price) {
                    return null;
                }

                return (
                    <UpsellPanelV2
                        key={`upsell-${upsell.plan}-${upsell.customCycle}`}
                        title={upsell.title}
                        features={upsell.features}
                        isRecommended={upsell.isRecommended}
                        ctas={ctas}
                        plan={upsell.plan}
                        saveLabel={
                            <SaveLabel plan={upsell.plan} cycle={upsell.customCycle} currency={upsell.price.currency} />
                        }
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
                            <div className="">
                                {upsell.description}
                                <UpsellPrice upsell={upsell} />
                            </div>
                        )}
                    </UpsellPanelV2>
                );
            })}
        </>
    );
};

export default UpsellPanelsV2;
