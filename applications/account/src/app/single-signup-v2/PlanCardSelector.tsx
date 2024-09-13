import type { ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon } from '@proton/components';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import { getShortPlan } from '@proton/components/containers/payments/features/plan';
import { PlanCardFeatureList } from '@proton/components/containers/payments/subscription/PlanCardFeatures';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { BRAND_NAME, CYCLE, PLANS } from '@proton/shared/lib/constants';
import type { SubscriptionCheckoutData } from '@proton/shared/lib/helpers/checkout';
import { getCheckResultFromSubscription, getCheckout } from '@proton/shared/lib/helpers/checkout';
import { getPlanFromCheckout, getPricingFromPlanIDs, getTotalFromPricing } from '@proton/shared/lib/helpers/planIDs';
import { getPlanIDs, getPlanOffer } from '@proton/shared/lib/helpers/subscription';
import type {
    Currency,
    FreePlanDefault,
    Plan,
    PlanIDs,
    PlansMap,
    Subscription,
    SubscriptionPlan,
    VPNServersCountData,
} from '@proton/shared/lib/interfaces';
import { Audience } from '@proton/shared/lib/interfaces';
import { FREE_PLAN } from '@proton/shared/lib/subscription/freePlans';
import clsx from '@proton/utils/clsx';

import ArrowImage from './ArrowImage';
import BundlePlanSubSection from './BundlePlanSubSection';
import SaveLabel from './SaveLabel';
import type { SubscriptionDataCycleMapping } from './helper';
import { getHasAnyPlusPlan, getSubscriptionMapping } from './helper';

import './PlanCardSelector.scss';

export const planCardFeatureProps = {
    odd: false,
    margin: false,
    tooltip: false,
    iconSize: 4,
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

const bundlePlans = [PLANS.BUNDLE, PLANS.BUNDLE_PRO, PLANS.BUNDLE_PRO_2024, PLANS.VISIONARY, PLANS.DUO, PLANS.FAMILY];

const PlanCardViewSlot = ({
    highlightPrice,
    selected,
    interactive = true,
    selectable = true,
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
    maxWidth = false,
}: {
    highlightPrice?: boolean;
    selected?: boolean;
    interactive?: boolean;
    selectable?: boolean;
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
    maxWidth?: boolean;
}) => {
    const wrapper = (children: ReactNode) => {
        const className = clsx(
            'card-plan overflow-hidden rounded-4xl border relative w-full h-full flex flex-column justify-start align-items-start',
            selected && 'border-primary',
            !interactive && 'bg-weak'
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
                'shrink-0 lg:flex-1 w-full pricing-box-content-cycle mx-auto lg:mx-0 max-w-custom',
                highlightPrice && 'pricing-box-content-cycle--highlighted',
                maxWidth && 'max-w-custom'
            )}
            style={maxWidth ? { '--max-w-custom': '20rem' } : undefined}
        >
            {wrapper(
                <>
                    {headerText ? (
                        <div
                            className={clsx(
                                'flex justify-center items-center text-center card-plan-highlight text-sm text-semibold px-4 w-full h-custom',
                                selected && 'card-plan-highlight--selected'
                            )}
                            style={{ '--h-custom': '1.56rem' }}
                        >
                            {headerText}
                        </div>
                    ) : (
                        <div className="w-full h-custom" style={{ '--h-custom': '1.56rem' }} />
                    )}

                    <div className="px-6 pb-6 pt-4 w-full">
                        <div className="flex items-start flex-column w-full">
                            <div className="w-full flex *:min-size-auto flex-row flex-nowrap gap-3 items-center text-ellipsis">
                                <strong className="text-2xl text-ellipsis text-left" id={`${id}-text`}>
                                    {text}
                                </strong>
                                {interactive && selectable && (
                                    <span
                                        className={clsx(
                                            'card-plan-selected-indicator flex justify-center items-center ratio-square grow-0 shrink-0 rounded-full border w-custom h-custom',
                                            selected && 'bg-primary border-primary'
                                        )}
                                        style={{ '--w-custom': '1.25rem', '--h-custom': '1.25rem' }}
                                    >
                                        {selected && (
                                            <Icon name="checkmark" className="color-primary-contrast" size={4} />
                                        )}
                                    </span>
                                )}
                            </div>

                            <div className="mt-4 mb-6 text-left w-full">
                                <div
                                    id={`${id}-price`}
                                    className={clsx(
                                        !discount && 'items-baseline',
                                        'flex gap-2 items-center justify-start'
                                    )}
                                >
                                    <span
                                        className={clsx(
                                            highlightPrice && !dark && 'color-primary',
                                            'text-bold card-plan-price'
                                        )}
                                    >
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
                {getSimplePriceString(currency, standardMonthlyPrice)}
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
    selectedPlanName,
    onSelectedClick,
    planCards,
    dark,
}: {
    subscriptionDataCycleMapping: SubscriptionDataCycleMapping;
    audience?: Audience;
    plansMap: PlansMap;
    cycle: CYCLE;
    currency: Currency;
    selectedPlanName: PLANS;
    planCards: PlanCard[];
    dark?: boolean;
    onSelect: (planIDs: PlanIDs, plan: PLANS) => void;
    onSelectedClick?: () => void;
}) => {
    const planCount = planCards.length;

    return (
        <div className="plan-card-selector-container mx-auto" data-plan-count={planCount}>
            {planCards.map((planCard) => {
                const isFreePlan = planCard.plan === PLANS.FREE;
                const planIDs = isFreePlan ? {} : { [planCard.plan]: 1 };
                const pricing = getPricingFromPlanIDs(planIDs, plansMap);
                const plan = getPlanFromCheckout(planIDs, plansMap);
                const freePlanCurrency = Object.values(plansMap)[0]?.Currency ?? plan?.Currency ?? currency;

                const planCurrency = isFreePlan ? freePlanCurrency : (plan?.Currency ?? currency);

                const planFromCard = isFreePlan ? FREE_PLAN : plansMap[planCard.plan];
                const billedText = isFreePlan
                    ? c('pass_signup_2023: Info').t`Free forever`
                    : getBilledText({ audience, cycle });
                const selected = isFreePlan && !selectedPlanName ? true : selectedPlanName === planCard.plan;

                if (!planFromCard) {
                    return null;
                }

                const offer = getPlanOffer(planFromCard);
                const highlight = planCard.type === 'best' || offer.valid;

                if (planCard.interactive === false) {
                    return (
                        <PlanCardViewSlot
                            id={planCard.plan}
                            price={getLetsTalk()}
                            billedText={c('pass_signup_2023: Info').t`Get in touch with our sales team`}
                            text={planFromCard.Title}
                            key={planCard.plan}
                            dark={dark}
                            subsection={planCard.subsection}
                            interactive={planCard.interactive}
                            maxWidth={planCount > 2}
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
                        price={getSimplePriceString(planCurrency, priceToDisplay.monthlyPrice)}
                        discount={getDiscount({
                            discountPercent: priceToDisplay.discountPercentage,
                            standardMonthlyPrice: priceToDisplay.standardMonthlyPrice,
                            currency: planCurrency,
                        })}
                        text={planFromCard.Title}
                        billedText={billedText}
                        key={planCard.plan}
                        dark={dark}
                        subsection={planCard.subsection}
                        maxWidth={planCount > 2}
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
    plan: Plan;
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
                        if (currentPlan?.Name === PLANS.PASS && plan?.Name === PLANS.VPN_PASS_BUNDLE) {
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
                            selectable={false}
                            highlightPrice={false}
                            selected={false}
                            text={currentPlan.Title || ''}
                            billedText={billedText}
                            price={getSimplePriceString(currentPlan.Currency ?? currency, totals.monthlyPrice)}
                            discount={getDiscount({
                                discountPercent: totals.discountPercent,
                                standardMonthlyPrice: totals.standardMonthlyPrice,
                                currency: currentPlan.Currency ?? currency,
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
                            price={getSimplePriceString(plan.Currency, totals.monthlyPrice)}
                            discount={getDiscount({
                                discountPercent: totals.discountPercent,
                                standardMonthlyPrice: totals.standardMonthlyPrice,
                                currency: plan.Currency,
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
