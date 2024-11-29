import { c } from 'ttag';

import { usePlans } from '@proton/account/plans/hooks';
import { useUser } from '@proton/account/user/hooks';
import Price from '@proton/components/components/price/Price';
import { type Currency, PLANS } from '@proton/payments';
import { COUPON_CODES, CYCLE, MAIL_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import { useNewUpsellModalVariant } from '@proton/shared/lib/helpers/upsell';

const useOneDollarConfig = () => {
    const [user] = useUser();
    const currency: Currency = user?.Currency || 'USD';
    const displayNewUpsellModalsVariant = useNewUpsellModalVariant();

    const [plansResult] = usePlans();
    const mailPlus = plansResult?.plans.find(({ Name }) => Name === PLANS.MAIL);

    const amount = mailPlus?.DefaultPricing?.[CYCLE.MONTHLY] || 0;

    const priceMailPlus = (
        <Price
            key="monthly-price"
            currency={currency}
            suffix={c('specialoffer: Offers').t`/month`}
            isDisplayedInSentence
        >
            {amount}
        </Price>
    );

    const priceCoupon = (
        <Price currency={currency} key="monthlyAmount">
            1
        </Price>
    );

    if (displayNewUpsellModalsVariant) {
        return {
            submitText: c('Action').jt`Get ${MAIL_SHORT_APP_NAME} Plus for ${priceCoupon}`,
            footerText: c('new_plans: Title')
                .jt`The discounted price of ${priceCoupon} is valid for the first month. Then it will automatically be renewed at ${priceMailPlus}. You can cancel at any time.`,
            cycle: CYCLE.MONTHLY,
            coupon: COUPON_CODES.TRYMAILPLUS0724,
        };
    }

    return {
        submitText: c('new_plans: Action').jt`Get started for ${priceCoupon}`,
        title: c('new_plans: Title').jt`Get Mail Plus for ${priceCoupon}`,
        cycle: CYCLE.MONTHLY,
        coupon: COUPON_CODES.TRYMAILPLUS0724,
    };
};

export default useOneDollarConfig;
