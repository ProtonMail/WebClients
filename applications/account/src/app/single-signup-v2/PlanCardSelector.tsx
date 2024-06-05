import { ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import { getShortPlan } from '@proton/components/containers/payments/features/plan';
import { PlanCardFeatureList } from '@proton/components/containers/payments/subscription/PlanCardFeatures';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { ADDON_NAMES, BRAND_NAME, CYCLE, PLANS } from '@proton/shared/lib/constants';
import {
    SubscriptionCheckoutData,
    getCheckResultFromSubscription,
    getCheckout,
} from '@proton/shared/lib/helpers/checkout';
import {
    getPlanIDs,
    getPlanOffer,
    getPricingFromPlanIDs,
    getTotalFromPricing,
} from '@proton/shared/lib/helpers/subscription';
import {
    Audience,
    Currency,
    FreePlanDefault,
    Plan,
    PlanIDs,
    PlansMap,
    Subscription,
    SubscriptionPlan,
    VPNServersCountData,
} from '@proton/shared/lib/interfaces';
import { FREE_PLAN } from '@proton/shared/lib/subscription/freePlans';
import clsx from '@proton/utils/clsx';

import ArrowImage from './ArrowImage';
import BundlePlanSubSection from './BundlePlanSubSection';
import SaveLabel from './SaveLabel';
import { SubscriptionDataCycleMapping, getHasAnyPlusPlan, getSubscriptionMapping } from './helper';

import './PlanCardSelector.scss';

export const planCardFeatureProps = {
    odd: false,
    margin: false,
    iconSize: 4,
    tooltip: false,
    className: 'text-sm gap-1',
    itemClassName: 'color-weak',
} as const;

export interface PlanCard {
    plan: PLANS;
    subsection: ReactNode;
    type: 'best' | 'standard';
    guarantee: boolean;
    interactive?: false;
}

const getLimitedTimeOfferText = () => {
    return c('pass_signup_2023: Header').t`Limited time offer`;
};

const getRecommendedText = () => {
    return c('pass_signup_2023: Header').t`Recommended`;
};

const getLetsTalk = () => {
    return c('pass_signup_2023: Header').t`Let's talk`;
};

const getPerMonth = () => {
    return c('pass_signup_2023: Info').t`per month`;
};

export const getBilledText = ({ audience, cycle }: { audience?: Audience; cycle: CYCLE }): string | null => {
    if (audience === Audience.B2B) {
        switch (cycle) {
            case CYCLE.MONTHLY:
                return c('pass_signup_2023: Info').t`/month /user`;
            case CYCLE.YEARLY:
                return c('pass_signup_2023: Info').t`/month /user, billed annually`;
            case CYCLE.TWO_YEARS:
                return c('pass_signup_2023: Info').t`/month /user, billed biennially`;
            case CYCLE.FIFTEEN:
            case CYCLE.THIRTY:
                return c('pass_signup_2023: Info').t`/month /user`;
            default:
                return null;
        }
    }
    switch (cycle) {
        case CYCLE.MONTHLY:
            return c('pass_signup_2023: Info').t`per month, billed every month`;
        case CYCLE.YEARLY:
            return c('pass_signup_2023: Info').t`per month, billed annually`;
        case CYCLE.TWO_YEARS:
            return c('pass_signup_2023: Info').t`per month, billed every two years`;
        case CYCLE.FIFTEEN:
            return c('pass_signup_2023: Info').t`per month`;
        case CYCLE.THIRTY:
            return c('pass_signup_2023: Info').t`per month`;
        default:
            return null;
    }
};

const bundlePlans = [PLANS.BUNDLE, PLANS.BUNDLE_PRO, PLANS.BUNDLE_PRO_2024, PLANS.NEW_VISIONARY, PLANS.FAMILY];

const PlanCardViewSlot = ({
    hasMaxWidth,
    highlightPrice,
    selected,
    headerText,
    text,
    subsection,
    cta,
    upsell,
    id,
    discount,
    price,
    billedText,
    dark,
    onSelect,
}: {
    hasMaxWidth?: boolean;
    highlightPrice?: boolean;
    selected?: boolean;
    headerText?: ReactNode;
    text?: ReactNode;
    subsection?: ReactNode;
    cta?: ReactNode;
    upsell?: ReactNode;
    id: string;
    discount?: ReactNode | null;
    price: ReactNode;
    billedText: ReactNode;
    dark?: boolean;
    onSelect?: () => void;
}) => {
    const wrapper = (children: ReactNode) => {
        const className = clsx(
            'card-plan rounded-4xl border relative w-full h-full flex justify-center align-items-start'
        );

        if (onSelect) {
            return (
                <button type="button" className={className} onClick={onSelect} aria-pressed={selected}>
                    {children}
                </button>
            );
        }

        return (
            <div className={className} aria-pressed={selected}>
                {children}
            </div>
        );
    };

    return (
        <div
            className={clsx(
                'shrink-0 lg:flex-1 w-full lg:w-auto pricing-box-content-cycle mx-auto lg:mx-0',
                highlightPrice && 'pricing-box-content-cycle--highlighted',
                hasMaxWidth && 'max-w-custom'
            )}
            style={hasMaxWidth ? { '--max-w-custom': '24em' } : undefined}
        >
            {wrapper(
                <>
                    {headerText && (
                        <div
                            className={clsx(
                                'text-center card-plan-highlight text-sm text-semibold py-1 px-4 rounded absolute',
                                selected && 'card-plan-highlight--selected'
                            )}
                        >
                            {headerText}
                        </div>
                    )}
                    <div className="p-6 w-full">
                        <div className="flex items-center flex-column w-full">
                            <div className="w-full flex *:min-size-auto flex-row flex-nowrap gap-1">
                                <strong className="text-2xl text-ellipsis flex-1 text-center" id={`${id}-text`}>
                                    {text}
                                </strong>
                            </div>

                            <div className="mt-4 mb-6 text-center w-full">
                                <div
                                    id={`${id}-price`}
                                    className={clsx(
                                        !discount && 'items-baseline',
                                        'flex gap-2 items-center justify-center'
                                    )}
                                >
                                    <span className={clsx(highlightPrice && !dark && 'color-primary', 'text-bold h1')}>
                                        {price}
                                    </span>
                                    <div className={clsx(!!discount && 'flex flex-column justify-center', 'text-left')}>
                                        {discount}
                                    </div>
                                </div>

                                <div className="text-sm">
                                    <div className="color-weak" id={`${id}-billed`}>
                                        {billedText}
                                    </div>
                                </div>
                            </div>

                            {subsection}

                            {cta && <div className="mt-4">{cta}</div>}
                        </div>
                    </div>
                    {selected && upsell && <div className="mt-2">{upsell}</div>}
                </>
            )}
        </div>
    );
};

const getDiscount = ({
    discountPercent,
    standardMonthlyPrice,
    currency,
}: {
    discountPercent: number;
    standardMonthlyPrice: number;
    currency: Currency;
}) => {
    return discountPercent > 0 ? (
        <>
            <span>
                <SaveLabel percent={discountPercent} />
            </span>
            <span className="text-strike text-sm color-weak">
                {getSimplePriceString(currency, standardMonthlyPrice, '')}
            </span>
        </>
    ) : null;
};

export const PlanCardSelector = ({
    subscriptionDataCycleMapping,
    audience,
    cycle,
    plansMap,
    onSelect,
    currency,
    plan,
    onSelectedClick,
    planCards,
    dark,
}: {
    subscriptionDataCycleMapping: SubscriptionDataCycleMapping;
    audience?: Audience;
    plansMap: PlansMap;
    cycle: CYCLE;
    currency: Currency;
    plan: PLANS | ADDON_NAMES;
    planCards: PlanCard[];
    dark?: boolean;
    onSelect: (planIDs: PlanIDs, plan: PLANS, upsellFrom?: PLANS) => void;
    onSelectedClick?: () => void;
}) => {
    return (
        <div className="flex justify-space-between gap-4 flex-column lg:flex-row">
            {planCards.map((planCard) => {
                const isFreePlan = planCard.plan === PLANS.FREE;
                const planIDs = isFreePlan ? {} : { [planCard.plan]: 1 };
                const pricing = getPricingFromPlanIDs(planIDs, plansMap);

                const planFromCard = isFreePlan ? FREE_PLAN : plansMap[planCard.plan];
                const billedText = isFreePlan
                    ? c('pass_signup_2023: Info').t`Free forever`
                    : getBilledText({ audience, cycle });
                const selected = isFreePlan && !plan ? true : plan === planCard.plan;

                if (!planFromCard) {
                    return null;
                }

                const offer = getPlanOffer(planFromCard);
                const highlight = planCard.type === 'best' || offer.valid;
                const hasMaxWidth = planCards.length > 2;

                if (planCard.interactive === false) {
                    return (
                        <PlanCardViewSlot
                            hasMaxWidth={hasMaxWidth}
                            id={planCard.plan}
                            price={getLetsTalk()}
                            billedText={c('pass_signup_2023: Info').t`Get in touch with our sales team`}
                            text={planFromCard.Title}
                            key={planCard.plan}
                            dark={dark}
                            subsection={planCard.subsection}
                        />
                    );
                }

                const totals = getTotalFromPricing(pricing, cycle);
                const priceToDisplay = {
                    discountPercentage: totals.discountPercentage,
                    standardMonthlyPrice: totals.totalNoDiscountPerMonth,
                    monthlyPrice: totals.totalPerMonth,
                };

                const cycleMapping = getSubscriptionMapping({
                    subscriptionDataCycleMapping,
                    planIDs,
                    planName: planCard.plan,
                })?.[cycle];

                if (cycleMapping) {
                    const checkout = getCheckout({
                        planIDs,
                        plansMap,
                        checkResult: cycleMapping.checkResult,
                    });
                    priceToDisplay.standardMonthlyPrice = checkout.withoutDiscountPerMonth;
                    priceToDisplay.monthlyPrice = checkout.withDiscountPerMonth;
                    priceToDisplay.discountPercentage = checkout.discountPercent;
                }

                return (
                    <PlanCardViewSlot
                        hasMaxWidth={hasMaxWidth}
                        highlightPrice={highlight}
                        selected={selected}
                        id={planCard.plan}
                        headerText={(() => {
                            if (offer.valid) {
                                return getLimitedTimeOfferText();
                            }
                            if (planCard.type === 'best') {
                                return getRecommendedText();
                            }
                        })()}
                        onSelect={
                            !selected
                                ? () => {
                                      onSelect(planIDs, planCard.plan);
                                  }
                                : onSelectedClick
                        }
                        price={getSimplePriceString(currency, priceToDisplay.monthlyPrice, '')}
                        discount={getDiscount({
                            discountPercent: priceToDisplay.discountPercentage,
                            standardMonthlyPrice: priceToDisplay.standardMonthlyPrice,
                            currency,
                        })}
                        text={planFromCard.Title}
                        billedText={billedText}
                        key={planCard.plan}
                        dark={dark}
                        subsection={planCard.subsection}
                    />
                );
            })}
        </div>
    );
};

export const UpsellCardSelector = ({
    audience,
    checkout,
    relativePrice,
    currentPlan,
    subscription,
    plan,
    plansMap,
    freePlan,
    cycle,
    coupon,
    currency,
    onSelect,
    onKeep,
    vpnServersCountData,
}: {
    audience?: Audience;
    checkout: SubscriptionCheckoutData;
    relativePrice: string | undefined;
    plan: Plan | undefined;
    currentPlan: SubscriptionPlan | undefined;
    subscription: Subscription | undefined;
    freePlan: FreePlanDefault;
    plansMap: PlansMap;
    cycle: CYCLE;
    currency: Currency;
    coupon?: string;
    onSelect: () => void;
    onKeep: () => void;
    vpnServersCountData: VPNServersCountData;
}) => {
    if (!currentPlan) {
        return null;
    }

    const hasUpsell = !!plan && plan.Name !== PLANS.FREE;
    const hasCurrentPlan = currentPlan;

    return (
        <>
            <div className="mb-6">
                {relativePrice &&
                    getHasAnyPlusPlan(currentPlan.Name) &&
                    (() => {
                        if (currentPlan?.Name === PLANS.PASS_PLUS && plan?.Name === PLANS.VPN_PASS_BUNDLE) {
                            return getBoldFormattedText(
                                c('pass_signup_2023: Info')
                                    .t`For just **${relativePrice} per month** more, you get access to ${BRAND_NAME}'s premium VPN service!`
                            );
                        }
                        if (currentPlan?.Name === PLANS.VPN && plan?.Name === PLANS.VPN_PASS_BUNDLE) {
                            return getBoldFormattedText(
                                c('pass_signup_2023: Info')
                                    .t`For just **${relativePrice} per month** more, you get access to ${BRAND_NAME}'s premium password manager!`
                            );
                        }
                        if (bundlePlans.includes(plan?.Name as any)) {
                            return getBoldFormattedText(
                                c('pass_signup_2023: Info')
                                    .t`For just **${relativePrice} per month** more, you get access to all of the premium ${BRAND_NAME} services!`
                            );
                        }
                    })()}
            </div>
            <div className="flex justify-space-between gap-4 flex-column lg:flex-row">
                {(() => {
                    if (!hasCurrentPlan) {
                        return null;
                    }

                    const currentPlanIDs = getPlanIDs(subscription);
                    const currentCheckout = getCheckout({
                        plansMap,
                        planIDs: currentPlanIDs,
                        checkResult: getCheckResultFromSubscription(subscription),
                    });
                    const billedText = subscription?.CouponCode
                        ? getPerMonth()
                        : getBilledText({ cycle: subscription?.Cycle || cycle, audience });

                    const shortPlan = currentPlan
                        ? getShortPlan(currentPlan.Name as any, plansMap, { vpnServers: vpnServersCountData, freePlan })
                        : undefined;

                    const totals = {
                        discountPercent: currentCheckout.discountPercent,
                        standardMonthlyPrice: currentCheckout.withoutDiscountPerMonth,
                        monthlyPrice: currentCheckout.withDiscountPerMonth,
                    };

                    return (
                        <PlanCardViewSlot
                            id={currentPlan.Name}
                            headerText={c('pass_signup_2023: Info').t`Current plan`}
                            highlightPrice={false}
                            selected={false}
                            text={currentPlan.Title || ''}
                            billedText={billedText}
                            price={getSimplePriceString(currency, totals.monthlyPrice, '')}
                            discount={getDiscount({
                                discountPercent: totals.discountPercent,
                                standardMonthlyPrice: totals.standardMonthlyPrice,
                                currency,
                            })}
                            subsection={
                                shortPlan && (
                                    <>
                                        <div>
                                            <div className="color-weak text-semibold text-sm mb-1">
                                                {c('pass_signup_2023: Info').t`Includes:`}
                                            </div>
                                            <PlanCardFeatureList
                                                {...planCardFeatureProps}
                                                features={shortPlan.features.slice(0, 3)}
                                            />
                                        </div>

                                        <Button color="norm" shape="ghost" fullWidth onClick={onKeep} className="mt-6">
                                            {c('pass_signup_2023: Action').t`Keep this plan`}
                                        </Button>
                                    </>
                                )
                            }
                        />
                    );
                })()}

                {(() => {
                    if (!hasUpsell || !hasCurrentPlan) {
                        return null;
                    }

                    return (
                        <div className="">
                            <div
                                className="mx-6 mt-14 hidden lg:flex flex-column gap-4 w-custom"
                                style={{ '--w-custom': '5rem' }}
                            >
                                <ArrowImage />

                                {relativePrice && (
                                    <div className="text-sm color-primary">
                                        {c('pass_signup_2023: Info').t`+ ${relativePrice} per month`}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })()}

                {(() => {
                    if (!plan || !hasUpsell) {
                        return null;
                    }

                    const billedText = coupon ? getPerMonth() : getBilledText({ cycle, audience });
                    const totals = {
                        discountPercent: checkout.discountPercent,
                        monthlyPrice: checkout.withDiscountPerMonth,
                        standardMonthlyPrice: checkout.withoutDiscountPerMonth,
                    };

                    return (
                        <PlanCardViewSlot
                            id={plan.Name}
                            headerText={getRecommendedText()}
                            highlightPrice={true}
                            selected={true}
                            text={plan.Title || ''}
                            billedText={billedText}
                            price={getSimplePriceString(currency, totals.monthlyPrice, '')}
                            discount={getDiscount({
                                discountPercent: totals.discountPercent,
                                standardMonthlyPrice: totals.standardMonthlyPrice,
                                currency,
                            })}
                            subsection={
                                <>
                                    {bundlePlans.includes(plan.Name as any) && (
                                        <BundlePlanSubSection
                                            className="mb-4"
                                            vpnServersCountData={vpnServersCountData}
                                        />
                                    )}
                                    <Button color="norm" fullWidth onClick={onSelect}>
                                        {c('pass_signup_2023: Action').t`Upgrade my plan`}
                                    </Button>
                                </>
                            }
                        />
                    );
                })()}
            </div>
        </>
    );
};
