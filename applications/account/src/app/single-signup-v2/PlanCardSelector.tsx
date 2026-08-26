import type { ReactNode } from 'react';

import { c } from 'ttag';

import { SkeletonLoader } from '@proton/components';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import { getPlanTitleWithAddons } from '@proton/components/containers/payments/subscription/helpers';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import { getCheckoutUi, getOptimisticCheckout } from '@proton/payments/core/checkout';
import { CYCLE, ENTERPRISE_PLAN_TITLE, PLANS, TRIAL_DURATION_DAYS } from '@proton/payments/core/constants';
import type { Currency, PlanIDs } from '@proton/payments/core/interface';
import { getPlanFromPlanIDs } from '@proton/payments/core/plan/helpers';
import type { PlansMap } from '@proton/payments/core/plan/interface';
import { getRenewCycle } from '@proton/payments/core/renewals';
import { FREE_PLAN } from '@proton/payments/core/subscription/freePlans';
import { Audience } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import SaveLabel from './SaveLabel';
import type { SubscriptionDataCycleMapping } from './helper';
import { getSubscriptionMapping } from './helper';
import { type PlanCard, type SignupParameters2, isNonInteractivePlanCard } from './interface';

import './PlanCardSelector.scss';

export const planCardFeatureProps = {
    odd: false,
    margin: false,
    tooltip: false,
    iconSize: 4,
    className: 'text-sm gap-1',
    itemClassName: 'color-weak',
} as const;

const getRecommendedText = () => {
    return c('pass_signup_2023: Header').t`Recommended`;
};

const getLetsTalk = () => {
    return c('pass_signup_2023: Header').t`Let's talk`;
};

const getBilledText = ({
    audience,
    cycle,
    planIDs,
}: {
    audience?: Audience;
    cycle: CYCLE;
    planIDs: PlanIDs;
}): string | null => {
    if (audience === Audience.B2B) {
        switch (cycle) {
            case CYCLE.MONTHLY:
                return c('pass_signup_2023: Info').t`/month /user`;
            case CYCLE.YEARLY:
                return c('pass_signup_2023: Info').t`/month /user, billed annually`;
            case CYCLE.TWO_YEARS:
                if (getRenewCycle(planIDs, cycle) === cycle) {
                    return c('pass_signup_2023: Info').t`/month /user, billed biennially`;
                }
                return c('pass_signup_2023: Info').t`/month /user`;
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
            if (getRenewCycle(planIDs, cycle) === cycle) {
                return c('pass_signup_2023: Info').t`per month, billed every two years`;
            }

            return c('pass_signup_2023: Info').t`per month`;
        case CYCLE.FIFTEEN:
            return c('pass_signup_2023: Info').t`per month`;
        case CYCLE.THIRTY:
            return c('pass_signup_2023: Info').t`per month`;
        default:
            return null;
    }
};

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
    loading,
    subline,
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
    loading?: boolean;
    subline?: string;
}) => {
    const wrapper = (children: ReactNode) => {
        const className = clsx(
            'card-plan overflow-hidden rounded-xl md:rounded-4xl border relative w-full h-full flex flex-column justify-start align-items-start',
            selected && 'border-primary',
            !interactive && 'bg-weak'
        );

        if (onSelect) {
            return (
                <button
                    type="button"
                    className={className}
                    onClick={onSelect}
                    aria-pressed={selected}
                    disabled={loading}
                >
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
            {loading && <span className="sr-only">{c('Info').t`Loading`}</span>}
            {wrapper(
                <>
                    {headerText ? (
                        <div
                            className={clsx(
                                'flex justify-center items-center text-center card-plan-highlight text-sm text-semibold px-4 w-full md:h-custom',
                                selected && 'card-plan-highlight--selected'
                            )}
                            style={{ '--md-h-custom': '1.56rem' }}
                        >
                            {headerText}
                        </div>
                    ) : (
                        <div className="w-full md:h-custom" style={{ '--md-h-custom': '1.56rem' }} />
                    )}

                    <div className="p-3 md:px-6 md:pb-6 md:pt-4 w-full">
                        <div className="flex items-start flex-column w-full">
                            <div className="w-full flex *:min-size-auto flex-row flex-nowrap gap-2 md:gap-3 items-center text-ellipsis">
                                <strong className="text-xl md:text-2xl text-left text-wrap" id={`${id}-text`}>
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
                                        {selected && <IcCheckmark className="color-primary-contrast" size={4} />}
                                    </span>
                                )}
                            </div>

                            {subline && <div className="mt-4 text-left color-weak text-xs">{subline}</div>}

                            <div className="my-2 md:my-4 text-left w-full">
                                <div
                                    id={`${id}-price`}
                                    className={clsx(
                                        !discount && 'items-baseline',
                                        'flex gap-2 items-center justify-start',
                                        'card-plan-price-row'
                                    )}
                                >
                                    <span className="text-bold card-plan-price">
                                        {loading ? (
                                            <SkeletonLoader width="4em" index={0} />
                                        ) : (
                                            <span className={clsx(highlightPrice && !dark && 'color-primary')}>
                                                {price}
                                            </span>
                                        )}
                                    </span>
                                    <div className={clsx(!!discount && 'flex flex-column justify-center', 'text-left')}>
                                        {loading ? null : discount}
                                    </div>
                                </div>

                                <div className="text-sm">
                                    {loading ? (
                                        <SkeletonLoader width="8em" index={1} />
                                    ) : (
                                        <span className="color-weak" id={`${id}-billed`}>
                                            {billedText}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-column gap-1 w-full">{subsection}</div>

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
    loading,
    signupParameters,
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
    loading?: boolean;
    signupParameters?: SignupParameters2;
}) => {
    const planCount = planCards.length;

    return (
        <div className="plan-card-selector-container mx-auto" data-plan-count={planCount}>
            {planCards.map((planCard) => {
                const shouldDisplayTrialText = audience === Audience.B2B && signupParameters?.trial;

                const subsection = !shouldDisplayTrialText ? (
                    planCard.subsection
                ) : (
                    <>
                        <span className="color-success text-left text-sm text-bold mb-3">
                            {
                                // translator: full sentence "Try it free for 14 days"
                                c('b2b_trials_2025_Info').t`Try it free for ${TRIAL_DURATION_DAYS} days`
                            }
                        </span>
                        {planCard.subsection}
                    </>
                );

                if (isNonInteractivePlanCard(planCard)) {
                    return (
                        <PlanCardViewSlot
                            id="enterprise"
                            price={getLetsTalk()}
                            billedText={c('pass_signup_2023: Info').t`Get in touch with our sales team`}
                            text={ENTERPRISE_PLAN_TITLE}
                            subline={planCard.subline}
                            key="enterprise"
                            dark={dark}
                            subsection={subsection}
                            interactive={planCard.interactive}
                            maxWidth={planCount > 2}
                        />
                    );
                }

                const isFreePlan = planCard.plan === PLANS.FREE;
                const planIDs = isFreePlan ? {} : { [planCard.plan]: 1, ...planCard.addons };
                const plan = getPlanFromPlanIDs(plansMap, planIDs);
                const freePlanCurrency = Object.values(plansMap)[0]?.Currency ?? plan?.Currency ?? currency;

                const planCurrency = isFreePlan ? freePlanCurrency : (plan?.Currency ?? currency);

                const planFromCard = isFreePlan ? FREE_PLAN : plansMap[planCard.plan];
                const billedText = isFreePlan
                    ? c('pass_signup_2023: Info').t`Free forever`
                    : getBilledText({ audience, cycle, planIDs });
                const selected = isFreePlan && !selectedPlanName ? true : selectedPlanName === planCard.plan;

                if (!planFromCard) {
                    return null;
                }

                const highlight = planCard.type === 'best';

                const optimisticCheckout = getOptimisticCheckout({
                    planIDs,
                    plansMap,
                    cycle,
                    currency: planCurrency,
                });

                const priceToDisplay = {
                    discountPercentage: optimisticCheckout.discountPercent,
                    standardMonthlyPrice: optimisticCheckout.withoutDiscountPerMonth,
                    monthlyPrice: optimisticCheckout.withDiscountPerMonth,
                };

                const cycleMapping = getSubscriptionMapping({
                    subscriptionDataCycleMapping,
                    planIDs,
                    planName: planCard.plan,
                })?.[cycle];

                if (cycleMapping) {
                    const checkout = getCheckoutUi({
                        planIDs,
                        plansMap,
                        checkResult: cycleMapping.checkResult,
                    });
                    priceToDisplay.standardMonthlyPrice = checkout.withoutDiscountPerMonth;
                    priceToDisplay.monthlyPrice = checkout.withDiscountPerMonth;
                    priceToDisplay.discountPercentage = checkout.discountPercent;
                }

                const planTitle = getPlanTitleWithAddons({
                    planIDs,
                    plansMap,
                    cycle,
                    currency,
                    shortPlan: planFromCard,
                });

                return (
                    <PlanCardViewSlot
                        highlightPrice={highlight}
                        selected={selected}
                        id={planCard.plan}
                        headerText={(() => {
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
                        text={planTitle}
                        subline={planCard.subline}
                        billedText={billedText}
                        key={planCard.plan}
                        dark={dark}
                        subsection={subsection}
                        maxWidth={planCount > 2}
                        loading={loading}
                    />
                );
            })}
        </div>
    );
};
