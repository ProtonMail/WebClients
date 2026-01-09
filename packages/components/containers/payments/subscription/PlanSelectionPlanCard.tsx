import type { ReactElement, ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { StyleProps as PriceStyleProps } from '@proton/components/components/price/Price';
import { IcStarFilled } from '@proton/icons/icons/IcStarFilled';
import { PLANS, getIsB2BAudienceFromPlan } from '@proton/payments';
import clsx from '@proton/utils/clsx';

export type HocPrice = (props: PriceStyleProps) => ReactElement | string | string[];

interface Base {
    planName: PLANS;
    planTitle: ReactNode;
    getPrice: HocPrice;
    info: string;
    features: ReactNode;
    isCurrentPlan?: boolean;
    recommended?: boolean;
    actionLabel?: ReactNode;
    enableActionLabelSpacing?: boolean;
}

interface ActionElement {
    actionElement: ReactNode;
}

interface Action {
    action: string;
    onSelect: (planName: PLANS) => void;
    disabled?: boolean;
}

type Props = Base & Partial<ActionElement> & Partial<Action>;

const getCycleUnit = (planName: PLANS) => {
    if (planName === PLANS.FREE || planName === PLANS.PASS_LIFETIME) {
        return '';
    }

    if (getIsB2BAudienceFromPlan(planName)) {
        return c('Cycle').t`/user per month`;
    }

    return c('Cycle').t`/month`;
};

const PlanSelectionPlanCard = ({
    planName,
    planTitle,
    getPrice,
    info,
    action,
    actionLabel,
    enableActionLabelSpacing,
    onSelect,
    features,
    disabled,
    isCurrentPlan,
    recommended,
    actionElement,
}: Props) => {
    const actionButton = (() => {
        if (actionElement) {
            return actionElement;
        }
        if (onSelect && action) {
            return (
                <Button
                    color="norm"
                    onClick={() => onSelect(planName)}
                    disabled={disabled}
                    className="w-full text-nowrap"
                    aria-describedby={`desc_${planName}`}
                    data-testid={`select-${planName}`}
                >
                    {action}
                </Button>
            );
        }
        return null;
    })();

    return (
        <>
            <div
                className={clsx([
                    'border relative h-full plan-selection-plan p-6 pb-0 flex flex-column flex-nowrap',
                    isCurrentPlan && 'plan-selection-plan-current-card',
                    recommended && 'plan-selection-plan-recommended border-primary',
                ])}
                data-testid={planName}
            >
                {recommended ? (
                    <div className="plan-selection-plan-recommended-pill-container text-aligncenter flex">
                        <div className="plan-selection-plan-recommended-pill inline-flex mx-auto bg-primary py-1 px-3">
                            <IcStarFilled className="my-auto" />
                            <span className="ml-1">{c('Title').t`Recommended`}</span>
                        </div>
                    </div>
                ) : null}
                <div className="flex flex-row items-center">
                    <h2 className="h3 plan-selection-title flex text-bold mb-2 text-nowrap" id={`desc_${planName}`}>
                        {planTitle}
                    </h2>
                </div>
                <p className="text-lg plan-selection-info text-left color-weak mb-4">{info}</p>
                <div className="mb-4 flex flex-wrap items-baseline plan-selection-price">
                    {(() => {
                        return getPrice({
                            large: true,
                            suffix: getCycleUnit(planName),
                            suffixClassName: 'color-weak plan-selection-suffix text-left',
                            suffixNextLine: true,
                        });
                    })()}
                </div>

                {actionButton}
                {actionLabel || enableActionLabelSpacing ? (
                    <div className="mb-1 plan-selection-spacing">{actionLabel}</div>
                ) : null}

                <div className="flex flex-column flex-nowrap flex-auto text-wrap-balance mt-2">{features}</div>
            </div>
        </>
    );
};

export default PlanSelectionPlanCard;
