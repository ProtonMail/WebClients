import { type FC, useMemo } from 'react';

import { c } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms';
import type { Props as PriceProps } from '@proton/components/components/price/Price';
import Price from '@proton/components/components/price/Price';
import { usePreferredPlansMap } from '@proton/components/hooks/usePreferredPlansMap';
import { COUPON_CODES, PLANS, PLAN_NAMES } from '@proton/payments';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import { hasPassLaunchOffer } from '@proton/shared/lib/helpers/subscription';

import OfferDisableButton from '../../components/shared/OfferDisableButton';
import OfferLoader from '../../components/shared/OfferLoader';
import hasOffer from '../../helpers/hasOffer';
import type { OfferLayoutProps } from '../../interface';
import img from './upsell_pass-family-plan.png';

import './Layout.scss';

const getPriceJSX = (price: number, props: Omit<PriceProps, 'children'>, key: string) => (
    <Price key={key} {...props} isDisplayedInSentence>
        {price}
    </Price>
);

const Layout: FC<OfferLayoutProps> = (props) => {
    const { offer, currency, onSelectDeal } = props;
    const [user] = useUser();
    const [subscription] = useSubscription();
    const { getPlansMap, plansMapLoading } = usePreferredPlansMap();

    const data = useMemo(() => {
        /** This offer can only be shown to `free` and `pass2023` users
         * - Cohort 1 : `pass2023` with `passlaunch` offer => PASSEARLYSUPPORTER (299)
         * - Cohort 2 : `pass2023` => PASSFAMILYLAUNCH (399)
         * - Cohort 3 : `free` => PASSFAMILYLAUNCH (399) */
        const isPassLaunch = hasPassLaunchOffer(subscription);
        const coupon = !user.isFree && isPassLaunch ? COUPON_CODES.PASSEARLYSUPPORTER : COUPON_CODES.PASSFAMILYLAUNCH;
        const userDeal = offer?.deals.find((deal) => deal.couponCode === coupon);
        const baseDeal = offer?.deals.find((deal) => deal.couponCode === COUPON_CODES.PASSFAMILYLAUNCH);

        if (userDeal && baseDeal) {
            const { plansMap } = getPlansMap({ paramCurrency: currency });
            const passPlusYearlyPrice = plansMap[PLANS.PASS]?.Pricing?.[userDeal.cycle];
            const earlySupporter = userDeal !== baseDeal;

            if (passPlusYearlyPrice) {
                const ref = user.isFree ? 'pass_family_free_399_webmodal' : userDeal.ref;

                const subtitle = earlySupporter
                    ? c('PassFamilyPlan2024').t`Exclusive offer available only to ${PASS_APP_NAME} early supporters.`
                    : c('PassFamilyPlan2024').t`Limited-time deal.`;

                const yearlyBasePrice = earlySupporter ? baseDeal.prices.withCoupon : null;
                const monthlyBasePrice = yearlyBasePrice ? yearlyBasePrice / userDeal.cycle : null;

                const yearlyPrice = userDeal.prices.withCoupon;
                const monthlyPrice = yearlyPrice / userDeal.cycle;
                const yearlySavedPrice = passPlusYearlyPrice * 6 - yearlyPrice;

                return {
                    deal: { ...userDeal, ref },
                    subtitle,
                    yearlyPrice: getPriceJSX(yearlyPrice, { currency }, 'yearly-price'),
                    yearlySavedPrice: getPriceJSX(yearlySavedPrice, { currency }, 'yearly-saved-price'),
                    monthlyPrice: getPriceJSX(
                        monthlyPrice,
                        { currency, suffix: c('Suffix').t`/month` },
                        'monthly-price'
                    ),
                    monthlyBasePrice: monthlyBasePrice
                        ? getPriceJSX(
                              monthlyBasePrice,
                              { currency, suffix: c('Suffix').t`/month`, className: 'text-strike' },
                              'monthly-base-price'
                          )
                        : null,
                };
            }
        }
    }, [subscription, user, offer, plansMapLoading]);

    if (!(hasOffer(props) && offer && data)) {
        return <OfferLoader />;
    }

    const { deal, monthlyPrice, monthlyBasePrice, subtitle, yearlyPrice, yearlySavedPrice } = data;
    const passFamilyPlanName = <strong key="plan-name">{PLAN_NAMES[PLANS.PASS_FAMILY]}</strong>;
    const passPlusPlanName = PLAN_NAMES[PLANS.PASS];

    return (
        props.offer && (
            <div className="flex flex-row flex-nowrap py-4">
                <div className="flex items-center flex-1 text-center lg:text-left">
                    <header className="flex flex-column gap-3">
                        <h1 className="block lh120">{c('PassFamilyPlan2024').jt`Introducing ${passFamilyPlanName}`}</h1>
                        <h4>{c('PassFamilyPlan2024').t`All premium features. 6 users. 1 easy subscription.`}</h4>

                        <div className="lg:inline-flex text-center offer-plan my-4">
                            <div>
                                <Button
                                    className="button button-promotion"
                                    size="large"
                                    type="button"
                                    onClick={() => onSelectDeal(offer, deal, currency)}
                                >
                                    <span className="flex flex-nowrap text-ellipsis gap-1">
                                        {c('PassFamilyPlan2024').jt`Get it for ${monthlyPrice}`}
                                    </span>
                                </Button>
                                {monthlyBasePrice && <div className="text-sm mt-1">{monthlyBasePrice}</div>}
                            </div>
                        </div>

                        <h4 className="block text-bold">{subtitle}</h4>
                        <span>
                            {c('PassFamilyPlan2024')
                                .jt`Billed yearly at ${yearlyPrice}. Save ${yearlySavedPrice} with ${passFamilyPlanName} (vs 6 individual ${passPlusPlanName} subscriptions).`}
                        </span>

                        <div className="w-full lg:w-auto offer-disable-button-container mt-4">
                            <OfferDisableButton {...props} />
                        </div>
                    </header>
                </div>
                <div className="offer-right-img-container flex-1 flex">
                    <img src={img} alt="" className="m-auto" />
                </div>
            </div>
        )
    );
};

export default Layout;
