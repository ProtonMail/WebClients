import { format, fromUnixTime } from 'date-fns';
import { c } from 'ttag';

import { Price } from '@proton/components/components';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { Subscription } from '@proton/shared/lib/interfaces';

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
                const { value, currency } = upsell.price;
                const price = (
                    <Price key="plan-price" currency={currency} suffix={c('new_plans: Plan frequency').t`/month`}>
                        {value}
                    </Price>
                );

                return (
                    <UpsellPanel
                        key={`upsell-${upsell.plan}`}
                        title={upsell.title}
                        features={upsell.features}
                        isRecommended={upsell.isRecommended}
                        ctas={[
                            {
                                shape: 'outline',
                                action: upsell.onUpgrade,
                                label: c('new_plans: Action').jt`From ${price}`,
                            },
                            ...upsell.otherCtas,
                        ]}
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
