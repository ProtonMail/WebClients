import type { ReactNode } from 'react';

import { c } from 'ttag';

import { getSimplePriceString } from '@proton/components/components/price/helper';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { Icon, SkeletonLoader } from '@proton/components/index';
import type { IconName } from '@proton/icons/types';
import type { PaymentsCheckoutUI } from '@proton/payments/core/checkout';
import { getCheckoutUi } from '@proton/payments/core/checkout';
import type { PlanIDs, StrictPlan, SubscriptionEstimation } from '@proton/payments/index';
import { Audience, COUPON_CODES, CYCLE, PLANS, PLAN_NAMES, getHas2025OfferCoupon } from '@proton/payments/index';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS, BRAND_NAME, PASS_APP_NAME } from '@proton/shared/lib/constants';

import DiscountBanner from '../DiscountBanner';
import type { OptimisticOptions, SignupModelV2, SignupParameters2 } from '../interface';
import { SignupMode, UpsellTypes } from '../interface';

interface Step1OfferBannerProps {
    isPorkbunPayment: boolean;
    model: SignupModelV2;
    signupParameters: SignupParameters2;
    selectedPlan: StrictPlan;
    mode: SignupMode;
    planIDs: PlanIDs;
    checkResult: SubscriptionEstimation;
    options: OptimisticOptions;
    app: APP_NAMES;
    hasPlanSelector: boolean;
    audience: Audience;
    isSignupTrial: boolean;
    checkout: PaymentsCheckoutUI;
}

export const Step1OfferBanner = ({
    isPorkbunPayment,
    model,
    signupParameters,
    selectedPlan,
    mode,
    planIDs,
    checkResult,
    options,
    app,
    hasPlanSelector,
    audience,
    isSignupTrial,
    checkout,
}: Step1OfferBannerProps): ReactNode => {
    if (isPorkbunPayment) {
        // Early exit for Porkbun, Porkbun has its own offer banner.
        // Do not remove this, do not move this down
        return null;
    }

    if (model.loadingDependencies) {
        return <SkeletonLoader width="36em" height="2.4rem" index={0} className="mt-4 max-w-full" />;
    }

    const wrap = (iconName: IconName | null, textLaunchOffer: ReactNode) => {
        return (
            <div className="signup-v2-offer-banner py-2 px-4 rounded-lg md:text-lg inline-flex flex-nowrap mt-4">
                {iconName && <Icon name={iconName} size={3.5} className="shrink-0 mt-1" />}
                <span className="ml-2 flex-1">{textLaunchOffer}</span>
            </div>
        );
    };

    if (signupParameters.mode === SignupMode.PassSimpleLogin) {
        return (
            <div className="text-center text-lg mt-2 max-w-custom" style={{ '--max-w-custom': '40rem' }}>
                {c('Info')
                    .t`${PASS_APP_NAME} is the next generation password manager designed for ease of use and productivity. Open source, co-developed by SimpleLogin and ${BRAND_NAME}.`}
            </div>
        );
    }

    if (signupParameters.invite?.type === 'pass') {
        const inviterEmailJSX = <strong key="invite">{signupParameters.invite.data.inviter}</strong>;
        return wrap(
            'user',
            <>
                <span className="block">
                    {c('Info').jt`${inviterEmailJSX} wants to share data with you in ${PASS_APP_NAME}`}
                </span>
                {c('Info').t`Get access by creating a ${BRAND_NAME} account and accepting the invitation.`}
            </>
        );
    }

    if (
        selectedPlan.Name === PLANS.VISIONARY &&
        model.upsell.mode !== UpsellTypes.UPSELL &&
        mode !== SignupMode.Invite
    ) {
        if (app === APPS.PROTONWALLET) {
            return null;
        }

        const plan = `${BRAND_NAME} ${PLAN_NAMES[PLANS.VISIONARY]}`;
        const text = getBoldFormattedText(c('mail_signup_2023: Info').t`**Get ${plan}** for a limited time!`);
        return wrap('hourglass', text);
    }

    const mailOfferPlans = [PLANS.BUNDLE_PRO_2024, PLANS.MAIL_BUSINESS, PLANS.MAIL_PRO];

    const businessYearlyCycle = model.subscriptionDataCycleMapping[selectedPlan.Name as PLANS]?.[CYCLE.YEARLY];
    if (mailOfferPlans.includes(selectedPlan.Name as PLANS) && !!businessYearlyCycle?.checkResult.Coupon?.Code) {
        const textLaunchOffer = getBoldFormattedText(
            c('mail_signup_2024: Info').t`Limited time offer: **Get up to 35% off** yearly plans`
        );
        return wrap('hourglass', textLaunchOffer);
    }

    const hasBFCoupon =
        getHas2025OfferCoupon(options.checkResult.Coupon?.Code) || getHas2025OfferCoupon(signupParameters.coupon);

    // Using real coupon to show the correct discount percentage
    if (hasBFCoupon) {
        // prevent blinking while loading another subscription/check result
        const modelCheckout = getCheckoutUi({
            planIDs: planIDs,
            plansMap: model.plansMap,
            checkResult: checkResult,
        });

        const discount = modelCheckout.discountPercent;

        // BF25 ended, but affiliate coupon is still valid till January 2026. So we replace the text with the end of
        // year promo. During BF2026, adjust these copies as needed.

        //  return wrap( 'bag-percent', c('pass_signup_2023: Info').jt`Your ${discount}% Black Friday
        // discount has been applied`
        // );

        return wrap(
            'bag-percent',
            c('pass_signup_2023: Info').jt`Your ${discount}% End of Year discount has been applied`
        );
    }

    if (selectedPlan.Name === PLANS.DRIVE && options.checkResult.Coupon?.Code === COUPON_CODES.TRYDRIVEPLUS2024) {
        const title = selectedPlan.Title;
        const price = (
            <strong key="price">{getSimplePriceString(options.currency, checkout.withDiscountPerMonth)}</strong>
        );
        return wrap(
            'hourglass',
            c('pass_signup_2023: Info').jt`Limited time offer: ${title} for ${price} for the 1st month`
        );
    }

    if (selectedPlan.Name === PLANS.PASS_LIFETIME && !model.session?.resumedSessionResult.UID) {
        const lifetimeText = wrap(
            null,
            c('pass_lifetime_signup: Info')
                .t`Gain lifetime access to all current and future ${PASS_APP_NAME} premium features with a single one-time payment.`
        );

        return <span className="text-center">{lifetimeText}</span>;
    }

    if (!hasPlanSelector || model.upsell.mode === UpsellTypes.UPSELL || !checkout.discountPercent || isSignupTrial) {
        return null;
    }

    const passBizYearlyCycle = model.subscriptionDataCycleMapping[PLANS.PASS_BUSINESS]?.[CYCLE.YEARLY];
    if (
        audience === Audience.B2B &&
        options.cycle === CYCLE.YEARLY &&
        passBizYearlyCycle &&
        !!passBizYearlyCycle.checkResult.Coupon?.Code
    ) {
        const passBusinessCheckout = getCheckoutUi({
            planIDs: { [PLANS.PASS_BUSINESS]: 1 },
            plansMap: model.plansMap,
            checkResult: passBizYearlyCycle.checkResult,
        });
        const price = (
            <strong key="price">
                {getSimplePriceString(options.currency, passBusinessCheckout.withDiscountPerMonth)}
            </strong>
        );
        const title = model.plansMap[PLANS.PASS_BUSINESS]?.Title || '';
        // translator: full sentence is: Special launch offer: Get Pass Business for ${options.currency} per user monthly!
        const textLaunchOffer = c('pass_signup_2023: Info')
            .jt`Limited time offer: Get ${title} for ${price} per user monthly!`;
        return wrap('hourglass', textLaunchOffer);
    }

    return <DiscountBanner discountPercent={checkout.discountPercent} selectedPlanTitle={selectedPlan.Title} />;
};
