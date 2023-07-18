import { ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import {
    getDevices,
    getHideMyEmailAliases,
    getLoginsAndNotes,
} from '@proton/components/containers/payments/features/pass';
import { PlanCardFeatureList } from '@proton/components/containers/payments/subscription/PlanCardFeatures';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { ADDON_NAMES, BRAND_NAME, CYCLE, PASS_SHORT_APP_NAME, PLANS } from '@proton/shared/lib/constants';
import {
    TotalPricing,
    getPlanOffer,
    getPricingFromPlanIDs,
    getTotalFromPricing,
} from '@proton/shared/lib/helpers/subscription';
import { Currency, Plan, PlanIDs, PlansMap } from '@proton/shared/lib/interfaces';
import { FREE_PLAN } from '@proton/shared/lib/subscription/freePlans';
import clsx from '@proton/utils/clsx';

import BundlePlanSubSection from './BundlePlanSubSection';
import Guarantee from './Guarantee';
import SaveLabel from './SaveLabel';
import arrow from './arrow.svg';
import { getFreeTitle } from './helper';

import './PlanCardSelector.scss';

export const planCardFeatureProps = {
    odd: false,
    margin: false,
    iconSize: 16,
    tooltip: false,
    className: 'text-sm gap-1',
    itemClassName: 'color-weak',
} as const;

export interface PlanCard {
    plan: PLANS;
    subsection: ReactNode;
    type: 'best' | 'standard';
    guarantee: boolean;
}

const getLimitedTimeOfferText = () => {
    return c('pass_signup_2023: Header').t`Limited time offer`;
};

const getRecommendedText = () => {
    return c('pass_signup_2023: Header').t`Recommended`;
};

export const getBilledText = (cycle: CYCLE): string | null => {
    switch (cycle) {
        case CYCLE.MONTHLY:
            return c('pass_signup_2023: Info').t`per month, billed every month`;
        case CYCLE.YEARLY:
            return c('pass_signup_2023: Info').t`per month, billed annually`;
        case CYCLE.TWO_YEARS:
            return c('pass_signup_2023: Info').t`per month, billed every two years`;
        case CYCLE.FIFTEEN:
            return c('pass_signup_2023: Info').t`per month, billed every 15 months`;
        case CYCLE.THIRTY:
            return c('pass_signup_2023: Info').t`per month, billed every 30 months`;
        default:
            return null;
    }
};

const PlanCardView = ({
    above,
    cycle,
    currency,
    text,
    billedText,
    headerText,
    highlightPrice,
    totals,
    subsection,
    selected,
    guarantee,
    onSelect,
    onSelectedClick,
    upsell,
    cta,
}: {
    above?: ReactNode;
    cycle: CYCLE;
    currency: Currency;
    text: string;
    billedText: string | null;
    headerText: ReactNode;
    highlightPrice: boolean;
    totals: TotalPricing;
    subsection: ReactNode;
    selected: boolean;
    guarantee: boolean;
    onSelect?: () => void;
    onSelectedClick?: () => void;
    upsell?: ReactNode;
    cta?: ReactNode;
}) => {
    const halfBorderWidth = 1;

    return (
        <div
            className={clsx(
                'flex-item-fluid pricing-box-content-cycle max-w24e mx-auto lg:mx-0',
                highlightPrice && 'pricing-box-content-cycle--highlighted'
            )}
        >
            {above}
            <button
                type="button"
                className={clsx(
                    'card-plan rounded-4xl border relative w100',
                    selected && 'border-primary border-2',
                    !onSelect && 'cursor-default'
                )}
                onClick={!selected ? onSelect : onSelectedClick}
                aria-pressed={selected}
                style={{
                    ...(selected
                        ? {
                              top: `-${halfBorderWidth}px`,
                              /* Prevent layout shift due to border width increasing*/
                          }
                        : {}),
                }}
            >
                {headerText && (
                    <div
                        className={clsx(
                            'text-center card-highlight text-sm text-semibold py-1 px-4 rounded-full absolute',
                            selected ? 'card-highlight--selected color-invert' : 'color-primary'
                        )}
                    >
                        {headerText}
                    </div>
                )}
                <div className="py-6 px-4">
                    <div className="flex flex-align-items-center flex-column">
                        <div className="w100 flex-no-min-children flex-row flex-nowrap gap-1">
                            <strong className="text-2xl text-ellipsis flex-item-fluid text-center" id={`${cycle}-text`}>
                                {text}
                            </strong>
                        </div>

                        <div className="mt-4 mb-6 text-center w100">
                            <div
                                id={`${cycle}-price`}
                                className={clsx(
                                    totals.discountPercentage > 0 ? '' : 'flex-align-items-baseline',
                                    'flex gap-1 flex-align-items-center flex-justify-center'
                                )}
                            >
                                <span className={clsx(highlightPrice && 'color-primary', 'text-bold h1')}>
                                    {getSimplePriceString(currency, totals.totalPerMonth, '')}
                                </span>
                                <div
                                    className={clsx(
                                        totals.discountPercentage > 0 && 'flex flex-column flex-justify-center',
                                        'text-left'
                                    )}
                                >
                                    {totals.discountPercentage > 0 && (
                                        <>
                                            <span>
                                                <SaveLabel highlightPrice={true} percent={totals.discountPercentage} />
                                            </span>
                                            <span className="text-strike text-sm color-weak">
                                                {getSimplePriceString(currency, totals.totalNoDiscountPerMonth, '')}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="text-sm">
                                <div className="color-weak" id={`${cycle}-billed`}>
                                    {billedText}
                                </div>
                            </div>
                        </div>

                        <div>
                            {guarantee && (
                                <div className="text-sm mb-6 text-center" id={`${cycle}-guarantee`}>
                                    <Guarantee />
                                </div>
                            )}
                        </div>

                        {subsection}

                        {cta && <div className="mt-4">{cta}</div>}
                    </div>
                </div>
            </button>
            {selected && upsell && <div className="mt-2">{upsell}</div>}
            {
                !selected && (
                    <div style={{ height: `${halfBorderWidth * 2}px` }} />
                ) /* Prevent layout shift due to border width increasing*/
            }
        </div>
    );
};

export const PlanCardSelector = ({
    cycle,
    plansMap,
    onSelect,
    currency,
    plan,
    onSelectedClick,
    planCards,
}: {
    plansMap: PlansMap;
    cycle: CYCLE;
    currency: Currency;
    plan: PLANS | ADDON_NAMES;
    planCards: PlanCard[];
    onSelect: (planIDs: PlanIDs, plan: PLANS, upsellFrom?: PLANS) => void;
    onSelectedClick?: () => void;
}) => {
    return (
        <div className="flex flex-justify-space-between gap-4 on-tablet-flex-column">
            {planCards.map((planCard) => {
                const isFreePlan = planCard.plan === PLANS.FREE;
                const planIDs = isFreePlan ? {} : { [planCard.plan]: 1 };
                const pricing = getPricingFromPlanIDs(planIDs, plansMap);

                const totals = getTotalFromPricing(pricing, cycle);

                const planFromCard = isFreePlan ? FREE_PLAN : plansMap[planCard.plan];
                const billedText = isFreePlan ? c('pass_signup_2023: Info').t`Free forever` : getBilledText(cycle);
                const selected = isFreePlan && !plan ? true : plan === planCard.plan;

                if (!planFromCard) {
                    return null;
                }

                const offer = getPlanOffer(planFromCard);
                const highlight = planCard.type === 'best' || offer.valid;

                return (
                    <PlanCardView
                        cycle={cycle}
                        headerText={(() => {
                            if (offer.valid) {
                                return getLimitedTimeOfferText();
                            }
                            if (planCard.type === 'best') {
                                return getRecommendedText();
                            }
                        })()}
                        onSelect={() => {
                            onSelect(planIDs, planCard.plan);
                        }}
                        onSelectedClick={onSelectedClick}
                        guarantee={planCard.guarantee}
                        highlightPrice={highlight}
                        selected={selected}
                        text={planFromCard.Title}
                        billedText={billedText}
                        key={planCard.plan}
                        currency={currency}
                        totals={totals}
                        subsection={planCard.subsection}
                    />
                );
            })}
        </div>
    );
};

export const UpsellCardSelector = ({
    relativePrice,
    currentPlan,
    plan,
    plansMap,
    cycle,
    currency,
    onSelect,
    onKeep,
}: {
    relativePrice: string;
    plan: Plan | undefined;
    currentPlan: Plan | undefined;
    plansMap: PlansMap;
    cycle: CYCLE;
    currency: Currency;
    onSelect: () => void;
    onKeep: () => void;
}) => {
    if (!currentPlan) {
        return null;
    }

    const above = (hidden: boolean) => (
        <div className={clsx('text-center', hidden && 'visibility-hidden')}>
            <div className="color-weak text-semibold text-sm mb-4">
                {hidden ? '-' : c('pass_signup_2023: Info').t`You currently have`}
            </div>
        </div>
    );

    const hasUpsell = !!plan && plan.Name !== PLANS.FREE;
    const hasCurrentPlan = currentPlan;

    return (
        <>
            <div className="mb-6">
                {getBoldFormattedText(
                    c('pass_signup_2023: Info')
                        .t`For just **${relativePrice} per month** more, you get access to all of the premium ${BRAND_NAME} services!`
                )}
            </div>
            <div className="flex flex-justify-space-between gap-4 on-tablet-flex-column">
                {(() => {
                    if (!hasCurrentPlan) {
                        return null;
                    }

                    const planIDs = { [currentPlan.Name]: 1 };
                    const pricing = getPricingFromPlanIDs(planIDs, plansMap);
                    const actualTotals = getTotalFromPricing(pricing, cycle);
                    const totals = {
                        ...actualTotals,
                        discountPercentage: 0,
                        discount: 0,
                    };
                    const billedText = getBilledText(cycle);

                    const appName = getFreeTitle(PASS_SHORT_APP_NAME);

                    return (
                        <PlanCardView
                            above={above(false)}
                            cycle={cycle}
                            headerText={undefined}
                            guarantee={false}
                            highlightPrice={false}
                            selected={false}
                            text={currentPlan.Title || ''}
                            billedText={billedText}
                            currency={currency}
                            totals={totals}
                            subsection={
                                <>
                                    <div>
                                        <div className="color-weak text-semibold text-sm mb-1">
                                            {c('pass_signup_2023: Info').t`Includes basic ${appName} features:`}
                                        </div>
                                        <PlanCardFeatureList
                                            {...planCardFeatureProps}
                                            features={[getLoginsAndNotes(), getDevices(), getHideMyEmailAliases(10)]}
                                        />
                                    </div>

                                    <Button color="norm" shape="ghost" fullWidth onClick={onKeep} className="mt-6">
                                        {c('pass_signup_2023: Action').t`Keep this plan and use ${appName}`}
                                    </Button>
                                </>
                            }
                        />
                    );
                })()}

                {(() => {
                    if (!hasUpsell || !hasCurrentPlan) {
                        return null;
                    }

                    return (
                        <div>
                            <div
                                className="mx-6 mt-14 no-tablet no-mobile flex flex-column gap-4 w-custom"
                                style={{ '--w-custom': '5rem' }}
                            >
                                <img src={arrow} alt="" />
                                <div className="text-sm color-primary">
                                    {c('pass_signup_2023: Info').t`+ ${relativePrice} per month`}
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {(() => {
                    if (!plan || !hasUpsell) {
                        return null;
                    }

                    const planIDs = { [plan.Name]: 1 };
                    const pricing = getPricingFromPlanIDs(planIDs, plansMap);
                    const totals = getTotalFromPricing(pricing, cycle);
                    const billedText = getBilledText(cycle);

                    return (
                        <PlanCardView
                            above={above(true)}
                            cycle={cycle}
                            headerText={getRecommendedText()}
                            guarantee={true}
                            highlightPrice={true}
                            selected={true}
                            text={plan.Title || ''}
                            billedText={billedText}
                            currency={currency}
                            totals={totals}
                            subsection={
                                <>
                                    {[PLANS.BUNDLE, PLANS.BUNDLE_PRO].includes(plan.Name as any) && (
                                        <BundlePlanSubSection className="mb-4" />
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
