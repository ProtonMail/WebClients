import { format, fromUnixTime } from 'date-fns';
import { c } from 'ttag';

import { ButtonLikeShape } from '@proton/atoms/Button';
import { Price } from '@proton/components/components';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { Subscription } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';

import { Upsell } from '../helpers';
import UpsellPanel from './UpsellPanel';

interface Props {
    upsells: Upsell[];
    subscription: Subscription;
}

const UpsellPanels = ({ upsells, subscription }: Props) => {
    const formattedPeriodEndDate = format(fromUnixTime(subscription?.PeriodEnd || 0), 'MMMM d, y');

    return (
        <>
            {upsells.map((upsell) => {
                const getPriceElement = (upsell: Upsell) => {
                    if (!upsell.price) {
                        return null;
                    }

                    const { value, currency } = upsell.price;

                    return (
                        <Price key="plan-price" currency={currency} suffix={c('new_plans: Plan frequency').t`/month`}>
                            {value}
                        </Price>
                    );
                };

                const getDefaultCta = (upsell: Upsell) => {
                    const price = getPriceElement(upsell);

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
                    >
                        {/* Warning when user is in Trial period for a plan */}
                        {upsell.isTrialEnding ? (
                            <>
                                <h4>{c('new_plans: Info').t`Your trial ends ${formattedPeriodEndDate}`}</h4>
                                <div className="color-weak">
                                    {c('new_plans: Info')
                                        .t`To continue to use ${MAIL_APP_NAME} with premium features, choose your subscription and payment options.`}
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
